import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getErrorMessage, useAIGeneration } from '@/hooks/useAIGeneration';

const { toastError, generateImageMock } = vi.hoisted(() => ({
  toastError: vi.fn(),
  generateImageMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    success: vi.fn(),
  },
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();
  return {
    ...actual,
    generateImage: generateImageMock,
  };
});

describe('getErrorMessage', () => {
  it('normalizes missing API key errors returned from the server', () => {
    const err = new Error(
      'AI 流式请求失败 (400): {"error":"未配置 API Key，请在设置页或 server/.env 中配置"}'
    );

    expect(getErrorMessage(err)).toBe('未配置 API Key，请在设置页配置');
  });

  it('normalizes frontend missing key guards', () => {
    expect(getErrorMessage(new Error('MISSING_API_KEY'))).toBe('未配置 API Key，请在设置页配置');
  });
});

describe('useAIGeneration', () => {
  it('allows image generation without a browser API key so the server env key can be used', async () => {
    generateImageMock.mockResolvedValueOnce('https://example.com/image.png');
    const { result } = renderHook(() => useAIGeneration());

    let imageUrl: string | null = 'initial';
    await act(async () => {
      imageUrl = await result.current.handleGenerateImage('公众号封面图');
    });

    expect(imageUrl).toBe('https://example.com/image.png');
    expect(generateImageMock).toHaveBeenCalledWith(
      '公众号封面图',
      '',
      '1024x1024',
      'https://apihub.agnes-ai.com/v1',
      'agnes-2.0-flash'
    );
    expect(toastError).not.toHaveBeenCalled();
  });
});
