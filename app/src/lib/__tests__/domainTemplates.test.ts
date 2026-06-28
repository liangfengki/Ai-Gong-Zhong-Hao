import { describe, expect, it } from 'vitest';
import {
  buildDomainTemplatePrompt,
  domainTemplates,
  getDomainTemplateById,
} from '@/lib/domainTemplates';

describe('domainTemplates', () => {
  it('contains the eight analyzed WeChat writing domains', () => {
    expect(domainTemplates).toHaveLength(8);
    expect(domainTemplates.map((template) => template.name)).toEqual([
      'AI工具推荐',
      '副业搞钱',
      '自媒体运营',
      '短视频带货',
      '个人IP打造',
      '小红书涨粉',
      'AI创业项目',
      'ChatGPT赚钱',
    ]);
  });

  it('provides complete required fields and at least five formulas or examples for every domain', () => {
    for (const template of domainTemplates) {
      expect(Math.max(template.titleFormulas.length, template.exampleTitles.length)).toBeGreaterThanOrEqual(5);
      expect(template.contentStructure.length).toBeGreaterThanOrEqual(4);
      expect(template.wordCount.min).toBeGreaterThan(0);
      expect(template.wordCount.max).toBeGreaterThan(template.wordCount.min);
      expect(template.imageAdvice).toContain('张');
      expect(template.cta.trim()).not.toBe('');
    }
  });

  it('builds a complete article prompt from the selected domain', () => {
    const template = getDomainTemplateById('ai-tools');

    expect(template?.name).toBe('AI工具推荐');

    const prompt = buildDomainTemplatePrompt({
      template: template!,
      topic: '适合新媒体编辑的AI工具',
      mode: 'article',
      extraRequirement: '语气专业但轻松',
    });

    expect(prompt).toContain('适合新媒体编辑的AI工具');
    expect(prompt).toContain('面向效率敏感型读者');
    expect(prompt).toContain('标题公式');
    expect(prompt).toContain('内容结构');
    expect(prompt).toContain('配图建议');
    expect(prompt).toContain('语气专业但轻松');
    expect(prompt).toContain('生成一篇完整公众号文章');
  });

  it('supports title and outline generation modes', () => {
    const template = getDomainTemplateById('side-hustle');

    expect(buildDomainTemplatePrompt({ template: template!, topic: '下班后副业', mode: 'title' })).toContain(
      '只生成10个公众号标题'
    );
    expect(buildDomainTemplatePrompt({ template: template!, topic: '下班后副业', mode: 'outline' })).toContain(
      '只生成文章大纲'
    );
  });

  it('builds the AI startup prompt with trend, case, logic, and conclusion requirements', () => {
    const template = getDomainTemplateById('ai-startup');

    const prompt = buildDomainTemplatePrompt({
      template: template!,
      topic: 'Agent创业机会',
      mode: 'article',
    });

    expect(prompt).toContain('趋势');
    expect(prompt).toContain('案例');
    expect(prompt).toContain('逻辑');
    expect(prompt).toContain('结论');
  });

  it('builds the AI tools prompt with checklist review language', () => {
    const template = getDomainTemplateById('ai-tools');

    const prompt = buildDomainTemplatePrompt({
      template: template!,
      topic: 'AI写作工具清单',
      mode: 'article',
    });

    expect(prompt).toContain('清单');
    expect(prompt).toContain('测评');
    expect(prompt).toContain('对比表');
  });

  it('builds the side hustle prompt with project path requirements', () => {
    const template = getDomainTemplateById('side-hustle');

    const prompt = buildDomainTemplatePrompt({
      template: template!,
      topic: '普通人副业项目',
      mode: 'article',
    });

    expect(prompt).toContain('选项目');
    expect(prompt).toContain('获客');
    expect(prompt).toContain('变现');
    expect(prompt).toContain('避坑');
  });
});
