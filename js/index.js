const img = document.getElementById('move-img');
const board = document.querySelector('.board');
const imgWidth = img.offsetWidth;
const boardWidth = board.offsetWidth;

let pos = boardWidth; // 右端からスタート
const speed = 8;      // 速度（px/frame）

function move() {
  pos -= speed;
  if (pos < -imgWidth) {
    pos = boardWidth;
  }
  img.style.left = pos + 'px';
  requestAnimationFrame(move);
}

move();