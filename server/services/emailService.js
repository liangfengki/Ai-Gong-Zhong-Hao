import dotenv from 'dotenv';

dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@example.com';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || '公众号AI写作';

function parseBrevoError(body) {
  try {
    const data = JSON.parse(body);
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (typeof data.code === 'string' && data.code.trim()) {
      return data.code;
    }
  } catch {
    // Brevo can return plain text for upstream errors.
  }
  return body || 'Brevo 邮件服务返回错误';
}

export async function sendVerificationEmail(to, code) {
  if (!BREVO_API_KEY) {
    console.error('发送邮件失败: 未配置 BREVO_API_KEY，请在 server/.env 设置');
    return {
      ok: false,
      status: 500,
      code: 'BREVO_API_KEY_MISSING',
      message: '未配置 BREVO_API_KEY',
    };
  }
  if (!MAIL_FROM || MAIL_FROM === 'noreply@example.com') {
    console.error('发送邮件失败: 未配置 MAIL_FROM（需为 Brevo 后台已验证的发件人邮箱）');
    return {
      ok: false,
      status: 500,
      code: 'MAIL_FROM_MISSING',
      message: '未配置 MAIL_FROM，或发件邮箱未在 Brevo 验证',
    };
  }
  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: MAIL_FROM_NAME, email: MAIL_FROM },
        to: [{ email: to }],
        subject: '【公众号AI写作】注册验证码',
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>欢迎注册公众号AI写作平台</h2>
            <p>您的验证码是：</p>
            <h1 style="color: #1677ff; font-size: 32px; letter-spacing: 2px;">${code}</h1>
            <p>验证码有效期 10 分钟，请尽快完成注册。</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('发送邮件失败:', response.status, errorBody);
      return {
        ok: false,
        status: response.status >= 400 && response.status < 500 ? 400 : 502,
        code: 'BREVO_SEND_FAILED',
        message: `Brevo 发送失败：${parseBrevoError(errorBody)}`,
      };
    }
    return { ok: true };
  } catch (error) {
    console.error('发送邮件失败:', error.message);
    return {
      ok: false,
      status: 502,
      code: 'EMAIL_REQUEST_FAILED',
      message: '连接 Brevo 邮件服务失败',
    };
  }
}
