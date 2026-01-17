
class AvatarBatchLoader {
    constructor() {
        this.queue = new Map();
        this.cache = new Map();
        this.processing = false;
        this.batchDelay = 50;
        this.batchTimer = null;
    }
    
    async load(channelName) {
        if (this.cache.has(channelName)) {
            return this.cache.get(channelName);
        }
        
        return new Promise((resolve) => {
            if (!this.queue.has(channelName)) {
                this.queue.set(channelName, []);
            }
            this.queue.get(channelName).push(resolve);
            
            this.scheduleBatch();
        });
    }
    
    scheduleBatch() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }
        
        this.batchTimer = setTimeout(() => {
            this.processBatch();
        }, this.batchDelay);
    }
    
    async processBatch() {
        if (this.processing || this.queue.size === 0) {
            return;
        }
        
        this.processing = true;
        const batch = Array.from(this.queue.entries());
        this.queue.clear();
        
        const PARALLEL_LIMIT = 5;
        for (let i = 0; i < batch.length; i += PARALLEL_LIMIT) {
            const chunk = batch.slice(i, i + PARALLEL_LIMIT);
            await Promise.all(chunk.map(async ([channelName, callbacks]) => {
                try {
                    let avatarUrl = null;
                    
                    if (window.loadChannelAvatar) {
                        avatarUrl = await window.loadChannelAvatar(channelName);
                    }
                    
                    this.cache.set(channelName, avatarUrl);
                    
                    callbacks.forEach(callback => callback(avatarUrl));
                } catch (error) {
                    console.error('Error loading avatar for', channelName, error);
                    callbacks.forEach(callback => callback(null));
                }
            }));
        }
        
        this.processing = false;
        
        if (this.queue.size > 0) {
            this.scheduleBatch();
        }
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    getCacheSize() {
        return this.cache.size;
    }
}

window.avatarBatchLoader = new AvatarBatchLoader();