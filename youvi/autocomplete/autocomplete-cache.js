/**
 * Autocomplete Cache Module
 * Manages IndexedDB cache for search data to avoid repeated scanning
 */

if (typeof AUTOCOMPLETE_CACHE_DEBUG === 'undefined') {
  var AUTOCOMPLETE_CACHE_DEBUG = false;
}

class AutocompleteCache {
  constructor() {
    this.dbName = 'youvi-autocomplete-cache';
    this.dbVersion = 1;
    this.db = null;
    this.initialized = false;
    
    this._cyrillicCache = new Map();
    this._latinCache = new Map();
    
    this.memoryIndex = {
      videoTitles: new Map(),
      tagNames: new Map(),
      playlistTitles: new Map(),
      channelNames: new Map(),
      tagInverted: new Map()
    };
    
    this.searchResultsCache = new Map();
    this.maxSearchCacheSize = 100;
    this.searchCacheTimeout = 60000;
    
    this.TAG_TYPE_MAP = {
      'channel': 'ка',
      'general': 'gt',
      'character': 'ch',
      'author': 'au',
      'artist': 'au',
      'genre': 'ge',
      'type': 'tp',
      'year': 'yr',
      'studio': 'st',
      'category': 'ct',
      'rating': 'ra',
      'anime': 'at',
      'serial': 'ser',
      'movie': 'mt',
      'animation': 'nat',
      'gt': 'gt',
      'ch': 'ch',
      'au': 'au',
      'ar': 'au',
      'ge': 'ge',
      'tp': 'tp',
      'yr': 'yr',
      'st': 'st',
      'ct': 'ct',
      'ra': 'ra',
      'at': 'at',
      'ser': 'ser',
      'mt': 'mt',
      'nat': 'nat',
      'ka': 'ка',
      'ка': 'ка',
      'аниме': 'at',
      'сериал': 'ser',
      'фильм': 'mt',
      'анимация': 'nat',
      'персонаж': 'ch',
      'автор': 'au',
      'жанр': 'ge',
      'тип': 'tp',
      'год': 'yr',
      'студия': 'st',
      'категория': 'ct',
      'рейтинг': 'ra',
      'канал': 'ка'
    };
    
    this.TAG_SUFFIX_TO_PREFIX = {
      'ка': 'channel',
      'gt': 'general',
      'ch': 'character',
      'au': 'author',
      'ge': 'genre',
      'tp': 'type',
      'yr': 'year',
      'st': 'studio',
      'ct': 'category',
      'ra': 'rating',
      'at': 'anime',
      'ser': 'serial',
      'mt': 'movie',
      'nat': 'animation'
    };
    
    this.translitMap = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'є': 'ye',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'і': 'i', 'ї': 'yi',
      'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
      'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e',
      'ю': 'yu', 'я': 'ya', 'ґ': 'g',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Є': 'Ye',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'І': 'I', 'Ї': 'Yi',
      'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
      'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
      'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E',
      'Ю': 'Yu', 'Я': 'Ya', 'Ґ': 'G'
    };
    
    this.latinToCyrillicVariants = {
      'shch': ['щ'],
      'sch': ['щ', 'ш'],
      'tch': ['ч'],
      'sh': ['ш', 'щ', 'ч'],
      'ch': ['ч', 'ш', 'щ'],
      'zh': ['ж', 'з'],
      'ts': ['ц', 'тс'],
      'tz': ['ц', 'тц'],
      'dz': ['дз', 'з'],
      'dj': ['дж'],
      'dg': ['дж', 'дг'],
      
      'upload': ['аплоад', 'уплоад', 'аплоуд'],
      'game': ['гейм', 'гаме'],
      'ame': ['эйм', 'ейм', 'ам'],
      'ime': ['айм', 'им'],
      'ome': ['оум', 'ом'],
      'load': ['лоад', 'лоуд'],
      'play': ['плей', 'плэй'],
      'way': ['вей', 'уэй'],
      'day': ['дей', 'дэй'],
      'say': ['сей', 'сэй'],
      'may': ['мей', 'мэй'],
      'stay': ['стей', 'стэй'],
      'make': ['мейк', 'мэйк'],
      'take': ['тейк', 'тэйк'],
      'cake': ['кейк', 'кэйк'],
      'name': ['нейм', 'нэйм'],
      'same': ['сейм', 'сэйм'],
      'frame': ['фрейм', 'фрэйм'],
      'time': ['тайм', 'тим'],
      'life': ['лайф', 'лиф'],
      'like': ['лайк', 'лик'],
      'mike': ['майк', 'мик'],
      'type': ['тайп', 'тип'],
      
      'tion': ['шн', 'шен', 'цион'],
      'sion': ['жн', 'шн', 'сион'],
      
      'ay': ['ей', 'эй', 'ай'],
      'ey': ['ей', 'эй', 'ай'],
      'oy': ['ой', 'ои'],
      'uy': ['уй', 'уи'],
      'ai': ['ай', 'аи', 'ей'],
      'ei': ['ей', 'эй', 'аи'],
      'oi': ['ой', 'ои'],
      'ui': ['уй', 'уи'],
      'au': ['ау', 'оу'],
      'ou': ['оу', 'ау'],
      'ea': ['и', 'иа', 'еа'],
      'ee': ['и', 'ии'],
      'oo': ['у', 'уу'],
      'oa': ['оа', 'оу'],
      
      'yo': ['ё', 'йо', 'ио'],
      'ye': ['е', 'є', 'йе', 'ие'],
      'ya': ['я', 'йа', 'иа'],
      'yu': ['ю', 'йу', 'иу'],
      'yi': ['ї', 'йі', 'ии'],
      'ia': ['я', 'иа', 'ия'],
      'ja': ['я', 'йа', 'джа'],
      'jo': ['ё', 'йо', 'джо'],
      'ju': ['ю', 'йу', 'джу'],
      'ji': ['джи', 'жи', 'йи'],
      'kyo': ['кё', 'кио'],
      'kyu': ['кю', 'кию'],
      'kya': ['кя', 'киа'],
      'gyo': ['гё', 'гио'],
      'gyu': ['гю', 'гию'],
      'gya': ['гя', 'гиа'],
      'sho': ['шо', 'сё'],
      'shu': ['шу', 'сю'],
      'sha': ['ша', 'ся'],
      'cho': ['чо', 'чё'],
      'chu': ['чу', 'чю'],
      'cha': ['ча', 'чя'],
      'kei': ['кей', 'кэй'],
      'mei': ['мей', 'мэй'],
      'gei': ['гей', 'гэй'],
      'sei': ['сей', 'сэй'],
      'tei': ['тей', 'тэй'],
      'rei': ['рей', 'рэй'],
      
      'ga': ['га', 'гэ'],
      'ge': ['ге', 'дж'],
      'gi': ['ги', 'джи'],
      'go': ['го', 'гоу'],
      'gu': ['гу', 'гью'],
      
      'a': ['а', 'я', 'э', 'ей', 'е'], 
      'e': ['е', 'э', 'є', 'ё', 'и'], 
      'i': ['и', 'і', 'ы', 'й', 'ай'],
      'o': ['о', 'ё', 'оу'],
      'u': ['у', 'ю', 'ю'],
      'y': ['й', 'ы', 'я', 'и'],
      
      'j': ['й', 'ж', 'дж', 'дз', 'ь'],
      'h': ['х', 'г', 'ч'],
      'c': ['к', 'ц', 'ч', 'с'],
      'g': ['г', 'ґ', 'дж'],
      'z': ['з', 'ж'],
      's': ['с', 'ш', 'щ', 'з'],
      'v': ['в', 'ф'],
      'f': ['ф', 'в'],
      'b': ['б', 'п'],
      'p': ['п', 'б'],
      'd': ['д', 'т'],
      't': ['т', 'д'],
      'k': ['к', 'г'],
      'l': ['л', 'ль'],
      'm': ['м'],
      'n': ['н', 'нь'],
      'r': ['р'],
      'w': ['в', 'у'],
      'x': ['кс', 'х']
    };
    
    this.reverseTranslitMap = this.buildReverseTranslitMap();
  }
  
  buildReverseTranslitMap() {
    return this.latinToCyrillicVariants;
  }
  
  translitToLatin(text) {
    return text.split('').map(char => this.translitMap[char] || char).join('');
  }
  
  generateCyrillicVariants(latinText) {
    const text = latinText.toLowerCase();
    
    if (this._cyrillicCache.has(text)) {
      return this._cyrillicCache.get(text);
    }
    
    const variants = new Set();
    const sortedKeys = Object.keys(this.reverseTranslitMap).sort((a, b) => b.length - a.length);
    const maxVariants = 20;
    
    const generateRecursive = (str, index, currentResult, depth = 0) => {
      if (variants.size >= maxVariants || depth > 10) return;
      
      if (index >= str.length) {
        variants.add(currentResult);
        return;
      }
      
      let matched = false;
      
      for (const latinSeq of sortedKeys) {
        if (str.substring(index, index + latinSeq.length) === latinSeq) {
          const cyrillicOptions = this.reverseTranslitMap[latinSeq];
          
          const limitedOptions = latinSeq.length >= 4 ? cyrillicOptions : cyrillicOptions.slice(0, 2);
          
          for (const cyrVar of limitedOptions) {
            generateRecursive(str, index + latinSeq.length, currentResult + cyrVar, depth + 1);
          }
          
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        generateRecursive(str, index + 1, currentResult + str[index], depth + 1);
      }
    };
    
    generateRecursive(text, 0, '');
    
    const result = Array.from(variants);
    
    if (this._cyrillicCache.size > 1000) {
      this._cyrillicCache.clear();
    }
    this._cyrillicCache.set(text, result);
    
    return result;
  }
  
  generateLatinVariants(cyrillicText) {
    const text = cyrillicText.toLowerCase();
    
    if (this._latinCache.has(text)) {
      return this._latinCache.get(text);
    }
    
    const variants = new Set();
    const maxVariants = 20;
    
    const multiCharMap = [
      { cyr: 'аплоад', lat: ['upload'] },
      { cyr: 'уплоад', lat: ['upload'] },
      { cyr: 'реаплоад', lat: ['reupload'] },
      { cyr: 'реуплоад', lat: ['reupload'] },
      { cyr: 'гейм', lat: ['game'] },
      { cyr: 'лаки', lat: ['lucky', 'laki'] },
      { cyr: 'киото', lat: ['kyoto', 'kioto'] },
      { cyr: 'токио', lat: ['tokyo', 'tokio'] },
      
      { cyr: 'лоад', lat: ['load'] },
      { cyr: 'лоуд', lat: ['load'] },
      { cyr: 'эйм', lat: ['ame', 'aim'] },
      { cyr: 'ейм', lat: ['ame', 'aim', 'ayme'] },
      { cyr: 'айм', lat: ['ime', 'aim'] },
      { cyr: 'плей', lat: ['play'] },
      { cyr: 'плэй', lat: ['play'] },
      { cyr: 'мейк', lat: ['make'] },
      { cyr: 'тейк', lat: ['take'] },
      { cyr: 'кейк', lat: ['cake'] },
      { cyr: 'нейм', lat: ['name'] },
      { cyr: 'сейм', lat: ['same'] },
      { cyr: 'тайм', lat: ['time'] },
      { cyr: 'лайф', lat: ['life'] },
      { cyr: 'лайк', lat: ['like'] },
      { cyr: 'тайп', lat: ['type'] },
      
      { cyr: 'ки', lat: ['ki', 'ky', 'key'] },
      { cyr: 'кё', lat: ['kyo', 'kio'] },
      { cyr: 'кю', lat: ['kyu', 'kiu'] },
      { cyr: 'кя', lat: ['kya', 'kia'] },
      { cyr: 'ге', lat: ['ge', 'ghe'] },
      { cyr: 'ги', lat: ['gi', 'ghi'] },
      { cyr: 'дж', lat: ['j', 'dj', 'dzh', 'g'] },
      { cyr: 'кс', lat: ['x', 'ks'] },
      { cyr: 'ей', lat: ['ay', 'ey', 'ei'] },
      { cyr: 'эй', lat: ['ay', 'ey', 'ai'] },
      { cyr: 'ай', lat: ['ai', 'ay', 'i'] },
      { cyr: 'ой', lat: ['oy', 'oi'] },
      { cyr: 'уй', lat: ['uy', 'ui'] },
      { cyr: 'оу', lat: ['ou', 'ow', 'o'] },
      { cyr: 'ау', lat: ['au', 'ow'] }
    ];
    
    const cyrillicToLatinVariants = {};
    cyrillicToLatinVariants['а'] = ['a'];
    cyrillicToLatinVariants['б'] = ['b'];
    cyrillicToLatinVariants['в'] = ['v', 'w'];
    cyrillicToLatinVariants['г'] = ['g'];
    cyrillicToLatinVariants['д'] = ['d'];
    cyrillicToLatinVariants['е'] = ['e', 'ye'];
    cyrillicToLatinVariants['ё'] = ['yo', 'jo', 'e', 'o'];
    cyrillicToLatinVariants['ж'] = ['zh', 'j', 'z'];
    cyrillicToLatinVariants['з'] = ['z'];
    cyrillicToLatinVariants['и'] = ['i', 'y'];
    cyrillicToLatinVariants['й'] = ['y', 'j', 'i'];
    cyrillicToLatinVariants['к'] = ['k', 'c'];
    cyrillicToLatinVariants['л'] = ['l'];
    cyrillicToLatinVariants['м'] = ['m'];
    cyrillicToLatinVariants['н'] = ['n'];
    cyrillicToLatinVariants['о'] = ['o'];
    cyrillicToLatinVariants['п'] = ['p'];
    cyrillicToLatinVariants['р'] = ['r'];
    cyrillicToLatinVariants['с'] = ['s', 'c'];
    cyrillicToLatinVariants['т'] = ['t'];
    cyrillicToLatinVariants['у'] = ['u', 'oo'];
    cyrillicToLatinVariants['ф'] = ['f', 'ph'];
    cyrillicToLatinVariants['х'] = ['h', 'kh', 'x'];
    cyrillicToLatinVariants['ц'] = ['ts', 'tz', 'c'];
    cyrillicToLatinVariants['ч'] = ['ch', 'tch'];
    cyrillicToLatinVariants['ш'] = ['sh'];
    cyrillicToLatinVariants['щ'] = ['shch', 'sch'];
    cyrillicToLatinVariants['ъ'] = [''];
    cyrillicToLatinVariants['ы'] = ['y', 'i'];
    cyrillicToLatinVariants['ь'] = [''];
    cyrillicToLatinVariants['э'] = ['e'];
    cyrillicToLatinVariants['ю'] = ['yu', 'ju', 'u'];
    cyrillicToLatinVariants['я'] = ['ya', 'ja', 'ia'];
    
    const sortedMultiChar = multiCharMap.sort((a, b) => b.cyr.length - a.cyr.length);
    
    const generateRecursive = (str, index, currentResult, depth = 0) => {
      if (variants.size >= maxVariants || depth > 10) return;
      
      if (index >= str.length) {
        variants.add(currentResult);
        return;
      }
      
      let matched = false;
      
      for (const multi of sortedMultiChar) {
        if (str.substring(index, index + multi.cyr.length) === multi.cyr) {
          for (const latinVar of multi.lat) {
            generateRecursive(str, index + multi.cyr.length, currentResult + latinVar, depth + 1);
          }
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        const char = str[index];
        if (cyrillicToLatinVariants[char]) {
          const options = cyrillicToLatinVariants[char].slice(0, 2);
          for (const latinVar of options) {
            generateRecursive(str, index + 1, currentResult + latinVar, depth + 1);
          }
        } else {
          generateRecursive(str, index + 1, currentResult + char, depth + 1);
        }
      }
    };
    
    generateRecursive(text, 0, '');
    
    const result = Array.from(variants);
    
    if (this._latinCache.size > 1000) {
      this._latinCache.clear();
    }
    this._latinCache.set(text, result);
    
    return result;
  }
  
  matchesWithTranslit(text, query) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    if (lowerText.includes(lowerQuery)) return true;
    
    const textNoSigns = lowerText.replace(/[ьъ]/g, '');
    const queryNoSigns = lowerQuery.replace(/[ьъj]/g, '');
    if (textNoSigns.includes(queryNoSigns)) return true;
    
    const cyrillicCharsText = (lowerText.match(/[а-яёіїєґ]/g) || []).length;
    const latinCharsText = (lowerText.match(/[a-z]/g) || []).length;
    const cyrillicCharsQuery = (lowerQuery.match(/[а-яёіїєґ]/g) || []).length;
    const latinCharsQuery = (lowerQuery.match(/[a-z]/g) || []).length;
    
    const isCyrillicText = cyrillicCharsText > latinCharsText;
    const isLatinText = latinCharsText > cyrillicCharsText;
    const isCyrillicQuery = cyrillicCharsQuery > latinCharsQuery;
    const isLatinQuery = latinCharsQuery > cyrillicCharsQuery;
    
    if (isCyrillicText && isCyrillicQuery) {
      const textLatin = this.translitToLatin(lowerText);
      const queryLatin = this.translitToLatin(lowerQuery);
      if (textLatin.includes(queryLatin)) return true;
    }
    
    if (isCyrillicText && isLatinQuery) {
      const textLatin = this.translitToLatin(lowerText);
      if (textLatin.includes(lowerQuery)) return true;
      
      if (lowerQuery.length <= 10) {
        const cyrillicVariants = this.generateCyrillicVariants(lowerQuery);
        for (const variant of cyrillicVariants) {
          if (lowerText.includes(variant)) return true;
          const variantNoSigns = variant.replace(/[ьъ]/g, '');
          if (textNoSigns.includes(variantNoSigns)) return true;
        }
      }
    }
    
    if ((isLatinText || latinCharsText > 0) && isCyrillicQuery) {
      const queryLatin = this.translitToLatin(lowerQuery);
      if (lowerText.includes(queryLatin)) return true;
      
      if (lowerQuery.length <= 10) {
        const queryLatinVariants = this.generateLatinVariants(lowerQuery);
        for (const variant of queryLatinVariants) {
          if (lowerText.includes(variant.toLowerCase())) return true;
        }
        
        const textNormalized = lowerText.replace(/[_\-0-9]/g, '');
        for (const variant of queryLatinVariants) {
          if (textNormalized.includes(variant.toLowerCase())) return true;
        }
      }
    }
    
    return false;
  }

  async init() {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('tags')) {
          const tagStore = db.createObjectStore('tags', { keyPath: 'name' });
          tagStore.createIndex('count', 'count', { unique: false });
        }

        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'name' });
          videoStore.createIndex('title', 'title', { unique: false });
          videoStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('title', 'title', { unique: false });
          playlistStore.createIndex('channelName', 'channelName', { unique: false });
        }

        if (!db.objectStoreNames.contains('channels')) {
          const channelStore = db.createObjectStore('channels', { keyPath: 'name' });
          channelStore.createIndex('videoCount', 'videoCount', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async isCacheValid(videoCount, playlistCount) {
    await this.init();
    
    try {
      const metadata = await this.getMetadata();
      if (!metadata || !metadata.lastUpdated) {
        if (AUTOCOMPLETE_CACHE_DEBUG) console.log('[AutocompleteCache] No metadata found, cache invalid');
        return false;
      }
      
      const age = Date.now() - metadata.lastUpdated;
      const maxAge = 10 * 60 * 1000;
      
      if (age > maxAge) {
        if (AUTOCOMPLETE_CACHE_DEBUG) console.log(`[AutocompleteCache] Cache expired (age: ${(age/1000).toFixed(0)}s)`);
        return false;
      }
      
      if (metadata.videoCount !== videoCount || metadata.playlistCount !== playlistCount) {
        if (AUTOCOMPLETE_CACHE_DEBUG) console.log('[AutocompleteCache] Data count changed:', {
          cached: { videos: metadata.videoCount, playlists: metadata.playlistCount },
          current: { videos: videoCount, playlists: playlistCount }
        });
        return false;
      }
      
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log(`[AutocompleteCache] ✅ Cache valid (age: ${(age/1000).toFixed(0)}s, videos: ${videoCount}, playlists: ${playlistCount})`);
      return true;
    } catch (error) {
      if (AUTOCOMPLETE_CACHE_DEBUG) console.error('[AutocompleteCache] Error checking cache validity:', error);
      return false;
    }
  }
  
  /**
   * Получить метаданные кэша
   */
  async getMetadata() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const request = transaction.objectStore('metadata').get('cacheInfo');
      
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCache(data) {
    await this.init();

    const transaction = this.db.transaction(
      ['tags', 'videos', 'playlists', 'channels', 'metadata'],
      'readwrite'
    );

    try {
      const tagStore = transaction.objectStore('tags');
      const tagCounts = new Map();
      
      data.videos.forEach(video => {
        if (video.tags && Array.isArray(video.tags)) {
          video.tags.forEach(tag => {
            if (!tag.includes('(ка)')) {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
          });
        }
      });

      for (const [name, count] of tagCounts) {
        tagStore.put({ name, count });
      }

      const videoStore = transaction.objectStore('videos');
      data.videos.forEach(video => {
        videoStore.put({
          name: video.name,
          title: video.title || this.getFileNameWithoutExtension(video.name),
          tags: video.tags || [],
          preview: video.preview,
          duration: video.duration
        });
      });

      const playlistStore = transaction.objectStore('playlists');
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log('[AutocompleteCache] Updating playlists, received:', data.playlists.length);
      data.playlists.forEach(playlist => {
        playlistStore.put({  
          id: playlist.id,
          title: playlist.title,
          channelName: playlist.channelName || null,
          videoCount: playlist.videoCount || 0,
          isChannelPlaylist: playlist.isChannelPlaylist || false
        });
      });
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log('[AutocompleteCache] Playlists saved to IndexedDB');

      const channelStore = transaction.objectStore('channels');
      const channelMap = new Map();
      
      data.playlists.forEach(playlist => {
        if (playlist.channelName && playlist.isChannelPlaylist) {
          if (!channelMap.has(playlist.channelName)) {
            channelMap.set(playlist.channelName, {
              name: playlist.channelName,
              videoNames: new Set()
            });
          }
          const channel = channelMap.get(playlist.channelName);
          if (playlist.videos && Array.isArray(playlist.videos)) {
            playlist.videos.forEach(videoName => {
              channel.videoNames.add(videoName);
            });
          }
        }
      });

      data.videos.forEach(video => {
        if (video.tags && Array.isArray(video.tags)) {
          video.tags.forEach(tag => {
            if (tag.includes('(ка)')) {
              const channelName = tag.replace(/\s*\(ка\)\s*$/, '');
              if (!channelMap.has(channelName)) {
                channelMap.set(channelName, {
                  name: channelName,
                  videoNames: new Set()
                });
              }
              const channel = channelMap.get(channelName);
              channel.videoNames.add(video.name);
            }
          });
        }
      });

      for (const channel of channelMap.values()) {
        channelStore.put({
          name: channel.name,
          videoCount: channel.videoNames.size
        });
      }

      const metaStore = transaction.objectStore('metadata');
      metaStore.put({ 
        key: 'cacheInfo', 
        value: { 
          lastUpdated: Date.now(),
          videoCount: data.videos.length,
          playlistCount: data.playlists.length
        } 
      });

      await this.transactionComplete(transaction);
      
      this.updateMemoryIndex(data, tagCounts, channelMap);
      
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log('[AutocompleteCache] ✅ Cache and memory index updated');
    } catch (error) {
      console.error('Error updating autocomplete cache:', error);
      transaction.abort();
    }
  }

  /**
   * ✅ ОПТИМИЗАЦИЯ: Обновление индекса в памяти для мгновенного поиска
   * КРИТИЧЕСКОЕ УЛУЧШЕНИЕ: Pre-indexing транслитерации
   */
  updateMemoryIndex(data, tagCounts, channelMap) {
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[AutocompleteCache] Memory index update');
    
    this.memoryIndex.videoTitles.clear();
    this.memoryIndex.tagNames.clear();
    this.memoryIndex.playlistTitles.clear();
    this.memoryIndex.channelNames.clear();
    this.memoryIndex.tagInverted.clear();
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[AutocompleteCache] Pre-index video titles');
    data.videos.forEach(v => {
      const title = v.title || this.getFileNameWithoutExtension(v.name);
      const titleLower = title.toLowerCase();
      
      const titleLatin = this.translitToLatin(titleLower);
      const titleCyrVariants = this.isCyrillic(titleLower) ? 
        [] : this.generateCyrillicVariants(titleLower).slice(0, 3);
      const titleLatVariants = this.isCyrillic(titleLower) ? 
        this.generateLatinVariants(titleLower).slice(0, 3) : [];
      
      this.memoryIndex.videoTitles.set(v.name, {
        title: titleLower,
        titleLatin,
        titleCyrVariants,
        titleLatVariants,
        tags: v.tags || [],
        tagsIndex: null
      });
    });
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[AutocompleteCache] Pre-index video titles');
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[AutocompleteCache] Build tag inverted index');
    const tagTranslitCache = new Map();
    
    data.videos.forEach(video => {
      const videoData = this.memoryIndex.videoTitles.get(video.name);
      if (!videoData) return;
      
      const tagsIndex = [];
      
      (video.tags || []).forEach(tag => {
        const tagLower = tag.toLowerCase();
        
        if (!tagTranslitCache.has(tagLower)) {
          const tagLatin = this.translitToLatin(tagLower);
          const tagCyrVariants = this.isCyrillic(tagLower) ? 
            [] : this.generateCyrillicVariants(tagLower).slice(0, 2);
          const tagLatVariants = this.isCyrillic(tagLower) ? 
            this.generateLatinVariants(tagLower).slice(0, 2) : [];
          
          tagTranslitCache.set(tagLower, {
            original: tag,
            lower: tagLower,
            latin: tagLatin,
            cyrVariants: tagCyrVariants,
            latVariants: tagLatVariants
          });
        }
        
        const tagData = tagTranslitCache.get(tagLower);
        tagsIndex.push(tagData);
        
        [tagData.lower, tagData.latin, ...tagData.cyrVariants, ...tagData.latVariants].forEach(variant => {
          if (!variant) return;
          if (!this.memoryIndex.tagInverted.has(variant)) {
            this.memoryIndex.tagInverted.set(variant, new Set());
          }
          this.memoryIndex.tagInverted.get(variant).add(video.name);
        });
      });
      
      videoData.tagsIndex = tagsIndex;
    });
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[AutocompleteCache] Build tag inverted index');
    
    tagCounts.forEach((count, tag) => {
      this.memoryIndex.tagNames.set(tag, count);
    });
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[AutocompleteCache] Pre-index playlists');
    data.playlists.forEach(p => {
      const titleLower = p.title.toLowerCase();
      const titleLatin = this.translitToLatin(titleLower);
      const titleCyrVariants = this.isCyrillic(titleLower) ? 
        [] : this.generateCyrillicVariants(titleLower).slice(0, 3);
      const titleLatVariants = this.isCyrillic(titleLower) ? 
        this.generateLatinVariants(titleLower).slice(0, 3) : [];
      
      this.memoryIndex.playlistTitles.set(p.id, {
        title: titleLower,
        titleLatin,
        titleCyrVariants,
        titleLatVariants,
        videoCount: p.videoCount || 0
      });
    });
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[AutocompleteCache] Pre-index playlists');
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[AutocompleteCache] Pre-index channels');
    channelMap.forEach((channel) => {
      const nameLower = channel.name.toLowerCase();
      const nameLatin = this.translitToLatin(nameLower);
      const nameCyrVariants = this.isCyrillic(nameLower) ? 
        [] : this.generateCyrillicVariants(nameLower).slice(0, 3);
      const nameLatVariants = this.isCyrillic(nameLower) ? 
        this.generateLatinVariants(nameLower).slice(0, 3) : [];
      
      this.memoryIndex.channelNames.set(channel.name, {
        videoCount: channel.videoNames.size,
        nameLower,
        nameLatin,
        nameCyrVariants,
        nameLatVariants
      });
    });
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[AutocompleteCache] Pre-index channels');
    
    if (AUTOCOMPLETE_CACHE_DEBUG) {
      console.timeEnd('[AutocompleteCache] Memory index update');
      console.log('[AutocompleteCache] Memory index updated:', {
        videos: this.memoryIndex.videoTitles.size,
        tags: this.memoryIndex.tagNames.size,
        tagInvertedKeys: this.memoryIndex.tagInverted.size,
        playlists: this.memoryIndex.playlistTitles.size,
        channels: this.memoryIndex.channelNames.size
      });
    }
  }
  
  /**
   * ✅ НОВЫЙ МЕТОД: Загрузка memory index из IndexedDB кэша
   * Вызывается при первой загрузке страницы после перезагрузки ПК
   */
  async loadMemoryIndexFromCache() {
    await this.init();
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[AutocompleteCache] Load memory index from cache');
    
    try {
      const transaction = this.db.transaction(
        ['tags', 'videos', 'playlists', 'channels'],
        'readonly'
      );
      
      const [videos, playlists, tags, channels] = await Promise.all([
        this.getAllFromStore(transaction.objectStore('videos')),
        this.getAllFromStore(transaction.objectStore('playlists')),
        this.getAllFromStore(transaction.objectStore('tags')),
        this.getAllFromStore(transaction.objectStore('channels'))
      ]);
      
      const tagCounts = new Map();
      tags.forEach(tag => tagCounts.set(tag.name, tag.count));
      
      const channelMap = new Map();
      channels.forEach(ch => {
        channelMap.set(ch.name, {
          name: ch.name,
          videoNames: new Set()
        });
        const channel = channelMap.get(ch.name);
        for (let i = 0; i < ch.videoCount; i++) {
          channel.videoNames.add(`video_${i}`);
        }
      });
      
      this.updateMemoryIndex({ videos, playlists }, tagCounts, channelMap);
      
      if (AUTOCOMPLETE_CACHE_DEBUG) {
        console.timeEnd('[AutocompleteCache] Load memory index from cache');
        console.log('[AutocompleteCache] ✅ Memory index loaded from IndexedDB');
      }
      
    } catch (error) {
      if (AUTOCOMPLETE_CACHE_DEBUG) {
        console.error('[AutocompleteCache] Error loading memory index:', error);
        console.timeEnd('[AutocompleteCache] Load memory index from cache');
      }
      throw error;
    }
  }
  
  /**
   * Вспомогательный метод: получить все записи из store
   */
  async getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * ✅ НОВЫЙ МЕТОД: Проверка является ли текст кириллическим
   */
  isCyrillic(text) {
    const cyrillicChars = (text.match(/[а-яёіїєґ]/g) || []).length;
    const latinChars = (text.match(/[a-z]/g) || []).length;
    return cyrillicChars > latinChars;
  }

  /**
   * ✅ Parse tag type prefix from a single term (e.g., "general:anime" -> {prefix: "general", suffix: "gt", value: "anime"})
   */
  parseTagTypePrefix(term) {
    const colonIndex = term.indexOf(':');
    if (colonIndex === -1) return null;
    
    const prefix = term.substring(0, colonIndex).toLowerCase();
    const value = term.substring(colonIndex + 1).trim();
    
    const suffix = this.TAG_TYPE_MAP[prefix];
    if (!suffix) return null;
    
    return { prefix, suffix, value };
  }
  
  /**
   * ✅ Extract the last term from a complex query for autocomplete
   * Handles: "category:anime and rating:r" -> { lastTerm: "rating:r", prefix: "category:anime and " }
   */
  extractLastTerm(query) {
    const operatorPattern = /\s+(and|or|not|&&|\|\||&|\|)\s+|\s+(-)\s*/gi;
    
    let lastMatch = null;
    let match;
    const regex = new RegExp(operatorPattern);
    
    while ((match = regex.exec(query)) !== null) {
      lastMatch = match;
    }
    
    if (lastMatch) {
      const splitIndex = lastMatch.index + lastMatch[0].length;
      return {
        prefix: query.substring(0, splitIndex),
        lastTerm: query.substring(splitIndex).trim()
      };
    }
    
    return {
      prefix: '',
      lastTerm: query.trim()
    };
  }

  async search(query) {
    await this.init();

    if (!query || query.trim().length === 0) {
      return { tags: [], videos: [], playlists: [], channels: [] };
    }

    const lowerQuery = query.toLowerCase();
    
    const cacheKey = lowerQuery;
    const cached = this.searchResultsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.searchCacheTimeout) {
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log(`[AutocompleteCache] 🚀 Cache hit for: "${query}"`);
      return cached.results;
    }
    
    if (AUTOCOMPLETE_CACHE_DEBUG) {
      console.log(`[AutocompleteCache] Searching for: "${query}"`);
      console.time(`[AutocompleteCache] Search: ${query}`);
    }
    
    const { prefix: queryPrefix, lastTerm } = this.extractLastTerm(lowerQuery);
    
    const tagTypeInfo = this.parseTagTypePrefix(lastTerm);
    
    if (tagTypeInfo) {
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log(`[AutocompleteCache] Tag type search: prefix=${tagTypeInfo.prefix}, suffix=${tagTypeInfo.suffix}, value=${tagTypeInfo.value}, queryPrefix="${queryPrefix}"`);
      const tags = this.searchTagsByType(tagTypeInfo.suffix, tagTypeInfo.value, tagTypeInfo.prefix, queryPrefix);
      
      if (AUTOCOMPLETE_CACHE_DEBUG) {
        console.timeEnd(`[AutocompleteCache] Search: ${query}`);
        console.log(`[AutocompleteCache] Tag type results: ${tags.length} tags`);
      }
      
      const results = { tags, videos: [], playlists: [], channels: [] };
      
      this.searchResultsCache.set(cacheKey, { results, timestamp: Date.now() });
      if (this.searchResultsCache.size > this.maxSearchCacheSize) {
        const firstKey = this.searchResultsCache.keys().next().value;
        this.searchResultsCache.delete(firstKey);
      }
      
      return results;
    }
    
    const searchTerm = queryPrefix ? lastTerm : lowerQuery;
    
    const transaction = this.db.transaction(
      ['tags', 'videos', 'playlists', 'channels'],
      'readonly'
    );

    const [tags, videos, playlists, channels] = await Promise.all([
      this.searchTags(transaction.objectStore('tags'), searchTerm, queryPrefix),
      this.searchVideos(transaction.objectStore('videos'), searchTerm),
      this.searchPlaylists(transaction.objectStore('playlists'), searchTerm),
      this.searchChannels(transaction.objectStore('channels'), searchTerm)
    ]);

    if (AUTOCOMPLETE_CACHE_DEBUG) {
      console.timeEnd(`[AutocompleteCache] Search: ${query}`);
      console.log(`[AutocompleteCache] Results: ${tags.length} tags, ${videos.length} videos, ${playlists.length} playlists, ${channels.length} channels`);
    }
    
    const results = { tags, videos, playlists, channels };
    
    this.searchResultsCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });
    
    if (this.searchResultsCache.size > this.maxSearchCacheSize) {
      const firstKey = this.searchResultsCache.keys().next().value;
      this.searchResultsCache.delete(firstKey);
    }
    
    return results;
  }
  
  /**
   * ✅ Search tags by type suffix (e.g., "gt" for general, "ch" for character)
   * Returns tags in format for autocomplete with prefix display
   * @param {string} typeSuffix - Tag type suffix (e.g., "gt", "ch", "at")
   * @param {string} searchValue - Value to search for (e.g., "anime" from "general:anime")
   * @param {string} displayPrefix - Prefix to display (e.g., "general")
   * @param {string} queryPrefix - Prefix of the full query (e.g., "category:anime and " for complex queries)
   */
  searchTagsByType(typeSuffix, searchValue, displayPrefix, queryPrefix = '') {
    if (window.tagDatabaseManager && window.tagDatabaseManager.isLoaded) {
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log(`[searchTagsByType] Using tag database manager with aliases for type: ${typeSuffix}`);
      
      const allTags = window.tagDatabaseManager.getAllTags();
      const results = [];
      const searchLower = searchValue.toLowerCase();
      
      for (const tag of allTags) {
        const match = tag.canonical.match(/^(.+?)\s*\(([a-zа-я]{2,3})\)$/i);
        if (!match) continue;
        
        const tagContent = match[1].trim();
        const tagSuffix = match[2].toLowerCase();
        
        if (tagSuffix !== typeSuffix) continue;
        
        const tagContentLower = tagContent.toLowerCase();
        
        let matched = false;
        
        if (!searchLower) {
          matched = true;
        } else {
          matched = tagContentLower.includes(searchLower);
          
          if (!matched && tag.aliases) {
            for (const alias of tag.aliases) {
              if (alias.toLowerCase().includes(searchLower)) {
                matched = true;
                break;
              }
            }
          }
        }
        
        if (matched) {
          const tagValue = `${displayPrefix}:${tagContent}`;
          const fullValue = queryPrefix + tagValue;
          
          results.push({
            name: tag.canonical,
            displayName: tagValue,
            fullValue: fullValue,
            count: tag.usageCount || 0,
            prefix: displayPrefix,
            content: tagContent,
            queryPrefix: queryPrefix
          });
          
          if (results.length >= 15) break;
        }
      }
      
      results.sort((a, b) => {
        const aExact = a.content.toLowerCase() === searchLower ? 1 : 0;
        const bExact = b.content.toLowerCase() === searchLower ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        
        const aStarts = a.content.toLowerCase().startsWith(searchLower) ? 1 : 0;
        const bStarts = b.content.toLowerCase().startsWith(searchLower) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        
        return b.count - a.count;
      });
      
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log(`[searchTagsByType] DB results: ${results.length} tags`);
      return results.slice(0, 10);
    }
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.log(`[searchTagsByType] Using memory index (no aliases) for type: ${typeSuffix}`);
    
    const results = [];
    const searchLower = searchValue.toLowerCase();
    
    const searchVariants = new Set([searchLower]);
    const isCyrillicSearch = this.isCyrillic(searchLower);
    
    if (searchLower && isCyrillicSearch) {
      searchVariants.add(this.translitToLatin(searchLower));
      const latinVariants = this.generateLatinVariants(searchLower).slice(0, 3);
      latinVariants.forEach(v => searchVariants.add(v));
    } else if (searchLower) {
      const cyrVariants = this.generateCyrillicVariants(searchLower).slice(0, 3);
      cyrVariants.forEach(v => searchVariants.add(v));
    }
    
    for (const [tag, count] of this.memoryIndex.tagNames) {
      const match = tag.match(/^(.+?)\s*\(([a-zа-я]{2,3})\)$/i);
      if (!match) continue;
      
      const tagContent = match[1].trim();
      const tagSuffix = match[2].toLowerCase();
      
      if (tagSuffix !== typeSuffix) continue;
      
      const tagContentLower = tagContent.toLowerCase();
      
      let matched = false;
      
      if (!searchLower) {
        matched = true;
      } else {
        for (const variant of searchVariants) {
          if (tagContentLower.includes(variant)) {
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          const tagContentLatin = this.translitToLatin(tagContentLower);
          for (const variant of searchVariants) {
            if (tagContentLatin.includes(variant)) {
              matched = true;
              break;
            }
          }
        }
      }
      
      if (matched) {
        const tagValue = `${displayPrefix}:${tagContent}`;
        const fullValue = queryPrefix + tagValue;
        
        results.push({
          name: tag,
          displayName: tagValue,
          fullValue: fullValue,
          count,
          prefix: displayPrefix,
          content: tagContent,
          queryPrefix: queryPrefix
        });
        
        if (results.length >= 15) break;
      }
    }
    
    results.sort((a, b) => {
      const aExact = a.content.toLowerCase() === searchLower ? 1 : 0;
      const bExact = b.content.toLowerCase() === searchLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      
      const aStarts = a.content.toLowerCase().startsWith(searchLower) ? 1 : 0;
      const bStarts = b.content.toLowerCase().startsWith(searchLower) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;
      
      return b.count - a.count;
    });
    
    return results.slice(0, 10);
  }

  async searchTags(store, query, queryPrefix = '') {
    if (window.tagDatabaseManager && window.tagDatabaseManager.isLoaded) {
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log('[searchTags] Using tag database manager with aliases');
      
      const dbResults = window.tagDatabaseManager.searchTags(query);
      const results = dbResults.map(tag => {
        const result = { 
          name: tag.canonical, 
          count: tag.usageCount || 0 
        };
        
        const match = tag.canonical.match(/^(.+?)\s*\(([a-zа-я]{2,3})\)$/i);
        if (match) {
          const content = match[1].trim();
          const suffix = match[2].toLowerCase();
          const prefix = this.TAG_SUFFIX_TO_PREFIX[suffix];
          if (prefix) {
            result.prefixValue = `${prefix}:${content}`;
            result.fullValue = queryPrefix + result.prefixValue;
          }
        }
        
        return result;
      }).slice(0, 15);
      
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log(`[searchTags] Tag DB results: ${results.length} tags`);
      return results;
    }
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.log('[searchTags] Using memory index (no aliases)');
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[searchTags] Inverted index lookup');
    
    const results = [];
    const queryLower = query.toLowerCase();
    
    const queryVariants = new Set([queryLower]);
    
    const isCyrillicQuery = this.isCyrillic(queryLower);
    if (isCyrillicQuery) {
      queryVariants.add(this.translitToLatin(queryLower));
      const latinVariants = this.generateLatinVariants(queryLower).slice(0, 3);
      latinVariants.forEach(v => queryVariants.add(v));
    } else {
      const cyrVariants = this.generateCyrillicVariants(queryLower).slice(0, 3);
      cyrVariants.forEach(v => queryVariants.add(v));
    }
    
    const matchedTags = new Map();
    
    for (const [tag, count] of this.memoryIndex.tagNames) {
      const tagLower = tag.toLowerCase();
      
      let matched = false;
      for (const variant of queryVariants) {
        if (tagLower.includes(variant)) {
          matched = true;
          break;
        }
      }
      
      if (matched) {
        matchedTags.set(tag, count);
        if (matchedTags.size >= 20) break;
      }
    }
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[searchTags] Inverted index lookup');
    
    for (const [name, count] of matchedTags) {
      const result = { name, count };
      
      const match = name.match(/^(.+?)\s*\(([a-zа-я]{2,3})\)$/i);
      if (match) {
        const content = match[1].trim();
        const suffix = match[2].toLowerCase();
        const prefix = this.TAG_SUFFIX_TO_PREFIX[suffix];
        if (prefix) {
          const prefixValue = `${prefix}:${content}`;
          result.prefixValue = prefixValue;
          if (queryPrefix) {
            result.fullValue = queryPrefix + prefixValue;
          } else {
            result.fullValue = prefixValue;
          }
        } else if (queryPrefix) {
          result.fullValue = queryPrefix + name;
        }
      } else if (queryPrefix) {
        result.fullValue = queryPrefix + name;
      }
      
      results.push(result);
    }
    
    results.sort((a, b) => b.count - a.count);
    return results.slice(0, 8);
  }

  async searchVideos(store, query) {
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[searchVideos] Pre-indexed search');
    
    const candidateNames = [];
    const queryLower = query.toLowerCase();
    
    const queryVariants = new Set([queryLower]);
    const isCyrillicQuery = this.isCyrillic(queryLower);
    
    if (isCyrillicQuery) {
      queryVariants.add(this.translitToLatin(queryLower));
    }
    
    for (const [name, data] of this.memoryIndex.videoTitles) {
      let titleMatch = false;
      let tagMatch = false;
      
      for (const variant of queryVariants) {
        if (data.title.includes(variant) ||
            data.titleLatin.includes(variant)) {
          titleMatch = true;
          break;
        }
      }
      
      if (!titleMatch) {
        if (isCyrillicQuery) {
          for (const titleVar of data.titleLatVariants) {
            if (titleVar.includes(queryLower)) {
              titleMatch = true;
              break;
            }
          }
        } else {
          for (const titleVar of data.titleCyrVariants) {
            if (titleVar.includes(queryLower)) {
              titleMatch = true;
              break;
            }
          }
        }
      }
      
      if (!titleMatch && data.tagsIndex) {
        for (const tagData of data.tagsIndex) {
          let matched = false;
          
          for (const variant of queryVariants) {
            if (tagData.lower.includes(variant) ||
                tagData.latin.includes(variant)) {
              matched = true;
              break;
            }
          }
          
          if (!matched) {
            if (isCyrillicQuery) {
              for (const tagVar of tagData.latVariants) {
                if (tagVar.includes(queryLower)) {
                  matched = true;
                  break;
                }
              }
            } else {
              for (const tagVar of tagData.cyrVariants) {
                if (tagVar.includes(queryLower)) {
                  matched = true;
                  break;
                }
              }
            }
          }
          
          if (matched) {
            tagMatch = true;
            break;
          }
        }
      }
      
      if (titleMatch || tagMatch) {
        candidateNames.push({
          name,
          relevance: titleMatch ? 2 : 1
        });
      }
      
      if (candidateNames.length >= 20) break;
    }
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[searchVideos] Pre-indexed search');
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[searchVideos] IndexedDB fetch');
    const results = await Promise.all(
      candidateNames.map(async ({ name, relevance }) => {
        const video = await this.getVideoByName(store, name);
        return video ? { ...video, relevance } : null;
      })
    );
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[searchVideos] IndexedDB fetch');
    
    const filtered = results.filter(v => v !== null);
    filtered.sort((a, b) => {
      if (a.relevance !== b.relevance) return b.relevance - a.relevance;
      return a.title.localeCompare(b.title);
    });
    
    return filtered.slice(0, 6);
  }

  /**
   * ✅ НОВЫЙ МЕТОД: Получение видео по имени из store
   */
  async getVideoByName(store, name) {
    return new Promise((resolve) => {
      const request = store.get(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async searchPlaylists(store, query) {
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[searchPlaylists] Pre-indexed search');
    
    const candidateIds = [];
    const queryLower = query.toLowerCase();
    
    const queryVariants = new Set([queryLower]);
    const isCyrillicQuery = this.isCyrillic(queryLower);
    
    if (isCyrillicQuery) {
      queryVariants.add(this.translitToLatin(queryLower));
    }
    
    for (const [id, data] of this.memoryIndex.playlistTitles) {
      let matched = false;
      
      for (const variant of queryVariants) {
        if (data.title.includes(variant) ||
            data.titleLatin.includes(variant)) {
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        if (isCyrillicQuery) {
          for (const titleVar of data.titleLatVariants) {
            if (titleVar.includes(queryLower)) {
              matched = true;
              break;
            }
          }
        } else {
          for (const titleVar of data.titleCyrVariants) {
            if (titleVar.includes(queryLower)) {
              matched = true;
              break;
            }
          }
        }
      }
      
      if (matched) {
        candidateIds.push({ id, videoCount: data.videoCount });
        if (candidateIds.length >= 15) break;
      }
    }
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[searchPlaylists] Pre-indexed search');
    
    const results = await Promise.all(
      candidateIds.map(async ({ id }) => {
        return await this.getPlaylistById(store, id);
      })
    );
    
    const filtered = results.filter(p => p !== null);
    filtered.sort((a, b) => b.videoCount - a.videoCount);
    
    return filtered.slice(0, 5);
  }

  /**
   * ✅ НОВЫЙ МЕТОД: Получение плейлиста по ID из store
   */
  async getPlaylistById(store, id) {
    return new Promise((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async searchChannels(store, query) {
    if (AUTOCOMPLETE_CACHE_DEBUG) console.time('[searchChannels] Pre-indexed search');
    
    const candidateNames = [];
    const queryLower = query.toLowerCase();
    
    const queryVariants = new Set([queryLower]);
    const isCyrillicQuery = this.isCyrillic(queryLower);
    
    if (isCyrillicQuery) {
      queryVariants.add(this.translitToLatin(queryLower));
    }
    
    for (const [name, data] of this.memoryIndex.channelNames) {
      let matched = false;
      
      for (const variant of queryVariants) {
        if (data.nameLower.includes(variant) ||
            data.nameLatin.includes(variant)) {
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        if (isCyrillicQuery) {
          for (const nameVar of data.nameLatVariants) {
            if (nameVar.includes(queryLower)) {
              matched = true;
              break;
            }
          }
        } else {
          for (const nameVar of data.nameCyrVariants) {
            if (nameVar.includes(queryLower)) {
              matched = true;
              break;
            }
          }
        }
      }
      
      if (matched) {
        candidateNames.push({ name, videoCount: data.videoCount });
        if (candidateNames.length >= 12) break;
      }
    }
    
    if (AUTOCOMPLETE_CACHE_DEBUG) console.timeEnd('[searchChannels] Pre-indexed search');
    
    const results = await Promise.all(
      candidateNames.map(async ({ name }) => {
        return await this.getChannelByName(store, name);
      })
    );
    
    const filtered = results.filter(c => c !== null && c !== undefined);
    
    if (filtered.length === 0) {
      return [];
    }
    
    filtered.sort((a, b) => b.videoCount - a.videoCount);
    
    return filtered.slice(0, 4);
  }

  async getChannelByName(store, name) {
    return new Promise((resolve) => {
      const request = store.get(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async getLastUpdated() {
    await this.init();

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const request = transaction.objectStore('metadata').get('cacheInfo');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result && result.value ? result.value.lastUpdated : null);
      };

      request.onerror = () => resolve(null);
    });
  }

  async clearCache() {
    await this.init();

    const transaction = this.db.transaction(
      ['tags', 'videos', 'playlists', 'channels', 'metadata'],
      'readwrite'
    );

    try {
      await Promise.all([
        this.clearStore(transaction.objectStore('tags')),
        this.clearStore(transaction.objectStore('videos')),
        this.clearStore(transaction.objectStore('playlists')),
        this.clearStore(transaction.objectStore('channels')),
        this.clearStore(transaction.objectStore('metadata'))
      ]);

      await this.transactionComplete(transaction);
      if (AUTOCOMPLETE_CACHE_DEBUG) console.log('[AutocompleteCache] IndexedDB cache cleared');
    } catch (error) {
      console.error('[AutocompleteCache] Error clearing cache:', error);
      transaction.abort();
    }
  }

  clearStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  getFileNameWithoutExtension(name) {
    return name.replace(/\.[^/.]+$/, '');
  }
}

window.autocompleteCache = new AutocompleteCache();