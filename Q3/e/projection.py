"""Q3(e): camera coordinates -> clip coordinates -> NDC -> pixels.

Uses the zero-skew matrix printed on Lecture 10, page 10, followed by
Assignment 3, Q3(d)'s viewport equations. No additional vertical flip.
"""

from __future__ import annotations

import argparse
import math
from typing import NamedTuple, Sequence


class ProjectionResult(NamedTuple):
    matrix: list[list[float]]
    clip: tuple[float, ...]
    ndc: tuple[float, ...]
    pixel: tuple[float, float]
    inside_frustum: bool


def projection_matrix(width: int, height: int, near: float, far: float,
                      fx: float, fy: float, ox: float, oy: float) -> list[list[float]]:
    """Build the lecture's 4x4 projection matrix for column vectors."""
    values = (width, height, near, far, fx, fy, ox, oy)
    if not all(math.isfinite(value) for value in values):
        raise ValueError("Camera parameters must be finite numbers.")
    if width <= 0 or height <= 0 or width != int(width) or height != int(height):
        raise ValueError("Width and height must be positive integers.")
    if not 0 < near < far:
        raise ValueError("Clipping planes must satisfy 0 < near < far.")
    if fx <= 0 or fy <= 0:
        raise ValueError("Focal lengths fx and fy must be positive.")

    # Q3(a-b): projection matrix from Lecture 10, p. 10.
    matrix = [
        [2 * fx / width, 0.0, (width - 2 * ox) / width, 0.0],
        [0.0, 2 * fy / height, (2 * oy - height) / height, 0.0],
        [0.0, 0.0, -(far + near) / (far - near), -2 * far * near / (far - near)],
        [0.0, 0.0, -1.0, 0.0],
    ]
    if not all(math.isfinite(value) for row in matrix for value in row):
        raise ValueError("Projection matrix overflow; reduce parameter magnitudes.")
    return matrix


def project_point(point: Sequence[float], *, width: int = 800, height: int = 600,
                  near: float = 0.2, far: float = 20.0, fx: float = 800.0,
                  fy: float = 800.0, ox: float = 400.0,
                  oy: float = 400.0) -> ProjectionResult:
    """Project a finite homogeneous camera point (x, y, z, w), usually w=1.

    Points outside the frustum still have their mathematical pixel coordinates
    returned; they are marked outside rather than clamped to the image edges.
    """
    matrix = projection_matrix(width, height, near, far, fx, fy, ox, oy)
    if len(point) != 4:
        raise ValueError("Camera point must contain four numbers: x y z w.")
    point = tuple(float(value) for value in point)
    if not all(math.isfinite(value) for value in point):
        raise ValueError("Camera point coordinates must be finite numbers.")
    if point[3] == 0:
        raise ValueError("The input w must be nonzero for a finite camera point.")

    # Q3(c): matrix-vector multiplication and perspective divide.
    clip = tuple(sum(row[j] * point[j] for j in range(4)) for row in matrix)
    if clip[3] == 0:
        raise ValueError("Cannot project z = 0: clip w is zero.")
    ndc = tuple(value / clip[3] for value in clip[:3])

    # Q3(d): viewport conversion; v increases with NDC y.
    pixel = (0.5 * (ndc[0] + 1) * width,
             0.5 * (ndc[1] + 1) * height)
    if not all(math.isfinite(value) for value in (*clip, *ndc, *pixel)):
        raise ValueError("Projection overflow; reduce input magnitudes.")

    # A point in front of this camera has Euclidean z < 0.
    in_front = (point[2] < 0) != (point[3] < 0)
    tolerance = 1e-10
    inside = in_front and all(-1 - tolerance <= value <= 1 + tolerance
                              for value in ndc)
    return ProjectionResult(matrix, clip, ndc, pixel, inside)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Q3(e): project a camera point using the Lecture 10 matrix.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("--width", type=int, default=800, help="Viewport width W in pixels")
    parser.add_argument("--height", type=int, default=600, help="Viewport height H in pixels")
    parser.add_argument("--near", type=float, default=0.2, help="Near-plane distance n")
    parser.add_argument("--far", type=float, default=20.0, help="Far-plane distance f")
    parser.add_argument("--fx", type=float, default=800.0, help="Horizontal focal length")
    parser.add_argument("--fy", type=float, default=800.0, help="Vertical focal length")
    parser.add_argument("--ox", type=float, default=400.0, help="Horizontal principal point")
    parser.add_argument("--oy", type=float, default=400.0, help="Vertical principal point (lecture convention)")
    parser.add_argument("--point", type=float, nargs=4, metavar=("X", "Y", "Z", "W"),
                        default=(0.3, -0.15, -6.0, 1.0), help="Homogeneous camera point")
    args = parser.parse_args(argv)
    try:
        result = project_point(**vars(args))
    except (ValueError, OverflowError) as error:
        parser.error(str(error))

    def vector_text(values: Sequence[float]) -> str:
        return "(" + ", ".join(f"{value:.6f}" for value in values) + ")"

    print("Convention: Lecture 10 matrix; v increases with NDC y.")
    print("Projection matrix:")
    for row in result.matrix:
        print("[" + " ".join(f"{value:11.6f}" for value in row) + "]")
    print("Camera point:", vector_text(args.point))
    print("Clip coordinates:", vector_text(result.clip))
    print("NDC:", vector_text(result.ndc))
    print("Pixel (u, v):", vector_text(result.pixel))
    print("Inside viewing frustum:", "yes" if result.inside_frustum else "no")
    if not result.inside_frustum:
        print("Note: the point is outside the viewing frustum; pixels are not clamped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
