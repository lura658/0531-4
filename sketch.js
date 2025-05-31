let video;
let facemesh;
let predictions = [];

let handpose;
let handPredictions = [];

let gameState = "start"; // start, quiz, result
let currentQuestion = 0;
let selectedAnswer = "";
let showResult = false;
let score = 0;
let quizQuestions = [];
let showEffect = false;
let effectType = ""; // "correct" or "wrong"
let effectTimer = 0;

// 題庫（p5.js、教學原理、教育心理、攝影基礎）
const allQuestions = [
  {
    q: "p5.js 中用來建立畫布的函式是？",
    options: ["A. createCanvas", "B. createRect", "C. makeCanvas", "D. setupCanvas"],
    answer: "A"
  },
  {
    q: "皮亞傑認為兒童在什麼階段開始具備抽象思考能力？",
    options: ["A. 感覺動作期", "B. 前運思期", "C. 具體運思期", "D. 形式運思期"],
    answer: "D"
  },
  {
    q: "布魯姆認知領域的最低層次是？",
    options: ["A. 理解", "B. 應用", "C. 記憶", "D. 分析"],
    answer: "C"
  },
  {
    q: "攝影中調整亮度最直接的參數是？",
    options: ["A. 快門速度", "B. 光圈", "C. ISO", "D. 白平衡"],
    answer: "C"
  },
  {
    q: "p5.js 中哪個函式會在每一幀自動執行？",
    options: ["A. setup", "B. draw", "C. loop", "D. frame"],
    answer: "B"
  },
  {
    q: "教學設計三要素不包含下列哪一項？",
    options: ["A. 學習目標", "B. 教學活動", "C. 評量方式", "D. 學生年齡"],
    answer: "D"
  },
  {
    q: "攝影中用來控制景深的主要參數是？",
    options: ["A. 光圈", "B. 快門", "C. ISO", "D. 對焦模式"],
    answer: "A"
  },
  {
    q: "p5.js 中要設定背景顏色應該用哪個函式？",
    options: ["A. fill", "B. stroke", "C. background", "D. color"],
    answer: "C"
  },
  {
    q: "維果斯基強調學習的哪個概念？",
    options: ["A. 操作性條件作用", "B. 區近發展", "C. 自我效能", "D. 觀察學習"],
    answer: "B"
  },
  {
    q: "攝影中，白平衡主要影響什麼？",
    options: ["A. 亮度", "B. 色溫", "C. 對比", "D. 銳利度"],
    answer: "B"
  }
];

// 載入圖示
let checkImg, crossImg;
function preload() {
  checkImg = loadImage('check.png'); // 英文檔名
  crossImg = loadImage('cross.png');
}

let showHelp = false;
let waitingNext = false;

function setup() {
  createCanvas(900, 480).position(
    (windowWidth - 900) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, handModelReady);
  handpose.on('predict', results => {
    handPredictions = results;
  });
}

function modelReady() {}
function handModelReady() {}

function draw() {
  background(255);

  // 左側：攝影機與互動（左右相反）
  push();
  translate(640, 0);
  scale(-1, 1);
  image(video, 0, 0, 640, 480);
  pop();

  // 臉部特效與右側特效（座標不變，維持正常）
  if (predictions.length > 0 && showEffect) {
    const keypoints = predictions[0].scaledMesh;
    let headX = 640 - keypoints[10][0]; // 反轉後的頭頂座標
    let headY = keypoints[10][1];
    if (effectType === "correct") {
      image(checkImg, headX - 30, headY - 100, 60, 60);
      drawHappyEffect(800, 120);
    } else if (effectType === "wrong") {
      image(crossImg, headX - 30, headY - 100, 60, 60);
      drawSadEffect(800, 120);
      drawBlackLines([headX, headY]);
    }
  }

  // 右側：遊戲內容
  fill(240);
  noStroke();
  rect(640, 0, 260, 480);

  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);

  if (gameState === "start") {
    text("教育科技課程知識大亂鬥", 660, 40);
    textSize(16);
    drawMultiline("歡迎來到知識大亂鬥！\n1. 按 Enter 開始隨機五題\n2. 一手比選項(1~4指)，另一手握拳確認\n3. 答對有歡樂特效，答錯有陰暗特效\n4. 握拳確認答案，張開手(五指)切換下一題\n5. 比讚可隨時觀看說明\n快來挑戰你的教育科技腦力吧！", 660, 90, 12);
  } else if (gameState === "quiz") {
    showQuestion();
    showHandGesture();
    if (showHelp) {
      fill(0, 180);
      rect(650, 250, 230, 180, 12);
      fill(255);
      textSize(16);
      drawMultiline("【遊戲說明】\n1. 一手比選項(1~4指)\n2. 另一手握拳確認答案\n3. 張開手(五指)切換下一題\n4. 比讚可隨時觀看說明", 660, 260, 12);
    }
    fill(100, 100, 255);
    textSize(14);
    drawMultiline("[比讚可隨時觀看遊戲說明]", 660, 440, 12);
  } else if (gameState === "result") {
    text("挑戰結束！", 660, 60);
    text("你的分數：" + score + " / 5", 660, 120);
    text("按 Enter 再來一輪！", 660, 180);
  }
}

function showQuestion() {
  let q = quizQuestions[currentQuestion];
  fill(0);
  textSize(18);
  text("第 " + (currentQuestion + 1) + " 題：", 660, 40);
  text(q.q, 660, 70);
  textSize(16);
  for (let i = 0; i < q.options.length; i++) {
    let y = 120 + i * 40;
    let opt = q.options[i];
    if (selectedAnswer === String.fromCharCode(65 + i)) {
      fill(0, 150, 255);
      rect(655, y - 5, 240, 35, 8);
      fill(255);
    } else {
      fill(0);
    }
    text(opt, 670, y);
  }
  if (showResult) {
    fill(q.answer === selectedAnswer ? "green" : "red");
    text(q.answer === selectedAnswer ? "答對了！" : "答錯了！正確答案：" + q.answer, 660, 320);
    text("3 秒後自動進入下一題...", 660, 350);
  }
}

// 握拳判斷（五指都彎曲）
function isFistGesture(landmarks) {
  // 指尖y大於指根y，且拇指靠近掌心
  let fingersBent = [8, 12, 16, 20].every(i => landmarks[i][1] > landmarks[i - 2][1]);
  let thumbBent = Math.abs(landmarks[4][0] - landmarks[2][0]) < 30;
  return fingersBent && thumbBent;
}

// 比讚判斷（拇指伸直，其餘彎曲）
function isThumbsUpGesture(landmarks) {
  let thumbUp = landmarks[4][1] < landmarks[3][1] && landmarks[4][1] < landmarks[2][1];
  let fingersBent = [8, 12, 16, 20].every(i => landmarks[i][1] > landmarks[i - 2][1]);
  return thumbUp && fingersBent;
}

function showHandGesture() {
  if (handPredictions.length >= 2 && !showResult && !waitingNext) {
    let handA = handPredictions[0];
    let handB = handPredictions[1];
    let countA = countExtendedFingers(handA.landmarks);
    let countB = countExtendedFingers(handB.landmarks);

    let fistA = isFistGesture(handA.landmarks);
    let fistB = isFistGesture(handB.landmarks);

    if (
      ((countA >= 1 && countA <= 4) && fistB) ||
      ((countB >= 1 && countB <= 4) && fistA)
    ) {
      let answer = String.fromCharCode(64 + (fistA ? countB : countA));
      selectedAnswer = answer;
      showResult = true;
      showEffect = true;
      effectType = (answer === quizQuestions[currentQuestion].answer) ? "correct" : "wrong";
      if (effectType === "correct") score++;
      effectTimer = millis();
      waitingNext = true;
    }
  }

  // 比讚顯示說明
  if (handPredictions.length > 0 && isThumbsUpGesture(handPredictions[0].landmarks)) {
    showHelp = true;
  } else {
    showHelp = false;
  }

  // 張開手(五指)切換下一題
  if (waitingNext && handPredictions.length > 0 && countExtendedFingers(handPredictions[0].landmarks) === 5) {
    selectedAnswer = "";
    showResult = false;
    showEffect = false;
    waitingNext = false;
    currentQuestion++;
    if (currentQuestion >= 5) {
      gameState = "result";
    }
  }
}

// 自動換行繪製
function drawMultiline(str, x, y, maxLen) {
  let lines = [];
  str.split('\n').forEach(seg => {
    while (seg.length > maxLen) {
      lines.push(seg.slice(0, maxLen));
      seg = seg.slice(maxLen);
    }
    lines.push(seg);
  });
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x, y + i * 22);
  }
}

// 判斷OK手勢（拇指與食指指尖距離接近，其餘三指伸直）
// 判斷OK手勢（拇指與食指指尖距離接近，其餘三指伸直）
function isOKGesture(landmarks) {
  let thumbTip = landmarks[4];
  let indexTip = landmarks[8];
  let dist = dist2d(thumbTip, indexTip);
  let middle = landmarks[12][1] < landmarks[10][1];
  let ring = landmarks[16][1] < landmarks[14][1];
  let pinky = landmarks[20][1] < landmarks[18][1];
  return dist < 40 && middle && ring && pinky;
}

function dist2d(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

// 判斷7手勢（食指與中指伸直，其餘彎曲）
function detectSevenGesture(landmarks) {
  let fingers = [
    landmarks[8][1] < landmarks[6][1],  // 食指
    landmarks[12][1] < landmarks[10][1], // 中指
    landmarks[16][1] > landmarks[14][1], // 無名指
    landmarks[20][1] > landmarks[18][1], // 小指
    landmarks[4][0] < landmarks[3][0]    // 拇指彎曲
  ];
  return fingers[0] && fingers[1] && !fingers[2] && !fingers[3] && fingers[4];
}

// 歡樂特效
function drawHappyEffect(x, y) {
  push();
  for (let i = 0; i < 10; i++) {
    fill(random(200,255), random(200,255), 0, 180);
    ellipse(x + random(-40,40), y + random(-40,40), random(10,25));
  }
  pop();
}

// 陰暗特效
function drawSadEffect(x, y) {
  push();
  for (let i = 0; i < 8; i++) {
    fill(50, 50, 50, 120);
    ellipse(x + random(-30,30), y + random(-30,30), random(15,30));
  }
  pop();
}

// 計算伸出的手指數量
function countExtendedFingers(landmarks) {
  let tips = [8, 12, 16, 20]; // 食指、中指、無名指、小指
  let count = 0;
  for (let i = 0; i < tips.length; i++) {
    if (landmarks[tips[i]][1] < landmarks[tips[i] - 2][1]) count++;
  }
  // 拇指判斷
  if (landmarks[4][0] > landmarks[3][0]) count++;
  return count;
}

function keyPressed() {
  if (gameState === "start" && keyCode === ENTER) {
    quizQuestions = shuffle(allQuestions).slice(0, 5);
    gameState = "quiz";
    currentQuestion = 0;
    score = 0;
    selectedAnswer = "";
    showResult = false;
    showEffect = false;
  }
  if (gameState === "result" && keyCode === ENTER) {
    gameState = "start";
  }
}

// 煙火特效
function drawFireworks(x, y) {
  push();
  for (let i = 0; i < 12; i++) {
    let angle = TWO_PI / 12 * i;
    let len = 40 + 10 * sin((millis() - effectTimer) / 200 + i);
    stroke(0, 200 + random(-30, 30), 0);
    strokeWeight(3);
    line(x, y, x + len * cos(angle), y + len * sin(angle));
  }
  pop();
}

// 答錯黑線特效
function drawBlackLines(keypoints) {
  let x = keypoints[10][0];
  let y = keypoints[10][1] - 20;
  push();
  stroke(0);
  strokeWeight(5);
  for (let i = -30; i <= 30; i += 20) {
    line(x + i, y, x + i + random(-5, 5), y + 30 + random(0, 10));
  }
  pop();
}
