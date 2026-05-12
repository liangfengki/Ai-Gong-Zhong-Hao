/**
 * 简单内存缓存 - 用于热点数据缓存
 * TTL: 5分钟
 */
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5分钟

export function get(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

export function set(key, data) {
  cache.set(key, { data, time: Date.now() });
}

export function clear() {
  cache.clear();
}
