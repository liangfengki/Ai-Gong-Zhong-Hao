import axios from 'axios';
import type { HotTopic, ImageAsset, ImageSearchFilter, Document, DocumentListItem, CreateDocumentRequest, UpdateDocumentRequest } from '@/types';

// API响应类型
interface HotTopicResponse {
  title: string;
  url?: string;
  hot?: number;
  desc?: string;
  index?: number;
}

interface HotApiResponse {
  data: HotTopicResponse[];
  requestId?: string;
  source?: string;
  cached?: boolean;
  stale?: boolean;
  mock?: boolean;
}

interface HotAllApiResponse {
  data: Partial<Record<HotTopic['source'], HotTopicResponse[]>>;
  requestId?: string;
  cached?: boolean;
  stale?: boolean;
  mock?: boolean;
}

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    thumb: string;
  };
  alt_description?: string;
  description?: string;
  user: {
    name: string;
  };
  links: {
    download: string;
  };
}

interface PexelsPhoto {
  id: string;
  src: {
    large: string;
    medium: string;
    original: string;
  };
  alt?: string;
  photographer: string;
}

interface PixabayHit {
  id: string;
  largeImageURL: string;
  previewURL: string;
  tags: string;
  user: string;
}

interface AIGenerateResponse {
  content: string;
}

interface AIImageResponse {
  url: string;
}

// AI内容分析响应类型
export interface AIAnalysisResult {
  qualityScore: number;
  seo: {
    score: number;
    suggestions: string[];
    titleSuggestion?: string;
    keywords?: string[];
    description?: string;
  };
  readability: {
    score: number;
    level: string;
    details: string[];
    paragraphStructure?: string;
    avgSentenceLength?: string;
    vocabularyDiversity?: string;
  };
  sentiment: {
    type: string;
    score: number;
    description: string;
    tendency?: string;
    intensity?: string;
  };
  improvements: string[];
}

interface RawAIAnalysisResult {
  qualityScore?: number;
  seo?: {
    score?: number;
    suggestions?: string[];
    titleSuggestion?: string;
    keywords?: string[];
    description?: string;
  };
  readability?: {
    score?: number;
    level?: string;
    details?: string[];
    paragraphStructure?: string;
    avgSentenceLength?: string;
    vocabularyDiversity?: string;
  };
  sentiment?: {
    type?: string;
    score?: number;
    description?: string;
    tendency?: string;
    intensity?: string;
  };
  improvements?: string[];
}

// 代理服务器地址（用于避免CORS问题）
const PROXY_BASE = '/api';
const HOT_SOURCE_TIMEOUT_MS = 3500;
const HOT_ALL_TIMEOUT_MS = 4500;
const IMAGE_SOURCE_TIMEOUT_MS = 4500;
const IMAGE_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const AI_STREAM_TIMEOUT_MS = 45000;
const HOT_SOURCES: HotTopic['source'][] = ['baidu', 'weibo', 'douyin', 'zhihu', 'toutiao', 'bilibili'];
const imageSearchCache = new Map<string, { data: { images: ImageAsset[]; sources: string[] }; expiresAt: number }>();

export function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return {};
    const token = JSON.parse(raw)?.state?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

// 请求拦截器：自动附加认证 token
axios.interceptors.request.use((config) => {
  try {
    config.headers = config.headers || {};
    // 已显式指定 Authorization（如管理后台）时不覆盖
    if (config.headers.Authorization) {
      return config;
    }
    Object.assign(config.headers, getAuthHeaders());
  } catch {
    // 忽略解析错误
  }
  return config;
});

// 响应拦截器：401 时清除登录态并跳转登录页
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url || '';
    // 管理后台有独立鉴权，跳过全局 401 处理
    if (error.response?.status === 401 && !url.includes('/admin')) {
      try {
        localStorage.removeItem('auth-storage');
      } catch {
        // 忽略
      }
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && path !== '/admin-ki') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ 热点API ============

// 简单的哈希函数，用于生成稳定的 ID
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// 获取单个平台热点
async function fetchHotBySource(source: string): Promise<{ topics: HotTopic[]; stale?: boolean; mock?: boolean }> {
  try {
    const { data } = await axios.get<HotApiResponse>(`${PROXY_BASE}/${source}/hot`);
    const topics = (data.data || []).map((item, index) => ({
      // 使用标题哈希生成稳定 ID，避免 index 变化导致收藏失效
      id: `${source}-${hashString(item.title)}`,
      title: item.title,
      url: item.url || '',
      hot: item.hot || 0,
      source: source as HotTopic['source'],
      createdAt: new Date().toISOString(),
      description: item.desc || '',
      rank: item.index || index + 1,
    }));
    return { topics, stale: data.stale, mock: data.mock };
  } catch (error) {
    console.error(`获取${source}热点失败:`, error);
    return { topics: [] };
  }
}

function mapHotItems(source: HotTopic['source'], items: HotTopicResponse[]): HotTopic[] {
  return (items || []).map((item, index) => ({
    id: `${source}-${hashString(item.title)}`,
    title: item.title,
    url: item.url || '',
    hot: item.hot || 0,
    source,
    createdAt: new Date().toISOString(),
    description: item.desc || '',
    rank: item.index || index + 1,
  }));
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => window.clearTimeout(timeoutId));
  });
}

async function fetchHotAllFromAggregate(): Promise<{ topics: HotTopic[]; stale: boolean; mock: boolean }> {
  const { data } = await axios.get<HotAllApiResponse>(`${PROXY_BASE}/hot/all`);
  const topics = HOT_SOURCES.flatMap((source) => mapHotItems(source, data.data?.[source] || []));

  return {
    topics,
    stale: Boolean(data.stale),
    mock: Boolean(data.mock) || topics.length === 0,
  };
}

// 获取百度热搜
export async function fetchBaiduHot() {
  return fetchHotBySource('baidu');
}

// 获取微博热搜
export async function fetchWeiboHot() {
  return fetchHotBySource('weibo');
}

// 获取抖音热搜
export async function fetchDouyinHot() {
  return fetchHotBySource('douyin');
}

// 获取知乎热榜
export async function fetchZhihuHot() {
  return fetchHotBySource('zhihu');
}

// 获取今日头条热榜
export async function fetchToutiaoHot() {
  return fetchHotBySource('toutiao');
}

// 获取哔哩哔哩热榜
export async function fetchBilibiliHot() {
  return fetchHotBySource('bilibili');
}

// 获取所有热点
export async function fetchAllHotTopics(): Promise<{ topics: HotTopic[]; stale: boolean; mock: boolean }> {
  const aggregate = await withTimeout(
    fetchHotAllFromAggregate(),
    HOT_ALL_TIMEOUT_MS,
    { topics: [], stale: false, mock: true }
  );

  if (aggregate.topics.length > 0) {
    return aggregate;
  }

  const [baidu, weibo, douyin, zhihu, toutiao, bilibili] = await Promise.allSettled([
    withTimeout(fetchBaiduHot(), HOT_SOURCE_TIMEOUT_MS, { topics: [] }),
    withTimeout(fetchWeiboHot(), HOT_SOURCE_TIMEOUT_MS, { topics: [] }),
    withTimeout(fetchDouyinHot(), HOT_SOURCE_TIMEOUT_MS, { topics: [] }),
    withTimeout(fetchZhihuHot(), HOT_SOURCE_TIMEOUT_MS, { topics: [] }),
    withTimeout(fetchToutiaoHot(), HOT_SOURCE_TIMEOUT_MS, { topics: [] }),
    withTimeout(fetchBilibiliHot(), HOT_SOURCE_TIMEOUT_MS, { topics: [] }),
  ]);
  
  const topics: HotTopic[] = [];
  let stale = false;
  let allMock = true;
  let hasData = false;

  const results = [baidu, weibo, douyin, zhihu, toutiao, bilibili];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      topics.push(...result.value.topics);
      if (result.value.stale) stale = true;
      if (!result.value.mock) allMock = false;
      if (result.value.topics.length > 0) hasData = true;
    }
  }

  return { topics, stale, mock: allMock && hasData || (!hasData) };
}

// ============ 图片API ============

// Unsplash API
export async function searchUnsplash(filter: ImageSearchFilter): Promise<{ images: ImageAsset[]; source?: string }> {
  try {
    const { data } = await axios.get<{ results: UnsplashPhoto[]; source?: string }>(`${PROXY_BASE}/unsplash/search`, {
      params: {
        query: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        orientation: filter.orientation,
      },
    });
    
    const images = data.results.map((item) => ({
      id: `unsplash-${item.id}`,
      url: item.urls?.regular || '',
      thumbUrl: item.urls?.thumb || '',
      alt: item.alt_description || item.description || '',
      author: item.user?.name || 'Unknown',
      source: 'unsplash' as const,
      downloadUrl: item.links?.download || '',
    }));
    return { images, source: data.source };
  } catch (error) {
    console.error('Unsplash搜索失败:', error);
    return { images: [] };
  }
}

// Pexels API
export async function searchPexels(filter: ImageSearchFilter): Promise<{ images: ImageAsset[]; source?: string }> {
  try {
    const { data } = await axios.get<{ photos: PexelsPhoto[]; source?: string }>(`${PROXY_BASE}/pexels/search`, {
      params: {
        query: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        orientation: filter.orientation,
      },
    });
    
    const images = data.photos.map((item) => ({
      id: `pexels-${item.id}`,
      url: item.src?.large || '',
      thumbUrl: item.src?.medium || '',
      alt: item.alt || '',
      author: item.photographer || 'Unknown',
      source: 'pexels' as const,
      downloadUrl: item.src?.original || '',
    }));
    return { images, source: data.source };
  } catch (error) {
    console.error('Pexels搜索失败:', error);
    return { images: [] };
  }
}

// Pixabay API
export async function searchPixabay(filter: ImageSearchFilter): Promise<{ images: ImageAsset[]; source?: string }> {
  try {
    const { data } = await axios.get<{ hits: PixabayHit[]; source?: string }>(`${PROXY_BASE}/pixabay/search`, {
      params: {
        q: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        image_type: 'photo',
      },
    });
    
    const images = data.hits.map((item) => ({
      id: `pixabay-${item.id}`,
      url: item.largeImageURL || '',
      thumbUrl: item.previewURL || '',
      alt: item.tags || '',
      author: item.user || 'Unknown',
      source: 'pixabay' as const,
      downloadUrl: item.largeImageURL || '',
    }));
    return { images, source: data.source };
  } catch (error) {
    console.error('Pixabay搜索失败:', error);
    return { images: [] };
  }
}

// 搜索所有图片源
export async function searchAllImages(filter: ImageSearchFilter): Promise<{ images: ImageAsset[]; sources: string[] }> {
  const cacheKey = JSON.stringify({
    query: filter.query.trim(),
    page: filter.page,
    pageSize: filter.pageSize,
    orientation: filter.orientation || 'all',
  });
  const cached = imageSearchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const [unsplash, pexels, pixabay] = await Promise.allSettled([
    withTimeout(searchUnsplash(filter), IMAGE_SOURCE_TIMEOUT_MS, { images: [] }),
    withTimeout(searchPexels(filter), IMAGE_SOURCE_TIMEOUT_MS, { images: [] }),
    withTimeout(searchPixabay(filter), IMAGE_SOURCE_TIMEOUT_MS, { images: [] }),
  ]);
  
  const images: ImageAsset[] = [];
  const sources: string[] = [];
  if (unsplash.status === 'fulfilled') {
    images.push(...unsplash.value.images);
    if (unsplash.value.source) sources.push(unsplash.value.source);
  }
  if (pexels.status === 'fulfilled') {
    images.push(...pexels.value.images);
    if (pexels.value.source) sources.push(pexels.value.source);
  }
  if (pixabay.status === 'fulfilled') {
    images.push(...pixabay.value.images);
    if (pixabay.value.source) sources.push(pixabay.value.source);
  }
  
  const result = { images, sources };
  imageSearchCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + IMAGE_SEARCH_CACHE_TTL_MS,
  });

  return result;
}

// ============ AI API ============

// AI生成文章
export async function generateArticle(
  prompt: string,
  wordCount: number,
  apiKey: string,
  model: string = 'deepseek-chat',
  baseUrl?: string
): Promise<string> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    if (baseUrl) headers['x-base-url'] = baseUrl;
    if (model) headers['x-model'] = model;
    
    const { data } = await axios.post<AIGenerateResponse>(`${PROXY_BASE}/ai/generate`, {
      prompt,
      wordCount,
    }, { headers });
    return data.content;
  } catch (error) {
    console.error('AI生成失败:', error);
    throw error;
  }
}

// AI流式生成
export async function generateArticleStream(
  prompt: string,
  wordCount: number,
  apiKey: string,
  model: string = 'deepseek-chat',
  onChunk: (chunk: string) => void,
  baseUrl?: string
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  if (baseUrl) headers['x-base-url'] = baseUrl;
  if (model) headers['x-model'] = model;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AI_STREAM_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${PROXY_BASE}/ai/generate/stream`, {
      method: 'POST',
      headers: { ...headers, ...getAuthHeaders() },
      body: JSON.stringify({ prompt, wordCount }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI 流式请求超时，请稍后重试');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`AI 流式请求失败 (${response.status}): ${errBody}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    // Parse SSE lines: each line starts with "data: "
    const lines = buffer.split('\n');
    // Keep incomplete last line in buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue; // skip empty lines and comments
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || parsed.content || '';
          if (content) onChunk(content);
        } catch {
          // If not JSON, treat as plain text chunk
          if (data) onChunk(data);
        }
      }
    }
  }
}

// AI生成图片
export async function generateImage(
  prompt: string,
  apiKey: string,
  size: string = '1024x1024',
  baseUrl?: string,
  model?: string
): Promise<string> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    if (baseUrl) headers['x-base-url'] = baseUrl;
    if (model) headers['x-model'] = model;
    
    const { data } = await axios.post<AIImageResponse>(`${PROXY_BASE}/ai/generate-image`, {
      prompt,
      size,
    }, { headers });
    return data.url;
  } catch (error) {
    console.error('AI图片生成失败:', error);
    throw error;
  }
}

// AI内容分析
export async function analyzeContent(
  title: string,
  content: string,
  apiKey: string,
  model: string = 'deepseek-chat',
  baseUrl?: string
): Promise<AIAnalysisResult> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    if (baseUrl) headers['x-base-url'] = baseUrl;
    if (model) headers['x-model'] = model;

    const { data } = await axios.post<RawAIAnalysisResult>(`${PROXY_BASE}/ai/analyze-content`, {
      title,
      content,
    }, { headers });
    return normalizeAnalysisResult(data);
  } catch (error) {
    console.error('AI内容分析失败:', error);
    throw error;
  }
}

function clampScore(score: unknown): number {
  const n = typeof score === 'number' ? score : Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function normalizeSentimentType(tendency?: string, type?: string) {
  const value = (type || tendency || 'neutral').toLowerCase();
  if (value.includes('积极') || value === 'positive') return 'positive';
  if (value.includes('消极') || value === 'negative') return 'negative';
  return 'neutral';
}

function normalizeAnalysisResult(data: RawAIAnalysisResult): AIAnalysisResult {
  const seoSuggestions = data.seo?.suggestions?.length
    ? data.seo.suggestions
    : [
        data.seo?.titleSuggestion && `标题建议：${data.seo.titleSuggestion}`,
        data.seo?.keywords?.length && `推荐关键词：${data.seo.keywords.join('、')}`,
        data.seo?.description && `摘要建议：${data.seo.description}`,
      ].filter((item): item is string => Boolean(item));

  const readabilityDetails = data.readability?.details?.length
    ? data.readability.details
    : [
        data.readability?.paragraphStructure && `段落结构：${data.readability.paragraphStructure}`,
        data.readability?.avgSentenceLength && `句子长度：${data.readability.avgSentenceLength}`,
        data.readability?.vocabularyDiversity && `词汇多样性：${data.readability.vocabularyDiversity}`,
      ].filter((item): item is string => Boolean(item));

  const sentimentType = normalizeSentimentType(data.sentiment?.tendency, data.sentiment?.type);
  const sentimentScore =
    data.sentiment?.score !== undefined
      ? clampScore(data.sentiment.score)
      : data.sentiment?.intensity === '强'
        ? 85
        : data.sentiment?.intensity === '弱'
          ? 45
          : 65;

  return {
    qualityScore: clampScore(data.qualityScore),
    seo: {
      score: clampScore(data.seo?.score),
      suggestions: seoSuggestions,
      titleSuggestion: data.seo?.titleSuggestion,
      keywords: data.seo?.keywords ?? [],
      description: data.seo?.description,
    },
    readability: {
      score: clampScore(data.readability?.score),
      level: data.readability?.level || data.readability?.avgSentenceLength || '未知',
      details: readabilityDetails,
      paragraphStructure: data.readability?.paragraphStructure,
      avgSentenceLength: data.readability?.avgSentenceLength,
      vocabularyDiversity: data.readability?.vocabularyDiversity,
    },
    sentiment: {
      type: sentimentType,
      score: sentimentScore,
      description: data.sentiment?.description || data.sentiment?.tendency || '暂无情感分析说明',
      tendency: data.sentiment?.tendency,
      intensity: data.sentiment?.intensity,
    },
    improvements: data.improvements ?? [],
  };
}

// AI生成视频
export async function generateVideo(
  prompt: string,
  apiKey: string,
  baseUrl?: string,
  image?: string
): Promise<string> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    if (baseUrl) headers['x-base-url'] = baseUrl;

    const body: Record<string, unknown> = { prompt };
    if (image) body.image = image;

    const { data } = await axios.post<{ url: string }>(`${PROXY_BASE}/ai/generate-video`, body, { headers });
    return data.url;
  } catch (error) {
    console.error('AI视频生成失败:', error);
    throw error;
  }
}

// ============ 文档API ============

export async function fetchDocumentList(): Promise<DocumentListItem[]> {
  const { data } = await axios.get<DocumentListItem[] | { items: DocumentListItem[] }>(`${PROXY_BASE}/documents`);
  // Server returns paginated response: { items, total, page, limit, totalPages }
  // Handle both formats for backward compatibility
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

export async function fetchDocument(id: string): Promise<Document> {
  const { data } = await axios.get<Document>(`${PROXY_BASE}/documents/${id}`);
  return data;
}

export async function createDocument(req: CreateDocumentRequest): Promise<Document> {
  const { data } = await axios.post<Document>(`${PROXY_BASE}/documents`, req);
  return data;
}

export async function updateDocument(req: UpdateDocumentRequest): Promise<Document> {
  const { data } = await axios.put<Document>(`${PROXY_BASE}/documents/${req.id}`, req);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await axios.delete(`${PROXY_BASE}/documents/${id}`);
}

// ============ 数据迁移 ============

export async function migrateLocalArticles(
  articles: Array<{ title: string; content: string }>
): Promise<{ migrated: number; failed: number }> {
  let migrated = 0;
  let failed = 0;
  for (const article of articles) {
    try {
      await createDocument({
        title: article.title || '无标题',
        content: article.content || '',
      });
      migrated++;
    } catch (error) {
      console.error('迁移文章失败:', error);
      failed++;
    }
  }
  return { migrated, failed };
}
