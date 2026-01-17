/**
 * Shared Danmaku Counter Module
 * Loads danmaku counts from .metadata folders and updates video data
 */

const DanmakuCounter = (function() {
    let loaded = false;
    const counts = new Map();

    async function load(videoDirectoryHandle, allVideos) {
        if (loaded || !videoDirectoryHandle) return counts;
        
        const fileHandles = [];

        async function scanMetadataDir(dir) {
            try {
                const metaDir = await dir.getDirectoryHandle('.metadata', { create: false });
                for await (const [name, handle] of metaDir.entries()) {
                    if (handle.kind === 'file' && name.endsWith('.danmaku.json')) {
                        fileHandles.push({ name, handle });
                    }
                }
            } catch (e) { /* no .metadata */ }
        }

        async function scanRecursive(dir) {
            const scanPromise = scanMetadataDir(dir);
            const subdirPromises = [];
            for await (const [name, handle] of dir.entries()) {
                if (handle.kind === 'directory' && !name.startsWith('.')) {
                    subdirPromises.push(scanRecursive(handle));
                }
            }
            await Promise.all([scanPromise, ...subdirPromises]);
        }

        await scanRecursive(videoDirectoryHandle);

        const BATCH_SIZE = 10;
        for (let i = 0; i < fileHandles.length; i += BATCH_SIZE) {
            const batch = fileHandles.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async ({ name, handle }) => {
                try {
                    const file = await handle.getFile();
                    const data = JSON.parse(await file.text());
                    const videoName = name.replace('.danmaku.json', '');
                    counts.set(videoName, Array.isArray(data) ? data.length : 0);
                } catch (e) { /* skip */ }
            }));
        }

        if (allVideos) {
            allVideos.forEach(v => {
                const count = counts.get(v.name);
                if (count !== undefined) v.danmakuCount = count;
            });
        }

        loaded = true;
        return counts;
    }

    function get(videoName) {
        return counts.get(videoName) || 0;
    }

    function updateUI() {
        document.querySelectorAll('[data-video-name]').forEach(card => {
            const el = card.querySelector('.video-danmaku');
            if (el) {
                const count = counts.get(card.getAttribute('data-video-name'));
                if (count !== undefined) el.textContent = count;
            }
        });
    }

    function isLoaded() { return loaded; }
    function getCounts() { return counts; }

    return { load, get, updateUI, isLoaded, getCounts };
})();

if (typeof window !== 'undefined') window.DanmakuCounter = DanmakuCounter;
