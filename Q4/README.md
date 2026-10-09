# Q4 - Phong reflection

Based on the supplied cylinder/sphere scene: https://playground.babylonjs.com/#JJVK0D

- `a/4a.js`: one point light, original material and light values.
- `b/4b.js`: three parameter experiments, selected by `EXPERIMENT`.
- `c/4c.js`: two point lights.

## Run

Serve the project root with Servez and open `/Q4/index.html`. The links select each part. **Save PNG** captures the canvas. Keep the same window size and camera view for comparisons. Internet access is required for Babylon.js.

The `.js` files can also be pasted directly into the Babylon Playground JavaScript editor. They use a global `createScene` function, without an ES-module export.

## Lighting

Ambient is added once. Each point light adds diffuse and Phong specular terms, multiplied by light color and `1/(1 + 0.1*d*d)` distance attenuation. The falloff coefficient is an implementation choice; the starter does not specify one.

## Submission

Include `Q4a.png`, `Q4b_1.png`, `Q4b_2.png`, `Q4b_3.png`, and `Q4c.png` in the PDF. Parameter changes for (b) are in `b/README.md`.

For the required Babylon export, run `c/4c.js` in the Playground, select **Download**, extract the ZIP, and place its `index.html` in `c/`. The local runner here is not that export.

JavaScript setup checks and offscreen GLSL ES lighting tests passed. Full Babylon browser rendering and the five screenshots still require a browser run.
