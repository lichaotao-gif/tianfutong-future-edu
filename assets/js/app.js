/* ============================================================
 * 天府通 · 未来教育 — 家长端
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
  try {
    const savedStudentId = localStorage.getItem('futureEdu.currentStudentId');
    if ((DB.students || []).some((s) => s.id === savedStudentId)) DB.currentStudentId = savedStudentId;
  } catch (_) {}
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

    render(`
    <div class="screen has-tabbar">
      <div class="scroll">
        <div style="padding-top:env(safe-area-inset-top);background:var(--orange-grad)">
          <div class="student-hero">
            ${avatarImg(s.avatarImage, s.avatar, s.name)}
            <div class="info">
              <div class="nm">${esc(s.name)} <span class="school-pill">${esc(s.grade)}</span></div>
              <div class="sc">${esc(s.school)}</div>
            </div>
          </div>
        </div>

        <div class="mx" style="margin-top:-2px;padding-top:12px">
          <div class="quick2">
            <div class="qi" onclick="location.hash='#/orders'">
              <div class="qc" style="background:var(--blue)">${I.clip}</div>
              <div><div class="qt">我的报名</div><div class="qd">报名 / 成班进度</div></div>
            </div>
            <div class="qi" onclick="location.hash='#/results'">
              <div class="qc" style="background:var(--green)">${I.award}</div>
              <div><div class="qt">学习成果</div><div class="qd">作品 / 评价</div></div>
            </div>
          </div>
        </div>

        <div class="mx mt"><div class="section-title">本校可报名课程</div></div>
        ${DB.courses.map(courseCard).join('')}
      </div>
      ${tabbar('home')}
    </div>`);
  }

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
            <div class="kv"><span class="k">上课时间</span><span class="v">${esc(c.time)}</span></div>
            <div class="kv"><span class="k">课时数量</span><span class="v">共 ${c.lessons} 次</span></div>
            <div class="kv"><span class="k">成班人数</span><span class="v">满 ${c.minClass} 人开班 · 最大 ${c.maxSeats} 人</span></div>
            <div class="kv"><span class="k">当前报名</span><span class="v">${c.enrolled} 人 ${full ? '<span class="badge st-muted">已满员</span>' : ''}</span></div>
          </div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">课程介绍</div>
          <div class="small" style="color:#52565e;line-height:1.8">${esc(c.intro)}</div>
          ${teacherCard(c.teacher)}
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
            <b>先学后付 · 满意后付款</b><br/>
            报名时仅进行费用<b>预授权</b>，暂不正式扣款。学生完成课程后，老师上传学习成果，家长确认满意后再完成扣款。如在规定时间内未提出异议，系统默认课程完成并扣款。
          </div>
        </div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <div class="price" style="margin-right:auto"><span class="yen">¥</span><span class="num">${c.price}</span><span class="small muted"> /期</span></div>
        ${full
          ? '<button class="btn" disabled style="max-width:200px">已满员，无法报名</button>'
          : `<button class="btn btn-primary" style="max-width:200px" onclick="location.hash='#/enroll/${c.id}'">立即报名</button>`}
      </div>
    </div>`);
  }

  /* ============================================================
   * 屏幕 4：报名确认页
   * ============================================================ */
  let enrollConfirmed = false;
  function screenEnroll(id) {
    const c = courseById(id);
    if (!c) return screenHome();
    const s = currentStudent();
    enrollConfirmed = false;
    const ruleText = `我已阅读并同意《课程报名须知》，同意进行 ¥${c.price} 费用预授权；我已知晓未成班将自动取消报名并释放预授权，课程完成后可查看学习成果并确认付款。`;

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
          <div class="kv"><span class="k">上课时间</span><span class="v">${esc(c.time)}</span></div>
          <div class="kv"><span class="k">上课地点</span><span class="v">${esc(c.place)}</span></div>
          <div class="kv"><span class="k">报名截止</span><span class="v">2026 年 7 月 8 日</span></div>
          <div class="divider"></div>
          <div class="kv"><span class="k">课程费用</span><span class="v price"><span class="yen">¥</span><span class="num">${c.price}</span></span></div>
          <div class="kv"><span class="k">预授权金额</span><span class="v"><b style="color:var(--orange-deep)">¥${c.price}</b> <span class="small muted">（暂不扣款）</span></span></div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">规则确认</div>
          <div class="check" id="enrollConfirm" onclick="App.toggleEnrollConfirm()">
            <span class="box">${I.check}</span><span>${esc(ruleText)}</span>
          </div>
        </div>

        <div class="mx mt"><div class="notice"><b>预授权说明：</b>确认后将向你的天府通账户发起 ¥${c.price} 预授权（冻结，不扣款），用于锁定名额；成班并完成课程、你确认满意后才正式扣款。</div></div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <button class="btn btn-primary" id="enrollBtn" disabled onclick="App.submitEnroll('${c.id}')">确认报名并预授权</button>
      </div>
    </div>`);
  }

  function toggleEnrollConfirm() {
    enrollConfirmed = !enrollConfirmed;
    $('#enrollConfirm').classList.toggle('on', enrollConfirmed);
    $('#enrollBtn').disabled = !enrollConfirmed;
  }

  function submitEnroll(id) {
    const btn = $('#enrollBtn');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '预授权处理中…';
    setTimeout(() => go('#/preauth/' + id), 800);
  }

  /* ============================================================
   * 屏幕 5：预授权成功页
   * ============================================================ */
  function screenPreauth(id) {
    const c = courseById(id) || DB.courses[0];
    const enrolledNow = c.enrolled + 1;
    render(`
    <div class="screen">
      ${navbar('报名结果', { back: false })}
      <div class="scroll">
        <div class="result-hero preauth">
          <div class="ok">${I.checkBig}</div>
          <h2>报名已提交 · 预授权成功</h2>
          <p>名额已锁定，款项暂未扣除</p>
        </div>

        <div class="card mx mt pad">
          <div class="row between" style="margin-bottom:4px">
            <div class="bold">${esc(c.name)}</div>
            <span class="badge st-info">待成班</span>
          </div>
          <div class="kv"><span class="k">预授权金额</span><span class="v"><b style="color:var(--orange-deep)">¥${c.price}</b></span></div>
          <div class="kv"><span class="k">成班条件</span><span class="v">满 ${c.minClass} 人开班</span></div>
          <div class="kv"><span class="k">当前报名</span><span class="v">${enrolledNow} 人 / 最大 ${c.maxSeats} 人</span></div>
          <div class="seat-bar" style="margin-top:4px"><i style="width:${Math.round((enrolledNow / c.maxSeats) * 100)}%"></i></div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">接下来</div>
          <div class="steps">
            <div class="stp done"><div class="dot">${I.check}</div>报名</div>
            <div class="stp done"><div class="dot">${I.check}</div>预授权</div>
            <div class="stp cur"><div class="dot">3</div>待成班</div>
            <div class="stp"><div class="dot">4</div>排课上课</div>
            <div class="stp"><div class="dot">5</div>确认付款</div>
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
                ? `<span class="muted">待付款</span> <b style="color:var(--orange-deep)">¥${o.amount}</b> · 老师已上传学习成果`
                : `<span class="muted">已预授权</span> <b>¥${o.amount}</b>`}
            </div>
            ${isPay
              ? `<button class="btn btn-primary btn-sm" onclick="location.hash='#/result/${o.id}'">去查看并付款</button>`
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
        <div class="mx mt small muted center" style="padding:8px 0">报名状态：待预授权 / 已预授权 / 待成班 / 已成班 / 已排课 / 上课中 / 待确认付款 / 已完成</div>
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

        <div class="mx mt"><div class="notice"><b>当前状态：${st.label}。</b>课程已完成排课，请按上课时间到「${esc(o.place)}」上课。课程结束后，老师将上传学习成果，请留意天府通通知。</div></div>

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
          <div class="section-title">课堂照片</div>
          <div class="photos">
            ${r.photos.map((p, i) => `<div class="ph">${coverImg(['ai', 'code', 'art'][i % 3], p, 'cover-photo')}</div>`).join('')}
          </div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">学生作品</div>
          <div class="work-card">
            <div class="row" style="gap:12px">
              <div style="width:64px;height:64px;border-radius:10px;overflow:hidden;flex-shrink:0">${coverImg('art', r.work.title)}</div>
              <div><div class="wt">${esc(r.work.title)}</div><div class="small" style="color:#7a4a18;line-height:1.6">${esc(r.work.desc)}</div></div>
            </div>
          </div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">老师评语</div>
          <div class="small" style="color:#52565e;line-height:1.8">${esc(r.teacherComment)}</div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">费用明细</div>
          <div class="kv"><span class="k">课程费用</span><span class="v">¥${o.amount}</span></div>
          <div class="kv"><span class="k">支付方式</span><span class="v">${done ? '天府通支付' : '天府通预授权'}</span></div>
          <div class="kv"><span class="k">当前状态</span><span class="v"><span class="badge ${done ? 'st-done' : 'st-warn'}">${done ? '已完成' : '待家长确认'}</span></span></div>
        </div>
        <div style="height:14px"></div>
      </div>
      ${done
        ? `<div class="actionbar"><button class="btn btn-ghost" onclick="location.hash='#/results'">返回学习成果</button></div>`
        : `<div class="actionbar" style="flex-direction:column;gap:8px">
        <button class="btn btn-primary" onclick="App.confirmPay('${o.id}')">确认满意并付款 ¥${o.amount}</button>
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
      ${navbar('付款结果', { back: false })}
      <div class="scroll">
        <div class="result-hero">
          <div class="ok">${I.checkBig}</div>
          <h2>付款成功</h2>
          <p>订单已完成 · 感谢参与未来教育课后延时服务</p>
        </div>
        <div class="card mx mt pad">
          <div class="kv"><span class="k">课程</span><span class="v bold">${esc(o.courseName)}</span></div>
          <div class="kv"><span class="k">学生</span><span class="v">${esc(currentStudent().name)}</span></div>
          <div class="kv"><span class="k">支付金额</span><span class="v price"><span class="yen">¥</span><span class="num">${o.amount}</span></span></div>
          <div class="kv"><span class="k">支付方式</span><span class="v">天府通支付</span></div>
          <div class="kv"><span class="k">订单状态</span><span class="v"><span class="badge st-done">已完成</span></span></div>
        </div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <button class="btn btn-ghost" style="flex:1" onclick="location.hash='#/orders'">查看订单</button>
        <button class="btn btn-primary" style="flex:1" onclick="location.hash='#/home'">返回首页</button>
      </div>
    </div>`);
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
          <div class="profile-hero">
            ${avatarImg(s.avatarImage, s.avatar, s.name)}
            <div>
              <div style="font-size:19px;font-weight:700">${esc(s.name)} 家长</div>
              <div class="small" style="opacity:.92">${esc(s.parentPhone)}</div>
            </div>
          </div>
        </div>
        <div class="card mx mt" style="overflow:hidden">
          <div class="current-student-cell" onclick="App.openStudentSheet()">
            ${avatarImg(s.avatarImage, s.avatar, s.name)}
            <div class="cs-main">
              <div class="cs-title">当前学生</div>
              <div class="cs-name">${esc(s.name)} <span class="tag">${esc(s.grade)}</span></div>
            </div>
            <span class="arr">${I.arrow}</span>
          </div>
          ${cell('var(--orange)', I.school, '所在学校', s.school, '')}
        </div>
        <div class="card mx mt" style="overflow:hidden">
          ${cell('var(--green)', I.clip, '我的报名', '查看全部报名记录', "location.hash='#/orders'")}
          ${cell('#8a3dff', I.award, '学习成果', '作品与老师评价', "location.hash='#/results'")}
        </div>
        <div class="card mx mt" style="overflow:hidden">
          ${cell('#f59b1c', I.help, '帮助中心', '先学后付怎么用？', "App.soonTip()")}
          ${cell('#8a8f99', I.service, '客服与售后', '在线咨询', "App.soonTip()")}
        </div>
        <div class="mx mt small muted center" style="padding:14px 0">天府通 · 未来教育</div>
      </div>
      ${tabbar('me')}
      ${studentSheet()}
    </div>`);
  }

  function studentSheet() {
    const s = currentStudent();
    const students = DB.students || [s];
    return `
    <div class="sheet-mask" id="studentMask" onclick="if(event.target===this)App.closeStudentSheet()">
      <div class="sheet">
        <div class="handle"></div>
        <h3>切换学生</h3>
        <div class="student-sheet-sub">当前账号共 ${students.length} 个孩子</div>
        ${students.map((stu) => {
          const active = stu.id === s.id;
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
      </div>
    </div>`;
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

  function openStudentSheet() { $('#studentMask')?.classList.add('show'); }
  function closeStudentSheet() { $('#studentMask')?.classList.remove('show'); }

  function switchStudent(id) {
    const next = (DB.students || []).find((s) => s.id === routeId(id));
    if (!next) return toast('未找到学生信息');
    DB.currentStudentId = next.id;
    try { localStorage.setItem('futureEdu.currentStudentId', next.id); } catch (_) {}
    syncCurrentStudent();
    screenMe();
    toast('已切换为 ' + next.name);
  }

  /* ============================================================
   * 路由
   * ============================================================ */
  const routes = [
    [/^#\/?$|^#\/home$|^#\/tft$/, screenHome],
    [/^#\/course\/(.+)$/, (m) => screenCourse(m[1])],
    [/^#\/enroll\/(.+)$/, (m) => screenEnroll(m[1])],
    [/^#\/preauth\/(.+)$/, (m) => screenPreauth(m[1])],
    [/^#\/orders$/, screenOrders],
    [/^#\/schedule\/(.+)$/, (m) => screenSchedule(m[1])],
    [/^#\/results$/, screenResults],
    [/^#\/result\/(.+)$/, (m) => screenResult(m[1])],
    [/^#\/paid\/(.+)$/, (m) => screenPaid(m[1])],
    [/^#\/me$/, screenMe],
  ];
  function route() {
    const h = location.hash || '#/';
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
    toggleEnrollConfirm, submitEnroll, confirmPay, switchStudent, openStudentSheet, closeStudentSheet, soonTip: () => toast('功能开发中'),
    openAftersale, closeAftersale, selectAS, submitAftersale,
  };
  route();
})();
