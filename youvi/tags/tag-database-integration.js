/**
 * Tag Database Integration
 * Integrates centralized tag database with youvi_tags.html page
 */

const TAG_DB_INTEGRATION_DEBUG = false;

class TagDatabaseIntegration {
  constructor() {
    this.isInitialized = false;
    this.tagManager = window.tagDatabaseManager;
    this.tagScanner = window.tagScanner;
    this.originalBuildTagCloud = null;
    this.progressModal = null;
    this.refreshTimeout = null;
    this.lastRefreshTime = 0;
    
    this.cache = {
      tagCloud: new Map(),
      searchResults: new Map(),
      maxCacheSize: 50,
      ttl: 300000,
      lastCleanup: Date.now()
    };
    
    this.performance = {
      debounceDelay: 1000,
      maxRefreshRate: 2000,
      batchRenderSize: 100,
      virtualScrollThreshold: 500
    };
  }

  /**
   * Initialize integration with existing page
   * @param {FileSystemDirectoryHandle} videoDirectoryHandle
   * @param {Array} allVideos
   */
  async initialize(videoDirectoryHandle, allVideos) {
    if (this.isInitialized) return;

    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔧 Initializing...');

    try {
      await this.tagManager.initialize(videoDirectoryHandle);

      const stats = this.tagManager.getStats();
      if (stats.totalTags === 0 && allVideos.length > 0) {
        if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📊 Database is empty, starting initial scan...');
        await this.performInitialScan(allVideos);
      }

      if (window.tagSyncManager) {
        await window.tagSyncManager.initialize(allVideos);
        if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔄 Sync manager initialized');
      }

      if (window.metadataWatcher) {
        await window.metadataWatcher.initialize(videoDirectoryHandle, allVideos);
        if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 👀 Metadata watcher initialized');
      }

      this.replaceTagCloudFunction();

      this.setupEventListeners();

      this.addUIEnhancements();

      this.setupPeriodicSync(allVideos);

      this.isInitialized = true;
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ✅ Integration completed');



      this.buildTagCloudFromDatabase();

    } catch (error) {
      console.error('[TagDB Integration] ❌ Failed to initialize:', error);
      this.showError('Ошибка инициализации базы данных тегов: ' + error.message);
    }
  }

  /**
   * Perform initial scan of all videos
   */
  async performInitialScan(allVideos) {
    return new Promise((resolve, reject) => {
      this.showProgressModal();

      const progressListener = (progress) => {
        this.updateProgressModal(progress);
      };
      this.tagScanner.addProgressListener(progressListener);

      this.tagScanner.scanAndBuildDatabase(allVideos)
        .then((result) => {
          if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ✅ Initial scan completed:', result);
          this.hideProgressModal();
          this.showSuccess(`Сканирование завершено! Найдено ${result.tagsFound} тегов в ${result.videosScanned} видео.`);
          resolve(result);
        })
        .catch((error) => {
          console.error('[TagDB Integration] ❌ Initial scan failed:', error);
          this.hideProgressModal();
          this.showError('Ошибка сканирования: ' + error.message);
          reject(error);
        })
        .finally(() => {
          this.tagScanner.removeProgressListener(progressListener);
        });
    });
  }

  /**
   * Replace original buildTagCloud function
   */
  replaceTagCloudFunction() {
    if (typeof window.buildTagCloud === 'function') {
      this.originalBuildTagCloud = window.buildTagCloud;
    }

    window.buildTagCloud = () => {
      this.buildTagCloudFromDatabase();
    };

    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔄 Replaced buildTagCloud function');
  }

  /**
   * Build tag cloud from database with enhanced caching and debouncing
   */
  buildTagCloudFromDatabase(immediate = false, clearCache = false) {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    if (clearCache || immediate) {
      this.clearCache();
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🧹 Cache cleared due to immediate/clearCache flag');
    }
    
    const tagSearchBox = document.getElementById('tagSearchBox');
    const searchQuery = tagSearchBox ? tagSearchBox.value.toLowerCase().trim() : '';
    const cacheKey = this._getCacheKey(searchQuery);
    
    if (!immediate && !clearCache) {
      const cached = this.cache.tagCloud.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cache.ttl) {
        if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🎯 Using cached tag cloud for:', searchQuery || 'all tags');
        this._renderCachedTagCloud(cached.data);
        return;
      }
    }
    
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    
    if (immediate || clearCache || timeSinceLastRefresh > this.performance.maxRefreshRate) {
      this._buildTagCloudNow();
    } else {
      this.refreshTimeout = setTimeout(() => {
        this._buildTagCloudNow();
      }, this.performance.debounceDelay);
    }
  }
  
  /**
   * Generate cache key for tag cloud
   */
  _getCacheKey(searchQuery) {
    const showSpecialVideos = localStorage.getItem('showSpecialVideos') === 'true';
    return `${searchQuery}_${showSpecialVideos}`;
  }
  
  /**
   * Render cached tag cloud data
   */
  _renderCachedTagCloud(cachedData) {
    this.renderTagCloud(cachedData.tagsByType, cachedData.searchQuery);
    this.updateVideoCounter(cachedData.tags);
  }
  
  /**
   * Actually build tag cloud (internal method) with enhanced caching
   */
  _buildTagCloudNow() {
    const startTime = performance.now();
    this.lastRefreshTime = Date.now();
    
    const tagSearchBox = document.getElementById('tagSearchBox');
    const searchQuery = tagSearchBox ? tagSearchBox.value.toLowerCase().trim() : '';
    const cacheKey = this._getCacheKey(searchQuery);
    
    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] Building tag cloud from database, query:', searchQuery);

    try {
      this._cleanupCache();
      
      let tags;
      if (searchQuery) {
        tags = this.tagManager.searchTags(searchQuery);
      } else {
        tags = this.tagManager.getAllTags();
      }

      const tagsByType = this.groupTagsByType(tags);

      const cacheData = {
        tagsByType,
        searchQuery,
        tags,
        timestamp: Date.now()
      };
      
      this.cache.tagCloud.set(cacheKey, { data: cacheData, timestamp: Date.now() });
      
      if (this.cache.tagCloud.size > this.cache.maxCacheSize) {
        const oldestKey = this.cache.tagCloud.keys().next().value;
        this.cache.tagCloud.delete(oldestKey);
      }

      this._renderTagCloudOptimized(tagsByType, searchQuery, tags);
      
      const duration = performance.now() - startTime;
      if (duration > 100) {
        if (TAG_DB_INTEGRATION_DEBUG) console.warn('[TagDB Integration] Slow tag cloud build:', duration.toFixed(2), 'ms');
      } else {
        if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] Tag cloud built in', duration.toFixed(2), 'ms');
      }

    } catch (error) {
      console.error('[TagDB Integration] Failed to build tag cloud:', error);
      this.showError('Ошибка построения облака тегов: ' + error.message);
      
      if (this.originalBuildTagCloud) {
        if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] Falling back to original function');
        this.originalBuildTagCloud();
      }
    }
  }
  
  /**
   * Clean up expired cache entries
   */
  _cleanupCache() {
    const now = Date.now();
    
    if (now - this.cache.lastCleanup < 300000) {
      return;
    }
    
    let cleaned = 0;
    for (const [key, entry] of this.cache.tagCloud.entries()) {
      if (now - entry.timestamp > this.cache.ttl) {
        this.cache.tagCloud.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🧹 Cleaned', cleaned, 'expired cache entries');
    }
    
    this.cache.lastCleanup = now;
  }
  
  /**
   * Optimized rendering with virtual scrolling for large tag lists
   */
  _renderTagCloudOptimized(tagsByType, searchQuery, tags) {
    const totalTags = Object.values(tagsByType).reduce((sum, tags) => sum + tags.length, 0);
    
    if (totalTags > this.performance.virtualScrollThreshold) {
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📊 Using virtual scrolling for', totalTags, 'tags');
      this._renderTagCloudVirtual(tagsByType, searchQuery);
    } else {
      this.renderTagCloud(tagsByType, searchQuery);
    }
    
    this.updateVideoCounter(tags);
  }
  
  /**
   * Virtual scrolling implementation for large tag lists
   */
  _renderTagCloudVirtual(tagsByType, searchQuery) {
    this.renderTagCloud(tagsByType, searchQuery);
  }

  /**
   * Group tags by type for rendering
   */
  groupTagsByType(tags) {
    const grouped = {};
    const source = Array.isArray(tags) ? tags.filter(t => (t.usageCount || 0) > 0) : [];

    source.forEach(tag => {
      const type = tag.type || 'general';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(tag);
    });

    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    });

    return grouped;
  }

  /**
   * Render tag cloud using database data (optimized with batching)
   */
  renderTagCloud(tagsByType, searchQuery) {
    const tagsWrap = document.getElementById('tagsWrap');
    const emptyState = document.getElementById('emptyState');

    if (!tagsWrap) {
      console.error('[TagDB Integration] tagsWrap element not found');
      return;
    }

    const totalTags = Object.values(tagsByType).reduce((sum, tags) => sum + tags.length, 0);
    
    if (totalTags === 0) {
      emptyState.style.display = 'block';
      emptyState.textContent = searchQuery ? 'Теги не найдены по запросу' : 'Теги не найдены';
      tagsWrap.innerHTML = '';
      return;
    }

    emptyState.style.display = 'none';
    
    requestAnimationFrame(() => {
      this._renderTagCloudBatched(tagsByType, tagsWrap);
    });
  }
  
  /**
   * Render tag cloud in batches for better performance
   */
  _renderTagCloudBatched(tagsByType, tagsWrap) {
    const startTime = performance.now();
    
    const fragment = document.createDocumentFragment();

    const typeLabels = {
      'ка': 'Channel',
      'gt': 'General', 
      'ch': 'Character',
      'au': 'Author/Artist',
      'ge': 'Genre',
      'tp': 'Type',
      'yr': 'Year',
      'st': 'Studio',
      'ct': 'Category',
      'ra': 'Rating',
      'at': 'Anime',
      'ser': 'Serial',
      'mt': 'Movie',
      'nat': 'Animation'
    };

    const categoryOrder = ['gt', 'ct', 'ge', 'tp', 'at', 'ser', 'mt', 'nat', 'ch', 'au', 'st', 'yr', 'ra', 'ка'];

    categoryOrder.forEach(type => {
      const tags = tagsByType[type];
      if (!tags || tags.length === 0) return;

      const section = document.createElement('div');
      section.className = 'tag-section';

      const title = document.createElement('div');
      title.className = 'tag-section-title';
      title.textContent = typeLabels[type] || type;
      title.style.borderLeftColor = TagDatabaseSchema.getTagColor(type);
      section.appendChild(title);

      const content = document.createElement('div');
      content.className = 'tag-section-content';

      this._renderTagsBatch(tags, content, type);

      section.appendChild(content);
      fragment.appendChild(section);
    });

    tagsWrap.innerHTML = '';
    tagsWrap.appendChild(fragment);
    
    const duration = performance.now() - startTime;
    if (duration > 50) {
      if (TAG_DB_INTEGRATION_DEBUG) console.warn('[TagDB Integration] ⚠️ Slow tag rendering:', duration.toFixed(2), 'ms');
    }
  }
  
  /**
   * Render tags in batches to avoid UI blocking
   */
  _renderTagsBatch(tags, container, type) {
    const batchSize = this.performance.batchRenderSize;
    
    if (tags.length <= batchSize) {
      tags.forEach(tag => {
        const el = this._createTagElement(tag, type);
        container.appendChild(el);
      });
      return;
    }
    
    let index = 0;
    const renderBatch = () => {
      const endIndex = Math.min(index + batchSize, tags.length);
      
      for (let i = index; i < endIndex; i++) {
        const el = this._createTagElement(tags[i], type);
        container.appendChild(el);
      }
      
      index = endIndex;
      
      if (index < tags.length) {
        setTimeout(renderBatch, 0);
      }
    };
    
    renderBatch();
  }
  
  /**
   * Create individual tag element (optimized)
   */
  _createTagElement(tag, type) {
    const el = document.createElement('a');
    el.className = 'tag';
    el.style.backgroundColor = tag.color || TagDatabaseSchema.getTagColor(type);

    const displayName = tag.canonical.replace(/\s*\([a-zа-я]{2,3}\)$/i, '');
    
    const textSpan = document.createElement('span');
    textSpan.className = 'tag-text';
    const count = tag.usageCount || 0;
    textSpan.textContent = count > 1 ? `${displayName} (${count})` : displayName;
    
    const editIcon = document.createElement('span');
    editIcon.className = 'tag-edit-icon';
    editIcon.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`;
    editIcon.title = 'Управление алиасами';
    editIcon.dataset.tagName = tag.canonical;
    
    editIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagAlias] Edit icon clicked for:', tag.canonical);
      if (window.tagAliasManager) {
        window.tagAliasManager.openModal(tag.canonical);
      } else {
        console.error('[TagAlias] tagAliasManager not available!');
      }
      return false;
    }, true);
    
    editIcon.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, true);
    
    const implicationIcon = document.createElement('span');
    implicationIcon.className = 'tag-edit-icon tag-impl-icon';
    implicationIcon.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"/>
      <path d="M12 5l7 7-7 7"/>
    </svg>`;
    implicationIcon.title = 'Управление импликациями';
    implicationIcon.dataset.tagName = tag.canonical;
    
    implicationIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagImplication] Implication icon clicked for:', tag.canonical);
      if (window.tagImplicationManager) {
        window.tagImplicationManager.openModal(tag.canonical);
      } else {
        console.error('[TagImplication] tagImplicationManager not available!');
      }
      return false;
    }, true);
    
    implicationIcon.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, true);
    
    el.appendChild(textSpan);
    el.appendChild(editIcon);
    el.appendChild(implicationIcon);
    el.title = `Нажмите чтобы открыть видео с тегом "${displayName}" (использований: ${count})`;
    el.dataset.tagName = tag.canonical;

    const prefix = TagDatabaseSchema.getTagPrefix(type);
    const searchQuery = prefix + displayName;
    el.href = `youvi_search.html?q=${encodeURIComponent(searchQuery)}`;

    return el;
  }

  /**
   * Update video counter based on actual video count
   */
  updateVideoCounter(tags) {
    let count = 0;
    
    if (this.currentVideos && Array.isArray(this.currentVideos)) {
      const showSpecialVideos = localStorage.getItem('showSpecialVideos') === 'true';
      
      if (showSpecialVideos) {
        count = this.currentVideos.length;
      } else {
        count = this.currentVideos.filter(video => {
          const tags = video.tags || [];
          return !tags.some(tag => {
            const normalizedTag = tag.toLowerCase();
            return normalizedTag.includes('особое') || normalizedTag.includes('(ос)');
          });
        }).length;
      }
    } else if (window.allVideos && Array.isArray(window.allVideos)) {
      const showSpecialVideos = localStorage.getItem('showSpecialVideos') === 'true';
      
      if (showSpecialVideos) {
        count = window.allVideos.length;
      } else {
        count = window.allVideos.filter(video => {
          const tags = video.tags || [];
          return !tags.some(tag => {
            const normalizedTag = tag.toLowerCase();
            return normalizedTag.includes('особое') || normalizedTag.includes('(ос)');
          });
        }).length;
      }
    }
    
    count = Math.min(count, 99999);
    const countStr = count.toString().padStart(5, '0');

    const counterDigits = document.getElementById('counterDigits');
    if (!counterDigits) return;

    counterDigits.innerHTML = '';

    for (let i = 0; i < 5; i++) {
      const digit = countStr[i];
      const img = document.createElement('img');
      img.src = `counter/${digit}.png`;
      img.style.cssText = 'height:40px;width:auto;display:block;';
      img.onerror = function() {
        this.style.display = 'none';
        const span = document.createElement('span');
        span.textContent = digit;
        span.style.cssText = 'font-size:40px;font-weight:bold;color:#ff69b4;font-family:Verdana,sans-serif;line-height:40px;';
        this.parentNode.insertBefore(span, this.nextSibling);
      };
      counterDigits.appendChild(img);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.tagManager.addEventListener((event) => {
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📊 Database event received:', event.event, event.data);
      
      switch (event.event) {
        case 'tagAdded':
        case 'usageIncremented':
        case 'usageBatchIncremented':
        case 'batchCompleted':
          if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ➕ Tag addition/increment, refreshing UI...');
          this.buildTagCloudFromDatabase(false, false);
          break;
          
        case 'tagRemoved':
        case 'usageDecremented':
        case 'usageBatchDecremented':
        case 'tagsBatchRemoved':
        case 'usageFixed':
        case 'databaseUpdated':
          if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ➖ Tag removal/decrement, clearing cache and refreshing UI...');
          this.buildTagCloudFromDatabase(true, true);
          break;
          
        case 'saved':
          if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 💾 Database saved, checking for UI refresh...');
          this.buildTagCloudFromDatabase(false, false);
          break;
          
        default:
          if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔄 Generic database change, refreshing UI...');
          this.buildTagCloudFromDatabase(true, true);
      }
    });

    if (window.tagSyncManager) {
      window.tagSyncManager.addEventListener((event) => {
        switch (event.event) {
          case 'syncCompleted':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔄 Sync completed, refreshing UI...', event.data);
            
            const hasRemovals = event.data.changes.removed.length > 0;
            const hasModifications = event.data.changes.modified.length > 0;
            const forceClearCache = hasRemovals || hasModifications;
            
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📊 Sync analysis:', {
              added: event.data.changes.added.length,
              modified: event.data.changes.modified.length,
              removed: event.data.changes.removed.length,
              forceClearCache
            });
            
            this.buildTagCloudFromDatabase(true, forceClearCache);
            
            if (event.data.tagsUpdated > 0 || hasRemovals) {
              const msg = [];
              if (event.data.changes.added.length > 0) msg.push(`добавлено ${event.data.changes.added.length}`);
              if (event.data.changes.modified.length > 0) msg.push(`изменено ${event.data.changes.modified.length}`);
              if (event.data.changes.removed.length > 0) msg.push(`удалено ${event.data.changes.removed.length}`);
              this.showSuccess(`Синхронизация: ${msg.join(', ')} видео`);
            }
            break;
          case 'syncFailed':
            this.showError('Ошибка синхронизации: ' + event.data.error.message);
            break;
          case 'autoSyncTriggered':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] Auto-sync triggered, queue size:', event.data.queueSize);
            break;
        }
      });
    }

    if (window.metadataWatcher) {
      window.metadataWatcher.addEventListener((event) => {
        switch (event.event) {
          case 'metadataChanged':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📝 Metadata changes detected:', event.data.changes);
            break;
          case 'changesProcessed':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ✅ Metadata changes processed:', event.data.videoCount);
            this.buildTagCloudFromDatabase(true, true);
            break;
          case 'orphanedMetadataDetected':
            if (TAG_DB_INTEGRATION_DEBUG) console.warn('[TagDB Integration] ⚠️ Orphaned metadata detected:', event.data.count, 'videos');
            this.showWarning(`Обнаружено ${event.data.count} файлов метаданных без соответствующих видео`);
            this.buildTagCloudFromDatabase(true, true);
            break;
          case 'processingError':
            this.showWarning('Ошибка обработки изменений метаданных: ' + event.data.error.message);
            break;
        }
      });
    }

    document.addEventListener('tagDatabaseWarning', (event) => {
      this.showWarning(event.detail);
    });

    if (window.tagBroadcastSync) {
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🎧 Setting up broadcast listener...');
      window.tagBroadcastSync.addEventListener(async (event) => {
        if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📡 🔥 BROADCAST EVENT RECEIVED!', event);
        
        switch (event.type) {
          case 'tags_changed':
            try {
              if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ⚡ Processing tag changes from broadcast:', event.data);
              const { videoName, oldTags, newTags } = event.data;
              
              const oldTagsArray = Array.isArray(oldTags) ? oldTags : [];
              const newTagsArray = Array.isArray(newTags) ? newTags : [];
              
              if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📊 Tag change analysis:', { 
                videoName, 
                oldTags: oldTagsArray, 
                newTags: newTagsArray 
              });
              
              const removedTags = oldTagsArray.filter(tag => !newTagsArray.includes(tag));
              const addedTags = newTagsArray.filter(tag => !oldTagsArray.includes(tag));
              
              if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📊 Change summary:', { 
                removed: removedTags, 
                added: addedTags 
              });
              
              let hasChanges = false;
              
              if (removedTags.length > 0) {
                if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ➖ Processing', removedTags.length, 'removed tags');
                
                for (const tag of removedTags) {
                  const normalized = TagDatabaseSchema.normalizeTagName(tag);
                  const tagObj = this.tagManager.database?.tags?.[normalized];
                  
                  if (tagObj && tagObj.usageCount > 0) {
                    tagObj.usageCount--;
                    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📉 Decremented tag:', tag, 'to', tagObj.usageCount);
                    
                    if (tagObj.usageCount === 0) {
                      delete this.tagManager.database.tags[normalized];
                      Object.keys(this.tagManager.database.aliasIndex).forEach(alias => {
                        if (this.tagManager.database.aliasIndex[alias] === normalized) {
                          delete this.tagManager.database.aliasIndex[alias];
                        }
                      });
                      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🗑️ Completely removed tag:', tag);
                    }
                    hasChanges = true;
                  } else {
                    if (TAG_DB_INTEGRATION_DEBUG) console.warn('[TagDB Integration] ⚠️ Tag not found or already at 0:', tag);
                  }
                }
              }
              
              if (addedTags.length > 0) {
                if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ➕ Processing', addedTags.length, 'added tags');
                
                for (const tag of addedTags) {
                  await this.tagManager.addTag(tag, { 
                    usageCount: 1, 
                    incrementUsage: true,
                    immediate: false
                  });
                  if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ✅ Added tag:', tag);
                  hasChanges = true;
                }
              }
              
              if (hasChanges) {
                await this.tagManager._performSave();
                if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 💾 Database saved after broadcast changes');
                if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔄 Force refreshing UI with cache clear...');
                try { await this.tagManager.loadDatabase(); } catch (e) {}
                this.buildTagCloudFromDatabase(true, true);
              } else {
                if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ℹ️ No actual changes detected, skipping save');
              }
              
            } catch (error) {
              console.error('[TagDB Integration] ❌ Error processing broadcast tag changes:', error);
              this.buildTagCloudFromDatabase(true, true);
            }
            break;
            
          case 'video_added':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ➕ Video added from another tab, refreshing UI...');
            try { await this.tagManager.loadDatabase(); } catch (e) {}
            this.buildTagCloudFromDatabase(true, false);
            break;
            
          case 'video_removed':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ➖ Video removed from another tab, clearing cache and refreshing UI...');
            try { await this.tagManager.loadDatabase(); } catch (e) {}
            this.buildTagCloudFromDatabase(true, true);
            break;
            
          case 'metadata_changed':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 📝 Metadata changed from another tab, refreshing UI...');
            try { await this.tagManager.loadDatabase(); } catch (e) {}
            this.buildTagCloudFromDatabase(true, true);
            break;
            
          case 'database_updated':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 💾 Database updated from another tab, reloading and refreshing UI...');
            try { await this.tagManager.loadDatabase(); } catch (e) {}
            this.buildTagCloudFromDatabase(true, true);
            break;
            
          case 'tag_removed':
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🗑️ Tag removed from another tab:', event.data.tagName);
            this.buildTagCloudFromDatabase(true, true);
            break;
            
          default:
            if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ⚠️ Unknown event type:', event.type);
        }
      });
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ✅ Broadcast sync listener ACTIVE');
    } else {
      console.error('[TagDB Integration] ❌ tagBroadcastSync NOT AVAILABLE!');
    }

    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 👂 Event listeners setup');
  }



  /**
   * Add UI enhancements
   */
  addUIEnhancements() {
    const accessStatus = document.getElementById('accessStatus');
    if (!accessStatus) return;

    const statusDiv = document.createElement('div');
    statusDiv.id = 'tagDatabaseStatus';
    statusDiv.style.cssText = 'margin-top: 10px; font-size: 12px; color: #666; display: flex; align-items: center; gap: 10px;';
    
    const stats = this.tagManager.getStats();
    if (stats) {
      const statusText = stats.usingFallback 
        ? `📊 Tag Database: ${stats.totalTags} tags (localStorage)`
        : `📊 Tag Database: ${stats.totalTags} tags (file)`;
      
      const statusSpan = document.createElement('span');
      statusSpan.textContent = statusText;
      statusDiv.appendChild(statusSpan);

      const refreshBtn = document.createElement('button');
      refreshBtn.textContent = '🔄 Refresh';
      refreshBtn.style.cssText = 'padding: 4px 8px; font-size: 11px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 3px; cursor: pointer;';
      refreshBtn.title = 'Force refresh tag database';
      
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '⏳ Updating...';
        
        try {
          if (this.currentVideos && window.tagSyncManager) {
            await window.tagSyncManager.forceFullResync(this.currentVideos);
            this.showSuccess('Tag database updated');
            this.buildTagCloudFromDatabase();
            
            const newStats = this.tagManager.getStats();
            statusSpan.textContent = newStats.usingFallback 
              ? `📊 Tag Database: ${newStats.totalTags} tags (localStorage)`
              : `📊 Tag Database: ${newStats.totalTags} tags (file)`;
          }
        } catch (error) {
          this.showError('Update error: ' + error.message);
        } finally {
          refreshBtn.disabled = false;
          refreshBtn.textContent = '🔄 Refresh';
        }
      });
      
      statusDiv.appendChild(refreshBtn);
    }

    accessStatus.appendChild(statusDiv);

    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🎨 UI enhancements added');
  }



  /**
   * Show progress modal
   */
  showProgressModal() {
    if (this.progressModal) return;

    this.progressModal = document.createElement('div');
    this.progressModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      min-width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #333;">Сканирование тегов</h3>
      <div id="progressBar" style="width: 100%; height: 10px; background: #eee; border-radius: 5px; overflow: hidden; margin: 10px 0;">
        <div id="progressFill" style="height: 100%; background: #ff69b4; width: 0%; transition: width 0.3s;"></div>
      </div>
      <div id="progressText" style="margin: 10px 0; color: #666;">Инициализация...</div>
      <div id="progressDetails" style="font-size: 12px; color: #999;">0 / 0</div>
    `;

    this.progressModal.appendChild(content);
    document.body.appendChild(this.progressModal);
  }

  /**
   * Update progress modal
   */
  updateProgressModal(progress) {
    if (!this.progressModal) return;

    const progressFill = this.progressModal.querySelector('#progressFill');
    const progressText = this.progressModal.querySelector('#progressText');
    const progressDetails = this.progressModal.querySelector('#progressDetails');

    if (progressFill && progress.total > 0) {
      const percentage = (progress.current / progress.total) * 100;
      progressFill.style.width = percentage + '%';
    }

    if (progressText) {
      progressText.textContent = progress.stage;
    }

    if (progressDetails) {
      progressDetails.textContent = `${progress.current} / ${progress.total}`;
    }
  }

  /**
   * Hide progress modal
   */
  hideProgressModal() {
    if (this.progressModal) {
      document.body.removeChild(this.progressModal);
      this.progressModal = null;
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show warning message
   */
  showWarning(message) {
    this.showNotification(message, 'warning');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-size: 14px;
      z-index: 10001;
      max-width: 400px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    `;

    switch (type) {
      case 'success':
        notification.style.background = '#4CAF50';
        break;
      case 'warning':
        notification.style.background = '#FF9800';
        break;
      case 'error':
        notification.style.background = '#F44336';
        break;
      default:
        notification.style.background = '#2196F3';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * Setup periodic sync check (optimized)
   */
  setupPeriodicSync(allVideos) {
    this.currentVideos = allVideos;
    
    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] ⏰ Using MetadataWatcher for real-time updates (no periodic reload)');
    
    setInterval(() => {
      this._cleanupCache();
    }, 300000);
  }
  
  /**
   * Clear all caches (useful for debugging or memory management)
   */
  clearCache() {
    this.cache.tagCloud.clear();
    this.cache.searchResults.clear();
    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🧹 All caches cleared');
  }
  
  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return {
      tagCloudCacheSize: this.cache.tagCloud.size,
      searchResultsCacheSize: this.cache.searchResults.size,
      maxCacheSize: this.cache.maxCacheSize,
      ttl: this.cache.ttl,
      lastCleanup: new Date(this.cache.lastCleanup).toISOString()
    };
  }
  
  /**
   * Force immediate refresh (for debugging tag deletion issues)
   */
  forceRefresh() {
    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔄 FORCE REFRESH - Clearing all caches and rebuilding UI');
    this.clearCache();
    this.buildTagCloudFromDatabase(true, true);
  }
  
  /**
   * Debug method to check tag existence
   */
  debugTagExists(tagName) {
    const normalized = TagDatabaseSchema.normalizeTagName(tagName);
    const exists = this.tagManager.database?.tags?.[normalized];
    if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔍 Debug tag check:', {
      original: tagName,
      normalized: normalized,
      exists: !!exists,
      usageCount: exists?.usageCount || 0,
      fullTag: exists
    });
    return exists;
  }

  /**
   * Update current videos list (call this when video list changes)
   */
  updateVideosList(allVideos) {
    this.currentVideos = allVideos;
    
    if (window.tagSyncManager && this.isInitialized) {
      window.tagSyncManager.checkAndSync(allVideos, { force: true }).catch(error => {
        if (TAG_DB_INTEGRATION_DEBUG) console.warn('[TagDB Integration] Video list update sync failed:', error);
      });
    }
  }

  /**
   * Update database with new videos (called when videos are added)
   */
  async updateWithNewVideos(newVideos) {
    if (!this.isInitialized || !newVideos || newVideos.length === 0) return;

    try {
      if (TAG_DB_INTEGRATION_DEBUG) console.log('[TagDB Integration] 🔄 Updating database with', newVideos.length, 'new videos');
      
      if (window.tagSyncManager) {
        await window.tagSyncManager.checkAndSync(newVideos);
      } else {
        const result = await this.tagScanner.updateDatabase(newVideos);
        if (result.tagsUpdated > 0) {
          this.showSuccess(`Добавлено ${result.tagsUpdated} новых тегов из ${result.videosProcessed} видео`);
          this.buildTagCloudFromDatabase();
        }
      }
    } catch (error) {
      console.error('[TagDB Integration] ❌ Failed to update with new videos:', error);
      this.showError('Ошибка обновления базы данных: ' + error.message);
    }
  }

  /**
   * Force full resync of all videos
   */
  async forceFullResync() {
    if (!this.isInitialized) return;

    try {
      this.showProgressModal();
      
      if (window.tagSyncManager && this.currentVideos) {
        await window.tagSyncManager.forceFullResync(this.currentVideos);
        this.showSuccess('Полная синхронизация завершена успешно');
      } else {
        this.showWarning('Менеджер синхронизации недоступен');
      }
      
      this.buildTagCloudFromDatabase();
    } catch (error) {
      console.error('[TagDB Integration] ❌ Force resync failed:', error);
      this.showError('Ошибка полной синхронизации: ' + error.message);
    } finally {
      this.hideProgressModal();
    }
  }

  /**
   * Get database statistics for debugging
   */
  getStats() {
    return this.tagManager.getStats();
  }
}

window.tagDatabaseIntegration = new TagDatabaseIntegration();

window.debugTagSystem = {
  forceRefresh: () => window.tagDatabaseIntegration.forceRefresh(),
  clearCache: () => window.tagDatabaseIntegration.clearCache(),
  getCacheStats: () => window.tagDatabaseIntegration.getCacheStats(),
  checkTag: (tagName) => window.tagDatabaseIntegration.debugTagExists(tagName),
  getDatabase: () => window.tagDatabaseManager.database,
  flushPending: () => window.tagDatabaseManager.flushPendingOperations(),
  
  fixTagUsage: (tagName, correctCount) => window.tagDatabaseManager.fixTagUsage(tagName, correctCount),
  decrementTag: (tagName) => window.tagDatabaseManager.decrementUsage(tagName, true),
  incrementTag: (tagName) => window.tagDatabaseManager.incrementUsage(tagName, true),
  listAllTags: () => {
    const tags = window.tagDatabaseManager.database?.tags || {};
    console.table(Object.entries(tags).map(([key, tag]) => ({
      canonical: tag.canonical,
      usageCount: tag.usageCount,
      type: tag.type
    })));
    return tags;
  },
  
  quickFix: (tagName) => {
    if (TAG_DB_INTEGRATION_DEBUG) console.log('🔧 Quick fixing tag:', tagName);
    const tag = window.debugTagSystem.checkTag(tagName);
    if (tag && tag.usageCount > 1) {
      if (TAG_DB_INTEGRATION_DEBUG) console.log('Found tag with count:', tag.usageCount, '- fixing to 1');
      return window.debugTagSystem.fixTagUsage(tagName, 1);
    } else {
      if (TAG_DB_INTEGRATION_DEBUG) console.log('Tag not found or count is already correct');
      return null;
    }
  }
};