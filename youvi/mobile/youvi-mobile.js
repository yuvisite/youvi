/**
 * Youvi Mobile UI
 * Мобильный адаптив с вкладками для страницы видео
 */

(function() {
    'use strict';

    const MOBILE_BREAKPOINT = 768;
    let isMobileView = false;
    let mobileTabsContainer = null;
    let currentMobileTab = 'danmaku';
    let sidebarOverlay = null;

    function checkMobileView() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function createSidebarOverlay() {
        if (document.getElementById('mobileSidebarOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'mobileSidebarOverlay';
        overlay.className = 'mobile-sidebar-overlay';
        document.body.appendChild(overlay);
        sidebarOverlay = overlay;

        overlay.addEventListener('click', closeMobileSidebar);
    }

    function createSidebarCloseBtn() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar || sidebar.querySelector('.mobile-sidebar-close')) return;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'mobile-sidebar-close';
        closeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        `;
        closeBtn.addEventListener('click', closeMobileSidebar);
        sidebar.insertBefore(closeBtn, sidebar.firstChild);
    }

    function openMobileSidebar() {
        document.body.classList.add('sidebar-open');
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
        document.body.classList.remove('sidebar-open');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    function setupBurgerMenu() {
        const originalToggleSidebar = window.toggleSidebar;
        
        window.toggleSidebar = function() {
            if (isMobileView) {
                if (document.body.classList.contains('sidebar-open')) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            } else if (originalToggleSidebar) {
                originalToggleSidebar();
            }
        };
    }

    function createMobileUI() {
        if (document.getElementById('mobileTabsContainer')) return;

        const container = document.createElement('div');
        container.id = 'mobileTabsContainer';
        container.className = 'mobile-tabs-container';
        container.style.display = 'none';

        container.innerHTML = `
            <div class="mobile-tabs-header">
                <button class="mobile-tab-btn active" data-tab="danmaku">
                    Данмаку <span class="tab-count" id="mobileDanmakuCount">0</span>
                </button>
                <button class="mobile-tab-btn" data-tab="comments">
                    Комментарии <span class="tab-count" id="mobileCommentsCount"></span>
                </button>
                <button class="mobile-tab-btn" data-tab="description">
                    Описание
                </button>
                <button class="mobile-tab-btn" data-tab="playlist">
                    Плейлист
                </button>
                <button class="mobile-tab-btn" data-tab="recommendations">
                    Похожие
                </button>
            </div>
            <div class="mobile-tabs-content">
                <div class="mobile-tab-panel active" data-tab="danmaku">
                    <div class="mobile-danmaku-list" id="mobileDanmakuList"></div>
                    <div class="mobile-danmaku-input-container">
                        <input type="text" class="mobile-danmaku-input" id="mobileDanmakuInputField" placeholder="Написать данмаку...">
                        <button class="mobile-danmaku-send-btn" id="mobileDanmakuSendBtn">Отпр.</button>
                    </div>
                </div>
                <div class="mobile-tab-panel" data-tab="comments">
                    <div class="mobile-comments-list" id="mobileCommentsListContainer"></div>
                </div>
                <div class="mobile-tab-panel" data-tab="description">
                    <div class="mobile-description-content" id="mobileDescContent"></div>
                </div>
                <div class="mobile-tab-panel" data-tab="playlist">
                    <div class="mobile-playlist-header" id="mobilePlaylistHdr" style="display:none;">
                        <span class="mobile-playlist-title" id="mobilePlaylistTitleText"></span>
                        <div class="mobile-playlist-controls">
                            <button class="mobile-playlist-btn" id="mobilePlaylistInvertBtn" title="Инвертировать">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <polyline points="19 12 12 19 5 12"/>
                                </svg>
                            </button>
                            <button class="mobile-playlist-btn" id="mobilePlaylistLoopBtn" title="Зациклить">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="17 1 21 5 17 9"/>
                                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                    <polyline points="7 23 3 19 7 15"/>
                                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                                </svg>
                            </button>
                            <button class="mobile-playlist-btn" id="mobilePlaylistShuffleBtn" title="Перемешать">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="16 3 21 3 21 8"/>
                                    <line x1="4" y1="20" x2="21" y2="3"/>
                                    <polyline points="21 16 21 21 16 21"/>
                                    <line x1="15" y1="15" x2="21" y2="21"/>
                                    <line x1="4" y1="4" x2="9" y2="9"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="mobile-playlist-list" id="mobilePlaylistListContainer"></div>
                </div>
                <div class="mobile-tab-panel" data-tab="recommendations">
                    <div class="mobile-recommendations-list" id="mobileRecsListContainer"></div>
                </div>
            </div>
        `;

        const videoInfo = document.querySelector('.video-info');
        if (videoInfo && videoInfo.parentNode) {
            videoInfo.parentNode.insertBefore(container, videoInfo.nextSibling);
        } else {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.appendChild(container);
            }
        }

        mobileTabsContainer = container;
        setupMobileTabEvents();
        setupMobileDanmakuInput();
    }

    function setupMobileTabEvents() {
        const tabs = mobileTabsContainer.querySelectorAll('.mobile-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                switchMobileTab(tabName);
            });
        });
    }

    function switchMobileTab(tabName) {
        currentMobileTab = tabName;

        const tabs = mobileTabsContainer.querySelectorAll('.mobile-tab-btn');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        const panels = mobileTabsContainer.querySelectorAll('.mobile-tab-panel');
        panels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.tab === tabName);
        });

        loadMobileTabContent(tabName);
    }

    function loadMobileTabContent(tabName) {
        switch(tabName) {
            case 'danmaku':
                syncDanmakuToMobile();
                break;
            case 'comments':
                syncCommentsToMobile();
                break;
            case 'description':
                syncDescriptionToMobile();
                break;
            case 'playlist':
                syncPlaylistToMobile();
                break;
            case 'recommendations':
                syncRecommendationsToMobile();
                break;
        }
    }

    function syncDanmakuToMobile() {
        const desktopList = document.getElementById('danmakuCommentsList');
        const mobileList = document.getElementById('mobileDanmakuList');
        if (!desktopList || !mobileList) return;

        // Copy count
        const desktopCount = document.getElementById('danmakuCommentsCount');
        const mobileCountEl = document.getElementById('mobileDanmakuCount');
        
        if (desktopCount && mobileCountEl) {
            mobileCountEl.textContent = desktopCount.textContent;
        }

        // Copy innerHTML for normal rendering
        mobileList.innerHTML = desktopList.innerHTML;
    }

    function syncCommentsToMobile() {
        const desktopComments = document.getElementById('commentsContainer');
        const mobileList = document.getElementById('mobileCommentsListContainer');
        if (!desktopComments || !mobileList) return;

        mobileList.innerHTML = desktopComments.innerHTML;

        const desktopCountEl = document.getElementById('commentsCount');
        const mobileCountEl = document.getElementById('mobileCommentsCount');
        if (desktopCountEl && mobileCountEl) {
            mobileCountEl.textContent = desktopCountEl.textContent;
        }
    }

    function syncDescriptionToMobile() {
        const descriptionText = document.getElementById('descriptionText');
        const mobileContent = document.getElementById('mobileDescContent');

        if (mobileContent && descriptionText) {
            mobileContent.innerHTML = descriptionText.innerHTML;
            
            syncParentChildToMobile();
        }
    }

    function syncParentChildToMobile() {
        const desktopSection = document.getElementById('parentChildSection');
        const mobileContent = document.getElementById('mobileDescContent');
        if (!mobileContent) return;

        const oldSection = mobileContent.parentElement.querySelector('.mobile-parent-child-section');
        if (oldSection) oldSection.remove();

        if (!desktopSection) return;

        const videoCards = desktopSection.querySelectorAll('.pc-video-card');
        if (videoCards.length === 0) return;

        const mobileSection = document.createElement('div');
        mobileSection.className = 'mobile-parent-child-section';

        let html = '<div class="mobile-parent-child-title">Связанные видео</div>';
        html += '<div class="mobile-parent-child-list">';

        videoCards.forEach(card => {
            const thumb = card.querySelector('.pc-video-thumb img');
            const title = card.querySelector('.pc-video-title');
            const relation = card.querySelector('.pc-video-relation');
            
            let link = '#';
            const onclick = card.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
                if (match) link = match[1];
            }
            if (card.dataset.href) link = card.dataset.href;

            const thumbSrc = thumb?.src || '';
            const titleText = title?.textContent?.trim() || 'Видео';
            const relationText = relation?.textContent?.trim() || '';

            html += `
                <div class="mobile-parent-child-item" onclick="window.location.href='${link}'">
                    ${thumbSrc ? `<img class="mobile-parent-child-thumb" src="${thumbSrc}" alt="">` : '<div class="mobile-parent-child-thumb"></div>'}
                    <div class="mobile-parent-child-info">
                        <div class="mobile-parent-child-item-title">${titleText}</div>
                        ${relationText ? `<div class="mobile-parent-child-relation">${relationText}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        mobileSection.innerHTML = html;
        
        mobileContent.parentElement.appendChild(mobileSection);
    }

    function syncPlaylistToMobile() {
        const desktopPlaylist = document.getElementById('playlistContent');
        const mobileList = document.getElementById('mobilePlaylistListContainer');
        const mobileHeader = document.getElementById('mobilePlaylistHdr');
        const mobileTitle = document.getElementById('mobilePlaylistTitleText');

        if (!mobileList) return;

        const desktopTitle = document.getElementById('playlistTitle');
        if (desktopTitle && mobileTitle) {
            mobileTitle.textContent = desktopTitle.textContent;
            if (mobileHeader) {
                mobileHeader.style.display = desktopTitle.textContent ? 'flex' : 'none';
            }
        }

        if (desktopPlaylist) {
            mobileList.innerHTML = desktopPlaylist.innerHTML;
        }

        syncPlaylistControls();
    }

    function syncPlaylistControls() {
        const desktopLoop = document.getElementById('playlistLoopBtn');
        const desktopShuffle = document.getElementById('playlistShuffleBtn');
        const mobileLoop = document.getElementById('mobilePlaylistLoopBtn');
        const mobileShuffle = document.getElementById('mobilePlaylistShuffleBtn');

        if (desktopLoop && mobileLoop) {
            mobileLoop.classList.toggle('active', desktopLoop.classList.contains('active'));
        }
        if (desktopShuffle && mobileShuffle) {
            mobileShuffle.classList.toggle('active', desktopShuffle.classList.contains('active'));
        }
    }

    function syncRecommendationsToMobile() {
        const desktopRecs = document.getElementById('recommendationsSidebar');
        const mobileList = document.getElementById('mobileRecsListContainer');
        if (!desktopRecs || !mobileList) return;

        const videoCards = desktopRecs.querySelectorAll('.video-card-sidebar, .recommendation-item, [class*="video-card"]');
        
        if (videoCards.length === 0) {
            const content = desktopRecs.querySelector('.section-title-right');
            if (content) {
                mobileList.innerHTML = desktopRecs.innerHTML;
                const title = mobileList.querySelector('.section-title-right');
                if (title) title.remove();
            }
        } else {
            mobileList.innerHTML = '';
            videoCards.forEach(card => {
                mobileList.appendChild(card.cloneNode(true));
            });
        }
    }

    function setupMobileDanmakuInput() {
        const input = document.getElementById('mobileDanmakuInputField');
        const sendBtn = document.getElementById('mobileDanmakuSendBtn');

        if (!input || !sendBtn) return;

        const sendDanmaku = () => {
            const text = input.value.trim();
            if (!text) return;

            if (typeof window.sendDanmakuComment === 'function') {
                window.sendDanmakuComment(text);
            } else if (typeof window.addDanmaku === 'function') {
                window.addDanmaku(text);
            } else {
                const desktopInput = document.getElementById('danmakuInput') || 
                                     document.querySelector('.danmaku-input input');
                if (desktopInput) {
                    desktopInput.value = text;
                    desktopInput.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    const form = desktopInput.closest('form');
                    if (form) {
                        form.dispatchEvent(new Event('submit', { bubbles: true }));
                    } else {
                        const submitBtn = desktopInput.parentElement?.querySelector('button[type="submit"], .danmaku-send-btn');
                        if (submitBtn) submitBtn.click();
                    }
                }
            }

            input.value = '';
        };

        sendBtn.addEventListener('click', sendDanmaku);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendDanmaku();
            }
        });

        const mobileInvert = document.getElementById('mobilePlaylistInvertBtn');
        const mobileLoop = document.getElementById('mobilePlaylistLoopBtn');
        const mobileShuffle = document.getElementById('mobilePlaylistShuffleBtn');

        if (mobileInvert) {
            mobileInvert.addEventListener('click', () => {
                const desktopBtn = document.getElementById('playlistInvertBtn');
                if (desktopBtn) desktopBtn.click();
                setTimeout(syncPlaylistToMobile, 100);
            });
        }

        if (mobileLoop) {
            mobileLoop.addEventListener('click', () => {
                const desktopBtn = document.getElementById('playlistLoopBtn');
                if (desktopBtn) desktopBtn.click();
                mobileLoop.classList.toggle('active');
            });
        }

        if (mobileShuffle) {
            mobileShuffle.addEventListener('click', () => {
                const desktopBtn = document.getElementById('playlistShuffleBtn');
                if (desktopBtn) desktopBtn.click();
                mobileShuffle.classList.toggle('active');
                setTimeout(syncPlaylistToMobile, 100);
            });
        }
    }

    function toggleMobileUI(show) {
        if (!mobileTabsContainer) return;
        mobileTabsContainer.style.display = show ? 'flex' : 'none';
        
        if (show) {
            loadMobileTabContent(currentMobileTab);
        }
    }

    function handleResize() {
        const wasMobile = isMobileView;
        isMobileView = checkMobileView();

        if (isMobileView !== wasMobile) {
            toggleMobileUI(isMobileView);
            
            if (!isMobileView) {
                document.body.classList.remove('sidebar-open');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                }
                document.body.style.overflow = '';
            }
        }
    }

    function setupMutationObserver() {
        let danmakuSyncTimeout = null;
        
        const observer = new MutationObserver((mutations) => {
            if (!isMobileView) return;

            mutations.forEach(mutation => {
                const target = mutation.target;
                
                if (target.id === 'danmakuCommentsList' || target.closest('#danmakuCommentsList')) {
                    if (currentMobileTab === 'danmaku') {
                        // Debounce danmaku sync to avoid excessive updates with virtual lists
                        if (danmakuSyncTimeout) clearTimeout(danmakuSyncTimeout);
                        danmakuSyncTimeout = setTimeout(() => {
                            requestAnimationFrame(syncDanmakuToMobile);
                        }, 100);
                    }
                }
                if (target.id === 'commentsContainer' || target.closest('#commentsContainer')) {
                    if (currentMobileTab === 'comments') {
                        requestAnimationFrame(syncCommentsToMobile);
                    }
                }
                if (target.id === 'playlistContent' || target.closest('#playlistContent')) {
                    if (currentMobileTab === 'playlist') {
                        requestAnimationFrame(syncPlaylistToMobile);
                    }
                }
                if (target.id === 'recommendationsSidebar' || target.closest('#recommendationsSidebar')) {
                    if (currentMobileTab === 'recommendations') {
                        requestAnimationFrame(syncRecommendationsToMobile);
                    }
                }
                if (target.id === 'parentChildSection' || target.closest('#parentChildSection')) {
                    if (currentMobileTab === 'description') {
                        requestAnimationFrame(syncParentChildToMobile);
                    }
                }
                if (target.id === 'commentsCount') {
                    const mobileCountEl = document.getElementById('mobileCommentsCount');
                    if (mobileCountEl) {
                        mobileCountEl.textContent = target.textContent;
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function init() {
        createMobileUI();
        createSidebarOverlay();
        createSidebarCloseBtn();
        setupBurgerMenu();
        
        isMobileView = checkMobileView();
        toggleMobileUI(isMobileView);

        window.addEventListener('resize', debounce(handleResize, 150));
        setupMutationObserver();

        window.YouviMobile = {
            syncDanmaku: syncDanmakuToMobile,
            syncComments: syncCommentsToMobile,
            syncDescription: syncDescriptionToMobile,
            syncPlaylist: syncPlaylistToMobile,
            syncRecommendations: syncRecommendationsToMobile,
            syncParentChild: syncParentChildToMobile,
            switchTab: switchMobileTab,
            refresh: () => loadMobileTabContent(currentMobileTab),
            isMobile: () => isMobileView,
            openSidebar: openMobileSidebar,
            closeSidebar: closeMobileSidebar
        };

        console.log('[YouviMobile] Initialized');
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();