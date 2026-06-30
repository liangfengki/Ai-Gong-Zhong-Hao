import axios from 'axios';
import * as cheerio from 'cheerio';

// 多个热点API源
const HOT_API_SOURCES = [
  'https://api-hot.imsyy.top',
  'https://dailyhot.hko.app',
  'https://hot.imsyy.top',
  'https://hot-api.mcloc.cn',
  'https://dailyhot-api.626110.xyz',
];

// 通用请求头
const commonHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
};

// 带短超时的API请求，避免 Serverless 函数被不稳定上游长时间拖住
async function fetchWithRetry(url, retries = 1, timeout = 2500) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
}

// 从多个源获取热点数据
export async function fetchHotData(source) {
  // 首先尝试本地 DailyHotApi（仅在非生产环境尝试）
  if (process.env.NODE_ENV !== 'production') {
    try {
      const localApi = process.env.DAILYHOT_API || 'http://localhost:6688';
      const { data } = await axios.get(`${localApi}/${source}`, { timeout: 1500 });
      if (data.data && data.data.length > 0) {
        return data.data;
      }
    } catch {
      // 本地服务不可用，尝试远程源
    }
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
      timeout: 3000,
      headers: { ...commonHeaders }
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
      timeout: 3000,
      headers: { ...commonHeaders }
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
      timeout: 3000,
      headers: { ...commonHeaders }
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
      timeout: 3000,
      headers: {
        ...commonHeaders,
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
      timeout: 3000,
      headers: { ...commonHeaders }
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
      timeout: 3000,
      headers: { ...commonHeaders }
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
      { title: '2026年AI Agent全面落地', url: 'https://www.baidu.com/s?wd=AI+Agent落地', hot: 1200000 },
      { title: '量子计算机商用突破', url: 'https://www.baidu.com/s?wd=量子计算机商用', hot: 980000 },
      { title: '固态电池量产时代来临', url: 'https://www.baidu.com/s?wd=固态电池量产', hot: 870000 },
      { title: 'SpaceX火星基地建设计划', url: 'https://www.baidu.com/s?wd=SpaceX火星基地', hot: 760000 },
      { title: '脑机接口临床试验成功', url: 'https://www.baidu.com/s?wd=脑机接口临床', hot: 650000 },
      { title: '国产大模型性能再创新高', url: 'https://www.baidu.com/s?wd=国产大模型', hot: 540000 },
      { title: '无人驾驶出租车全国普及', url: 'https://www.baidu.com/s?wd=无人驾驶出租车', hot: 430000 },
      { title: '可控核聚变发电里程碑', url: 'https://www.baidu.com/s?wd=可控核聚变', hot: 320000 },
    ],
    weibo: [
      { title: '#AI数字员工大规模上岗#', url: 'https://s.weibo.com/weibo?q=AI数字员工', hot: 2800000 },
      { title: '#2026新能源车销量暴涨#', url: 'https://s.weibo.com/weibo?q=新能源车销量', hot: 2200000 },
      { title: '#量子计算改变密码学#', url: 'https://s.weibo.com/weibo?q=量子计算密码学', hot: 1800000 },
      { title: '#太空旅行价格大降#', url: 'https://s.weibo.com/weibo?q=太空旅行', hot: 1500000 },
      { title: '#AI医生诊断准确率超人类#', url: 'https://s.weibo.com/weibo?q=AI医生', hot: 1200000 },
      { title: '#脑机接口让瘫痪者行走#', url: 'https://s.weibo.com/weibo?q=脑机接口行走', hot: 980000 },
      { title: '#固态电池充电5分钟续航千里#', url: 'https://s.weibo.com/weibo?q=固态电池', hot: 850000 },
      { title: '#全球首个AI市长上任#', url: 'https://s.weibo.com/weibo?q=AI市长', hot: 720000 },
    ],
    zhihu: [
      { title: '如何看待2026年AI Agent取代传统SaaS？', url: 'https://www.zhihu.com/question/6001', hot: 580000 },
      { title: '量子计算机破解RSA加密是真的吗？', url: 'https://www.zhihu.com/question/6002', hot: 470000 },
      { title: '固态电池和液态电池到底差多少？', url: 'https://www.zhihu.com/question/6003', hot: 390000 },
      { title: '脑机接口技术伦理问题如何解决？', url: 'https://www.zhihu.com/question/6004', hot: 310000 },
      { title: '2026年还有哪些行业没被AI颠覆？', url: 'https://www.zhihu.com/question/6005', hot: 260000 },
      { title: '可控核聚变距离商用还有多远？', url: 'https://www.zhihu.com/question/6006', hot: 210000 },
      { title: '无人驾驶事故责任如何界定？', url: 'https://www.zhihu.com/question/6007', hot: 180000 },
      { title: '太空旅游值不值得花这个钱？', url: 'https://www.zhihu.com/question/6008', hot: 150000 },
    ],
    douyin: [
      { title: 'AI数字人直播带货太疯狂了', url: 'https://www.douyin.com/search/AI数字人直播', hot: 3500000 },
      { title: '固态电池汽车实测续航', url: 'https://www.douyin.com/search/固态电池汽车', hot: 2900000 },
      { title: '量子计算机到底有多快', url: 'https://www.douyin.com/search/量子计算机', hot: 2400000 },
      { title: '脑机接口体验vlog', url: 'https://www.douyin.com/search/脑机接口体验', hot: 1900000 },
      { title: '无人驾驶出租车日常', url: 'https://www.douyin.com/search/无人驾驶出租车', hot: 1600000 },
      { title: 'AI绘画2026进化史', url: 'https://www.douyin.com/search/AI绘画进化', hot: 1300000 },
      { title: '太空旅行实拍vlog', url: 'https://www.douyin.com/search/太空旅行实拍', hot: 1100000 },
      { title: '可控核聚变科普动画', url: 'https://www.douyin.com/search/可控核聚变科普', hot: 900000 },
    ],
    toutiao: [
      { title: '2026年AI Agent市场规模突破万亿', url: 'https://www.toutiao.com/article/6001', hot: 950000 },
      { title: '量子计算商用化进入倒计时', url: 'https://www.toutiao.com/article/6002', hot: 820000 },
      { title: '固态电池革命：充电速度提升10倍', url: 'https://www.toutiao.com/article/6003', hot: 710000 },
      { title: 'SpaceX火星基地首批居民选定', url: 'https://www.toutiao.com/article/6004', hot: 630000 },
      { title: '脑机接口让失明者重见光明', url: 'https://www.toutiao.com/article/6005', hot: 540000 },
      { title: '国产AI芯片性能追平国际巨头', url: 'https://www.toutiao.com/article/6006', hot: 460000 },
      { title: '无人驾驶物流车覆盖全国高速', url: 'https://www.toutiao.com/article/6007', hot: 380000 },
      { title: '健康科技：AI早筛癌症准确率达99%', url: 'https://www.toutiao.com/article/6008', hot: 300000 },
    ],
    bilibili: [
      { title: '【深度解析】2026年AI Agent如何改变工作方式', url: 'https://www.bilibili.com/video/BV601', hot: 620000 },
      { title: '量子计算机上手体验：快到离谱', url: 'https://www.bilibili.com/video/BV602', hot: 510000 },
      { title: '固态电池汽车vs燃油车终极对决', url: 'https://www.bilibili.com/video/BV603', hot: 430000 },
      { title: '脑机接口实测：用意念玩游戏', url: 'https://www.bilibili.com/video/BV604', hot: 370000 },
      { title: '无人驾驶出租车乘坐全纪录', url: 'https://www.bilibili.com/video/BV605', hot: 310000 },
      { title: 'AI音乐创作：一首歌只需10秒', url: 'https://www.bilibili.com/video/BV606', hot: 260000 },
      { title: '太空旅行2026：普通人也能去太空', url: 'https://www.bilibili.com/video/BV607', hot: 210000 },
      { title: '可控核聚变科普：能源革命来了', url: 'https://www.bilibili.com/video/BV608', hot: 170000 },
    ]
  };

  return (mockTopics[source] || []).map((item, index) => ({
    ...item,
    index: index + 1,
    desc: ''
  }));
}
