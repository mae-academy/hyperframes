#!/usr/bin/env python3
"""Mesh-loop polyline (spec 5.3 / v1 5.1): 41 points, clockwise on screen, start 225 deg, sweep 290 deg.

Prints the `points` string and the arrowhead (tip + two base points) tangent to the arc end.
Usage: loop_points.py CX CY R [--head 28]
"""
import argparse
import math

ap = argparse.ArgumentParser()
ap.add_argument("cx", type=float)
ap.add_argument("cy", type=float)
ap.add_argument("r", type=float)
ap.add_argument("--head", type=float, default=28, help="arrowhead length px")
a = ap.parse_args()

N, START, SWEEP = 41, 225.0, 290.0
pts = []
for i in range(N):
    th = math.radians(START + SWEEP * i / (N - 1))  # +theta = clockwise in SVG (y down)
    pts.append((a.cx + a.r * math.cos(th), a.cy + a.r * math.sin(th), th))
print("points=", " ".join(f"{x:.1f},{y:.1f}" for x, y, _ in pts))

x, y, th = pts[-1]
tx, ty = -math.sin(th), math.cos(th)  # tangent, direction of travel
nx, ny = -ty, tx
h, w = a.head, a.head * 0.55
tip = (x + tx * h * 0.5, y + ty * h * 0.5)
b = (x - tx * h * 0.5, y - ty * h * 0.5)
print(f"arrow= {tip[0]:.1f},{tip[1]:.1f} {b[0]+nx*w:.1f},{b[1]+ny*w:.1f} {b[0]-nx*w:.1f},{b[1]-ny*w:.1f}")
