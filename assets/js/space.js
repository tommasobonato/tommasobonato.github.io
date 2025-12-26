// No <script> tags here
(function () {
  // Global toggle used by fixed button
  window.toggleStarfield = function () {
    document.body.classList.toggle('space-on');
    updateStarfieldButton();
  };

  function updateStarfieldButton() {
    const btn = document.getElementById('starfield-toggle-btn');
    if (!btn) return;
    const isOn = document.body.classList.contains('space-on');
    btn.classList.toggle('active', isOn);
    btn.innerHTML = isOn ? '🌌<span class="toggle-indicator on">ON</span>' : '🌌<span class="toggle-indicator off">OFF</span>';
  }

  function createStarfieldButton() {
    const btn = document.createElement('button');
    btn.id = 'starfield-toggle-btn';
    btn.className = 'starfield-toggle-btn';
    btn.title = 'Toggle Stars';
    btn.addEventListener('click', window.toggleStarfield);
    document.body.appendChild(btn);
    updateStarfieldButton();
  }

  // On by default
  if (document && document.body) {
    document.body.classList.add('space-on');
  }

  // Konami code trigger (↑ ↑ ↓ ↓ ← → ← → b a)
  const code = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let i = 0;
  window.addEventListener("keydown", (e) => {
    i = (e.key === code[i]) ? i + 1 : 0;
    if (i === code.length) { window.toggleStarfield(); i = 0; }
  });

  // Init button on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createStarfieldButton);
  } else {
    createStarfieldButton();
  }
})();
