from pathlib import Path
from math import comb

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
BG = ROOT / "infj-function-mindmap-bg.png"
OUT = ROOT / "infj-function-framework-mindmap.png"

W, H = 2560, 1440

FONT_MEDIUM = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_LIGHT = "/System/Library/Fonts/STHeiti Light.ttc"
FONT_SERIF = "/System/Library/Fonts/Supplemental/Songti.ttc"


def font(path: str, size: int, index: int = 0):
    return ImageFont.truetype(path, size=size, index=index)


F_TITLE = font(FONT_SERIF, 58)
F_SUBTITLE = font(FONT_LIGHT, 25)
F_CENTER_EYEBROW = font(FONT_MEDIUM, 22)
F_CENTER = font(FONT_SERIF, 49)
F_CENTER_BODY = font(FONT_LIGHT, 26)
F_NODE_NO = font(FONT_MEDIUM, 20)
F_NODE_TITLE = font(FONT_MEDIUM, 34)
F_NODE_BODY = font(FONT_LIGHT, 24)
F_CHIP = font(FONT_MEDIUM, 19)
F_FLOW = font(FONT_MEDIUM, 25)
F_FLOW_SMALL = font(FONT_LIGHT, 21)


def rgba(hex_color: str, alpha: int = 255):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def rounded_box(layer, box, radius, fill, outline=None, width=1):
    layer.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def bezier(points, steps=80):
    n = len(points) - 1
    output = []
    for step in range(steps + 1):
        t = step / steps
        x = sum(comb(n, i) * ((1 - t) ** (n - i)) * (t ** i) * points[i][0] for i in range(n + 1))
        y = sum(comb(n, i) * ((1 - t) ** (n - i)) * (t ** i) * points[i][1] for i in range(n + 1))
        output.append((x, y))
    return output


def draw_connection(canvas, points, color):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    curve = bezier(points)
    gd.line(curve, fill=rgba(color, 100), width=18)
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    canvas.alpha_composite(glow)

    line_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(line_layer)
    ld.line(curve, fill=rgba(color, 130), width=3)
    for x, y in curve[8:-8:13]:
        ld.ellipse((x - 3, y - 3, x + 3, y + 3), fill=rgba("#BFF6D7", 155))
    canvas.alpha_composite(line_layer)


def draw_chip(draw, x, y, label, theme):
    palette = {
        "live": ("#8EE6B5", "#14382E"),
        "plan": ("#84D5E3", "#12333A"),
        "archive": ("#C2D8C9", "#26352F"),
    }
    fg, bg = palette[theme]
    bbox = draw.textbbox((0, 0), label, font=F_CHIP)
    width = bbox[2] - bbox[0] + 34
    rounded_box(draw, (x, y, x + width, y + 38), 19, rgba(bg, 220), rgba(fg, 100), 1)
    draw.text((x + 17, y + 7), label, font=F_CHIP, fill=rgba(fg))
    return width


def draw_node(canvas, box, number, title, lines, status, theme, accent):
    x1, y1, x2, y2 = box

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    rounded_box(sd, (x1 - 6, y1 - 4, x2 + 6, y2 + 12), 30, rgba(accent, 38))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    canvas.alpha_composite(shadow)

    card = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    rounded_box(d, box, 28, rgba("#071216", 226), rgba(accent, 125), 2)
    d.line((x1 + 30, y1 + 1, x2 - 30, y1 + 1), fill=rgba(accent, 190), width=3)

    d.ellipse((x1 + 32, y1 + 30, x1 + 74, y1 + 72), fill=rgba(accent, 35), outline=rgba(accent, 150), width=2)
    no_box = d.textbbox((0, 0), number, font=F_NODE_NO)
    no_w, no_h = no_box[2] - no_box[0], no_box[3] - no_box[1]
    d.text((x1 + 53 - no_w / 2, y1 + 50 - no_h / 2 - 2), number, font=F_NODE_NO, fill=rgba(accent))

    d.text((x1 + 92, y1 + 29), title, font=F_NODE_TITLE, fill=rgba("#EAF7EF"))
    chip_box = d.textbbox((0, 0), status, font=F_CHIP)
    chip_w = chip_box[2] - chip_box[0] + 34
    draw_chip(d, x2 - chip_w - 30, y1 + 32, status, theme)

    divider_y = y1 + 91
    d.line((x1 + 32, divider_y, x2 - 32, divider_y), fill=rgba("#8EA49A", 45), width=1)

    start_y = divider_y + 24
    line_gap = 43
    for idx, line in enumerate(lines):
        yy = start_y + idx * line_gap
        d.ellipse((x1 + 38, yy + 11, x1 + 44, yy + 17), fill=rgba(accent, 220))
        d.text((x1 + 59, yy), line, font=F_NODE_BODY, fill=rgba("#C8D9D0", 240))

    canvas.alpha_composite(card)


bg = Image.open(BG).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
base = bg.convert("RGBA")

# Darken the generated background slightly so the information layer remains primary.
veil = Image.new("RGBA", (W, H), rgba("#020708", 74))
base.alpha_composite(veil)

# Header
header = Image.new("RGBA", (W, H), (0, 0, 0, 0))
hd = ImageDraw.Draw(header)
title = "INFJ 认知操作系统｜功能框架"
subtitle = "从看见自己如何运行，到把内耗转化为现实行动"
title_bbox = hd.textbbox((0, 0), title, font=F_TITLE)
title_w = title_bbox[2] - title_bbox[0]
hd.text(((W - title_w) / 2, 47), title, font=F_TITLE, fill=rgba("#F0F7F3"))
sub_bbox = hd.textbbox((0, 0), subtitle, font=F_SUBTITLE)
sub_w = sub_bbox[2] - sub_bbox[0]
hd.text(((W - sub_w) / 2, 119), subtitle, font=F_SUBTITLE, fill=rgba("#8EA49A"))
hd.ellipse((W / 2 - sub_w / 2 - 28, 131, W / 2 - sub_w / 2 - 20, 139), fill=rgba("#8EE6B5"))
base.alpha_composite(header)

# Connections sit under the cards.
draw_connection(base, [(810, 485), (700, 405), (720, 340), (710, 334)], "#3D8FA3")
draw_connection(base, [(1750, 485), (1860, 405), (1840, 340), (1850, 334)], "#3D8FA3")
draw_connection(base, [(815, 675), (660, 665), (710, 685), (690, 685)], "#3D8FA3")
draw_connection(base, [(1745, 675), (1900, 665), (1850, 685), (1870, 685)], "#3D8FA3")
draw_connection(base, [(885, 915), (780, 1015), (800, 1045), (780, 1055)], "#1F6B4B")
draw_connection(base, [(1675, 915), (1780, 1015), (1760, 1045), (1780, 1055)], "#1F6B4B")

# Center card
center_shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
csd = ImageDraw.Draw(center_shadow)
rounded_box(csd, (790, 443, 1770, 946), 42, rgba("#45C58C", 48))
center_shadow = center_shadow.filter(ImageFilter.GaussianBlur(42))
base.alpha_composite(center_shadow)

center = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(center)
rounded_box(cd, (810, 458, 1750, 930), 38, rgba("#061013", 238), rgba("#8EE6B5", 145), 2)
cd.ellipse((1259, 493, 1301, 535), fill=rgba("#8EE6B5", 35), outline=rgba("#8EE6B5", 150), width=2)
cd.ellipse((1276, 510, 1284, 518), fill=rgba("#BFF6D7"))

eyebrow = "CORE POSITIONING · 核心定位"
eyebrow_box = cd.textbbox((0, 0), eyebrow, font=F_CENTER_EYEBROW)
cd.text(((W - (eyebrow_box[2] - eyebrow_box[0])) / 2, 552), eyebrow, font=F_CENTER_EYEBROW, fill=rgba("#8EE6B5"))

center_lines = ["INFJ 状态调节", "与现实行动系统"]
for idx, line in enumerate(center_lines):
    box = cd.textbbox((0, 0), line, font=F_CENTER)
    cd.text(((W - (box[2] - box[0])) / 2, 603 + idx * 67), line, font=F_CENTER, fill=rgba("#F2F8F4"))

cd.line((1050, 754, 1510, 754), fill=rgba("#8EE6B5", 70), width=1)
center_body = ["疗愈是体验气质", "认知解码是方法", "现实行动是结果"]
body_widths = [cd.textbbox((0, 0), t, font=F_CENTER_BODY)[2] for t in center_body]
total_width = sum(body_widths) + 112
x = (W - total_width) / 2
for idx, t in enumerate(center_body):
    if idx:
        cd.ellipse((x - 31, 820, x - 23, 828), fill=rgba("#3D8FA3", 180))
    cd.text((x, 804), t, font=F_CENTER_BODY, fill=rgba("#B9CEC3"))
    x += body_widths[idx] + 56
base.alpha_composite(center)

nodes = [
    ((90, 182, 710, 462), "01", "当前状态", [
        "预设困扰 / 自定义真实问题",
        "识别情绪线索与当下认知回路",
        "结果自动锚定，减少继续寻找成本",
        "危机表达优先进入安全支持",
    ], "已上线基础", "live", "#8EE6B5"),
    ((1850, 182, 2470, 462), "02", "认知地图", [
        "八维雷达与功能通俗解释",
        "Ni / Fe / Ti / Se 重点解读",
        "看见优势、盲区与补偿模式",
        "识别三个高频内耗回路",
    ], "已上线基础", "live", "#8EE6B5"),
    ((65, 538, 690, 832), "03", "现实实验室", [
        "把洞察压缩成 24–72h 行动",
        "记录预期、最坏想象与真实结果",
        "形成「预测—现实偏差镜」",
        "将成功经验种进「证据森林」",
    ], "已有雏形", "live", "#71C9D8"),
    ((1870, 538, 2495, 832), "04", "边界排练室", [
        "按关系与场景生成拒绝表达",
        "温和 / 明确 / 停止讨论三档强度",
        "模拟对方施压，继续练习回应",
        "执行后复盘关系的真实反应",
    ], "规划功能", "plan", "#71C9D8"),
    ((145, 900, 780, 1222), "05", "深潜会客厅", [
        "替我组局 / 自选思想陪谈者",
        "同一困惑获得不同精神视角",
        "追问、交锋与彼此质询",
        "「离席之问」转成现实实验",
    ], "规划功能", "plan", "#8EE6B5"),
    ((1780, 900, 2415, 1222), "06", "心智档案", [
        "生成「今日心智切片」专属长图",
        "私人珍藏版 / 安全分享版",
        "周期性生成系统更新日志",
        "沉淀长期认知变化轨迹",
    ], "长期沉淀", "archive", "#8EE6B5"),
]

for node in nodes:
    draw_node(base, *node)

# Bottom flow strip
flow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fd = ImageDraw.Draw(flow_layer)
rounded_box(fd, (300, 1270, 2260, 1385), 30, rgba("#061013", 226), rgba("#8EE6B5", 82), 1)
fd.text((345, 1293), "核心闭环", font=F_FLOW, fill=rgba("#8EE6B5"))
flow = "状态扫描  →  回路识别  →  多元理解  →  边界 / 实验  →  现实反馈  →  心智切片"
fd.text((545, 1293), flow, font=F_FLOW, fill=rgba("#EAF7EF"))
quote = "让过去的自己，成为下一次卡住时可以调用的证据。"
quote_box = fd.textbbox((0, 0), quote, font=F_FLOW_SMALL)
fd.text(((W - (quote_box[2] - quote_box[0])) / 2, 1341), quote, font=F_FLOW_SMALL, fill=rgba("#8EA49A"))
base.alpha_composite(flow_layer)

base.convert("RGB").save(OUT, quality=96, optimize=True)
print(OUT)
