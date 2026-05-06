// Flash message auto-hide
document.querySelectorAll('.flash').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  }, 4000);
});

// Animate stat values
document.querySelectorAll('.stat-val').forEach(el => {
  const raw = el.textContent.replace(/[^0-9]/g, '');
  const num = parseInt(raw);
  if (!isNaN(num) && num > 0) {
    let current = 0;
    const step = Math.ceil(num / 30);
    const timer = setInterval(() => {
      current = Math.min(current + step, num);
      el.textContent = el.textContent.replace(/[\d,]+/, current.toLocaleString());
      if (current >= num) clearInterval(timer);
    }, 30);
  }
});

// Animate odds bars
document.querySelectorAll('.yes-bar, .yes-bar-lg').forEach(bar => {
  const target = bar.style.width;
  bar.style.width = '0';
  requestAnimationFrame(() => {
    bar.style.transition = 'width 0.8s cubic-bezier(0.4,0,0.2,1)';
    bar.style.width = target;
  });
});

// Handle URL error/success params
const params = new URLSearchParams(window.location.search);
if (params.get('error')) {
  const flash = document.createElement('div');
  flash.className = 'flash flash-error';
  flash.textContent = decodeURIComponent(params.get('error').replace(/\+/g, ' '));
  const container = document.querySelector('.page-container') || document.querySelector('.container');
  if (container) container.prepend(flash);
  setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 500); }, 4000);
}
if (params.get('success')) {
  const flash = document.createElement('div');
  flash.className = 'flash flash-success';
  flash.textContent = decodeURIComponent(params.get('success').replace(/\+/g, ' '));
  const container = document.querySelector('.page-container') || document.querySelector('.container');
  if (container) container.prepend(flash);
  setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 500); }, 4000);
}
