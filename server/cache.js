/**
 * 简单内存缓存 - 用于热点数据缓存
 * TTL: 5分钟，最大条目: 100
 */
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5分钟
const MAX_SIZE = 100;

export function get(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < TTL) {
    // 刷新访问顺序（LRU）
    cache.delete(key);
    cache.set(key, entry);
    return entry.data;
  }
  cache.delete(key);
  return null;
}

export function set(key, data) {
  // 达到上限时淘汰最旧的条目
  if (cache.size >= MAX_SIZE && !cache.has(key)) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, time: Date.now() });
}

export function del(key) {
  cache.delete(key);
}

export function clear() {
  cache.clear();
}
