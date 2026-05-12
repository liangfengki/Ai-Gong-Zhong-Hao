import axios from 'axios';
import type { HotTopic, ImageAsset, ImageSearchFilter, Document, DocumentListItem, CreateDocumentRequest, UpdateDocumentRequest } from '@/types';

// 代理服务器地址（用于避免CORS问题）
const PROXY_BASE = '/api';

// ============ 热点API ============

// 获取单个平台热点
async function fetchHotBySource(source: string): Promise<HotTopic[]> {
  try {
    const { data } = await axios.get(`${PROXY_BASE}/${source}/hot`);
    return data.map((item: any, index: number) => ({
      id: `${source}-${index}`,
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
    const { data } = await axios.get(`${PROXY_BASE}/unsplash/search`, {
      params: {
        query: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        orientation: filter.orientation,
      },
    });
    
    return data.results.map((item: any) => ({
      id: `unsplash-${item.id}`,
      url: item.urls?.regular || item.url,
      thumbUrl: item.urls?.thumb || item.thumbUrl,
      alt: item.alt_description || item.description || item.alt || '',
      author: item.user?.name || item.author || 'Unknown',
      source: 'unsplash' as const,
      downloadUrl: item.links?.download || item.downloadUrl,
    }));
  } catch (error) {
    console.error('Unsplash搜索失败:', error);
    return [];
  }
}

// Pexels API
export async function searchPexels(filter: ImageSearchFilter): Promise<ImageAsset[]> {
  try {
    const { data } = await axios.get(`${PROXY_BASE}/pexels/search`, {
      params: {
        query: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        orientation: filter.orientation,
      },
    });
    
    return data.photos.map((item: any) => ({
      id: `pexels-${item.id}`,
      url: item.src?.large || item.url,
      thumbUrl: item.src?.medium || item.thumbUrl,
      alt: item.alt || item.alt_description || '',
      author: item.photographer || item.author || 'Unknown',
      source: 'pexels' as const,
      downloadUrl: item.src?.original || item.downloadUrl,
    }));
  } catch (error) {
    console.error('Pexels搜索失败:', error);
    return [];
  }
}

// Pixabay API
export async function searchPixabay(filter: ImageSearchFilter): Promise<ImageAsset[]> {
  try {
    const { data } = await axios.get(`${PROXY_BASE}/pixabay/search`, {
      params: {
        q: filter.query,
        page: filter.page,
        per_page: filter.pageSize,
        image_type: 'photo',
      },
    });
    
    return data.hits.map((item: any) => ({
      id: `pixabay-${item.id}`,
      url: item.largeImageURL || item.url,
      thumbUrl: item.previewURL || item.thumbUrl,
      alt: item.tags || item.alt || '',
      author: item.user || item.author || 'Unknown',
      source: 'pixabay' as const,
      downloadUrl: item.largeImageURL || item.downloadUrl,
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
    
    const { data } = await axios.post(`${PROXY_BASE}/ai/generate`, {
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
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    if (baseUrl) headers['x-base-url'] = baseUrl;
    if (model) headers['x-model'] = model;
    
    const response = await fetch(`${PROXY_BASE}/ai/generate/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, wordCount }),
    });
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  } catch (error) {
    console.error('AI流式生成失败:', error);
    throw error;
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
    
    const { data } = await axios.post(`${PROXY_BASE}/ai/generate-image`, {
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
  const { data } = await axios.get(`${PROXY_BASE}/documents`);
  return data;
}

export async function fetchDocument(id: string): Promise<Document> {
  const { data } = await axios.get(`${PROXY_BASE}/documents/${id}`);
  return data;
}

export async function createDocument(req: CreateDocumentRequest): Promise<Document> {
  const { data } = await axios.post(`${PROXY_BASE}/documents`, req);
  return data;
}

export async function updateDocument(req: UpdateDocumentRequest): Promise<Document> {
  const { data } = await axios.put(`${PROXY_BASE}/documents/${req.id}`, req);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await axios.delete(`${PROXY_BASE}/documents/${id}`);
}
