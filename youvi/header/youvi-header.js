document.addEventListener('DOMContentLoaded', function() {
  const globalSearch = document.getElementById('globalSearch');
  const doSearchBtn = document.getElementById('doSearch');
  
  if (doSearchBtn) {
    doSearchBtn.addEventListener('click', () => {
      const query = (globalSearch?.value || '').trim();
      if (query) {
        window.location.href = `youvi_search.html?q=${encodeURIComponent(query)}`;
      }
    });
  }
  
  if (globalSearch) {
    globalSearch.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const query = (globalSearch.value || '').trim();
        if (query) {
          window.location.href = `youvi_search.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }
});