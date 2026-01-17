/**
 * Autocomplete Integration Helper
 * Provides easy integration with YouVi pages
 */

if (typeof AUTOCOMPLETE_INTEGRATION_DEBUG === 'undefined') {
  var AUTOCOMPLETE_INTEGRATION_DEBUG = false;
}

class AutocompleteIntegration {
  constructor() {
    this.autocomplete = null;
    this.initialized = false;
  }

  /**
   * Initialize autocomplete on a search input
   * @param {HTMLInputElement} inputElement - The search input element
   * @param {Object} options - Configuration options
   * @param {FileSystemDirectoryHandle} options.videoDirectoryHandle - Directory handle for videos
   * @param {Array} options.allVideos - Array of all videos
   * @param {Array} options.allPlaylists - Array of all playlists
   * @param {Function} options.onTagSelect - Callback when tag is selected
   * @param {Function} options.onVideoSelect - Callback when video is selected
   * @param {Function} options.onPlaylistSelect - Callback when playlist is selected
   * @param {Function} options.onChannelSelect - Callback when channel is selected
   */
  async init(inputElement, options = {}) {
    if (this.initialized) {
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.warn('Autocomplete already initialized');
      return;
    }

    await window.autocompleteCache.init();

    await this.updateCacheIfNeeded(options.allVideos, options.allPlaylists);

    this.autocomplete = new YouviAutocomplete(inputElement, {
      minChars: 1,
      debounceDelay: 150,
      videoDirectoryHandle: options.videoDirectoryHandle,
      avatarLoader: this.createAvatarLoader(options.videoDirectoryHandle),
      onSelect: (result) => this.handleSelection(result, options)
    });

    this.initialized = true;
    if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('Autocomplete initialized successfully');
  }

  /**
   * Update cache if data has changed
   */
  async updateCacheIfNeeded(allVideos, allPlaylists) {
    if (!allVideos || !allPlaylists || (allVideos.length === 0 && allPlaylists.length === 0)) {
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('[AutocompleteIntegration] No data provided, checking cache...');
      
      if (window.autocompleteCache.memoryIndex.videoTitles.size === 0) {
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('[AutocompleteIntegration] Memory index empty, loading from IndexedDB...');
        try {
          await window.autocompleteCache.loadMemoryIndexFromCache();
          if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('[AutocompleteIntegration] ✅ Memory index loaded from cache');
        } catch (error) {
          if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.error('[AutocompleteIntegration] Failed to load memory index:', error);
        }
      } else {
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('[AutocompleteIntegration] ✅ Using existing memory index');
      }
      return;
    }

    try {
      const isCacheValid = await window.autocompleteCache.isCacheValid(
        allVideos.length,
        allPlaylists.length
      );
      
      if (isCacheValid) {
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('[AutocompleteIntegration] ✅ Using existing cache (valid)');
        return;
      }
      
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) {
        console.log('[AutocompleteIntegration] Updating autocomplete cache with page data...');
        console.log(`[AutocompleteIntegration] Videos: ${allVideos.length}, Playlists: ${allPlaylists.length}`);
      }
      
      if (typeof AutocompleteDataLoader !== 'undefined') {
        AutocompleteDataLoader.clearCache();
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('[AutocompleteIntegration] Cleared AutocompleteDataLoader cache');
      }
      
      const playlistsWithCounts = allPlaylists.map(playlist => ({
        ...playlist,
        videoCount: playlist.videoCount || (playlist.videos ? playlist.videos.length : 0)
      }));
      
      await window.autocompleteCache.updateCache({
        videos: allVideos,
        playlists: playlistsWithCounts
      });
      
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('[AutocompleteIntegration] ✅ Autocomplete cache updated successfully');
    } catch (error) {
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.error('[AutocompleteIntegration] Error updating autocomplete cache:', error);
    }
  }

  /**
   * Manually update cache with new data
   */
  async updateCache(allVideos, allPlaylists) {
    if (!allVideos || !allPlaylists) {
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.warn('Cannot update cache: missing video or playlist data');
      return;
    }

    try {
      await window.autocompleteCache.updateCache({
        videos: allVideos,
        playlists: allPlaylists
      });
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log('Autocomplete cache manually updated');
    } catch (error) {
      console.error('Error updating autocomplete cache:', error);
    }
  }

  /**
   * Handle selection based on type
   */
  handleSelection(result, options) {
    const { type, value } = result;

    switch (type) {
      case 'tag':
        window.location.href = `youvi_search.html?q=${encodeURIComponent(value)}`;
        break;
      
      case 'video':
        window.location.href = window.VideoID 
            ? window.VideoID.buildVideoUrl(value)
            : `youvi_video.html?name=${encodeURIComponent(value)}`;
        break;
      
      case 'playlist':
        window.location.href = `youvi_playlists_view.html?playlistId=${encodeURIComponent(value)}`;
        break;
      
      case 'channel':
        window.location.href = `youvi_ch_view.html?channel=${encodeURIComponent(value)}&tab=home`;
        break;
    }
  }

  /**
   * Create avatar loader function
   */
  createAvatarLoader(videoDirectoryHandle) {
    const avatarCache = new Map();
    
    this.avatarCache = avatarCache;

    const loader = async (channelName) => {
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] Loading avatar for channel: ${channelName}`);
      
      const cacheKey = `avatar_${channelName}`;
      if (avatarCache.has(cacheKey)) {
        const cached = avatarCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) {
          if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] Using cached avatar for ${channelName}`);
          return cached.url;
        }
        if (cached.url && cached.url.startsWith('blob:')) {
          URL.revokeObjectURL(cached.url);
        }
        avatarCache.delete(cacheKey);
      }

      if (!videoDirectoryHandle) {
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.warn(`[Avatar Loader] No videoDirectoryHandle available`);
        return null;
      }

      try {
        const channelsDir = await videoDirectoryHandle.getDirectoryHandle('.channels', { create: false });
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] Found .channels directory`);
        
        const channelDir = await channelsDir.getDirectoryHandle(channelName, { create: false });
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] Found channel directory: ${channelName}`);

        try {
          const channelJsonHandle = await channelDir.getFileHandle('channel.json', { create: false });
          const channelJsonFile = await channelJsonHandle.getFile();
          const channelData = JSON.parse(await channelJsonFile.text());
          if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] Loaded channel.json for ${channelName}:`, channelData);

          if (channelData.avatar) {
            const avatarHandle = await channelDir.getFileHandle(channelData.avatar, { create: false });
            const avatarFile = await avatarHandle.getFile();
            const avatarUrl = URL.createObjectURL(avatarFile);
            if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] Loaded avatar from channel.json: ${channelData.avatar}`);
            
            avatarCache.set(cacheKey, {
              url: avatarUrl,
              timestamp: Date.now()
            });
            return avatarUrl;
          }
        } catch (e) {
          if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] No channel.json or avatar field, trying default names`);
          const avatarNames = ['avatar.jpg', 'avatar.png', 'avatar.webp', 'avatar.gif'];
          
          for (const name of avatarNames) {
            try {
              const avatarHandle = await channelDir.getFileHandle(name, { create: false });
              const avatarFile = await avatarHandle.getFile();
              const avatarUrl = URL.createObjectURL(avatarFile);
              if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] Found avatar: ${name}`);
              
              avatarCache.set(cacheKey, {
                url: avatarUrl,
                timestamp: Date.now()
              });
              return avatarUrl;
            } catch (e) {
              continue;
            }
          }
        }
        
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] No avatar found for ${channelName}`);
        avatarCache.set(cacheKey, {
          url: null,
          timestamp: Date.now()
        });
        return null;
      } catch (error) {
        if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.warn(`[Avatar Loader] Error loading avatar for ${channelName}:`, error);
        avatarCache.set(cacheKey, {
          url: null,
          timestamp: Date.now()
        });
        return null;
      }
    };
    
    loader.cleanup = () => {
      if (AUTOCOMPLETE_INTEGRATION_DEBUG) console.log(`[Avatar Loader] Cleaning up ${avatarCache.size} cached avatars`);
      for (const cached of avatarCache.values()) {
        if (cached.url && cached.url.startsWith('blob:')) {
          URL.revokeObjectURL(cached.url);
        }
      }
      avatarCache.clear();
    };
    
    return loader;
  }

  /**
   * Destroy autocomplete instance
   */
  destroy() {
    if (this.autocomplete) {
      this.autocomplete.destroy();
      this.autocomplete = null;
      this.initialized = false;
    }
    
    if (this.autocomplete && this.autocomplete.options.avatarLoader?.cleanup) {
      this.autocomplete.options.avatarLoader.cleanup();
    }
    
    if (this.avatarCache) {
      for (const cached of this.avatarCache.values()) {
        if (cached.url && cached.url.startsWith('blob:')) {
          URL.revokeObjectURL(cached.url);
        }
      }
      this.avatarCache.clear();
      this.avatarCache = null;
    }
  }
}

window.AutocompleteIntegration = AutocompleteIntegration;