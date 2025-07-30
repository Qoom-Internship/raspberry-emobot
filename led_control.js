const { execSync } = require('child_process');

const emotionToGpio = {
  Angry: 17,     // 빨강
  Disgust: 22,   // 초록
  Fear: 18,      // 노랑
  Happy: 23,     // 파랑
  Sad: 27,       // 흰색
  Surprise: 18,  // 노랑 (Fear와 공유)
  Neutral: null  // 아무 것도 안 켬
};

const allPins = [17, 18, 22, 23, 27];

function turnOffAll() {
  allPins.forEach(pin => {
    execSync(`gpioset 0 ${pin}=0`);
  });
}

function setEmotionLed(emotion) {
  console.log(`감정 인식 결과: ${emotion}`);
  turnOffAll(); // 기존 LED 상태 리셋

  const pin = emotionToGpio[emotion];
  if (pin != null) {
    execSync(`gpioset 0 ${pin}=1`);
    console.log(`→ GPIO ${pin} ON`);
  } else {
    console.log('→ Neutral 감정: 모든 LED OFF');
  }
}

module.exports = setEmotionLed;
