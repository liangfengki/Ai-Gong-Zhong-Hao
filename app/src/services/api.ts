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
async function fetchHotBySource(source: string): Promise<HotTopic[]> {
  try {
    const { data } = await axios.get<HotApiResponse>(`${PROXY_BASE}/${source}/hot`);
    return (data.data || []).map((item) => ({
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
  } catch (error) {
    console.error(`获取${source}热点失败:`, error);
    return [];
  }
}

// 获取百度热搜
export async function fetchBaiduHot(): Promise<HotTopic[]> {
  return fetchHotBySource('baidu');
}

// 获取微博热搜
export async function fetchWeiboHot(): Promise<HotTopic[]> {
  return fetchHotBySource('weibo');
}

// 获取抖音热搜
export async function fetchDouyinHot(): Promise<HotTopic[]> {
  return fetchHotBySource('douyin');
}

// 获取知乎热榜
export async function fetchZhihuHot(): Promise<HotTopic[]> {
  return fetchHotBySource('zhihu');
}

// 获取今日头条热榜
export async function fetchToutiaoHot(): Promise<HotTopic[]> {
  return fetchHotBySource('toutiao');
}

// 获取哔哩哔哩热榜
export async function fetchBilibiliHot(): Promise<HotTopic[]> {
  return fetchHotBySource('bilibili');
}

// 获取所有热点
export async function fetchAllHotTopics(): Promise<HotTopic[]> {
  const [baidu, weibo, douyin, zhihu, toutiao, bilibili] = await Promise.allSettled([
    fetchBaiduHot(),
    fetchWeiboHot(),
    fetchDouyinHot(),
    fetchZhihuHot(),
    fetchToutiaoHot(),
    fetchBilibiliHot(),
  ]);
  
  const topics: HotTopic[] = [];
  if (baidu.status === 'fulfilled') topics.push(...baidu.value);
  if (weibo.status === 'fulfilled') topics.push(...weibo.value);
  if (douyin.status === 'fulfilled') topics.push(...douyin.value);
  if (zhihu.status === 'fulfilled') topics.push(...zhihu.value);
  if (toutiao.status === 'fulfilled') topics.push(...toutiao.value);
  if (bilibili.status === 'fulfilled') topics.push(...bilibili.value);
  
  return topics;
}

// ============ 图片API ============

// Unsplash API
export async function searchUnsplash(filter: ImageSearchFilter): Promise<ImageAsset[]> {
  try {
    const { data } = await axios.get<{ results: UnsplashPhoto[] }>(`${PROXY_BASE}/unsplash/search`, {
      params: {
        query: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        orientation: filter.orientation,
      },
    });
    
    return data.results.map((item) => ({
      id: `unsplash-${item.id}`,
      url: item.urls?.regular || '',
      thumbUrl: item.urls?.thumb || '',
      alt: item.alt_description || item.description || '',
      author: item.user?.name || 'Unknown',
      source: 'unsplash' as const,
      downloadUrl: item.links?.download || '',
    }));
  } catch (error) {
    console.error('Unsplash搜索失败:', error);
    return [];
  }
}

// Pexels API
export async function searchPexels(filter: ImageSearchFilter): Promise<ImageAsset[]> {
  try {
    const { data } = await axios.get<{ photos: PexelsPhoto[] }>(`${PROXY_BASE}/pexels/search`, {
      params: {
        query: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        orientation: filter.orientation,
      },
    });
    
    return data.photos.map((item) => ({
      id: `pexels-${item.id}`,
      url: item.src?.large || '',
      thumbUrl: item.src?.medium || '',
      alt: item.alt || '',
      author: item.photographer || 'Unknown',
      source: 'pexels' as const,
      downloadUrl: item.src?.original || '',
    }));
  } catch (error) {
    console.error('Pexels搜索失败:', error);
    return [];
  }
}

// Pixabay API
export async function searchPixabay(filter: ImageSearchFilter): Promise<ImageAsset[]> {
  try {
    const { data } = await axios.get<{ hits: PixabayHit[] }>(`${PROXY_BASE}/pixabay/search`, {
      params: {
        q: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        image_type: 'photo',
      },
    });
    
    return data.hits.map((item) => ({
      id: `pixabay-${item.id}`,
      url: item.largeImageURL || '',
      thumbUrl: item.previewURL || '',
      alt: item.tags || '',
      author: item.user || 'Unknown',
      source: 'pixabay' as const,
      downloadUrl: item.largeImageURL || '',
    }));
  } catch (error) {
    console.error('Pixabay搜索失败:', error);
    return [];
  }
}

// 搜索所有图片源
export async function searchAllImages(filter: ImageSearchFilter): Promise<ImageAsset[]> {
  const [unsplash, pexels, pixabay] = await Promise.allSettled([
    searchUnsplash(filter),
    searchPexels(filter),
    searchPixabay(filter),
  ]);
  
  const images: ImageAsset[] = [];
  if (unsplash.status === 'fulfilled') images.push(...unsplash.value);
  if (pexels.status === 'fulfilled') images.push(...pexels.value);
  if (pixabay.status === 'fulfilled') images.push(...pixabay.value);
  
  return images;
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
