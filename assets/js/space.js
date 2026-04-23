// No <script> tags here
(function () {
  // Saturn SVG as data URI (enhanced with banding, highlight, two-tone rings)
  const saturnSVG = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" fill="none"><defs><linearGradient id="saturnBody" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f0e4c0"/><stop offset="25%" stop-color="#e8d5a3"/><stop offset="50%" stop-color="#d4c191"/><stop offset="75%" stop-color="#c9b07a"/><stop offset="100%" stop-color="#a08050"/></linearGradient><linearGradient id="saturnShadow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="rgba(50,35,15,0.45)"/><stop offset="60%" stop-color="transparent"/></linearGradient><radialGradient id="saturnHighlight" cx="35%" cy="30%" r="40%"><stop offset="0%" stop-color="rgba(255,255,240,0.35)"/><stop offset="100%" stop-color="transparent"/></radialGradient><linearGradient id="ringOuter" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(220,210,180,0.5)"/><stop offset="30%" stop-color="rgba(200,185,150,0.7)"/><stop offset="50%" stop-color="rgba(170,150,110,0.4)"/><stop offset="70%" stop-color="rgba(195,175,140,0.65)"/><stop offset="100%" stop-color="rgba(210,195,160,0.45)"/></linearGradient><linearGradient id="ringInner" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(160,140,100,0.4)"/><stop offset="50%" stop-color="rgba(140,120,85,0.6)"/><stop offset="100%" stop-color="rgba(130,110,75,0.35)"/></linearGradient><linearGradient id="ringShadowOnPlanet" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="transparent"/><stop offset="45%" stop-color="transparent"/><stop offset="50%" stop-color="rgba(40,30,15,0.15)"/><stop offset="55%" stop-color="transparent"/><stop offset="100%" stop-color="transparent"/></linearGradient><clipPath id="ringBack"><rect x="0" y="0" width="200" height="60"/></clipPath><clipPath id="ringFront"><rect x="0" y="60" width="200" height="60"/></clipPath></defs><g clip-path="url(#ringBack)"><ellipse cx="100" cy="60" rx="95" ry="22" fill="none" stroke="url(#ringOuter)" stroke-width="10" opacity="0.65"/><ellipse cx="100" cy="60" rx="82" ry="19" fill="none" stroke="url(#ringInner)" stroke-width="8" opacity="0.55"/><ellipse cx="100" cy="60" rx="70" ry="16" fill="none" stroke="url(#ringOuter)" stroke-width="4" opacity="0.4"/></g><circle cx="100" cy="60" r="35" fill="url(#saturnBody)"/><ellipse cx="100" cy="48" rx="33" ry="3" fill="rgba(200,175,130,0.18)"/><ellipse cx="100" cy="54" rx="34" ry="4" fill="rgba(170,140,95,0.22)"/><ellipse cx="100" cy="62" rx="34" ry="5" fill="rgba(190,160,110,0.15)"/><ellipse cx="100" cy="70" rx="32" ry="4" fill="rgba(180,150,100,0.2)"/><ellipse cx="100" cy="60" rx="35" ry="35" fill="url(#ringShadowOnPlanet)"/><circle cx="100" cy="60" r="35" fill="url(#saturnShadow)"/><circle cx="100" cy="60" r="35" fill="url(#saturnHighlight)"/><g clip-path="url(#ringFront)"><ellipse cx="100" cy="60" rx="95" ry="22" fill="none" stroke="url(#ringOuter)" stroke-width="10" opacity="0.75"/><ellipse cx="100" cy="60" rx="82" ry="19" fill="none" stroke="url(#ringInner)" stroke-width="8" opacity="0.6"/><ellipse cx="100" cy="60" rx="70" ry="16" fill="none" stroke="url(#ringOuter)" stroke-width="4" opacity="0.45"/></g></svg>`
  )}`;

  // Blue planet SVG (Neptune/Uranus style, no rings)
  const bluePlanetSVG = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><defs><linearGradient id="blueBody" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7ec8e8"/><stop offset="30%" stop-color="#5ba3c9"/><stop offset="60%" stop-color="#3d8ab5"/><stop offset="100%" stop-color="#2a6a8f"/></linearGradient><linearGradient id="blueShadow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="rgba(15,35,55,0.5)"/><stop offset="65%" stop-color="transparent"/></linearGradient><radialGradient id="blueHighlight" cx="32%" cy="28%" r="35%"><stop offset="0%" stop-color="rgba(200,235,255,0.4)"/><stop offset="100%" stop-color="transparent"/></radialGradient><radialGradient id="blueGlow" cx="50%" cy="50%" r="50%"><stop offset="85%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(100,180,220,0.15)"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#blueGlow)"/><circle cx="50" cy="50" r="42" fill="url(#blueBody)"/><ellipse cx="50" cy="38" rx="40" ry="4" fill="rgba(140,200,230,0.15)"/><ellipse cx="50" cy="48" rx="41" ry="5" fill="rgba(80,150,190,0.12)"/><ellipse cx="50" cy="58" rx="40" ry="4" fill="rgba(100,170,210,0.1)"/><ellipse cx="50" cy="66" rx="38" ry="3" fill="rgba(70,140,180,0.12)"/><circle cx="50" cy="50" r="42" fill="url(#blueShadow)"/><circle cx="50" cy="50" r="42" fill="url(#blueHighlight)"/></svg>`
  )}`;

  // Datacenter rack SVG (stylized server rack with LEDs, many blinking)
  const datacenterSVG = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120" fill="none"><defs><linearGradient id="rackBody" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="50%" stop-color="#2a2a48"/><stop offset="100%" stop-color="#1a1a2e"/></linearGradient><linearGradient id="rackEdge" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3d3d5c"/><stop offset="50%" stop-color="#5a5a7a"/><stop offset="100%" stop-color="#3d3d5c"/></linearGradient><linearGradient id="serverFace" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#3a3a5c"/><stop offset="100%" stop-color="#2a2a45"/></linearGradient><radialGradient id="ledGreen" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#4ade80"/><stop offset="60%" stop-color="#22c55e"/><stop offset="100%" stop-color="#166534"/></radialGradient><radialGradient id="ledBlue" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#60a5fa"/><stop offset="60%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></radialGradient><radialGradient id="ledAmber" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fbbf24"/><stop offset="60%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></radialGradient><radialGradient id="ledRed" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f87171"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></radialGradient><radialGradient id="ledWhite" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="60%" stop-color="#e0e0e0"/><stop offset="100%" stop-color="#a0a0a0"/></radialGradient><filter id="ledGlow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="5" y="5" width="70" height="110" rx="3" fill="url(#rackBody)" stroke="url(#rackEdge)" stroke-width="1.5"/><rect x="8" y="8" width="64" height="104" rx="2" fill="#0d0d1a" stroke="#2a2a45" stroke-width="0.5"/><g id="servers"><rect x="12" y="12" width="56" height="14" rx="1" fill="url(#serverFace)"/><rect x="12" y="28" width="56" height="14" rx="1" fill="url(#serverFace)"/><rect x="12" y="44" width="56" height="14" rx="1" fill="url(#serverFace)"/><rect x="12" y="60" width="56" height="14" rx="1" fill="url(#serverFace)"/><rect x="12" y="76" width="56" height="14" rx="1" fill="url(#serverFace)"/><rect x="12" y="92" width="56" height="14" rx="1" fill="url(#serverFace)"/></g><g id="vents" fill="#1a1a30"><rect x="32" y="14" width="16" height="10" rx="1"/><rect x="32" y="30" width="16" height="10" rx="1"/><rect x="32" y="46" width="16" height="10" rx="1"/><rect x="32" y="62" width="16" height="10" rx="1"/><rect x="32" y="78" width="16" height="10" rx="1"/><rect x="32" y="94" width="16" height="10" rx="1"/></g><g id="leds" filter="url(#ledGlow)"><circle cx="17" cy="19" r="2" fill="url(#ledGreen)"><animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/></circle><circle cx="23" cy="19" r="2" fill="url(#ledBlue)"><animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite"/></circle><circle cx="29" cy="19" r="1.5" fill="url(#ledGreen)"><animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/></circle><circle cx="17" cy="35" r="2" fill="url(#ledGreen)"/><circle cx="23" cy="35" r="2" fill="url(#ledAmber)"><animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite"/></circle><circle cx="29" cy="35" r="1.5" fill="url(#ledBlue)"><animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="17" cy="51" r="2" fill="url(#ledGreen)"><animate attributeName="opacity" values="1;0.6;1" dur="2.2s" repeatCount="indefinite"/></circle><circle cx="23" cy="51" r="2" fill="url(#ledBlue)"><animate attributeName="opacity" values="1;0.3;1" dur="0.6s" repeatCount="indefinite"/></circle><circle cx="29" cy="51" r="1.5" fill="url(#ledGreen)"><animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="17" cy="67" r="2" fill="url(#ledWhite)"><animate attributeName="opacity" values="1;0.4;1" dur="0.4s" repeatCount="indefinite"/></circle><circle cx="23" cy="67" r="2" fill="url(#ledGreen)"/><circle cx="29" cy="67" r="1.5" fill="url(#ledAmber)"><animate attributeName="opacity" values="1;0.3;1" dur="0.6s" repeatCount="indefinite"/></circle><circle cx="17" cy="83" r="2" fill="url(#ledAmber)"><animate attributeName="opacity" values="1;0.5;1" dur="1.1s" repeatCount="indefinite"/></circle><circle cx="23" cy="83" r="2" fill="url(#ledBlue)"><animate attributeName="opacity" values="1;0.4;1" dur="0.7s" repeatCount="indefinite"/></circle><circle cx="29" cy="83" r="1.5" fill="url(#ledGreen)"><animate attributeName="opacity" values="1;0.6;1" dur="1.9s" repeatCount="indefinite"/></circle><circle cx="17" cy="99" r="2" fill="url(#ledGreen)"><animate attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite"/></circle><circle cx="23" cy="99" r="2" fill="url(#ledBlue)"><animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite"/></circle><circle cx="29" cy="99" r="1.5" fill="url(#ledRed)"><animate attributeName="opacity" values="1;0.2;1" dur="3s" repeatCount="indefinite"/></circle></g><g id="ports" fill="#0a0a15"><rect x="54" y="15" width="10" height="8" rx="1"/><rect x="54" y="31" width="10" height="8" rx="1"/><rect x="54" y="47" width="10" height="8" rx="1"/><rect x="54" y="63" width="10" height="8" rx="1"/><rect x="54" y="79" width="10" height="8" rx="1"/><rect x="54" y="95" width="10" height="8" rx="1"/></g><g id="portLeds" filter="url(#ledGlow)"><circle cx="59" cy="19" r="1" fill="url(#ledGreen)"><animate attributeName="opacity" values="0;1;0" dur="0.15s" repeatCount="indefinite"/></circle><circle cx="59" cy="35" r="1" fill="url(#ledGreen)"><animate attributeName="opacity" values="0;1;0" dur="0.12s" repeatCount="indefinite" begin="0.05s"/></circle><circle cx="59" cy="51" r="1" fill="url(#ledAmber)"><animate attributeName="opacity" values="0;1;0" dur="0.18s" repeatCount="indefinite" begin="0.1s"/></circle><circle cx="59" cy="67" r="1" fill="url(#ledGreen)"><animate attributeName="opacity" values="0;1;0" dur="0.14s" repeatCount="indefinite" begin="0.02s"/></circle><circle cx="59" cy="83" r="1" fill="url(#ledGreen)"><animate attributeName="opacity" values="0;1;0" dur="0.16s" repeatCount="indefinite" begin="0.08s"/></circle><circle cx="59" cy="99" r="1" fill="url(#ledBlue)"><animate attributeName="opacity" values="0;1;0" dur="0.2s" repeatCount="indefinite" begin="0.03s"/></circle></g></svg>`
  )}`;

  // Galaxy SVG as data URI (bright detailed core, very faint arms)
  const galaxySVG = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" fill="none"><defs><radialGradient id="galaxyCore" cx="50%" cy="50%" r="35%"><stop offset="0%" stop-color="rgba(255,255,240,0.9)"/><stop offset="5%" stop-color="rgba(255,250,220,0.7)"/><stop offset="15%" stop-color="rgba(255,240,200,0.5)"/><stop offset="30%" stop-color="rgba(240,220,180,0.3)"/><stop offset="50%" stop-color="rgba(220,200,255,0.15)"/><stop offset="75%" stop-color="rgba(180,170,220,0.05)"/><stop offset="100%" stop-color="transparent"/></radialGradient><radialGradient id="coreInner" cx="50%" cy="50%" r="15%"><stop offset="0%" stop-color="rgba(255,255,255,0.8)"/><stop offset="50%" stop-color="rgba(255,250,230,0.4)"/><stop offset="100%" stop-color="transparent"/></radialGradient><radialGradient id="coreGlow" cx="50%" cy="50%" r="25%"><stop offset="0%" stop-color="rgba(255,240,200,0.6)"/><stop offset="40%" stop-color="rgba(255,220,180,0.25)"/><stop offset="100%" stop-color="transparent"/></radialGradient><linearGradient id="armGrad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="rgba(200,190,255,0.08)"/><stop offset="50%" stop-color="rgba(180,170,240,0.04)"/><stop offset="100%" stop-color="transparent"/></linearGradient><linearGradient id="armGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="rgba(220,200,255,0.06)"/><stop offset="60%" stop-color="rgba(200,180,240,0.03)"/><stop offset="100%" stop-color="transparent"/></linearGradient><radialGradient id="dustCloud" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(180,170,230,0.04)"/><stop offset="70%" stop-color="rgba(140,150,210,0.02)"/><stop offset="100%" stop-color="transparent"/></radialGradient><filter id="coreBlur"><feGaussianBlur stdDeviation="8"/></filter><filter id="armBlur"><feGaussianBlur stdDeviation="4"/></filter></defs><ellipse cx="400" cy="400" rx="150" ry="100" fill="url(#galaxyCore)" transform="rotate(-25 400 400)"/><ellipse cx="400" cy="400" rx="80" ry="55" fill="url(#coreGlow)" transform="rotate(-25 400 400)" filter="url(#coreBlur)"/><ellipse cx="400" cy="400" rx="40" ry="28" fill="url(#coreInner)" transform="rotate(-25 400 400)"/><g opacity="0.5" transform="rotate(-25 400 400)" filter="url(#armBlur)"><path d="M400,400 Q480,350 560,330 Q660,310 750,250" stroke="url(#armGrad1)" stroke-width="60" fill="none" stroke-linecap="round"/><path d="M400,400 Q320,450 240,470 Q140,490 50,550" stroke="url(#armGrad1)" stroke-width="60" fill="none" stroke-linecap="round"/><path d="M400,400 Q450,340 500,290 Q560,230 640,170" stroke="url(#armGrad2)" stroke-width="40" fill="none" stroke-linecap="round"/><path d="M400,400 Q350,460 300,510 Q240,570 160,630" stroke="url(#armGrad2)" stroke-width="40" fill="none" stroke-linecap="round"/></g><ellipse cx="520" cy="310" rx="70" ry="40" fill="url(#dustCloud)" transform="rotate(-20 520 310)"/><ellipse cx="280" cy="490" rx="60" ry="35" fill="url(#dustCloud)" transform="rotate(15 280 490)"/><g fill="rgba(255,255,255,0.7)"><circle cx="400" cy="400" r="2"/><circle cx="410" cy="395" r="1.5"/><circle cx="390" cy="405" r="1.3"/><circle cx="405" cy="410" r="1.2"/><circle cx="395" cy="390" r="1.4"/><circle cx="415" cy="405" r="1"/><circle cx="385" cy="395" r="1.1"/></g><g fill="rgba(255,255,255,0.4)"><circle cx="420" cy="380" r="1.2"/><circle cx="380" cy="420" r="1"/><circle cx="440" cy="370" r="0.9"/><circle cx="360" cy="430" r="1.1"/><circle cx="450" cy="390" r="0.8"/><circle cx="350" cy="410" r="1"/></g><g fill="rgba(200,210,255,0.2)"><circle cx="480" cy="340" r="1"/><circle cx="320" cy="460" r="0.9"/><circle cx="500" cy="360" r="0.7"/><circle cx="300" cy="440" r="0.8"/><circle cx="520" cy="380" r="0.6"/><circle cx="280" cy="420" r="0.7"/></g></svg>`
  )}`;

  // Mark HTML as space-ready to prevent FOUC (Flash of Unstyled Content)
  function markSpaceReady() {
    document.documentElement.classList.add("space-ready");
  }

  // Create starfield element
  function createStarfieldElement() {
    if (document.getElementById("starfield")) return;
    const starfield = document.createElement("div");
    starfield.id = "starfield";
    document.body.appendChild(starfield);
  }

  // Create nebula element
  function createNebulaElement() {
    if (document.getElementById("space-nebula")) return;
    const nebula = document.createElement("div");
    nebula.id = "space-nebula";
    nebula.setAttribute("aria-hidden", "true");
    document.body.appendChild(nebula);
  }

  // Create galaxy element
  function createGalaxyElement() {
    if (document.getElementById("space-galaxy")) return;
    const galaxy = document.createElement("div");
    galaxy.id = "space-galaxy";
    galaxy.setAttribute("aria-hidden", "true");
    galaxy.style.backgroundImage = `url("${galaxySVG}")`;
    document.body.appendChild(galaxy);
  }

  // Create planet elements
  function createPlanetElements() {
    if (document.querySelector(".space-planet")) return;

    // Left Saturn
    const planetLeft = document.createElement("div");
    planetLeft.className = "space-planet space-planet-left";
    planetLeft.setAttribute("aria-hidden", "true");
    planetLeft.style.backgroundImage = `url("${saturnSVG}")`;
    document.body.appendChild(planetLeft);

    // Right Blue Planet (Neptune-style, replaces second Saturn on desktop)
    const planetRight = document.createElement("div");
    planetRight.className = "space-planet space-planet-right";
    planetRight.setAttribute("aria-hidden", "true");
    planetRight.style.backgroundImage = `url("${bluePlanetSVG}")`;
    document.body.appendChild(planetRight);

    // Small Saturn badge (visible on all screens including mobile)
    const planetBadge = document.createElement("div");
    planetBadge.className = "space-planet-badge";
    planetBadge.setAttribute("aria-hidden", "true");
    planetBadge.style.backgroundImage = `url("${saturnSVG}")`;
    document.body.appendChild(planetBadge);

    // Datacenter rack (desktop only, bottom left)
    const datacenter = document.createElement("div");
    datacenter.className = "space-datacenter";
    datacenter.setAttribute("aria-hidden", "true");
    datacenter.style.backgroundImage = `url("${datacenterSVG}")`;
    document.body.appendChild(datacenter);
  }

  // Global toggle used by fixed button
  window.toggleStarfield = function () {
    document.body.classList.toggle("space-on");
    // Save state to localStorage for persistence across pages
    const isOn = document.body.classList.contains("space-on");
    try {
      localStorage.setItem("starfield-enabled", isOn ? "true" : "false");
    } catch (e) {
      /* localStorage not available */
    }
    updateStarfieldButton();
    document.dispatchEvent(new CustomEvent("space:toggle", { detail: { enabled: isOn } }));
  };

  function updateStarfieldButton() {
    const btn = document.getElementById("starfield-toggle-btn");
    if (!btn) return;
    const isOn = document.body.classList.contains("space-on");
    btn.classList.toggle("active", isOn);
    btn.innerHTML = isOn
      ? '<span class="easter-icon">🌌</span><span class="toggle-indicator on">ON</span>'
      : '<span class="easter-icon">🌌</span><span class="toggle-indicator off">OFF</span>';
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

  // Restore state from localStorage, default to ON if not set
  function getStoredStarfieldState() {
    try {
      const stored = localStorage.getItem("starfield-enabled");
      // Default to true (on) if never set
      return stored === null ? true : stored === "true";
    } catch (e) {
      return true; // Default on if localStorage not available
    }
  }

  // Apply stored state on load
  if (document && document.body) {
    if (getStoredStarfieldState()) {
      document.body.classList.add("space-on");
    } else {
      document.body.classList.remove("space-on");
    }
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
      createGalaxyElement();
      createNebulaElement();
      createPlanetElements();
      createStarfieldElement();
      createStarfieldButton();
      initParallax();
      // Mark ready AFTER all elements are created to prevent FOUC
      markSpaceReady();
    });
  } else {
    createGalaxyElement();
    createNebulaElement();
    createPlanetElements();
    createStarfieldElement();
    createStarfieldButton();
    initParallax();
    markSpaceReady();
  }

  // Parallax effect for 3D depth
  function initParallax() {
    const starfield = document.getElementById("starfield");
    const planetLeft = document.querySelector(".space-planet-left");
    const planetRight = document.querySelector(".space-planet-right");
    if (!starfield) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationId = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

    function shouldRunParallax() {
      return !reducedMotion.matches && document.body.classList.contains("space-on") && document.visibilityState !== "hidden";
    }

    function animate() {
      if (!shouldRunParallax()) {
        animationId = null;
        return;
      }

      // Smooth interpolation
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      // Apply parallax transform (subtle shift)
      const moveX = currentX * 15;
      const moveY = currentY * 10;
      starfield.style.transform = `translate(${moveX}px, ${moveY}px)`;

      // Planets move slightly less for depth effect (they're "closer")
      if (planetLeft) {
        const planetMoveX = currentX * 8;
        const planetMoveY = currentY * 5;
        planetLeft.style.transform = `rotate(-15deg) translate(${planetMoveX}px, ${planetMoveY}px)`;
      }
      if (planetRight) {
        const planetMoveX = currentX * 6;
        const planetMoveY = currentY * 4;
        planetRight.style.transform = `rotate(8deg) translate(${-planetMoveX}px, ${planetMoveY}px)`;
      }

      animationId = requestAnimationFrame(animate);
    }

    function startParallax() {
      if (animationId || !shouldRunParallax()) return;
      animationId = requestAnimationFrame(animate);
    }

    function stopParallax() {
      if (!animationId) return;
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    function syncParallax() {
      if (shouldRunParallax()) {
        startParallax();
      } else {
        stopParallax();
      }
    }

    document.addEventListener("space:toggle", syncParallax);
    document.addEventListener("visibilitychange", syncParallax);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", syncParallax);
    startParallax();
  }
})();
