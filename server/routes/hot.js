import { Router } from 'express';
import { fetchHotData, getMockData } from '../services/hotCrawler.js';
import * as cache from '../cache.js';

const router = Router();
const VALID_SOURCES = ['baidu', 'weibo', 'douyin', 'zhihu', 'toutiao', 'bilibili'];
const HOT_ALL_SOURCE_TIMEOUT_MS = 3500;

function withTimeout(promise, ms, fallback) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then(resolve)
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timer));
  });
}

function formatHotData(source, data) {
  return (data || []).map((item, index) => ({
    title: item.title,
    hot: item.hot || 0,
    url: item.url || item.mobileUrl || `https://www.baidu.com/s?wd=${encodeURIComponent(item.title)}`,
    index: index + 1,
    desc: item.desc || '',
    img: item.cover || '',
    author: item.author || '',
    source,
  }));
}

// 通用热点获取
async function getHotSource(source, req, res) {
  if (!VALID_SOURCES.includes(source)) {
    return res.status(400).json({ 
      error: `不支持的热点源: ${source}`,
      requestId: req.id,
      validSources: VALID_SOURCES,
    });
  }

  try {
    // 优先返回新鲜缓存
    const cached = cache.getWithStale(`hot:${source}`);
    if (cached && cached.fresh) {
      return res.json({ 
        data: cached.data,
        requestId: req.id,
        source,
        cached: true,
      });
    }

    // 尝试实时获取
    const hotData = await fetchHotData(source);
    const formattedData = hotData ? formatHotData(source, hotData) : null;

    if (formattedData) {
      cache.set(`hot:${source}`, formattedData);
      return res.json({ 
        data: formattedData,
        requestId: req.id,
        source,
        cached: false,
        count: formattedData.length,
      });
    }

    // 实时获取失败，使用 stale 缓存
    if (cached) {
      return res.json({
        data: cached.data,
        requestId: req.id,
        source,
        stale: true,
        error: '实时数据获取失败，显示缓存数据',
      });
    }

    // 无缓存，返回 mock 数据
    const mockData = getMockData(source);
    res.json({ 
      data: mockData,
      requestId: req.id,
      source,
      mock: true,
      error: '获取热点数据失败，显示示例数据',
    });
  } catch (error) {
    console.error(`获取${source}热搜失败:`, {
      requestId: req.id,
      source,
      error: error.message,
    });
    
    // 异常时尝试 stale 缓存
    const cached = cache.getWithStale(`hot:${source}`);
    if (cached) {
      return res.json({
        data: cached.data,
        requestId: req.id,
        source,
        stale: true,
        error: '数据获取异常，显示缓存数据',
      });
    }

    const mockData = getMockData(source);
    res.json({ 
      data: mockData,
      requestId: req.id,
      source,
      mock: true,
      error: '获取热点数据失败，显示示例数据',
    });
  }
}

// 单源热点（source 已硬编码在路径中，由 getHotSource 内部 VALID_SOURCES 校验）
router.get('/baidu/hot', (req, res) => getHotSource('baidu', req, res));
router.get('/weibo/hot', (req, res) => getHotSource('weibo', req, res));
router.get('/douyin/hot', (req, res) => getHotSource('douyin', req, res));
router.get('/zhihu/hot', (req, res) => getHotSource('zhihu', req, res));
router.get('/toutiao/hot', (req, res) => getHotSource('toutiao', req, res));
router.get('/bilibili/hot', (req, res) => getHotSource('bilibili', req, res));

// 所有热点并行获取
router.get('/hot/all', async (req, res) => {
  try {
    // 优先返回新鲜缓存
    const cached = cache.getWithStale('hot:all');
    if (cached && cached.fresh) {
      return res.json({ data: cached.data, requestId: req.id, cached: true });
    }

    const promises = VALID_SOURCES.map(source =>
      withTimeout(
        fetchHotData(source).then(data => ({ source, data: data || [] })),
        HOT_ALL_SOURCE_TIMEOUT_MS,
        { source, data: [] }
      )
    );

    const results = await Promise.allSettled(promises);
    const hotData = {};
    let hasData = false;

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { source, data } = result.value;
        if (data.length > 0) {
          hasData = true;
          hotData[source] = formatHotData(source, data);
        }
      }
    });

    if (hasData) {
      cache.set('hot:all', hotData);
      return res.json({
        data: hotData,
        requestId: req.id,
        cached: false,
      });
    }

    // 实时获取失败，使用 stale 缓存
    if (cached) {
      return res.json({
        data: cached.data,
        requestId: req.id,
        stale: true,
        error: '实时数据获取失败，显示缓存数据',
      });
    }

    // 无缓存，返回 mock
    const mockData = {};
    VALID_SOURCES.forEach(source => {
      mockData[source] = getMockData(source);
    });
    res.json({
      data: mockData,
      requestId: req.id,
      mock: true,
      error: '获取热点数据失败，显示示例数据',
    });
  } catch (error) {
    console.error('获取所有热点失败:', error.message);
    
    // 异常时尝试 stale 缓存
    const cached = cache.getWithStale('hot:all');
    if (cached) {
      return res.json({
        data: cached.data,
        requestId: req.id,
        stale: true,
        error: '数据获取异常，显示缓存数据',
      });
    }

    res.status(500).json({ error: '获取热点数据失败', requestId: req.id });
  }
});

export default router;
