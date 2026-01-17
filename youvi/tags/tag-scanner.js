/**
 * Tag Scanner
 * Scans video metadata to build initial tag database
 */

class TagScanner {
  constructor(tagDatabaseManager) {
    this.tagManager = tagDatabaseManager;
    this.isScanning = false;
    this.progress = { current: 0, total: 0, stage: '' };
    this.listeners = new Set();
  }

  /**
   * Scan all videos and build tag database
   * @param {Array} allVideos - Array of video objects with metadata
   * @param {object} options - Scanning options
   */
  async scanAndBuildDatabase(allVideos, options = {}) {
    if (this.isScanning) {
      throw new Error('Scanning already in progress');
    }

    this.isScanning = true;
    this.progress = { current: 0, total: allVideos.length, stage: 'Инициализация' };
    this.notifyProgress();

    console.log('[TagScanner] 🔍 Starting scan of', allVideos.length, 'videos');

    try {
      const tagStats = new Map();
      const batchSize = options.batchSize || 100;
      
      this.progress.stage = 'Сканирование видео';
      this.notifyProgress();

      for (let i = 0; i < allVideos.length; i += batchSize) {
        const batch = allVideos.slice(i, i + batchSize);
        await this.processBatch(batch, tagStats);
        
        this.progress.current = Math.min(i + batchSize, allVideos.length);
        this.notifyProgress();
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      this.progress.stage = 'Сохранение в базу данных';
      this.notifyProgress();

      console.log('[TagScanner] 📦 Preparing batch operation for', tagStats.size, 'tags');
      const tagOperations = Array.from(tagStats.entries()).map(([tagName, stats]) => ({
        tagName,
        options: {
          usageCount: stats.count,
          createdAt: stats.firstSeen,
          incrementUsage: false
        }
      }));
      
      const results = await this.tagManager.addTagsBatch(tagOperations);
      const addedCount = results.length;
      console.log('[TagScanner] ✅ Batch operation completed, added', addedCount, 'tags');

      this.progress.stage = 'Завершено';
      this.progress.current = this.progress.total;
      this.notifyProgress();

      console.log('[TagScanner] ✅ Scan completed:', {
        videosScanned: allVideos.length,
        tagsFound: tagStats.size,
        tagsAdded: addedCount
      });

      return {
        videosScanned: allVideos.length,
        tagsFound: tagStats.size,
        tagsAdded: addedCount,
        tagStats: Object.fromEntries(tagStats)
      };

    } catch (error) {
      console.error('[TagScanner] ❌ Scan failed:', error);
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Process a batch of videos
   * @param {Array} batch - Batch of videos to process
   * @param {Map} tagStats - Map to accumulate tag statistics
   */
  async processBatch(batch, tagStats) {
    for (const video of batch) {
      this.processVideoTags(video, tagStats);
    }
  }

  /**
   * Process tags from a single video
   * @param {object} video - Video object with metadata
   * @param {Map} tagStats - Map to accumulate tag statistics
   */
  processVideoTags(video, tagStats) {
    const tags = video.tags || [];
    const videoCreated = video.created || video.modified || Date.now();

    for (const tag of tags) {
      if (!tag || typeof tag !== 'string') continue;
      
      const trimmedTag = tag.trim();
      if (!trimmedTag) continue;

      if (trimmedTag.endsWith('(ка)')) continue;

      if (tagStats.has(trimmedTag)) {
        const stats = tagStats.get(trimmedTag);
        stats.count++;
        stats.firstSeen = Math.min(stats.firstSeen, videoCreated);
        stats.videos.add(video.name || video.title || 'unknown');
      } else {
        tagStats.set(trimmedTag, {
          count: 1,
          firstSeen: videoCreated,
          videos: new Set([video.name || video.title || 'unknown']),
          type: this.detectTagType(trimmedTag)
        });
      }
    }
  }

  /**
   * Detect tag type from tag name
   * @param {string} tagName - Tag name to analyze
   * @returns {string|null} - Detected type or null
   */
  detectTagType(tagName) {
    const match = tagName.match(/\(([a-zа-я]{2,3})\)$/i);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Update existing database with new videos
   * @param {Array} newVideos - Array of new video objects
   */
  async updateDatabase(newVideos) {
    if (this.isScanning) {
      throw new Error('Scanning already in progress');
    }

    if (!newVideos || newVideos.length === 0) {
      console.log('[TagScanner] No new videos to process');
      return { videosProcessed: 0, tagsUpdated: 0 };
    }

    this.isScanning = true;
    this.progress = { current: 0, total: newVideos.length, stage: 'Обновление базы данных' };
    this.notifyProgress();

    console.log('[TagScanner] 🔄 Updating database with', newVideos.length, 'new videos');

    try {
      let tagsUpdated = 0;

      for (let i = 0; i < newVideos.length; i++) {
        const video = newVideos[i];
        const tags = video.tags || [];

        for (const tag of tags) {
          if (!tag || typeof tag !== 'string') continue;
          
          const trimmedTag = tag.trim();
          if (!trimmedTag || trimmedTag.endsWith('(ка)')) continue;

          const existingTag = this.tagManager.getTag(trimmedTag);
          if (existingTag) {
            await this.tagManager.incrementUsage(trimmedTag);
          } else {
            await this.tagManager.addTag(trimmedTag, {
              usageCount: 1,
              createdAt: video.created || video.modified || Date.now()
            });
            tagsUpdated++;
          }
        }

        this.progress.current = i + 1;
        this.notifyProgress();

        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      this.progress.stage = 'Завершено';
      this.notifyProgress();

      console.log('[TagScanner] ✅ Update completed:', {
        videosProcessed: newVideos.length,
        tagsUpdated
      });

      return {
        videosProcessed: newVideos.length,
        tagsUpdated
      };

    } catch (error) {
      console.error('[TagScanner] ❌ Update failed:', error);
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Analyze tag patterns and suggest improvements
   * @param {Array} allVideos - All videos to analyze
   * @returns {object} - Analysis results
   */
  analyzeTagPatterns(allVideos) {
    const analysis = {
      duplicates: new Map(),
      suggestions: [],
      statistics: {
        totalTags: 0,
        uniqueTags: new Set(),
        typeDistribution: new Map(),
        averageTagsPerVideo: 0
      }
    };

    let totalTagCount = 0;

    for (const video of allVideos) {
      const tags = video.tags || [];
      totalTagCount += tags.length;

      for (const tag of tags) {
        if (!tag || typeof tag !== 'string') continue;
        
        const trimmedTag = tag.trim();
        if (!trimmedTag) continue;

        analysis.statistics.uniqueTags.add(trimmedTag);
        analysis.statistics.totalTags++;

        const type = this.detectTagType(trimmedTag);
        if (type) {
          const count = analysis.statistics.typeDistribution.get(type) || 0;
          analysis.statistics.typeDistribution.set(type, count + 1);
        }

        this.checkForDuplicates(trimmedTag, analysis.duplicates);
      }
    }

    analysis.statistics.averageTagsPerVideo = 
      allVideos.length > 0 ? totalTagCount / allVideos.length : 0;

    this.generateSuggestions(analysis);

    return analysis;
  }

  /**
   * Check for potential duplicate tags
   */
  checkForDuplicates(tag, duplicatesMap) {
    const normalized = tag.toLowerCase().replace(/\s+/g, ' ').trim();
    
    for (const [existingNormalized, existingTag] of duplicatesMap.entries()) {
      const similarity = this.calculateSimilarity(normalized, existingNormalized);
      if (similarity > 0.8 && normalized !== existingNormalized) {
        if (!duplicatesMap.has(normalized)) {
          duplicatesMap.set(normalized, {
            original: tag,
            similar: [existingTag.original]
          });
        } else {
          duplicatesMap.get(normalized).similar.push(existingTag.original);
        }
      }
    }

    if (!duplicatesMap.has(normalized)) {
      duplicatesMap.set(normalized, { original: tag, similar: [] });
    }
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Generate improvement suggestions
   */
  generateSuggestions(analysis) {
    for (const [normalized, data] of analysis.duplicates.entries()) {
      if (data.similar.length > 0) {
        analysis.suggestions.push({
          type: 'consolidate',
          message: `Возможные дубликаты: "${data.original}" и ${data.similar.join(', ')}`,
          tags: [data.original, ...data.similar]
        });
      }
    }

    const untypedTags = [];
    for (const tag of analysis.statistics.uniqueTags) {
      if (!this.detectTagType(tag)) {
        untypedTags.push(tag);
      }
    }

    if (untypedTags.length > 0) {
      analysis.suggestions.push({
        type: 'add_types',
        message: `${untypedTags.length} тегов без типа. Рассмотрите добавление суффиксов (gt), (ge) и т.д.`,
        tags: untypedTags.slice(0, 10)
      });
    }
  }

  /**
   * Add progress listener
   */
  addProgressListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove progress listener
   */
  removeProgressListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify progress to listeners
   */
  notifyProgress() {
    this.listeners.forEach(listener => {
      try {
        listener(this.progress);
      } catch (error) {
        console.error('[TagScanner] Progress listener error:', error);
      }
    });
  }

  /**
   * Get current progress
   */
  getProgress() {
    return { ...this.progress, isScanning: this.isScanning };
  }
}

window.tagScanner = new TagScanner(window.tagDatabaseManager);