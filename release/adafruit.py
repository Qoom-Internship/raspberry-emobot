# adafruit.py  (Raspberry Pi 5 + SPI(MOSI=GPIO10/핀19))
import time, board
import neopixel_spi as neopixel

NUM    = 60            # 실제 LED 개수
ORDER  = neopixel.GRB  # 색 이상하면 RGB/BGR/...로 바꿔보기
BRIGHT = 0.20          # 0.0~1.0

# SPI 객체 얻기 (/dev/spidev0.0)
spi = board.SPI()

# (옵션) SPI 속도 낮추기: 신호가 불안정하면 도움이 됨
try:
    # Blinka의 busio.SPI는 try_lock/configure 지원
    while not spi.try_lock():
        pass
    spi.configure(baudrate=2_400_000, phase=0, polarity=0)  # 2.4MHz
finally:
    try:
        spi.unlock()
    except Exception:
        pass

# SPI용 네오픽셀 객체
pixels = neopixel.NeoPixel_SPI(
    spi, NUM,
    pixel_order=ORDER,
    brightness=BRIGHT,
    auto_write=False
)

def wheel(pos: int):
    if pos < 0 or pos > 255:
        return (0, 0, 0)
    if pos < 85:
        return (pos * 3, 255 - pos * 3, 0)
    if pos < 170:
        pos -= 85
        return (255 - pos * 3, 0, pos * 3)
    pos -= 170
    return (0, pos * 3, 255 - pos * 3)

def rainbow_cycle(wait: float):
    for j in range(255):
        for i in range(NUM):
            pixel_index = (i * 256 // NUM) + j
            pixels[i] = wheel(pixel_index & 255)
        pixels.show()
        time.sleep(wait)

if __name__ == "__main__":
    while True:
        pixels.fill((255, 0, 0)); pixels.show(); time.sleep(1)
        pixels.fill((0, 255, 0)); pixels.show(); time.sleep(1)
        pixels.fill((0, 0, 255)); pixels.show(); time.sleep(1)
        rainbow_cycle(0.001)
