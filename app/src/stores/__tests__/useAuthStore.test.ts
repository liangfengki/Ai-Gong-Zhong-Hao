import { describe, expect, it } from 'vitest';
import { normalizeErrorPayload } from '../useAuthStore';

describe('normalizeErrorPayload', () => {
  it('uses nested message text instead of returning render-unsafe objects', () => {
    expect(normalizeErrorPayload({ code: 'missing_parameter', message: '缺少参数' }, '发送验证码失败'))
      .toBe('缺少参数');
  });

  it('falls back with the error code when no message is available', () => {
    expect(normalizeErrorPayload({ code: 'invalid_sender' }, '发送验证码失败'))
      .toBe('发送验证码失败（invalid_sender）');
  });
});
