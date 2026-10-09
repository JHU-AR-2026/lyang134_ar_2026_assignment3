# Q2 — WebXR Duck

A Babylon.js scene for placing, moving, rotating, scaling, and resetting Duck models. Manipulation affects only the most recently spawned model.

## Run

Serve the project root with Servez and open `/Q2/f/index.html` at the displayed server address. Keep the shared model at `Q2/a/assets/Duck.glb`. Internet access is required for Babylon.js, its loader, and the Draco decoder.

Select **Enter AR** on a compatible device or emulator. Physical-headset access requires trusted HTTPS and controller/hit-test support.

## Parts

`b/`: spawn; `c/`: add movement; `d/`: add rotation; `e/`: add scaling; `f/`: add reset. Each version includes the preceding parts.

## Controls

| Action | Controller | Desktop |
|---|---|---|
| Spawn | Right trigger | Space |
| Move on XZ plane | Right thumbstick | Arrow keys |
| Rotate about Y | Left thumbstick | Q / E |
| Scale up / down | Right A / B | A / B |
| Reset spawn transform | Left X | X |

In desktop mode, click the floor to set the placement target. This mode uses a virtual floor, not real-world hit testing.

## Model and tests

Model attribution and license: `a/assets/MODEL_CREDIT.md`.

Logic tests, from the project root: `node --test Q2/tests/q2.test.cjs`.
Test results and device-testing notes: `VERIFICATION.md`.
