# Multi-plane NIC Visualizer

A single-file, dependency-free interactive visualization of a modern AI-datacenter
**scale-out** network: a multi-plane fat-tree-style fabric, plus a control for how
many NICs each GPU has.

## How to open

Double-click `index.html`, or open it in any modern browser. No build step, no server,
no internet connection required. Everything important is in the one file: HTML, CSS,
JavaScript, and inline SVG.

## What it shows

- **Planes (1-4):** each plane is its _own independent leaf-spine fabric with its own
  ToR switches_. Traffic that enters a plane stays in that plane; planes never
  cross-connect. Adding planes buys path diversity and fault isolation (lose one and the
  rest keep forwarding).
- **NICs per GPU (1-4):** how many physical NICs each GPU has. Every NIC's port is split
  across _all_ planes, so a GPU's total uplinks = `NICs × planes`. Adding NICs buys
  scale-out bandwidth and NIC-level redundancy.
  - **2 = NVIDIA Vera Rubin** (a pair of 800G ConnectX-9 NICs ≈ 1.6 Tb/s per GPU).
  - **1 = Blackwell-style baseline.**
- **Failure drill:** toggles a healthy fabric, one failed plane, one failed NIC per GPU,
  or both together. The visualizer dims failed resources and updates retained bandwidth,
  active planes, active NICs, and active uplinks.
- **Show example flows:** draws a sample path through each plane (leaf → spine → leaf) to
  make plane independence concrete.
- **Tap / hover a plane** in the legend to isolate it and dim the others.
- The stat cards update live. The bandwidth figures assume 800G-class NICs.

> Note: this is the **scale-out** network only. The much larger per-GPU
> NVLink number you see quoted for these platforms is the separate **scale-up** fabric
> inside the rack, which is not drawn here.

## How it's built

Plain vanilla HTML + CSS + JavaScript. A single `render()` path recomputes node
positions from the controls and rebuilds the inline `<svg>` on every change. No
frameworks, no libraries, no external assets.

To customize, edit the constants at the top of the `<script>` (layout coordinates,
`GPU_COUNT`, `NIC_TBPS`, and the plane color arrays) or the slider `min`/`max` in the
markup.

## Concept sources

The model follows how these topologies are described publicly, e.g.:

- OpenAI MRC / Stargate — https://openai.com/index/mrc-supercomputer-networking/
- NVIDIA HGX AI Factory networking — https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory/latest/networking-physical-topologies.html
- NVIDIA Vera Rubin platform — https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform-six-new-chips-one-ai-supercomputer/
- DeepSeek-V3 Multi-Plane Fat-Tree (MPFT) and Alibaba HPN dual-plane, as summarized at
  https://www.fibermall.com/blog/dual-plane-and-multi-plane-networking.htm

This is a simplified teaching schematic (2 GPUs, small switch counts, one spine per
plane); real fabrics are far larger and a plane's spine tier is itself multi-switch.
