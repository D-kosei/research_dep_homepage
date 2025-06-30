// ===== キャンバス設定 =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== ゲーム定数 =====
const GRAVITY = 0.5;                      // 重力加速度
const JUMP_STRENGTH = -10;               // ジャンプ時の初速度
const BASE_SCROLL_SPEED = 3;             // 通常の横スクロール速度
let scrollSpeed = BASE_SCROLL_SPEED;     // 現在のスクロール速度（加速対応）

// ===== ゲーム状態管理 =====
let gameState = "start";                 // "start" | "play" | "over"
let score = 0;                            // スコアカウント
let showStartText = false;               // 「スタート！」表示のフラグ
let startTextTimer = 0;                  // 表示タイマー
let boostFrames = 0;                     // 加速持続フレーム（Shiftキー）

// ===== プレイヤーオブジェクト =====
const player = {
  x: 100,
  y: 280,
  width: 30,
  height: 30,
  vy: 0,                // Y方向速度
  onGround: true,       // 地面にいるか
  canDoubleJump: true   // 2段ジャンプ可能か
};

// ===== 足場・障害物の管理 =====
const platforms = [];
const obstacles = [];
const platformWidth = 100;
const platformHeight = 20;

// 初期足場の生成
function initPlatforms() {
  platforms.length = 0;
  for (let i = 0; i < 8; i++) {
    platforms.push({ x: i * platformWidth, y: 310 });
  }
}

// ランダムに隕石（障害物）を生成
function spawnObstacle() {
  if (Math.random() < 0.02) {
    obstacles.push({
      x: canvas.width,
      y: -20,
      size: 20,
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

// ===== ゲーム状態更新処理 =====
function update() {
  if (gameState !== "play") return;

  // 一時的加速処理（Shift押下時のみ）
  scrollSpeed = boostFrames > 0 ? BASE_SCROLL_SPEED + 2 : BASE_SCROLL_SPEED;
  if (boostFrames > 0) boostFrames--;

  // 重力適用・位置更新
  player.vy += GRAVITY;
  player.y += player.vy;
  player.onGround = false;

  // 足場との接触判定
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

  // 足場スクロール
  for (const pf of platforms) {
    pf.x -= scrollSpeed;
  }

  // 足場の再生成（無限生成）
  if (platforms[0].x + platformWidth < 0) {
    platforms.shift();
    const lastX = platforms[platforms.length - 1].x;
    const gap = Math.random() < 0.3 ? 60 : 0;
    const newY = 310 + (Math.random() < 0.2 ? -30 : 0);
    platforms.push({ x: lastX + platformWidth + gap, y: newY });
    score++;
  }

  spawnObstacle();
  updateObstacles();

  // 落下判定
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

  // 障害物
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

  // スタート演出表示
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
    boostFrames = 15; // Shiftを押した瞬間、一定フレームだけ加速
  }
});

// ===== 初期化とゲーム開始 =====
initPlatforms();
gameLoop();
