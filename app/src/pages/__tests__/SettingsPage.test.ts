import { describe, expect, it } from 'vitest';
import { validateAIConnectionConfig } from '@/pages/SettingsPage';
import type { UserSettings } from '@/types';

const baseSettings: UserSettings = {
  ai: {
    apiKey: '',
    model: 'agnes-2.0-flash',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    temperature: 0.7,
    maxTokens: 2000,
  },
  templates: [],
  skills: [],
  defaultWordCount: 1500,
  darkMode: false,
  followSystemTheme: false,
  favoriteTopics: [],
  aiModelMode: 'default',
};

describe('validateAIConnectionConfig', () => {
  it('allows a blank browser API key so the server env key can be tested', () => {
    expect(validateAIConnectionConfig(baseSettings)).toEqual({ ok: true });
  });

  it('allows testing when a custom API key is present', () => {
    expect(validateAIConnectionConfig({
      ...baseSettings,
      ai: { ...baseSettings.ai, apiKey: 'sk-test' },
    })).toEqual({ ok: true });
  });
});
