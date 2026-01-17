const avatarCache = new Map();
const pendingLoads = new Map();
const CACHE_TTL = 300000;

async function loadChannelAvatar(channelName, videoDirectoryHandle) {
  if (!videoDirectoryHandle || !channelName) return null;
  
  const cacheKey = `avatar_${channelName}`;
  
  if (avatarCache.has(cacheKey)) {
    const cached = avatarCache.get(cacheKey);
    const cacheAge = Date.now() - cached.timestamp;
    if (cacheAge < CACHE_TTL) {
      return cached.url;
    }
  }
  
  if (pendingLoads.has(cacheKey)) {
    return pendingLoads.get(cacheKey);
  }
  
  const loadPromise = (async () => {
    try {
      const channelsDir = await videoDirectoryHandle.getDirectoryHandle('.channels', { create: true });
      const channelDir = await channelsDir.getDirectoryHandle(channelName, { create: true });

      let channelDataModified = 0;
      try {
        const channelJsonHandle = await channelDir.getFileHandle('channel.json');
        const channelJsonFile = await channelJsonHandle.getFile();
        channelDataModified = channelJsonFile.lastModified;
      } catch (e) {
      }

      if (avatarCache.has(cacheKey)) {
        const cached = avatarCache.get(cacheKey);
        const cacheAge = Date.now() - cached.timestamp;
        const cacheValid = cacheAge < CACHE_TTL && cached.version === channelDataModified;
        
        if (cacheValid) {
          return cached.url;
        }
        
        if (cached.url && cached.url.startsWith('blob:')) {
          URL.revokeObjectURL(cached.url);
        }
        avatarCache.delete(cacheKey);
      }

      const channelData = await readJSONFile(channelDir, 'channel.json', {});
      let avatarUrl = null;

      if (channelData.avatar) {
        avatarUrl = await loadImageFile(channelDir, channelData.avatar);
      }

      avatarCache.set(cacheKey, {
        url: avatarUrl,
        timestamp: Date.now(),
        version: channelDataModified
      });

      return avatarUrl;
    } catch (e) {
      console.error(`Avatar load error for ${channelName}:`, e);
      return null;
    } finally {
      pendingLoads.delete(cacheKey);
    }
  })();
  
  pendingLoads.set(cacheKey, loadPromise);
  return loadPromise;
}

function invalidateAvatarCache(channelName = null) {
  if (channelName) {
    const cacheKey = `avatar_${channelName}`;
    const cached = avatarCache.get(cacheKey);
    if (cached && cached.url && cached.url.startsWith('blob:')) {
      URL.revokeObjectURL(cached.url);
    }
    avatarCache.delete(cacheKey);
    console.log(`✅ Avatar cache invalidated for channel: ${channelName}`);
  } else {
    for (const [key, cached] of avatarCache.entries()) {
      if (cached.url && cached.url.startsWith('blob:')) {
        URL.revokeObjectURL(cached.url);
      }
    }
    avatarCache.clear();
    console.log('✅ All avatar caches invalidated');
  }
}

function getAvatarCacheStats() {
  const stats = {
    totalEntries: avatarCache.size,
    validEntries: 0,
    expiredEntries: 0,
    nullEntries: 0
  };
  
  const now = Date.now();
  for (const [key, cached] of avatarCache.entries()) {
    if (!cached.url) {
      stats.nullEntries++;
    } else if (now - cached.timestamp >= CACHE_TTL) {
      stats.expiredEntries++;
    } else {
      stats.validEntries++;
    }
  }
  
  return stats;
}

function cleanupAvatarCache() {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, cached] of avatarCache.entries()) {
    if (now - cached.timestamp >= CACHE_TTL) {
      if (cached.url && cached.url.startsWith('blob:')) {
        URL.revokeObjectURL(cached.url);
      }
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => avatarCache.delete(key));
  
  if (keysToDelete.length > 0) {
    console.log(`🧹 Cleaned up ${keysToDelete.length} expired avatar cache entries`);
  }
}

async function readJSONFile(dirHandle, name, defaultValue = null) {
  try {
    const fileHandle = await dirHandle.getFileHandle(name);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (e) {
    return defaultValue;
  }
}

async function loadImageFile(dirHandle, name) {
  try {
    const fileHandle = await dirHandle.getFileHandle(name);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch (e) {
    return null;
  }
}

setInterval(cleanupAvatarCache, 300000);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadChannelAvatar,
    invalidateAvatarCache,
    getAvatarCacheStats,
    cleanupAvatarCache
  };
}

if (typeof window !== 'undefined') {
  window.loadChannelAvatar = loadChannelAvatar;
  window.invalidateAvatarCache = invalidateAvatarCache;
  window.getAvatarCacheStats = getAvatarCacheStats;
  window.cleanupAvatarCache = cleanupAvatarCache;
  window.avatarCache = avatarCache;
}