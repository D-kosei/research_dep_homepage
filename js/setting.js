window.addEventListener('DOMContentLoaded', () => {
  const charSelect = document.getElementById('character');
  const charPreview = document.getElementById('character-preview');
  const charImgMap = {
    bike: 'img/bike.png',
    elephant: 'img/elephant.png',
    horse: 'img/horse.png',
    cheetah: 'img/cheetah.png'
  };

  // 保存済み設定の反映
  const saved = localStorage.getItem('charider_settings');
  if (saved) {
    const settings = JSON.parse(saved);
    document.getElementById('bgm-toggle').value = settings.bgm;
    charSelect.value = settings.character || 'bike';
  }

  // プレビュー画像の初期表示
  if (charPreview) {
    charPreview.src = charImgMap[charSelect.value];
    charSelect.addEventListener('change', () => {
      charPreview.src = charImgMap[charSelect.value];
    });
  }
});

document.getElementById('setting-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const bgm = document.getElementById('bgm-toggle').value;
  const character = document.getElementById('character').value;
  const settings = { bgm, character };
  localStorage.setItem('charider_settings', JSON.stringify(settings));
  const msg = document.getElementById('save-message');
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 1200);
});