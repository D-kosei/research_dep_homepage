// ===== キャンバスと描画コンテキストを取得 =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== ゲームに関する定数 =====
const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;
const SCROLL_SPEED = 3;

// ===== ゲーム状態を管理する変数 =====
let gameState = "start"; // start, play, over
let score = 0;
let showStartText = false;
let startTextTimer = 0;

// ===== プレイヤーオブジェクト =====
const player = {
  x: 100,
  y: 280,
  width: 30,
  height: 30,
  vy: 0,
  onGround: true,
  canDoubleJump: true
};

// ===== 足場と障害物の配列 =====
const platforms = [];
const obstacles = [];
const platformWidth = 100;
const platformHeight = 20;

// ===== 初期の足場生成 =====
function initPlatforms() {
  platforms.length = 0;
  for (let i = 0; i < 8; i++) {
    platforms.push({ x: i * platformWidth, y: 310 });
  }
}

// ===== 隕石（障害物）生成 =====
function spawnObstacle() {
  if (Math.random() < 0.02) {
    obstacles.push({
      x: canvas.width,
      y: -20,
      size: 20,
      vy: 1 + Math.random() * 0.5 // 落下速度（遅め）
    });
  }
}

// ===== 障害物の移動・当たり判定 =====
function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.y += ob.vy;
    ob.x -= SCROLL_SPEED;

    // プレイヤーとの当たり判定
    if (
      player.x < ob.x + ob.size &&
      player.x + player.width > ob.x &&
      player.y < ob.y + ob.size &&
      player.y + player.height > ob.y
    ) {
      gameState = "over";
    }

    // 画面外の障害物を削除
    if (ob.y > canvas.height) {
      obstacles.splice(i, 1);
    }
  }
}

// ===== ゲーム状態の更新 =====
function update() {
  if (gameState !== "play") return;

  // 重力・ジャンプ
  player.vy += GRAVITY;
  player.y += player.vy;
  player.onGround = false;

  // 足場との接触
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

  // 足場のスクロール
  for (const pf of platforms) {
    pf.x -= SCROLL_SPEED;
  }

  // 足場の再生成（無限）
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

  // 落下によるゲームオーバー
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

  // メッセージ表示
  if (gameState === "start") {
    ctx.fillText("スペースキーでスタート", 200, 150);
  } else if (gameState === "over") {
    ctx.fillText("ゲームオーバー！スペースキーで再挑戦", 150, 180);
  }

  // スタート演出
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

// ===== ゲームループ =====
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ===== キーボード操作（ジャンプ・スタート） =====
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
  }
});

// ===== 初期化とループ開始 =====
initPlatforms();
gameLoop();
