/**
 * Universal Autocomplete Initializer
 * Automatically initializes autocomplete on any YouVi page with search input
 */

(async function initUniversalAutocomplete() {
  if (typeof YouviAutocomplete === 'undefined' || typeof AutocompleteIntegration === 'undefined') {
    console.warn('[Autocomplete Init] Required classes not loaded');
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUniversalAutocomplete);
    return;
  }

  const searchInput = document.getElementById('headerSearchInput');
  if (!searchInput) {
    console.log('[Autocomplete Init] No search input found on this page');
    return;
  }

  if (searchInput.dataset.autocompleteInitialized) {
    console.log('[Autocomplete Init] Already initialized');
    return;
  }

  try {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (!window.videoDirectoryHandle && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.videoDirectoryHandle) {
      console.warn('[Autocomplete Init] Video directory handle not available');
      return;
    }

    attempts = 0;
    while ((!window.allVideos || !window.allPlaylists) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.allVideos || !window.allPlaylists) {
      console.warn('[Autocomplete Init] Video/playlist data not available');
      return;
    }

    console.log('[Autocomplete Init] Initializing autocomplete...');

    const autocompleteIntegration = new AutocompleteIntegration();
    await autocompleteIntegration.init(searchInput, {
      videoDirectoryHandle: window.videoDirectoryHandle,
      allVideos: window.allVideos,
      allPlaylists: window.allPlaylists
    });

    searchInput.dataset.autocompleteInitialized = 'true';
    
    console.log('[Autocomplete Init] Successfully initialized!');
  } catch (error) {
    console.error('[Autocomplete Init] Failed to initialize:', error);
  }
})();