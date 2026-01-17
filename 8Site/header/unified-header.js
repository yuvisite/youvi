
function initSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const query = searchInput.value.trim();
      if (query) {
        location.href = `youvi_search.html?q=${encodeURIComponent(query)}`;
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const query = searchInput.value.trim();
        if (query) {
          location.href = `youvi_search.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

function initNavigationButtons() {
  const openInYouviBtn = document.getElementById('openInYouviBtn');
  const openInScreenBtn = document.getElementById('openInScreenBtn');
  const goHomeBtn = document.getElementById('goHome');

  if (openInYouviBtn) {
    openInYouviBtn.addEventListener('click', () => {
      const params = new URLSearchParams(location.search);
      if (params.get('channel')) {
        const activeTab = document.querySelector('.tab.active');
        const tabName = activeTab ? activeTab.dataset.tab : 'home';
        
        if (tabName === 'feed') {
          location.href = `youvi_ch_feed.html?channel=${encodeURIComponent(params.get('channel'))}`;
        } else if (tabName === 'analytics' || tabName === 'description') {
          location.href = `youvi_ch_view.html?channel=${encodeURIComponent(params.get('channel'))}&tab=${tabName}`;
        } else {
          location.href = `youvi_ch_view.html?channel=${encodeURIComponent(params.get('channel'))}`;
        }
      } else {
        location.href = 'youvi_main.html';
      }
    });
  }

  if (openInScreenBtn) {
    openInScreenBtn.addEventListener('click', () => {
      const params = new URLSearchParams(location.search);
      if (params.get('channel')) {
        location.href = `screen_video.html?${params.toString()}`;
      } else {
        location.href = 'screen_main.html';
      }
    });
  }

  if (goHomeBtn) {
    goHomeBtn.addEventListener('click', () => {
      location.href = 'youvi_main.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initNavigationButtons();
});