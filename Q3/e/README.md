# Q3(e) — Camera projection

Python 3.10+; no external packages. Computes the projection matrix, clip
coordinates, NDC, and pixels.

```text
python projection.py
python projection.py --point 0.2 0.1 -4 1
python projection.py --help
python -m unittest -v
```

Camera options: `--width`, `--height`, `--near`, `--far`, `--fx`, `--fy`,
`--ox`, `--oy`. Point values are `x y z w`.
Default result: `(u, v) = (440, 180)`; see `sample_output.txt`.

Column vectors, negative-Z viewing direction, zero skew. The matrix follows
Lecture 10, p. 10: `M[1][2] = (2*oy-H)/H`. Pixel conversion follows Q3(d):
`v = (y_ndc+1)*H/2`. Thus the optical axis maps to `(ox, H-oy)`.
No additional vertical flip is applied.

Outside-frustum points are flagged, not clamped. Invalid parameters and zero
clip-w are rejected.
