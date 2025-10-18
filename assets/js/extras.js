(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* ===== Rocket & Latency (unchanged) ===== */
  function initRocket(){ const bar=$('#tb-rocketbar'); if(!bar) return;
    const track=$('.tb-track',bar), rocket=$('.tb-rocket',bar);
    const update=()=>{ const doc=document.documentElement;
      const st=doc.scrollTop||window.pageYOffset||0, max=Math.max(1,doc.scrollHeight-doc.clientHeight);
      const p=Math.max(0,Math.min(1,st/max));
      track.style.transform=`scaleX(${p})`;
      rocket.style.transform=`translateX(calc(${(p*100).toFixed(3)}% - 8px))`;
      bar.style.opacity=p>0?1:0; };
    update(); addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});
    addEventListener('resize',()=>requestAnimationFrame(update));
  }
  function initLatency(){ const lat=$('#tb-latency'); if(!lat) return; let loadMs=0;
    try{ const nav=performance.getEntriesByType('navigation')[0]; if(nav&&nav.loadEventEnd) loadMs=Math.round(nav.loadEventEnd);}catch(_){}
    if(!loadMs) loadMs=Math.round(performance.now());
    const DC_EW=.10, ZH_FRA=8.0, LEO=40.0, fmt=v=>v>=100?Math.round(v):(v>=10?v.toFixed(1):v.toFixed(2));
    lat.innerHTML=`<button class="tb-close" aria-label="Close" title="Close">×</button>
      <div class="tb-line"><strong>${loadMs} ms</strong> page load</div>
      <div class="tb-line">≈ <b>${fmt(loadMs/DC_EW)}</b>× DC east–west RTT</div>
      <div class="tb-line">≈ <b>${fmt(loadMs/ZH_FRA)}</b>× ZH–FRA RTT</div>
      <div class="tb-line">≈ <b>${fmt(loadMs/LEO)}</b>× LEO hop</div>`;
    requestAnimationFrame(()=>lat.classList.add('show'));
    const secs=parseInt(lat.dataset.seconds||'10',10);
    const timer=setTimeout(()=>lat.remove(),Math.max(0,secs)*1000);
    $('.tb-close',lat).addEventListener('click',()=>{clearTimeout(timer); lat.remove();});
  }

  /* ===== Deterministic fabric =====
     - 4 leaves per ToR, each leaf = 100 Mb/s
     - ToR uplink cap = 200 Mb/s
     - Agg cap        = 400 Mb/s
     - Slider = % of EACH leaf’s 100 Mb/s
     - LOCAL_FRACTION: fraction staying within the same ToR
     - QUEUE_SLOW: visible growth (low-pass queue)
     - Backpressure (checkbox): throttles ingress to a ToR as its queue nears full
  ================================== */
  const LEAVES_PER_TOR = 4;
  const LEAF_CAP_MB    = 100;
  const LOCAL_FRACTION = 0.10;
  const QUEUE_SLOW     = 0.02;       // smaller => slower visible change

  const BP = { enabled:false, start:0.70, end:1.00 }; // start throttling @70% → 0 at 100%

  const SIM = {
    sendRate: 0.50,                  // 0..1
    pktBits:  8000,                  // ~1 KB
    capTorMb: 200,                   // ToR uplink
    capAggMb: 400,                   // Agg
    maxQ:     400,                   // packets
    randDrop: 0.00001                // default 0.001% as probability
  };
  const mbpsToPps = (mbps) => (mbps*1e6) / SIM.pktBits;

  function makeSwitch(capMb){ return {
    q:0, maxQ:SIM.maxQ,
    drops:0, dropAcc:0,   // integer drops + fractional accumulator
    randAcc:0,            // accumulator for random-drop binomial
    servicePps: mbpsToPps(capMb),
    tpMbps: 0
  };}

  const SW = {
    agg:  makeSwitch(SIM.capAggMb),
    torL: makeSwitch(SIM.capTorMb),
    torR: makeSwitch(SIM.capTorMb),
  };

  const clamp = (x,min,max)=>Math.max(min,Math.min(max,x));
  const bpFactor = (qPct)=>{ if(!BP.enabled) return 1;
    if(qPct<=BP.start) return 1;
    if(qPct>=BP.end)   return 0;
    return 1 - (qPct - BP.start)/(BP.end - BP.start); // linear
  };

  // One step with random drops, slowed queue dynamics, integer drop counts
  function stepSwitch(sw, inPps, dt){
    const arrivals = inPps * dt;             // packets this step

    // random independent drops on ingress (binomial via accumulator)
    const expRand   = arrivals * SIM.randDrop + sw.randAcc;
    const dRandInt  = Math.floor(expRand);
    sw.randAcc      = expRand - dRandInt;
    const effArr    = Math.max(0, arrivals - dRandInt);

    // target queue after service (no slowdown)
    const qBefore   = sw.q + effArr;
    const served    = Math.min(sw.servicePps * dt, qBefore);
    const targetQ   = qBefore - served;

    // apply slow visible dynamics
    let q = sw.q + QUEUE_SLOW * (targetQ - sw.q);

    // overflow drops (integerized via accumulator)
    const dOvFloat = Math.max(0, q - sw.maxQ);
    const dOvTot   = dOvFloat + sw.dropAcc;
    const dOvInt   = Math.floor(dOvTot);
    sw.dropAcc     = dOvTot - dOvInt;
    if (dOvFloat > 0) q = sw.maxQ; // clamp queue

    // commit
    sw.q = q;
    sw.drops += dRandInt + dOvInt;           // integer counter only
    sw.tpMbps = (served/dt) * SIM.pktBits / 1e6;
    return served; // packets served in dt
  }

  /* ===== Telemetry ===== */
  function buildBank(el,bits){ if(!el||el.children.length) return; for(let i=0;i<bits;i++){ const d=document.createElement('span'); d.className='tb-led'; el.appendChild(d);} }
  function setBits(val,width,bank){ const leds=$$('.tb-led',bank); for(let i=0;i<width;i++){ const on=(val>>(width-1-i))&1; leds[i]?.classList.toggle('on',!!on);} }
  const toBin=(v,w)=>(v>>>0).toString(2).padStart(w,'0');

  function updateRack(rack, sw, capMb){
    const bits=parseInt(rack.getAttribute('data-bits')||'6',10);
    buildBank($('.tb-q',rack),bits); buildBank($('.tb-t',rack),bits); buildBank($('.tb-dr',rack),bits);

    const qPct    = sw.maxQ ? clamp(Math.round(sw.q / sw.maxQ * 100),0,100) : 0;
    const qBits   = Math.round(qPct * ((1<<bits)-1) / 100);
    const tScaled = clamp(Math.round(sw.tpMbps * ((1<<bits)-1) / capMb ), 0, (1<<bits)-1);
    const dBits   = Math.min((1<<bits)-1, sw.drops & ((1<<bits)-1));

    setBits(qBits,bits,$('.tb-q',rack));
    setBits(tScaled,bits,$('.tb-t',rack));
    setBits(dBits,bits,$('.tb-dr',rack));

    $('.tb-q-bits',rack).textContent  = toBin(qBits,bits);
    $('.tb-t-bits',rack).textContent  = toBin(tScaled,bits);
    $('.tb-dr-bits',rack).textContent = toBin(dBits,bits);

    $('.tb-q-dec',rack).textContent  = qPct;                   // %
    $('.tb-t-dec',rack).textContent  = sw.tpMbps.toFixed(1);   // Mb/s
    $('.tb-dr-dec',rack).textContent = String(sw.drops);       // int
  }
  function refreshTelemetry(){
    const aggRack  = $('#agg-rack');
    const torLRack = $('#torL-rack');
    const torRRack = $('#torR-rack');
    if (aggRack)  updateRack(aggRack,  SW.agg,  SIM.capAggMb);
    if (torLRack) updateRack(torLRack, SW.torL, SIM.capTorMb);
    if (torRRack) updateRack(torRRack, SW.torR, SIM.capTorMb);
  }

  /* ===== Controls ===== */
  function initControls(){
    const rate = $('#sim-rate'), rateVal = $('#sim-rate-val');
    const qmax = $('#sim-qmax'), qmaxVal = $('#sim-qmax-val');
    const rdp  = $('#sim-rdrop'), rdpVal = $('#sim-rdrop-val');
    const bp   = $('#sim-bp');

    if (rate){
      rate.addEventListener('input', e=>{
        SIM.sendRate = (+e.target.value)/100;
        rateVal.textContent = `${Math.round(SIM.sendRate*100)}%`;
      });
    }
    if (qmax){
      qmax.addEventListener('input', e=>{
        SIM.maxQ = parseInt(e.target.value,10);
        SW.agg.maxQ = SW.torL.maxQ = SW.torR.maxQ = SIM.maxQ;
        qmaxVal.textContent = String(SIM.maxQ);
      });
    }
    if (rdp){
      rdp.addEventListener('input', e=>{
        const pct = parseFloat(e.target.value);    // 0..1 (%)
        SIM.randDrop = pct/100;                    // % -> probability
        rdpVal.textContent = `${pct.toFixed(3)}%`;
      });
      SIM.randDrop = parseFloat(rdp.value)/100;    // init
    }
    if (bp){
      BP.enabled = bp.checked || false;
      bp.addEventListener('change', e=>{ BP.enabled = !!e.target.checked; });
    }
  }

  /* ===== Geometry (curves) – unchanged ===== */
  const curves = {};
  function sizeWrapperToBio(){ const wrap=$('#agg-wrapper'); if(!wrap) return;
    const article=wrap.closest('article'); const pic=article?article.querySelector('.profile.float-right, .profile.float-left, .profile'):null;
    wrap.style.width='100%'; wrap.style.marginLeft=''; wrap.style.marginRight='';
    if(article && pic){ const ar=article.getBoundingClientRect(), pr=pic.getBoundingClientRect();
      const textWidth=Math.round(pr.left-ar.left-16); if(textWidth>200){ wrap.style.width=textWidth+'px'; wrap.style.marginLeft='0'; wrap.style.marginRight='auto'; } } }
  const setPath=(id,d)=>{ const el=$(id.startsWith('#')?id:'#'+id); if(el) el.setAttribute('d',d); };
  const saveCurve=(k,p0,p1,p2,p3)=>{ curves[k]={p0,p1,p2,p3}; };
  function redrawAggTop(){ const wrap=$('#agg-wrapper'), svg=$('#agg-svg'), leftRack=$('#torL-rack'), rightRack=$('#torR-rack');
    if(!wrap||!svg||!(leftRack&&rightRack)) return;
    const wr=wrap.getBoundingClientRect(), lr=leftRack.getBoundingClientRect(), rr=rightRack.getBoundingClientRect(), svgr=svg.getBoundingClientRect();
    const W=wr.width, H=svgr.height, sx=W/2, sy=8, lx=(lr.left+lr.width/2)-wr.left, rx=(rr.left+rr.width/2)-wr.left, by=H-4, midY=(sy+by)/2;
    const dL=`M ${sx},${sy} C ${sx},${midY} ${lx},${midY} ${lx},${by}`;
    const dR=`M ${sx},${sy} C ${sx},${midY} ${rx},${midY} ${rx},${by}`;
    svg.setAttribute('viewBox',`0 0 ${Math.max(1,W)} ${Math.max(1,H)}`);
    setPath('agg-left',dL); setPath('agg-right',dR);
    saveCurve('agg-left',{x:sx,y:sy},{x:sx,y:midY},{x:lx,y:midY},{x:lx,y:by});
    saveCurve('agg-right',{x:sx,y:sy},{x:sx,y:midY},{x:rx,y:midY},{x:rx,y:by}); }
  function redrawTor(torRackId, svgId, pathPrefix){
    const svg=$('#'+svgId); const rack=$('#'+torRackId); if(!svg||!rack) return;
    const svgr=svg.getBoundingClientRect(); const W=svgr.width, H=svgr.height;
    svg.setAttribute('viewBox',`0 0 ${Math.max(1,W)} ${Math.max(1,H)}`);
    const sx=W/2, sy=8, by=H-4, midY=(sy+by)/2;
    const leaves=$$('.leaf', rack.parentElement);
    leaves.forEach((leaf,i)=>{
      const lr=leaf.getBoundingClientRect(), ex=(lr.left+lr.width/2)-svgr.left;
      const d=`M ${sx},${sy} C ${sx},${midY} ${ex},${midY} ${ex},${by}`;
      setPath(pathPrefix+i,d);
      saveCurve(pathPrefix+i,{x:sx,y:sy},{x:sx,y:midY},{x:ex,y:midY},{x:ex,y:by}); }); }
  function redrawAll(){ redrawAggTop(); redrawTor('torL-rack','torL-svg','leafL'); redrawTor('torR-rack','torR-svg','leafR'); }

  /* ===== Packet engine (visual only; spawn ~ sendRate) ===== */
  function cubic(p0,p1,p2,p3,t){ const u=1-t,tt=t*t,uu=u*u,uuu=uu*u,ttt=tt*t;
    return { x:uuu*p0.x+3*uu*t*p1.x+3*u*tt*p2.x+ttt*p3.x, y:uuu*p0.y+3*uu*t*p1.y+3*u*tt*p2.y+ttt*p3.y }; }
  function packetEngine(){
    const svgTop=$('#agg-svg'), svgL=$('#torL-svg'), svgR=$('#torR-svg'); if(!svgTop||!svgL||!svgR) return;
    const MAX_PKTS=180; const particles=[];
    function spawn(key, svg, reverse){
      if(!curves[key] || particles.length>=MAX_PKTS || SIM.sendRate<=0) return;
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('class','pkt'); c.setAttribute('r','4'); svg.appendChild(c);
      particles.push({ el:c, key, start:performance.now(), dur:(3000+Math.random()*2000), dir: reverse?-1:1, svg });
    }
    const paths = [
      ['agg-left',svgTop,false], ['agg-left',svgTop,true],
      ['agg-right',svgTop,false],['agg-right',svgTop,true],
      ['leafL0',svgL,false],['leafL0',svgL,true],
      ['leafL1',svgL,false],['leafL1',svgL,true],
      ['leafL2',svgL,false],['leafL2',svgL,true],
      ['leafL3',svgL,false],['leafL3',svgL,true],
      ['leafR0',svgR,false],['leafR0',svgR,true],
      ['leafR1',svgR,false],['leafR1',svgR,true],
      ['leafR2',svgR,false],['leafR2',svgR,true],
      ['leafR3',svgR,false],['leafR3',svgR,true],
    ];
    function scheduleLoop(key, svg, rev){
      const min=120, max=1100;
      const interval = (max - (max - min)*SIM.sendRate) + 120*Math.random();
      if (SIM.sendRate > 0) spawn(key, svg, rev);
      setTimeout(()=>scheduleLoop(key, svg, rev), interval);
    }
    paths.forEach(p=>scheduleLoop(...p));
    const evalC=(c,t)=>cubic(c.p0,c.p1,c.p2,c.p3,t);
    function tick(now){
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i], c=curves[p.key]; if(!c){ p.el.remove(); particles.splice(i,1); continue; }
        const t=Math.min(1,Math.max(0,(now-p.start)/p.dur)), tt=p.dir===-1?1-t:t;
        const pos=evalC(c,tt); p.el.setAttribute('cx',pos.x.toFixed(2)); p.el.setAttribute('cy',pos.y.toFixed(2));
        if(t>=1){ p.el.remove(); particles.splice(i,1); }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    addEventListener('resize',()=>{ particles.forEach(p=>p.el.remove()); particles.length=0; },{passive:true});
  }

  /* ===== Simulation loop ===== */
  function startSimulation(){
    let last = performance.now();
    function step(){
      const now = performance.now(), dt = Math.max(0.001, (now - last)/1000); last = now;

      // Per-leaf steady send (Mb/s)
      const leafMb = LEAF_CAP_MB * SIM.sendRate;
      const toCoreMb = LEAVES_PER_TOR * leafMb * (1 - LOCAL_FRACTION); // per ToR

      // Backpressure factors based on current queue occupancy
      const fL = bpFactor(SW.torL.maxQ ? SW.torL.q / SW.torL.maxQ : 0);
      const fR = bpFactor(SW.torR.maxQ ? SW.torR.q / SW.torR.maxQ : 0);

      const inLpps = mbpsToPps(toCoreMb * fL);
      const inRpps = mbpsToPps(toCoreMb * fR);

      // ToRs process ingress
      const servedL = stepSwitch(SW.torL, inLpps, dt);
      const servedR = stepSwitch(SW.torR, inRpps, dt);
      const outLpps  = servedL / dt;
      const outRpps  = servedR / dt;

      // Agg receives from both ToRs
      stepSwitch(SW.agg, outLpps + outRpps, dt);

      refreshTelemetry();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ===== Init ===== */
  document.addEventListener('DOMContentLoaded', () => {
    initRocket(); initLatency(); initControls();
    sizeWrapperToBio(); redrawAll();
    setTimeout(()=>{ redrawAll(); packetEngine(); startSimulation(); }, 150);
  });
  addEventListener('load',  () => { sizeWrapperToBio(); redrawAll(); }, { once:true });
  addEventListener('resize', () => { sizeWrapperToBio(); redrawAll(); }, { passive:true });
})();
