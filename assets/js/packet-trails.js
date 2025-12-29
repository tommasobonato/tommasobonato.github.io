/**
 * Packet Trails Easter Egg
 * Interactive visualization of packet trails with ECMP, PLB, and REPS modes
 */
(function () {
  "use strict";

  // === Configuration ===
  const CANVAS_W = 440;
  const CANVAS_H = 280;
  const NUM_MID_NODES = 4;
  const NUM_PATHS = 4;
  const TRAIL_LENGTH = 25;
  const TRAIL_FADE = 0.92;
  const PACKET_SPEED = 0.0015;
  const FLOW_DURATION = 8000;

  // Flow colors (one color per flow, consistent across modes)
  const FLOW_COLORS = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa"];

  // Node positions
  let srcNode = null;
  let dstNode = null;
  const midNodes = [];
  const paths = []; // Array of path objects { nodes: [] }

  // Packets with trails
  const packets = []; // { flowIdx, pathIdx, progress, trail: [{x,y,alpha}], color }

  // === State ===
  let overlay = null;
  let canvas = null;
  let ctx = null;
  let toggleBtn = null;
  let isOpen = false;
  let animationId = null;
  let lastTime = 0;
  let simStartTime = 0;
  let currentMode = "ECMP";

  // Flow state for ECMP (which path each "flow" uses)
  const flowPaths = []; // Assigned path per flow (for ECMP consistency)
  const NUM_FLOWS = 5;

  // Reduced motion
  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // === Topology Setup ===
  function initTopology() {
    midNodes.length = 0;
    paths.length = 0;

    // Source and destination
    srcNode = { x: 50, y: CANVAS_H / 2, label: "SRC" };
    dstNode = { x: CANVAS_W - 50, y: CANVAS_H / 2, label: "DST" };

    // Mid-layer nodes (two columns)
    const col1X = 150;
    const col2X = 290;
    const spacing = (CANVAS_H - 80) / 3;

    for (let i = 0; i < 4; i++) {
      midNodes.push({
        x: col1X,
        y: 40 + i * spacing,
        label: `M${i}`,
        col: 0,
      });
    }
    for (let i = 0; i < 4; i++) {
      midNodes.push({
        x: col2X,
        y: 40 + i * spacing,
        label: `N${i}`,
        col: 1,
      });
    }

    // Create paths (each path: src -> mid1 -> mid2 -> dst)
    const pathConfigs = [
      [0, 0], // M0 -> N0
      [1, 1], // M1 -> N1
      [2, 2], // M2 -> N2
      [3, 3], // M3 -> N3
      [1, 2], // M1 -> N2 (cross path)
    ];

    pathConfigs.forEach((config, i) => {
      const [m1, m2] = config;
      paths.push({
        nodes: [srcNode, midNodes[m1], midNodes[4 + m2], dstNode],
      });
    });

    // Assign flow paths for ECMP
    flowPaths.length = 0;
    for (let i = 0; i < NUM_FLOWS; i++) {
      flowPaths.push(i % paths.length);
    }
  }

  // === Packet Management ===
  function createPacket(flowIdx) {
    let pathIdx;

    if (currentMode === "ECMP") {
      // Stick to assigned path (stable per-flow)
      pathIdx = flowPaths[flowIdx];
    } else if (currentMode === "PLB") {
      // Mostly stick to path, occasional switch on "congestion"
      pathIdx = flowPaths[flowIdx];
      if (Math.random() < 0.15) {
        // 15% chance to reroute entire flow
        pathIdx = Math.floor(Math.random() * paths.length);
        flowPaths[flowIdx] = pathIdx;
      }
    } else {
      // REPS: spray each packet across random paths (same flow color)
      pathIdx = Math.floor(Math.random() * paths.length);
    }

    // Color is always by flow, not by path
    return {
      flowIdx,
      pathIdx,
      progress: 0,
      trail: [],
      color: FLOW_COLORS[flowIdx % FLOW_COLORS.length],
      x: srcNode.x,
      y: srcNode.y,
    };
  }

  function getPositionOnPath(path, progress) {
    // progress 0-1 across entire path
    const numSegments = path.nodes.length - 1;
    const segmentProgress = progress * numSegments;
    const segmentIdx = Math.min(Math.floor(segmentProgress), numSegments - 1);
    const t = segmentProgress - segmentIdx;

    const from = path.nodes[segmentIdx];
    const to = path.nodes[segmentIdx + 1];

    // Bezier curve for smoother paths
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2 + (Math.random() - 0.5) * 2; // Slight variation

    // Simple lerp for now
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
  }

  // === Simulation ===
  let lastPacketTime = 0;
  const packetInterval = 180;

  function updateSimulation(dt) {
    const now = performance.now();

    // Reset if duration exceeded
    if (now - simStartTime > FLOW_DURATION) {
      simStartTime = now;
      packets.length = 0;
      // Reassign flow paths
      for (let i = 0; i < NUM_FLOWS; i++) {
        flowPaths[i] = i % paths.length;
      }
    }

    // Create new packets
    if (now - lastPacketTime > packetInterval) {
      const flowIdx = Math.floor(Math.random() * NUM_FLOWS);
      packets.push(createPacket(flowIdx));
      lastPacketTime = now;
    }

    // Update packets
    packets.forEach((pkt) => {
      if (!prefersReducedMotion()) {
        pkt.progress += PACKET_SPEED * dt;
      } else {
        pkt.progress += PACKET_SPEED * dt * 3; // Faster in reduced motion
      }

      const path = paths[pkt.pathIdx];
      const pos = getPositionOnPath(path, Math.min(pkt.progress, 1));
      pkt.x = pos.x;
      pkt.y = pos.y;

      // Add to trail
      if (!prefersReducedMotion()) {
        pkt.trail.unshift({ x: pkt.x, y: pkt.y, alpha: 1 });

        // Fade trail
        pkt.trail.forEach((t, i) => {
          t.alpha *= TRAIL_FADE;
        });

        // Trim trail
        while (pkt.trail.length > TRAIL_LENGTH) {
          pkt.trail.pop();
        }
      }
    });

    // Remove completed packets
    packets.filter((pkt) => pkt.progress < 1.05);
    for (let i = packets.length - 1; i >= 0; i--) {
      if (packets[i].progress >= 1.05) {
        packets.splice(i, 1);
      }
    }
  }

  // === Rendering ===
  function render() {
    if (!ctx) return;

    // Semi-transparent clear for trail effect
    ctx.fillStyle = "rgba(3, 7, 18, 0.15)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Full clear every few frames to prevent buildup
    if (Math.random() < 0.02) {
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Draw path lines (faint)
    paths.forEach((path) => {
      ctx.beginPath();
      ctx.moveTo(path.nodes[0].x, path.nodes[0].y);
      for (let i = 1; i < path.nodes.length; i++) {
        ctx.lineTo(path.nodes[i].x, path.nodes[i].y);
      }
      ctx.strokeStyle = "rgba(75, 85, 99, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw nodes
    const drawNode = (node, isEndpoint) => {
      ctx.beginPath();
      if (isEndpoint) {
        // Endpoint: larger circle
        ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#1f2937";
        ctx.fill();
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Mid node: small diamond
        ctx.moveTo(node.x, node.y - 8);
        ctx.lineTo(node.x + 6, node.y);
        ctx.lineTo(node.x, node.y + 8);
        ctx.lineTo(node.x - 6, node.y);
        ctx.closePath();
        ctx.fillStyle = "#374151";
        ctx.fill();
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = isEndpoint ? "#e5e7eb" : "#9ca3af";
      ctx.font = isEndpoint ? "bold 10px system-ui" : "8px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (isEndpoint) {
        ctx.fillText(node.label, node.x, node.y);
      }
    };

    // Draw mid nodes
    midNodes.forEach((n) => drawNode(n, false));

    // Draw endpoints
    drawNode(srcNode, true);
    drawNode(dstNode, true);

    // Draw packet trails
    if (!prefersReducedMotion()) {
      packets.forEach((pkt) => {
        // Draw trail
        if (pkt.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(pkt.trail[0].x, pkt.trail[0].y);

          for (let i = 1; i < pkt.trail.length; i++) {
            ctx.lineTo(pkt.trail[i].x, pkt.trail[i].y);
          }

          ctx.strokeStyle = pkt.color;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Draw packet head
        ctx.beginPath();
        ctx.arc(pkt.x, pkt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(pkt.x, pkt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color.replace(")", ", 0.3)").replace("rgb", "rgba");
        if (!pkt.color.includes("rgba")) {
          ctx.fillStyle = pkt.color + "4d"; // Add alpha to hex
        }
        ctx.fill();
      });
    } else {
      // Reduced motion: just show current positions
      packets.forEach((pkt) => {
        ctx.beginPath();
        ctx.arc(pkt.x, pkt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color;
        ctx.fill();
      });
    }

    // Mode indicator
    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Mode: ${currentMode}`, 12, 12);

    // Mode description
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px system-ui, sans-serif";
    const modeDesc = {
      ECMP: "Hash-based: same flow → same path",
      PLB: "Flowlet switching on congestion",
      REPS: "Adaptive Packet Spraying",
    };
    ctx.fillText(modeDesc[currentMode], 12, 26);
  }

  function animate(timestamp) {
    if (!isOpen) return;

    const dt = lastTime ? timestamp - lastTime : 16;
    lastTime = timestamp;

    updateSimulation(dt);
    render();

    animationId = requestAnimationFrame(animate);
  }

  // === Mode Toggle ===
  function setMode(mode) {
    currentMode = mode;
    simStartTime = performance.now();
    packets.length = 0;

    // Reset flow paths
    for (let i = 0; i < NUM_FLOWS; i++) {
      flowPaths[i] = i % paths.length;
    }

    // Clear canvas
    if (ctx) {
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Update UI
    document.querySelectorAll(".pkt-trails-mode-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
  }

  // === UI Creation ===
  function createUI() {
    // Toggle button
    toggleBtn = document.createElement("button");
    toggleBtn.className = "pkt-trails-toggle";
    toggleBtn.innerHTML = '<span class="easter-icon">⚖️</span><span class="toggle-indicator off">OFF</span>';
    toggleBtn.title = "DC Load Balancing";
    toggleBtn.addEventListener("click", toggleOverlay);
    document.body.appendChild(toggleBtn);

    // Overlay
    overlay = document.createElement("div");
    overlay.className = "pkt-trails-overlay";
    overlay.innerHTML = `
      <div class="pkt-trails-header">
        <span class="pkt-trails-title">⚖️ DC Load Balancing</span>
        <button class="pkt-trails-close" aria-label="Close">&times;</button>
      </div>
      <canvas id="pkt-trails-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
      <div class="pkt-trails-controls">
        <span class="pkt-trails-label">Mode:</span>
        <button class="pkt-trails-mode-btn active" data-mode="ECMP">ECMP</button>
        <button class="pkt-trails-mode-btn" data-mode="PLB">PLB</button>
        <button class="pkt-trails-mode-btn" data-mode="REPS">REPS</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Get canvas context
    canvas = document.getElementById("pkt-trails-canvas");
    ctx = canvas.getContext("2d");

    // Event listeners
    overlay.querySelector(".pkt-trails-close").addEventListener("click", closeOverlay);
    overlay.querySelectorAll(".pkt-trails-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    // ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) closeOverlay();
    });

    // Click outside
    document.addEventListener("click", (e) => {
      if (isOpen && !overlay.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeOverlay();
      }
    });
  }

  function toggleOverlay() {
    if (isOpen) {
      closeOverlay();
    } else {
      openOverlay();
    }
  }

  function openOverlay() {
    // Close other overlays first (mutually exclusive, except stars)
    if (window.closeLeoMesh) window.closeLeoMesh();
    if (window.closeMissionTerminal) window.closeMissionTerminal();
    if (window.closeBirbaGallery) window.closeBirbaGallery();
    if (window.closeFatTree) window.closeFatTree();

    isOpen = true;
    overlay.classList.add("open");
    toggleBtn.classList.add("active");
    toggleBtn.innerHTML = '<span class="easter-icon">⚖️</span><span class="toggle-indicator on">ON</span>';

    initTopology();
    packets.length = 0;
    simStartTime = performance.now();
    lastTime = 0;
    lastPacketTime = 0;

    // Clear canvas
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    animationId = requestAnimationFrame(animate);
  }

  function closeOverlay() {
    isOpen = false;
    overlay.classList.remove("open");
    toggleBtn.classList.remove("active");
    toggleBtn.innerHTML = '<span class="easter-icon">⚖️</span><span class="toggle-indicator off">OFF</span>';

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // Expose close function globally
  window.closePacketTrails = closeOverlay;

  // Mark eg-ready for anti-FOUC
  function markEgReady() {
    document.documentElement.classList.add("eg-ready");
  }

  // === Init ===
  function init() {
    createUI();
    markEgReady();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
