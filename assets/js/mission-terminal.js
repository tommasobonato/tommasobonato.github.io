/**
 * Mission Terminal Easter Egg
 * A lightweight terminal overlay for space-themed commands
 */
(function () {
  "use strict";

  // State
  const state = {
    isOpen: false,
    history: [],
    historyIndex: -1,
    currentInput: "",
    reducedMotion: false,
    outputQueue: [],
    isTyping: false,
  };

  // DOM refs
  let btn, overlay, outputEl, inputEl, closeBtn, helpBtn;

  // Check reduced motion preference
  state.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Commands
  const commands = {
    help: () => [
      "┌─────────────────────────────────────┐",
      "│     Mission Terminal v1.0          │",
      "├─────────────────────────────────────┤",
      "│ Available commands:                │",
      "│                                    │",
      "│  traceroute mars  - Route to Mars  │",
      "│  ping moon        - Ping the Moon  │",
      "│  handshake        - TCP docking    │",
      "│  clear            - Clear screen   │",
      "│  help             - This message   │",
      "└─────────────────────────────────────┘",
    ],

    clear: () => {
      outputEl.innerHTML = "";
      return [];
    },

    "traceroute mars": () => {
      const hops = [
        { name: "gateway.local", base: 1 },
        { name: "isp-core.net", base: 12 },
        { name: "tier1.backbone.net", base: 28 },
        { name: "dsn-goldstone.nasa.gov", base: 85 },
        { name: "dsn-madrid.esa.int", base: 142 },
        { name: "dsn-canberra.csiro.au", base: 198 },
        { name: "relay-l1.lagrange.sol", base: 45000 },
        { name: "relay-l2.lagrange.sol", base: 89000 },
        { name: "orbital-beacon.mars", base: 180000 },
        { name: "olympus-base.mars.sol", base: 243000 },
      ];

      const lines = ["traceroute to mars (192.168.mars.1), 30 hops max", ""];

      hops.forEach((hop, i) => {
        const hopNum = (i + 1).toString().padStart(2, " ");
        // Sometimes a hop times out
        if (Math.random() < 0.12) {
          lines.push(`${hopNum}  * * *`);
        } else {
          const jitter = Math.random() * hop.base * 0.15;
          const rtt1 = (hop.base + jitter).toFixed(hop.base > 1000 ? 0 : 1);
          const rtt2 = (hop.base + jitter * 1.1).toFixed(hop.base > 1000 ? 0 : 1);
          const rtt3 = (hop.base + jitter * 0.9).toFixed(hop.base > 1000 ? 0 : 1);
          const unit = hop.base > 1000 ? "ms" : "ms";
          lines.push(`${hopNum}  ${hop.name}  ${rtt1}${unit}  ${rtt2}${unit}  ${rtt3}${unit}`);
        }
      });

      lines.push("", "Route complete. Signal strength: nominal.");
      return lines;
    },

    "ping moon": () => {
      const baseRtt = 2560; // ~2.56s light delay to moon
      const lines = ["PING moon (10.384.400.km): 56 data bytes", ""];

      for (let i = 0; i < 5; i++) {
        const jitter = (Math.random() - 0.5) * 120;
        const rtt = (baseRtt + jitter).toFixed(1);
        lines.push(`64 bytes from moon: icmp_seq=${i} ttl=64 time=${rtt} ms`);
      }

      const avg = (baseRtt + (Math.random() - 0.5) * 50).toFixed(1);
      lines.push("");
      lines.push("--- moon ping statistics ---");
      lines.push(`5 packets transmitted, 5 received, 0% packet loss`);
      lines.push(`rtt min/avg/max = ${(baseRtt - 60).toFixed(1)}/${avg}/${(baseRtt + 60).toFixed(1)} ms`);
      return lines;
    },

    handshake: () => {
      return [
        "┌──────────────────────────────────────┐",
        "│         TCP Docking Sequence         │",
        "└──────────────────────────────────────┘",
        "",
        "  [Capsule A]              [Capsule B]",
        "     ╔═╗                      ╔═╗",
        "     ║ ╠══════ SYN ══════════>║ ║",
        "     ║ ║                      ║ ║",
        "     ║ ║<════ SYN-ACK ════════╣ ║",
        "     ║ ║                      ║ ║",
        "     ║ ╠══════ ACK ══════════>║ ║",
        "     ╚═╝                      ╚═╝",
        "",
        "  ✓ Connection established",
        "  ✓ Docking clamps engaged",
        "  ✓ Pressure equalized",
        "",
        "  Status: DOCKED 🚀",
      ];
    },

    // Hidden command - not in help
    "whois gf": () => {
      return [
        "",
        "  ╔════════════════════════════════════╗",
        "  ║                                    ║",
        "  ║         The Amazing Huan           ║",
        "  ║                                    ║",
        "  ╚════════════════════════════════════╝",
        "",
      ];
    },
  };

  // Type output with effect (or instant if reduced motion)
  function typeOutput(lines, callback) {
    if (state.reducedMotion || !lines.length) {
      lines.forEach((line) => appendLine(line));
      if (callback) callback();
      return;
    }

    state.isTyping = true;
    let lineIdx = 0;
    let charIdx = 0;
    let currentSpan = null;

    function typeNext() {
      if (lineIdx >= lines.length) {
        state.isTyping = false;
        if (callback) callback();
        return;
      }

      const line = lines[lineIdx];

      if (charIdx === 0) {
        currentSpan = document.createElement("div");
        currentSpan.className = "term-line";
        outputEl.appendChild(currentSpan);
      }

      if (charIdx < line.length) {
        currentSpan.textContent += line[charIdx];
        charIdx++;
        scrollToBottom();
        setTimeout(typeNext, 8 + Math.random() * 8);
      } else {
        lineIdx++;
        charIdx = 0;
        setTimeout(typeNext, 30);
      }
    }

    typeNext();
  }

  function appendLine(text, className) {
    const div = document.createElement("div");
    div.className = "term-line" + (className ? " " + className : "");
    div.textContent = text;
    outputEl.appendChild(div);
    scrollToBottom();
  }

  function scrollToBottom() {
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  // Execute command
  function execCommand(input) {
    const trimmed = input.trim().toLowerCase();

    // Echo the command
    appendLine(`guest@groundstation:~$ ${input}`, "term-cmd");

    if (!trimmed) return;

    // Add to history
    state.history.push(input);
    state.historyIndex = state.history.length;

    // Find command
    const cmd = commands[trimmed];
    if (cmd) {
      const output = cmd();
      if (output && output.length) {
        typeOutput(output);
      }
    } else {
      appendLine(`Unknown command: ${trimmed}. Type \`help\`.`, "term-error");
    }
  }

  // Handle input
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      const val = inputEl.value;
      inputEl.value = "";
      state.currentInput = "";
      execCommand(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (state.historyIndex > 0) {
        state.historyIndex--;
        inputEl.value = state.history[state.historyIndex] || "";
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        inputEl.value = state.history[state.historyIndex] || "";
      } else {
        state.historyIndex = state.history.length;
        inputEl.value = state.currentInput;
      }
    } else if (e.key === "Escape") {
      close();
    }
  }

  // Open/close
  function open() {
    // Close other overlays first (mutually exclusive, except stars)
    if (window.closeLeoMesh) window.closeLeoMesh();
    if (window.closeBirbaGallery) window.closeBirbaGallery();

    state.isOpen = true;
    overlay.classList.add("open");
    btn.classList.add("active");
    setTimeout(() => inputEl.focus(), 50);
  }

  function close() {
    state.isOpen = false;
    overlay.classList.remove("open");
    btn.classList.remove("active");
  }

  // Expose close function globally for other easter eggs
  window.closeMissionTerminal = close;

  function toggle() {
    state.isOpen ? close() : open();
  }

  // Show help tooltip
  function showHelp() {
    execCommand("help");
  }

  // Create DOM
  function createDOM() {
    // Button
    btn = document.createElement("button");
    btn.className = "mission-term-btn";
    btn.setAttribute("aria-label", "Open Mission Terminal");
    btn.setAttribute("title", "Terminal: try `help`");
    btn.innerHTML = '<span class="term-icon">&gt;_</span><span class="toggle-indicator"></span>';
    btn.addEventListener("click", toggle);

    // Overlay
    overlay = document.createElement("div");
    overlay.className = "mission-term-overlay";
    overlay.innerHTML = `
      <div class="mission-term-header">
        <span class="mission-term-title">Mission Terminal</span>
        <div class="mission-term-header-btns">
          <button class="mission-term-help" title="Show available commands">?</button>
          <button class="mission-term-close" title="Close">&times;</button>
        </div>
      </div>
      <div class="mission-term-output"></div>
      <div class="mission-term-input-row">
        <span class="mission-term-prompt">guest@groundstation:~$</span>
        <input type="text" class="mission-term-input" spellcheck="false" autocomplete="off" autocapitalize="off" />
      </div>
    `;

    outputEl = overlay.querySelector(".mission-term-output");
    inputEl = overlay.querySelector(".mission-term-input");
    closeBtn = overlay.querySelector(".mission-term-close");
    helpBtn = overlay.querySelector(".mission-term-help");

    closeBtn.addEventListener("click", close);
    helpBtn.addEventListener("click", showHelp);
    inputEl.addEventListener("keydown", handleKeyDown);

    // Apply reduced motion class
    if (state.reducedMotion) {
      overlay.classList.add("reduced-motion");
    }

    document.body.appendChild(btn);
    document.body.appendChild(overlay);

    // Global ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.isOpen) {
        close();
      }
    });

    // Welcome message
    appendLine("Mission Terminal v1.0 — Type `help` for commands.", "term-welcome");
  }

  // Init
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createDOM);
    } else {
      createDOM();
    }
  }

  init();
})();
