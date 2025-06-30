const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

canvas.width = 800;
canvas.height = 400;

class Bike {
    constructor() {
        this.width = 50;
        this.height = 30;
        this.x = 100;
        this.y = canvas.height - this.height - 50;
        this.velocityY = 0;
        this.gravity = 0.8;
        this.jumpForce = -15;
        this.jumps = 0;
        this.maxJumps = 2;
    }

    draw() {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    jump() {
        if (this.jumps < this.maxJumps) {
            this.velocityY = this.jumpForce;
            this.jumps++;
        }
    }

    update() {
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        if (this.y > canvas.height - this.height - 50) {
            this.y = canvas.height - this.height - 50;
            this.velocityY = 0;
            this.jumps = 0;
        }
    }
}

class Hole {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width;
        this.y = canvas.height - this.height;
        this.speed = 5;
    }

    draw() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= this.speed;
    }
}

const bike = new Bike();
let holes = [];
let score = 0;
let gameOver = false;
let lastHoleSpawn = 0;
const minHoleDistance = 300;

function handleKeyPress(event) {
    if (event.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else {
            bike.jump();
        }
    }
}

function resetGame() {
    bike.x = 100;
    bike.y = canvas.height - bike.height - 50;
    bike.velocityY = 0;
    bike.jumps = 0;
    holes = [];
    score = 0;
    gameOver = false;
    gameOverElement.classList.add('hidden');
}

function checkCollision(bike, hole) {
    return (
        bike.x < hole.x + hole.width &&
        bike.x + bike.width > hole.x &&
        bike.y + bike.height > hole.y
    );
}

function drawGround() {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

function gameLoop() {
    if (gameOver) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    drawGround();

    // スコア更新
    score++;
    scoreElement.textContent = `距離: ${Math.floor(score / 10)}m`;

    // 穴の生成
    if (score - lastHoleSpawn > minHoleDistance) {
        holes.push(new Hole());
        lastHoleSpawn = score;
    }

    // 穴の更新と描画
    holes = holes.filter(hole => {
        hole.update();
        hole.draw();
        
        if (checkCollision(bike, hole)) {
            gameOver = true;
            gameOverElement.classList.remove('hidden');
        }
        
        return hole.x > -hole.width;
    });

    // 自転車の更新と描画
    bike.update();
    bike.draw();

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', handleKeyPress);
resetGame();
gameLoop();
