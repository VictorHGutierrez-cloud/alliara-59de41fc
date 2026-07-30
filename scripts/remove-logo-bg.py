"""Remove only the outer background of logo PNGs via flood-fill from the edges.

Also clears enclosed white letter counters (holes in e/p) while protecting
white artwork that sits on the magenta badge.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def is_near_white(rgb: tuple[int, int, int], floor: int = 220) -> bool:
    return rgb[0] >= floor and rgb[1] >= floor and rgb[2] >= floor


def is_magenta(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    return r > 180 and g < 140 and b > 80 and r > g + 40


def flood_remove_bg(src: Path, dst: Path, tolerance: int = 45) -> None:
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    bg_colors = [(pixels[x, y][0], pixels[x, y][1], pixels[x, y][2]) for x, y in seeds]
    bg = max(set(bg_colors), key=bg_colors.count)

    visited = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        r, g, b, _a = pixels[x, y]
        if color_distance((r, g, b), bg) <= tolerance and not visited[y][x]:
            queue.append((x, y))
            visited[y][x] = True

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, _a = pixels[x, y]
        dist = color_distance((r, g, b), bg)
        if dist <= tolerance:
            soft = int(40 * (dist / tolerance)) if tolerance else 0
            pixels[x, y] = (r, g, b, soft if dist > tolerance * 0.55 else 0)

        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h or visited[ny][nx]:
                continue
            nr, ng, nb, _ = pixels[nx, ny]
            if color_distance((nr, ng, nb), bg) <= tolerance:
                visited[ny][nx] = True
                queue.append((nx, ny))

    # Protect white pixels that touch the magenta badge (the K symbol).
    protected = [[False] * w for _ in range(h)]
    protect_q: deque[tuple[int, int]] = deque()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if is_magenta((r, g, b)):
                protected[y][x] = True
                protect_q.append((x, y))

    while protect_q:
        x, y = protect_q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h or protected[ny][nx]:
                continue
            nr, ng, nb, na = pixels[nx, ny]
            if na == 0:
                continue
            # Expand protection into near-white pixels connected to magenta
            if is_near_white((nr, ng, nb)) or is_magenta((nr, ng, nb)):
                protected[ny][nx] = True
                protect_q.append((nx, ny))

    # Clear remaining near-white islands (letter counters like holes in e/p)
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0 or protected[y][x]:
                continue
            if is_near_white((r, g, b)):
                pixels[x, y] = (r, g, b, 0)

    bbox = img.getbbox()
    if bbox:
        pad = 12
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(w, bbox[2] + pad)
        bottom = min(h, bbox[3] + pad)
        img = img.crop((left, top, right, bottom))

    img.save(dst, "PNG")
    corner = img.getpixel((0, 0))
    print(f"OK {src.name} -> {dst.name} size={img.size} corner={corner} bg_ref={bg}")


def main() -> None:
    assets = Path(r"c:\Users\victo\Desktop\Kept\src\assets")
    # Restore from generated sources first if caller already restored; just process current files
    for name in ("kept-logo.png", "kept-mark.png"):
        path = assets / name
        if path.exists():
            flood_remove_bg(path, path)


if __name__ == "__main__":
    main()
