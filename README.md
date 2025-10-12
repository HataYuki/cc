# Creative Coding Workspace – sketch19 (current)

This repository is a Three.js–based creative coding workspace. The current, actively developed project is `sketch19/`. It features fast development/build with Vite, GLSL shader ingestion, post-processing, and robust resource lifecycle management.

## What’s in sketch19

- Three.js 0.179.x (renderer/scene/camera/OrbitControls)
- Post-processing (EffectComposer, standard passes including FXAA)
- GLSL shader importing (`vite-plugin-glsl`)
- Tweakpane (GUI), GSAP, maath, emittery, user-agent parsing (`ua-parser-js`)
- Styling with SCSS; Tailwind via `@tailwindcss/vite` is available
- Safe-by-default Terser minification (reduced mangling to avoid runtime issues)

## Design highlights

- Lifecycle and disposal
	- `app.dispose()` is invoked on safe exit points: `pagehide`, `beforeunload`, `visibilitychange(hidden)`, and Vite HMR. A custom `xdraw:dispose` event is emitted.
	- Three.js resources (textures, geometries, materials) are explicitly disposed. `OrbitControls.dispose()` cleans up DOM listeners. Font assets are JS-only and use reference cleanup (no GPU dispose).
	- Disposal is idempotent and unregisters listeners after execution.
- Manager pattern (decoupled input/viewport)
	- `ViewportManager` caches size and throttles resize via rAF; `consumeViewportUpdate(object, flag)` pattern ensures one-time reactions.
	- `ScrollManager` unifies wheel/touch with inertia simulation and normalized deltas; `consumeScrollUpdate` for pull-based consumption.
	- `SwipeManager` detects swipe start/end using smoothing and speed thresholds; `consumeSwipeX/Y` APIs.
	- `CursorManager` tracks mouse position/delta/speed with rAF throttling; `consumeCursorUpdate` API.
	- `InputKeyManager` supports modifier-aware combos (Ctrl/Shift/Alt/Meta) and press/release hooks.
- Update loop and helpers
	- A single rAF ticker feeds `update(time, deltaTime)`; a tiny `fps(targetFps)` helper is available to gate expensive work.
	- First-frame guard enables one-time initialization steps inside the main loop when needed.
- Asset pipeline
	- `AssetManager` distinguishes “must” vs “all” assets, tracks progress, and exposes `consume*` flags for reactive UIs.
	- Uses `TextureLoader`, `RGBELoader`, and `FontLoader` with type-aware disposal.
- Rendering and post-processing
	- `EffectComposer` is wired with a base `ShaderPass`; additional passes can be plugged in via `effect(addPass, ShaderPass)`.
	- GLSL files are imported as template literals through `vite-plugin-glsl`.
- Build and DX
	- Vite v6 with chunk splitting (e.g., `three`, `vendor`), conservative Terser settings to avoid fragile mangling, Tailwind optional.
	- HMR-friendly app structure and convenient preview scripts.

### Directory layout (excerpt)

```
sketch19/
	index.html
	package.json
	vite.config.js
	public/
		fonts/  textures/
	src/
		app.js  main.js  style.scss  utill.js
		shader/ (vertex.glsl/fragment.glsl, etc.)
```

## Setup and run

Node 18+ is recommended (compatible with Vite v6).

```bash
cd sketch19
npm install
npm run dev     # http://localhost:5173/
```

Production build and preview:

```bash
npm run build                 # outputs to dist/
npm run preview               # serves at http://localhost:4173/
npm run preview:open          # opens browser automatically
```

## Build notes

- Build splits into chunks (e.g., `three` and `vendor`) for faster caching.
- Terser is configured for safety (e.g., `mangle.toplevel=false`, `mangle.properties=false`) to avoid runtime errors such as `ht.call(...).ha is not a function`.
- GLSL is embedded via `vite-plugin-glsl` as template literals. Newlines inside shader strings may remain; under gzip they have minimal size impact and do not affect behavior.

## Lifecycle and disposal (important)

- `app.dispose()` is invoked on safe exit points to release resources:
	- `pagehide`, `beforeunload`, `visibilitychange(hidden)`, and Vite HMR dispose
	- a custom `xdraw:dispose` event is also dispatched
- Three.js `OrbitControls` implements `.dispose()` to remove DOM listeners.
- Textures, geometries, and materials are disposed. Font assets (`type: "Font"`) are JS-only data, so clearing references is sufficient (no GPU dispose required).

## Typical workflow

1) Develop with `npm run dev` (HMR for GLSL/JS)
2) Iterate on shaders and parameters; use Tweakpane for live controls
3) `npm run build` → validate output via `npm run preview`

## Troubleshooting

- Runtime minification error like `...ha is not a function`:
	- Keep Terser in safe mode: `mangle.properties=false`, `mangle.toplevel=false`, `compress.properties=false`, `compress.inline=1`.
- Newlines visible in output:
	- JS is minified into single lines; GLSL strings may retain newlines by design. It’s fine under gzip and functionally harmless.

## Legacy projects

`three00/` – `three16/` and `sketch/` are earlier templates/experiments. For new work or references, start from `sketch19/`.

## License

See the bundled `LICENSE` file.
