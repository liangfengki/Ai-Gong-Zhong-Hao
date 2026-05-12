// 热点趋势类型
export interface HotTopic {
  id: string;
  title: string;
  url: string;
  hot: number;
  source: 'baidu' | 'weibo' | 'douyin' | 'zhihu' | 'bilibili' | 'toutiao';
  createdAt: string;
  description?: string;
  rank?: number;
}

// 文章类型
export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  tags: string[];
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published';
}

// 图片素材类型
export interface ImageAsset {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  author: string;
  source: 'unsplash' | 'pexels' | 'pixabay';
  downloadUrl: string;
}

// AI提供商预设
export interface AIProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  icon: string;
}

// AI生成配置
export interface AIConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
}

// 排版模板类型
export interface WechatTemplate {
  id: string;
  name: string;
  css: string;
  preview: string;
}

// Skill配置
export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
}

// 文章版本
export interface ArticleVersion {
  id: string;
  articleId: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

// 用户设置
export interface UserSettings {
  ai: AIConfig;
  templates: WechatTemplate[];
  skills: SkillConfig[];
  defaultWordCount: number;
  darkMode: boolean;
  followSystemTheme: boolean;
  favoriteTopics: string[];
}

// 文档类型
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentListItem = Pick<Document, 'id' | 'title' | 'updatedAt'>

export interface CreateDocumentRequest {
  title: string;
  content: string;
}

export interface UpdateDocumentRequest {
  id: string;
  title?: string;
  content?: string;
}

// API响应类型
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 热点筛选参数
export interface HotTopicFilter extends PaginationParams {
  source?: HotTopic['source'];
  keyword?: string;
}

// 图片搜索参数
export interface ImageSearchFilter extends PaginationParams {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
}
