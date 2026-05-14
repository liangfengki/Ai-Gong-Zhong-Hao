/**
 * 内存缓存 - 用于热点数据缓存
 * TTL: 5分钟，最大条目数: 1000，定期清理: 1分钟
 */
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5分钟
const MAX_SIZE = 1000;
const CLEANUP_INTERVAL = 60 * 1000; // 1分钟

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.time >= TTL) {
      cache.delete(key);
    }
  }
}

// 定期清理过期条目，防止未被读取的条目堆积
const cleanupTimer = setInterval(evictExpired, CLEANUP_INTERVAL);
cleanupTimer.unref(); // 不阻止进程退出

export function get(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

export function set(key, data) {
  // 达到上限时先清理过期条目
  if (cache.size >= MAX_SIZE) {
    evictExpired();
  }
  // 如果清理后仍然满，删除最早写入的条目
  if (cache.size >= MAX_SIZE) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { data, time: Date.now() });
}

export function clear() {
  cache.clear();
}
