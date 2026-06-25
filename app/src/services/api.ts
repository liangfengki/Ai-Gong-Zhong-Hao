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
  };
  readability: {
    score: number;
    level: string;
    details: string[];
  };
  sentiment: {
    type: string;
    score: number;
    description: string;
  };
  improvements: string[];
}

// 代理服务器地址（用于避免CORS问题）
const PROXY_BASE = '/api';

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
  const [baidu, weibo, douyin, zhihu, toutiao, bilibili] = await Promise.allSettled([
    fetchBaiduHot(),
    fetchWeiboHot(),
    fetchDouyinHot(),
    fetchZhihuHot(),
    fetchToutiaoHot(),
    fetchBilibiliHot(),
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
  const [unsplash, pexels, pixabay] = await Promise.allSettled([
    searchUnsplash(filter),
    searchPexels(filter),
    searchPixabay(filter),
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
  
  return { images, sources };
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

  const response = await fetch(`${PROXY_BASE}/ai/generate/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, wordCount }),
  });

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

    const { data } = await axios.post<AIAnalysisResult>(`${PROXY_BASE}/ai/analyze-content`, {
      title,
      content,
    }, { headers });
    return data;
  } catch (error) {
    console.error('AI内容分析失败:', error);
    throw error;
  }
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
