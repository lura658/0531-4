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

// 題庫（p5.js、VR/AR、攝影基礎等）
const allQuestions = [
  {
    q: "p5.js 中用來建立畫布的函式是？",
    options: ["A. createCanvas", "B. createRect", "C. makeCanvas", "D. setupCanvas"],
    answer: "A"
  },
  {
    q: "下列何者是VR（虛擬實境）的應用？",
    options: ["A. Google Earth VR", "B. 電子書", "C. 線上測驗", "D. 投影片播放"],
    answer: "A"
  },
  {
    q: "下列何者屬於AR（擴增實境）技術？",
    options: ["A. Pokemon GO", "B. Word文書", "C. Excel試算表", "D. YouTube影片"],
    answer: "A"
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
    q: "下列何者是AR在教育上的應用？",
    options: ["A. 實境解剖APP", "B. 黑板教學", "C. 紙本考卷", "D. 電子郵件"],
    answer: "A"
  },
  {
    q: "VR頭戴裝置主要用於？",
    options: ["A. 沉浸式體驗", "B. 打印文件", "C. 聽音樂", "D. 發送簡訊"],
    answer: "A"
  },
  {
    q: "p5.js 中要畫一個圓形用哪個函式？",
    options: ["A. ellipse", "B. circle", "C. arc", "D. round"],
    answer: "A"
  },
  {
    q: "攝影中，白平衡主要影響什麼？",
    options: ["A. 亮度", "B. 色溫", "C. 對比", "D. 銳利度"],
    answer: "B"
  },
  {
    q: "下列何者不是VR的特點？",
    options: ["A. 沉浸感", "B. 互動性", "C. 實體觸感", "D. 虛擬環境"],
    answer: "C"
  },
  {
    q: "AR技術常用於？",
    options: ["A. 實境導航", "B. 紙本閱讀", "C. 傳統黑板", "D. 收音機"],
    answer: "A"
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
let questionStartTime = 0; // 新增：紀錄每題開始時間

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
  background(230);

  // 左側：攝影機與互動（左右相反）
  push();
  translate(640, 0);
  scale(-1, 1);
  image(video, 0, 0, 640, 480);
  pop();

  // 右側：美編題目區塊
  push();
  noStroke();
  fill(255, 255, 245, 245);
  rect(650, 30, 220, 420, 30);
  drawingContext.shadowColor = "rgba(0,0,0,0.15)";
  drawingContext.shadowBlur = 20;
  pop();

  // 主題區塊（最上方）
  push();
  fill(240, 240, 210, 230);
  stroke(200, 200, 180);
  strokeWeight(1.5);
  rect(660, 40, 200, 54, 16);
  noStroke();
  fill(40, 40, 80);
  textFont('Microsoft JhengHei');
  textSize(24);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("教育科技課程\n知識大亂鬥", 760, 67);
  pop();

  if (gameState === "start") {
    textSize(16);
    fill(60, 60, 120);
    textAlign(LEFT, TOP);
    drawMultiline(
      "歡迎來挑戰！\n1. 按Enter開始\n2. 伸出1~4指選答案\n3. 7秒自動進入下一題\n4. 也可張開手掌提前切換\n5. 共五題計分",
      670, 110, 14
    );
    clearAutoNextTimer();
  } else if (gameState === "quiz") {
    if (currentQuestion >= quizQuestions.length) {
      gameState = "result";
      clearAutoNextTimer();
      return;
    }
    showQuestion();
    showHandGesture();

    // 倒數顯示（7秒）
    let elapsed = (millis() - questionStartTime) / 1000;
    fill(200, 60, 60);
    textSize(24);
    textStyle(BOLD);
    textAlign(CENTER, TOP);
    text("倒數：" + max(0, (7 - floor(elapsed))) + " 秒", 760, 430);

    // 啟動自動切題計時器（7秒）
    if (!showResult && !autoNextTimer && elapsed < 7) {
      autoNextTimer = setTimeout(() => {
        nextQuestion();
      }, 7000 - (millis() - questionStartTime));
    }
  } else if (gameState === "result") {
    fill(40, 80, 120);
    textSize(22);
    textAlign(CENTER, TOP);
    text("挑戰結束！", 760, 110);
    textSize(18);
    text("你的分數：" + score + " / 5", 760, 180);
    text("答對：" + score + " 題", 760, 220);
    text("答錯：" + (5 - score) + " 題", 760, 260);
    textSize(16);
    text("按 Enter 再來一輪！", 760, 320);
    clearAutoNextTimer();
  }

  // 答對/錯特效（鏡頭畫面上）
  if (showEffect) {
    if (effectType === "correct") {
      drawBalloons();
    } else if (effectType === "wrong") {
      drawSpiderOverlay();
    }
  }
}

// 顯示題目與選項（主題不再重複，題目區塊下移）
function showQuestion() {
  if (currentQuestion >= quizQuestions.length) return; // 防呆

  let q = quizQuestions[currentQuestion];
  fill(40, 40, 80);
  textSize(18);
  textAlign(LEFT, TOP);

  // 題目自動換行
  let lines = [];
  let segs = q.q.split('\n');
  segs.forEach(seg => {
    while (seg.length > 12) {
      lines.push(seg.slice(0, 12));
      seg = seg.slice(12);
    }
    lines.push(seg);
  });
  // 題目區塊底色（下移，避免與主題重疊）
  let questionY = 110;
  push();
  fill(255, 255, 230, 200);
  rect(665, questionY, 200, lines.length * 22 + 18, 10);
  pop();
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], 675, questionY + 10 + i * 22);
  }
  let optionStartY = questionY + lines.length * 22 + 28; // 選項起始y

  for (let i = 0; i < q.options.length; i++) {
    let y = optionStartY + i * 44;
    let opt = q.options[i];
    // 選項底色
    if (selectedAnswer === String.fromCharCode(65 + i)) {
      fill(60, 150, 255, 230);
      stroke(40, 80, 160);
      strokeWeight(2);
      rect(665, y - 5, 200, 38, 10);
      fill(255);
      noStroke();
    } else {
      fill(220, 220, 240, 200);
      stroke(120, 120, 180, 80);
      strokeWeight(1.2);
      rect(665, y - 5, 200, 38, 10);
      fill(40, 40, 80);
      noStroke();
    }
    textSize(17);
    text(opt, 680, y + 3);
  }
  if (showResult) {
    fill(q.answer === selectedAnswer ? "green" : "red");
    textSize(18);
    text(q.answer === selectedAnswer ? "答對了！" : "答錯了！正確答案：" + q.answer, 670, optionStartY + 200);
  }
}

// 手勢偵測
function showHandGesture() {
  if (handPredictions.length > 0 && !showResult && currentQuestion < quizQuestions.length) {
    let hand = handPredictions[0];
    let fingerCount = countExtendedFingers(hand.landmarks);

    // 1~4指選答案，需連續偵測10幀
    if (fingerCount >= 1 && fingerCount <= 4) {
      if (fingerCount === lastFingerCount) {
        fingerCountFrame++;
      } else {
        fingerCountFrame = 1;
        lastFingerCount = fingerCount;
      }
      if (fingerCountFrame >= FINGER_HOLD_FRAME) {
        selectedAnswer = String.fromCharCode(64 + fingerCount); // 1->A, 2->B, ...
      }
    } else {
      fingerCountFrame = 0;
      lastFingerCount = 0;
    }

    // 張開手掌(五指)提前切換
    if (isHandOpen(hand.landmarks)) {
      nextQuestion();
    }
  }
}

// 張開手掌判斷（五指全開）
function isHandOpen(landmarks) {
  let fingersOpen = [8, 12, 16, 20].every(i => landmarks[i][1] < landmarks[i - 2][1]);
  let thumbOpen = landmarks[4][0] > landmarks[3][0];
  return fingersOpen && thumbOpen;
}

// 切換到下一題
function nextQuestion() {
  if (showResult) return; // 避免重複切換
  showResult = true;
  showEffect = true;
  effectType = (selectedAnswer === quizQuestions[currentQuestion].answer) ? "correct" : "wrong";
  if (selectedAnswer === quizQuestions[currentQuestion].answer) score++;
  effectTimer = millis();
  clearAutoNextTimer();
  setTimeout(() => {
    selectedAnswer = "";
    showResult = false;
    showEffect = false;
    currentQuestion++;
    if (currentQuestion >= quizQuestions.length) {
      gameState = "result";
    } else {
      questionStartTime = millis();
      autoNextTimer = null;
    }
  }, 1200);
}

// 清除自動切題計時器
function clearAutoNextTimer() {
  if (autoNextTimer) {
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }
}

// 只保留選項手勢偵測
function showHandGesture() {
  if (handPredictions.length > 0 && !showResult && currentQuestion < quizQuestions.length) {
    let hand = handPredictions[0];
    let fingerCount = countExtendedFingers(hand.landmarks);

    // 1~4指選答案，需連續偵測10幀
    if (fingerCount >= 1 && fingerCount <= 4) {
      if (fingerCount === lastFingerCount) {
        fingerCountFrame++;
      } else {
        fingerCountFrame = 1;
        lastFingerCount = fingerCount;
      }
      if (fingerCountFrame >= FINGER_HOLD_FRAME) {
        selectedAnswer = String.fromCharCode(64 + fingerCount); // 1->A, 2->B, ...
      }
    } else {
      fingerCountFrame = 0;
      lastFingerCount = 0;
    }
  }
}

// 握拳判斷（五指都彎曲）
function isFistGesture(landmarks) {
  // 指尖y大於指根y，且拇指靠近掌心
  let fingersBent = [8, 12, 16, 20].every(i => landmarks[i][1] > landmarks[i - 2][1]);
  let thumbBent = Math.abs(landmarks[4][0] - landmarks[2][0]) < 30;
  return fingersBent && thumbBent;
}

// 判斷比讚（拇指伸直，其餘彎曲）
function isThumbsUpGesture(landmarks) {
  // 拇指伸直
  let thumbUp = landmarks[4][1] < landmarks[3][1] && landmarks[4][1] < landmarks[2][1];
  // 其他四指彎曲
  let fingersBent = [8, 12, 16, 20].every(i => landmarks[i][1] > landmarks[i - 2][1]);
  return thumbUp && fingersBent;
}

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
  // 只偵測食指(8)、中指(12)、無名指(16)、小指(20)
  let tips = [8, 12, 16, 20];
  let count = 0;
  for (let i = 0; i < tips.length; i++) {
    if (landmarks[tips[i]][1] < landmarks[tips[i] - 2][1]) count++;
  }
  return count; // 1~4
}

// --- 新增全域變數 ---
let lastFingerCount = 0;
let fingerCountFrame = 0;
const FINGER_HOLD_FRAME = 10; // 需連續偵測10幀才選擇
let autoNextTimer = null; // 自動切題計時器

// --- 新增全域變數 ---
let balloonList = []; // 答對時氣球
let spiderList = [];  // 答錯時蜘蛛

function keyPressed() {
  if (gameState === "start" && keyCode === ENTER) {
    quizQuestions = shuffle(allQuestions).slice(0, 5);
    gameState = "quiz";
    currentQuestion = 0;
    score = 0;
    selectedAnswer = "";
    showResult = false;
    showEffect = false;
    questionStartTime = millis();
    lastFingerCount = 0;
    fingerCountFrame = 0;
  }
  if (gameState === "result" && keyCode === ENTER) {
    gameState = "start";
  }
}

// --- 大型煙火特效（左右下角）---
function drawFireworks(x, y, size = 60) {
  push();
  for (let i = 0; i < 16; i++) {
    let angle = TWO_PI / 16 * i;
    let len = size + 20 * sin((millis() - effectTimer) / 200 + i);
    stroke(0, 200 + random(-30, 30), 0, 200);
    strokeWeight(4);
    line(x, y, x + len * cos(angle), y + len * sin(angle));
  }
  pop();
}

// --- 大型蜘蛛網特效（左右下角）---
function drawSpiderWeb(x, y, size = 60) {
  push();
  stroke(60, 60, 60, 180);
  strokeWeight(2.5);
  // 畫放射線
  for (let i = 0; i < 8; i++) {
    let angle = TWO_PI / 8 * i;
    line(x, y, x + size * cos(angle), y + size * sin(angle));
  }
  // 畫圓弧
  for (let r = size * 0.4; r <= size; r += size * 0.2) {
    beginShape();
    for (let i = 0; i <= 8; i++) {
      let angle = TWO_PI / 8 * i;
      vertex(x + r * cos(angle), y + r * sin(angle));
    }
    endShape();
  }
  // 畫蜘蛛
  fill(40, 40, 40, 200);
  ellipse(x, y + size * 0.25, size * 0.25, size * 0.18);
  ellipse(x, y + size * 0.35, size * 0.15, size * 0.12);
  // 腳
  for (let i = 0; i < 8; i++) {
    let angle = PI / 8 * i - PI / 4;
    let sx = x + size * 0.1 * cos(angle);
    let sy = y + size * 0.25 + size * 0.09 * sin(angle);
    let ex = x + size * 0.18 * cos(angle);
    let ey = y + size * 0.25 + size * 0.18 * sin(angle);
    strokeWeight(2);
    line(sx, sy, ex, ey);
  }
  pop();
}

// 自動換行繪製，每行最多 maxLen 字
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

// 答對/錯特效（鏡頭畫面上）
function drawBalloons() {
  // 初始化氣球
  if (balloonList.length === 0) {
    for (let i = 0; i < 14; i++) {
      balloonList.push({
        x: random(60, 580),
        y: random(320, 460),
        color: color(random(180,255), random(120,220), random(120,255)),
        speed: random(2.5, 4),    // 更快
        size: random(48, 72)      // 更大
      });
    }
  }
  push();
  translate(0, 0);
  for (let b of balloonList) {
    fill(b.color);
    stroke(80, 80, 120, 120);
    strokeWeight(2.5);
    ellipse(b.x, b.y, b.size * 0.8, b.size);
    // 氣球繩
    stroke(120, 120, 120, 120);
    line(b.x, b.y + b.size * 0.5, b.x, b.y + b.size * 0.9);
    // 飄動
    b.y -= b.speed;
    b.x += sin(millis() / 400 + b.x) * 0.7;
  }
  pop();
  // 1.2秒後自動清空
  if (millis() - effectTimer > 1100) balloonList = [];
}

function drawSpiderOverlay() {
  // 畫上半部深灰漸層
  push();
  for (let i = 0; i < 120; i++) {
    let alpha = map(i, 0, 120, 120, 0);
    noStroke();
    fill(40, 40, 40, alpha);
    rect(0, i * 2, 640, 2);
  }
  pop();

  // 初始化蜘蛛與蜘蛛網
  if (spiderList.length === 0) {
    // 角落網
    spiderList.push({type:'corner', x:0, y:0, size:120, corner:'tl'});
    spiderList.push({type:'corner', x:640, y:0, size:120, corner:'tr'});
    spiderList.push({type:'corner', x:0, y:240, size:100, corner:'bl'});
    spiderList.push({type:'corner', x:640, y:240, size:100, corner:'br'});
    // 中間圓網
    spiderList.push({type:'circle', x:180, y:90, size:90});
    spiderList.push({type:'circle', x:480, y:120, size:70});
    // 幾隻蜘蛛
    for (let i = 0; i < 3; i++) {
      spiderList.push({
        type:'spider',
        x: random(80, 560),
        y: random(40, 180),
        size: random(30, 48)
      });
    }
  }
  // 畫蜘蛛網
  for (let s of spiderList) {
    if (s.type === 'corner') drawWebStyle(s.x, s.y, s.size, s.corner);
    if (s.type === 'circle') drawWebStyle(s.x, s.y, s.size, 'circle');
    if (s.type === 'spider') drawSpider(s.x, s.y, s.size);
  }
  // 1.2秒後自動清空
  if (millis() - effectTimer > 1100) spiderList = [];
}

// 多樣蜘蛛網樣式
function drawWebStyle(x, y, size, style) {
  push();
  stroke(220,220,220,180);
  strokeWeight(2);
  noFill();
  if (style === 'circle') {
    // 圓形網
    for (let r = size * 0.3; r <= size; r += size * 0.18) {
      ellipse(x, y, r * 2, r * 2);
    }
    for (let i = 0; i < 12; i++) {
      let angle = TWO_PI / 12 * i;
      line(x, y, x + size * cos(angle), y + size * sin(angle));
    }
  } else {
    // 角落網
    let startAngle, endAngle, cx, cy, flipX = 1, flipY = 1;
    if (style === 'tl') { startAngle = 0.5*PI; endAngle = PI; cx = x; cy = y; }
    if (style === 'tr') { startAngle = 0; endAngle = 0.5*PI; cx = x; cy = y; flipX = -1;}
    if (style === 'bl') { startAngle = PI; endAngle = 1.5*PI; cx = x; cy = y; flipY = -1;}
    if (style === 'br') { startAngle = 1.5*PI; endAngle = 2*PI; cx = x; cy = y; flipX = -1; flipY = -1;}
    // 弧線
    for (let r = size * 0.3; r <= size; r += size * 0.18) {
      beginShape();
      for (let a = startAngle; a <= endAngle; a += PI/24) {
        vertex(cx + flipX * r * cos(a), cy + flipY * r * sin(a));
      }
      endShape();
    }
    // 放射線
    for (let i = 0; i < 7; i++) {
      let angle = map(i, 0, 6, startAngle, endAngle);
      line(cx, cy, cx + flipX * size * cos(angle), cy + flipY * size * sin(angle));
    }
  }
  pop();
}

// 畫單隻蜘蛛
function drawSpider(x, y, size = 18) {
  push();
  // 先畫腳
  stroke(30, 30, 30, 180);
  strokeWeight(2);
  for (let i = 0; i < 8; i++) {
    let angle = PI / 8 * i - PI / 4;
    let sx = x + size * 0.2 * cos(angle);
    let sy = y + size * 0.1 * sin(angle);
    let ex = x + size * 0.38 * cos(angle);
    let ey = y + size * 0.18 * sin(angle);
    line(sx, sy, ex, ey);
  }
  // 再畫身體
  noStroke();
  fill(40, 40, 40, 220);
  ellipse(x, y, size, size * 0.7);
  ellipse(x, y + size * 0.4, size * 0.6, size * 0.4);
  pop();
}
