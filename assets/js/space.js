// No <script> tags here
(function () {
  // Global toggle used by the footer button
  window.toggleStarfield = function () {
    document.body.classList.toggle('space-on');
  };

  // Konami code trigger (↑ ↑ ↓ ↓ ← → ← → b a)
  const code = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let i = 0;
  window.addEventListener("keydown", (e) => {
    i = (e.key === code[i]) ? i + 1 : 0;
    if (i === code.length) { window.toggleStarfield(); i = 0; }
  });
})();
