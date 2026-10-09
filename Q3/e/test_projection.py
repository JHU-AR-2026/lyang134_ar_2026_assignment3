"""Tests for Q3(e), using the Lecture 10 projection convention."""

import importlib
import math
from pathlib import Path
import random
import subprocess
import sys
import unittest

HERE = Path(__file__).resolve().parent
PARAMETERS = dict(width=800, height=600, near=0.2, far=20,
                  fx=800, fy=800, ox=400, oy=400)
POINT = (0.3, -0.15, -6.0, 1.0)


class ProjectionTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue((HERE / "projection.py").is_file(),
                        "projection.py has not been implemented")
        self.module = importlib.import_module("projection")

    def assertVectorAlmostEqual(self, actual, expected):
        self.assertEqual(len(actual), len(expected))
        for a, b in zip(actual, expected):
            self.assertAlmostEqual(a, b, places=9)

    def run_script(self, *args):
        return subprocess.run([sys.executable, str(HERE / "projection.py"), *args],
                              capture_output=True, text=True, timeout=10)

    def test_numeric_projection_matrix(self):
        expected = [[2, 0, 0, 0], [0, 8 / 3, 1 / 3, 0],
                    [0, 0, -101 / 99, -40 / 99], [0, 0, -1, 0]]
        actual = self.module.projection_matrix(**PARAMETERS)
        for row, reference in zip(actual, expected):
            self.assertVectorAlmostEqual(row, reference)

    def test_assignment_example_all_stages(self):
        result = self.module.project_point(POINT, **PARAMETERS)
        self.assertVectorAlmostEqual(result.clip, (0.6, -2.4, 566 / 99, 6))
        self.assertVectorAlmostEqual(result.ndc, (0.1, -0.4, 283 / 297))
        self.assertVectorAlmostEqual(result.pixel, (440, 180))
        self.assertTrue(result.inside_frustum)

    def test_off_center_optical_axis_uses_lecture_sign(self):
        result = self.module.project_point((0, 0, -2, 1), ox=350, oy=410)
        self.assertVectorAlmostEqual(result.pixel, (350, 190))

    def test_custom_camera_and_point(self):
        result = self.module.project_point((0.2, 0.1, -4, 1), width=640,
                    height=480, near=0.1, far=50, fx=900, fy=700, ox=310, oy=260)
        self.assertVectorAlmostEqual(result.pixel, (355, 237.5))
        self.assertTrue(result.inside_frustum)

    def test_near_and_far_depth_endpoints(self):
        for depth, expected in ((0.2, -1), (20, 1)):
            with self.subTest(depth=depth):
                result = self.module.project_point((0, 0, -depth, 1))
                self.assertAlmostEqual(result.ndc[2], expected)
                self.assertTrue(result.inside_frustum)

    def test_outside_depth_is_reported(self):
        for z in (-0.1, -21):
            with self.subTest(z=z):
                result = self.module.project_point((0, 0, z, 1))
                self.assertFalse(result.inside_frustum)

    def test_outside_viewport_is_not_clamped(self):
        result = self.module.project_point((10, 0, -1, 1))
        self.assertVectorAlmostEqual(result.pixel, (8400, 200))
        self.assertFalse(result.inside_frustum)

    def test_behind_camera_is_not_visible(self):
        result = self.module.project_point((0.3, -0.15, 6, 1))
        self.assertFalse(result.inside_frustum)

    def test_zero_depth_rejected(self):
        with self.assertRaisesRegex(ValueError, "[Zz]ero|zero|z = 0|z=0"):
            self.module.project_point((1, 1, 0, 1))

    def test_homogeneous_scaling_preserves_pixels(self):
        reference = self.module.project_point(POINT)
        for factor in (2, -2, 0.5):
            with self.subTest(factor=factor):
                result = self.module.project_point(tuple(factor * v for v in POINT))
                self.assertVectorAlmostEqual(result.ndc, reference.ndc)
                self.assertVectorAlmostEqual(result.pixel, reference.pixel)
                self.assertTrue(result.inside_frustum)

    def test_invalid_camera_parameters(self):
        invalid = [dict(width=0), dict(height=-1), dict(width=800.5),
                   dict(near=0), dict(near=-1), dict(far=0.2), dict(far=0.1),
                   dict(fx=0), dict(fy=-1), dict(ox=math.nan), dict(oy=math.inf)]
        for change in invalid:
            with self.subTest(change=change):
                with self.assertRaises(ValueError):
                    self.module.project_point(POINT, **{**PARAMETERS, **change})

    def test_invalid_camera_points(self):
        for point in ((1, 2, 3), (1, 2, 3, 4, 5), (1, 2, -3, 0),
                      (math.nan, 0, -3, 1), (0, math.inf, -3, 1)):
            with self.subTest(point=point):
                with self.assertRaises(ValueError):
                    self.module.project_point(point)

    def test_many_inputs_against_scalar_lecture_equations(self):
        rng = random.Random(3)
        for _ in range(40):
            width, height = rng.randint(200, 1600), rng.randint(200, 1000)
            fx, fy = rng.uniform(200, 1200), rng.uniform(200, 1200)
            ox, oy = rng.uniform(0, width), rng.uniform(0, height)
            x, y, z = rng.uniform(-1, 1), rng.uniform(-1, 1), -rng.uniform(1, 10)
            result = self.module.project_point((x, y, z, 1), width=width,
                        height=height, fx=fx, fy=fy, ox=ox, oy=oy)
            # Scalar consequences of the printed matrix, not a second matrix multiply.
            expected = (fx * x / (-z) + ox, fy * y / (-z) + height - oy)
            self.assertVectorAlmostEqual(result.pixel, expected)

    def test_command_line_default_output(self):
        process = self.run_script()
        self.assertEqual(process.returncode, 0, process.stderr)
        self.assertEqual(process.stderr, "")
        self.assertIn("NDC: (0.100000, -0.400000, 0.952862)", process.stdout)
        self.assertIn("Pixel (u, v): (440.000000, 180.000000)", process.stdout)

    def test_command_line_all_custom_parameters(self):
        process = self.run_script("--width", "640", "--height", "480",
                    "--near", "0.1", "--far", "50", "--fx", "900", "--fy", "700",
                    "--ox", "310", "--oy", "260", "--point", "0.2", "0.1", "-4", "1")
        self.assertEqual(process.returncode, 0, process.stderr)
        self.assertIn("Pixel (u, v): (355.000000, 237.500000)", process.stdout)

    def test_command_line_help_and_error_handling(self):
        help_result = self.run_script("--help")
        self.assertEqual(help_result.returncode, 0)
        self.assertIn("--point", help_result.stdout)
        for args in (("--near", "0"), ("--point", "1", "1", "0", "1")):
            process = self.run_script(*args)
            self.assertEqual(process.returncode, 2)
            self.assertIn("error:", process.stderr)
            self.assertNotIn("Traceback", process.stderr)


if __name__ == "__main__":
    unittest.main()
