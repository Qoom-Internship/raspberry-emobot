import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)


leds = [
    {'high': 11, 'low': 6},
    {'high': 17, 'low': 5},
    {'high': 27, 'low': 25},
    {'high': 22, 'low': 20},
]

for led in leds:
    GPIO.setup(led['high'], GPIO.OUT)
    GPIO.setup(led['low'], GPIO.OUT)

for led in leds:
    GPIO.output(led['high'], GPIO.HIGH) 
    GPIO.output(led['low'], GPIO.LOW) 

print("LEDs ON")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("LEDs OFF")
    for led in leds:
        GPIO.output(led['high'], GPIO.LOW)
        GPIO.output(led['low'], GPIO.LOW)

    GPIO.cleanup()