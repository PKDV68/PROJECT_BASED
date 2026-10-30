// Shared behaviour for every page. Each block checks for its elements, so pages only get what they contain.

// sponsor ribbon pause / play (home)
(function () {
  var box = document.getElementById('ribbon'), btn = document.getElementById('ribbon-toggle');
  if (!box || !btn) return;
  btn.addEventListener('click', function () {
    var paused = box.classList.toggle('paused');
    btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    btn.textContent = paused ? 'Play' : 'Pause';
  });
})();

// fields carousel (home): cyclic, the middle card is active.
// Move with a click on a side card, a horizontal swipe or trackpad scroll, or the arrow keys.
(function () {
  var root = document.getElementById('fields-carousel');
  if (!root) return;
  var cards = Array.prototype.slice.call(root.querySelectorAll('.fcard'));
  var real = cards.length;
  // five cards are on show (middle, two sides, two half-fallen outer ones), so a small deck is doubled to fill every slot.
  // Copies only ever show their back until they reach the middle, where they are the same topic as the original.
  if (real && real < 6) {
    cards.slice().forEach(function (card) {
      var copy = card.cloneNode(true);
      copy.setAttribute('data-copy', '');
      card.parentNode.appendChild(copy);
      cards.push(copy);
    });
  }
  var n = cards.length, cur = 0, dir = 1;

  cards.forEach(function (card, i) {
    card.setAttribute('aria-label', (i % real + 1) + ' of ' + real);
    card.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); return; } // a swipe that ends on a link should not follow it
      if (i !== cur) go(i);
    });
  });
  function render() {
    cards.forEach(function (card, i) {
      var o = ((i - cur) % n + n) % n;
      if (o > n / 2 || (o === n / 2 && dir < 0)) o -= n;
      card.style.setProperty('--o', o);
      var pos = o === 0 ? 'active' : Math.abs(o) === 1 ? 'side' : Math.abs(o) === 2 ? 'fallen' : 'hidden';
      card.setAttribute('data-pos', pos);
      card.setAttribute('aria-hidden', pos === 'active' ? 'false' : 'true');
      card.querySelectorAll('a').forEach(function (a) { a.tabIndex = pos === 'active' ? 0 : -1; });
    });
  }
  function go(i) { dir = ((i - cur + n) % n) <= n / 2 ? 1 : -1; cur = (i + n) % n; render(); }
  function step(d) { dir = d; cur = (cur + d + n) % n; render(); }

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
  });

  // horizontal trackpad / shift+wheel scrolling flips cards; vertical scrolling still scrolls the page
  var stage = root.querySelector('.stage'), acc = 0, locked = false;
  stage.addEventListener('wheel', function (e) {
    var dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
    e.preventDefault();
    if (locked) return;
    acc += dx;
    if (Math.abs(acc) > 40) {
      step(acc > 0 ? 1 : -1); acc = 0; locked = true;
      setTimeout(function () { locked = false; }, 550);
    }
  }, { passive: false });

  // swipe / drag
  var x0 = null, dragged = false;
  stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; dragged = false; });
  addEventListener('pointerup', function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { dragged = true; step(dx < 0 ? 1 : -1); setTimeout(function () { dragged = false; }, 0); }
  });

  render();
})();

// topic page tabs (fields/*.html): Publications, Upcoming, PDFs, Sponsors & Donations, Get in contact.
// The URL hash picks the tab, so links like fields/data-ml.html#upcoming open the right one.
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  if (!tabs.length) return;
  var ids = tabs.map(function (t) { return t.getAttribute('aria-controls'); });

  function show(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
  }
  function fromHash() { var id = location.hash.slice(1); return ids.indexOf(id) > -1 ? id : null; }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      var id = t.getAttribute('aria-controls');
      show(id);
      history.replaceState(null, '', '#' + id);
    });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var id = ids[(i + d + ids.length) % ids.length];
      show(id, true);
      history.replaceState(null, '', '#' + id);
    });
  });
  addEventListener('hashchange', function () { var id = fromHash(); if (id) show(id); });
  show(fromHash() || ids[0]);
})();

// form status after a PHP handler redirects back (support form on downloads, contact form on field pages)
(function () {
  var box = document.getElementById('form-status');
  if (!box) return;
  var q = new URLSearchParams(location.search);
  var errors = {
    missing: 'Please fill in all required fields with a valid email address.',
    consent: 'Please agree to being contacted so we can reply.',
    server: 'Something went wrong on our side. Please try again or email us directly.'
  };
  if (q.get('sent') === '1') {
    box.textContent = 'Thank you. Your message has been sent and we will be in touch soon.';
    box.className = 'form-status ok';
  } else if (q.get('error')) {
    box.textContent = errors[q.get('error')] || errors.server;
    box.className = 'form-status err';
  } else {
    return;
  }
  box.hidden = false;
})();

// footer sign-up status after php/updates-form.php redirects back (?subscribed=1 or ?subscribe_error=...)
(function () {
  var box = document.getElementById('foot-status');
  if (!box) return;
  var q = new URLSearchParams(location.search);
  if (q.get('subscribed') === '1') {
    box.textContent = 'Thank you, you are signed up. We will email you when there is news about the first event.';
    box.className = 'foot-status ok';
  } else if (q.get('subscribe_error')) {
    box.textContent = q.get('subscribe_error') === 'missing'
      ? 'Please enter a valid email address.'
      : 'Something went wrong on our side. Please try again or email contact@projectbased.de.';
    box.className = 'foot-status err';
  } else {
    return;
  }
  box.hidden = false;
})();

(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('.nav');
  var home = document.querySelector('section.home');
  var photo = document.querySelector('.photo-run .photo'), mission = document.getElementById('mission');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
      if (photo && home && mission) {
        // the photo starts halfway down Mission; its top fade shortens as Why us scrolls up, so more of the photo shows
        var top = mission.offsetHeight / 2, r = home.getBoundingClientRect();
        var open = reduce ? 0.5 : Math.max(0, Math.min(1, 1 - r.top / innerHeight));
        photo.style.setProperty('--photo-top', top + 'px');
        photo.style.setProperty('--fade', (top + parseFloat(getComputedStyle(home).paddingTop) * 0.9) * (1 - 0.5 * open) + 'px');
        if (!reduce) {
          var t = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          photo.style.setProperty('--py', Math.max(-1, Math.min(1, t)) * -40 + 'px');
        }
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  if (!('IntersectionObserver' in window)) return;

  // active nav link for in-page sections (home only; sub-pages mark themselves with aria-current="page")
  var links = {};
  document.querySelectorAll('.nav li a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var navIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var a = links[e.target.id]; if (!a) return;
      if (e.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });

  if (reduce) return;

  // reveal on scroll (only for things below the first screen)
  var sel = 'main section:not(.hero):not(.page-head) .label, main section:not(.hero):not(.page-head) h2, main section:not(.hero):not(.page-head) .lead, .split .body > *, .row, .carousel, .bento > div, .team > div, .formats, .note, .teaser-steps li, .tier, .sponsor-cta, .phase, .facts li, .files, .form, .support-copy > *';
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  var groups = new Map();
  document.querySelectorAll(sel).forEach(function (el) {
    if (el.getBoundingClientRect().top < innerHeight) return;
    var parent = el.parentElement, n = groups.get(parent) || 0; groups.set(parent, n + 1);
    el.style.setProperty('--d', Math.min(n, 6) * 0.08 + 's');
    el.classList.add('rv'); io.observe(el);
  });

  // count-up for the company number
  var stat = document.querySelector('.stat strong');
  if (stat) {
    var target = 10270, done = false;
    new IntersectionObserver(function (es, o) {
      if (done || !es[0].isIntersecting) return; done = true; o.disconnect();
      var t0 = performance.now(), dur = 1800;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
        stat.textContent = '~' + v.toLocaleString('en-US');
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 }).observe(stat);
  }
})();
