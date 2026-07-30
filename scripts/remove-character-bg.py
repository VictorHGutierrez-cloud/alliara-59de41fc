"""Remove white/pastel backgrounds from Kept & Kepta character PNGs.

Uses edge flood-fill so enclosed white fills (shirt, face) stay opaque.
Also clears soft lavender glow circles and sparkles connected to the bg.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


def is_background(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    mx, mn = max(r, g, b), min(r, g, b)
    chroma = mx - mn
    lightness = (mx + mn) / 2
    # Pure / near white
    if mn >= 246:
        return True
    # Soft pastel glow / sparkles (lavender, mint, blush washes)
    if lightness >= 225 and chroma <= 35:
        return True
    # Slightly stronger pastel discs
    if lightness >= 215 and chroma <= 28 and b >= g - 5:
        return True
    return False


def bg_softness(rgb: tuple[int, int, int]) -> float:
    """0 = fully bg, 1 = fully opaque subject fringe."""
    r, g, b = rgb
    mx, mn = max(r, g, b), min(r, g, b)
    chroma = mx - mn
    lightness = (mx + mn) / 2
    if mn >= 250:
        return 0.0
    if lightness >= 235 and chroma <= 20:
        return 0.0
    if is_background(rgb):
        # Soft fade for anti-aliased pastel edges
        t = (250 - lightness) / 40
        return max(0.0, min(0.35, t))
    return 1.0


def remove_bg(src: Path, dst: Path) -> None:
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    visited = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if visited[y][x]:
            return
        r, g, b, _a = pixels[x, y]
        if is_background((r, g, b)):
            visited[y][x] = True
            queue.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    cleared = 0
    while queue:
        x, y = queue.popleft()
        r, g, b, _a = pixels[x, y]
        soft = bg_softness((r, g, b))
        pixels[x, y] = (r, g, b, int(255 * soft))
        cleared += 1

        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h or visited[ny][nx]:
                continue
            nr, ng, nb, _ = pixels[nx, ny]
            if is_background((nr, ng, nb)):
                visited[ny][nx] = True
                queue.append((nx, ny))

    # Do NOT tight-crop — layout depends on consistent canvas sizes.
    img.save(dst, "PNG")
    corner = img.getpixel((0, 0))
    print(f"OK {src.parent.name}/{src.name} cleared={cleared} corner={corner}")


def main() -> None:
    roots = [
        Path(r"c:\Users\victo\Desktop\Kept\src\assets\kept"),
        Path(r"c:\Users\victo\Desktop\Kept\src\assets\kepta"),
    ]
    for root in roots:
        for path in sorted(root.glob("*.png")):
            remove_bg(path, path)


if __name__ == "__main__":
    main()
