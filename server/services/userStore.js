import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDatabaseAvailable, query } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');
const codesFile = path.join(dataDir, 'verification_codes.json');
const usageFile = path.join(dataDir, 'usage_logs.json');

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('写入数据文件失败:', file, error.message);
  }
}

// ============ 用户 ============

export async function findUserByEmail(email) {
  if (isDatabaseAvailable()) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }
  const users = readJson(usersFile, []);
  return users.find((u) => u.email === email) || null;
}

export async function findUserById(id) {
  if (isDatabaseAvailable()) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
  const users = readJson(usersFile, []);
  return users.find((u) => u.id === id) || null;
}

export async function createUser({ username, email, passwordHash }) {
  if (isDatabaseAvailable()) {
    const result = await query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username || null, email, passwordHash]
    );
    return result.rows[0];
  }
  const users = readJson(usersFile, []);
  const user = {
    id: randomUUID(),
    username: username || null,
    email,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(user);
  writeJson(usersFile, users);
  return user;
}

export async function updateUserPassword(id, passwordHash) {
  if (isDatabaseAvailable()) {
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, id]);
    return;
  }
  const users = readJson(usersFile, []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx].password_hash = passwordHash;
    users[idx].updated_at = new Date().toISOString();
    writeJson(usersFile, users);
  }
}

export async function listUsers({ page = 1, limit = 20 } = {}) {
  if (isDatabaseAvailable()) {
    const offset = (page - 1) * limit;
    const countResult = await query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await query(
      `SELECT u.id, u.username, u.email, u.created_at,
        (SELECT COUNT(*)::int FROM documents d WHERE d.user_id = u.id) AS document_count,
        (SELECT COUNT(*)::int FROM usage_logs g WHERE g.user_id = u.id AND g.action LIKE 'generate%') AS generation_count
       FROM users u
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { total, rows: result.rows };
  }

  const users = readJson(usersFile, []).slice().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const usage = readJson(usageFile, []);
  const total = users.length;
  const offset = (page - 1) * limit;
  const rows = users.slice(offset, offset + limit).map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    created_at: u.created_at,
    document_count: 0,
    generation_count: usage.filter((g) => g.user_id === u.id && String(g.action).startsWith('generate')).length,
  }));
  return { total, rows };
}

export async function countUsers() {
  if (isDatabaseAvailable()) {
    const result = await query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count, 10);
  }
  return readJson(usersFile, []).length;
}

export async function countNewUsers24h() {
  if (isDatabaseAvailable()) {
    const result = await query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '1 day'");
    return parseInt(result.rows[0].count, 10);
  }
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return readJson(usersFile, []).filter((u) => new Date(u.created_at).getTime() > since).length;
}

// ============ 验证码 ============

export async function saveVerificationCode(email, code, expiresAt) {
  if (isDatabaseAvailable()) {
    await query(
      'INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );
    return;
  }
  const codes = readJson(codesFile, []);
  codes.push({ email, code, expires_at: expiresAt.toISOString(), used: false, created_at: new Date().toISOString() });
  writeJson(codesFile, codes);
}

export async function consumeVerificationCode(email, code) {
  if (isDatabaseAvailable()) {
    const result = await query(
      `SELECT id FROM verification_codes
       WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );
    if (result.rows.length === 0) return false;
    await query('UPDATE verification_codes SET used = TRUE WHERE id = $1', [result.rows[0].id]);
    return true;
  }

  const codes = readJson(codesFile, []);
  const now = Date.now();
  const idx = [...codes]
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.email === email && c.code === code && !c.used && new Date(c.expires_at).getTime() > now)
    .sort((a, b) => new Date(b.c.created_at).getTime() - new Date(a.c.created_at).getTime())[0]?.i;
  if (idx === undefined) return false;
  codes[idx].used = true;
  writeJson(codesFile, codes);
  return true;
}

// ============ 使用埋点 ============

export async function recordUsage(action, user) {
  if (isDatabaseAvailable()) {
    await query(
      'INSERT INTO usage_logs (user_id, email, action) VALUES ($1, $2, $3)',
      [user?.id || null, user?.email || null, action]
    );
    return;
  }
  const logs = readJson(usageFile, []);
  logs.push({ user_id: user?.id || null, email: user?.email || null, action, created_at: new Date().toISOString() });
  writeJson(usageFile, logs);
}

export async function getUsageStats() {
  if (isDatabaseAvailable()) {
    const [genTotal, gen7d] = await Promise.all([
      query("SELECT COUNT(*) FROM usage_logs WHERE action LIKE 'generate%'"),
      query("SELECT COUNT(*) FROM usage_logs WHERE action LIKE 'generate%' AND created_at > NOW() - INTERVAL '7 days'"),
    ]);
    const byAction = await query(
      'SELECT action, COUNT(*)::int AS count FROM usage_logs GROUP BY action ORDER BY count DESC'
    );
    const dailyTrend = await query(
      `SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
       FROM usage_logs
       WHERE created_at > NOW() - INTERVAL '14 days'
       GROUP BY created_at::date
       ORDER BY created_at::date ASC`
    );
    return {
      totalGenerations: parseInt(genTotal.rows[0].count, 10),
      generations7d: parseInt(gen7d.rows[0].count, 10),
      byAction: byAction.rows,
      dailyTrend: dailyTrend.rows,
    };
  }

  const logs = readJson(usageFile, []);
  const now = Date.now();
  const isGen = (a) => String(a).startsWith('generate');
  const totalGenerations = logs.filter((l) => isGen(l.action)).length;
  const generations7d = logs.filter((l) => isGen(l.action) && new Date(l.created_at).getTime() > now - 7 * 86400000).length;

  const actionMap = new Map();
  for (const l of logs) actionMap.set(l.action, (actionMap.get(l.action) || 0) + 1);
  const byAction = [...actionMap.entries()]
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);

  const dayMap = new Map();
  const since = now - 14 * 86400000;
  for (const l of logs) {
    const t = new Date(l.created_at).getTime();
    if (t <= since) continue;
    const date = new Date(l.created_at).toISOString().slice(0, 10);
    dayMap.set(date, (dayMap.get(date) || 0) + 1);
  }
  const dailyTrend = [...dayMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { totalGenerations, generations7d, byAction, dailyTrend };
}

export async function countDocuments() {
  if (isDatabaseAvailable()) {
    const result = await query('SELECT COUNT(*) FROM documents');
    return parseInt(result.rows[0].count, 10);
  }
  return 0;
}
