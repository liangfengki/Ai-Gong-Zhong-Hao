import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { sendVerificationEmail } from '../services/emailService.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  saveVerificationCode,
  consumeVerificationCode,
} from '../services/userStore.js';

const router = Router();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/register/request-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: '请提供邮箱' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: '该邮箱已注册' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await saveVerificationCode(email, code, expiresAt);

    const sent = await sendVerificationEmail(email, code);
    if (!sent) {
      return res.status(500).json({ error: '验证码发送失败，请检查邮件服务配置' });
    }

    res.json({ message: '验证码已发送' });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/register/verify', async (req, res) => {
  try {
    const { username, email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: '该邮箱已注册' });
    }

    const valid = await consumeVerificationCode(email, code);
    if (!valid) {
      return res.status(400).json({ error: '验证码无效或已过期' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await createUser({ username, email, passwordHash });
    const token = generateToken({ id: user.id, email: user.email });

    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = generateToken({ id: user.id, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请输入旧密码和新密码' });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '旧密码错误' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(req.user.id, passwordHash);

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.json({ user: req.user });
    }
    res.json({ user: { id: user.id, email: user.email, username: user.username } });
  } catch {
    res.json({ user: req.user });
  }
});

export default router;
