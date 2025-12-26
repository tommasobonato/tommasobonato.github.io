/**
 * Birba Gallery Easter Egg
 * A photo gallery of Birba the dog with age calculator
 */
(function() {
  'use strict';

  // Birba's birthday
  const BIRBA_BIRTHDAY = new Date(2008, 5, 21); // June 21, 2008

  // State
  const state = {
    isOpen: false,
    currentIndex: 0,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // DOM refs
  let btn, overlay, closeBtn, prevBtn, nextBtn, imageEl, counterEl, ageEl;

  // Calculate Birba's age
  function calculateAge() {
    const now = new Date();
    const diff = now - BIRBA_BIRTHDAY;
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365.25);
    const remainingDays = Math.floor(totalDays % 365.25);
    return { years, days: remainingDays };
  }

  // Get images from global array
  function getImages() {
    return window.BIRBA_IMAGES || [];
  }

  // Update displayed image
  function updateImage() {
    const images = getImages();
    if (images.length === 0) return;
    
    const src = images[state.currentIndex];
    if (state.reducedMotion) {
      imageEl.src = src;
    } else {
      imageEl.style.opacity = '0';
      setTimeout(() => {
        imageEl.src = src;
        imageEl.style.opacity = '1';
      }, 150);
    }
    counterEl.textContent = `${state.currentIndex + 1} / ${images.length}`;
  }

  // Navigation - stops at boundaries, no looping
  function nextImage() {
    const images = getImages();
    if (images.length === 0) return;
    if (state.currentIndex < images.length - 1) {
      state.currentIndex++;
      updateImage();
      updateNavButtons();
    }
  }

  function prevImage() {
    const images = getImages();
    if (images.length === 0) return;
    if (state.currentIndex > 0) {
      state.currentIndex--;
      updateImage();
      updateNavButtons();
    }
  }

  // Update nav button states (disable at boundaries)
  function updateNavButtons() {
    const images = getImages();
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.disabled = state.currentIndex >= images.length - 1;
    prevBtn.style.opacity = state.currentIndex === 0 ? '0.3' : '1';
    nextBtn.style.opacity = state.currentIndex >= images.length - 1 ? '0.3' : '1';
  }

  // Open/close
  function open() {
    // Close other overlays first (mutually exclusive, except stars)
    if (window.closeLeoMesh) window.closeLeoMesh();
    if (window.closeMissionTerminal) window.closeMissionTerminal();
    
    state.isOpen = true;
    overlay.classList.add('open');
    btn.classList.add('active');
    updateImage();
    updateAge();
    updateNavButtons();
  }

  function close() {
    state.isOpen = false;
    overlay.classList.remove('open');
    btn.classList.remove('active');
  }

  // Expose close function globally for other easter eggs
  window.closeBirbaGallery = close;

  function toggle() {
    state.isOpen ? close() : open();
  }

  function updateAge() {
    const age = calculateAge();
    ageEl.textContent = `Best friend with Tommaso for ${age.years} years and ${age.days} days`;
  }

  // Keyboard navigation
  function handleKeyDown(e) {
    if (!state.isOpen) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  }

  // Create DOM
  function createDOM() {
    // Button - position next to terminal button
    btn = document.createElement('button');
    btn.className = 'birba-gallery-btn';
    btn.setAttribute('aria-label', 'Open Birba Gallery');
    btn.setAttribute('title', 'Birba gallery');
    btn.innerHTML = '<span class="birba-icon">🐶</span><span class="toggle-indicator"></span>';
    btn.addEventListener('click', toggle);

    // Overlay
    overlay = document.createElement('div');
    overlay.className = 'birba-gallery-overlay';
    if (state.reducedMotion) {
      overlay.classList.add('reduced-motion');
    }
    
    const images = getImages();
    const hasImages = images.length > 0;
    
    overlay.innerHTML = `
      <div class="birba-gallery-header">
        <span class="birba-gallery-title">🐶 Birba</span>
        <button class="birba-gallery-close" title="Close">&times;</button>
      </div>
      <div class="birba-gallery-age">
        <span class="birba-age-value"></span>
      </div>
      <div class="birba-gallery-body">
        ${hasImages ? `
          <button class="birba-nav birba-prev" aria-label="Previous">‹</button>
          <div class="birba-image-container">
            <img class="birba-image" src="" alt="Birba the dog" />
          </div>
          <button class="birba-nav birba-next" aria-label="Next">›</button>
        ` : `
          <div class="birba-no-images">No photos found</div>
        `}
      </div>
      ${hasImages ? `<div class="birba-gallery-counter"></div>` : ''}
    `;

    closeBtn = overlay.querySelector('.birba-gallery-close');
    ageEl = overlay.querySelector('.birba-age-value');
    
    if (hasImages) {
      prevBtn = overlay.querySelector('.birba-prev');
      nextBtn = overlay.querySelector('.birba-next');
      imageEl = overlay.querySelector('.birba-image');
      counterEl = overlay.querySelector('.birba-gallery-counter');
      
      prevBtn.addEventListener('click', prevImage);
      nextBtn.addEventListener('click', nextImage);
      
      // Swipe support for touch devices
      let touchStartX = 0;
      overlay.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      overlay.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? nextImage() : prevImage();
        }
      }, { passive: true });
    }

    closeBtn.addEventListener('click', close);

    document.body.appendChild(btn);
    document.body.appendChild(overlay);

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
  }

  // Init
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createDOM);
    } else {
      createDOM();
    }
  }

  init();
})();
