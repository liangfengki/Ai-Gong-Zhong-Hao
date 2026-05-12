import axios from 'axios';
import * as cheerio from 'cheerio';

// 多个热点API源
const HOT_API_SOURCES = [
  'https://api-hot.imsyy.top',
  'https://dailyhot.hko.app',
  'https://hot.imsyy.top'
];

// 带重试的API请求
async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 从多个源获取热点数据
export async function fetchHotData(source) {
  // 首先尝试本地 DailyHotApi
  try {
    const localApi = process.env.DAILYHOT_API || 'http://localhost:6688';
    const { data } = await axios.get(`${localApi}/${source}`, { timeout: 5000 });
    if (data.data && data.data.length > 0) {
      return data.data;
    }
  } catch {
    // 本地服务不可用，尝试远程源
  }

  // 尝试远程API源
  for (const apiBase of HOT_API_SOURCES) {
    try {
      const { data } = await fetchWithRetry(`${apiBase}/${source}`);
      if (data.code === 200 && data.data && data.data.length > 0) {
        return data.data;
      }
    } catch (error) {
      console.log(`尝试 ${apiBase}/${source} 失败: ${error.message}`);
      continue;
    }
  }

  // 如果API都失败，尝试直接爬取
  try {
    return await crawlHotData(source);
  } catch (error) {
    console.log(`爬取 ${source} 失败: ${error.message}`);
    return null;
  }
}

// 直接爬取热点数据
async function crawlHotData(source) {
  const crawlFunctions = {
    baidu: crawlBaiduHot,
    weibo: crawlWeiboHot,
    zhihu: crawlZhihuHot,
    douyin: crawlDouyinHot,
    toutiao: crawlToutiaoHot,
    bilibili: crawlBilibiliHot
  };

  if (crawlFunctions[source]) {
    return await crawlFunctions[source]();
  }
  return null;
}

// 爬取百度热搜
async function crawlBaiduHot() {
  try {
    const { data } = await axios.get('https://top.baidu.com/board?tab=realtime', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(data);
    const results = [];

    $('[class*="category-wrap"]').each((index, element) => {
      const title = $(element).find('[class*="title"]').text().trim();
      const hotText = $(element).find('[class*="hot-index"]').text().trim();
      const hot = parseInt(hotText.replace(/[^\d]/g, '')) || 0;
      const link = $(element).find('a').attr('href') || '';

      if (title && title.length > 2) {
        results.push({
          title,
          hot,
          url: link.startsWith('http') ? link : `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`,
          index: results.length + 1
        });
      }
    });

    if (results.length === 0) {
      const jsonMatch = data.match(/<!--s-data:(.*?)-->/s);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          if (jsonData.data && jsonData.data.cards) {
            jsonData.data.cards.forEach(card => {
              if (card.content) {
                card.content.forEach((item, index) => {
                  if (item.word) {
                    results.push({
                      title: item.word,
                      hot: parseInt(item.hotScore) || 0,
                      url: item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(item.word)}`,
                      index: index + 1
                    });
                  }
                });
              }
            });
          }
        } catch (e) {
          console.error('解析百度JSON数据失败:', e.message);
        }
      }
    }

    return results.slice(0, 30);
  } catch (error) {
    console.error('爬取百度热搜失败:', error.message);
    return null;
  }
}

// 爬取微博热搜
async function crawlWeiboHot() {
  try {
    const { data } = await axios.get('https://weibo.com/ajax/side/hotSearch', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (data.data && data.data.realtime) {
      return data.data.realtime.map((item, index) => ({
        title: item.note,
        hot: item.num || 0,
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.note)}`,
        index: index + 1,
        tag: item.label_name || ''
      }));
    }
    return null;
  } catch (error) {
    console.error('爬取微博热搜失败:', error.message);
    return null;
  }
}

// 爬取知乎热榜
async function crawlZhihuHot() {
  try {
    const { data } = await axios.get('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=30', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (data.data) {
      return data.data.map((item, index) => ({
        title: item.target.title,
        hot: item.detail_text ? parseInt(item.detail_text.replace(/[^\d]/g, '')) : 0,
        url: `https://www.zhihu.com/question/${item.target.id}`,
        index: index + 1,
        desc: item.target.excerpt || ''
      }));
    }
    return null;
  } catch (error) {
    console.error('爬取知乎热榜失败:', error.message);
    return null;
  }
}

// 爬取抖音热点
async function crawlDouyinHot() {
  try {
    const { data } = await axios.get('https://www.douyin.com/aweme/v1/web/hot/search/list/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.douyin.com/'
      }
    });

    if (data.data && data.data.word_list) {
      return data.data.word_list.map((item, index) => ({
        title: item.word,
        hot: item.hot_value || 0,
        url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
        index: index + 1
      }));
    }
    return null;
  } catch (error) {
    console.error('爬取抖音热点失败:', error.message);
    return null;
  }
}

// 爬取今日头条热榜
async function crawlToutiaoHot() {
  try {
    const { data } = await axios.get('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (data.data) {
      return data.data.map((item, index) => ({
        title: item.Title,
        hot: item.HotValue || 0,
        url: item.Url || '',
        index: index + 1
      }));
    }
    return null;
  } catch (error) {
    console.error('爬取头条热榜失败:', error.message);
    return null;
  }
}

// 爬取B站热榜
async function crawlBilibiliHot() {
  try {
    const { data } = await axios.get('https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (data.data && data.data.list) {
      return data.data.list.map((item, index) => ({
        title: item.title,
        hot: item.stat.view || 0,
        url: `https://www.bilibili.com/video/${item.bvid}`,
        index: index + 1,
        desc: item.desc || ''
      }));
    }
    return null;
  } catch (error) {
    console.error('爬取B站热榜失败:', error.message);
    return null;
  }
}

// 模拟数据
export function getMockData(source) {
  const mockTopics = {
    baidu: [
      { title: 'AI技术最新突破', url: 'https://www.baidu.com/s?wd=AI技术', hot: 1000000 },
      { title: '2024年科技趋势', url: 'https://www.baidu.com/s?wd=科技趋势', hot: 800000 },
      { title: '人工智能应用', url: 'https://www.baidu.com/s?wd=人工智能', hot: 600000 },
      { title: 'ChatGPT新功能', url: 'https://www.baidu.com/s?wd=ChatGPT', hot: 500000 },
      { title: '机器学习发展', url: 'https://www.baidu.com/s?wd=机器学习', hot: 400000 },
    ],
    weibo: [
      { title: '#AI改变生活#', url: 'https://s.weibo.com/weibo?q=AI改变生活', hot: 2000000 },
      { title: '#科技新闻#', url: 'https://s.weibo.com/weibo?q=科技新闻', hot: 1500000 },
      { title: '#人工智能#', url: 'https://s.weibo.com/weibo?q=人工智能', hot: 1200000 },
      { title: '#ChatGPT#', url: 'https://s.weibo.com/weibo?q=ChatGPT', hot: 1000000 },
      { title: '#深度学习#', url: 'https://s.weibo.com/weibo?q=深度学习', hot: 800000 },
    ],
    zhihu: [
      { title: '如何评价最新的AI模型？', url: 'https://www.zhihu.com/question/123', hot: 500000 },
      { title: 'AI会取代程序员吗？', url: 'https://www.zhihu.com/question/456', hot: 400000 },
      { title: 'ChatGPT有哪些实用技巧？', url: 'https://www.zhihu.com/question/789', hot: 300000 },
      { title: '机器学习入门推荐', url: 'https://www.zhihu.com/question/101', hot: 200000 },
      { title: '深度学习框架对比', url: 'https://www.zhihu.com/question/112', hot: 100000 },
    ],
    douyin: [
      { title: 'AI绘画太厉害了', url: 'https://www.douyin.com/search/AI绘画', hot: 3000000 },
      { title: 'ChatGPT实用教程', url: 'https://www.douyin.com/search/ChatGPT', hot: 2500000 },
      { title: '人工智能科普', url: 'https://www.douyin.com/search/人工智能', hot: 2000000 },
      { title: 'AI办公技巧', url: 'https://www.douyin.com/search/AI办公', hot: 1500000 },
      { title: '机器学习入门', url: 'https://www.douyin.com/search/机器学习', hot: 1000000 },
    ],
    toutiao: [
      { title: 'AI技术突破性进展', url: 'https://www.toutiao.com/article/123', hot: 800000 },
      { title: 'ChatGPT引发行业变革', url: 'https://www.toutiao.com/article/456', hot: 700000 },
      { title: '人工智能应用案例', url: 'https://www.toutiao.com/article/789', hot: 600000 },
      { title: '机器学习最新研究', url: 'https://www.toutiao.com/article/101', hot: 500000 },
      { title: '深度学习发展趋势', url: 'https://www.toutiao.com/article/112', hot: 400000 },
    ],
    bilibili: [
      { title: '【AI科普】人工智能入门', url: 'https://www.bilibili.com/video/BV123', hot: 500000 },
      { title: 'ChatGPT使用教程', url: 'https://www.bilibili.com/video/BV456', hot: 400000 },
      { title: 'AI绘画实战', url: 'https://www.bilibili.com/video/BV789', hot: 300000 },
      { title: '机器学习项目实战', url: 'https://www.bilibili.com/video/BV101', hot: 200000 },
      { title: '深度学习框架教程', url: 'https://www.bilibili.com/video/BV112', hot: 100000 },
    ]
  };

  return (mockTopics[source] || []).map((item, index) => ({
    ...item,
    index: index + 1,
    desc: ''
  }));
}
