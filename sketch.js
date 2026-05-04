let faceMesh;
let video;
let faces = [];
let stars = [];

// 定義點位編號
const mouthOuter = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const mouthInner = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];
const rightEyeOuter = [130, 247, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110, 25];
const rightEyeInner = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const leftEyeOuter = [359, 467, 260, 259, 257, 258, 286, 414, 463, 341, 256, 252, 253, 254, 339, 255];
const leftEyeInner = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];
const faceSilhouette = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

function preload() {
  // 初始化 ml5 faceMesh
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: true, flipHorizontal: true });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 設定攝影機
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // 開始辨識
  faceMesh.detectStart(video, gotFaces);

  // 產生背景星星
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      alpha: random(100, 255)
    });
  }
}

function draw() {
  background('#e7c6ff');

  // 計算顯示影像的寬高 (全螢幕的 50%)
  let displayW = width * 0.5;
  let displayH = height * 0.5;
  // 保持影像比例 (根據寬度計算高度，或視需求固定 50%)
  // 這裡採用嚴格的 50% 視窗大小
  let xOff = (width - displayW) / 2;
  let yOff = (height - displayH) / 2;

  // 1. 繪製鏡像影像
  push();
  translate(xOff + displayW, yOff); // 移動到右邊邊界
  scale(-1, 1); // 水平翻轉
  image(video, 0, 0, displayW, displayH);
  pop();

  if (faces.length > 0) {
    let face = faces[0];

    // 2. 繪製黑色遮罩與外太空特效
    drawMask(face, xOff, yOff, displayW, displayH);

    // 3. 繪製霓虹線條
    push();
    stroke(255, 0, 0);
    strokeWeight(1);
    // 設定霓虹燈光暈效果
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'red';
    noFill();

    // 嘴唇外圈
    drawConnectors(face.keypoints, mouthOuter, true, xOff, yOff, displayW, displayH);
    // 嘴唇內圈
    drawConnectors(face.keypoints, mouthInner, true, xOff, yOff, displayW, displayH);
    // 右眼
    drawConnectors(face.keypoints, rightEyeOuter, true, xOff, yOff, displayW, displayH);
    drawConnectors(face.keypoints, rightEyeInner, true, xOff, yOff, displayW, displayH);
    // 左眼
    drawConnectors(face.keypoints, leftEyeOuter, true, xOff, yOff, displayW, displayH);
    drawConnectors(face.keypoints, leftEyeInner, true, xOff, yOff, displayW, displayH);
    // 臉部外輪廓
    drawConnectors(face.keypoints, faceSilhouette, true, xOff, yOff, displayW, displayH);
    
    pop();
  }
}

function gotFaces(results) {
  faces = results;
}

// 繪製線條的輔助函式
function drawConnectors(keypoints, indices, closed, xOff, yOff, dW, dH) {
  beginShape();
  for (let i of indices) {
    let kp = keypoints[i];
    if (kp) {
      // 將座標轉換為對應畫布中間 50% 的位置，並考慮鏡像翻轉
      // 因為鏡像是由 image() 處理，這裡的座標計算需手動對齊鏡像邏輯
      let mappedX = map(kp.x, 0, video.width, xOff + dW, xOff);
      let mappedY = map(kp.y, 0, video.height, yOff, yOff + dH);
      vertex(mappedX, mappedY);
    }
  }
  endShape(closed ? CLOSE : OPEN);
}

// 繪製遮罩：將臉部以外填黑並加上星星
function drawMask(face, xOff, yOff, dW, dH) {
  push();
  fill(0);
  noStroke();
  
  // 繪製一個巨大的矩形遮罩，並用 beginContour 挖掉臉部
  beginShape();
  // 外框：限制在影像顯示範圍內
  vertex(xOff, yOff);
  vertex(xOff + dW, yOff);
  vertex(xOff + dW, yOff + dH);
  vertex(xOff, yOff + dH);
  
  // 內框：挖出臉部形狀 (座標需與線條一致)
  beginContour();
  for (let i = faceSilhouette.length - 1; i >= 0; i--) {
    let kp = face.keypoints[faceSilhouette[i]];
    let mappedX = map(kp.x, 0, video.width, xOff + dW, xOff);
    let mappedY = map(kp.y, 0, video.height, yOff, yOff + dH);
    vertex(mappedX, mappedY);
  }
  endContour();
  endShape(CLOSE);

  // 在黑色背景區域繪製星星 (只在影像範圍內顯示)
  for (let s of stars) {
    if (s.x > xOff && s.x < xOff + dW && s.y > yOff && s.y < yOff + dH) {
      // 檢查星星是否在臉部輪廓外 (簡單判斷：若座標不在臉部內則畫出)
      // 這裡直接繪製，因為遮罩已經先畫好黑色了，星星畫在遮罩之上
      fill(255, s.alpha);
      circle(s.x, s.y, s.size);
    }
  }
  pop();
}

// 處理視窗大小改變與手機旋轉
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 重新生成星星位置以適應新畫布
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      alpha: random(100, 255)
    });
  }
  
  // 針對手機端影像方向優化
  if (video) {
    if (windowWidth < windowHeight) {
      // 直向模式處理 (視需求可調整 video size)
      video.size(height, width); 
    } else {
      video.size(640, 480);
    }
  }
}
