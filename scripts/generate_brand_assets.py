#!/usr/bin/env python3
"""
NoticeNap Brand Asset Generator
Generates SVG vector marks, PWA app icons (192x192, 512x512), Apple touch icons,
and copies the official mascot to frontend/public/images/brand/.
"""

import os
import shutil
from PIL import Image, ImageDraw, ImageFont

def ensure_dirs():
    os.makedirs("frontend/public/images/brand", exist_ok=True)
    os.makedirs("frontend/app", exist_ok=True)

def generate_svg_assets():
    # 1. Simplified recognizable sloth-face SVG icon
    # Brand palette: Forest Green (#0a3626), Warm Paper (#f8fbef), Soft Sage (#dae3d0), Muted Amber (#f0bf63)
    sloth_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#dae3d0"/>
      <stop offset="100%" stop-color="#c5d1bb"/>
    </radialGradient>
  </defs>
  <!-- Background Badge -->
  <rect width="100" height="100" rx="28" fill="#0a3626"/>
  <!-- Inner Sage Plaque -->
  <rect x="6" y="6" width="88" height="88" rx="22" fill="#244d3b"/>
  <!-- Sloth Head Silhouette -->
  <circle cx="50" cy="52" r="32" fill="#f8fbef"/>
  <!-- Soft Ear Accents -->
  <circle cx="24" cy="38" r="8" fill="#dae3d0"/>
  <circle cx="24" cy="38" r="5" fill="#0a3626"/>
  <circle cx="76" cy="38" r="8" fill="#dae3d0"/>
  <circle cx="76" cy="38" r="5" fill="#0a3626"/>
  <!-- Eye Mask Bands (Distinctive Sloth Patches) -->
  <path d="M 28 44 Q 38 48 44 54 Q 36 60 26 56 Z" fill="#dae3d0"/>
  <path d="M 72 44 Q 62 48 56 54 Q 64 60 74 56 Z" fill="#dae3d0"/>
  <!-- Sleepy Resting Eyes (Curved Arc Lines) -->
  <path d="M 30 52 Q 36 56 42 52" stroke="#0a3626" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M 58 52 Q 64 56 70 52" stroke="#0a3626" stroke-width="3" stroke-linecap="round" fill="none"/>
  <!-- Snout / Nose / Gentle Smile -->
  <ellipse cx="50" cy="62" rx="10" ry="7" fill="#dae3d0"/>
  <path d="M 46 60 Q 50 58 54 60 Q 50 63 46 60 Z" fill="#0a3626"/>
  <path d="M 50 62 L 50 66" stroke="#0a3626" stroke-width="2" stroke-linecap="round"/>
  <path d="M 46 66 Q 50 69 54 66" stroke="#0a3626" stroke-width="2" stroke-linecap="round" fill="none"/>
  <!-- Amber Rest Dot (Slow & Steady Indicator) -->
  <circle cx="82" cy="18" r="5" fill="#f0bf63"/>
</svg>'''

    with open("frontend/public/sloth-icon.svg", "w", encoding="utf-8") as f:
        f.write(sloth_svg)

    with open("frontend/app/icon.svg", "w", encoding="utf-8") as f:
        f.write(sloth_svg)

    # 2. Combined Logo & Wordmark SVG
    logo_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 80" width="360" height="80">
  <!-- Embedded Sloth Emblem -->
  <g transform="translate(6, 6) scale(0.68)">
    <rect width="100" height="100" rx="26" fill="#0a3626"/>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="#244d3b"/>
    <circle cx="50" cy="52" r="32" fill="#f8fbef"/>
    <circle cx="24" cy="38" r="8" fill="#dae3d0"/>
    <circle cx="24" cy="38" r="5" fill="#0a3626"/>
    <circle cx="76" cy="38" r="8" fill="#dae3d0"/>
    <circle cx="76" cy="38" r="5" fill="#0a3626"/>
    <path d="M 28 44 Q 38 48 44 54 Q 36 60 26 56 Z" fill="#dae3d0"/>
    <path d="M 72 44 Q 62 48 56 54 Q 64 60 74 56 Z" fill="#dae3d0"/>
    <path d="M 30 52 Q 36 56 42 52" stroke="#0a3626" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M 58 52 Q 64 56 70 52" stroke="#0a3626" stroke-width="3" stroke-linecap="round" fill="none"/>
    <ellipse cx="50" cy="62" rx="10" ry="7" fill="#dae3d0"/>
    <path d="M 46 60 Q 50 58 54 60 Q 50 63 46 60 Z" fill="#0a3626"/>
    <path d="M 50 62 L 50 66" stroke="#0a3626" stroke-width="2" stroke-linecap="round"/>
    <path d="M 46 66 Q 50 69 54 66" stroke="#0a3626" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="82" cy="18" r="5" fill="#f0bf63"/>
  </g>
  <!-- Wordmark Text -->
  <text x="90" y="46" font-family="'Newsreader', Georgia, serif" font-size="34" font-weight="600" fill="#0a3626" letter-spacing="-0.5">NoticeNap</text>
  <text x="92" y="66" font-family="'Newsreader', Georgia, serif" font-style="italic" font-size="14" fill="#586152">Let the notice be long.</text>
</svg>'''

    with open("frontend/public/logo.svg", "w", encoding="utf-8") as f:
        f.write(logo_svg)

    print("Generated SVG assets: sloth-icon.svg, icon.svg, logo.svg")

def generate_png_icons():
    # Generate high-res raster app icons at 192x192 and 512x512, plus Apple Touch Icon 180x180
    sizes = [
        ("frontend/public/icon-192.png", 192),
        ("frontend/public/icon-512.png", 512),
        ("frontend/public/apple-touch-icon.png", 180),
        ("frontend/app/apple-icon.png", 180),
    ]

    for path, size in sizes:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Background rounded rect: Forest Green #0a3626
        corner_r = int(size * 0.26)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_r, fill="#0a3626")

        # Inner border / inset: Primary Green #244d3b
        pad = int(size * 0.06)
        draw.rounded_rectangle([pad, pad, size - pad - 1, size - pad - 1], radius=int(corner_r * 0.8), fill="#244d3b")

        # Sloth head circle: Warm Paper #f8fbef
        head_cx = size // 2
        head_cy = int(size * 0.53)
        head_r = int(size * 0.32)
        draw.ellipse([head_cx - head_r, head_cy - head_r, head_cx + head_r, head_cy + head_r], fill="#f8fbef")

        # Sloth Ears: Soft Sage #dae3d0 + inner #0a3626
        ear_r = int(size * 0.08)
        ear_y = int(size * 0.38)
        # Left ear
        draw.ellipse([int(size * 0.24) - ear_r, ear_y - ear_r, int(size * 0.24) + ear_r, ear_y + ear_r], fill="#dae3d0")
        draw.ellipse([int(size * 0.24) - int(ear_r * 0.5), ear_y - int(ear_r * 0.5), int(size * 0.24) + int(ear_r * 0.5), ear_y + int(ear_r * 0.5)], fill="#0a3626")
        # Right ear
        draw.ellipse([int(size * 0.76) - ear_r, ear_y - ear_r, int(size * 0.76) + ear_r, ear_y + ear_r], fill="#dae3d0")
        draw.ellipse([int(size * 0.76) - int(ear_r * 0.5), ear_y - int(ear_r * 0.5), int(size * 0.76) + int(ear_r * 0.5), ear_y + int(ear_r * 0.5)], fill="#0a3626")

        # Eye Mask Bands (Soft Sage #dae3d0)
        draw.ellipse([int(size * 0.26), int(size * 0.44), int(size * 0.46), int(size * 0.58)], fill="#dae3d0")
        draw.ellipse([int(size * 0.54), int(size * 0.44), int(size * 0.74), int(size * 0.58)], fill="#dae3d0")

        # Sleepy Eyes (Curved Arc Lines)
        eye_w = max(2, int(size * 0.025))
        draw.arc([int(size * 0.29), int(size * 0.46), int(size * 0.43), int(size * 0.56)], start=0, end=180, fill="#0a3626", width=eye_w)
        draw.arc([int(size * 0.57), int(size * 0.46), int(size * 0.71), int(size * 0.56)], start=0, end=180, fill="#0a3626", width=eye_w)

        # Muzzle / Snout: Soft Sage ellipse
        draw.ellipse([int(size * 0.40), int(size * 0.57), int(size * 0.60), int(size * 0.70)], fill="#dae3d0")
        # Nose: #0a3626
        draw.ellipse([int(size * 0.46), int(size * 0.59), int(size * 0.54), int(size * 0.64)], fill="#0a3626")
        # Mouth: gentle arc
        draw.arc([int(size * 0.46), int(size * 0.63), int(size * 0.54), int(size * 0.69)], start=0, end=180, fill="#0a3626", width=max(2, int(size * 0.018)))

        # Amber dot in top corner (#f0bf63)
        amber_r = int(size * 0.045)
        draw.ellipse([int(size * 0.82) - amber_r, int(size * 0.18) - amber_r, int(size * 0.82) + amber_r, int(size * 0.18) + amber_r], fill="#f0bf63")

        img.save(path)
        print(f"Generated {path} ({size}x{size})")

def copy_mascot_assets():
    # Copy official sloth illustration to frontend/public/images/brand/sloth-mascot.png
    src = "stitch-handoff/sloth.png"
    if os.path.exists(src):
        dst = "frontend/public/images/brand/sloth-mascot.png"
        shutil.copyfile(src, dst)
        print(f"Copied {src} -> {dst}")
        # Also copy to frontend/public/images/brand/sloth.png
        shutil.copyfile(src, "frontend/public/images/brand/sloth.png")

def generate_webmanifest():
    manifest_content = '''{
  "name": "NoticeNap",
  "short_name": "NoticeNap",
  "description": "Let the notice be long. Your to-do list shouldn't. Offline, private PDF notice digestion.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fbef",
  "theme_color": "#0a3626",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}'''
    with open("frontend/public/manifest.json", "w", encoding="utf-8") as f:
        f.write(manifest_content)
    with open("frontend/app/manifest.json", "w", encoding="utf-8") as f:
        f.write(manifest_content)
    print("Generated web manifest files.")

if __name__ == "__main__":
    ensure_dirs()
    generate_svg_assets()
    generate_png_icons()
    copy_mascot_assets()
    generate_webmanifest()
    print("All brand assets generated successfully!")
