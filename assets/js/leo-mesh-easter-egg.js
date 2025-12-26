/**
 * LEO Mesh Routing Easter Egg
 * Interactive satellite constellation routing visualization
 */
(function () {
  "use strict";

  // === Configuration ===
  const NUM_PLANES = 3;
  const SATS_PER_PLANE = 8;
  const NUM_SATS = NUM_PLANES * SATS_PER_PLANE;
  const K_NEIGHBORS = 3;
  const MAX_LINK_DIST = 120;
  const HANDOVER_PENALTY = 25;
  const DIJKSTRA_INTERVAL = 200;
  const CANVAS_W = 420;
  const CANVAS_H = 260;
  const EARTH_RADIUS = 35;
  const ORBIT_RADII = [75, 95, 115];

  // City coordinates (angle on the rim, roughly matching real positions)
  const CITIES = {
    Zurich: { angle: -Math.PI / 6, lat: 47.37, lon: 8.54 },
    Canberra: { angle: Math.PI * 0.75, lat: -35.28, lon: 149.13 },
    "New York": { angle: -Math.PI * 0.4, lat: 40.71, lon: -74.01 },
    Tokyo: { angle: Math.PI * 0.55, lat: 35.68, lon: 139.69 },
    London: { angle: -Math.PI * 0.15, lat: 51.51, lon: -0.13 },
    Sydney: { angle: Math.PI * 0.7, lat: -33.87, lon: 151.21 },
    Singapore: { angle: Math.PI * 0.45, lat: 1.35, lon: 103.82 },
    Dubai: { angle: Math.PI * 0.2, lat: 25.2, lon: 55.27 },
    "San Francisco": { angle: -Math.PI * 0.55, lat: 37.77, lon: -122.42 },
    "São Paulo": { angle: -Math.PI * 0.65, lat: -23.55, lon: -46.63 },
    Mumbai: { angle: Math.PI * 0.25, lat: 19.08, lon: 72.88 },
    Beijing: { angle: Math.PI * 0.5, lat: 39.9, lon: 116.41 },
    Paris: { angle: -Math.PI * 0.12, lat: 48.86, lon: 2.35 },
    Berlin: { angle: -Math.PI * 0.08, lat: 52.52, lon: 13.41 },
    Moscow: { angle: Math.PI * 0.1, lat: 55.76, lon: 37.62 },
    "Los Angeles": { angle: -Math.PI * 0.5, lat: 34.05, lon: -118.24 },
    Chicago: { angle: -Math.PI * 0.45, lat: 41.88, lon: -87.63 },
    Toronto: { angle: -Math.PI * 0.38, lat: 43.65, lon: -79.38 },
    Seoul: { angle: Math.PI * 0.52, lat: 37.57, lon: 126.98 },
    "Hong Kong": { angle: Math.PI * 0.48, lat: 22.32, lon: 114.17 },
    Bangkok: { angle: Math.PI * 0.42, lat: 13.76, lon: 100.5 },
    "Cape Town": { angle: Math.PI * 0.35, lat: -33.93, lon: 18.42 },
    Cairo: { angle: Math.PI * 0.15, lat: 30.04, lon: 31.24 },
    Amsterdam: { angle: -Math.PI * 0.1, lat: 52.37, lon: 4.9 },
  };

  // === State ===
  let overlay = null;
  let canvas = null;
  let ctx = null;
  let toggleBtn = null;
  let nerdModeCheckbox = null;
  let stepBtn = null;
  let handoverLabel = null;
  let destInput = null;
  let destCurrentLabel = null;
  let isOpen = false;
  let animationId = null;
  let lastDijkstraTime = 0;
  let lastTime = 0;
  let nerdMode = false;

  // Ground stations
  let userCity = "New York"; // Default fallback
  const groundStations = [
    { name: "Zurich", angle: CITIES["Zurich"].angle, color: "#60a5fa" },
    { name: userCity, angle: CITIES[userCity]?.angle || 0, color: "#f472b6" },
  ];

  // Satellite state arrays (reused)
  const satellites = [];

  // Routing state
  let currentPath = [];
  let previousPath = [];
  let handoverTimeout = null;

  // Reduced motion
  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // === Geolocation ===
  async function detectUserCity() {
    try {
      // Using free IP geolocation API
      const response = await fetch("https://ipapi.co/json/", { timeout: 3000 });
      if (!response.ok) throw new Error("Geo lookup failed");
      const data = await response.json();

      if (data.city) {
        // Try exact match first
        if (CITIES[data.city]) {
          return data.city;
        }
        // Try to find closest known city by coordinates
        if (data.latitude && data.longitude) {
          return findClosestCity(data.latitude, data.longitude);
        }
      }
    } catch (e) {
      console.log("Geo detection failed, using default");
    }
    return "New York";
  }

  function findClosestCity(lat, lon) {
    let closest = "New York";
    let minDist = Infinity;
    for (const [city, coords] of Object.entries(CITIES)) {
      const d = Math.sqrt(Math.pow(coords.lat - lat, 2) + Math.pow(coords.lon - lon, 2));
      if (d < minDist) {
        minDist = d;
        closest = city;
      }
    }
    return closest;
  }

  function setDestinationCity(cityName) {
    const city = CITIES[cityName];
    if (city) {
      userCity = cityName;
      groundStations[1].name = cityName;
      groundStations[1].angle = city.angle;
      if (destCurrentLabel) {
        destCurrentLabel.textContent = cityName;
      }
      previousPath = [];
      currentPath = [];
      computeRoute();
      render();
    }
  }

  function getCitySuggestions(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    return Object.keys(CITIES)
      .filter((c) => c.toLowerCase().includes(q))
      .slice(0, 5);
  }

  // === Satellite Initialization ===
  function initSatellites() {
    satellites.length = 0;
    for (let plane = 0; plane < NUM_PLANES; plane++) {
      const orbitRadius = ORBIT_RADII[plane];
      const baseAngularVel = 0.15 + plane * 0.03;
      for (let i = 0; i < SATS_PER_PLANE; i++) {
        const phaseOffset = (plane * Math.PI) / NUM_PLANES;
        satellites.push({
          id: satellites.length,
          plane: plane,
          angle: (2 * Math.PI * i) / SATS_PER_PLANE + phaseOffset,
          angularVel: baseAngularVel,
          orbitRadius: orbitRadius,
          x: 0,
          y: 0,
        });
      }
    }
    updateSatellitePositions(0);
  }

  function updateSatellitePositions(dt) {
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    for (let i = 0; i < satellites.length; i++) {
      const sat = satellites[i];
      sat.angle += sat.angularVel * dt;
      sat.x = cx + Math.cos(sat.angle) * sat.orbitRadius;
      sat.y = cy + Math.sin(sat.angle) * sat.orbitRadius;
    }
  }

  function getGroundStationPos(gs) {
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    const rimRadius = ORBIT_RADII[NUM_PLANES - 1] + 20;
    return {
      x: cx + Math.cos(gs.angle) * rimRadius,
      y: cy + Math.sin(gs.angle) * rimRadius,
    };
  }

  // === Graph & Routing ===
  function distance(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function buildGraph() {
    const gsPositions = groundStations.map(getGroundStationPos);
    const nodes = [];

    for (let i = 0; i < NUM_SATS; i++) {
      nodes.push({ x: satellites[i].x, y: satellites[i].y, isSat: true, id: i });
    }
    nodes.push({ x: gsPositions[0].x, y: gsPositions[0].y, isSat: false, id: NUM_SATS });
    nodes.push({ x: gsPositions[1].x, y: gsPositions[1].y, isSat: false, id: NUM_SATS + 1 });

    const adj = [];
    for (let i = 0; i < nodes.length; i++) adj.push([]);

    for (let i = 0; i < NUM_SATS; i++) {
      const dists = [];
      for (let j = 0; j < NUM_SATS; j++) {
        if (i === j) continue;
        const d = distance(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        if (d <= MAX_LINK_DIST) {
          dists.push({ j, d });
        }
      }
      dists.sort((a, b) => a.d - b.d);
      for (let k = 0; k < Math.min(K_NEIGHBORS, dists.length); k++) {
        adj[i].push({ to: dists[k].j, dist: dists[k].d });
        adj[dists[k].j].push({ to: i, dist: dists[k].d });
      }
    }

    for (let g = 0; g < 2; g++) {
      const gIdx = NUM_SATS + g;
      const gx = nodes[gIdx].x;
      const gy = nodes[gIdx].y;
      const dists = [];
      for (let i = 0; i < NUM_SATS; i++) {
        const d = distance(gx, gy, nodes[i].x, nodes[i].y);
        if (d <= MAX_LINK_DIST * 1.5) {
          dists.push({ i, d });
        }
      }
      dists.sort((a, b) => a.d - b.d);
      for (let k = 0; k < Math.min(2, dists.length); k++) {
        adj[gIdx].push({ to: dists[k].i, dist: dists[k].d });
        adj[dists[k].i].push({ to: gIdx, dist: dists[k].d });
      }
    }

    return { nodes, adj };
  }

  function dijkstra(adj, start, end, prevPath) {
    const n = adj.length;
    const dist = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(-1);
    const visited = new Array(n).fill(false);

    const prevEdges = new Set();
    for (let i = 0; i < prevPath.length - 1; i++) {
      const a = prevPath[i],
        b = prevPath[i + 1];
      prevEdges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    }

    dist[start] = 0;

    for (let iter = 0; iter < n; iter++) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) {
        if (!visited[i] && dist[i] < best) {
          best = dist[i];
          u = i;
        }
      }
      if (u === -1 || u === end) break;
      visited[u] = true;

      for (const edge of adj[u]) {
        const v = edge.to;
        if (visited[v]) continue;
        const edgeKey = `${Math.min(u, v)}-${Math.max(u, v)}`;
        const penalty = prevEdges.has(edgeKey) ? 0 : HANDOVER_PENALTY;
        const alt = dist[u] + edge.dist + penalty;
        if (alt < dist[v]) {
          dist[v] = alt;
          prev[v] = u;
        }
      }
    }

    const path = [];
    if (dist[end] < Infinity) {
      let cur = end;
      while (cur !== -1) {
        path.unshift(cur);
        cur = prev[cur];
      }
    }
    return path;
  }

  function computeRoute() {
    const { nodes, adj } = buildGraph();
    const newPath = dijkstra(adj, NUM_SATS, NUM_SATS + 1, previousPath);

    if (previousPath.length > 0 && newPath.length > 0) {
      const pathChanged = newPath.length !== previousPath.length || newPath.some((n, i) => n !== previousPath[i]);
      if (pathChanged) {
        showHandover();
      }
    }

    previousPath = currentPath;
    currentPath = newPath;
  }

  function showHandover() {
    if (!handoverLabel) return;
    handoverLabel.textContent = "⚡ handover";
    handoverLabel.style.opacity = "1";
    if (handoverTimeout) clearTimeout(handoverTimeout);
    handoverTimeout = setTimeout(() => {
      handoverLabel.style.opacity = "0";
    }, 800);
  }

  // === Rendering ===
  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;

    // Draw Earth
    ctx.beginPath();
    ctx.arc(cx, cy, EARTH_RADIUS, 0, Math.PI * 2);
    const earthGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, EARTH_RADIUS);
    earthGrad.addColorStop(0, "#3b82f6");
    earthGrad.addColorStop(1, "#1e3a5f");
    ctx.fillStyle = earthGrad;
    ctx.fill();

    // Draw orbit rings
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (const r of ORBIT_RADII) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const { nodes, adj } = buildGraph();

    // Draw inter-satellite links
    ctx.strokeStyle = "rgba(100, 200, 255, 0.25)";
    ctx.lineWidth = 1;
    const drawnLinks = new Set();
    for (let i = 0; i < NUM_SATS; i++) {
      for (const edge of adj[i]) {
        if (edge.to >= NUM_SATS) continue;
        const key = `${Math.min(i, edge.to)}-${Math.max(i, edge.to)}`;
        if (drawnLinks.has(key)) continue;
        drawnLinks.add(key);
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[edge.to].x, nodes[edge.to].y);
        ctx.stroke();
      }
    }

    // Draw ground station links
    ctx.strokeStyle = "rgba(255, 200, 100, 0.3)";
    for (let g = 0; g < 2; g++) {
      const gIdx = NUM_SATS + g;
      for (const edge of adj[gIdx]) {
        ctx.beginPath();
        ctx.moveTo(nodes[gIdx].x, nodes[gIdx].y);
        ctx.lineTo(nodes[edge.to].x, nodes[edge.to].y);
        ctx.stroke();
      }
    }

    // Draw route path
    if (currentPath.length > 1) {
      ctx.strokeStyle = "#fcd34d";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(252, 211, 77, 0.6)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(nodes[currentPath[0]].x, nodes[currentPath[0]].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(nodes[currentPath[i]].x, nodes[currentPath[i]].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw satellites
    for (let i = 0; i < NUM_SATS; i++) {
      const sat = satellites[i];
      const onPath = currentPath.includes(i);
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, onPath ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = onPath ? "#fcd34d" : "rgba(200, 220, 255, 0.8)";
      ctx.fill();
    }

    // Draw ground stations
    for (let g = 0; g < 2; g++) {
      const gs = groundStations[g];
      const pos = getGroundStationPos(gs);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = gs.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "#e5e7eb";
      ctx.textAlign = "center";
      ctx.fillText(gs.name, pos.x, pos.y + 18);
    }

    // Nerd mode stats
    if (nerdMode) {
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "left";
      ctx.fillText(`Satellites: ${NUM_SATS}`, 8, 14);
      ctx.fillText(`Path hops: ${currentPath.length > 0 ? currentPath.length - 1 : "-"}`, 8, 26);
      ctx.fillText(`Links: ${drawnLinks.size}`, 8, 38);
      ctx.fillText(`Route: Zurich → ${userCity}`, 8, 50);
    }
  }

  // === Animation Loop ===
  function tick(now) {
    if (!isOpen) return;

    const dt = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;

    if (!prefersReducedMotion()) {
      updateSatellitePositions(dt);
    }

    if (now - lastDijkstraTime > DIJKSTRA_INTERVAL) {
      computeRoute();
      lastDijkstraTime = now;
    }

    render();
    animationId = requestAnimationFrame(tick);
  }

  function startAnimation() {
    if (animationId) return;
    lastTime = 0;
    lastDijkstraTime = 0;
    animationId = requestAnimationFrame(tick);
  }

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function stepOnce() {
    updateSatellitePositions(0.05);
    computeRoute();
    render();
  }

  // === UI Creation ===
  function createUI() {
    // Toggle button
    toggleBtn = document.createElement("button");
    toggleBtn.id = "leo-mesh-toggle";
    toggleBtn.className = "leo-mesh-toggle";
    toggleBtn.innerHTML = '🛰️<span class="toggle-indicator off">OFF</span>';
    toggleBtn.title = "LEO Mesh Routing";
    toggleBtn.addEventListener("click", toggleOverlay);
    document.body.appendChild(toggleBtn);

    // Overlay
    overlay = document.createElement("div");
    overlay.id = "leo-mesh-overlay";
    overlay.className = "leo-mesh-overlay";
    overlay.innerHTML = `
      <div class="leo-mesh-header">
        <span class="leo-mesh-title">🛰️ LEO Mesh Routing</span>
        <button class="leo-mesh-close" title="Close">&times;</button>
      </div>
      <div class="leo-mesh-destination">
        <span class="leo-mesh-dest-label">From Zurich to:</span>
        <input type="text" class="leo-mesh-dest-input" id="leo-mesh-dest-input" placeholder="Search city..." list="leo-mesh-cities" />
        <span class="leo-mesh-dest-current" id="leo-mesh-dest-current">Loading...</span>
        <datalist id="leo-mesh-cities"></datalist>
      </div>
      <canvas id="leo-mesh-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
      <div class="leo-mesh-controls">
        <label class="leo-mesh-nerd">
          <input type="checkbox" id="leo-mesh-nerd-checkbox" />
          Nerd mode
        </label>
        <button id="leo-mesh-step" class="leo-mesh-step-btn" style="display:none;">Step</button>
      </div>
      <div class="leo-mesh-handover" id="leo-mesh-handover"></div>
    `;
    document.body.appendChild(overlay);

    // Get references
    canvas = document.getElementById("leo-mesh-canvas");
    ctx = canvas.getContext("2d");
    nerdModeCheckbox = document.getElementById("leo-mesh-nerd-checkbox");
    stepBtn = document.getElementById("leo-mesh-step");
    handoverLabel = document.getElementById("leo-mesh-handover");
    destInput = document.getElementById("leo-mesh-dest-input");
    destCurrentLabel = document.getElementById("leo-mesh-dest-current");

    // Populate datalist with cities
    const datalist = document.getElementById("leo-mesh-cities");
    for (const city of Object.keys(CITIES).sort()) {
      const opt = document.createElement("option");
      opt.value = city;
      datalist.appendChild(opt);
    }

    // Event listeners
    overlay.querySelector(".leo-mesh-close").addEventListener("click", closeOverlay);
    nerdModeCheckbox.addEventListener("change", (e) => {
      nerdMode = e.target.checked;
      render();
    });
    stepBtn.addEventListener("click", stepOnce);

    destInput.addEventListener("change", (e) => {
      const city = e.target.value.trim();
      if (CITIES[city]) {
        setDestinationCity(city);
        destInput.value = "";
      }
    });

    destInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const city = destInput.value.trim();
        if (CITIES[city]) {
          setDestinationCity(city);
          destInput.value = "";
        }
      }
    });

    if (prefersReducedMotion()) {
      stepBtn.style.display = "inline-block";
    }
  }

  function toggleOverlay() {
    if (isOpen) {
      closeOverlay();
    } else {
      openOverlay();
    }
  }

  async function openOverlay() {
    // Close other overlays first (mutually exclusive, except stars)
    if (window.closeMissionTerminal) window.closeMissionTerminal();
    if (window.closeBirbaGallery) window.closeBirbaGallery();

    isOpen = true;
    overlay.classList.add("open");
    toggleBtn.classList.add("active");
    toggleBtn.innerHTML = '🛰️<span class="toggle-indicator on">ON</span>';
    initSatellites();
    previousPath = [];
    currentPath = [];

    // Detect user location if not already set
    if (destCurrentLabel.textContent === "Loading...") {
      const detectedCity = await detectUserCity();
      setDestinationCity(detectedCity);
    }

    computeRoute();
    if (!prefersReducedMotion()) {
      startAnimation();
    } else {
      render();
    }
  }

  function closeOverlay() {
    isOpen = false;
    overlay.classList.remove("open");
    toggleBtn.classList.remove("active");
    toggleBtn.innerHTML = '🛰️<span class="toggle-indicator off">OFF</span>';
    stopAnimation();
  }

  // Expose close function globally for other easter eggs
  window.closeLeoMesh = closeOverlay;

  // === Init ===
  function init() {
    createUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
