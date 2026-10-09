# Q4(b) - Parameter experiments

`4b.js` uses the same shader as (a). Set `EXPERIMENT` to 1, 2, or 3 in the Playground, or use the links in `/Q4/index.html`.

| Experiment | Changes from (a) |
|---|---|
| 1 | `uMatAmbient`: 0.25 -> 0.5; `uMatDiffuse`: (0.8, 0.2, 0.2) -> (0.2, 0.7, 0.3) |
| 2 | `uMatSpecular`: (1, 1, 1) -> (0.3, 0.3, 0.3); `uMatShininess`: 32 -> 8 |
| 3 | `uPointLightColor`: (0.7, 0.8, 1.0) -> (1.0, 0.4, 0.2); `uPointLightPos`: (2.5, 4, -2) -> (-3, 3, -2) |

All other parameters retain the defaults from (a). The three experiments cover all six required parameters.

Save `Q4b_1.png`, `Q4b_2.png`, and `Q4b_3.png`. Use the table values as the corresponding PDF captions.
