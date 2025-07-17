// --- game.jsの先頭（たとえばBGMや定数のすぐ下など）に追加 ---
// ランキングデータの管理
class RankingManager {
    constructor() {
        this.STORAGE_KEY = 'charider_scores';
        this.MAX_SCORES = 10;
    }
    saveScore(score) {
        const scores = this.getScores();
        const newScore = {
            score: score,
            date: new Date().toLocaleString()
        };
        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score);
        const topScores = scores.slice(0, this.MAX_SCORES);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(topScores));
    }
    getScores() {
        const scoresJson = localStorage.getItem(this.STORAGE_KEY);
        return scoresJson ? JSON.parse(scoresJson) : [];
    }
}
// -------------------------------------------

const rankingManager = new RankingManager();


// ===== キャンバス設定 =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== サウンド読み込み（BGM） =====
const bgm = new Audio("bgm/bgm.mp3");      // 背景音楽（ループ）
bgm.loop = true;

// ===== ゲーム定数 =====
const GRAVITY = 0.5;            // 重力加速度
const JUMP_STRENGTH = -12;      // ジャンプ時の初速度
const BASE_SCROLL_SPEED = 3;    // 通常の横スクロール速度
let scrollSpeed = BASE_SCROLL_SPEED; // 現在のスクロール速度（加速対応）

// キャラクター画像のパスを設定
function getCharacterImagePath() {
  const settings = JSON.parse(localStorage.getItem('charider_settings') || '{}');
  switch (settings.character) {
    case 'elephant':
      return "img/elephant.png";
    case 'horse':
      return "img/horse.png";
    case 'cheetah':
      return "img/cheetah.png";
    default:
      return "img/bike.png";
  }
}

// プレイヤー用画像の読み込み
let characterImg = new Image();
characterImg.src = getCharacterImagePath();

// ===== ゲーム状態管理 =====
let playStartTime = 0;          // ゲーム開始時刻（ミリ秒）
let gameState = "start";        // "start" | "play" | "over"
let score = 0;                  // スコア
let showStartText = false;      // 「スタート！」表示フラグ
let startTextTimer = 0;         // 表示タイマー
let boostFrames = 0;            // 加速持続フレーム

// ===== プレイヤーオブジェクト =====
const player = {
  x: 100,
  y: canvas.height - 62, // 足場の上に設置
  width: 100,
  height: 100,
  vy: 0,
  onGround: true,
  canDoubleJump: true
};

// ===== 足場・障害物の管理 =====
const platforms = [];
const obstacles = [];
const platformWidth = 200;
const platformHeight = 40;

// 初期足場の生成
function initPlatforms() {
  platforms.length = 0;//配列を空にする
  const groundY = canvas.height - 100;//画面の下から100px上の場所に足場を配置する
  for (let i = 0; i < 8; i++) {//この8は適当らしい
    platforms.push({
      x: i * platformWidth,
      y: groundY,
      hasSpike: false//とげをつくる
    });
  }
}

// 足場の再生成（無限生成）
function regeneratePlatforms() {
  if (platforms[0].x + platformWidth < 0) {//今いる足場が画面から出たら
    platforms.shift();//配列の最初をなくす、使わなくなった足場のデータを消す
    const lastX = platforms[platforms.length - 1].x;//今生成されている足場の一番右のｘ座標を取得
    const gap = Math.random() < 0.3 ? 150 : 0;//足場に穴を作るかどうか
    const groundY = canvas.height - 100;//画面の下から100px上の場所に足場を配置する
    const newY = groundY + (Math.random() < 0.2 ? -60 : 0);
    const now = Date.now();//現在の時刻
    const elapsed = now - playStartTime;//経過時間
    platforms.push({
      x: lastX + platformWidth + gap,
      y: newY,
      hasSpike: elapsed >= 5000 ? Math.random() < 0.3 : false//とげの生成（開始5秒から生成する）
    });
    score++;
  }
};

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
  // 経過時間を取得
  const elapsed = Date.now() - playStartTime;
  // 例えば10秒ごとに+1（落下速度の増加量は調整可）
  const fallSpeedUp = Math.floor(elapsed / 10000);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.y += ob.vy + fallSpeedUp;;
    ob.x -= scrollSpeed;
    // プレイヤーとの衝突判定
    if (
    player.x + player.width * 0.3 < ob.x + ob.size * 0.4 &&
    player.x + player.width > ob.x - ob.size * 0.4 &&
    player.y < ob.y + ob.size * 0.4 &&
    player.y + player.height > ob.y - ob.size * 0.4
    ) {
      gameState = "over";
      bgm.pause(); // BGMを一時停止
      rankingManager.saveScore(score);
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
       const spikeW = 30;
      const spikeH = 30;
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

// ===== スパイク描画 =====
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
  // ゲーム中でなければ何もしない
  if (gameState !== "play") return;

  // 経過時間を取得
  const elapsed = Date.now() - playStartTime;

  // スクロール速度を経過時間で増加させる（例：10秒ごとに+1）
  scrollSpeed = BASE_SCROLL_SPEED + Math.floor(elapsed / 10000);

  // ブースト中はさらに加速
  if (boostFrames > 0) scrollSpeed += 2;
  if (boostFrames > 0) boostFrames--;


  // プレイヤーの落下速度に重力を加算
  player.vy += GRAVITY;
  // プレイヤーのy座標を移動
  player.y += player.vy;
  // 地面についていない状態に初期化
  player.onGround = false;

  // すべての足場とプレイヤーの当たり判定
  for (const pf of platforms) {
    if (
      player.x + player.width > pf.x &&                   // プレイヤーの右端が足場の左端より右
      player.x < pf.x + platformWidth &&                  // プレイヤーの左端が足場の右端より左
      player.y + player.height >= pf.y &&                 // プレイヤーの底面が足場の上より下
      player.y + player.height <= pf.y + platformHeight   // プレイヤーの底面が足場の底より上
    ) {
      // プレイヤーを足場の上に乗せる
      player.y = pf.y - player.height;
      // 落下速度をリセット
      player.vy = 0;
      // 地面にいる状態に
      player.onGround = true;
      // ダブルジャンプをリセット
      player.canDoubleJump = true;
    }
  }

  // 足場を全体的に左へ移動（スクロール）
  for (const pf of platforms) {
    pf.x -= scrollSpeed;
  }

  // 必要なら新しい足場を生成（無限スクロール）
  regeneratePlatforms();
  // 一定確率で新たな障害物を生成
  spawnObstacle();
  // 既存の障害物の位置を更新＆当たり判定
  updateObstacles();

  // スパイク（障害物）との当たり判定（当たればゲームオーバー）
  if (checkSpikeCollision(player)) {
    gameState = "over";
    bgm.pause(); // BGMを一時停止
    rankingManager.saveScore(score);
  }

  // 画面外（下）に落ちたらゲームオーバー
  if (player.y > canvas.height) {
    gameState = "over";
    bgm.pause(); // BGMを一時停止
    rankingManager.saveScore(score);
  }
}

// ===== 描画処理 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // プレイヤー
  let drawW = player.width;
  let drawH = player.height;
  let offsetY = 0;
  const settings = JSON.parse(localStorage.getItem('charider_settings') || '{}');

  // 大きさの調整
  if (settings.character && settings.character === "horse") {
    drawW = player.width * 1.3;
    drawH = player.height * 1.3;
  } else if (settings.character === "elephant" || settings.character === "cheetah") {
    drawW = player.width * 2;
    drawH = player.height * 2.3;
    if (settings.character === "elephant") {
      offsetY = drawH * 0.12; // 下に12%分浮かせる
    }
  }
  if (characterImg.complete) {
    ctx.drawImage(
      characterImg,
      player.x - (drawW - player.width) / 2,
      player.y - (drawH - player.height) / 2,
      drawW,
      drawH
    );
  } else {
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

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
  ctx.font = "28px sans-serif";
  ctx.textAlign = "center"; // 中央揃え
  if (gameState === "start") {
    ctx.fillText(
      isMobile() ? "ジャンプボタンでスタート" : "スペースキーでスタート",
      canvas.width / 2, canvas.height / 2
    );
  } else if (gameState === "over") {
    ctx.fillText(
      isMobile() ? "ゲームオーバー！ジャンプボタンで再挑戦" : "ゲームオーバー！スペースキーで再挑戦",
      canvas.width / 2, canvas.height / 2
    );
  }
  ctx.textAlign = "start"; // 描画後に戻す

  if (showStartText && startTextTimer > 0) {
    ctx.fillStyle = "yellow";
    ctx.font = "30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("スタート！", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
    startTextTimer--;
    if (startTextTimer <= 0) {
      showStartText = false;
    }
  }
}

// ===== メインループ =====
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ===== ゲームリセット =====
function resetGame() {
  // キャラクター画像を再設定
  characterImg.src = getCharacterImagePath();

  // ゲーム初期化処理
  playStartTime = Date.now();
  gameState = "play";
  player.y = canvas.height - 100 - player.height;
  player.vy = 0;
  player.canDoubleJump = true;
  score = 0;
  obstacles.length = 0;
  showStartText = true;
  startTextTimer = 60;
  initPlatforms();
  if (!localStorage.getItem('charider_settings')) {
    localStorage.setItem('charider_settings', JSON.stringify({ bgm: "on" }));
  }
  // ここでBGMのON/OFF判定
  const settings = JSON.parse(localStorage.getItem('charider_settings') || '{}');
  if (settings.bgm === "on") {
    bgm.currentTime = 0;
    bgm.play();
  } else {
    bgm.pause();
    bgm.currentTime = 0;
  }
}

// ===== キー入力処理 =====
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (gameState === "start" || gameState === "over") {
      resetGame();
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

// ===== キャンバスリサイズ =====
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 足場再配置
  const groundY = canvas.height - 100;
  if (gameState === "play") {
    player.y = groundY - player.height;
  }
  initPlatforms();
}

function isMobile() {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

// 縦画面かどうか判定
function isPortrait() {
  if (window.screen.orientation && window.screen.orientation.type) {
    return window.screen.orientation.type.startsWith('portrait');
  }
  // Fallback
  return window.innerHeight > window.innerWidth;
}

// 横画面の促し表示の制御
function checkOrientationNotice() {
  if (isMobile() && isPortrait()) {
    document.getElementById('rotateNotice').style.display = "flex";
  } else {
    document.getElementById('rotateNotice').style.display = "none";
  }
}

// リサイズや向き変化時に実行
window.addEventListener("resize", checkOrientationNotice);
window.addEventListener("orientationchange", checkOrientationNotice);
window.addEventListener("DOMContentLoaded", checkOrientationNotice);
setTimeout(checkOrientationNotice, 100); // レイアウト確定後にも実行
// 初期表示でもチェック
checkOrientationNotice();

// --- タッチボタンのイベント追加 ---
document.getElementById("jumpBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  // ゲームオーバー/スタート時はリセット
  if (gameState === "start" || gameState === "over") {
    resetGame();
    return;
  }
  // プレイ中はジャンプ
  if (gameState === "play" && (player.onGround || player.canDoubleJump)) {
    if (player.onGround) {
      player.vy = JUMP_STRENGTH;
      // jumpSoundがあればここで鳴らす
    } else if (player.canDoubleJump) {
      player.vy = JUMP_STRENGTH;
      player.canDoubleJump = false;
      // jumpSoundがあればここで鳴らす
    }
  }
});

document.getElementById("boostBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  boostFrames = 15;
});

//これがメイン関数といえるところ
window.addEventListener("resize", resizeCanvas);//ウィンドウの大きさが変わったときに自動的に実行する
resizeCanvas();//これはページを開いたときに実行される
initPlatforms();//足場を初期化する
gameLoop(); //ゲームが動き続ける
