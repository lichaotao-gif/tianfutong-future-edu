/* ============================================================
 * 天府通 · 未来教育 — 家长端 Demo
 * 纯前端 SPA（hash 路由 + 写死 mock 数据），无需后端
 * ============================================================ */
(function () {
  const DB = window.DB;
  const app = document.getElementById('app');

  /* ---------- 小工具 ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const go = (hash) => { location.hash = hash; };
  const courseById = (id) => DB.courses.find((c) => c.id === id);
  const orderById = (id) => DB.orders.find((o) => o.id === id);

  /* ---------- SVG 图标 ---------- */
  const I = {
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    checkBig: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    home: (a) => `<svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" ${a ? 'fill="currentColor"' : 'stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"'}/></svg>`,
    order: (a) => `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" ${a ? 'fill="currentColor"' : 'stroke="currentColor" stroke-width="1.8"'}/><path d="M9 8h6M9 12h6M9 16h4" stroke="${a ? '#fff' : 'currentColor'}" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    me: (a) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" ${a ? 'fill="currentColor"' : 'stroke="currentColor" stroke-width="1.8"'}/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" ${a ? 'fill="currentColor"' : 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"'}/></svg>`,
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2z" fill="#fff" opacity=".9"/><path d="M20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z" fill="#fff"/></svg>',
    star: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 3l2.6 5.6 6 .6-4.5 4 1.3 6L12 16.8 6.6 19.2l1.3-6-4.5-4 6-.6z"/></svg>',
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
            <div class="gitem"><div class="gicon gi-pink">${I.star}</div><div class="glabel">艺术</div></div>
            <div class="gitem"><div class="gicon gi-orange">${I.book}</div><div class="glabel">科技</div></div>
            <div class="gitem" onclick="location.hash='#/home'">
              <div class="gicon gi-future">${I.book}</div><div class="glabel" style="color:var(--orange-deep);font-weight:700">未来教育</div>
            </div>
          </div>
        </div>

        <div class="entry-banner mt" onclick="location.hash='#/home'">
          <div class="ico">${I.star}</div>
          <h3>未来教育</h3>
          <p>校内课后延时服务 · AI 启蒙 / 科学实验 / 艺术创意</p>
          <div class="entry-cta">立即选课 ${I.arrow}</div>
        </div>

        <div class="mx mt" style="font-size:13px;color:var(--muted);line-height:1.7">
          <b style="color:var(--orange-deep)">温馨提示：</b>未来教育为嵌入天府通的校内课后延时服务。家长登录后自动识别孩子所在学校，仅展示本校开放课程；报名先做费用预授权，学生完成课程、查看学习成果满意后再确认扣款。
        </div>

        <div class="mx mt small muted center" style="padding:20px 0 8px">— Demo 演示 · 点击「未来教育」进入家长端 —</div>
      </div>
    </div>`);
  }

  /* ============================================================
   * 屏幕 2：未来教育首页
   * ============================================================ */
  function screenHome() {
    const s = DB.student;
    const courseCard = (c) => {
      const full = c.status === 'full';
      const pct = Math.round((c.enrolled / c.maxSeats) * 100);
      return `
      <div class="card course-card mx mt" onclick="location.hash='#/course/${c.id}'">
        <div class="cc-cover"><div class="cover cv-${c.cover}">${esc(c.name.slice(0, 2))}</div></div>
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
            <div class="ava">${esc(s.avatar)}</div>
            <div class="info">
              <div class="nm">${esc(s.name)} <span class="school-pill">${esc(s.grade)}</span></div>
              <div class="sc">${esc(s.school)}</div>
            </div>
          </div>
        </div>

        <div class="mx" style="margin-top:-2px;padding-top:12px">
          <div class="quick2">
            <div class="qi" onclick="location.hash='#/orders'">
              <div class="qc" style="background:var(--blue)">${I.order(true)}</div>
              <div><div class="qt">我的报名</div><div class="qd">报名 / 成班进度</div></div>
            </div>
            <div class="qi" onclick="location.hash='#/result/order-002'">
              <div class="qc" style="background:var(--green)">${I.star}</div>
              <div><div class="qt">学习成果</div><div class="qd">作品 / 评价</div></div>
            </div>
          </div>
        </div>

        <div class="mx mt"><div class="section-title">本校可报名课程</div></div>
        ${DB.courses.map(courseCard).join('')}

        <div class="mx mt small muted center" style="padding:6px 0">仅展示「${esc(s.school)}」开放课程</div>
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
        <div style="height:180px"><div class="cover cv-${c.cover}" style="font-size:26px">${esc(c.name)}</div></div>

        <div class="card mx" style="margin-top:-20px">
          <div class="pad">
            <div class="row between">
              <div class="bold" style="font-size:19px">${esc(c.name)}</div>
              <span class="price"><span class="yen">¥</span><span class="num">${c.price}</span></span>
            </div>
            <div style="margin:8px 0">${c.tags.map((t, i) => `<span class="tag ${i ? 'gray' : ''}">${esc(t)}</span>`).join('')}<span class="tag blue">${esc(c.gradeRange)}</span></div>
            <div class="kv"><span class="k">上课学校</span><span class="v">${esc(DB.student.school)}</span></div>
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
  let enrollChecks = [false, false, false, false];
  function screenEnroll(id) {
    const c = courseById(id);
    if (!c) return screenHome();
    const s = DB.student;
    enrollChecks = [false, false, false, false];
    const rules = [
      '我已阅读并同意《课程报名须知》',
      '我同意进行费用预授权（¥' + c.price + '）',
      '我已知晓：未成班将自动取消报名并释放预授权',
      '我已知晓：课程完成后可查看学习成果并确认付款',
    ];

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
          ${rules.map((r, i) => `
            <div class="check" id="ck${i}" onclick="App.toggleCheck(${i})">
              <span class="box">${I.check}</span><span>${esc(r)}</span>
            </div>`).join('')}
        </div>

        <div class="mx mt"><div class="notice"><b>预授权说明：</b>确认后将向你的天府通账户发起 ¥${c.price} 预授权（冻结，不扣款），用于锁定名额；成班并完成课程、你确认满意后才正式扣款。</div></div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar">
        <button class="btn btn-primary" id="enrollBtn" disabled onclick="App.submitEnroll('${c.id}')">确认报名并预授权</button>
      </div>
    </div>`);
  }

  function toggleCheck(i) {
    enrollChecks[i] = !enrollChecks[i];
    const el = $('#ck' + i);
    el.classList.toggle('on', enrollChecks[i]);
    $('#enrollBtn').disabled = !enrollChecks.every(Boolean);
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
            <div style="width:54px;height:54px;border-radius:12px;overflow:hidden;flex-shrink:0"><div class="cover cv-${o.cover}" style="font-size:13px">${esc(o.courseName.slice(0, 2))}</div></div>
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
   * 屏幕 8：学习成果页
   * ============================================================ */
  function screenResult(id) {
    const o = orderById(id);
    if (!o || !o.result) { toast('暂无学习成果'); return screenOrders(); }
    const r = o.result;
    render(`
    <div class="screen">
      ${navbar('学习成果')}
      <div class="scroll">
        <div class="card mx mt pad">
          <div class="row between"><div class="bold" style="font-size:17px">${esc(o.courseName)}</div><span class="badge st-done">已完成</span></div>
          <div class="small muted" style="margin-top:4px">学生：${esc(r.studentName)} · ${esc(DB.student.school)}</div>
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
            ${r.photos.map((p) => `<div class="ph"><div class="cover cv-photo">${esc(p)}</div></div>`).join('')}
          </div>
        </div>

        <div class="card mx mt pad">
          <div class="section-title">学生作品</div>
          <div class="work-card">
            <div class="row" style="gap:12px">
              <div style="width:64px;height:64px;border-radius:10px;overflow:hidden;flex-shrink:0"><div class="cover cv-art" style="font-size:12px">作品</div></div>
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
          <div class="kv"><span class="k">支付方式</span><span class="v">天府通预授权</span></div>
          <div class="kv"><span class="k">当前状态</span><span class="v"><span class="badge st-warn">待家长确认</span></span></div>
        </div>
        <div style="height:14px"></div>
      </div>
      <div class="actionbar" style="flex-direction:column;gap:8px">
        <button class="btn btn-primary" onclick="App.confirmPay('${o.id}')">确认满意并付款 ¥${o.amount}</button>
        <button class="btn btn-ghost" style="height:40px" onclick="App.openAftersale()">有问题，发起售后</button>
      </div>
      ${aftersaleSheet()}
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
          <div class="kv"><span class="k">学生</span><span class="v">${esc(DB.student.name)}</span></div>
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
    const s = DB.student;
    const cell = (color, icon, t, sub, onclick) =>
      `<div class="list-cell" onclick="${onclick || ''}"><div class="lc-ic" style="background:${color}">${icon}</div><div class="lc-t"><div>${t}</div><div class="small muted">${sub}</div></div><span class="arr">${I.arrow}</span></div>`;
    render(`
    <div class="screen has-tabbar">
      ${navbar('我的', { back: false })}
      <div class="scroll">
        <div style="padding-top:0">
          <div class="profile-hero">
            <div class="ava">${esc(s.avatar)}</div>
            <div>
              <div style="font-size:19px;font-weight:700">${esc(s.name)} 家长</div>
              <div class="small" style="opacity:.92">${esc(s.parentPhone)}</div>
            </div>
          </div>
        </div>
        <div class="card mx mt" style="overflow:hidden">
          ${cell('var(--blue)', I.order(true), '当前学生', s.name + ' · ' + s.grade, '')}
          ${cell('var(--orange)', I.book, '所在学校', s.school, '')}
        </div>
        <div class="card mx mt" style="overflow:hidden">
          ${cell('var(--green)', I.order(true), '我的报名', '查看全部报名记录', "location.hash='#/orders'")}
          ${cell('#8a3dff', I.star, '学习成果', '作品与老师评价', "location.hash='#/result/order-002'")}
        </div>
        <div class="card mx mt" style="overflow:hidden">
          ${cell('#f59b1c', I.book, '帮助中心', '先学后付怎么用？', "App.demoTip()")}
          ${cell('#8a8f99', I.book, '客服与售后', '在线咨询', "App.demoTip()")}
        </div>
        <div class="mx mt small muted center" style="padding:14px 0">天府通 · 未来教育 家长端 Demo</div>
      </div>
      ${tabbar('me')}
    </div>`);
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

  /* ============================================================
   * 路由
   * ============================================================ */
  const routes = [
    [/^#\/?$|^#\/tft$/, screenTFT],
    [/^#\/home$/, screenHome],
    [/^#\/course\/(.+)$/, (m) => screenCourse(m[1])],
    [/^#\/enroll\/(.+)$/, (m) => screenEnroll(m[1])],
    [/^#\/preauth\/(.+)$/, (m) => screenPreauth(m[1])],
    [/^#\/orders$/, screenOrders],
    [/^#\/schedule\/(.+)$/, (m) => screenSchedule(m[1])],
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
    screenTFT();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);

  /* 暴露给内联事件 */
  window.App = {
    toggleCheck, submitEnroll, confirmPay, demoTip: () => toast('Demo 演示页，功能开发中'),
    openAftersale, closeAftersale, selectAS, submitAftersale,
  };
  route();
})();
