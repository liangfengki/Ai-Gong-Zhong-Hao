import { Router } from 'express';
import axios from 'axios';
import { imageValidation } from '../middleware/validation.js';

const router = Router();

// 限制 per_page 范围，防止 DoS
function clampPerPage(val, defaultVal = 20, max = 50) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}

// 构建通过代理的图片 URL
function proxyUrl(rawUrl) {
  return `/api/img-proxy?url=${encodeURIComponent(rawUrl)}`;
}

// 生成 Loremflickr 图片数组（基于关键词，通过 lock 参数保证稳定结果）
function generateLoremflickrImages(query, width, height, count, page) {
  return Array.from({ length: count }, (_, i) => {
    const lock = (page - 1) * count + i;
    const rawUrl = `https://loremflickr.com/${width}/${height}/${encodeURIComponent(query)}?lock=${lock}`;
    return { rawUrl, lock };
  });
}

// Unsplash 搜索（有 API Key 走官方 API，否则用 Loremflickr 关键词搜索兜底）
router.get('/unsplash/search', imageValidation.search, async (req, res) => {
  try {
    const { query, page = 1, orientation } = req.query;
    const pp = clampPerPage(req.query.per_page);
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      const fallbackQuery = query || 'nature';
      const flickrItems = generateLoremflickrImages(fallbackQuery, 800, 600, pp, parseInt(page));
      const flickrThumbs = generateLoremflickrImages(fallbackQuery, 200, 150, pp, parseInt(page));
      const flickrDownloads = generateLoremflickrImages(fallbackQuery, 1920, 1080, pp, parseInt(page));
      const images = flickrItems.map((item, i) => ({
        id: `loremflickr-${page}-${i}`,
        urls: {
          regular: proxyUrl(item.rawUrl),
          thumb: proxyUrl(flickrThumbs[i].rawUrl),
        },
        alt_description: `${fallbackQuery} ${i + 1}`,
        user: { name: 'Lorem Flickr' },
        links: { download: proxyUrl(flickrDownloads[i].rawUrl) },
      }));
      return res.json({
        results: images,
        requestId: req.id,
        source: 'loremflickr-fallback',
      });
    }

    const { data } = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, page, per_page: pp, orientation },
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    res.json({
      ...data,
      requestId: req.id,
      source: 'unsplash',
    });
  } catch (error) {
    console.error('Unsplash搜索失败:', {
      requestId: req.id,
      error: error.message,
      query: req.query.query,
    });

    res.json({
      results: [],
      requestId: req.id,
      error: '搜索失败，请稍后重试',
    });
  }
});

// Pexels 搜索
router.get('/pexels/search', imageValidation.search, async (req, res) => {
  try {
    const { query, page = 1, orientation } = req.query;
    const pp = clampPerPage(req.query.per_page);
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      const fallbackQuery = query || 'nature';
      const flickrOriginals = generateLoremflickrImages(fallbackQuery, 1920, 1080, pp, parseInt(page));
      const flickrLarges = generateLoremflickrImages(fallbackQuery, 800, 600, pp, parseInt(page));
      const flickrMediums = generateLoremflickrImages(fallbackQuery, 200, 150, pp, parseInt(page));
      const images = flickrOriginals.map((item, i) => ({
        id: `loremflickr-pexels-${page}-${i}`,
        src: {
          original: proxyUrl(item.rawUrl),
          large: proxyUrl(flickrLarges[i].rawUrl),
          medium: proxyUrl(flickrMediums[i].rawUrl),
        },
        alt: `${fallbackQuery} ${i + 1}`,
        photographer: 'Lorem Flickr',
      }));
      return res.json({
        photos: images,
        requestId: req.id,
        source: 'loremflickr-fallback',
      });
    }

    const { data } = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, page, per_page: pp, orientation },
      headers: { Authorization: apiKey },
    });

    res.json({
      ...data,
      requestId: req.id,
      source: 'pexels',
    });
  } catch (error) {
    console.error('Pexels搜索失败:', {
      requestId: req.id,
      error: error.message,
      query: req.query.query,
    });

    res.json({
      photos: [],
      requestId: req.id,
      error: '搜索失败，请稍后重试',
    });
  }
});

// Pixabay 搜索
router.get('/pixabay/search', imageValidation.search, async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    const pp = clampPerPage(req.query.per_page);
    const apiKey = process.env.PIXABAY_API_KEY;

    if (!apiKey) {
      const fallbackQuery = q || 'nature';
      const flickrLarges = generateLoremflickrImages(fallbackQuery, 800, 600, pp, parseInt(page));
      const flickrPreviews = generateLoremflickrImages(fallbackQuery, 200, 150, pp, parseInt(page));
      const images = flickrLarges.map((item, i) => ({
        id: `loremflickr-pixabay-${page}-${i}`,
        largeImageURL: proxyUrl(item.rawUrl),
        previewURL: proxyUrl(flickrPreviews[i].rawUrl),
        tags: `${fallbackQuery} ${i + 1}`,
        user: 'Lorem Flickr',
      }));
      return res.json({
        hits: images,
        requestId: req.id,
        source: 'loremflickr-fallback',
      });
    }

    const { data } = await axios.get('https://pixabay.com/api/', {
      params: { key: apiKey, q, page, per_page: pp, image_type: 'photo' },
    });

    res.json({
      ...data,
      requestId: req.id,
      source: 'pixabay',
    });
  } catch (error) {
    console.error('Pixabay搜索失败:', {
      requestId: req.id,
      error: error.message,
      query: req.query.q,
    });

    res.json({
      hits: [],
      requestId: req.id,
      error: '搜索失败，请稍后重试',
    });
  }
});

// 图片代理 — 客户端无法直连外部 CDN 时，由服务器代为获取
router.get('/img-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '缺少 url 参数' });
    }

    // 只允许代理白名单域名（安全白名单）
    const parsed = new URL(url);
    if (!['picsum.photos', 'i.picsum.photos', 'fastly.picsum.photos', 'loremflickr.com', 'live.staticflickr.com'].includes(parsed.hostname)) {
      return res.status(403).json({ error: '不允许代理此域名' });
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WechatWriter/1.0)' },
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    });
    res.send(response.data);
  } catch (error) {
    console.error('图片代理失败:', { url: req.query.url, error: error.message });
    // 返回 1x1 透明 SVG 作为占位
    res.set({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
    res.send(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle" dy=".3em">加载失败</text></svg>'
    );
  }
});

export default router;
