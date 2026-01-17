/**
 * YouVi Video Cards System Bundle
 * Complete cards system with CSS and JavaScript
 * 
 * Usage:
 * <script src="youvi/cards/cards-bundle.js"></script>
 * 
 * Or include separately:
 * <link rel="stylesheet" href="youvi/cards/video-cards.css">
 * <script src="youvi/cards/video-cards.js"></script>
 */

(function() {
    const cssId = 'youvi-cards-css';
    if (!document.getElementById(cssId)) {
        const head = document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'youvi/cards/video-cards.css';
        link.media = 'all';
        head.appendChild(link);
    }
})();

(function() {
    if (typeof window.YouViCards === 'undefined') {
        const script = document.createElement('script');
        script.src = 'youvi/cards/video-cards.js';
        script.onload = function() {
            if (typeof initVideoCards === 'function') {
                initVideoCards();
            }
        };
        document.head.appendChild(script);
    } else {
        if (typeof initVideoCards === 'function') {
            initVideoCards();
        }
    }
})();

window.YouViCardsPresets = {
    default: {
        showQuality: true,
        showNew: true,
        showDuration: true,
        showViews: true,
        showChannel: true,
        showCategory: false
    },
    
    playlist: {
        showNumber: true,
        showQuality: true,
        showNew: false,
        showDuration: true,
        showViews: true,
        showChannel: true,
        showCategory: false
    },
    
    subscription: {
        showQuality: true,
        showNew: true,
        showDuration: true,
        showViews: true,
        showChannel: true,
        showCategory: false
    },
    
    latest: {
        cardType: 'latest',
        showChannel: true,
        showViews: false
    },
    
    compact: {
        showQuality: false,
        showNew: false,
        showDuration: true,
        showViews: false,
        showChannel: false,
        showCategory: false,
        titleClass: 'video-card-title compact'
    }
};

console.log('YouVi Cards Bundle loaded successfully');