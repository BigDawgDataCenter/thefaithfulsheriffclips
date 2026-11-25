// The Faithful Sheriff Clips: live status, the Twitch stage, the next-stream countdown,
// the Wanted Board (clips.json written by the clipper on Walley) and the Daily Word.
(function () {
  const C = window.SHERIFF;
  const $ = s => document.querySelector(s);
  const host = location.hostname || 'localhost';
  const twitchUrl = 'https://www.twitch.tv/' + C.twitch;

  /* ---------- The Stage: Twitch player + chat (parent must be this site's own host) ---------- */
  function mountStage() {
    const p = document.createElement('iframe');
    p.className = 'player';
    p.title = 'The Faithful Sheriff live on Twitch';
    p.allowFullscreen = true;
    p.allow = 'autoplay; fullscreen';
    p.src = 'https://player.twitch.tv/?channel=' + C.twitch + '&parent=' + host + '&muted=true&autoplay=true';
    $('#player-wrap').appendChild(p);
    const chat = document.createElement('iframe');
    chat.className = 'chat';
    chat.title = 'Twitch chat';
    chat.src = 'https://www.twitch.tv/embed/' + C.twitch + '/chat?parent=' + host + '&darkpopout';
    $('#chat-wrap').appendChild(chat);
  }

  /* ---------- Live status (decapi.me: small public Twitch lookup) ---------- */
  function liveStatus() {
    const api = path => fetch('https://decapi.me/twitch/' + path + '/' + C.twitch).then(r => r.ok ? r.text() : Promise.reject());
    api('uptime').then(up => {
      const live = !/offline/i.test(up) && /\d/.test(up);
      document.body.classList.toggle('is-live', live);
      $('#pill .pill-label').textContent = live ? 'Live now' : 'Offline';
      $('#stage-tag').textContent = live ? 'Live now' : 'Off air';
      $('#hero-live span').textContent = live ? 'He\'s live: watch now' : 'Follow on Twitch';
      if (live) {
        Promise.all([api('title').catch(() => ''), api('game').catch(() => '')]).then(([title, game]) => {
          const t = title.trim(), g = game.trim();
          if (t) $('#stage-sub').textContent = t + (g ? ' · ' + g : '');
        });
      } else {
        $('#stage-sub').textContent = 'Off air right now. The player shows his latest stream. Follow so Twitch tells you when he goes live.';
      }
    }).catch(() => {});
  }

  /* ---------- Next stream countdown (Mon to Fri, 3 PM Eastern, shown in the viewer's own time) ---------- */
  function zoneParts(d, tz) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    const o = {}; f.formatToParts(d).forEach(p => { o[p.type] = p.value; });
    return o;
  }
  function nextStream(now) {
    const s = C.schedule, wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    for (let add = 0; add < 8; add++) {
      const probe = new Date(now.getTime() + add * 86400000);
      const p = zoneParts(probe, s.tz);
      if (!s.days.includes(wd[p.weekday])) continue;
      // Build the instant for that Eastern date at the start hour, correcting for the zone offset.
      const guess = Date.UTC(+p.year, +p.month - 1, +p.day, s.hour, s.minute);
      const back = zoneParts(new Date(guess), s.tz);
      const offset = Date.UTC(+back.year, +back.month - 1, +back.day, +back.hour, +back.minute) - guess;
      const at = new Date(guess - offset);
      if (at.getTime() + 5 * 3600000 > now.getTime()) return at; // counts as "now" for a 5 h stream
    }
    return null;
  }
  function tick() {
    const now = new Date(), at = nextStream(now);
    if (!at) return;
    const ms = at - now;
    const local = at.toLocaleString([], { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    $('#next-time').textContent = local + ' your time';
    $('#when').textContent = 'Next live: ' + local + ' your time · Mon to Fri, 3 PM ET';
    const cd = $('#countdown');
    if (document.body.classList.contains('is-live')) { cd.innerHTML = '<span class="now">He\'s live right now</span>'; return; }
    if (ms <= 0) { cd.innerHTML = '<span class="now">Any minute now</span>'; return; }
    const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
    const cell = (v, l) => '<span><b>' + String(v).padStart(2, '0') + '</b><small>' + l + '</small></span>';
    cd.innerHTML = (d ? cell(d, 'days') : '') + cell(h, 'hrs') + cell(m, 'min') + cell(sec, 'sec');
  }

  /* ---------- The Wanted Board ---------- */
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ytId = s => /^[\w-]{11}$/.test(s || '') ? s : '';
  let clips = [], filter = 'all';

  function poster(c, i) {
    const id = ytId(c.id);
    if (!id) return '';
    const when = c.date ? new Date(/^\d{4}-\d\d-\d\d$/.test(c.date) ? c.date + 'T12:00' : c.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
    return '<article class="poster" style="--tilt:' + ((i % 5) - 2) * 0.6 + 'deg">' +
      '<span class="p-head">Wanted</span>' +
      '<button class="p-photo" data-play="' + id + '" aria-label="Play: ' + esc(c.title) + '">' +
      '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg">' +
      '<span class="p-play"><svg viewBox="0 0 24 24"><use href="#i-play"/></svg></span></button>' +
      '<small class="p-for">For</small><b class="p-title">' + esc(c.title) + '</b>' +
      '<span class="p-meta">' + esc([c.game, when].filter(Boolean).join(' · ')) + '</span>' +
      '<span class="p-reward">Reward: one share</span>' +
      '<div class="p-acts"><a href="https://www.youtube.com/shorts/' + id + '" target="_blank" rel="noopener">YouTube</a>' +
      '<button data-share="' + id + '" data-title="' + esc(c.title) + '">Share</button></div>' +
      '</article>';
  }

  function renderFilters() {
    const games = [...new Set(clips.map(c => c.game).filter(Boolean))];
    const tabs = ['all'].concat(games);
    $('#filters').innerHTML = tabs.length < 3 ? '' : tabs.map(t =>
      '<button class="chip' + (t === filter ? ' on' : '') + '" role="tab" aria-selected="' + (t === filter) + '" data-f="' + esc(t) + '">' + (t === 'all' ? 'All' : esc(t)) + '</button>').join('');
  }

  function renderBoard() {
    const list = clips.filter(c => filter === 'all' || c.game === filter).slice(0, 12);
    const html = list.map(poster).join('');
    $('#posters').innerHTML = html;
    if (!html && C.clipsChannelId) {
      // Nothing in the feed yet: show the clips channel's uploads playlist instead.
      $('#posters').innerHTML = '<div class="yt-list"><iframe title="Latest clips" loading="lazy" allowfullscreen src="https://www.youtube-nocookie.com/embed/videoseries?list=UU' + C.clipsChannelId.slice(2) + '"></iframe></div>';
    }
    $('#board-empty').hidden = !!$('#posters').innerHTML;
    renderFilters();
  }

  function loadClips() {
    fetch(C.clipsFeed + '?v=' + Math.floor(Date.now() / 600000)).then(r => r.ok ? r.json() : { clips: [] })
      .catch(() => ({ clips: [] }))
      .then(d => { clips = (d.clips || []).filter(c => ytId(c.id)).sort((a, b) => String(b.date).localeCompare(String(a.date))); renderBoard(); });
  }

  document.addEventListener('click', e => {
    const f = e.target.closest('[data-f]');
    if (f) { filter = f.dataset.f; renderBoard(); return; }
    const play = e.target.closest('[data-play]');
    if (play) {
      play.outerHTML = '<div class="p-photo playing"><iframe title="Clip" allow="autoplay; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/' + play.dataset.play + '?autoplay=1&playsinline=1&rel=0"></iframe></div>';
      return;
    }
    const sh = e.target.closest('[data-share]');
    if (sh) {
      const url = 'https://www.youtube.com/shorts/' + sh.dataset.share, title = sh.dataset.title + ' · The Faithful Sheriff';
      if (navigator.share) navigator.share({ title, url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => { sh.textContent = 'Link copied'; setTimeout(() => { sh.textContent = 'Share'; }, 1800); });
    }
  });

  /* ---------- Daily Word (King James Version, public domain) ---------- */
  const VERSES = [
    ['Trust in the LORD with all thine heart; and lean not unto thine own understanding.', 'Proverbs 3:5'],
    ['I can do all things through Christ which strengtheneth me.', 'Philippians 4:13'],
    ['This is the day which the LORD hath made; we will rejoice and be glad in it.', 'Psalm 118:24'],
    ['Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.', 'Joshua 1:9'],
    ['Come unto me, all ye that labour and are heavy laden, and I will give you rest.', 'Matthew 11:28'],
    ['The LORD is my shepherd; I shall not want.', 'Psalm 23:1'],
    ['And let us not be weary in well doing: for in due season we shall reap, if we faint not.', 'Galatians 6:9'],
    ['Let all your things be done with charity.', '1 Corinthians 16:14'],
    ['Be ye kind one to another, tenderhearted, forgiving one another.', 'Ephesians 4:32'],
    ['Thy word is a lamp unto my feet, and a light unto my path.', 'Psalm 119:105'],
    ['Rejoice in the Lord alway: and again I say, Rejoice.', 'Philippians 4:4'],
    ['Casting all your care upon him; for he careth for you.', '1 Peter 5:7'],
    ['The LORD bless thee, and keep thee.', 'Numbers 6:24'],
    ['Pray without ceasing. In every thing give thanks.', '1 Thessalonians 5:17-18'],
    ['Ye are the light of the world. A city that is set on an hill cannot be hid.', 'Matthew 5:14'],
    ['A merry heart doeth good like a medicine.', 'Proverbs 17:22'],
    ['God is our refuge and strength, a very present help in trouble.', 'Psalm 46:1'],
    ['Draw nigh to God, and he will draw nigh to you.', 'James 4:8'],
    ['Thou wilt keep him in perfect peace, whose mind is stayed on thee.', 'Isaiah 26:3'],
    ['And now abideth faith, hope, charity, these three; but the greatest of these is charity.', '1 Corinthians 13:13'],
    ['They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.', 'Isaiah 40:31'],
    ['Let your light so shine before men, that they may see your good works.', 'Matthew 5:16'],
    ['Delight thyself also in the LORD; and he shall give thee the desires of thine heart.', 'Psalm 37:4'],
    ['For God so loved the world, that he gave his only begotten Son.', 'John 3:16'],
    ['Be still, and know that I am God.', 'Psalm 46:10'],
    ['Whatsoever ye do, do it heartily, as to the Lord.', 'Colossians 3:23'],
    ['Peace I leave with you, my peace I give unto you.', 'John 14:27'],
    ['O give thanks unto the LORD; for he is good: for his mercy endureth for ever.', 'Psalm 136:1'],
    ['Love worketh no ill to his neighbour.', 'Romans 13:10'],
    ['The joy of the LORD is your strength.', 'Nehemiah 8:10'],
    ['Seek ye first the kingdom of God, and his righteousness.', 'Matthew 6:33']
  ];
  function dailyWord() {
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    const [text, ref] = VERSES[day % VERSES.length];
    $('#verse p').textContent = '“' + text + '”';
    $('#verse cite').textContent = ref + ' (KJV)';
    const key = 'tfs-talked-' + day;
    const answer = a => {
      $('#word-reply').textContent = a === 'yes' ? 'Love that. Here\'s one more for the road.' : 'Never too late. Here\'s a good place to start.';
      document.querySelectorAll('#word-choice .chip').forEach(b => b.classList.toggle('on', b.dataset.a === a));
      $('.word-card').classList.add('answered');
    };
    try { const saved = localStorage.getItem(key); if (saved) answer(saved); } catch (e) {}
    $('#word-choice').addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      answer(b.dataset.a);
      try { localStorage.setItem(key, b.dataset.a); } catch (e) {}
    });
  }

  /* ---------- Clips channel links follow config ---------- */
  document.querySelectorAll('[data-clips-yt], #yt-link').forEach(a => { a.href = C.clipsYouTube; });

  mountStage();
  liveStatus();
  setInterval(liveStatus, 120000);
  tick();
  setInterval(tick, 1000);
  loadClips();
  dailyWord();
})();
