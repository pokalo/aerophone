from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 1920
OUT = "screenshots"

BG = (18, 18, 18, 255)
SURFACE = (30, 30, 30, 255)
SURFACE_VAR = (45, 45, 45, 255)
GREEN = (76, 175, 80, 255)
GREEN_DIM = (56, 142, 60, 255)
WHITE = (224, 224, 224, 255)
WHITE_FULL = (255, 255, 255, 255)
GRAY = (130, 130, 130, 255)
DIM = (80, 80, 80, 255)
YELLOW = (255, 235, 59, 255)
RED = (244, 67, 54, 255)
ACCENT = GREEN

os.makedirs(OUT, exist_ok=True)

try:
    font_big = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 48)
    font_mid = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 36)
    font_sm = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 28)
    font_xs = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
    font_bold = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 48)
    font_mid_bold = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 36)
except:
    font_big = ImageFont.load_default()
    font_mid = font_big
    font_sm = font_big
    font_xs = font_big
    font_bold = font_big
    font_mid_bold = font_big


def rounded_rect(draw, xy, r, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def status_bar(draw):
    draw.rectangle([(0, 0), (W, 64)], fill=(0, 0, 0, 255))
    draw.text((W - 220, 18), "10:25", fill=WHITE_FULL, font=font_mid)


def bottom_bar(draw):
    draw.rectangle([(0, H - 84), (W, H)], fill=(0, 0, 0, 255))
    cx = W // 2
    for i, label in enumerate(["◁", "□", "▷"]):
        x = cx + (i - 1) * 120
        draw.text((x - 10, H - 70), label, fill=GRAY, font=font_mid)


def header(draw, title, y=96):
    draw.text((48, y), title, fill=WHITE_FULL, font=font_bold)


def card(draw, y, h, fill=SURFACE):
    rounded_rect(draw, (24, y, W - 24, y + h), 24, fill=fill)


def draw_vu(draw, cx, y, level):
    bar_w = 48
    bar_gap = 8
    total_w = 12 * (bar_w + bar_gap) - bar_gap
    x0 = cx - total_w // 2
    for i in range(12):
        x = x0 + i * (bar_w + bar_gap)
        h = 24 + (i + 1) * 10
        if i < 6:
            c = GREEN
        elif i < 9:
            c = YELLOW
        else:
            c = RED
        fill_c = c if i < level else DIM
        rounded_rect(draw, (x, y + 60 - h, x + bar_w, y + 60), 6, fill=fill_c)


def draw_power_btn(draw, cx, y, running=True):
    r = 60
    c = GREEN if running else GRAY
    draw.ellipse([(cx - r, y - r), (cx + r, y + r)], fill=c)
    label = "STOP" if running else "START"
    tw = font_mid_bold.getlength(label)
    draw.text((cx - tw // 2, y - 14), label, fill=(0, 0, 0), font=font_mid_bold)


def draw_slider(draw, x, y, w, val, label_left, label_right=""):
    track_h = 6
    thumb_r = 16
    # track bg
    draw.rounded_rectangle([x, y - track_h // 2, x + w, y + track_h // 2],
                           radius=3, fill=SURFACE_VAR)
    # active track
    active_w = int(w * val)
    draw.rounded_rectangle([x, y - track_h // 2, x + active_w, y + track_h // 2],
                           radius=3, fill=ACCENT)
    # thumb
    thumb_x = x + active_w
    draw.ellipse([(thumb_x - thumb_r, y - thumb_r),
                  (thumb_x + thumb_r, y + thumb_r)], fill=ACCENT)
    # labels
    draw.text((x, y + 24), label_left, fill=WHITE, font=font_xs)
    if label_right:
        tr = font_xs.getlength(label_right)
        draw.text((x + w - tr, y + 24), label_right, fill=GRAY, font=font_xs)


def draw_toggle(draw, x, y, on=True):
    w, h = 52, 28
    r = h // 2
    bg = GREEN if on else SURFACE_VAR
    draw.rounded_rectangle([x, y, x + w, y + h], radius=r, fill=bg)
    thumb_x = x + w - h + 2 if on else x + 2
    draw.ellipse([(thumb_x, y + 2), (thumb_x + h - 4, y + h - 2)], fill=WHITE_FULL)


def draw_chip(draw, x, y, label, selected=False):
    tw = font_xs.getlength(label)
    pw = 24
    cw = tw + pw * 2
    ch = 44
    bg = ACCENT if selected else SURFACE_VAR
    fg = WHITE_FULL if selected else WHITE
    rounded_rect(draw, (x, y, x + cw, y + ch), 22, fill=bg)
    tx = x + (cw - tw) // 2
    draw.text((tx, y + 8), label, fill=fg, font=font_xs)
    return cw + 12


# ============================================================
# Screenshot 1: Главный — VU meter активен
# ============================================================
img = Image.new("RGBA", (W, H), BG)
draw = ImageDraw.Draw(img)
status_bar(draw)
header(draw, "Aerophone", 96)

# Status text
draw.text((48, 150), "Running", fill=GREEN, font=font_mid_bold)

# VU Meter
cx = W // 2
draw_vu(draw, cx, 200, 7)

# Power button
draw_power_btn(draw, cx, 340, True)

# Volume card
card(draw, 420, 100)
draw.text((56, 440), "Volume", fill=WHITE, font=font_mid)
draw_slider(draw, 56, 490, W - 112, 0.7, "0%", "200%")

# Balance card
card(draw, 548, 100)
draw.text((56, 568), "L/R Balance", fill=WHITE, font=font_mid)
draw_slider(draw, 56, 618, W - 112, 0.5, "L", "R")

# Hearing protection toggle
card(draw, 676, 80)
draw.text((56, 698), "Hearing Protection", fill=WHITE, font=font_mid)
draw_toggle(draw, W - 108, 700, True)

# Noise suppression
card(draw, 784, 80)
draw.text((56, 806), "Noise Suppression", fill=WHITE, font=font_mid)
draw_toggle(draw, W - 108, 808, True)

# Preset chips
card(draw, 892, 80)
draw.text((56, 914), "Preset", fill=WHITE, font=font_mid)
x = 56
for pr in ["Flat", "Speech", "Outdoors", "TV"]:
    x += draw_chip(draw, x, 952, pr, selected=(pr == "Flat"))

# Info card
card(draw, 1010, 110)
draw.text((56, 1030), "Latency: 32 ms", fill=WHITE, font=font_xs)
draw.text((56, 1064), "Sample Rate: 44100 Hz", fill=WHITE, font=font_xs)
draw.text((56, 1098), "Channels: Stereo", fill=WHITE, font=font_xs)

img.save(os.path.join(OUT, "1_main.png"))
print("1_main.png saved")

# ============================================================
# Screenshot 2: Эквалайзер
# ============================================================
img = Image.new("RGBA", (W, H), BG)
draw = ImageDraw.Draw(img)
status_bar(draw)
header(draw, "Aerophone", 96)
draw.text((48, 150), "Running", fill=GREEN, font=font_mid_bold)
draw_vu(draw, cx, 200, 4)
draw_power_btn(draw, cx, 340, True)

# EQ card
card(draw, 420, 500)
draw.text((56, 440), "Equalizer", fill=WHITE, font=font_bold)
draw_toggle(draw, W - 108, 442, True)

bands = [
    ("60 Hz", 2),
    ("250 Hz", -1),
    ("1 kHz", 3),
    ("4 kHz", -2),
    ("16 kHz", 4),
]
for i, (label, val) in enumerate(bands):
    by = 510 + i * 90
    draw.text((56, by), label, fill=GRAY, font=font_xs)
    # slider vertical-ish look: horizontal slider
    draw_slider(draw, 220, by + 10, W - 280, (val + 6) / 12, f"{val:+} dB")

# Info card
card(draw, 960, 100)
draw.text((56, 980), "Настройте звук под свой слух", fill=GRAY, font=font_mid)
draw.text((56, 1020), "5-полосный эквалайзер", fill=WHITE, font=font_mid)

img.save(os.path.join(OUT, "2_eq.png"))
print("2_eq.png saved")

# ============================================================
# Screenshot 3: Таймер сна + уведомления
# ============================================================
img = Image.new("RGBA", (W, H), BG)
draw = ImageDraw.Draw(img)
status_bar(draw)
header(draw, "Aerophone", 96)
draw.text((48, 150), "Running", fill=GREEN, font=font_mid_bold)
draw_vu(draw, cx, 200, 3)
draw_power_btn(draw, cx, 340, True)

# Sleep timer
card(draw, 420, 240)
draw.text((56, 440), "Sleep Timer", fill=WHITE, font=font_bold)
options = ["Off", "15 min", "30 min", "1 hour", "2 hours"]
x = 56
for i, opt in enumerate(options):
    sel = (opt == "30 min")
    x += draw_chip(draw, x, 490, opt, selected=sel)
draw.text((56, 550), "Remaining: 30:00", fill=GRAY, font=font_mid)

# Alerts
card(draw, 690, 200)
draw.text((56, 712), "Alerts", fill=WHITE, font=font_bold)
draw.text((56, 762), "Vibration", fill=WHITE, font=font_mid)
draw_toggle(draw, W - 108, 760, True)
draw.text((56, 810), "Flash Alert", fill=WHITE, font=font_mid)
draw_toggle(draw, W - 108, 808, False)
draw.text((56, 858), "Flash Threshold", fill=WHITE, font=font_mid)
draw_slider(draw, 56, 900, W - 112, 0.6, "60 dB")

img.save(os.path.join(OUT, "3_sleep_alerts.png"))
print("3_sleep_alerts.png saved")

# ============================================================
# Screenshot 4: Premium
# ============================================================
img = Image.new("RGBA", (W, H), BG)
draw = ImageDraw.Draw(img)
status_bar(draw)
header(draw, "Premium", 96)

# Subscription type tabs
card(draw, 120, 180)
draw.text((60, 145), "Forever", fill=ACCENT, font=font_mid_bold)
draw.text((340, 145), "Monthly", fill=WHITE, font=font_mid)
draw.text((640, 145), "Yearly", fill=WHITE, font=font_mid)

# Underline for active tab
draw.rectangle([(60, 182), (200, 186)], fill=ACCENT)

draw.text((60, 200), "149 ₽", fill=WHITE_FULL, font=font_bold)
draw.text((60, 248), "one-time payment", fill=GRAY, font=font_xs)

# Payment method
card(draw, 330, 180)
draw.text((56, 355), "Payment Method", fill=WHITE, font=font_bold)
draw.text((60, 400), "RuStore", fill=ACCENT, font=font_mid)
draw.text((60, 445), "Telegram Stars", fill=WHITE, font=font_mid)
draw.rectangle([(60, 395), (240, 399)], fill=ACCENT)

# Features comparison
card(draw, 540, 380)
features = [
    "Noise Suppression",
    "Equalizer (5-band)",
    "Sleep Timer",
    "Balance Control",
    "Hearing Protection",
    "All presets",
]
draw.text((56, 562), "Free", fill=GRAY, font=font_mid)
draw.text((280, 562), "Premium", fill=ACCENT, font=font_mid)
for i, feat in enumerate(features):
    fy = 610 + i * 44
    draw.text((56, fy), feat, fill=WHITE, font=font_xs)
    draw.text((300, fy), "✓", fill=GREEN, font=font_mid)
    draw.text((450, fy), "✓" if i >= 0 else "—", fill=GREEN if i >= 0 else GRAY, font=font_mid)

# Buy button
rounded_rect(draw, (60, 960, W - 60, 1040), 24, fill=ACCENT)
draw.text((W // 2 - 40, 978), "Buy Premium", fill=WHITE_FULL, font=font_mid_bold)

# Skip
draw.text((W // 2 - 30, 1080), "Skip", fill=GRAY, font=font_mid)

img.save(os.path.join(OUT, "4_premium.png"))
print("4_premium.png saved")

print("Done! Check screenshots/ folder")
