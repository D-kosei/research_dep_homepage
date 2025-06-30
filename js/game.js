// ===== キャンバス設定 =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== ゲーム定数 =====
const GRAVITY = 0.5;                      // 重力加速度
const JUMP_STRENGTH = -12;               // ジャンプ時の初速度
const BASE_SCROLL_SPEED = 3;             // 通常の横スクロール速度
let scrollSpeed = BASE_SCROLL_SPEED;     // 現在のスクロール速度（加速対応）

// ===== ゲーム状態管理 =====
let playStartTime = 0;                    // ゲーム開始時刻（ミリ秒）
let gameState = "start";                 // "start" | "play" | "over"
let score = 0;                            // スコアカウント
let showStartText = false;               // 「スタート！」表示のフラグ
let startTextTimer = 0;                  // 表示タイマー
let boostFrames = 0;                     // 加速持続フレーム（Shiftキー）

// ===== プレイヤーオブジェクト =====
const player = {
  x: 100,
  y: canvas.height - 140, // 足場の上に設置
  width: 60,
  height: 60,
  vy: 0,
  onGround: true,
  canDoubleJump: true
};;

// ===== 足場・障害物の管理 =====
const platforms = [];
const obstacles = [];
const platformWidth = 200;
const platformHeight = 40;

// 初期足場の生成
function initPlatforms() {
  platforms.length = 0;
  const groundY = canvas.height - 100;
  for (let i = 0; i < 8; i++) {
    platforms.push({
      x: i * platformWidth,
      y: groundY,
      hasSpike: false
    });
  }
}

// 足場の再生成（無限生成）
function regeneratePlatforms() {
  if (platforms[0].x + platformWidth < 0) {
    platforms.shift();
    const lastX = platforms[platforms.length - 1].x;
    const gap = Math.random() < 0.3 ? 60 : 0;
    const groundY = canvas.height - 100;
    const newY = groundY + (Math.random() < 0.2 ? -60 : 0);
    const now = Date.now();
    const elapsed = now - playStartTime;
    platforms.push({
      x: lastX + platformWidth + gap,
      y: newY,
      hasSpike: elapsed >= 5000 ? Math.random() < 0.3 : false
    });
    score++;
  }
};
    score++;

    score++;
  


// ランダムに隕石（障害物）を生成
function spawnObstacle() {
  // 出現確率
  if (Math.random() < 0.01) {
    obstacles.push({
      x: canvas.width,
      y: -40,
      size: 40,
      vy: 1 + Math.random() * 0.5
    });
  }
}

// 障害物の更新・当たり判定
function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.y += ob.vy;
    ob.x -= scrollSpeed;

    // プレイヤーとの衝突判定
    if (
      player.x < ob.x + ob.size &&
      player.x + player.width > ob.x &&
      player.y < ob.y + ob.size &&
      player.y + player.height > ob.y
    ) {
      gameState = "over";
    }

    // 画面外へ出たら削除
    if (ob.y > canvas.height) {
      obstacles.splice(i, 1);
    }
  }
}

// スパイク（三角形）との当たり判定（接触でゲームオーバー）
function checkSpikeCollision(player) {
  for (const pf of platforms) {
    if (pf.hasSpike) {
      const spikeW = 40;
    const spikeH = 40;
    const spikeX = pf.x + platformWidth / 2 - spikeW / 2;
    const spikeY = pf.y - spikeH;
      if (
        player.x < spikeX + spikeW &&
        player.x + player.width > spikeX &&
        player.y < spikeY + spikeH &&
        player.y + player.height > spikeY
      ) {
        return true;
      }
    }
  }
  return false;
}

// スパイク（三角形）の描画処理
function drawSpikes() {
  ctx.fillStyle = "black";
  for (const pf of platforms) {
    if (pf.hasSpike) {
      const centerX = pf.x + platformWidth / 2;
      const topY = pf.y;
      ctx.beginPath();
      ctx.moveTo(centerX, topY - 20);
      ctx.lineTo(centerX - 10, topY);
      ctx.lineTo(centerX + 10, topY);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// ===== ゲーム状態更新処理 =====
function update() {
  if (gameState !== "play") return;

  scrollSpeed = boostFrames > 0 ? BASE_SCROLL_SPEED + 2 : BASE_SCROLL_SPEED;
  if (boostFrames > 0) boostFrames--;

  player.vy += GRAVITY;
  player.y += player.vy;
  player.onGround = false;

  for (const pf of platforms) {
    if (
      player.x + player.width > pf.x &&
      player.x < pf.x + platformWidth &&
      player.y + player.height >= pf.y &&
      player.y + player.height <= pf.y + platformHeight
    ) {
      player.y = pf.y - player.height;
      player.vy = 0;
      player.onGround = true;
      player.canDoubleJump = true;
    }
  }

  for (const pf of platforms) {
    pf.x -= scrollSpeed;
  }

  regeneratePlatforms();
  spawnObstacle();
  updateObstacles();

  if (checkSpikeCollision(player)) {
    gameState = "over";
  }

  if (player.y > canvas.height) {
    gameState = "over";
  }
}

// ===== 描画処理 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // プレイヤー
  ctx.fillStyle = "red";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // 足場
  ctx.fillStyle = "green";
  for (const pf of platforms) {
    ctx.fillRect(pf.x, pf.y, platformWidth, platformHeight);
  }

  // スパイク（三角形）を描画
  drawSpikes();

  // 隕石（丸型障害物）
  ctx.fillStyle = "gray";
  for (const ob of obstacles) {
    ctx.beginPath();
    ctx.arc(ob.x, ob.y, ob.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // スコア表示
  ctx.fillStyle = "black";
  ctx.font = "20px sans-serif";
  ctx.fillText(`Score: ${score}`, 10, 30);

  // 状態メッセージ
  if (gameState === "start") {
    ctx.fillText("スペースキーでスタート", 200, 150);
  } else if (gameState === "over") {
    ctx.fillText("ゲームオーバー！スペースキーで再挑戦", 150, 180);
  }

  if (showStartText && startTextTimer > 0) {
    ctx.fillStyle = "yellow";
    ctx.font = "30px sans-serif";
    ctx.fillText("スタート！", canvas.width / 2 - 60, canvas.height / 2);
    startTextTimer--;
    if (startTextTimer <= 0) {
      showStartText = false;
    }
  }
}

// ===== メインループ処理 =====
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ===== キー入力処理 =====
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (gameState === "start" || gameState === "over") {
    playStartTime = Date.now();
      gameState = "play";
      player.y = 280;
      player.vy = 0;
      player.canDoubleJump = true;
      score = 0;
      obstacles.length = 0;
      showStartText = true;
      startTextTimer = 60;
      initPlatforms();
    } else if (player.onGround) {
      player.vy = JUMP_STRENGTH;
    } else if (player.canDoubleJump) {
      player.vy = JUMP_STRENGTH;
      player.canDoubleJump = false;
    }
  } else if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    boostFrames = 15;
  }
});

// ===== 初期化とゲーム開始 =====
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
initPlatforms();
gameLoop();
