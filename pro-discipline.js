/* =========================================================
   HOW THIS BEGAN PRO PWA DISCIPLINE ADD-ON
   Class day + Holiday mode + Social media control + No alcohol/
   peer pressure tracker + practical notification system.
   Works with your existing app without deleting your old code.
========================================================= */
(() => {
  'use strict';

  const STORAGE_KEY = 'htbProDisciplineV1';
  const $ = id => document.getElementById(id);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const nowHHMM = () => new Date().toTimeString().slice(0, 5);
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2));

  const defaultState = {
    settings: {
      dayMode: 'class',
      wake: '05:00',
      sleep: '23:00',
      sport: '06:30',
      morningClassStart: '08:00',
      morningClassEnd: '12:30',
      lunchStart: '12:30',
      lunchEnd: '13:40',
      afternoonClassStart: '14:00',
      afternoonClassEnd: '17:00',
      videosPerWeek: 2,
      introvertMode: true
    },
    dayFlags: {},
    discipline: {},
    social: {},
    holiday: {},
    videoPlan: {},
    push: { enabled: false, lastTest: '', fcmToken: '' },
    notificationHistory: {},
    customReminders: []
  };

  const state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return deepMerge(structuredClone(defaultState), saved || {});
    } catch {
      return structuredClone(defaultState);
    }
  }

  function deepMerge(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    Object.keys(extra).forEach(key => {
      if (extra[key] && typeof extra[key] === 'object' && !Array.isArray(extra[key])) {
        base[key] = deepMerge(base[key] || {}, extra[key]);
      } else {
        base[key] = extra[key];
      }
    });
    return base;
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function dateBucket(collection, fallback = {}) {
    const date = todayISO();
    if (!state[collection][date]) state[collection][date] = structuredClone(fallback);
    return state[collection][date];
  }

  const defaultRoutine = [
    { time: '04:55', title: 'Wake prep', body: 'Get ready. Your 5:00 AM mission starts in 5 minutes.', type: 'discipline' },
    { time: '05:00', title: 'Wake up + prayer', body: 'Stand up now. Pray, breathe, and choose discipline before comfort.', type: 'health' },
    { time: '05:40', title: 'Morning plan', body: 'Open Big 3. Choose only what must win today.', type: 'planning' },
    { time: '06:25', title: 'Sport in 5 minutes', body: 'Prepare for constant sport. Your body protects your future.', type: 'health' },
    { time: '06:30', title: 'Sport time', body: 'No negotiation. Train even when motivation is low.', type: 'health' },
    { time: '07:40', title: 'Prepare for class', body: 'Stop side work. Get ready for university.', type: 'study' },
    { time: '08:00', title: 'Morning class', body: 'Focus in class. Do not waste this block.', type: 'study' },
    { time: '12:30', title: 'Lunch / reset', body: 'Find food, rest your mind, and avoid random scrolling.', type: 'recovery' },
    { time: '13:40', title: 'Afternoon decision', body: 'Is 2:00–5:00 class still happening? Choose class or recovered-time plan.', type: 'planning' },
    { time: '14:00', title: 'Afternoon class or recovered time', body: 'If class exists, attend. If cancelled, use this block for script, coding, or revision.', type: 'study' },
    { time: '17:30', title: 'Revision / assignment', body: 'University first. Finish what cannot disappear tomorrow.', type: 'study' },
    { time: '19:00', title: 'How This Began production', body: 'Research, hook, script, visuals, editing, or upload. One channel only.', type: 'creator' },
    { time: '20:30', title: 'Light work / social posting', body: 'Use YT, TikTok, X, or WhatsApp with purpose only.', type: 'social' },
    { time: '21:30', title: 'Phone shutdown', body: 'No chasing, no useless groups, no random scrolling. Protect sleep.', type: 'discipline' },
    { time: '22:45', title: 'Sleep preparation', body: 'Close the day. Tomorrow starts at 5:00 AM.', type: 'health' }
  ];

  const holidayRoutine = [
    { time: '05:00', title: 'Wake up + prayer', body: 'Holiday is not lazy mode. Start clean.', type: 'health' },
    { time: '06:30', title: 'Sport time', body: 'Keep the body strong even in holidays.', type: 'health' },
    { time: '08:00', title: 'Coding deep work', body: 'Build your skill. Portfolio, JavaScript, Firebase, or AI workflow.', type: 'coding' },
    { time: '10:30', title: 'How This Began research/script', body: 'Move one video forward. Two videos per week.', type: 'creator' },
    { time: '13:30', title: 'University revision', body: 'Do not return to class empty. Review one topic.', type: 'study' },
    { time: '15:00', title: 'Editing / visuals block', body: 'CapCut, AI images, B-roll, animation, subtitles.', type: 'creator' },
    { time: '18:30', title: 'Social posting with purpose', body: 'Promote, reply, or research. No random feed.', type: 'social' },
    { time: '21:30', title: 'Introvert reset', body: 'Avoid peer pressure. Close chats. Protect tomorrow.', type: 'discipline' },
    { time: '22:45', title: 'Sleep preparation', body: 'Holiday discipline compounds.', type: 'health' }
  ];

  function getActiveRoutine() {
    return state.settings.dayMode === 'holiday' ? holidayRoutine : defaultRoutine;
  }

  function installCards() {
    installModeCard();
    installDisciplineCard();
    installSocialCard();
    installHolidayCard();
    installVideoPlanCard();
    installNotificationCard();
    syncExistingSettings();
    renderAll();
  }

  function insertAfter(target, html) {
    if (!target) return null;
    target.insertAdjacentHTML('afterend', html);
    return target.nextElementSibling;
  }

  function appendTo(selector, html) {
    const target = document.querySelector(selector);
    if (!target) return null;
    target.insertAdjacentHTML('beforeend', html);
    return target.lastElementChild;
  }

  function installModeCard() {
    if ($('proModeCard')) return;
    const anchor = document.querySelector('#agendaScreen .content .select-card') || document.querySelector('#agendaScreen .content');
    const html = `
      <section id="proModeCard" class="card pro-card pro-mode-card">
        <div class="section-title tight"><h3><i class="fa-solid fa-toggle-on"></i> Life Mode Control</h3><span id="proModeBadge" class="chip-btn">Class Day</span></div>
        <p class="mini">Choose today mode. The app will adjust reminders, mindset, and work blocks.</p>
        <div class="pro-segmented" role="group" aria-label="Day mode">
          <button type="button" data-pro-mode="class">Class Day</button>
          <button type="button" data-pro-mode="holiday">Holiday Mode</button>
          <button type="button" data-pro-mode="deep">Deep Work</button>
        </div>
        <div class="pro-cancel-box">
          <label class="v13-checkline"><input id="afternoonClassCancelled" type="checkbox"> Afternoon class 2:00–5:00 PM is cancelled today</label>
          <div id="recoveredTimePlan" class="pro-plan-box"></div>
        </div>
        <div class="v13-grid">
          <label>Morning class<input id="proMorningClass" type="text" value="08:00–12:30" disabled></label>
          <label>Lunch/reset<input id="proLunch" type="text" value="12:30–13:40" disabled></label>
          <label>Afternoon class<input id="proAfternoonClass" type="text" value="14:00–17:00" disabled></label>
          <label>Videos/week<input id="proVideosPerWeek" type="number" min="1" max="7" value="2"></label>
        </div>
      </section>`;
    if (anchor?.classList?.contains('select-card')) insertAfter(anchor, html); else appendTo('#agendaScreen .content', html);
  }

  function installDisciplineCard() {
    if ($('proDisciplineCard')) return;
    appendTo('#statsScreen .content', `
      <section id="proDisciplineCard" class="card pro-card pro-discipline-card">
        <div class="section-title tight"><h3><i class="fa-solid fa-shield-heart"></i> Mission Protection Tracker</h3><span id="disciplineScoreBadge" class="chip-btn">0%</span></div>
        <p class="mini">This is not punishment. This is protecting your future from alcohol, girls distraction, peer pressure, and random scrolling.</p>
        <div id="disciplineChecklist" class="pro-check-grid"></div>
        <div id="disciplineAdvice" class="pro-advice"></div>
      </section>`);
  }

  function installSocialCard() {
    if ($('proSocialCard')) return;
    appendTo('#moreScreen .content', `
      <section id="proSocialCard" class="card pro-card pro-social-card">
        <div class="section-title tight"><h3><i class="fa-solid fa-share-nodes"></i> Social Media Discipline</h3><span class="chip-btn">Tool, not escape</span></div>
        <p class="mini">YT, TikTok, X, and WhatsApp are allowed only when they serve growth, content, learning, or communication.</p>
        <div class="pro-rule-list">
          <div><b>YouTube</b><span>Analytics max 2 times/day. Improve title, thumbnail, retention. Do not refresh every hour.</span></div>
          <div><b>TikTok</b><span>Use only to promote strong clips from main videos. No random For You scrolling.</span></div>
          <div><b>X</b><span>Research ideas, post thoughts, learn from creators. Avoid drama and arguments.</span></div>
          <div><b>WhatsApp</b><span>Communication only. Mute useless groups during deep work and sleep preparation.</span></div>
        </div>
        <div id="socialChecklist" class="pro-check-grid"></div>
      </section>`);
  }

  function installHolidayCard() {
    if ($('proHolidayCard')) return;
    appendTo('#goalsScreen .content', `
      <section id="proHolidayCard" class="card pro-card pro-holiday-card">
        <div class="section-title tight"><h3><i class="fa-solid fa-umbrella-beach"></i> Holiday Mode Plan</h3><span class="chip-btn">No lazy mode</span></div>
        <p class="mini">When university goes into break, you still stay on campus with structure: coding, videos, sport, revision, and introvert discipline.</p>
        <div class="pro-timeline">
          <div><b>Morning</b><span>Prayer, sport, coding deep work.</span></div>
          <div><b>Midday</b><span>How This Began research, script, or voice-over.</span></div>
          <div><b>Afternoon</b><span>Editing, visuals, animation, university revision.</span></div>
          <div><b>Evening</b><span>Promotion, reflection, no peer pressure, sleep prep.</span></div>
        </div>
        <div id="holidayChecklist" class="pro-check-grid"></div>
      </section>`);
  }

  function installVideoPlanCard() {
    if ($('proVideoPlanCard')) return;
    appendTo('#goalsScreen .content', `
      <section id="proVideoPlanCard" class="card pro-card pro-video-card">
        <div class="section-title tight"><h3><i class="fa-solid fa-video"></i> 2 Videos / Week Execution</h3><span id="videoWeekBadge" class="chip-btn">0/2</span></div>
        <p class="mini">Target: two How This Began videos every week. Do not expand to other channels until this is stable.</p>
        <div class="v13-grid">
          <label>Video A title<input id="videoATitle" type="text" placeholder="Example: Why Money Was Invented"></label>
          <label>Video A stage<select id="videoAStage"><option>Idea</option><option>Research</option><option>Hook</option><option>Script</option><option>Voice-over</option><option>Visuals</option><option>Editing</option><option>Thumbnail/SEO</option><option>Scheduled</option><option>Published</option></select></label>
          <label>Video B title<input id="videoBTitle" type="text" placeholder="Second video for this week"></label>
          <label>Video B stage<select id="videoBStage"><option>Idea</option><option>Research</option><option>Hook</option><option>Script</option><option>Voice-over</option><option>Visuals</option><option>Editing</option><option>Thumbnail/SEO</option><option>Scheduled</option><option>Published</option></select></label>
        </div>
        <button id="saveVideoWeekBtn" type="button" class="btn wide purple">Save Weekly Video Plan</button>
        <p id="videoPlanStatus" class="msg"></p>
      </section>`);
  }

  function installNotificationCard() {
    if ($('proNotificationStatusCard')) return;
    const notificationSection = [...document.querySelectorAll('#moreScreen .content .card')].find(card => card.textContent.includes('Notifications'));
    const html = `
      <section id="proNotificationStatusCard" class="card pro-card pro-notification-card">
        <div class="section-title tight"><h3><i class="fa-solid fa-satellite-dish"></i> Pro PWA Reminder Engine</h3><span id="proPushBadge" class="chip-btn">Checking</span></div>
        <p class="mini">Install the app, enable notifications, then keep Firebase Cloud Messaging configured for closed-app push reminders.</p>
        <div class="pro-status-grid">
          <div><b id="secureStatus">—</b><span>HTTPS / secure</span></div>
          <div><b id="swStatus">—</b><span>Service worker</span></div>
          <div><b id="notifStatus2">—</b><span>Notification permission</span></div>
          <div><b id="pwaStatus">—</b><span>PWA install</span></div>
        </div>
        <div class="v13-row">
          <button id="proEnableNotifications" type="button" class="btn primary v13-grow">Enable Pro Notifications</button>
          <button id="proTestNotification" type="button" class="chip-btn">Test</button>
        </div>
        <p id="proNotificationMessage" class="msg"></p>
      </section>`;
    if (notificationSection) insertAfter(notificationSection, html); else appendTo('#moreScreen .content', html);
  }

  function syncExistingSettings() {
    const mapping = [
      ['wakeTimeInput', 'wake'], ['sleepTimeInput', 'sleep'], ['sportTimeInput', 'sport'],
      ['classStartInput', 'morningClassStart'], ['classEndInput', 'morningClassEnd']
    ];
    mapping.forEach(([id, key]) => {
      const el = $(id);
      if (!el) return;
      if (!el.value) el.value = state.settings[key];
      el.addEventListener('change', () => {
        state.settings[key] = el.value || state.settings[key];
        save();
        renderAll();
      });
    });
  }

  const disciplineItems = [
    ['noAlcohol', 'No alcohol today', 'Alcohol weakens focus, sleep, sport, and 5:00 AM discipline.'],
    ['noChasing', 'No chasing girls', 'No late-night emotional chats, no distraction, no drama.'],
    ['noPeerPressure', 'No peer pressure decision', 'You do not follow the crowd when it attacks your mission.'],
    ['noRandomScroll', 'No random scrolling', 'Social media is a tool, not escape.'],
    ['sportDone', 'Sport completed', 'Body discipline strengthens mind discipline.'],
    ['sleepProtected', 'Sleep protected', 'Phone down early. Tomorrow begins before sleep.']
  ];

  const socialItems = [
    ['ytPurpose', 'YouTube used with purpose'],
    ['tkPurpose', 'TikTok used for promotion only'],
    ['xPurpose', 'X used for research/networking'],
    ['waPurpose', 'WhatsApp used for communication only'],
    ['noDrama', 'No drama / useless arguments'],
    ['analyticsLimited', 'Analytics checked max 2 times']
  ];

  const holidayItems = [
    ['codingBlock', 'Coding deep work completed'],
    ['videoBlock', 'Video production block completed'],
    ['sportBlock', 'Sport completed'],
    ['revisionBlock', 'University revision completed'],
    ['introvertReset', 'Introvert reset protected'],
    ['noPressure', 'No useless hangout / peer pressure']
  ];

  function renderChecklist(containerId, collection, items, advice = '') {
    const container = $(containerId);
    if (!container) return;
    const bucket = dateBucket(collection);
    container.innerHTML = items.map(([key, label, note]) => `
      <label class="pro-check-item ${bucket[key] ? 'active' : ''}">
        <input type="checkbox" data-pro-collection="${collection}" data-pro-key="${key}" ${bucket[key] ? 'checked' : ''}>
        <span><b>${escapeHTML(label)}</b>${note ? `<small>${escapeHTML(note)}</small>` : ''}</span>
      </label>`).join('');
    if (advice && $(advice)) renderDisciplineAdvice();
  }

  function renderDisciplineAdvice() {
    const bucket = dateBucket('discipline');
    const done = disciplineItems.filter(([key]) => bucket[key]).length;
    const percent = Math.round((done / disciplineItems.length) * 100);
    const badge = $('disciplineScoreBadge');
    if (badge) badge.textContent = `${percent}%`;
    const advice = $('disciplineAdvice');
    if (!advice) return;
    let message = 'Good. Your mission is protected today.';
    if (!bucket.noAlcohol) message = 'Strong recommendation: choose no alcohol today. Give yourself a 90-day challenge and watch your focus improve.';
    else if (!bucket.noChasing) message = 'Protect your attention. Do not chase girls or emotional conversations when you have not built your base yet.';
    else if (!bucket.noPeerPressure) message = 'Peer pressure is expensive. You do not need to explain your discipline to everyone.';
    else if (!bucket.noRandomScroll) message = 'Random scrolling steals hours silently. Open the app only with a purpose.';
    advice.innerHTML = `<b>Coach note:</b> ${escapeHTML(message)}`;
  }

  function renderMode() {
    const mode = state.settings.dayMode;
    document.querySelectorAll('[data-pro-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.proMode === mode));
    const badge = $('proModeBadge');
    if (badge) badge.textContent = mode === 'holiday' ? 'Holiday Mode' : mode === 'deep' ? 'Deep Work' : 'Class Day';
    const vids = $('proVideosPerWeek');
    if (vids) vids.value = state.settings.videosPerWeek;

    const flags = dateBucket('dayFlags', { afternoonCancelled: false });
    const cancelled = $('afternoonClassCancelled');
    if (cancelled) cancelled.checked = !!flags.afternoonCancelled;
    const plan = $('recoveredTimePlan');
    if (plan) {
      plan.innerHTML = flags.afternoonCancelled
        ? `<b>Recovered Time Plan</b><span>14:00–15:20 How This Began script or coding • 15:20–15:40 break • 15:40–17:00 university revision or editing. No scrolling.</span>`
        : `<b>Normal Plan</b><span>Attend 14:00–17:00 class if it exists. If cancelled, turn that time into script, coding, or revision immediately.</span>`;
    }
  }

  function weekKey(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }

  function renderVideoPlan() {
    const key = weekKey();
    const plan = state.videoPlan[key] || {};
    [['videoATitle','aTitle'], ['videoAStage','aStage'], ['videoBTitle','bTitle'], ['videoBStage','bStage']].forEach(([id, field]) => {
      const el = $(id); if (!el) return;
      el.value = plan[field] || (field.endsWith('Stage') ? 'Idea' : '');
    });
    const published = [plan.aStage, plan.bStage].filter(v => v === 'Published').length;
    const badge = $('videoWeekBadge');
    if (badge) badge.textContent = `${published}/${state.settings.videosPerWeek}`;
  }

  function renderNotificationStatus() {
    const secure = window.isSecureContext || location.hostname === 'localhost';
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const secureEl = $('secureStatus'); if (secureEl) secureEl.textContent = secure ? 'OK' : 'NO';
    const swEl = $('swStatus'); if (swEl) swEl.textContent = 'serviceWorker' in navigator ? 'OK' : 'NO';
    const notifEl = $('notifStatus2'); if (notifEl) notifEl.textContent = perm;
    const pwaEl = $('pwaStatus'); if (pwaEl) pwaEl.textContent = standalone ? 'Installed' : 'Browser';
    const badge = $('proPushBadge'); if (badge) badge.textContent = perm === 'granted' ? 'Ready' : 'Enable';
  }

  function renderAll() {
    renderMode();
    renderChecklist('disciplineChecklist', 'discipline', disciplineItems, 'disciplineAdvice');
    renderChecklist('socialChecklist', 'social', socialItems);
    renderChecklist('holidayChecklist', 'holiday', holidayItems);
    renderVideoPlan();
    renderNotificationStatus();
    updateReminderPreview();
    save();
  }

  function bindEvents() {
    document.addEventListener('click', e => {
      const modeBtn = e.target.closest('[data-pro-mode]');
      if (modeBtn) {
        state.settings.dayMode = modeBtn.dataset.proMode;
        save(); renderAll();
        showProMessage(`Mode changed to ${modeBtn.textContent.trim()}.`);
      }
    });

    document.addEventListener('change', e => {
      const input = e.target.closest('[data-pro-collection][data-pro-key]');
      if (input) {
        const bucket = dateBucket(input.dataset.proCollection);
        bucket[input.dataset.proKey] = input.checked;
        save(); renderAll();
      }
      if (e.target?.id === 'afternoonClassCancelled') {
        const flags = dateBucket('dayFlags', { afternoonCancelled: false });
        flags.afternoonCancelled = e.target.checked;
        save(); renderAll();
        if (e.target.checked) notifyNow('Recovered Time Plan', 'Afternoon class cancelled. Use 14:00–17:00 for script, coding, or revision.');
      }
      if (e.target?.id === 'proVideosPerWeek') {
        state.settings.videosPerWeek = Number(e.target.value || 2);
        save(); renderAll();
      }
    });

    $('saveVideoWeekBtn')?.addEventListener('click', () => {
      const key = weekKey();
      state.videoPlan[key] = {
        aTitle: $('videoATitle')?.value.trim() || '',
        aStage: $('videoAStage')?.value || 'Idea',
        bTitle: $('videoBTitle')?.value.trim() || '',
        bStage: $('videoBStage')?.value || 'Idea',
        savedAt: new Date().toISOString()
      };
      save(); renderVideoPlan();
      const status = $('videoPlanStatus');
      if (status) status.textContent = 'Weekly video plan saved. Focus on publishing, not perfection.';
    });

    $('proEnableNotifications')?.addEventListener('click', enableProNotifications);
    $('proTestNotification')?.addEventListener('click', () => notifyNow('How This Began Control Room', 'Test notification works. Your routine is ready.'));
    $('enableNotificationsBtn')?.addEventListener('click', enableProNotifications);
    $('sendTestLocalBtn')?.addEventListener('click', () => notifyNow('Discipline Test', 'This is how action reminders will appear.'));
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) throw new Error('Service worker is not supported in this browser.');
    return navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' });
  }

  async function enableProNotifications() {
    try {
      if (!('Notification' in window)) throw new Error('This browser does not support notifications.');
      const registration = await registerServiceWorker();
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notification permission was not granted.');
      state.push.enabled = true;
      state.push.lastTest = new Date().toISOString();
      save();
      await registration.showNotification('Pro PWA notifications enabled', {
        body: 'You will receive action reminders when the app/browser can deliver them. Configure FCM for closed-app push reminders.',
        icon: './icon-192.png',
        badge: './badge-72.png',
        tag: 'htb-pro-enabled',
        data: { url: location.href }
      });
      showProMessage('Notifications enabled. For closed-app reminders, keep Firebase Cloud Messaging configured.');
      renderNotificationStatus();
    } catch (error) {
      showProMessage(error.message || 'Could not enable notifications.');
    }
  }

  async function notifyNow(title, body, options = {}) {
    try {
      if (!('Notification' in window)) return false;
      if (Notification.permission !== 'granted') return false;
      const reg = await registerServiceWorker();
      await reg.showNotification(title, {
        body,
        icon: './icon-192.png',
        badge: './badge-72.png',
        vibrate: [120, 60, 120],
        tag: options.tag || `htb-${Date.now()}`,
        renotify: true,
        data: { url: location.href, ...options.data }
      });
      return true;
    } catch (error) {
      console.warn('Notification failed:', error);
      return false;
    }
  }

  function showProMessage(message) {
    const el = $('proNotificationMessage') || $('notificationStatus');
    if (el) el.textContent = message;
  }

  function updateReminderPreview() {
    const preview = $('reminderPreview');
    if (!preview) return;
    const routine = getActiveRoutine();
    const now = nowHHMM();
    const next = routine.find(item => item.time >= now) || routine[0];
    const flags = dateBucket('dayFlags', { afternoonCancelled: false });
    if (next.time === '14:00' && flags.afternoonCancelled) {
      preview.textContent = '14:00 Recovered time: script, coding, or revision. No scrolling.';
    } else {
      preview.textContent = `${next.time} — ${next.title}`;
    }
  }

  function reminderLoop() {
    const now = nowHHMM();
    const date = todayISO();
    const history = state.notificationHistory[date] || (state.notificationHistory[date] = {});
    const routine = getActiveRoutine();
    const flags = dateBucket('dayFlags', { afternoonCancelled: false });
    for (const item of routine) {
      const key = `${date}-${state.settings.dayMode}-${item.time}-${item.title}`;
      if (item.time === now && !history[key]) {
        history[key] = new Date().toISOString();
        save();
        let title = item.title;
        let body = item.body;
        if (item.time === '14:00' && flags.afternoonCancelled) {
          title = 'Recovered Time Plan';
          body = 'Class is cancelled. Use 14:00–17:00 for script, coding, editing, or revision. No scrolling.';
        }
        notifyNow(title, body, { tag: key, data: { type: item.type } });
      }
    }
    updateReminderPreview();
  }

  function installPwaPrompt() {
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredPrompt = event;
      const btn = $('installAppBtn');
      if (btn) btn.textContent = 'Install App Ready';
    });
    $('installAppBtn')?.addEventListener('click', async () => {
      if (!deferredPrompt) {
        showProMessage('Open this site on Chrome/Edge and use Install App from browser menu if the button is not ready.');
        return;
      }
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      renderNotificationStatus();
    });
  }

  function init() {
    installCards();
    bindEvents();
    installPwaPrompt();
    registerServiceWorker().then(renderNotificationStatus).catch(() => renderNotificationStatus());
    setInterval(reminderLoop, 30_000);
    setTimeout(reminderLoop, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
