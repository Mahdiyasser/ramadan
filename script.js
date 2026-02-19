/* ═══════════════════════════════════════════════════════════════
   رمضان ١٤٤٧ — SCRIPT.JS
   Full Ramadan companion app
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── CONSTANTS ────────────────────────────────────────────────────
const RAMADAN_START = new Date('2026-02-19T00:00:00');
const RAMADAN_DAYS  = 30;

const CITIES = [
  { name: 'القاهرة',           query: 'cairo,egypt' },
  { name: 'الإسكندرية',       query: 'alexandria,egypt' },
  { name: 'الجيزة',           query: 'giza,egypt' },
  { name: 'الأقصر',           query: 'luxor,egypt' },
  { name: 'أسوان',            query: 'aswan,egypt' },
  { name: 'المنصورة',         query: 'mansoura,egypt' },
  { name: 'مكة المكرمة',      query: 'mecca,saudi arabia' },
  { name: 'المدينة المنورة',  query: 'medina,saudi arabia' },
  { name: 'الرياض',           query: 'riyadh,saudi arabia' },
  { name: 'جدة',              query: 'jeddah,saudi arabia' },
  { name: 'الدمام',           query: 'dammam,saudi arabia' },
  { name: 'دبي',              query: 'dubai,uae' },
  { name: 'أبوظبي',           query: 'abu dhabi,uae' },
  { name: 'الشارقة',          query: 'sharjah,uae' },
  { name: 'الكويت',           query: 'kuwait city,kuwait' },
  { name: 'الدوحة',           query: 'doha,qatar' },
  { name: 'المنامة',          query: 'manama,bahrain' },
  { name: 'مسقط',             query: 'muscat,oman' },
  { name: 'عمّان',            query: 'amman,jordan' },
  { name: 'بيروت',            query: 'beirut,lebanon' },
  { name: 'دمشق',             query: 'damascus,syria' },
  { name: 'بغداد',            query: 'baghdad,iraq' },
  { name: 'صنعاء',            query: 'sanaa,yemen' },
  { name: 'الخرطوم',          query: 'khartoum,sudan' },
  { name: 'تونس',             query: 'tunis,tunisia' },
  { name: 'الجزائر',          query: 'algiers,algeria' },
  { name: 'الرباط',           query: 'rabat,morocco' },
  { name: 'الدار البيضاء',    query: 'casablanca,morocco' },
  { name: 'طرابلس',           query: 'tripoli,libya' },
  { name: 'إسطنبول',          query: 'istanbul,turkey' },
  { name: 'أنقرة',            query: 'ankara,turkey' },
  { name: 'كراتشي',           query: 'karachi,pakistan' },
  { name: 'لاهور',            query: 'lahore,pakistan' },
  { name: 'إسلام آباد',       query: 'islamabad,pakistan' },
  { name: 'ماليزيا KL',       query: 'kuala lumpur,malaysia' },
  { name: 'جاكرتا',           query: 'jakarta,indonesia' },
  { name: 'لندن',             query: 'london,uk' },
  { name: 'باريس',            query: 'paris,france' },
  { name: 'برلين',            query: 'berlin,germany' },
  { name: 'نيويورك',          query: 'new york,usa' },
  { name: 'لوس أنجلوس',       query: 'los angeles,usa' },
  { name: 'تورنتو',           query: 'toronto,canada' },
];

const ARABIC_NUMERALS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const ARABIC_MONTHS   = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                          'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const PRAYER_NAMES    = { fajr: 'الفجر', shurooq: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };

// ── HELPERS ──────────────────────────────────────────────────────

function toArabicNumerals(n) {
  return String(n).replace(/\d/g, d => ARABIC_NUMERALS[d]);
}

function formatArabicDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${toArabicNumerals(d.getDate())} ${ARABIC_MONTHS[d.getMonth()]} ${toArabicNumerals(d.getFullYear())}`;
}

function getRamadanDay(date = new Date()) {
  const start = new Date('2026-02-19T00:00:00');
  const diff  = Math.floor((date - start) / (1000 * 60 * 60 * 24));
  if (diff < 0 || diff >= RAMADAN_DAYS) return null;
  return diff + 1;
}

function parsePrayerTime(timeStr) {
  // "5:07 am" or "12:14 pm"
  if (!timeStr) return null;
  const [time, meridiem] = timeStr.split(' ');
  let [hours, minutes]   = time.split(':').map(Number);
  if (meridiem === 'pm' && hours !== 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours  = 0;
  return { hours, minutes };
}

function formatTo12Ar(timeStr) {
  const p = parsePrayerTime(timeStr);
  if (!p) return '—';
  const h   = p.hours % 12 || 12;
  const m   = String(p.minutes).padStart(2, '0');
  const mer = p.hours < 12 ? 'ص' : 'م';
  return `${toArabicNumerals(h)}:${toArabicNumerals(m)} ${mer}`;
}

function prayerToMinutes(timeStr) {
  const p = parsePrayerTime(timeStr);
  if (!p) return null;
  return p.hours * 60 + p.minutes;
}

function $id(id) { return document.getElementById(id); }

// LocalStorage helpers
const LS = {
  get: (key, def = null) => {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
};

// ── STATE ────────────────────────────────────────────────────────
const state = {
  todayDay:       null,
  viewDay:        null,   // which day we're viewing in content section
  hadiths:        [],
  quranSchedule:  [],
  todos:          [],
  notesData:      null,
  prayerTimes:    null,
  selectedCity:   null,
  tasksCompleted: {},   // { "day-1": [0, 2, 3], ... }
  juzCompleted:   [],   // [1, 5, 12, ...]
  tasbih: {
    count:   0,
    total:   0,
    rounds:  0,
    dhikr:   'سبحان الله',
    max:     33,
  },
  totalPoints:    0,
};

// ── DATA LOADING ─────────────────────────────────────────────────

async function loadData() {
  try {
    const [hadiths, quran, todos, notes] = await Promise.all([
      fetch('./data/hadiths.json').then(r => r.json()),
      fetch('./data/quran.json').then(r => r.json()),
      fetch('./data/todo.json').then(r => r.json()),
      fetch('./data/notes.json').then(r => r.json()),
    ]);

    state.hadiths       = hadiths;
    state.quranSchedule = quran.ramadan_daily_schedule || [];
    state.todos         = todos.ramadan_todos || todos || [];
    state.notesData     = notes;

    return true;
  } catch (err) {
    console.warn('Could not load data files. Using fallbacks.', err);
    return false;
  }
}

// ── INIT ─────────────────────────────────────────────────────────

async function init() {
  // Determine today's Ramadan day
  state.todayDay = getRamadanDay() ?? 1;
  state.viewDay  = state.todayDay;

  // Load persisted state
  state.tasksCompleted = LS.get('r1447_tasks', {});
  state.juzCompleted   = LS.get('r1447_juz',   []);
  state.tasbih         = LS.get('r1447_tasbih', state.tasbih);
  state.selectedCity   = LS.get('r1447_city',   null);
  state.totalPoints    = LS.get('r1447_points', 0);

  // Load JSON data
  await loadData();

  // Render everything
  renderHeader();
  renderToday();
  renderDailyContent(state.viewDay);
  renderCalendar();
  renderTracker();
  renderTasbih();
  renderCityChooser();

  // If city already saved, load prayer times
  if (state.selectedCity) {
    showPrayerDisplay();
    fetchPrayerTimes(state.selectedCity.query);
  }

  // Live clock
  updateClock();
  setInterval(updateClock, 1000);

  // Countdown
  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Bottom nav
  setupNavigation();

  // Scroll spy for nav highlighting
  setupScrollSpy();
}

// ── CLOCK ────────────────────────────────────────────────────────

function updateClock() {
  const now  = new Date();
  const h    = toArabicNumerals(String(now.getHours()).padStart(2, '0'));
  const m    = toArabicNumerals(String(now.getMinutes()).padStart(2, '0'));
  const s    = toArabicNumerals(String(now.getSeconds()).padStart(2, '0'));
  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const clock = $id('live-clock');
  if (clock) clock.textContent = `${days[now.getDay()]} — ${h}:${m}:${s}`;
}

// ── TODAY SECTION ────────────────────────────────────────────────

function renderHeader() {
  // nothing extra needed
}

function renderToday() {
  const day  = state.todayDay;
  const note = state.notesData?.days?.[day - 1];
  if (!note) return;

  // Special / Qadr banners
  if (note.special_occasion) {
    const sb = $id('special-banner');
    sb.textContent = note.special_occasion;
    sb.classList.remove('hidden');
  }

  if (note.is_laylat_al_qadr_candidate) {
    $id('qadr-banner').classList.remove('hidden');
  }

  // Day card
  $id('today-day-num').textContent  = toArabicNumerals(day);
  $id('today-hijri').textContent    = note.hijri_day;
  $id('today-gregorian').textContent = formatArabicDate(note.date);

  const ashrBadge = $id('today-ashr-badge');
  ashrBadge.textContent = note.ashr;
  const ashrClass = getAshrClass(note.ashr);
  ashrBadge.classList.add(ashrClass);

  $id('today-ashr-theme-text').textContent = note.ashr_theme;
  $id('today-theme-text').textContent      = note.theme;

  // Progress
  const pct = Math.min((day / RAMADAN_DAYS) * 100, 100);
  $id('progress-fill').style.width = pct + '%';
  $id('progress-label').textContent = `اليوم ${toArabicNumerals(day)} من ${toArabicNumerals(RAMADAN_DAYS)}`;

  // Stats
  computeStats();
}

function getAshrClass(ashr) {
  if (ashr.includes('الأولى'))  return 'mercy';
  if (ashr.includes('الثانية')) return 'forgiveness';
  return 'freedom';
}

function computeStats() {
  // Total points from tasks
  let pts  = 0;
  let days = 0;
  const todos = state.todos;

  for (const dayTodo of todos) {
    const key      = `day-${dayTodo.ramadan_day}`;
    const done     = state.tasksCompleted[key] || [];
    const dayPts   = done.reduce((sum, i) => {
      const task = dayTodo.tasks?.[i];
      return sum + (task?.points || 0);
    }, 0);
    pts += dayPts;
    if (done.length === (dayTodo.tasks?.length || 0) && dayTodo.tasks?.length > 0) days++;
  }

  state.totalPoints = pts;
  LS.set('r1447_points', pts);

  $id('stat-points').textContent  = toArabicNumerals(pts);
  $id('stat-days').textContent    = toArabicNumerals(days);
  $id('stat-juz').textContent     = toArabicNumerals(state.juzCompleted.length);
  $id('stat-tasbih').textContent  = toArabicNumerals(state.tasbih.total);
}

// ── PRAYER TIMES ─────────────────────────────────────────────────

function renderCityChooser() {
  const list = $id('cities-list');
  list.innerHTML = '';

  const search = ($id('city-search-input').value || '').trim();

  const filtered = search
    ? CITIES.filter(c => c.name.includes(search))
    : CITIES;

  filtered.forEach(city => {
    const btn = document.createElement('button');
    btn.className    = 'city-option';
    btn.textContent  = city.name;
    btn.setAttribute('role', 'option');
    btn.addEventListener('click', () => selectCity(city));
    list.appendChild(btn);
  });
}

function selectCity(city) {
  state.selectedCity = city;
  LS.set('r1447_city', city);
  showPrayerDisplay();
  fetchPrayerTimes(city.query);
}

function showPrayerDisplay() {
  $id('city-chooser').classList.add('hidden');
  $id('prayer-display').classList.remove('hidden');

  const city = state.selectedCity;
  if (city) $id('prayer-city-label').textContent = city.name;
}

// JSONP callback — global so the injected <script> can call it
window.processPrayerData = function(data) {
  $id('prayer-loading').classList.add('hidden');

  if (data.status_code !== 1 || !data.items?.length) {
    $id('prayer-error').classList.remove('hidden');
    return;
  }

  const times    = data.items[0];
  const cacheKey = `r1447_prayer_${state.selectedCity?.query || ''}`;
  LS.set(cacheKey, times);
  LS.set(cacheKey + '_date', new Date().toDateString());
  state.prayerTimes = times;

  $id('prayer-cards-grid').classList.remove('hidden');
  $id('prayer-error').classList.add('hidden');
  displayPrayerTimes(times);
};

function fetchPrayerTimes(cityQuery) {
  const cacheKey  = `r1447_prayer_${cityQuery}`;
  const cacheDate = LS.get(cacheKey + '_date', null);
  const today     = new Date().toDateString();

  $id('prayer-loading').classList.remove('hidden');
  $id('prayer-cards-grid').classList.add('hidden');

  // Use same-day cache
  if (cacheDate === today) {
    const cached = LS.get(cacheKey, null);
    if (cached) {
      $id('prayer-loading').classList.add('hidden');
      $id('prayer-cards-grid').classList.remove('hidden');
      state.prayerTimes = cached;
      displayPrayerTimes(cached);
      return;
    }
  }

  // JSONP — no CORS restriction, query kept exactly as defined in CITIES
  const old = document.getElementById('_prayer_jsonp');
  if (old) old.remove();

  const script = document.createElement('script');
  script.id    = '_prayer_jsonp';
  script.src   = `https://muslimsalat.com/${cityQuery}/daily.json?key=API_KEY&jsoncallback=processPrayerData`;
  script.onerror = () => {
    $id('prayer-loading').classList.add('hidden');
    $id('prayer-error').classList.remove('hidden');
  };
  document.body.appendChild(script);
}

function displayPrayerTimes(times) {
  $id('pt-fajr').textContent    = formatTo12Ar(times.fajr);
  $id('pt-shurooq').textContent = formatTo12Ar(times.shurooq);
  $id('pt-dhuhr').textContent   = formatTo12Ar(times.dhuhr);
  $id('pt-asr').textContent     = formatTo12Ar(times.asr);
  $id('pt-maghrib').textContent = formatTo12Ar(times.maghrib);
  $id('pt-isha').textContent    = formatTo12Ar(times.isha);

  $id('iftar-display-time').textContent  = formatTo12Ar(times.maghrib);
  $id('suhoor-display-time').textContent = formatTo12Ar(times.fajr);

  updateCountdown();
}

function updateCountdown() {
  if (!state.prayerTimes) return;
  const times = state.prayerTimes;

  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  const prayers = ['fajr', 'shurooq', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerMins = prayers.map(p => prayerToMinutes(times[p]));

  // Clear previous next/past highlights
  document.querySelectorAll('.prayer-card').forEach(el => {
    el.classList.remove('is-next', 'is-past');
  });

  let nextIndex  = -1;
  let nextMinsMid = 0;

  for (let i = 0; i < prayers.length; i++) {
    const card = document.querySelector(`[data-prayer="${prayers[i]}"]`);
    if (prayerMins[i] <= nowMins) {
      card?.classList.add('is-past');
    } else {
      if (nextIndex === -1) {
        nextIndex   = i;
        nextMinsMid = prayerMins[i];
        card?.classList.add('is-next');
      }
    }
  }

  // If all passed, next is fajr tomorrow
  if (nextIndex === -1) {
    nextIndex   = 0;
    nextMinsMid = prayerMins[0] + 24 * 60;
    const fajrCard = document.querySelector('[data-prayer="fajr"]');
    fajrCard?.classList.remove('is-past');
    fajrCard?.classList.add('is-next');
  }

  // Calculate seconds until next prayer
  const diffMins = nextMinsMid - nowMins;
  const totalSec = Math.floor(diffMins * 60);
  const h   = Math.floor(totalSec / 3600);
  const m   = Math.floor((totalSec % 3600) / 60);
  const s   = totalSec % 60;

  const pad = n => String(n).padStart(2, '0');
  const hAr = toArabicNumerals(pad(h));
  const mAr = toArabicNumerals(pad(m));
  const sAr = toArabicNumerals(pad(s));

  const prayerName = PRAYER_NAMES[prayers[nextIndex]];

  $id('npw-prayer-name').textContent = prayerName;
  $id('npw-countdown').textContent   = `${hAr}:${mAr}:${sAr}`;
  $id('npw-athan-time').textContent  = formatTo12Ar(times[prayers[nextIndex]]);
}

// Change city button
document.addEventListener('DOMContentLoaded', () => {
  const changeCityBtn = $id('change-city-btn');
  if (changeCityBtn) {
    changeCityBtn.addEventListener('click', () => {
      state.selectedCity = null;
      LS.set('r1447_city', null);
      $id('prayer-display').classList.add('hidden');
      $id('city-chooser').classList.remove('hidden');
    });
  }

  // City search input
  const cityInput = $id('city-search-input');
  if (cityInput) {
    cityInput.addEventListener('input', renderCityChooser);
  }
});

// ── DAILY CONTENT ────────────────────────────────────────────────

function renderDailyContent(dayNum) {
  state.viewDay = dayNum;

  const idx     = dayNum - 1;
  const hadith  = state.hadiths?.[idx];
  const quran   = state.quranSchedule?.[idx];
  const todo    = state.todos?.[idx];
  const note    = state.notesData?.days?.[idx];

  // Navigator
  $id('nav-day-num').textContent = `اليوم ${toArabicNumerals(dayNum)}`;
  $id('nav-hijri').textContent   = note?.hijri_day || '';

  // Hadith
  if (hadith) {
    $id('h-theme-badge').textContent = hadith.theme || '';
    $id('h-text').textContent        = hadith.hadith || '';
    $id('h-narrator').textContent    = hadith.narrator || '';
    $id('h-source').textContent      = hadith.source || '';
    $id('h-reference').textContent   = hadith.reference || '';
    $id('h-grade').textContent       = hadith.grade || '';
    $id('h-note').textContent        = hadith.note || '';
  }

  // Quran
  if (quran) {
    renderQuranTab(quran);
  }

  // Tasks
  if (todo) {
    renderTasksTab(todo);
  }
}

// ── QURAN TAB ────────────────────────────────────────────────────

function renderQuranTab(quran) {
  const one = quran.one_khatmah;

  if (one) {
    $id('juz-num-display').textContent  = toArabicNumerals(one.juz);
    $id('juz-name-display').textContent = one.juz_name || '';
    $id('juz-pages-display').textContent = `صفحات ${toArabicNumerals(one.page_count)} (${one.pages})`;
    $id('juz-from-display').textContent  = one.from || '';
    $id('juz-to-display').textContent    = one.to || '';

    // Sessions
    const sessContainer = $id('sessions-container');
    sessContainer.innerHTML = '';
    (one.sessions || []).forEach(s => {
      const item = document.createElement('div');
      item.className = 'session-item';
      item.innerHTML = `
        <span class="session-time">${s.time}</span>
        <span class="session-pages">${toArabicNumerals(s.pages)} صفحات</span>`;
      sessContainer.appendChild(item);
    });

    // Mark as read button
    const btn    = $id('mark-juz-read-btn');
    const juzNum = one.juz;
    const isDone = state.juzCompleted.includes(juzNum);
    updateMarkJuzBtn(btn, isDone, juzNum);

    btn.onclick = () => {
      const nowDone = state.juzCompleted.includes(juzNum);
      if (nowDone) {
        state.juzCompleted = state.juzCompleted.filter(j => j !== juzNum);
      } else {
        state.juzCompleted.push(juzNum);
      }
      LS.set('r1447_juz', state.juzCompleted);
      updateMarkJuzBtn(btn, !nowDone, juzNum);
      renderTracker();
      computeStats();
    };
  }

  // Two khatm plan
  const two     = quran.two_khatmah;
  const twoList = $id('plan-two-list');
  twoList.innerHTML = '';
  if (two?.juz_numbers) {
    two.juz_numbers.forEach(jNum => renderMultiJuzItem(twoList, jNum));
  }

  // Three khatm plan
  const three     = quran.three_khatmah;
  const threeList = $id('plan-three-list');
  threeList.innerHTML = '';
  if (three?.juz_numbers) {
    three.juz_numbers.forEach(jNum => renderMultiJuzItem(threeList, jNum));
  }
}

function renderMultiJuzItem(container, juzNum) {
  const item = document.createElement('div');
  item.className = 'multi-juz-item';
  item.innerHTML = `
    <span class="mji-num">${toArabicNumerals(juzNum)}</span>
    <div>
      <div class="mji-name">الجزء ${toArabicNumerals(juzNum)}</div>
      <div class="mji-pages">${toArabicNumerals(20)} صفحة تقريباً</div>
    </div>`;
  container.appendChild(item);
}

function updateMarkJuzBtn(btn, isDone, juzNum) {
  if (isDone) {
    btn.classList.add('marked');
    $id('mark-juz-icon').textContent = '✓';
    $id('mark-juz-text').textContent = `الجزء ${toArabicNumerals(juzNum)} — تم القراءة ✓`;
  } else {
    btn.classList.remove('marked');
    $id('mark-juz-icon').textContent = '☐';
    $id('mark-juz-text').textContent = `علّم الجزء ${toArabicNumerals(juzNum)} كمقروء`;
  }
}

// ── TASKS TAB ────────────────────────────────────────────────────

function renderTasksTab(todo) {
  $id('tasks-day-note').textContent = todo.theme_note || '';

  const key        = `day-${todo.ramadan_day}`;
  const completed  = state.tasksCompleted[key] || [];
  const tasks      = todo.tasks || [];
  const totalPts   = todo.total_points_today || 0;
  const earnedPts  = completed.reduce((sum, i) => sum + (tasks[i]?.points || 0), 0);

  $id('tasks-earned').textContent = toArabicNumerals(earnedPts);
  $id('tasks-total').textContent  = toArabicNumerals(totalPts);

  const pct = totalPts > 0 ? (earnedPts / totalPts) * 100 : 0;
  $id('tasks-progress-fill').style.width = pct + '%';

  const list = $id('tasks-list');
  list.innerHTML = '';

  tasks.forEach((task, i) => {
    const isDone    = completed.includes(i);
    const diffClass = getDifficultyClass(task.difficulty);

    const item      = document.createElement('div');
    item.className  = `task-item${isDone ? ' completed' : ''}`;
    item.innerHTML  = `
      <div class="task-check">${isDone ? '✓' : ''}</div>
      <div class="task-body">
        <div class="task-text">${task.task}</div>
        <div class="task-why">${task.why || ''}</div>
        <div class="task-meta">
          <span class="task-difficulty ${diffClass}">${task.difficulty}</span>
          <span class="task-points-badge">+${toArabicNumerals(task.points)} نقطة</span>
        </div>
      </div>`;

    item.addEventListener('click', () => toggleTask(todo.ramadan_day, i, tasks, totalPts));
    list.appendChild(item);
  });
}

function getDifficultyClass(diff) {
  if (diff === 'سهل جداً') return 'diff-easy';
  if (diff === 'متوسط')    return 'diff-medium';
  if (diff === 'صعب')      return 'diff-hard';
  if (diff === 'تحدي')     return 'diff-challenge';
  return 'diff-medium';
}

function toggleTask(dayNum, taskIndex, tasks, totalPts) {
  const key      = `day-${dayNum}`;
  const completed = [...(state.tasksCompleted[key] || [])];
  const idx       = completed.indexOf(taskIndex);

  if (idx > -1) {
    completed.splice(idx, 1);
  } else {
    completed.push(taskIndex);
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
  }

  state.tasksCompleted[key] = completed;
  LS.set('r1447_tasks', state.tasksCompleted);

  const todo = state.todos?.[dayNum - 1];
  if (todo) {
    renderTasksTab(todo);
  }
  computeStats();
}

// ── TABS ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Content tabs
  document.querySelectorAll('.ctab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.ctab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.ctab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      $id(`tab-${tab}`)?.classList.add('active');
    });
  });

  // Quran plan tabs
  document.querySelectorAll('.kp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      document.querySelectorAll('.kp-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.kp-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $id(`plan-${plan}`)?.classList.add('active');
    });
  });

  // Day navigation
  $id('prev-day-btn')?.addEventListener('click', () => {
    if (state.viewDay > 1) {
      renderDailyContent(state.viewDay - 1);
    }
  });

  $id('next-day-btn')?.addEventListener('click', () => {
    if (state.viewDay < RAMADAN_DAYS) {
      renderDailyContent(state.viewDay + 1);
    }
  });
});

// ── CALENDAR ─────────────────────────────────────────────────────

function renderCalendar() {
  const grid = $id('cal-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (let d = 1; d <= RAMADAN_DAYS; d++) {
    const note  = state.notesData?.days?.[d - 1];
    const ashr  = getAshrClass(note?.ashr || '');
    const today = state.todayDay === d;
    const past  = d < state.todayDay;
    const qadr  = note?.is_laylat_al_qadr_candidate;

    const cell   = document.createElement('div');
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `اليوم ${d} من رمضان`);
    cell.className = `cal-day-cell ${ashr}${today ? ' is-today' : ''}${past ? ' is-past' : ''}${qadr ? ' is-qadr' : ''}`;

    const dateStr = note?.date || '';
    const shortDate = dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '';

    cell.innerHTML = `
      <div class="cdc-num">${toArabicNumerals(d)}</div>
      <div class="cdc-date">${shortDate}</div>
      <div class="cdc-theme">${note?.theme || ''}</div>`;

    cell.addEventListener('click', () => {
      // Jump to content section and load that day
      renderDailyContent(d);
      document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' });
      setActiveNav('content');
    });

    grid.appendChild(cell);
  }
}

// ── QURAN TRACKER ─────────────────────────────────────────────────

function renderTracker() {
  const grid = $id('tracker-juz-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (let j = 1; j <= 30; j++) {
    const done = state.juzCompleted.includes(j);
    const item = document.createElement('div');
    item.className = `tracker-juz-item${done ? ' completed' : ''}`;
    item.textContent = toArabicNumerals(j);
    item.setAttribute('aria-label', `الجزء ${j}${done ? ' — مقروء' : ''}`);
    item.addEventListener('click', () => toggleJuz(j));
    grid.appendChild(item);
  }

  const count = state.juzCompleted.length;
  const pct   = Math.round((count / 30) * 100);

  $id('tracker-done-count').textContent = toArabicNumerals(count);
  $id('tracker-pct').textContent        = toArabicNumerals(pct) + '٪';
  $id('tracker-bar-fill').style.width   = pct + '%';
}

function toggleJuz(juzNum) {
  if (state.juzCompleted.includes(juzNum)) {
    state.juzCompleted = state.juzCompleted.filter(j => j !== juzNum);
  } else {
    state.juzCompleted.push(juzNum);
    if (navigator.vibrate) navigator.vibrate(25);
  }
  LS.set('r1447_juz', state.juzCompleted);
  renderTracker();
  // Also update mark button if currently viewing this juz
  const curQuran = state.quranSchedule?.[state.viewDay - 1];
  if (curQuran?.one_khatmah?.juz === juzNum) {
    const btn  = $id('mark-juz-read-btn');
    const done = state.juzCompleted.includes(juzNum);
    updateMarkJuzBtn(btn, done, juzNum);
  }
  computeStats();
}

// Reset tracker
document.addEventListener('DOMContentLoaded', () => {
  $id('reset-tracker-btn')?.addEventListener('click', () => {
    if (confirm('هل تريد إعادة تعيين تتبع القرآن؟')) {
      state.juzCompleted = [];
      LS.set('r1447_juz', []);
      renderTracker();
      computeStats();
    }
  });
});

// ── TASBIH ────────────────────────────────────────────────────────

function renderTasbih() {
  const t = state.tasbih;
  updateTasbihDisplay();

  // Load saved dhikr
  const savedDhikr = LS.get('r1447_tasbih_dhikr', null);
  if (savedDhikr) {
    document.querySelectorAll('.dhikr-btn').forEach(btn => {
      if (btn.dataset.dhikr === savedDhikr) {
        btn.click();
      }
    });
  }
}

function updateTasbihDisplay() {
  const t = state.tasbih;
  $id('tasbih-count-display').textContent = toArabicNumerals(t.count);
  $id('tasbih-max-display').textContent   = `/ ${toArabicNumerals(t.max)}`;
  $id('tasbih-total-display').textContent = toArabicNumerals(t.total);
  $id('tasbih-rounds-display').textContent = toArabicNumerals(t.rounds);

  // SVG ring progress
  const circumference = 2 * Math.PI * 52; // 326.7
  const progress      = Math.min(t.count / t.max, 1);
  const offset        = circumference * (1 - progress);
  const ring          = $id('tasbih-ring-fill');
  if (ring) ring.style.strokeDashoffset = offset;
}

document.addEventListener('DOMContentLoaded', () => {
  // Tasbih tap
  $id('tasbih-tap-btn')?.addEventListener('click', () => {
    const t = state.tasbih;
    t.count++;
    t.total++;

    if (t.count >= t.max) {
      t.rounds++;
      t.count = 0;
      showTasbihDone();
    }

    updateTasbihDisplay();
    LS.set('r1447_tasbih', state.tasbih);
    computeStats();

    if (navigator.vibrate) navigator.vibrate(15);
  });

  // Minus
  $id('tasbih-minus-btn')?.addEventListener('click', () => {
    const t = state.tasbih;
    if (t.count > 0) { t.count--; t.total = Math.max(0, t.total - 1); }
    updateTasbihDisplay();
    LS.set('r1447_tasbih', state.tasbih);
  });

  // Reset
  $id('tasbih-reset-btn')?.addEventListener('click', () => {
    state.tasbih.count  = 0;
    state.tasbih.total  = 0;
    state.tasbih.rounds = 0;
    updateTasbihDisplay();
    $id('tasbih-done-msg').classList.add('hidden');
    LS.set('r1447_tasbih', state.tasbih);
    computeStats();
  });

  // Dhikr buttons
  document.querySelectorAll('.dhikr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dhikr-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');

      state.tasbih.dhikr = btn.dataset.dhikr;
      state.tasbih.max   = parseInt(btn.dataset.max);
      state.tasbih.count = 0;

      $id('tasbih-dhikr-display').textContent = btn.dataset.dhikr;
      $id('tasbih-done-msg').classList.add('hidden');

      LS.set('r1447_tasbih', state.tasbih);
      LS.set('r1447_tasbih_dhikr', btn.dataset.dhikr);
      updateTasbihDisplay();
    });
  });
});

function showTasbihDone() {
  const msg = $id('tasbih-done-msg');
  $id('tasbih-done-text').textContent = `أتممت ${toArabicNumerals(state.tasbih.rounds)} جولة من "${state.tasbih.dhikr}"`;
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);

  if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
}

// ── NAVIGATION ────────────────────────────────────────────────────

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const section = item.dataset.section;
      setActiveNav(section);
    });
  });
}

function setActiveNav(sectionId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
}

function setupScrollSpy() {
  const sections = ['today', 'prayer', 'content', 'calendar', 'tracker', 'tasbih-section'];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveNav(entry.target.id);
      }
    });
  }, { threshold: 0.3, rootMargin: '-60px 0px -40% 0px' });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

// ── BOOT ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
