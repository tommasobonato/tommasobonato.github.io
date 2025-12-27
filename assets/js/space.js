// No <script> tags here
(function () {
  // Create starfield element
  function createStarfieldElement() {
    if (document.getElementById("starfield")) return;
    const starfield = document.createElement("div");
    starfield.id = "starfield";
    document.body.appendChild(starfield);
  }

  // Global toggle used by fixed button
  window.toggleStarfield = function () {
    document.body.classList.toggle("space-on");
    updateStarfieldButton();
  };

  function updateStarfieldButton() {
    const btn = document.getElementById("starfield-toggle-btn");
    if (!btn) return;
    const isOn = document.body.classList.contains("space-on");
    btn.classList.toggle("active", isOn);
    btn.innerHTML = isOn ? '🌌<span class="toggle-indicator on">ON</span>' : '🌌<span class="toggle-indicator off">OFF</span>';
  }

  function createStarfieldButton() {
    const btn = document.createElement("button");
    btn.id = "starfield-toggle-btn";
    btn.className = "starfield-toggle-btn";
    btn.title = "Toggle Stars";
    btn.addEventListener("click", window.toggleStarfield);
    document.body.appendChild(btn);
    updateStarfieldButton();
  }

  // On by default
  if (document && document.body) {
    document.body.classList.add("space-on");
  }

  // Konami code trigger (↑ ↑ ↓ ↓ ← → ← → b a)
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let i = 0;
  window.addEventListener("keydown", (e) => {
    i = e.key === code[i] ? i + 1 : 0;
    if (i === code.length) {
      window.toggleStarfield();
      i = 0;
    }
  });

  // Init button on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      createStarfieldElement();
      createStarfieldButton();
      initParallax();
    });
  } else {
    createStarfieldElement();
    createStarfieldButton();
    initParallax();
  }

  // Parallax effect for 3D depth
  function initParallax() {
    const starfield = document.getElementById("starfield");
    if (!starfield) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener(
      "mousemove",
      (e) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        targetX = (e.clientX - centerX) / centerX;
        targetY = (e.clientY - centerY) / centerY;
      },
      { passive: true }
    );

    function animate() {
      // Smooth interpolation
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      // Apply parallax transform (subtle shift)
      const moveX = currentX * 15;
      const moveY = currentY * 10;
      starfield.style.transform = `translate(${moveX}px, ${moveY}px)`;

      requestAnimationFrame(animate);
    }

    // Only run parallax if motion is allowed
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animate();
    }
  }
})();
