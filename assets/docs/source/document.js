// Adds the shared parts to every <section class="page"> so source files only hold their own content:
// the red header band at the top, and the footer with "Page X of Y" at the bottom.
// It also outlines in red any page whose content runs past the footer, so the problem shows in the PDF.
document.addEventListener('DOMContentLoaded', function () {
  var BRAND = 'Project Based';
  var TAGLINE = 'Non-profit student project and event initiative, Kleve';
  var FOOTER = 'Project Based is an independent non-profit and is not an organisation of any university.';

  var pages = document.querySelectorAll('.page');
  pages.forEach(function (page, i) {
    page.insertAdjacentHTML('afterbegin',
      '<header class="band"><p class="brand">' + BRAND + '</p><p class="tagline">' + TAGLINE + '</p></header>' +
      '<div class="band-edge"></div>');
    page.insertAdjacentHTML('beforeend',
      '<footer class="foot"><span>' + FOOTER + '</span><span>Page ' + (i + 1) + ' of ' + pages.length + '</span></footer>');
  });

  // wait for fonts so the measurement matches the printed layout
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    exportFields(pages);
    pages.forEach(function (page) {
      var body = page.querySelector('.body'), foot = page.querySelector('.foot');
      if (!body || !foot) return;
      var last = body.lastElementChild;
      if (last && last.getBoundingClientRect().bottom > foot.getBoundingClientRect().top - 4) {
        page.classList.add('overflow');
        console.warn('Content runs past the footer on page ' + (Array.prototype.indexOf.call(pages, page) + 1));
      }
    });
  });
});

// Records where the fill-in boxes, tick boxes and signature lines sit (in mm from each page's top left),
// as JSON in <script id="pdf-fields">. build-pdfs.ps1 reads it and add-fields.py turns each one into a PDF form field,
// so the PDF can be filled in on screen. Nothing to maintain here: any .box, tick-list item or .sign line is picked up.
function exportFields(pages) {
  var MM = 25.4 / 96, fields = [], used = {};
  function label(el) { return (el.textContent || '').replace(/\s+/g, ' ').replace(/[:.]+\s*$/, '').trim().slice(0, 80) || 'Field'; }
  function name(base) { var n = base.replace(/\./g, ''), i = 2; while (used[n]) n = base + ' ' + i++; used[n] = 1; return n; }
  function add(page, i, type, el, text, box) {
    var p = page.getBoundingClientRect(), r = box || el.getBoundingClientRect();
    fields.push({ page: i, type: type, name: name(text), multiline: type === 'text' && r.height > 30,
      x: (r.left - p.left) * MM, y: (r.top - p.top) * MM, w: r.width * MM, h: r.height * MM });
  }
  pages.forEach(function (page, i) {
    page.querySelectorAll('.fieldrow').forEach(function (row) { add(page, i, 'text', row.querySelector('.box'), label(row.firstElementChild)); });
    page.querySelectorAll('.body ul:not(.bullets) > li').forEach(function (li) {
      var r = li.getBoundingClientRect(), s = 4 / MM; // the 4mm tick box drawn by li::before
      add(page, i, 'check', li, label(li), { left: r.left, top: r.top + (r.height - s) / 2, width: s, height: s });
      var box = li.querySelector('.box');
      if (box) add(page, i, 'text', box, label(li) + ' (details)');
    });
    page.querySelectorAll('.detail, .comments').forEach(function (d) { add(page, i, 'text', d.querySelector('.box'), label(d.firstElementChild)); });
    page.querySelectorAll('.body > .box').forEach(function (box) {
      var h = box.previousElementSibling; add(page, i, 'text', box, h ? label(h) : 'Notes');
    });
    // signature lines: a field sitting just above each line
    page.querySelectorAll('.sign span').forEach(function (s) {
      var r = s.getBoundingClientRect(), h = 7 / MM;
      add(page, i, 'text', s, label(s), { left: r.left, top: r.top - h - 1, width: r.width, height: h });
    });
  });
  var out = document.createElement('script');
  out.type = 'application/json'; out.id = 'pdf-fields'; out.textContent = JSON.stringify(fields);
  document.body.appendChild(out);
}
