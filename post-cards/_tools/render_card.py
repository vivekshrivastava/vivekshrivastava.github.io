#!/usr/bin/env python3
"""Vivekanand Law Firm post-card renderer (1080 x 1350, Noto Sans Devanagari).

Usage:  python3 -I render_card.py <font_dir> <spec.json> <out_prefix>
spec = {
  "style": "S1".."S8",
  "align": "left" | "center",              # optional, default per style
  "motif": "land|clock|phone|home|money|school|bag|book",   # S5 / S8
  "pages": [                                # 1 page = single image, 2-10 = carousel
     {"headline": str, "subline": str, "tag": str, "footer": str, "hero": str (S6 only)}
     # carousel inner pages may use "body" instead of "subline" and "num" like "3/8"
  ]
}
Writes <out_prefix>-1.png ... -N.png and prints the paths.
Text is drawn exactly as given (NFC-normalised), never altered.
"""
import json, sys, unicodedata
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1350
FONT_DIR = sys.argv[1]
_cache = {}


def F(weight, size):
    weight = {'300': '400', '500': '600'}.get(weight, weight)
    key = (weight, size)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(f"{FONT_DIR}/NotoSansDevanagari-{weight}.ttf", size,
                                         layout_engine=ImageFont.Layout.RAQM)
    return _cache[key]


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def wrap(draw, text, font, width):
    words, lines, cur = text.split(' '), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= width or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit(draw, text, weight, size, width, max_lines, min_size=34):
    while True:
        f = F(weight, size)
        lines = wrap(draw, text, f, width)
        too_wide = any(draw.textlength(l, font=f) > width for l in lines)
        if (len(lines) <= max_lines and not too_wide) or size <= min_size:
            return f, lines, size
        size -= 4


def block(draw, x, y, width, text, weight, size, color, align='left', max_lines=4, lh=1.32, min_size=34):
    """Draw wrapped text; returns bottom y."""
    if not text:
        return y
    f, lines, size = fit(draw, text, weight, size, width, max_lines, min_size)
    step = int(size * lh)
    for i, l in enumerate(lines):
        tw = draw.textlength(l, font=f)
        lx = x + (width - tw) / 2 if align == 'center' else x
        draw.text((lx, y + i * step), l, font=f, fill=hexc(color))
    return y + len(lines) * step


def pill(draw, x, y, w, h, fill=None, outline=None, r=None, width=3):
    r = h // 2 if r is None else r
    draw.rounded_rectangle([x, y, x + w, y + h], radius=r, fill=hexc(fill) if fill else None,
                           outline=hexc(outline) if outline else None, width=width)


def tag_in_box(draw, x, y, w, h, text, color, weight='700', size=30, align='center'):
    f, lines, size = fit(draw, text, weight, size, w - 48, 2, 22)
    step = int(size * 1.3)
    total = step * len(lines)
    ty = y + (h - total) / 2 - size * 0.12
    for i, l in enumerate(lines):
        tw = draw.textlength(l, font=f)
        lx = x + (w - tw) / 2 if align == 'center' else x + 24
        draw.text((lx, ty + i * step), l, font=f, fill=hexc(color))


# ---------------------------------------------------------------- motifs (wordless)
def motif(draw, kind, cx, cy, s, c1, c2, c3, line_only=False):
    """Simple flat shapes centred at (cx, cy) with scale s (~ half-size in px)."""
    C1, C2, C3 = hexc(c1), hexc(c2), hexc(c3)
    lw = max(4, int(s * 0.06))

    def R(x0, y0, x1, y1, fill, r=0):
        if line_only:
            draw.rounded_rectangle([cx + x0 * s, cy + y0 * s, cx + x1 * s, cy + y1 * s], radius=r * s, outline=C1, width=lw)
        else:
            draw.rounded_rectangle([cx + x0 * s, cy + y0 * s, cx + x1 * s, cy + y1 * s], radius=r * s, fill=fill)

    def P(pts, fill):
        pp = [(cx + a * s, cy + b * s) for a, b in pts]
        if line_only:
            draw.line(pp + [pp[0]], fill=C1, width=lw, joint='curve')
        else:
            draw.polygon(pp, fill=fill)

    def E(x0, y0, x1, y1, fill):
        box = [cx + x0 * s, cy + y0 * s, cx + x1 * s, cy + y1 * s]
        if line_only:
            draw.ellipse(box, outline=C1, width=lw)
        else:
            draw.ellipse(box, fill=fill)

    if kind == 'land':
        P([(-1.2, 0.15), (1.2, 0.15), (1.2, 0.95), (-1.2, 0.95)], C3)
        P([(-1.2, 0.45), (1.2, 0.35), (1.2, 0.95), (-1.2, 0.95)], C2)
        for i in range(4):
            y0 = 0.52 + i * 0.12
            R(-1.2, y0, 1.2, y0 + 0.03, C3)
        for x in (-0.9, 0.9):
            R(x - 0.05, 0.0, x + 0.05, 0.3, C1, 0.02)
        P([(-0.42, -0.3), (0.0, -0.72), (0.42, -0.3)], C1)
        R(-0.32, -0.3, 0.32, 0.15, C2)
        R(-0.08, -0.08, 0.08, 0.15, C1)
        R(0.14, -0.2, 0.26, -0.06, C3)
    elif kind == 'clock':
        E(-0.75, -0.75, 0.75, 0.75, C1)
        E(-0.62, -0.62, 0.62, 0.62, C3)
        if not line_only:
            draw.line([(cx, cy), (cx, cy - 0.45 * s)], fill=C1, width=lw * 2)
            draw.line([(cx, cy), (cx + 0.32 * s, cy + 0.12 * s)], fill=C2, width=lw * 2)
            for k in range(12):
                import math
                a = k * math.pi / 6
                draw.line([(cx + 0.52 * s * math.sin(a), cy - 0.52 * s * math.cos(a)),
                           (cx + 0.6 * s * math.sin(a), cy - 0.6 * s * math.cos(a))], fill=C1, width=lw)
        else:
            draw.line([(cx, cy), (cx, cy - 0.45 * s)], fill=C1, width=lw)
            draw.line([(cx, cy), (cx + 0.32 * s, cy + 0.12 * s)], fill=C1, width=lw)
    elif kind == 'phone':
        R(-0.45, -0.8, 0.45, 0.8, C1, 0.12)
        R(-0.36, -0.62, 0.36, 0.6, C3, 0.04)
        P([(0.0, -0.38), (0.26, -0.28), (0.24, 0.05), (0.0, 0.3), (-0.24, 0.05), (-0.26, -0.28)], C2)
        if not line_only:
            draw.line([(cx - 0.1 * s, cy - 0.06 * s), (cx - 0.02 * s, cy + 0.04 * s), (cx + 0.13 * s, cy - 0.15 * s)],
                      fill=hexc('#FFFFFF'), width=lw)
    elif kind == 'home':
        P([(-0.85, -0.05), (0.0, -0.8), (0.85, -0.05)], C2)
        R(-0.65, -0.05, 0.65, 0.75, C1)
        R(-0.15, 0.25, 0.15, 0.75, C3)
        E(0.32, 0.1, 0.52, 0.3, C3)
        if not line_only:
            P([(0.42, 0.13), (0.47, 0.2), (0.42, 0.27), (0.37, 0.2)], C2)
    elif kind == 'money':
        R(-0.95, -0.45, 0.95, 0.45, C3, 0.06)
        R(-0.95, -0.45, -0.65, 0.45, C2)
        for i in range(3):
            R(-0.45, -0.22 + i * 0.18, 0.6, -0.18 + i * 0.18, C1, 0.02)
        E(0.35, 0.5, 0.75, 0.9, C2)
        E(0.6, 0.42, 1.0, 0.82, C1)
    elif kind == 'school':
        P([(-0.95, -0.2), (0.0, -0.75), (0.95, -0.2)], C2)
        R(-0.8, -0.2, 0.8, 0.75, C3)
        for i in range(4):
            x = -0.6 + i * 0.4
            R(x - 0.07, -0.05, x + 0.07, 0.6, C1)
        R(-0.95, 0.68, 0.95, 0.8, C1)
    elif kind == 'bag':
        R(-0.6, -0.35, 0.6, 0.8, C2, 0.06)
        if not line_only:
            draw.arc([cx - 0.35 * s, cy - 0.8 * s, cx + 0.35 * s, cy + 0.1 * s], 180, 360, fill=C1, width=lw * 2)
        R(0.1, 0.05, 0.85, 0.95, C3, 0.03)
        for i in range(3):
            R(0.22, 0.2 + i * 0.2, 0.72, 0.25 + i * 0.2, C1)
    else:  # book
        P([(-0.95, -0.55), (0.0, -0.4), (0.0, 0.7), (-0.95, 0.55)], C3)
        P([(0.95, -0.55), (0.0, -0.4), (0.0, 0.7), (0.95, 0.55)], C2)
        R(-0.03, -0.42, 0.03, 0.7, C1)


# ---------------------------------------------------------------- styles
def render_page(st, pg, align, motif_kind, carousel, idx):
    img = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)
    head = pg.get('headline', '')
    sub = pg.get('subline') or pg.get('body', '')
    tag, foot, num, hero = pg.get('tag', ''), pg.get('footer', ''), pg.get('num', ''), pg.get('hero', '')
    inner = carousel and idx > 0  # cover keeps full look
    M = 92  # side margin
    TW = W - 2 * M

    def number(col):
        if num:
            f = F('700', 30)
            d.text((W - M - d.textlength(num, font=f), 70), num, font=f, fill=hexc(col))

    if st == 'S1':
        d.rectangle([0, 0, W, H], fill=hexc('#0E1B33'))
        d.rectangle([0, 0, 22, H], fill=hexc('#A6303E'))
        d.rectangle([M, 210, M + 130, 222], fill=hexc('#A6303E'))
        y = block(d, M, 270, TW, head, '800', 96, '#FFFFFF', align, 4, 1.3)
        block(d, M, y + 40, TW, sub, '400', 46, '#BEC8DA', align, 6 if inner else 4, 1.42)
        if tag:
            pill(d, M, 1010, TW, 96, fill='#A6303E', r=20)
            tag_in_box(d, M, 1010, TW, 96, tag, '#FFFFFF')
        d.rectangle([M, 1190, W - M, 1192], fill=hexc('#3A4A6B'))
        block(d, M, 1215, TW, foot, '400', 28, '#BEC8DA', align, 2, 1.3, 22)
        number('#BEC8DA')
    elif st == 'S2':
        d.rectangle([0, 0, W, H], fill=hexc('#F4EEE2'))
        d.line([(60, 60), (60, 170)], fill=hexc('#C2892B'), width=10)
        d.line([(60, 60), (170, 60)], fill=hexc('#C2892B'), width=10)
        d.line([(W - 60, H - 60), (W - 60, H - 170)], fill=hexc('#C2892B'), width=10)
        d.line([(W - 60, H - 60), (W - 170, H - 60)], fill=hexc('#C2892B'), width=10)
        y = block(d, M, 250, TW, head, '700', 92, '#1F2633', align, 4, 1.32)
        rx = M if align == 'left' else (W - 160) // 2
        d.rectangle([rx, y + 30, rx + 160, y + 40], fill=hexc('#C2892B'))
        block(d, M, y + 80, TW, sub, '400', 46, '#3B4252', align, 6 if inner else 4, 1.45)
        if tag:
            pill(d, M, 1020, TW, 96, outline='#1F2633', r=6, width=3)
            tag_in_box(d, M, 1020, TW, 96, tag, '#1F2633', '600')
        block(d, M, 1180, TW, foot, '400', 28, '#5A5F69', align, 2, 1.3, 22)
        number('#C2892B')
    elif st == 'S3':
        d.rectangle([0, 0, W, H], fill=hexc('#A6303E'))
        y = block(d, M, 150 if not inner else 200, TW, head, '900', 128 if not inner else 92, '#FFFFFF', align, 4, 1.22, 60)
        d.rectangle([M, y + 40, M + 140, y + 52] if align == 'left' else [W // 2 - 70, y + 40, W // 2 + 70, y + 52], fill=hexc('#FFFFFF'))
        block(d, M, y + 100, TW, sub, '500', 48, '#FFE9EC', align, 6 if inner else 4, 1.42)
        d.rectangle([0, 1040, W, 1350], fill=hexc('#0E1B33'))
        if tag:
            tag_in_box(d, M, 1080, TW, 100, tag, '#FFFFFF', '700', 32, 'center' if align == 'center' else 'left')
        block(d, M, 1225, TW, foot, '400', 28, '#BEC8DA', align, 2, 1.3, 22)
        number('#FFFFFF')
    elif st == 'S4':
        d.rectangle([0, 0, W, H], fill=hexc('#0F4C5C'))
        bx0, by0, bx1 = 70, 150, W - 70
        f, lines, size = fit(d, head, '800', 90, bx1 - bx0 - 120, 4, 44)
        step = int(size * 1.3)
        by1 = by0 + 90 + step * len(lines)
        d.rounded_rectangle([bx0, by0, bx1, by1], radius=60, fill=hexc('#DDEFE8'))
        tx = bx0 + 120 if align == 'left' else bx0 + 60
        d.polygon([(tx, by1 - 2), (tx + 90, by1 - 2), (tx + 10, by1 + 90)], fill=hexc('#DDEFE8'))
        block(d, bx0 + 60, by0 + 40, bx1 - bx0 - 120, head, '800', size, '#0B2F38', align, 4, 1.3, 44)
        block(d, M, by1 + 140, TW, sub, '400', 46, '#FFFFFF', align, 6 if inner else 4, 1.45)
        if tag:
            pill(d, M, 1030, TW, 92, outline='#DDEFE8', width=3)
            tag_in_box(d, M, 1030, TW, 92, tag, '#DDEFE8', '600')
        block(d, M, 1190, TW, foot, '400', 28, '#BFE3D8', align, 2, 1.3, 22)
        number('#DDEFE8')
    elif st == 'S5':
        if not inner:
            d.rectangle([0, 0, W, 700], fill=hexc('#E9DCC4'))
            d.ellipse([W - 330, 70, W - 130, 270], fill=hexc('#F4EEE2'))
            motif(d, motif_kind, W // 2, 380, 250, '#0E1B33', '#A6303E', '#F7F1E6')
            top = 750
        else:
            d.rectangle([0, 0, W, 40], fill=hexc('#E9DCC4'))
            top = 180
        d.rectangle([0, 700 if not inner else 40, W, H], fill=hexc('#FFFFFF'))
        y = block(d, M, top, TW, head, '800', 80, '#0E1B33', align, 3, 1.28, 44)
        block(d, M, y + 26, TW, sub, '400', 40, '#5A6475', align, 7 if inner else 2, 1.42, 30)
        if tag:
            pill(d, M, 1110, TW, 84, fill='#A6303E', r=16)
            tag_in_box(d, M, 1110, TW, 84, tag, '#FFFFFF', '700', 28)
        block(d, M, 1225, TW, foot, '400', 26, '#5A6475', align, 2, 1.3, 22)
        number('#0E1B33')
    elif st == 'S6':
        d.rectangle([0, 0, W, H], fill=hexc('#F7F7F5'))
        d.rectangle([0, 0, 40, H], fill=hexc('#0E1B33'))
        d.rectangle([0, H - 300, W, H], fill=hexc('#0E1B33'))
        if hero and not inner:
            size = 380
            while size > 120 and d.textlength(hero, font=F('900', size)) > W - 2 * M:
                size -= 20
            bb = d.textbbox((0, 0), hero, font=F('900', size))
            d.text((M - bb[0], 80 - bb[1]), hero, font=F('900', size), fill=hexc('#A6303E'))
            top = 80 + (bb[3] - bb[1]) + 50
        else:
            top = 200
        d.rectangle([M, top - 22, M + 120, top - 12], fill=hexc('#0E1B33'))
        y = block(d, M, top + 10, TW, head, '800', 80, '#0E1B33', align, 4, 1.28, 40)
        block(d, M, y + 26, TW, sub, '400', 42, '#4E5666', align, 7 if inner else 3, 1.42, 30)
        if tag:
            pill(d, M, H - 250, TW, 88, fill='#A6303E', r=14)
            tag_in_box(d, M, H - 250, TW, 88, tag, '#FFFFFF', '700', 28)
        block(d, M, H - 125, TW, foot, '400', 27, '#BEC8DA', align, 2, 1.3, 20)
        number('#A6303E')
    elif st == 'S7':
        d.rectangle([0, 0, W, H], fill=hexc('#0B1220'))
        g = hexc('#C9A54C')
        d.rectangle([40, 40, W - 40, H - 40], outline=g, width=3)
        d.rectangle([56, 56, W - 56, H - 56], outline=g, width=1)
        d.polygon([(W // 2, 150), (W // 2 + 16, 166), (W // 2, 182), (W // 2 - 16, 166)], fill=g)
        y = block(d, 120, 250, W - 240, head, '700', 92, '#FFFFFF', 'center', 4, 1.32)
        d.rectangle([W // 2 - 70, y + 40, W // 2 + 70, y + 44], fill=g)
        block(d, 120, y + 90, W - 240, sub, '400', 44, '#E6D3A0', 'center', 6 if inner else 4, 1.45)
        if tag:
            tag_in_box(d, 120, 1040, W - 240, 90, tag, '#C9A54C', '600', 30)
        block(d, 120, 1170, W - 240, foot, '400', 27, '#E6D3A0', 'center', 2, 1.3, 20)
        number('#C9A54C')
    else:  # S8
        d.rectangle([0, 0, W, H], fill=hexc('#E8F1FA'))
        if not inner:
            d.ellipse([W - 330, 60, W - 70, 320], fill=hexc('#E0644F'))
            motif(d, motif_kind, W - 200, 190, 85, '#FFFFFF', '#FFFFFF', '#FFFFFF', line_only=True)
        cy0 = 360 if not inner else 160
        f, lines, size = fit(d, head, '800', 86, TW - 100, 4, 44)
        step = int(size * 1.3)
        cy1 = cy0 + 100 + step * len(lines)
        d.rounded_rectangle([M - 20, cy0, W - M + 20, cy1], radius=36, fill=hexc('#FFFFFF'))
        block(d, M + 30, cy0 + 45, TW - 60, head, '800', size, '#123A6B', align, 4, 1.3, 44)
        block(d, M, cy1 + 50, TW, sub, '400', 44, '#123A6B', align, 6 if inner else 4, 1.45)
        if tag:
            pill(d, M, 1060, TW, 88, fill='#123A6B')
            tag_in_box(d, M, 1060, TW, 88, tag, '#FFFFFF', '700', 28)
        block(d, M, 1195, TW, foot, '400', 27, '#4A6688', align, 2, 1.3, 22)
        number('#123A6B')
    return img


def main():
    spec = json.load(open(sys.argv[2], encoding='utf-8'))
    out = sys.argv[3]
    st = spec.get('style', 'S1')[:2]
    default_align = 'center' if st in ('S7',) else 'left'
    align = spec.get('align', default_align)
    pages = spec['pages']
    for p in pages:
        for k, v in list(p.items()):
            if isinstance(v, str):
                p[k] = unicodedata.normalize('NFC', v)
    carousel = len(pages) > 1
    paths = []
    for i, pg in enumerate(pages):
        img = render_page(st, pg, align, spec.get('motif', 'book'), carousel, i)
        img = img.quantize(colors=48, method=Image.Quantize.MEDIANCUT).convert('RGB') if spec.get('quantize') else img
        p = f"{out}-{i + 1}.png"
        img.save(p, optimize=True)
        paths.append(p)
    print(json.dumps(paths))


if __name__ == '__main__':
    main()
