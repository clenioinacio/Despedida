(function () {
  'use strict';

  var VIDEOS = window.VIDEOS || [];

  var videoFrame = document.getElementById('videoFrame');
  var videoPlay = document.getElementById('videoPlay');
  var videoTitle = document.getElementById('videoTitle');
  var videoCounter = document.getElementById('videoCounter');
  var prevBtn = document.getElementById('prevVideo');
  var nextBtn = document.getElementById('nextVideo');

  var player = null;
  var index = 0;
  var started = false;
  var pendingStart = false;

  /* ---------------- YouTube IFrame API ---------------- */
  function loadYouTubeAPI() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(tag, first);
  }

  window.onYouTubeIframeAPIReady = function () {
    if (!VIDEOS.length) { return; }
    player = new YT.Player('ytplayer', {
      width: '100%',
      height: '100%',
      videoId: VIDEOS[0].id,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        playsinline: 1
      },
      events: {
        onReady: onReady,
        onStateChange: onStateChange,
        onError: onError
      }
    });
  };

  function onReady() {
    updateTitle();
    if (pendingStart) { pendingStart = false; player.unMute(); player.playVideo(); }
  }

  function onStateChange(e) {
    if (!player) { return; }
    var S = YT.PlayerState;
    if (e.data === S.PLAYING) {
      videoFrame.classList.add('playing');
      updateTitle();
    } else if (e.data === S.PAUSED) {
      videoFrame.classList.remove('playing');
    } else if (e.data === S.ENDED) {
      next(); // passa automaticamente para o vídeo seguinte
    }
  }

  function onError() {
    videoTitle.textContent = 'Não foi possível carregar este vídeo';
  }

  function updateTitle() {
    var title = '';
    try {
      var d = player.getVideoData && player.getVideoData();
      if (d && d.title) { title = d.title; }
    } catch (err) {}
    if (!title && VIDEOS[index] && VIDEOS[index].titulo) { title = VIDEOS[index].titulo; }
    videoTitle.textContent = title || ('Vídeo ' + (index + 1));
    videoCounter.textContent = (index + 1) + ' / ' + VIDEOS.length;
  }

  function playIndex(i) {
    if (!player || !VIDEOS.length) { return; }
    index = ((i % VIDEOS.length) + VIDEOS.length) % VIDEOS.length;
    videoCounter.textContent = (index + 1) + ' / ' + VIDEOS.length;
    player.loadVideoById(VIDEOS[index].id);
  }

  function next() { playIndex(index + 1); }
  function prev() { playIndex(index - 1); }

  function startVideo() {
    started = true;
    if (player) {
      player.unMute();
      player.playVideo();
    } else {
      pendingStart = true;
    }
  }

  function togglePlay() {
    if (!player) { return; }
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.unMute();
      player.playVideo();
    }
  }

  /* ---------------- Revelar ao entrar no ecrã ---------------- */
  function initReveals() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          o.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { obs.observe(el); });
  }

  /* ---------------- Pétalas (caem) + corações (sobem) ---------------- */
  function initPetals() {
    var canvas = document.getElementById('petals');
    var ctx = canvas.getContext('2d');
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

    var W = 0, H = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var COLORS = ['#c96f86', '#e7b8c4', '#d98aa0', '#b9923a', '#b0576f'];
    var petals = [];
    var hearts = [];
    var PCOUNT = (window.innerWidth < 640) ? 12 : 18;
    var HEART_EVERY = 110;
    var tick = 0;

    function rand(a, b) { return Math.random() * (b - a) + a; }

    function mkPetal() {
      return {
        x: rand(0, W), y: rand(-H, 0), size: rand(6, 14),
        speed: rand(0.5, 1.4), sway: rand(0.4, 1.1), ph: rand(0, Math.PI * 2),
        angle: rand(0, Math.PI * 2), spin: rand(-0.02, 0.02), alpha: rand(0.3, 0.55),
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }

    function mkHeart() {
      return {
        x: rand(0, W), y: H + 30, size: rand(7, 16),
        speed: rand(0.4, 1.1), sway: rand(0.3, 0.9), ph: rand(0, Math.PI * 2),
        alpha: rand(0.2, 0.45), color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }

    for (var i = 0; i < PCOUNT; i++) { petals.push(mkPetal()); }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.alpha;
      ctx.scale(p.size, p.size);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(0.55, 0.5, 0.7, 1.1, 0, 1.7);
      ctx.bezierCurveTo(-0.7, 1.1, -0.55, 0.5, 0, 0);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }

    function drawHeart(h) {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.globalAlpha = h.alpha;
      var s = h.size;
      ctx.beginPath();
      ctx.moveTo(0, 0.3 * s);
      ctx.bezierCurveTo(0, 0, -0.6 * s, -0.5 * s, -0.6 * s, -1.0 * s);
      ctx.bezierCurveTo(-0.6 * s, -1.4 * s, 0, -1.4 * s, 0, -0.7 * s);
      ctx.bezierCurveTo(0, -1.4 * s, 0.6 * s, -1.4 * s, 0.6 * s, -1.0 * s);
      ctx.bezierCurveTo(0.6 * s, -0.5 * s, 0, 0, 0, 0.3 * s);
      ctx.fillStyle = h.color;
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      var i;

      for (i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.y += p.speed;
        p.ph += 0.02;
        p.x += Math.sin(p.ph) * p.sway * 0.4;
        p.angle += p.spin;
        if (p.y > H + 30) { petals[i] = mkPetal(); petals[i].y = -20; }
        drawPetal(p);
      }

      tick++;
      if (tick % HEART_EVERY === 0) { hearts.push(mkHeart()); }
      for (i = hearts.length - 1; i >= 0; i--) {
        var h = hearts[i];
        h.y -= h.speed;
        h.ph += 0.02;
        h.x += Math.sin(h.ph) * h.sway * 0.5;
        h.alpha -= 0.0018;
        if (h.y < -40 || h.alpha <= 0) { hearts.splice(i, 1); continue; }
        drawHeart(h);
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- Eventos ---------------- */
  if (videoPlay) {
    videoPlay.addEventListener('click', function (e) { e.stopPropagation(); startVideo(); });
  }
  if (videoFrame) {
    videoFrame.addEventListener('click', function () { if (started) { togglePlay(); } });
  }
  if (prevBtn) { prevBtn.addEventListener('click', prev); }
  if (nextBtn) { nextBtn.addEventListener('click', next); }

  document.addEventListener('keydown', function (e) {
    var tag = e.target.tagName;
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(tag)) {
      e.preventDefault();
      if (!started) { startVideo(); } else { togglePlay(); }
    }
  });

  /* ---------------- Init ---------------- */
  initReveals();
  initPetals();
  if (VIDEOS.length) { loadYouTubeAPI(); }
})();
