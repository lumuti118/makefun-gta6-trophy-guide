/* GTA 6 Trophy Guide & Tracker — renders the checklist, roadmap and missables
   from data/trophies.json; progress lives in localStorage, offline only. */
(function () {
  'use strict';
  var STORAGE_KEY = 'gta6-trophy-checklist';
  var trophies = [];
  var earned = {};
  var selectedId = null;
  var spoilerOn = false;

  var listEl = document.getElementById('trophyList');
  var detailEl = document.getElementById('detailPanel');
  var searchBox = document.getElementById('searchBox');
  var gradeFilter = document.getElementById('gradeFilter');
  var kindFilter = document.getElementById('kindFilter');
  var spoilerToggle = document.getElementById('spoilerToggle');
  var countLine = document.getElementById('countLine');
  var progressText = document.getElementById('progressText');
  var progressPct = document.getElementById('progressPct');
  var progressFill = document.getElementById('progressFill');
  var gradeCounts = document.getElementById('gradeCounts');

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) earned = JSON.parse(raw) || {};
    } catch (e) { earned = {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(earned)); } catch (e) {}
  }
  function isEarned(t) { return !!earned[t.id]; }
  function isHiddenFromSpoilers(t) { return spoilerOn && t.hidden && !isEarned(t); }

  function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }

  function trophyRow(t) {
    var li = document.createElement('li');
    li.className = 'trophy' + (isEarned(t) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    li.dataset.id = t.id;
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (box.checked) earned[t.id] = true; else delete earned[t.id];
      saveProgress();
      render();
    });
    var body = document.createElement('div');
    var name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = isHiddenFromSpoilers(t) ? 'Hidden trophy — earn it to reveal' : t.name;
    var desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = isHiddenFromSpoilers(t) ? 'This trophy is hidden on PlayStation until earned.' : t.description;
    var meta = document.createElement('div');
    meta.className = 'trophy-meta';
    var grade = document.createElement('span');
    grade.className = 'badge ' + t.grade;
    grade.textContent = gradeLabel(t.grade);
    meta.appendChild(grade);
    var kind = document.createElement('span');
    kind.className = 'badge kind';
    kind.textContent = t.kind;
    meta.appendChild(kind);
    if (t.missable) {
      var m = document.createElement('span');
      m.className = 'badge missable';
      m.textContent = 'Missable';
      meta.appendChild(m);
    }
    if (t.hidden) {
      var h = document.createElement('span');
      h.className = 'badge hidden';
      h.textContent = 'Hidden';
      meta.appendChild(h);
    }
    body.appendChild(name);
    body.appendChild(desc);
    body.appendChild(meta);
    var right = document.createElement('div');
    right.className = 'trophy-meta';
    var idBadge = document.createElement('span');
    idBadge.className = 'badge';
    idBadge.textContent = '#' + t.id;
    right.appendChild(idBadge);
    li.appendChild(box);
    li.appendChild(body);
    li.appendChild(right);
    li.addEventListener('click', function () { selectTrophy(t.id); });
    return li;
  }

  function renderList() {
    var q = (searchBox.value || '').toLowerCase();
    var g = gradeFilter.value;
    var k = kindFilter.value;
    var shown = trophies.filter(function (t) {
      if (g !== 'all' && t.grade !== g) return false;
      if (k === 'online') return false;
      if (k !== 'all' && t.kind !== k) return false;
      if (q && (t.name + ' ' + t.description).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    listEl.innerHTML = '';
    shown.forEach(function (t) { listEl.appendChild(trophyRow(t)); });
    countLine.textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies' +
      (k === 'online' ? ' — online: 0 trophies at launch' : '');
  }

  function renderProgress() {
    var count = trophies.filter(isEarned).length;
    var total = trophies.length || 55;
    var pct = total ? Math.round((count / total) * 100) : 0;
    progressText.textContent = count + ' / ' + total + ' earned';
    progressPct.textContent = pct + '%';
    progressFill.style.width = pct + '%';
    var grades = ['platinum', 'gold', 'silver', 'bronze'];
    gradeCounts.textContent = grades.map(function (gr) {
      var tot = trophies.filter(function (t) { return t.grade === gr; }).length;
      var got = trophies.filter(function (t) { return t.grade === gr && isEarned(t); }).length;
      return gradeLabel(gr) + ' ' + got + '/' + tot;
    }).join(' · ');
  }

  function selectTrophy(id) {
    selectedId = id;
    renderList();
    renderDetail();
  }

  function renderDetail() {
    var t = null;
    for (var i = 0; i < trophies.length; i++) if (trophies[i].id === selectedId) t = trophies[i];
    if (!t) {
      detailEl.innerHTML = '<p class="detail-empty">Click a trophy to read its full guide, with sources.</p>';
      return;
    }
    detailEl.innerHTML = '';
    var h = document.createElement('h2');
    h.textContent = isHiddenFromSpoilers(t) ? 'Hidden trophy' : t.name;
    var meta = document.createElement('div');
    meta.className = 'trophy-meta';
    var grade = document.createElement('span');
    grade.className = 'badge ' + t.grade;
    grade.textContent = gradeLabel(t.grade);
    meta.appendChild(grade);
    var kind = document.createElement('span');
    kind.className = 'badge kind';
    kind.textContent = t.kind;
    meta.appendChild(kind);
    if (t.missable) {
      var m = document.createElement('span');
      m.className = 'badge missable';
      m.textContent = 'Missable — see Missables tab';
      meta.appendChild(m);
    }
    var desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = isHiddenFromSpoilers(t) ? 'This trophy is hidden on PlayStation until earned. Turn spoiler mode off to reveal it.' : t.description;
    var gh = document.createElement('h3');
    gh.textContent = 'Guide';
    var guide = document.createElement('p');
    guide.textContent = t.guide;
    var sh = document.createElement('h3');
    sh.textContent = 'Sources';
    var src = document.createElement('p');
    src.className = 'sources';
    src.textContent = t.sources.join(', ');
    var status = document.createElement('p');
    status.className = 'sources';
    status.textContent = isEarned(t) ? 'Earned — ticked in your checklist.' : 'Not earned yet — tick the box to mark it earned.';
    detailEl.appendChild(h);
    detailEl.appendChild(meta);
    detailEl.appendChild(desc);
    detailEl.appendChild(gh);
    detailEl.appendChild(guide);
    detailEl.appendChild(sh);
    detailEl.appendChild(src);
    detailEl.appendChild(status);
  }

  function renderRoadmap() {
    var host = document.getElementById('roadmapStages');
    host.innerHTML = '';
    var stages = {};
    trophies.forEach(function (t) {
      var s = t.roadmap.stage;
      if (!stages[s]) stages[s] = { name: t.roadmap.name, items: [] };
      stages[s].items.push(t);
    });
    var notes = {
      1: 'Play the story in order: the opening mission, Chapters 1–4, the named story missions and the final mission. All story trophies are unmissable.',
      2: 'After the story opens up, finish the side-character strands (Andy, Kenton, Billy, Randy, Tyrone, Bret) and 8 Strangers & Freaks strands.',
      3: 'Activities and skills: 250 stunts, 42 Shooting Range golds, 14 drone race wins, 20 race wins, fishing vs Cal, arcade, bowling, 50 challenges. Meditate at Jason\'s house in Chapter 1 — the only missable trophy.',
      4: 'Collectibles: 3 card sets, WAiNK It at 100 locations, 100 vehicles discovered, all 52 areas explored, all 8 garages, 10 Scooter Bros registrations.',
      5: 'Cleanup: $250,000 laundered, $100,000 spent, the odd one-offs, then 100% completion for the second gold trophy.',
      6: 'The platinum pops automatically once the other 54 are earned.'
    };
    Object.keys(stages).sort(function (a, b) { return a - b; }).forEach(function (num) {
      var st = stages[num];
      var div = document.createElement('div');
      div.className = 'stage';
      var h = document.createElement('h3');
      var n = document.createElement('span');
      n.className = 'stage-num';
      n.textContent = num;
      h.appendChild(n);
      h.appendChild(document.createTextNode('Stage ' + num + ' — ' + st.name));
      var meta = document.createElement('p');
      meta.className = 'stage-meta';
      meta.textContent = notes[num] || '';
      var ul = document.createElement('ul');
      st.items.forEach(function (t) {
        var li = document.createElement('li');
        var strong = document.createElement('strong');
        strong.textContent = t.name;
        li.appendChild(strong);
        li.appendChild(document.createTextNode(' — ' + t.description + ' (' + gradeLabel(t.grade) + (t.missable ? ', missable' : '') + ')'));
        ul.appendChild(li);
      });
      div.appendChild(h);
      div.appendChild(meta);
      div.appendChild(ul);
      host.appendChild(div);
    });
  }

  function renderMissables() {
    var host = document.getElementById('missablesList');
    host.innerHTML = '';
    var miss = trophies.filter(function (t) { return t.missable; });
    if (!miss.length) {
      host.innerHTML = '<p>No missable trophies in this list.</p>';
      return;
    }
    miss.forEach(function (t) {
      var div = document.createElement('div');
      div.className = 'missable-card';
      var h = document.createElement('h3');
      h.textContent = t.name + ' — ' + gradeLabel(t.grade);
      var d = document.createElement('p');
      d.textContent = t.description;
      var g = document.createElement('p');
      g.textContent = t.guide;
      var s = document.createElement('p');
      s.className = 'sources';
      s.textContent = 'Sources: ' + t.sources.join(', ');
      var when = document.createElement('p');
      when.innerHTML = '';
      var wb = document.createElement('strong');
      wb.textContent = 'When it can be missed: ';
      when.appendChild(wb);
      when.appendChild(document.createTextNode('the meditation spot at Jason\'s house is only available in Chapter 1. Meditate there before Chapter 1 ends.'));
      div.appendChild(h);
      div.appendChild(d);
      div.appendChild(g);
      div.appendChild(when);
      div.appendChild(s);
      host.appendChild(div);
    });
  }

  function render() { renderList(); renderProgress(); renderDetail(); }

  function switchView(view) {
    document.querySelectorAll('.tab').forEach(function (b) {
      var on = b.dataset.view === view;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.toggle('active', v.id === 'view-' + view);
    });
    try {
      if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    } catch (e) {}
  }

  function applyHash() {
    var h = (location.hash || '').replace('#', '');
    if (h === 'roadmap' || h === 'missables' || h === 'checklist') switchView(h);
    var q = new URLSearchParams(location.search);
    if (q.get('spoiler') === '1') {
      spoilerOn = true;
      spoilerToggle.checked = true;
    }
    if (q.get('grade')) gradeFilter.value = q.get('grade');
    if (q.get('kind')) kindFilter.value = q.get('kind');
  }

  function exportProgress() {
    var data = { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: Object.keys(earned).map(Number) };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var ids = data.earned || data.trophies || data;
        earned = {};
        (Array.isArray(ids) ? ids : []).forEach(function (id) {
          var n = Number(id && id.id ? id.id : id);
          if (n >= 1 && n <= 55) earned[n] = true;
        });
        saveProgress();
        render();
      } catch (e) { alert('Could not read that file — it is not a valid progress export.'); }
    };
    reader.readAsText(file);
  }

  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () { switchView(b.dataset.view); });
  });
  window.addEventListener('hashchange', applyHash);
  searchBox.addEventListener('input', renderList);
  gradeFilter.addEventListener('change', renderList);
  kindFilter.addEventListener('change', renderList);
  spoilerToggle.addEventListener('change', function () {
    spoilerOn = spoilerToggle.checked;
    render();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function (e) {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', function () {
    if (confirm('Clear all earned trophies?')) {
      earned = {};
      saveProgress();
      render();
    }
  });

  loadProgress();
  fetch('data/trophies.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      trophies = data.trophies || data;
      applyHash();
      render();
      renderRoadmap();
      renderMissables();
      if (trophies.length && selectedId === null) selectTrophy(trophies[0].id);
    })
    .catch(function () {
      listEl.innerHTML = '<li class="trophy"><div>Could not load data/trophies.json. Serve app/ over HTTP (node serve.ts) and reload.</div></li>';
    });
})();
