(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ===== Latency widget ===== */
  function initLatency() {
    const lat = $("#tb-latency");
    if (!lat) return;
    let loadMs = 0;
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (nav && nav.loadEventEnd) loadMs = Math.round(nav.loadEventEnd);
    } catch (_) {}
    if (!loadMs) loadMs = Math.round(performance.now());
    const DC_EW = 0.1,
      ZRH_FRA = 8.0,
      LEO = 40.0,
      fmt = (v) => (v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
    lat.classList.add("latency-card");
    lat.innerHTML = `<button class="tb-close" aria-label="Close" title="Close">×</button>
      <div class="tb-line"><strong>${loadMs} ms</strong> page load</div>
      <div class="tb-line">≈ <b>${fmt(loadMs / DC_EW)}</b>× DC east–west RTT</div>
      <div class="tb-line">≈ <b>${fmt(loadMs / ZRH_FRA)}</b>× ZRH–FRA RTT</div>
      <div class="tb-line">≈ <b>${fmt(loadMs / LEO)}</b>× LEO hop</div>`;
    lat.style.left = "18px";
    lat.style.bottom = "18px";
    lat.style.position = "fixed";
    requestAnimationFrame(() => lat.classList.add("show"));
    const close = () => {
      lat.remove();
    };
    $(".tb-close", lat).addEventListener("click", close);
    setTimeout(() => close(), 20000);
  }

  /* ===== Deterministic fabric =====
        - 4 leaves feeding one ToR, each leaf = 100 Mb/s
        - ToR uplink cap = 200 Mb/s
        - Slider = % of EACH leaf’s 100 Mb/s
        - LOCAL_FRACTION: fraction staying within the same ToR
        - QUEUE_SLOW: visible growth (low-pass queue)
      ================================== */
  const LEAVES_PER_TOR = 4;
  const LEAF_CAP_MB = 80; // lower so 50% rate is sub-cap
  const LOCAL_FRACTION = 0.1;
  const QUEUE_SLOW = 0.02; // smaller => slower visible change
  let simEnabled = true; // hide/show toggle

  const SIM = {
    sendRate: 0.5, // 0..1
    pktBits: 8000, // ~1 KB
    capTorMb: 200, // ToR uplink
    maxQ: 400, // packets
    randDrop: 0, // default 0% probability
  };
  const mbpsToPps = (mbps) => (mbps * 1e6) / SIM.pktBits;

  function makeSwitch(capMb) {
    return {
      q: 0,
      maxQ: SIM.maxQ,
      drops: 0,
      dropAcc: 0, // integer drops + fractional accumulator
      randAcc: 0, // accumulator for random-drop binomial
      servicePps: mbpsToPps(capMb),
      tpMbps: 0,
    };
  }

  const SW = {
    torL: makeSwitch(SIM.capTorMb),
  };

  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

  // One step with random drops, slowed queue dynamics, integer drop counts
  function stepSwitch(sw, inPps, dt) {
    const arrivals = inPps * dt; // packets this step

    // random independent drops on ingress (binomial via accumulator)
    const expRand = arrivals * SIM.randDrop + sw.randAcc;
    const dRandInt = Math.floor(expRand);
    sw.randAcc = expRand - dRandInt;
    const effArr = Math.max(0, arrivals - dRandInt);

    // target queue after service (no slowdown)
    const qBefore = sw.q + effArr;
    const served = Math.min(sw.servicePps * dt, qBefore);
    const targetQ = qBefore - served;

    // apply slow visible dynamics
    let q = sw.q + QUEUE_SLOW * (targetQ - sw.q);

    // overflow drops (integerized via accumulator)
    const dOvFloat = Math.max(0, q - sw.maxQ);
    const dOvTot = dOvFloat + sw.dropAcc;
    const dOvInt = Math.floor(dOvTot);
    sw.dropAcc = dOvTot - dOvInt;
    if (dOvFloat > 0) q = sw.maxQ; // clamp queue

    // commit
    sw.q = q;
    sw.drops += dRandInt + dOvInt; // integer counter only
    sw.tpMbps = ((served / dt) * SIM.pktBits) / 1e6;
    return served; // packets served in dt
  }

  /* ===== Telemetry ===== */
  function buildBank(el, bits) {
    if (!el || el.children.length) return;
    for (let i = 0; i < bits; i++) {
      const d = document.createElement("span");
      d.className = "tb-led";
      el.appendChild(d);
    }
  }
  function setBits(val, width, bank) {
    const leds = $$(".tb-led", bank);
    for (let i = 0; i < width; i++) {
      const on = (val >> (width - 1 - i)) & 1;
      leds[i]?.classList.toggle("on", !!on);
    }
  }
  const toBin = (v, w) => (v >>> 0).toString(2).padStart(w, "0");

  function updateRack(rack, sw, capMb) {
    const bits = parseInt(rack.getAttribute("data-bits") || "6", 10);
    buildBank($(".tb-q", rack), bits);
    buildBank($(".tb-t", rack), bits);
    buildBank($(".tb-dr", rack), bits);

    const qPct = sw.maxQ ? clamp(Math.round((sw.q / sw.maxQ) * 100), 0, 100) : 0;
    const qBits = Math.round((qPct * ((1 << bits) - 1)) / 100);
    const tScaled = clamp(Math.round((sw.tpMbps * ((1 << bits) - 1)) / capMb), 0, (1 << bits) - 1);
    const dBits = Math.min((1 << bits) - 1, sw.drops & ((1 << bits) - 1));

    setBits(qBits, bits, $(".tb-q", rack));
    setBits(tScaled, bits, $(".tb-t", rack));
    setBits(dBits, bits, $(".tb-dr", rack));

    $(".tb-q-bits", rack).textContent = toBin(qBits, bits);
    $(".tb-t-bits", rack).textContent = toBin(tScaled, bits);
    $(".tb-dr-bits", rack).textContent = toBin(dBits, bits);

    $(".tb-q-dec", rack).textContent = qPct; // %
    $(".tb-t-dec", rack).textContent = sw.tpMbps.toFixed(1); // Mb/s
    $(".tb-dr-dec", rack).textContent = String(sw.drops); // int
  }
  function refreshTelemetry() {
    const torRack = $("#torL-rack");
    if (torRack) updateRack(torRack, SW.torL, SIM.capTorMb);
  }

  /* ===== Controls ===== */
  function initControls() {
    const rate = $("#sim-rate"),
      rateVal = $("#sim-rate-val");
    const rdp = $("#sim-rdrop"),
      rdpVal = $("#sim-rdrop-val");

    if (rate) {
      rate.addEventListener("input", (e) => {
        SIM.sendRate = +e.target.value / 100;
        rateVal.textContent = `${Math.round(SIM.sendRate * 100)}%`;
      });
    }
    if (rdp) {
      rdp.addEventListener("input", (e) => {
        const pct = parseFloat(e.target.value); // 0..1 (%)
        SIM.randDrop = pct / 100; // % -> probability
        rdpVal.textContent = `${pct.toFixed(3)}%`;
      });
      rdp.value = "0";
      SIM.randDrop = 0;
      rdpVal.textContent = "0.000%";
    }
  }

  /* ===== Geometry (curves) – unchanged ===== */
  const curves = {};
  let particles = [];
  function sizeWrapperToBio() {
    const wrap = $("#agg-wrapper");
    if (!wrap) return;
    const wide = window.innerWidth >= 768;
    wrap.style.width = "100%";
    wrap.style.maxWidth = "800px";
    wrap.style.marginLeft = wide ? "0" : "auto";
    wrap.style.marginRight = "auto";
    wrap.style.alignItems = wide ? "flex-start" : "center";
  }
  const setPath = (id, d) => {
    const el = $(id.startsWith("#") ? id : "#" + id);
    if (el) el.setAttribute("d", d);
  };
  const saveCurve = (k, p0, p1, p2, p3) => {
    curves[k] = { p0, p1, p2, p3 };
  };
  function redrawTor(torRackId, svgId, pathPrefix) {
    const svg = $("#" + svgId);
    const rack = $("#" + torRackId);
    if (!svg || !rack) return;
    const svgr = svg.getBoundingClientRect();
    const W = svgr.width,
      H = svgr.height;
    svg.setAttribute("viewBox", `0 0 ${Math.max(1, W)} ${Math.max(1, H)}`);
    const sx = W / 2,
      sy = 8,
      by = H - 4,
      midY = (sy + by) / 2;
    const leaves = $$(".leaf", rack.parentElement);
    leaves.forEach((leaf, i) => {
      const lr = leaf.getBoundingClientRect(),
        ex = lr.left + lr.width / 2 - svgr.left;
      const d = `M ${sx},${sy} C ${sx},${midY} ${ex},${midY} ${ex},${by}`;
      setPath(pathPrefix + i, d);
      saveCurve(pathPrefix + i, { x: sx, y: sy }, { x: sx, y: midY }, { x: ex, y: midY }, { x: ex, y: by });
    });
  }
  function redrawAll() {
    redrawTor("torL-rack", "torL-svg", "leafL");
  }

  /* ===== Packet engine (visual only; spawn ~ sendRate) ===== */
  function cubic(p0, p1, p2, p3, t) {
    const u = 1 - t,
      tt = t * t,
      uu = u * u,
      uuu = uu * u,
      ttt = tt * t;
    return { x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x, y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y };
  }
  function clearParticles() {
    particles.forEach((p) => p.el?.remove());
    particles.length = 0;
  }

  function packetEngine() {
    const svgL = $("#torL-svg");
    if (!svgL) return;
    const MAX_PKTS = 90;
    function spawn(key, svg, reverse) {
      if (!simEnabled || !curves[key] || particles.length >= MAX_PKTS || SIM.sendRate <= 0) return;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("class", "pkt");
      c.setAttribute("r", "4");
      svg.appendChild(c);
      particles.push({ el: c, key, start: performance.now(), dur: 3000 + Math.random() * 2000, dir: reverse ? -1 : 1, svg });
    }
    const paths = [
      ["leafL0", svgL, false],
      ["leafL0", svgL, true],
      ["leafL1", svgL, false],
      ["leafL1", svgL, true],
      ["leafL2", svgL, false],
      ["leafL2", svgL, true],
      ["leafL3", svgL, false],
      ["leafL3", svgL, true],
    ];
    const timers = [];
    function scheduleLoop(key, svg, rev) {
      const min = 220,
        max = 1200;
      const interval = max - (max - min) * SIM.sendRate + 180 * Math.random();
      if (SIM.sendRate > 0 && simEnabled) spawn(key, svg, rev);
      const t = setTimeout(() => scheduleLoop(key, svg, rev), interval);
      timers.push(t);
    }
    paths.forEach((p) => scheduleLoop(...p));
    const evalC = (c, t) => cubic(c.p0, c.p1, c.p2, c.p3, t);
    function tick(now) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i],
          c = curves[p.key];
        if (!simEnabled || !c) {
          p.el.remove();
          particles.splice(i, 1);
          continue;
        }
        const t = Math.min(1, Math.max(0, (now - p.start) / p.dur)),
          tt = p.dir === -1 ? 1 - t : t;
        const pos = evalC(c, tt);
        p.el.setAttribute("cx", pos.x.toFixed(2));
        p.el.setAttribute("cy", pos.y.toFixed(2));
        if (t >= 1) {
          p.el.remove();
          particles.splice(i, 1);
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    addEventListener(
      "resize",
      () => {
        clearParticles();
      },
      { passive: true }
    );
    return timers;
  }

  /* ===== Simulation loop ===== */
  function startSimulation() {
    let last = performance.now();
    function step() {
      const now = performance.now(),
        dt = Math.max(0.001, (now - last) / 1000);
      last = now;

      if (!simEnabled) {
        requestAnimationFrame(step);
        return;
      }

      // Per-leaf steady send (Mb/s)
      const leafMb = LEAF_CAP_MB * SIM.sendRate;
      const ingressMb = LEAVES_PER_TOR * leafMb;

      const inPps = mbpsToPps(ingressMb);

      // ToR processes ingress
      stepSwitch(SW.torL, inPps, dt);

      refreshTelemetry();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ===== Toggle visibility ===== */
  function initVisibilityToggle() {
    const btn = $("#sim-visibility");
    const wrapper = $("#agg-wrapper");
    const spacer = $("#agg-spacer");
    const body = $("#agg-body");
    const controls = $(".controls-panel");
    if (!btn || !wrapper) return;
    let particleLoops = [];
    const setState = (on) => {
      simEnabled = on;
      wrapper.classList.toggle("agg-hidden", !on);
      if (spacer) spacer.style.marginBottom = on ? "2rem" : "4rem";
      btn.textContent = on ? "Easter Egg On" : "Easter Egg Off";
      if (!on) {
        clearParticles();
        particleLoops.forEach(clearTimeout);
        particleLoops = [];
      } else {
        // restart packet engine when turning on
        clearParticles();
        redrawAll();
      }
    };
    btn.addEventListener("click", () => {
      const wasOff = !simEnabled;
      setState(!simEnabled);
      // Scroll to fat tree when turning on
      if (wasOff && wrapper) {
        setTimeout(() => {
          wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
    });
    setState(false);
  }

  /* ===== Init ===== */
  document.addEventListener("DOMContentLoaded", () => {
    initLatency();
    initControls();
    initVisibilityToggle();
    sizeWrapperToBio();
    redrawAll();
    setTimeout(() => {
      redrawAll();
      packetEngine();
      startSimulation();
    }, 150);
  });
  addEventListener(
    "load",
    () => {
      sizeWrapperToBio();
      redrawAll();
    },
    { once: true }
  );
  addEventListener(
    "resize",
    () => {
      sizeWrapperToBio();
      redrawAll();
    },
    { passive: true }
  );
})();
