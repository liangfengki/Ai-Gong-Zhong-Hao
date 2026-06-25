/**
 * 内存缓存 - 用于热点数据缓存
 * TTL: 30分钟，Stale TTL: 2小时，最大条目数: 1000，定期清理: 1分钟
 * 支持文件持久化：缓存数据写入 server/data/cache.json
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cache = new Map();
const TTL = 30 * 60 * 1000;           // 30分钟
const STALE_TTL = 2 * 60 * 60 * 1000; // 2小时（过期后额外保留时间）
const MAX_SIZE = 1000;
const CLEANUP_INTERVAL = 60 * 1000;    // 1分钟

const CACHE_DIR = join(__dirname, 'data');
const CACHE_FILE = join(CACHE_DIR, 'cache.json');

// 确保 data 目录存在
try {
  mkdirSync(CACHE_DIR, { recursive: true });
} catch {
  // 目录已存在则忽略
}

// 从文件加载缓存
function loadFromFile() {
  try {
    if (!existsSync(CACHE_FILE)) return;
    const raw = readFileSync(CACHE_FILE, 'utf-8');
    const entries = JSON.parse(raw);
    const now = Date.now();
    for (const [key, entry] of Object.entries(entries)) {
      // 只加载仍在 stale TTL 内的数据
      if (now - entry.time < STALE_TTL) {
        cache.set(key, entry);
      }
    }
  } catch {
    // 文件损坏或读取失败，忽略
  }
}

// 持久化缓存到文件
function persistToFile() {
  try {
    const obj = Object.fromEntries(cache);
    writeFileSync(CACHE_FILE, JSON.stringify(obj), 'utf-8');
  } catch {
    // 写入失败不阻塞主逻辑
  }
}

// 清理超过 stale TTL 的条目
function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.time >= STALE_TTL) {
      cache.delete(key);
    }
  }
}

// 模块初始化：加载文件缓存
loadFromFile();

// 定期清理超过 stale TTL 的条目
const cleanupTimer = setInterval(() => {
  evictExpired();
  persistToFile();
}, CLEANUP_INTERVAL);
cleanupTimer.unref();

/**
 * 获取缓存（仅返回 TTL 内的有效数据）
 * @param {string} key
 * @returns {*} data 或 null
 */
export function get(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < TTL) {
    // 刷新访问顺序（LRU）
    cache.delete(key);
    cache.set(key, entry);
    return entry.data;
  }
  // 超过 TTL 但仍在 stale 范围内时，get() 仍返回 null（与原行为一致）
  if (entry && Date.now() - entry.time < STALE_TTL) {
    return null;
  }
  cache.delete(key);
  return null;
}

/**
 * 获取缓存（支持 stale 降级）
 * @param {string} key
 * @returns {{ data: *, fresh: boolean } | null}
 *   - fresh=true: 在 TTL 内的有效数据
 *   - fresh=false: 超过 TTL 但在 stale TTL 内的降级数据
 *   - null: 数据已过期或不存在
 */
export function getWithStale(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.time;

  if (age < TTL) {
    // 在 TTL 内，刷新访问顺序（LRU）
    cache.delete(key);
    cache.set(key, entry);
    return { data: entry.data, fresh: true };
  }

  if (age < STALE_TTL) {
    // 超过 TTL 但在 stale TTL 内，返回降级数据
    return { data: entry.data, fresh: false };
  }

  // 完全过期
  cache.delete(key);
  return null;
}

export function set(key, data) {
  // 达到上限时先清理超过 stale TTL 的条目
  if (cache.size >= MAX_SIZE) {
    evictExpired();
  }
  // 如果清理后仍然满，删除最早写入的条目
  if (cache.size >= MAX_SIZE) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { data, time: Date.now() });
  persistToFile();
}

export function del(key) {
  cache.delete(key);
  persistToFile();
}

export function clear() {
  cache.clear();
  persistToFile();
}
