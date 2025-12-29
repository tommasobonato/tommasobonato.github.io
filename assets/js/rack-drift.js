/**
 * Rack Drift - Physics-based floating animation for the datacenter rack
 * Rack only floats in left/right margins, wraps around Pac-Man style
 * Click for a funny tooltip message
 */
(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    speed: 0.22, // Base movement speed (px per frame) - reduced for slower drift
    tumbleSpeedX: 0.08, // Rotation speed around X axis (deg per frame)
    tumbleSpeedY: 0.07, // Rotation speed around Y axis (deg per frame)
    tumbleSpeedZ: 0.04, // Rotation speed around Z axis (deg per frame)
    marginFromEdge: 20, // Min px from viewport edge
    directionChangeChance: 0.003, // Chance per frame to slightly change direction
    tooltipDuration: 4000, // How long tooltip shows (ms) - increased for readability
  };

  // First message is always shown on first click, then random from the rest
  const FIRST_MESSAGE = "🆘 Help! I'm a DC rack lost in space!";

  const HELP_MESSAGES = [
    "🚀 Houston, we have a problem...",
    "📡 Is anyone out there? Send packets!",
    "🌌 I used to route traffic, now I just float...",
    "❄️ At least cooling isn't a problem here!",
    "🔌 Anyone got a really long ethernet cable?",
    "🛸 I've seen things you wouldn't believe...",
    "💾 All my VMs escaped. Send help.",
    "🌡️ Finally, infinite free cooling!",
    "🔧 My SSD is now a shooting star...",
    "📶 Looking for WiFi signal... still looking...",
    "🐛 There's a bug in my orbit.",
    "💫 I wanted cloud computing, not THIS cloud!",
    "🎮 At least the ping is consistently infinite.",
    "🔋 Running on cosmic radiation power.",
    "📊 Latency to Earth: ∞ ms",
    "🗄️ Someone forgot to rack me properly...",
    "🌍 404: Data center not found on any planet.",
    "⚡ My UPS is a dying star.",
    "🤖 The AI said 'go to the cloud'. I went too far.",
    "🧊 Zero-K cooling achieved! Not recommended.",
    "🔥 At least I'm not overheating anymore!",
    "📡 Still waiting for that BGP convergence...",
    "🛰️ Accidentally routed myself to /dev/null",
    "💽 My RAID array is now an asteroid belt.",
    "🌑 Dark mode: permanently enabled.",
    "🎯 Packet loss: 100%. At least it's consistent!",
    "🌠 My blinkenlights are now just stars.",
    "🔐 Security through obscurity: achieved via orbit.",
    "📧 Emails? They're somewhere near Jupiter now.",
    "🎵 The sound of one server floating...",
    "🧲 My magnetic tape backup became a comet tail.",
    "⏰ Time synchronization issues: now cosmic-scale.",
    "🔄 Spinning up disks... oh wait, everything spins here.",
    "🌐 Connected to the universal network. No DNS though.",
    "💡 My status LEDs are now navigational beacons.",
    "🎪 From rack space to outer space. Big upgrade?",
    "🔍 grep -r 'home' /universe returns nothing...",
    "📦 Containerized deployment gone wrong.",
    "🌊 Floating point errors: now literal.",
    "🎭 Method acting as a satellite. Nailed it.",
  ];

  let rack = null;
  let tooltip = null;
  let isAnimating = false;
  let animationId = null;
  let isPaused = false;
  let isFirstClick = true; // Track if this is the first click
  let tooltipTimeoutId = null; // Track tooltip timeout to prevent premature hiding

  // Current state
  let posX = 50;
  let posY = 100;
  let velX = 0.3;
  let velY = 0.2;
  let rotX = 0;
  let rotY = 0;
  let rotZ = -12;
  let tumbleVelX = CONFIG.tumbleSpeedX;
  let tumbleVelY = CONFIG.tumbleSpeedY;
  let tumbleVelZ = CONFIG.tumbleSpeedZ;

  // Cached bounds
  let contentRect = null;
  let viewportW = 0;
  let viewportH = 0;
  let rackW = 70;
  let rackH = 105;
  let isOnLeftSide = true; // Track which side we're on

  // Check for reduced motion preference
  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Check if desktop (matches CSS media query)
  function isDesktop() {
    return window.innerWidth >= 1024;
  }

  // Update cached bounds
  function updateBounds() {
    viewportW = window.innerWidth;
    viewportH = window.innerHeight;
    rackW = rack ? rack.offsetWidth : 70;
    rackH = rack ? rack.offsetHeight : 105;

    // Get main content bounding box
    const content =
      document.querySelector("main") ||
      document.querySelector(".container") ||
      document.querySelector("article") ||
      document.querySelector("#content");

    if (content) {
      const rect = content.getBoundingClientRect();
      // Add scroll offset for fixed positioning
      contentRect = {
        left: rect.left,
        right: rect.right,
        top: 0,
        bottom: viewportH,
      };
    } else {
      // Fallback: center 60% of screen
      contentRect = {
        left: viewportW * 0.2,
        right: viewportW * 0.8,
        top: 0,
        bottom: viewportH,
      };
    }
  }

  // Get the left margin zone bounds
  function getLeftZone() {
    return {
      xMin: CONFIG.marginFromEdge,
      xMax: Math.max(CONFIG.marginFromEdge + rackW, (contentRect?.left || viewportW * 0.2) - rackW - 10),
      yMin: CONFIG.marginFromEdge,
      yMax: viewportH - rackH - CONFIG.marginFromEdge,
    };
  }

  // Get the right margin zone bounds
  function getRightZone() {
    return {
      xMin: Math.min(viewportW - CONFIG.marginFromEdge - rackW - 50, (contentRect?.right || viewportW * 0.8) + 10),
      xMax: viewportW - rackW - CONFIG.marginFromEdge,
      yMin: CONFIG.marginFromEdge,
      yMax: viewportH - rackH - CONFIG.marginFromEdge,
    };
  }

  // Physics update - only move in left/right margins, wrap around like Pac-Man
  function update() {
    // Random direction micro-adjustments for organic movement
    if (Math.random() < CONFIG.directionChangeChance) {
      velY += (Math.random() - 0.5) * 0.15;
      // Keep vertical speed reasonable
      velY = Math.max(-CONFIG.speed, Math.min(CONFIG.speed, velY));
    }

    // Get current zone
    const zone = isOnLeftSide ? getLeftZone() : getRightZone();

    // Calculate next position
    let nextX = posX + velX;
    let nextY = posY + velY;

    // Horizontal bounds - wrap around Pac-Man style
    if (isOnLeftSide) {
      // On left side, moving left wraps to right
      if (nextX < zone.xMin - rackW) {
        isOnLeftSide = false;
        const rightZone = getRightZone();
        nextX = rightZone.xMax;
        posX = nextX;
        velX = -Math.abs(velX); // Move left on right side
      } else if (nextX > zone.xMax) {
        // Hit content wall, bounce back
        nextX = zone.xMax;
        velX = -Math.abs(velX);
      }
    } else {
      // On right side, moving right wraps to left
      if (nextX > zone.xMax + rackW) {
        isOnLeftSide = true;
        const leftZone = getLeftZone();
        nextX = leftZone.xMin;
        posX = nextX;
        velX = Math.abs(velX); // Move right on left side
      } else if (nextX < zone.xMin) {
        // Hit content wall, bounce back
        nextX = zone.xMin;
        velX = Math.abs(velX);
      }
    }

    // Vertical bounds - bounce off top/bottom
    if (nextY < zone.yMin) {
      nextY = zone.yMin;
      velY = Math.abs(velY) * (0.9 + Math.random() * 0.2);
    } else if (nextY > zone.yMax) {
      nextY = zone.yMax;
      velY = -Math.abs(velY) * (0.9 + Math.random() * 0.2);
    }

    // Update position
    posX = nextX;
    posY = nextY;

    // Update tumble rotation (continuous 3D rotation)
    rotX += tumbleVelX;
    rotY += tumbleVelY;
    rotZ += tumbleVelZ;

    // Keep angles reasonable
    rotX = rotX % 360;
    rotY = rotY % 360;
    rotZ = rotZ % 360;
  }

  // Render
  function render() {
    if (!rack) return;
    rack.style.transform = `translate3d(${posX}px, ${posY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
  }

  // Animation loop
  function animate() {
    if (!isAnimating || isPaused) return;

    update();
    render();

    // Update popup position if visible (follows rack in real-time)
    if (clickMePopup && clickMePopup.classList.contains("visible")) {
      updatePopupPosition();
    }

    animationId = requestAnimationFrame(animate);
  }

  // Show tooltip with funny message
  function showTooltip(e) {
    if (!rack || !tooltip) return;

    // Hide the click-me popup if visible
    hideClickMePopup();

    // Prevent event bubbling that might cause issues
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Clear any existing timeout to prevent premature hiding
    if (tooltipTimeoutId) {
      clearTimeout(tooltipTimeoutId);
      tooltipTimeoutId = null;
    }

    // First click always shows the \"lost in space\" message
    let message;
    if (isFirstClick) {
      message = FIRST_MESSAGE;
      isFirstClick = false;
    } else {
      message = HELP_MESSAGES[Math.floor(Math.random() * HELP_MESSAGES.length)];
    }

    tooltip.textContent = message;
    tooltip.classList.add("visible");

    // Position tooltip near the rack
    const rackRect = rack.getBoundingClientRect();
    tooltip.style.left = `${rackRect.left + rackW / 2}px`;
    tooltip.style.top = `${rackRect.top - 10}px`;

    tooltipTimeoutId = setTimeout(() => {
      tooltip.classList.remove("visible");
      tooltipTimeoutId = null;
    }, CONFIG.tooltipDuration);
  }

  // Create tooltip element
  function createTooltip() {
    tooltip = document.createElement("div");
    tooltip.className = "rack-tooltip";
    tooltip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tooltip);
  }

  // Create and show click-me popup after 15 seconds (one-time)
  let clickMePopup = null;
  let popupShown = false;

  function createClickMePopup() {
    if (popupShown || !isDesktop()) return;

    clickMePopup = document.createElement("div");
    clickMePopup.className = "dc-rack-popup";
    clickMePopup.textContent = "👆 Click on me!";
    clickMePopup.setAttribute("aria-hidden", "true");
    document.body.appendChild(clickMePopup);

    // Position and show the popup after delay
    setTimeout(() => {
      if (!rack || !clickMePopup || popupShown) return;
      popupShown = true;

      // Position near the rack
      updatePopupPosition();
      clickMePopup.classList.add("visible");

      // Hide after 6 seconds
      setTimeout(() => {
        if (clickMePopup) {
          clickMePopup.classList.remove("visible");
          setTimeout(() => {
            if (clickMePopup) {
              clickMePopup.remove();
              clickMePopup = null;
            }
          }, 400);
        }
      }, 6000);
    }, 15000);
  }

  function updatePopupPosition() {
    if (!rack || !clickMePopup) return;
    const rackRect = rack.getBoundingClientRect();
    // Center horizontally on the rack's center, position below the rack
    const centerX = rackRect.left + rackRect.width / 2;
    const bottomY = rackRect.bottom + 12;
    clickMePopup.style.left = `${centerX}px`;
    clickMePopup.style.top = `${bottomY}px`;
    clickMePopup.style.transform = "translateX(-50%)";
  }

  // Hide popup on rack click
  function hideClickMePopup() {
    if (clickMePopup) {
      clickMePopup.classList.remove("visible");
    }
  }

  // Start animation
  function startDrift() {
    if (!rack || isAnimating || !isDesktop()) return;

    if (prefersReducedMotion()) {
      // Static position for reduced motion
      rack.style.transform = "translate3d(30px, 100px, 0) rotateZ(-12deg)";
      return;
    }

    updateBounds();

    // Start on left side
    isOnLeftSide = true;
    const zone = getLeftZone();
    posX = zone.xMin + Math.random() * (zone.xMax - zone.xMin);
    posY = zone.yMin + Math.random() * (zone.yMax - zone.yMin);

    // Initial velocity - mostly horizontal
    velX = (Math.random() > 0.5 ? 1 : -1) * CONFIG.speed;
    velY = (Math.random() - 0.5) * CONFIG.speed * 0.5;

    isAnimating = true;
    isPaused = false;
    animate();
  }

  // Stop animation
  function stopDrift() {
    isAnimating = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // Pause/resume on visibility change
  function handleVisibilityChange() {
    if (document.hidden) {
      isPaused = true;
    } else {
      isPaused = false;
      if (isAnimating) {
        animate();
      }
    }
  }

  // Handle resize
  function handleResize() {
    updateBounds();

    const zone = isOnLeftSide ? getLeftZone() : getRightZone();

    // Ensure rack stays in current zone after resize
    posX = Math.max(zone.xMin, Math.min(zone.xMax, posX));
    posY = Math.max(zone.yMin, Math.min(zone.yMax, posY));

    // On mobile, stop drifting
    if (!isDesktop() && isAnimating) {
      stopDrift();
    } else if (isDesktop() && !isAnimating && document.body.classList.contains("space-on")) {
      startDrift();
    }
  }

  // Initialize
  function init() {
    rack = document.querySelector(".space-datacenter");
    if (!rack) return;

    // Make rack clickable for tooltip
    rack.style.pointerEvents = "auto";
    rack.style.cursor = "pointer";
    rack.addEventListener("click", showTooltip);

    // Override CSS positioning - we control it via JS transforms
    rack.style.left = "0";
    rack.style.bottom = "auto";
    rack.style.top = "0";
    rack.style.transformStyle = "preserve-3d";

    // Create tooltip
    createTooltip();

    // Create click-me popup (will show after 15 seconds)
    createClickMePopup();

    updateBounds();

    // Start drift if space mode is on and we're on desktop
    if (document.body.classList.contains("space-on") && isDesktop()) {
      startDrift();
    }

    // Listen for space-on toggle
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          if (document.body.classList.contains("space-on") && isDesktop()) {
            startDrift();
          } else {
            stopDrift();
          }
        }
      }
    });
    observer.observe(document.body, { attributes: true });

    // Visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Resize listener (debounced)
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 200);
    });

    // Update bounds on scroll (content position may change)
    let scrollTimeout;
    window.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateBounds, 100);
      },
      { passive: true }
    );
  }

  // Run on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
