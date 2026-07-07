/* ============================================================
 * 天府通未来教育中心 — 家长端
 * 纯前端 SPA（hash 路由 + 写死 mock 数据），无需后端
 * ============================================================ */
(function () {
  const DB = window.DB;
  const app = document.getElementById('app');

  /* ---------- 小工具 ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const go = (hash) => { location.hash = hash; };
  const routeId = (id) => {
    try { return decodeURIComponent(id); } catch (_) { return id; }
  };
  const currentStudent = () => {
    const list = DB.students || [DB.student];
    return list.find((s) => s.id === DB.currentStudentId) || list[0];
  };
  /* 本地持久化（Demo：学生 / 家长信息的增删改存 localStorage） */
  const STORE_KEY = 'futureEdu.state.v1';
  const persistState = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        students: DB.students, currentStudentId: DB.currentStudentId, parent: DB.parent,
      }));
    } catch (_) {}
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved) {
      if (Array.isArray(saved.students) && saved.students.length) DB.students = saved.students;
      if (saved.currentStudentId) DB.currentStudentId = saved.currentStudentId;
      if (saved.parent) Object.assign(DB.parent, saved.parent);
    }
  } catch (_) {}
  try {
    const savedStudentId = localStorage.getItem('futureEdu.currentStudentId');
    if ((DB.students || []).some((s) => s.id === savedStudentId)) DB.currentStudentId = savedStudentId;
  } catch (_) {}
  if (!(DB.students || []).some((s) => s.id === DB.currentStudentId)) DB.currentStudentId = (DB.students[0] || {}).id;
  const syncCurrentStudent = () => {
    DB.student = currentStudent();
    return DB.student;
  };
  const courseById = (id) => DB.courses.find((c) => c.id === routeId(id));
  const orderById = (id) => DB.orders.find((o) => o.id === routeId(id));
  const coverImages = {
    ai: 'assets/images/courses/ai-basics.png',
    code: 'assets/images/courses/coding-thinking.png',
    science: 'assets/images/courses/science-lab.png',
    art: 'assets/images/courses/ai-art.png',
  };
  const coverImg = (key, alt, extra = '') => {
    const src = coverImages[key];
    if (!src) return `<div class="cover cv-${key}">${esc(String(alt).slice(0, 2))}</div>`;
    return `<div class="cover cover-image ${extra}"><img src="${src}" alt="${esc(alt)}" loading="lazy"><span class="cover-fallback">${esc(String(alt).slice(0, 2))}</span></div>`;
  };
  const avatarImg = (src, fallback, alt, cls = 'ava') => src
    ? `<div class="${cls} avatar-img"><img src="${src}" alt="${esc(alt || fallback)}" loading="lazy"></div>`
    : `<div class="${cls}">${esc(fallback)}</div>`;
  syncCurrentStudent();
  const teacherCard = (teacher) => teacher ? `
    <div class="teacher-card">
      <div class="teacher-head">
        ${avatarImg(teacher.avatarImage, teacher.avatar || teacher.name.slice(0, 1), teacher.name, 'teacher-avatar')}
        <div>
          <div class="teacher-name">${esc(teacher.name)}</div>
          <div class="teacher-title">${esc(teacher.title)}</div>
        </div>
      </div>
      <div class="teacher-tags">${teacher.tags.map((t) => `<span class="tag blue">${esc(t)}</span>`).join('')}</div>
      <div class="teacher-bio small">${esc(teacher.bio)}</div>
      <div class="teacher-points">
        ${teacher.highlights.map((h) => `<div class="teacher-point small">${esc(h)}</div>`).join('')}
      </div>
    </div>` : '';

  /* ---------- SVG 图标（统一扁平化：磁贴用实心，导航用描边/实心切换） ---------- */
  const I = {
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    checkBig: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    swap: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M7 4 3.5 7.5 7 11M3.5 7.5H16M17 13l3.5 3.5L17 20m3.5-3.5H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    /* 底部导航：未选中描边、选中实心 */
    home: (a) => a
      ? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3.1 3 10.4V20a1 1 0 0 0 1 1h5v-5.5h6V21h5a1 1 0 0 0 1-1v-9.6L12 3.1z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none"><path d="M4 10.6 12 4.2l8 6.4V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    order: (a) => a
      ? '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="16" rx="2.6" fill="currentColor"/><rect x="8.5" y="3" width="7" height="3.6" rx="1.4" fill="currentColor"/><path d="M8.5 11.5h7M8.5 15.3h4.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="16" rx="2.6" stroke="currentColor" stroke-width="1.8"/><rect x="8.5" y="3" width="7" height="3.6" rx="1.4" fill="currentColor"/><path d="M8.5 11.5h7M8.5 15.3h4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    me: (a) => a
      ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="currentColor"/><path fill="currentColor" d="M4 19.6C4 15.9 7.6 14 12 14s8 1.9 8 5.6V21H4z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.6" stroke="currentColor" stroke-width="1.8"/><path d="M4.8 20c0-3.4 3.4-5.2 7.2-5.2s7.2 1.8 7.2 5.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',

    /* 彩色磁贴上的实心扁平图标（fill=currentColor，容器 color:#fff） */
    student: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 19.6C4 15.9 7.6 14 12 14s8 1.9 8 5.6V21H4z"/></svg>',
    school: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M12 3 3 8.2V10h18V8.2L12 3z"/><path d="M5 11.2V21h4v-5h6v5h4v-9.8l-7 3.4-7-3.4z"/></svg>',
    clip: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M9 3.4A2.6 2.6 0 0 0 6.5 5.2H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.2a2 2 0 0 0-2-2h-.5A2.6 2.6 0 0 0 15 3.4a2 2 0 0 0-1-.3h-4a2 2 0 0 0-1 .3zM10 5h4v1.4h-4V5zm-1.5 6.5h7V13h-7v-1.5zm0 3.8h4.6v1.5H8.5v-1.5z"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M7.6 3H5l3.3 5.7A6 6 0 0 1 11 8.1L8.4 3H7.6zM16.4 3H14l-2.6 5.1c.9.1 1.8.5 2.5 1L17 3h-.6zM12 9.2a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8zm0 2.5 1.1 2.2 2.4.2-1.8 1.6.6 2.3-2.3-1.3-2.3 1.3.6-2.3-1.8-1.6 2.4-.2 1.1-2.2z"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 15.4h2.2v-.5c0-.9.4-1.4 1.4-2 1.3-.8 2.1-1.7 2.1-3.3C16.7 7.4 14.8 6 12.2 6 9.7 6 7.9 7.4 7.7 9.9H10c.1-1.1.9-1.7 2.1-1.7 1.1 0 1.8.6 1.8 1.5 0 .8-.4 1.2-1.3 1.8-1.3.8-1.7 1.6-1.6 3v.9z"/><circle cx="12.1" cy="18" r="1.4"/></svg>',
    service: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4a8 8 0 0 0-8 8v4.5A2.5 2.5 0 0 0 6.5 19H8a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H6.2A5.8 5.8 0 0 1 17.8 13H16a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h.8a1.7 1.7 0 0 1-1.6 1.1H13a1 1 0 1 0 0 2h2.2A3.7 3.7 0 0 0 19 18.6 2.5 2.5 0 0 0 20 12a8 8 0 0 0-8-8z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.2 6.3C9.5 5.1 7.2 4.6 5 4.6c-.8 0-1.5.1-2.2.3v12.4c.7-.2 1.4-.3 2.2-.3 2.2 0 4.5.5 6.2 1.7V6.3z"/><path d="M12.8 6.3c1.7-1.2 4-1.7 6.2-1.7.8 0 1.5.1 2.2.3v12.4c-.7-.2-1.4-.3-2.2-.3-2.2 0-4.5.5-6.2 1.7V6.3z"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M12 3a9 9 0 0 0-.4 18c1 .1 1.7-.7 1.7-1.6 0-.5-.2-.9-.5-1.2-.2-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5.2C20.9 6.2 17 3 12 3zM6.8 12.6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2.8-3.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M18.8 3.2c-2.9.2-5.5 1.8-7.2 4.4l-2.7.4c-.5.1-.7.7-.4 1.1l1.4 1.9c-.2.6-.4 1.2-.5 1.9l2.9 2.9c.6-.1 1.3-.3 1.9-.5l1.9 1.4c.4.3 1 .1 1.1-.4l.4-2.7c2.6-1.7 4.2-4.3 4.4-7.2l.1-2.4a.7.7 0 0 0-.7-.7l-2.5-.1zm-4.2 6.2a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM5 16.3c-1 1-1.2 4-1.2 4s3-.2 4-1.2A2 2 0 0 0 5 16.3z"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4 1.5 9 12 14l8.5-4V15a1 1 0 1 0 1.5 0V9L12 4z"/><path d="M6 12.2v3C6 17.2 8.7 19 12 19s6-1.8 6-3.8v-3l-6 2.9-6-2.9z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 16.9 6.5 20l1.4-6.1L3.2 9.8l6.2-.6z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M10.3 3.2a1 1 0 0 0-1 .8l-.3 1.7c-.5.2-1 .5-1.5.8l-1.6-.6a1 1 0 0 0-1.2.4L3.6 8.2a1 1 0 0 0 .2 1.3L5.1 10.6a6.9 6.9 0 0 0 0 1.7l-1.3 1.1a1 1 0 0 0-.2 1.3l1.1 1.9a1 1 0 0 0 1.2.4l1.6-.6c.5.3 1 .6 1.5.8l.3 1.7a1 1 0 0 0 1 .8h2.2a1 1 0 0 0 1-.8l.3-1.7c.5-.2 1-.5 1.5-.8l1.6.6a1 1 0 0 0 1.2-.4l1.1-1.9a1 1 0 0 0-.2-1.3l-1.3-1.1a6.9 6.9 0 0 0 0-1.7l1.3-1.1a1 1 0 0 0 .2-1.3l-1.1-1.9a1 1 0 0 0-1.2-.4l-1.6.6c-.5-.3-1-.6-1.5-.8l-.3-1.7a1 1 0 0 0-1-.8h-2.2zm1.1 5.6a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4z"/></svg>',
  };

  const navbar = (title, { orange, back = true, right } = {}) => `
    <div class="navbar ${orange ? 'orange' : ''}">
      ${back ? `<div class="nav-back" onclick="history.back()">${I.back}</div>` : '<div style="width:44px"></div>'}
      <div class="nav-title">${esc(title)}</div>
      ${right ? `<div class="nav-right" onclick="${right.onclick}">${right.label}</div>` : ''}
    </div>`;

  const tabbar = (active) => {
    const t = (key, label, icon, hash) =>
      `<div class="tab ${active === key ? 'active' : ''}" onclick="location.hash='${hash}'">${icon(active === key)}<span>${label}</span></div>`;
    return `<div class="tabbar">
      ${t('home', '首页', I.home, '#/home')}
      ${t('orders', '我的报名', I.order, '#/orders')}
      ${t('me', '我的', I.me, '#/me')}
    </div>`;
  };

  /* ---------- Toast ---------- */
  function toast(msg) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; app.appendChild(el); }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 1600);
  }

  function render(html) {
    // 保留 toast 节点
    app.innerHTML = html;
    const sc = $('.scroll'); if (sc) sc.scrollTop = 0;
  }

  /* ============================================================
   * 屏幕 1：天府通入口页（模拟首页）
   * ============================================================ */
  function screenTFT() {
    render(`
    <div class="screen">
      <div class="scroll" style="padding-top:env(safe-area-inset-top)">
        <div style="background:var(--orange-grad);padding:18px 16px 30px;color:#fff">
          <div style="font-size:13px;opacity:.9;margin-bottom:6px">◀ 天府通</div>
          <div style="font-size:22px;font-weight:800">天府通 · 城市服务</div>
        </div>
        <div class="card mx" style="margin-top:-18px;padding:6px 6px 10px">
          <div class="tft-search">${I.search}<span>找机构 / 找课程 / 找服务</span></div>
          <div class="grid4">
            <div class="gitem"><div class="gicon gi-blue">${I.book}</div><div class="glabel">学科</div></div>
            <div class="gitem"><div class="gicon gi-pink">${I.palette}</div><div class="glabel">艺术</div></div>
            <div class="gitem"><div class="gicon gi-orange">${I.rocket}</div><div class="glabel">科技</div></div>
            <div class="gitem" onclick="location.hash='#/home'">
              <div class="gicon gi-future">${I.cap}</div><div class="glabel" style="color:var(--orange-deep);font-weight:700">未来教育</div>
            </div>
          </div>
        </div>

        <div class="entry-banner mt" onclick="location.hash='#/home'">
          <div class="ico">${I.cap}</div>
          <h3>未来教育</h3>
          <p>校内课后延时服务 · AI 启蒙 / 科学实验 / 艺术创意</p>
          <div class="entry-cta">立即选课 ${I.arrow}</div>
        </div>

        <div class="mx mt small muted center" style="padding:20px 0 8px">— 点击「未来教育」进入家长端 —</div>
      </div>
    </div>`);
  }

  /* ============================================================
   * 屏幕 2：未来教育首页
   * ============================================================ */
  function screenHome() {
    const s = currentStudent();
    const courseCard = (c) => {
      const full = c.status === 'full';
      const pct = Math.round((c.enrolled / c.maxSeats) * 100);
      return `
      <div class="card course-card mx mt" onclick="location.hash='#/course/${c.id}'">
        <div class="cc-cover">${coverImg(c.cover, c.name)}</div>
        <div class="cc-body">
          <div class="cc-name">${esc(c.name)}</div>
          <div style="margin-bottom:4px">${c.tags.map((t, i) => `<span class="tag ${i ? 'gray' : ''}">${esc(t)}</span>`).join('')}</div>
          <div class="cc-meta">${esc(c.gradeRange)} · ${esc(c.time)}</div>
          <div class="cc-meta">${esc(c.place)}</div>
          <div class="seat-bar"><i style="width:${pct}%;${full ? 'background:#c5c9d1' : ''}"></i></div>
          <div class="row between" style="margin-top:6px">
            <span class="price"><span class="yen">¥</span><span class="num">${c.price}</span></span>
            ${full
              ? '<span class="badge st-muted">已满员 30/30</span>'
              : `<span class="small muted">余 ${c.maxSeats - c.enrolled} / ${c.maxSeats} 名额</span>`}
          </div>
        </div>
      </div>`;
    };

    const hour = new Date().getHours();
    const greet = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 13 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
    render(`
    <div class="screen has-tabbar">
      <div class="scroll">
        <div class="home-hero" style="padding-top:calc(14px + env(safe-area-inset-top))">
          <div class="hh-deco hh-deco1"></div>
          <div class="hh-deco hh-deco2"></div>
          <div class="hh-top">
            <div class="hh-greet">${greet}，欢迎回来</div>
            <button class="hh-switch" onclick="App.openSwitchSheet()">${I.swap} 切换孩子</button>
          </div>
          <div class="hh-student">
            ${avatarImg(s.avatarImage, s.avatar, s.name)}
            <div class="info">
              <div class="nm">${esc(s.name)} <span class="school-pill">${esc(s.grade)}</span></div>
              <div class="sc">${I.school} ${esc(s.school)}</div>
            </div>
          </div>
        </div>

        <div class="mx mt"><div class="section-title">本校可报名课程</div></div>
        ${DB.courses.map(courseCard).join('')}
      </div>
      ${tabbar('home')}
      ${switchSheet()}
    </div>`);
  }

  /* 首页切换孩子弹层 */
  function switchSheet() {
    const cur = currentStudent();
    return `
    <div class="sheet-mask" id="swMask" onclick="if(event.target===this)App.closeSwitchSheet()">
      <div class="sheet">
        <div class="handle"></div>
        <h3>切换孩子</h3>
        ${(DB.students || []).map((stu) => {
          const active = stu.id === cur.id;
          return `
          <div class="student-option ${active ? 'active' : ''}" onclick="App.switchStudent('${stu.id}')">
            ${avatarImg(stu.avatarImage, stu.avatar, stu.name)}
            <div class="so-main">
              <div class="so-name">${esc(stu.name)} <span class="tag ${active ? '' : 'gray'}">${esc(stu.grade)}</span></div>
              <div class="so-sub">${esc(stu.school)}</div>
            </div>
            <div class="so-state">${active ? '当前' : '切换'}</div>
          </div>`;
        }).join('')}
        <div style="height:12px"></div>
        <button class="btn btn-ghost" style="height:42px" onclick="location.hash='#/students'">管理孩子（添加 / 编辑）</button>
      </div>
    </div>`;
  }
  function openSwitchSheet() { $('#swMask')?.classList.add('show'); }
  function closeSwitchSheet() { $('#swMask')?.classList.remove('show'); }

  /* ============================================================
   * 屏幕 3：课程详情页
   * ============================================================ */
  function screenCourse(id) {
    const c = courseById(id);
    if (!c) return screenHome();
    const full = c.status === 'full';
    render(`
    <div class="screen">
      ${navbar('课程详情')}
      <div class="scroll">
        <div class="card mx course-detail-card">
          <div class="pad">
            <div class="course-detail-head">
              <div class="course-detail-main">
                <h1 class="course-detail-name">${esc(c.name)}</h1>
                <div class="course-detail-tags">${c.tags.map((t, i) => `<span class="tag ${i ? 'gray' : ''}">${esc(t)}</span>`).join('')}<span class="tag blue">${esc(c.gradeRange)}</span></div>
                <div class="price course-detail-price"><span class="yen">¥</span><span class="num">${c.price}</span><span class="small muted"> /期</span></div>
              </div>
              <div class="course-detail-cover">${coverImg(c.cover, c.name)}</div>
            </div>
            <div class="divider"></div>
            <div class="kv"><span class="k">上课学校</span><span class="v">${esc(currentStudent().school)}</span></div>
            <div class="kv"><span class="k">上课地点</span><span class="v">${esc(c.place)}</span></div>
            <div class="kv"><span class="k">上课时间</span><span class="v">${(c.classes || []).length > 1 ? `共 ${c.classes.length} 个班次可选（报名时选择）` : esc(c.time)}</span></div>
            <div class="kv"><span class="k">课时数量</span><span class="v">共 ${c.lessons} 次</span></div>
            <div class="kv"><span class="k">成班人数</span><span class="v">满 ${c.minClass} 人开班 · 最大 ${c.maxSeats} 人</span></div>
            <div class="kv"><span class="k">当前报名</span><span class="v">${c.enrolled} 人 ${full ? '<span class="badge st-muted">已满员</span>' : ''}</span></div>
            ${c.teacher ? `<div class="kv"><span class="k">任课老师</span><span class="v">${esc(c.teacher.name)} <span class="small muted">· 平台已审核资质</span></span></div>` : ''}
          </div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">课程介绍</div>
          <div class="small" style="color:#52565e;line-height:1.8">${esc(c.intro)}</div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">课时安排</div>
          <div class="syllabus-list">
            ${(c.syllabus || []).map((item, i) => `
              <div class="syllabus-item">
                <span class="syllabus-no">${i + 1}</span>
                <span class="syllabus-text small">${esc(item)}</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">学习目标</div>
          <div class="gap6">${c.goals.map((g) => `<div class="row small" style="align-items:flex-start;gap:8px"><span style="color:var(--orange);font-weight:800">·</span><span>${esc(g)}</span></div>`).join('')}</div>
          <div class="divider"></div>
          <div class="section-title">课程成果</div>
          <div class="small" style="color:#52565e;line-height:1.8">${esc(c.outcomes)}</div>
        </div>

        <div class="mx mt">
          <div class="notice">
            <b>先学后付 · 资金平台托管</b><br/>
            报名时一次性缴费，资金进入<b>平台监管账户</b>托管，不直接付给机构；机构每完成一节课按课时结算。未达开班人数将<b>自动全额退款</b>并通知家长。
          </div>
        </div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <div class="price" style="margin-right:auto"><span class="yen">¥</span><span class="num">${c.price}</span><span class="small muted"> /期</span></div>
        ${full
          ? '<button class="btn" disabled style="max-width:200px">已满员，无法报名</button>'
          : `<button class="btn btn-primary" style="max-width:200px" onclick="App.openSkuSheet('${c.id}')">立即报名</button>`}
      </div>
      ${skuSheet(c)}
    </div>`);
  }

  /* ---------- 班级 / 时段选择弹层（SKU：课后延时服务多班次） ---------- */
  /* 时间冲突：与已报名（进行中）课程同一天且时段重叠的班次禁止选择 */
  const parseSlot = (t) => {
    const d = (String(t).match(/每?周([一二三四五六日])/) || [])[1];
    const m = String(t).match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
    if (!d || !m) return null;
    return { d, s: +m[1] * 60 + +m[2], e: +m[3] * 60 + +m[4] };
  };
  function timeConflict(time) {
    const a = parseSlot(time);
    if (!a) return null;
    for (const o of DB.orders) {
      if (!['forming', 'formed', 'scheduled', 'ongoing'].includes(o.status)) continue;
      const b = parseSlot(o.time);
      if (b && b.d === a.d && a.s < b.e && b.s < a.e) return o.courseName;
    }
    return null;
  }

  let skuSel = -1;
  function skuSheet(c) {
    const classes = c.classes || [];
    if (!classes.length) return '';
    return `
    <div class="sheet-mask" id="skuMask" onclick="if(event.target===this)App.closeSkuSheet()">
      <div class="sheet">
        <div class="handle"></div>
        <h3>选择班级</h3>
        <div class="small muted" style="margin-bottom:2px">课后延时服务时段 · 请选择合适的班级和时间</div>
        ${classes.map((k, i) => {
          const isFull = k.enrolled >= k.maxSeats;
          const conflict = !isFull && timeConflict(k.time);
          const left = k.maxSeats - k.enrolled;
          return `
          <div class="sku-opt ${isFull || conflict ? 'full' : ''}" id="sku${i}" onclick="App.selectSku(${i})">
            <div class="sku-main">
              <div class="sku-name">${esc(k.name)}<span class="sku-time">${esc(k.time)}</span></div>
              <div class="sku-sub small muted">${esc(k.place)} · ${isFull ? '已满员' : conflict ? `与已报「${esc(conflict)}」时间冲突` : `余 ${left} 名额`}</div>
            </div>
            <span class="radio"></span>
          </div>`;
        }).join('')}
        <div class="row between" style="margin-top:14px;margin-bottom:10px">
          <span class="price"><span class="yen">¥</span><span class="num">${c.price}</span><span class="small muted"> /期 · 先学后付</span></span>
        </div>
        <button class="btn btn-primary" onclick="App.confirmSku('${c.id}')">确认，去报名</button>
      </div>
    </div>`;
  }

  function openSkuSheet(cid) {
    const c = courseById(cid);
    const classes = (c && c.classes) || [];
    if (!classes.length) { go('#/enroll/' + cid); return; }
    skuSel = classes.findIndex((k) => k.enrolled < k.maxSeats && !timeConflict(k.time));
    classes.forEach((_, i) => $('#sku' + i)?.classList.toggle('on', i === skuSel));
    $('#skuMask').classList.add('show');
  }

  function closeSkuSheet() { $('#skuMask')?.classList.remove('show'); }

  function selectSku(i) {
    skuSel = i;
    document.querySelectorAll('.sku-opt').forEach((el, j) => el.classList.toggle('on', j === i));
  }

  function confirmSku(cid) {
    const c = courseById(cid);
    const cls = ((c && c.classes) || [])[skuSel];
    if (!cls) return toast('请选择班级');
    if (cls.enrolled >= cls.maxSeats) return toast('该班级已满员，请选择其他班级');
    const conflict = timeConflict(cls.time);
    if (conflict) return toast('与已报「' + conflict + '」上课时间冲突');
    closeSkuSheet();
    go('#/enroll/' + cid + '/' + cls.id);
  }

  /* ============================================================
   * 屏幕 4：报名确认页
   * ============================================================ */
  let enrollConfirmed = false;
  let enrollClass = null; // 本次报名所选班级（SKU）
  function screenEnroll(id, classId) {
    const c = courseById(id);
    if (!c) return screenHome();
    const s = currentStudent();
    const classes = c.classes || [];
    enrollClass = classes.find((k) => k.id === routeId(classId || ''))
      || classes.find((k) => k.enrolled < k.maxSeats) || null;
    const cls = enrollClass;
    enrollConfirmed = false;
    const ruleText = `我已阅读并同意《课程报名须知》，同意支付 ¥${c.price} 课程费用（由平台监管账户托管，按课时结算给机构）；我已知晓未达开班人数将自动全额退款。`;

    render(`
    <div class="screen">
      ${navbar('报名确认')}
      <div class="scroll">
        <div class="card mx mt pad">
          <div class="section-title">学生信息</div>
          <div class="kv"><span class="k">学生姓名</span><span class="v">${esc(s.name)}</span></div>
          <div class="kv"><span class="k">所在学校</span><span class="v">${esc(s.school)}</span></div>
          <div class="kv"><span class="k">年级班级</span><span class="v">${esc(s.grade)}</span></div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">课程信息</div>
          <div class="kv"><span class="k">课程名称</span><span class="v bold">${esc(c.name)}</span></div>
          ${cls ? `<div class="kv"><span class="k">报名班级</span><span class="v"><b>${esc(cls.name)}</b> <span class="small muted">（余 ${cls.maxSeats - cls.enrolled} 名额）</span></span></div>` : ''}
          <div class="kv"><span class="k">上课时间</span><span class="v">${esc(cls ? cls.time : c.time)}</span></div>
          <div class="kv"><span class="k">上课地点</span><span class="v">${esc(cls ? cls.place : c.place)}</span></div>
          <div class="kv"><span class="k">报名截止</span><span class="v">2026 年 7 月 8 日</span></div>
          <div class="divider"></div>
          <div class="kv"><span class="k">课程费用</span><span class="v price"><span class="yen">¥</span><span class="num">${c.price}</span></span></div>
          <div class="kv"><span class="k">支付金额</span><span class="v"><b style="color:var(--orange-deep)">¥${c.price}</b> <span class="small muted">（平台托管）</span></span></div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">规则确认</div>
          <div class="check" id="enrollConfirm" onclick="App.toggleEnrollConfirm()">
            <span class="box">${I.check}</span><span>${esc(ruleText)}</span>
          </div>
        </div>

        <div class="mx mt"><div class="notice"><b>资金托管说明：</b>支付的 ¥${c.price} 将进入平台监管账户托管，不直接付给机构；机构每完成一节课按课时结算。未达开班人数将自动全额退款并通知你。</div></div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <button class="btn btn-primary" id="enrollBtn" disabled onclick="App.submitEnroll('${c.id}')">确认报名并支付</button>
      </div>
      ${wxpaySheet(c)}
    </div>`);
  }

  function toggleEnrollConfirm() {
    enrollConfirmed = !enrollConfirmed;
    $('#enrollConfirm').classList.toggle('on', enrollConfirmed);
    $('#enrollBtn').disabled = !enrollConfirmed;
  }

  /* ---------- 微信支付模拟弹窗（报名缴费收银台，资金平台托管） ---------- */
  const wxLogo = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#07c160"><path d="M9.5 3C5.4 3 2 5.9 2 9.5c0 2 1 3.8 2.7 5l-.7 2.2 2.5-1.3c.7.2 1.4.4 2.2.4h.4a5.7 5.7 0 0 1-.3-1.8c0-3.5 3.3-6.3 7.3-6.3h.3C15.7 5 12.9 3 9.5 3zM7 8.4a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zm5 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zM22 14c0-3-2.9-5.4-6.4-5.4S9.2 11 9.2 14s2.9 5.4 6.4 5.4c.7 0 1.3-.1 1.9-.3l2.1 1.1-.6-1.9A5.2 5.2 0 0 0 22 14zm-8.5-.9a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6zm4.2 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6z"/></svg>';

  function wxpaySheet(c) {
    return `
    <div class="sheet-mask" id="wxMask" onclick="if(event.target===this)App.closeWxpay()">
      <div class="sheet wxpay">
        <div class="wx-head"><span class="wx-close" onclick="App.closeWxpay()">✕</span>微信支付</div>
        <div class="wx-amount"><span class="y">¥</span>${c.price}.00</div>
        <div class="wx-sub">资金由平台监管账户托管 · 按课时结算</div>
        <div class="wx-rows">
          <div class="wx-row"><span class="k">商户</span><span class="v">天府通未来教育中心</span></div>
          <div class="wx-row"><span class="k">商品</span><span class="v">${esc(c.name)}（课程报名费）</span></div>
          <div class="wx-row"><span class="k">支付方式</span><span class="v wx-method">${wxLogo}零钱</span></div>
        </div>
        <button class="wx-btn" id="wxPayBtn" onclick="App.confirmWxpay('${c.id}')">确认支付</button>
      </div>
    </div>`;
  }

  function submitEnroll(id) {
    if ($('#enrollBtn').disabled) return;
    const btn = $('#wxPayBtn');
    btn.disabled = false;
    btn.textContent = '确认支付';
    $('#wxMask').classList.add('show');
  }

  function closeWxpay() {
    const m = $('#wxMask');
    if (m) m.classList.remove('show');
  }

  function confirmWxpay(id) {
    const btn = $('#wxPayBtn');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '支付中…';
    setTimeout(() => {
      btn.textContent = '✓ 支付成功';
      setTimeout(() => { closeWxpay(); go('#/preauth/' + id); }, 600);
    }, 900);
  }

  /* ============================================================
   * 屏幕 5：报名缴费成功页（资金托管）
   * ============================================================ */
  function screenPreauth(id) {
    const c = courseById(id) || DB.courses[0];
    const cls = enrollClass && (c.classes || []).includes(enrollClass) ? enrollClass : null;
    const seatBase = cls || c;
    const enrolledNow = seatBase.enrolled + 1;
    render(`
    <div class="screen">
      ${navbar('报名结果', { back: false })}
      <div class="scroll">
        <div class="result-hero preauth">
          <div class="ok">${I.checkBig}</div>
          <h2>报名成功 · 费用已托管</h2>
          <p>名额已锁定 · 资金由平台监管账户托管</p>
        </div>

        <div class="card mx mt pad">
          <div class="row between" style="margin-bottom:4px">
            <div class="bold">${esc(c.name)}</div>
            <span class="badge st-info">待成班</span>
          </div>
          ${cls ? `<div class="kv"><span class="k">报名班级</span><span class="v"><b>${esc(cls.name)}</b> · ${esc(cls.time)}</span></div>
          <div class="kv"><span class="k">上课地点</span><span class="v">${esc(cls.place)}</span></div>` : ''}
          <div class="kv"><span class="k">已付金额</span><span class="v"><b style="color:var(--orange-deep)">¥${c.price}</b> <span class="small muted">（托管中）</span></span></div>
          <div class="kv"><span class="k">成班条件</span><span class="v">满 ${c.minClass} 人开班 · 未成班自动退款</span></div>
          <div class="kv"><span class="k">当前报名</span><span class="v">${enrolledNow} 人 / 最大 ${seatBase.maxSeats} 人</span></div>
          <div class="seat-bar" style="margin-top:4px"><i style="width:${Math.round((enrolledNow / seatBase.maxSeats) * 100)}%"></i></div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">接下来</div>
          <div class="steps">
            <div class="stp done"><div class="dot">${I.check}</div>报名</div>
            <div class="stp done"><div class="dot">${I.check}</div>缴费托管</div>
            <div class="stp cur"><div class="dot">3</div>待成班</div>
            <div class="stp"><div class="dot">4</div>排课上课</div>
            <div class="stp"><div class="dot">5</div>结课确认</div>
          </div>
          <div class="small muted" style="line-height:1.7">达到成班人数后，学校 / 运营方将安排老师、教室和上课时间，并通过天府通通知你。</div>
        </div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <button class="btn btn-ghost" style="flex:1" onclick="location.hash='#/orders'">查看报名状态</button>
        <button class="btn btn-primary" style="flex:1" onclick="location.hash='#/home'">返回课程首页</button>
      </div>
    </div>`);
  }

  /* ============================================================
   * 屏幕 6：我的报名
   * ============================================================ */
  function screenOrders() {
    const card = (o) => {
      const st = DB.statusMap[o.status];
      const isPay = o.status === 'to-confirm';
      const orderMeta = {
        'to-preauth': '待支付',
        preauth: '已缴费（托管中）',
        forming: `待成班 · ${o.enrolled || 0}/${o.minClass || '-'} 人`,
        formed: '已成班 · 待排课',
        scheduled: '已排课 · 请按时上课',
        ongoing: '上课中 · 按课时记录',
        done: '已完成',
        canceled: '已取消',
      }[o.status] || '已缴费（托管中）';
      return `
      <div class="card mx mt">
        <div class="pad">
          <div class="row" style="gap:12px">
            <div style="width:54px;height:54px;border-radius:12px;overflow:hidden;flex-shrink:0">${coverImg(o.cover, o.courseName)}</div>
            <div style="flex:1;min-width:0">
              <div class="row between"><div class="bold">${esc(o.courseName)}</div><span class="badge ${st.cls}">${st.label}</span></div>
              <div class="small muted" style="margin-top:3px">${esc(o.school)}</div>
              <div class="small muted">${esc(o.place || '上课地点待定')}</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="row between">
            <div class="small">
              ${isPay
                ? `<span class="muted">待确认</span> <b style="color:var(--orange-deep)">¥${o.amount}</b> · 老师已上传学习成果`
                : `<span class="muted">${orderMeta}</span> <b>¥${o.amount}</b>`}
            </div>
            ${isPay
              ? `<button class="btn btn-primary btn-sm" onclick="location.hash='#/result/${o.id}'">查看并确认</button>`
              : o.result
                ? `<button class="btn btn-line btn-sm" onclick="location.hash='#/result/${o.id}'">查看成果</button>`
                : `<button class="btn btn-line btn-sm" onclick="location.hash='#/schedule/${o.id}'">查看详情</button>`}
          </div>
        </div>
      </div>`;
    };
    render(`
    <div class="screen has-tabbar">
      ${navbar('我的报名', { back: false })}
      <div class="scroll">
        ${DB.orders.length ? DB.orders.map(card).join('') : '<div class="empty">还没有报名记录</div>'}
        <div class="mx mt small muted center" style="padding:8px 0">报名状态：待支付 / 已缴费 / 待成班 / 已成班 / 已排课 / 上课中 / 待确认 / 已完成</div>
      </div>
      ${tabbar('orders')}
    </div>`);
  }

  /* ============================================================
   * 屏幕 7：上课安排页
   * ============================================================ */
  function screenSchedule(id) {
    const o = orderById(id);
    if (!o) return screenOrders();
    const st = DB.statusMap[o.status];
    render(`
    <div class="screen">
      ${navbar('上课安排')}
      <div class="scroll">
        <div class="card mx mt pad">
          <div class="row between" style="margin-bottom:6px">
            <div class="bold" style="font-size:17px">${esc(o.courseName)}</div>
            <span class="badge ${st.cls}">${st.label}</span>
          </div>
          <div class="kv"><span class="k">上课时间</span><span class="v">${esc(o.time)}</span></div>
          <div class="kv"><span class="k">上课地点</span><span class="v">${esc(o.place)}</span></div>
          <div class="kv"><span class="k">任课老师</span><span class="v">${esc(o.teacher)}</span></div>
          <div class="kv"><span class="k">课时安排</span><span class="v">共 ${o.lessons} 次</span></div>
          <div class="kv"><span class="k">开课时间</span><span class="v">${esc(o.startDate || '待定')}</span></div>
        </div>

        <div class="mx mt"><div class="notice"><b>当前状态：${st.label}。</b>课程已完成排课，请按上课时间到「${esc(o.place)}」上课。课程结束后，老师将上传学习成果。</div></div>

        <div class="card mx mt pad">
          <div class="section-title">课程安排（共 ${o.lessons} 次）</div>
          <div class="gap6">
            ${(o.schedule || []).map((t, i) => `
              <div class="row" style="gap:10px;padding:9px 0;border-bottom:1px solid var(--line)">
                <span style="width:24px;height:24px;border-radius:50%;background:var(--orange-soft);color:var(--orange-deep);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</span>
                <span class="small">${esc(t.replace(/^第 \d+ 次：/, ''))}</span>
              </div>`).join('')}
          </div>
        </div>
        <div style="height:14px"></div>
      </div>
    </div>`);
  }

  /* ============================================================
   * 屏幕 8a：学习成果列表（按课程分列，所有已出成果的报名）
   * ============================================================ */
  function screenResults() {
    const list = DB.orders.filter((o) => o.result);
    const card = (o) => {
      const st = DB.statusMap[o.status];
      const isPay = o.status === 'to-confirm';
      const r = o.result;
      return `
      <div class="card mx mt" onclick="location.hash='#/result/${o.id}'">
        <div class="pad">
          <div class="row" style="gap:12px">
            <div style="width:54px;height:54px;border-radius:12px;overflow:hidden;flex-shrink:0">${coverImg(o.cover, o.courseName)}</div>
            <div style="flex:1;min-width:0">
              <div class="row between"><div class="bold">${esc(o.courseName)}</div><span class="badge ${st.cls}">${st.label}</span></div>
              <div class="small muted" style="margin-top:3px">${esc(r.studentName)} · 完成 ${r.finished}/${r.total} 课时</div>
              <div class="small muted">作品：${esc(r.work.title)}</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="row between">
            <div class="small">
              ${isPay
                ? `<span class="muted">待付款</span> <b style="color:var(--orange-deep)">¥${o.amount}</b>`
                : `<span class="muted">已完成</span> <b>¥${o.amount}</b>`}
            </div>
            <span class="btn ${isPay ? 'btn-primary' : 'btn-line'} btn-sm">${isPay ? '查看并付款' : '查看成果'}</span>
          </div>
        </div>
      </div>`;
    };
    render(`
    <div class="screen">
      ${navbar('学习成果')}
      <div class="scroll">
        ${list.length ? list.map(card).join('') : '<div class="empty">还没有学习成果</div>'}
        <div class="mx mt small muted center" style="padding:8px 0">老师上传学习成果后，可在此按课程查看作品与评价并确认付款</div>
      </div>
    </div>`);
  }

  /* ============================================================
   * 屏幕 8：学习成果详情页
   * ============================================================ */
  function screenResult(id) {
    const o = orderById(id);
    if (!o || !o.result) { toast('暂无学习成果'); return screenOrders(); }
    const r = o.result;
    const st = DB.statusMap[o.status] || DB.statusMap.done;
    const done = o.status === 'done';
    render(`
    <div class="screen">
      ${navbar('学习成果')}
      <div class="scroll">
        <div class="card mx mt pad">
          <div class="row between"><div class="bold" style="font-size:17px">${esc(o.courseName)}</div><span class="badge ${st.cls}">${st.label}</span></div>
          <div class="small muted" style="margin-top:4px">学生：${esc(r.studentName)} · ${esc(currentStudent().school)}</div>
          <div class="divider"></div>
          <div class="stat3">
            <div class="s"><div class="n">${r.finished}/${r.total}</div><div class="l">完成课时</div></div>
            <div class="s"><div class="n">${r.attendance}</div><div class="l">出勤次数</div></div>
            <div class="s"><div class="n">${r.leave}</div><div class="l">请假次数</div></div>
          </div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">老师评语</div>
          <div class="comment-text small">
            ${String(r.teacherComment).split('\n').map((p) => `<p>${esc(p)}</p>`).join('')}
          </div>
          ${(r.commentImages || []).length ? `
          <div class="comment-pics">
            ${r.commentImages.map((src) => `<div class="cp"><img src="${src}" alt="课堂图片" loading="lazy"></div>`).join('')}
          </div>` : ''}
        </div>
        <div style="height:14px"></div>
      </div>
      ${done
        ? ''
        : `<div class="actionbar" style="flex-direction:column;gap:8px">
        <div class="small muted center">若 3 天内未确认，系统将自动确认</div>
        <button class="btn btn-primary" onclick="App.confirmPay('${o.id}')">确认详情</button>
        <button class="btn btn-ghost" style="height:40px" onclick="App.openAftersale()">有问题，发起售后</button>
      </div>
      ${aftersaleSheet()}`}
    </div>`);
  }

  function confirmPay(id) {
    go('#/paid/' + id);
  }

  /* ============================================================
   * 屏幕 9：确认付款成功页
   * ============================================================ */
  function screenPaid(id) {
    const o = orderById(id) || DB.orders[1];
    render(`
    <div class="screen">
      ${navbar('确认结果', { back: false })}
      <div class="scroll">
        <div class="result-hero">
          <div class="ok">${I.checkBig}</div>
          <h2>确认成功</h2>
          <p>课程已完成 · 托管费用将按课时结算给机构</p>
        </div>
        <div class="card mx mt pad">
          <div class="kv"><span class="k">课程</span><span class="v bold">${esc(o.courseName)}</span></div>
          <div class="kv"><span class="k">学生</span><span class="v">${esc(currentStudent().name)}</span></div>
          <div class="kv"><span class="k">课程费用</span><span class="v price"><span class="yen">¥</span><span class="num">${o.amount}</span></span></div>
          <div class="kv"><span class="k">支付方式</span><span class="v">报名时已支付（平台托管）</span></div>
          <div class="kv"><span class="k">订单状态</span><span class="v"><span class="badge st-done">已完成</span></span></div>
        </div>
        <div class="mx mt small muted center">对课程有什么想说的？欢迎评价（与付款无关，仅用于课程改进）</div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <button class="btn btn-ghost" style="flex:1" onclick="location.hash='#/home'">返回首页</button>
        <button class="btn btn-primary" style="flex:1" onclick="App.openReview()">评价课程</button>
      </div>
      ${reviewSheet(o)}
    </div>`);
  }

  /* ---------- 课程评价弹层（与付款解绑，独立提交） ---------- */
  let reviewStars = 5;
  function reviewSheet(o) {
    return `
    <div class="sheet-mask" id="rvMask" onclick="if(event.target===this)App.closeReview()">
      <div class="sheet">
        <div class="handle"></div>
        <h3>评价课程</h3>
        <div class="small muted" style="margin-bottom:10px">${esc(o.courseName)} · 评价不影响付款与结算</div>
        <div class="rv-stars" id="rvStars">
          ${[1, 2, 3, 4, 5].map((n) => `<span class="rv-star on" onclick="App.setStars(${n})">${I.star}</span>`).join('')}
        </div>
        <textarea class="field" rows="3" id="rvText" placeholder="说说孩子的上课感受（选填）"></textarea>
        <div style="height:14px"></div>
        <button class="btn btn-primary" onclick="App.submitReview()">提交评价</button>
        <div style="height:8px"></div>
        <button class="btn btn-ghost" style="height:42px" onclick="App.closeReview()">暂不评价</button>
      </div>
    </div>`;
  }
  function openReview() { reviewStars = 5; setStars(5); $('#rvMask').classList.add('show'); }
  function closeReview() { $('#rvMask')?.classList.remove('show'); }
  function setStars(n) {
    reviewStars = n;
    document.querySelectorAll('#rvStars .rv-star').forEach((el, i) => el.classList.toggle('on', i < n));
  }
  function submitReview() {
    closeReview();
    toast(`评价已提交（${reviewStars} 星），感谢反馈`);
  }

  /* ============================================================
   * 屏幕 10：我的（个人中心）
   * ============================================================ */
  function screenMe() {
    const s = currentStudent();
    const cell = (color, icon, t, sub, onclick) =>
      `<div class="list-cell" onclick="${onclick || ''}"><div class="lc-ic" style="background:${color}">${icon}</div><div class="lc-t"><div>${t}</div><div class="small muted">${sub}</div></div><span class="arr">${I.arrow}</span></div>`;
    render(`
    <div class="screen has-tabbar">
      ${navbar('我的', { back: false })}
      <div class="scroll">
        <div style="padding-top:0">
          <div class="profile-hero" onclick="location.hash='#/profile'">
            ${avatarImg(null, DB.parent.avatar, DB.parent.nickname)}
            <div style="flex:1">
              <div style="font-size:19px;font-weight:700">${esc(DB.parent.nickname)}</div>
              <div class="small" style="opacity:.92">${esc(DB.parent.phone)}${DB.parent.wechatBound ? ' · 已绑定微信' : ''}</div>
            </div>
            <span class="arr" style="color:rgba(255,255,255,.8)">${I.arrow}</span>
          </div>
        </div>
        <div class="card mx mt" style="overflow:hidden">
          <div class="current-student-cell" onclick="location.hash='#/students'">
            ${avatarImg(s.avatarImage, s.avatar, s.name)}
            <div class="cs-main">
              <div class="cs-title">当前学生</div>
              <div class="cs-name">${esc(s.name)} <span class="tag">${esc(s.grade)}</span></div>
              <div class="small muted" style="margin-top:2px">${esc(s.school)}</div>
            </div>
            <span class="arr">${I.arrow}</span>
          </div>
        </div>
        <div class="card mx mt" style="overflow:hidden">
          ${cell('#f59b1c', I.help, '帮助中心', '先学后付怎么用？', "App.soonTip()")}
          ${cell('#8a8f99', I.service, '客服与售后', '在线咨询', "App.soonTip()")}
        </div>
        <div class="mx mt small muted center" style="padding:14px 0;user-select:none" onclick="App.adminTap()">天府通未来教育中心</div>
      </div>
      ${tabbar('me')}
    </div>`);
  }

  /* ============================================================
   * 屏幕 11：学生管理（切换 / 添加 / 编辑 / 删除）
   * ============================================================ */
  /* 平台合作学校（后台入库名单，学生学校只能从中选择，防止手填虚假信息） */
  const SCHOOLS = ['成都天府新区实验小学', '成都天府新区第七小学', '成都麓湖小学', '成都华阳实验小学'];

  let pendingDeleteId = null;
  function screenStudents() {
    const cur = currentStudent();
    pendingDeleteId = null;
    const card = (stu) => {
      const active = stu.id === cur.id;
      return `
      <div class="card mx mt" style="overflow:hidden">
        <div class="student-option ${active ? 'active' : ''}" onclick="App.switchStudent('${stu.id}')">
          ${avatarImg(stu.avatarImage, stu.avatar, stu.name)}
          <div class="so-main">
            <div class="so-name">${esc(stu.name)} <span class="tag ${active ? '' : 'gray'}">${esc(stu.grade)}</span></div>
            <div class="so-sub">${esc(stu.school)}</div>
          </div>
          <div class="so-state">${active ? '当前' : '切换'}</div>
        </div>
        <div class="row" style="gap:8px;justify-content:flex-end;padding:0 14px 12px">
          <button class="btn btn-line btn-sm" onclick="event.stopPropagation();App.editStudent('${stu.id}')">编辑</button>
          <button class="btn btn-sm btn-danger-line" id="del-${stu.id}" onclick="event.stopPropagation();App.deleteStudent('${stu.id}')">删除</button>
        </div>
      </div>`;
    };
    render(`
    <div class="screen">
      ${navbar('学生管理')}
      <div class="scroll">
        <div class="mx mt small muted">点击学生卡片可切换当前学生，报名与成果均按当前学生展示</div>
        ${(DB.students || []).map(card).join('')}
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <button class="btn btn-primary" onclick="App.openStudentForm()">＋ 添加孩子</button>
      </div>
      ${studentFormSheet()}
    </div>`);
  }

  function studentFormSheet() {
    return `
    <div class="sheet-mask" id="stuFormMask" onclick="if(event.target===this)App.closeStudentForm()">
      <div class="sheet">
        <div class="handle"></div>
        <h3 id="stuFormTitle">添加孩子</h3>
        <input type="hidden" id="stuFormId" value="">
        <div class="form-row"><label>学生姓名</label><input class="input" id="stuName" placeholder="请输入学生姓名"></div>
        <div class="form-row"><label>所在学校 <span class="muted">（从平台合作学校中选择）</span></label>
          <select class="input" id="stuSchool">
            <option value="">请选择学校</option>
            ${SCHOOLS.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row"><label>年级班级</label><input class="input" id="stuGrade" placeholder="如：三年级 2 班"></div>
        <div style="height:16px"></div>
        <button class="btn btn-primary" onclick="App.saveStudentForm()">保存</button>
        <div style="height:8px"></div>
        <button class="btn btn-ghost" style="height:42px" onclick="App.closeStudentForm()">取消</button>
      </div>
    </div>`;
  }

  function openStudentForm() {
    $('#stuFormTitle').textContent = '添加孩子';
    $('#stuFormId').value = '';
    $('#stuName').value = '';
    $('#stuSchool').value = currentStudent().school || '';
    $('#stuGrade').value = '';
    $('#stuFormMask').classList.add('show');
  }

  function editStudent(id) {
    const stu = (DB.students || []).find((x) => x.id === routeId(id));
    if (!stu) return;
    $('#stuFormTitle').textContent = '编辑孩子';
    $('#stuFormId').value = stu.id;
    $('#stuName').value = stu.name;
    $('#stuSchool').value = stu.school;
    $('#stuGrade').value = stu.grade;
    $('#stuFormMask').classList.add('show');
  }

  function closeStudentForm() { $('#stuFormMask')?.classList.remove('show'); }

  function saveStudentForm() {
    const id = $('#stuFormId').value;
    const name = $('#stuName').value.trim();
    const school = $('#stuSchool').value.trim();
    const grade = $('#stuGrade').value.trim();
    if (!name) return toast('请输入学生姓名');
    if (!school) return toast('请输入学校名称');
    if (!grade) return toast('请输入年级班级');
    if (id) {
      const stu = DB.students.find((x) => x.id === id);
      if (stu) Object.assign(stu, { name, school, grade, avatar: name.slice(0, 1) });
    } else {
      DB.students.push({
        id: 'stu-' + Date.now(), name, school, grade,
        avatar: name.slice(0, 1), parentPhone: DB.parent.phone,
      });
    }
    syncCurrentStudent();
    persistState();
    closeStudentForm();
    screenStudents();
    toast(id ? '已保存修改' : '已添加 ' + name);
  }

  function deleteStudent(id) {
    id = routeId(id);
    if ((DB.students || []).length <= 1) return toast('至少保留 1 个孩子');
    const btn = $('#del-' + id);
    if (pendingDeleteId !== id) {
      pendingDeleteId = id;
      if (btn) btn.textContent = '确认删除';
      toast('再次点击确认删除');
      return;
    }
    const stu = DB.students.find((x) => x.id === id);
    DB.students = DB.students.filter((x) => x.id !== id);
    if (DB.currentStudentId === id) DB.currentStudentId = DB.students[0].id;
    pendingDeleteId = null;
    syncCurrentStudent();
    persistState();
    screenStudents();
    toast('已删除 ' + (stu ? stu.name : ''));
  }

  /* ============================================================
   * 屏幕 12：家长信息（头像 / 昵称 / 电话 / 改密 / 微信绑定）
   * ============================================================ */
  const AVATAR_CHOICES = ['李', '👨', '👩', '🧑‍🎓', '🐻', '🐱'];
  let profileAvatar = '';
  function screenProfile() {
    const p = DB.parent;
    profileAvatar = p.avatar;
    render(`
    <div class="screen">
      ${navbar('家长信息')}
      <div class="scroll">
        <div class="card mx mt pad">
          <div class="section-title">头像</div>
          <div class="ava-picker">
            ${AVATAR_CHOICES.map((a) => `
              <div class="ava-opt ${a === p.avatar ? 'on' : ''}" onclick="App.pickAvatar('${a}', this)">${a}</div>`).join('')}
          </div>
          <div class="form-row"><label>昵称</label><input class="input" id="pfNick" value="${esc(p.nickname)}" placeholder="请输入昵称"></div>
          <div class="form-row"><label>手机号</label><input class="input" id="pfPhone" value="${esc(p.phone)}" placeholder="请输入手机号"></div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">修改密码</div>
          <div class="form-row"><label>新密码</label><input class="input" type="password" id="pfPwd1" placeholder="不修改请留空"></div>
          <div class="form-row"><label>确认新密码</label><input class="input" type="password" id="pfPwd2" placeholder="再次输入新密码"></div>
        </div>

        <div class="card mx mt" style="overflow:hidden">
          <div class="list-cell" onclick="App.toggleWxBind()">
            <div class="lc-ic" style="background:#07c160">${wxLogo.replace('fill="#07c160"', 'fill="#fff"')}</div>
            <div class="lc-t"><div>微信账号</div><div class="small muted">${p.wechatBound ? '已绑定，可微信一键登录' : '未绑定'}</div></div>
            <span class="small" style="color:${p.wechatBound ? 'var(--muted)' : 'var(--orange-deep)'};flex-shrink:0">${p.wechatBound ? '解绑' : '去绑定'}</span>
          </div>
        </div>

        <div class="mx mt">
          <button class="btn btn-ghost" style="color:var(--red)" onclick="App.logout()">退出登录</button>
        </div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <button class="btn btn-primary" onclick="App.saveProfile()">保存</button>
      </div>
    </div>`);
  }

  function pickAvatar(a, el) {
    profileAvatar = a;
    document.querySelectorAll('.ava-opt').forEach((x) => x.classList.remove('on'));
    el.classList.add('on');
  }

  function saveProfile() {
    const nick = $('#pfNick').value.trim();
    const phone = $('#pfPhone').value.trim();
    const p1 = $('#pfPwd1').value;
    const p2 = $('#pfPwd2').value;
    if (!nick) return toast('请输入昵称');
    if (!phone) return toast('请输入手机号');
    if (p1 || p2) {
      if (p1.length < 6) return toast('新密码至少 6 位');
      if (p1 !== p2) return toast('两次输入的密码不一致');
      DB.parent.password = p1;
    }
    Object.assign(DB.parent, { nickname: nick, phone: maskPhone(phone), avatar: profileAvatar });
    persistState();
    toast('已保存');
    setTimeout(() => go('#/me'), 500);
  }

  function toggleWxBind() {
    DB.parent.wechatBound = !DB.parent.wechatBound;
    persistState();
    toast(DB.parent.wechatBound ? '微信绑定成功' : '已解绑微信');
    screenProfile();
  }

  function logout() {
    DB.parent.loggedIn = false;
    persistState();
    toast('已退出登录');
    go('#/login');
  }

  /* ============================================================
   * 屏幕 13：登录 / 注册（验证码 + 微信一键登录）
   * ============================================================ */
  const maskPhone = (ph) => /^1\d{10}$/.test(ph) ? ph.slice(0, 3) + '****' + ph.slice(7) : ph;
  let smsTimer = null;
  function screenLogin() {
    if (smsTimer) { clearInterval(smsTimer); smsTimer = null; }
    render(`
    <div class="screen">
      <div class="scroll">
        <div class="login-hero">
          <div class="login-logo">${I.cap}</div>
          <h2>天府通未来教育中心</h2>
          <p class="small muted">校内课后延时服务 · 家长端</p>
        </div>
        <div class="card mx pad">
          <div class="form-row"><label>手机号</label><input class="input" id="lgPhone" type="tel" maxlength="11" placeholder="请输入 11 位手机号"></div>
          <div class="form-row"><label>验证码</label>
            <div class="code-row">
              <input class="input" id="lgCode" type="tel" maxlength="4" placeholder="请输入验证码">
              <button class="btn btn-line code-btn" id="lgSend" onclick="App.sendCode()">获取验证码</button>
            </div>
          </div>
          <div style="height:16px"></div>
          <button class="btn btn-primary" onclick="App.doLogin()">登录 / 注册</button>
          <div class="small muted center" style="margin-top:10px">未注册的手机号验证后将自动创建账号并绑定</div>
        </div>

        <div class="login-divider mx"><span>其他登录方式</span></div>
        <div class="mx">
          <button class="btn wx-login-btn" onclick="App.wxLogin(this)">${wxLogo.replace('fill="#07c160"', 'fill="#fff"')} 微信一键登录</button>
        </div>
        <div class="mx mt small muted center" style="padding:12px 0">登录即代表同意《用户协议》与《隐私政策》</div>
      </div>
    </div>`);
  }

  let sentCode = '';
  function sendCode() {
    const phone = $('#lgPhone').value.trim();
    if (!/^1\d{10}$/.test(phone)) return toast('请输入正确的 11 位手机号');
    sentCode = '1234';
    toast('验证码已发送：1234（演示）');
    const btn = $('#lgSend');
    let sec = 60;
    btn.disabled = true;
    btn.textContent = sec + 's';
    smsTimer = setInterval(() => {
      sec -= 1;
      if (sec <= 0) { clearInterval(smsTimer); smsTimer = null; btn.disabled = false; btn.textContent = '重新获取'; return; }
      btn.textContent = sec + 's';
    }, 1000);
  }

  function doLogin() {
    const phone = $('#lgPhone').value.trim();
    const code = $('#lgCode').value.trim();
    if (!/^1\d{10}$/.test(phone)) return toast('请输入正确的 11 位手机号');
    if (!sentCode) return toast('请先获取验证码');
    if (code !== sentCode) return toast('验证码不正确');
    Object.assign(DB.parent, { loggedIn: true, phone: maskPhone(phone) });
    persistState();
    toast('登录成功');
    go('#/me');
  }

  function wxLogin(btn) {
    if (btn) { btn.disabled = true; btn.textContent = '微信授权中…'; }
    setTimeout(() => {
      Object.assign(DB.parent, { loggedIn: true, wechatBound: true });
      persistState();
      toast('微信登录成功');
      go('#/me');
    }, 900);
  }

  /* ============================================================
   * 售后弹层
   * ============================================================ */
  let aftersaleSel = -1;
  function aftersaleSheet() {
    return `
    <div class="sheet-mask" id="asMask" onclick="if(event.target===this)App.closeAftersale()">
      <div class="sheet">
        <div class="handle"></div>
        <h3>发起售后</h3>
        <div class="small muted" style="margin-bottom:8px">请选择问题类型</div>
        ${DB.aftersaleTypes.map((t, i) => `
          <div class="opt" id="opt${i}" onclick="App.selectAS(${i})"><span>${esc(t)}</span><span class="radio"></span></div>`).join('')}
        <textarea class="field" rows="3" placeholder="请输入问题描述（选填）"></textarea>
        <div style="height:14px"></div>
        <button class="btn btn-primary" onclick="App.submitAftersale()">提交售后申请</button>
        <div style="height:8px"></div>
        <button class="btn btn-ghost" style="height:42px" onclick="App.closeAftersale()">取消</button>
      </div>
    </div>`;
  }
  function openAftersale() { aftersaleSel = -1; $('#asMask').classList.add('show'); }
  function closeAftersale() { const m = $('#asMask'); if (m) m.classList.remove('show'); }
  function selectAS(i) {
    aftersaleSel = i;
    DB.aftersaleTypes.forEach((_, j) => $('#opt' + j).classList.toggle('on', i === j));
  }
  function submitAftersale() {
    if (aftersaleSel < 0) return toast('请选择问题类型');
    closeAftersale();
    toast('售后申请已提交，平台将在 1-3 个工作日内处理');
  }

  /* 隐藏调试入口：连点页脚「天府通未来教育中心」2 次打开后台管理 */
  let adminTaps = 0, adminTapTimer = null;
  function adminTap() {
    adminTaps += 1;
    clearTimeout(adminTapTimer);
    adminTapTimer = setTimeout(() => { adminTaps = 0; }, 1500);
    if (adminTaps >= 2) {
      adminTaps = 0;
      window.open('admin/', '_blank');
    }
  }

  function switchStudent(id) {
    const next = (DB.students || []).find((s) => s.id === routeId(id));
    if (!next) return toast('未找到学生信息');
    if (next.id === DB.currentStudentId) return;
    DB.currentStudentId = next.id;
    try { localStorage.setItem('futureEdu.currentStudentId', next.id); } catch (_) {}
    syncCurrentStudent();
    persistState();
    route();
    toast('已切换为 ' + next.name);
  }

  /* ============================================================
   * 路由
   * ============================================================ */
  const routes = [
    [/^#\/?$|^#\/home$|^#\/tft$/, screenHome],
    [/^#\/course\/(.+)$/, (m) => screenCourse(m[1])],
    [/^#\/enroll\/([^/]+)\/([^/]+)$/, (m) => screenEnroll(m[1], m[2])],
    [/^#\/enroll\/([^/]+)$/, (m) => screenEnroll(m[1])],
    [/^#\/preauth\/(.+)$/, (m) => screenPreauth(m[1])],
    [/^#\/orders$/, screenOrders],
    [/^#\/schedule\/(.+)$/, (m) => screenSchedule(m[1])],
    [/^#\/results$/, screenResults],
    [/^#\/result\/(.+)$/, (m) => screenResult(m[1])],
    [/^#\/paid\/(.+)$/, (m) => screenPaid(m[1])],
    [/^#\/me$/, screenMe],
    [/^#\/students$/, screenStudents],
    [/^#\/profile$/, screenProfile],
    [/^#\/login$/, screenLogin],
  ];
  function route() {
    const h = location.hash || '#/';
    if (!DB.parent.loggedIn && /^#\/(me|students|profile)/.test(h)) return screenLogin();
    for (const [re, fn] of routes) {
      const m = h.match(re);
      if (m) return fn(m);
    }
    screenHome();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);

  /* 暴露给内联事件 */
  window.App = {
    toggleEnrollConfirm, submitEnroll, closeWxpay, confirmWxpay, confirmPay, switchStudent, openSwitchSheet, closeSwitchSheet, adminTap, soonTip: () => toast('功能开发中'),
    openSkuSheet, closeSkuSheet, selectSku, confirmSku,
    openReview, closeReview, setStars, submitReview,
    openAftersale, closeAftersale, selectAS, submitAftersale,
    openStudentForm, closeStudentForm, editStudent, saveStudentForm, deleteStudent,
    pickAvatar, saveProfile, toggleWxBind, logout, sendCode, doLogin, wxLogin,
  };
  route();
})();
