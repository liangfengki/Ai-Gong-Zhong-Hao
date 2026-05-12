import { Router } from 'express';
import { fetchHotData, getMockData } from '../services/hotCrawler.js';
import * as cache from '../cache.js';

const router = Router();
const VALID_SOURCES = ['baidu', 'weibo', 'douyin', 'zhihu', 'toutiao', 'bilibili'];

// 通用热点获取
async function getHotSource(source, req, res) {
  if (!VALID_SOURCES.includes(source)) {
    return res.status(400).json({ error: `不支持的热点源: ${source}` });
  }

  try {
    const cached = cache.get(`hot:${source}`);
    if (cached) return res.json(cached);

    const hotData = await fetchHotData(source);
    const formattedData = hotData
      ? hotData.map((item, index) => ({
          title: item.title,
          hot: item.hot || 0,
          url: item.url || item.mobileUrl || `https://www.baidu.com/s?wd=${encodeURIComponent(item.title)}`,
          index: index + 1,
          desc: item.desc || '',
          img: item.cover || '',
          author: item.author || '',
          source,
        }))
      : getMockData(source);

    cache.set(`hot:${source}`, formattedData);
    res.json(formattedData);
  } catch (error) {
    console.error(`获取${source}热搜失败:`, error.message);
    res.json(getMockData(source));
  }
}

// 单源热点
router.get('/baidu/hot', (req, res) => getHotSource('baidu', req, res));
router.get('/weibo/hot', (req, res) => getHotSource('weibo', req, res));
router.get('/douyin/hot', (req, res) => getHotSource('douyin', req, res));
router.get('/zhihu/hot', (req, res) => getHotSource('zhihu', req, res));
router.get('/toutiao/hot', (req, res) => getHotSource('toutiao', req, res));
router.get('/bilibili/hot', (req, res) => getHotSource('bilibili', req, res));

// 所有热点并行获取
router.get('/hot/all', async (req, res) => {
  try {
    const cached = cache.get('hot:all');
    if (cached) return res.json(cached);

    const promises = VALID_SOURCES.map(source =>
      fetchHotData(source).then(data => ({ source, data: data || [] }))
    );

    const results = await Promise.allSettled(promises);
    const hotData = {};

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { source, data } = result.value;
        hotData[source] = data.map((item, index) => ({
          title: item.title,
          hot: item.hot || 0,
          url: item.url || item.mobileUrl || '',
          index: index + 1,
          desc: item.desc || '',
          source,
        }));
      }
    });

    cache.set('hot:all', hotData);
    res.json(hotData);
  } catch (error) {
    console.error('获取所有热点失败:', error.message);
    res.status(500).json({ error: '获取热点数据失败' });
  }
});

export default router;
