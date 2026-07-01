/* ============================================================
 * 天府通 · 未来教育 — 家长端 Demo
 * Mock 数据（写死，便于演示）
 * 后续可替换为真实接口：学校端 / 运营端 / 老师端
 * ============================================================ */

window.DB = {
  // 当前登录家长 & 学生（进入后自动识别）
  student: {
    name: '李小明',
    avatar: '李',
    school: '成都天府新区实验小学',
    grade: '三年级 2 班',
    parentPhone: '138****8888',
  },

  // 本校开放课程
  courses: [
    {
      id: 'ai-qimeng',
      name: '人工智能启蒙课',
      cover: 'ai',
      tags: ['AI 素质', '热门'],
      gradeRange: '1-3 年级',
      time: '每周三 16:30-17:30',
      place: '本校科技教室',
      lessons: 8,
      minClass: 10,
      maxSeats: 30,
      enrolled: 18,
      price: 399,
      status: 'open', // open | full
      intro:
        '面向低年级学生的人工智能启蒙课程，用游戏化、可视化的方式带孩子认识 AI，了解人工智能如何看世界、如何对话、如何创作，激发科技兴趣。',
      goals: [
        '理解人工智能的基本概念',
        '能与 AI 工具进行简单对话与提问',
        '体验 AI 绘画、AI 创作的乐趣',
        '完成一个属于自己的 AI 小作品',
      ],
      outcomes: '结课时完成个人 AI 作品并进行成果展示，老师上传学习记录与评价。',
    },
    {
      id: 'coding-思维',
      name: '少儿编程思维课',
      cover: 'code',
      tags: ['科技', '逻辑'],
      gradeRange: '3-5 年级',
      time: '每周五 16:30-17:30',
      place: '本校计算机教室',
      lessons: 8,
      minClass: 12,
      maxSeats: 30,
      enrolled: 25,
      price: 499,
      status: 'open',
      intro:
        '以图形化编程为载体，培养孩子的逻辑思维、拆解问题与动手解决问题的能力，循序渐进完成属于自己的小游戏。',
      goals: ['掌握图形化编程基础', '建立顺序/循环/条件的编程思维', '独立完成一个小游戏作品'],
      outcomes: '结课时提交个人编程作品，老师上传学习记录与评价。',
    },
    {
      id: 'science-shiyan',
      name: '科学实验探索课',
      cover: 'science',
      tags: ['科学', '动手'],
      gradeRange: '1-4 年级',
      time: '每周二 16:30-17:30',
      place: '本校科学教室',
      lessons: 8,
      minClass: 10,
      maxSeats: 30,
      enrolled: 30,
      price: 399,
      status: 'full',
      intro: '通过趣味科学实验，让孩子在动手中观察现象、提出问题、验证猜想，培养科学探究精神。',
      goals: ['掌握基础科学实验方法', '学会观察与记录实验现象', '培养科学探究兴趣'],
      outcomes: '结课时完成个人实验报告，老师上传学习记录与评价。',
    },
  ],

  // 我的报名记录
  orders: [
    {
      id: 'order-001',
      courseId: 'ai-qimeng',
      courseName: '人工智能启蒙课',
      cover: 'ai',
      status: 'forming', // 待成班
      amount: 399,
      payState: 'preauth', // 已预授权
      school: '成都天府新区实验小学',
      place: '本校科技教室',
      time: '每周三 16:30-17:30',
      enrolled: 18,
      minClass: 10,
      maxSeats: 30,
      teacher: '王老师',
      startDate: '2026 年 7 月 10 日',
      lessons: 8,
      schedule: [
        '第 1 次：认识人工智能',
        '第 2 次：和 AI 对话',
        '第 3 次：AI 画图体验',
        '第 4 次：训练自己的小模型',
        '第 5 次：AI 故事创作',
        '第 6 次：AI 编程小游戏',
        '第 7 次：完成个人 AI 作品',
        '第 8 次：成果展示',
      ],
    },
    {
      id: 'order-002',
      courseId: 'ai-zuopin',
      courseName: 'AI 创意作品课',
      cover: 'art',
      status: 'to-confirm', // 待确认付款
      amount: 399,
      payState: 'preauth',
      school: '成都天府新区实验小学',
      place: '本校科技教室',
      time: '每周四 16:30-17:30',
      teacher: '林老师',
      lessons: 8,
      result: {
        studentName: '李小明',
        finished: 8,
        total: 8,
        attendance: 8,
        leave: 0,
        teacherShort: '学习积极，能独立完成 AI 绘画作品和简单提示词设计。',
        photos: ['课堂照片 1', '课堂照片 2', '课堂照片 3'],
        work: {
          title: '未来城市 AI 绘画',
          desc: '学生使用 AI 工具创作了一幅未来城市主题作品，并能描述自己的创作思路。',
        },
        teacherComment:
          '李小明在课程中表现积极，能够理解人工智能的基础概念，并能使用简单提示词完成 AI 图像创作。课程结束时已完成个人作品展示。',
      },
    },
  ],

  // 报名状态字典
  statusMap: {
    'to-preauth': { label: '待预授权', cls: 'st-wait' },
    preauth: { label: '已预授权', cls: 'st-info' },
    forming: { label: '待成班', cls: 'st-info' },
    formed: { label: '已成班', cls: 'st-info' },
    scheduled: { label: '已排课', cls: 'st-info' },
    ongoing: { label: '上课中', cls: 'st-info' },
    'to-result': { label: '待查看成果', cls: 'st-warn' },
    'to-confirm': { label: '待确认付款', cls: 'st-warn' },
    done: { label: '已完成', cls: 'st-done' },
    canceled: { label: '已取消', cls: 'st-muted' },
  },

  // 售后问题类型
  aftersaleTypes: [
    '学生未参加课程',
    '课程内容与介绍不符',
    '未看到学习成果',
    '需要申请退款',
    '其他问题',
  ],
};
