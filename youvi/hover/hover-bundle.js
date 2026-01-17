/**
 * Hover Preview System Bundle
 * Complete hover preview system for YouVi video cards
 * 
 * Usage:
 * 1. Include this file in your HTML: <script src="youvi/hover/hover-bundle.js"></script>
 * 2. Use the provided functions to add hover previews to your video cards
 * 
 * Example:
 *
 * addHoverPreview(thumbnailElement, videoData);
 * 
 *
 * initCarouselHoverPreviews('carousel-id', videosDataArray);
 * 
 *
 * initGridHoverPreviews('grid-id', videosDataArray);
 * 
 *
 * autoInitHoverPreviews('container-id', videosDataArray);
 */

if (typeof window !== 'undefined') {
  const DEBUG = false;
  if (DEBUG) console.log('YouVi Hover Preview System loaded');
  
  window.YouViHover = {
    addHoverPreview: window.addHoverPreview,
    clearAllHoverPreviews: window.clearAllHoverPreviews,
    
    initCarouselHoverPreviews: window.initCarouselHoverPreviews,
    initGridHoverPreviews: window.initGridHoverPreviews,
    initSearchHoverPreviews: window.initSearchHoverPreviews,
    autoInitHoverPreviews: window.autoInitHoverPreviews,
    batchInitHoverPreviews: window.batchInitHoverPreviews,
    
    initHoverWithCleanup: window.initHoverWithCleanup,
    calculateVideoSegments: window.calculateVideoSegments,
    
    hoverPreviewQueue: window.hoverPreviewQueue,
    
    presets: {
      default: {
        hoverDelay: 500,
        segmentDuration: 4,
        segmentCount: 8,
        borderRadius: '6px'
      },
      fast: {
        hoverDelay: 250,
        segmentDuration: 3,
        segmentCount: 6,
        borderRadius: '6px'
      },
      slow: {
        hoverDelay: 1000,
        segmentDuration: 5,
        segmentCount: 10,
        borderRadius: '6px'
      }
    }
  };
  
  if (!document.getElementById('youvi-hover-styles')) {
    const style = document.createElement('style');
    style.id = 'youvi-hover-styles';
    style.textContent = `
      .video-card .video-thumbnail {
        position: relative;
        overflow: hidden;
      }
      
      .video-card .video-thumbnail video {
        transition: opacity 0.2s ease-in-out;
      }
      
      .video-card:hover .video-thumbnail video {
        opacity: 1;
      }
      
      .video-card .video-thumbnail .video-duration,
      .video-card .video-thumbnail .latest-duration {
        z-index: 10 !important;
      }
      
      .video-card .video-thumbnail .video-quality,
      .video-card .video-thumbnail .video-new {
        z-index: 10 !important;
      }
    `;
    document.head.appendChild(style);
  }
}