/**
 * Packet Rocket Easter Egg
 * Hover over the site name for 600ms to launch a packet rocket to Publications
 */
(function () {
  "use strict";

  const HOVER_DELAY = 600;
  const FLIGHT_DURATION = 900;
  const PULSE_DURATION = 300;

  let hoverTimer = null;
  let rocketInFlight = false;

  // Check for reduced motion preference
  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cubic Bezier interpolation for smooth curve
  function cubicBezier(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }

  // Get the Publications nav link
  function getPublicationsLink() {
    const byId = document.getElementById("nav-publications");
    if (byId) return byId;
    // Fallback: find link containing /publications
    return document.querySelector('a.nav-link[href*="/publications"]');
  }

  // Show reduced-motion tooltip
  function showReducedMotionTooltip(anchorEl) {
    const tooltip = document.createElement("div");
    tooltip.className = "packet-tooltip";
    tooltip.textContent = "📦 packet delivered";
    document.body.appendChild(tooltip);

    const rect = anchorEl.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 8}px`;

    requestAnimationFrame(() => tooltip.classList.add("visible"));

    setTimeout(() => {
      tooltip.classList.remove("visible");
      setTimeout(() => tooltip.remove(), 200);
    }, 1000);

    // Still pulse the target
    const pubLink = getPublicationsLink();
    if (pubLink) {
      pubLink.classList.add("packet-pulse");
      setTimeout(() => pubLink.classList.remove("packet-pulse"), PULSE_DURATION);
    }
  }

  // Launch the rocket animation
  function launchRocket(startEl) {
    if (rocketInFlight) return;

    const pubLink = getPublicationsLink();
    if (!pubLink) return;

    // Reduced motion: show tooltip instead
    if (prefersReducedMotion()) {
      showReducedMotionTooltip(startEl);
      return;
    }

    rocketInFlight = true;

    // Get positions
    const startRect = startEl.getBoundingClientRect();
    const endRect = pubLink.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;

    // Control points for curved path (arc upward)
    const midX = (startX + endX) / 2;
    const arcHeight = Math.min(80, Math.abs(endX - startX) * 0.3);
    const cp1x = startX + (endX - startX) * 0.25;
    const cp1y = Math.min(startY, endY) - arcHeight;
    const cp2x = startX + (endX - startX) * 0.75;
    const cp2y = Math.min(startY, endY) - arcHeight * 1.2;

    // Create rocket element
    const rocket = document.createElement("div");
    rocket.className = "packet-rocket";
    rocket.innerHTML = '<span class="rocket-icon">📦</span><span class="rocket-trail"></span>';
    rocket.style.left = `${startX}px`;
    rocket.style.top = `${startY}px`;
    document.body.appendChild(rocket);

    // Animate
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / FLIGHT_DURATION);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      const x = cubicBezier(eased, startX, cp1x, cp2x, endX);
      const y = cubicBezier(eased, startY, cp1y, cp2y, endY);

      // Calculate angle for rotation
      const nextT = Math.min(1, (elapsed + 16) / FLIGHT_DURATION);
      const nextEased = 1 - Math.pow(1 - nextT, 3);
      const nextX = cubicBezier(nextEased, startX, cp1x, cp2x, endX);
      const nextY = cubicBezier(nextEased, startY, cp1y, cp2y, endY);
      const angle = Math.atan2(nextY - y, nextX - x) * (180 / Math.PI);

      rocket.style.transform = `translate3d(${x - startX}px, ${y - startY}px, 0) rotate(${angle}deg)`;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Arrival: remove rocket and pulse target
        rocket.classList.add("arrived");
        setTimeout(() => rocket.remove(), 150);

        pubLink.classList.add("packet-pulse");
        setTimeout(() => {
          pubLink.classList.remove("packet-pulse");
          rocketInFlight = false;
        }, PULSE_DURATION);
      }
    }

    requestAnimationFrame(animate);
  }

  // Initialize
  function init() {
    const hoverName = document.getElementById("hover-name");
    if (!hoverName) return;

    hoverName.addEventListener("mouseenter", () => {
      if (rocketInFlight) return;
      hoverTimer = setTimeout(() => launchRocket(hoverName), HOVER_DELAY);
    });

    siteName.addEventListener("mouseleave", () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
