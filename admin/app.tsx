/* ============================================================
 * 天府未来教育中心 · 后台管理系统 Demo
 * React 18 + TSX + Ant Design 5（UMD 免构建，mock 数据）
 * 业务闭环：建校/场地 → 审机构 → 审教师 → 审课程 → 课程库
 *          → 分发学校 → 家长报名付费 → 按节销课 → 按月结算
 * ============================================================ */
const { useState, useMemo } = React;
const {
  Layout, Menu, Table: AntTable, Tag, Button, Modal, Drawer, Descriptions, Card, Statistic,
  Row, Col, Space, Input, Select, Steps, message, Tabs, Divider, Form, InputNumber,
  Checkbox, Timeline, Alert, Progress, Radio, Avatar, Tooltip, List, Upload,
} = antd;
const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const {
  DashboardOutlined, TeamOutlined, BankOutlined, EnvironmentOutlined, ShopOutlined,
  IdcardOutlined, BookOutlined, SendOutlined, ClusterOutlined, ProfileOutlined,
  CheckSquareOutlined, AccountBookOutlined, CustomerServiceOutlined, FileSearchOutlined,
  UserOutlined, PlusOutlined, RightOutlined, QuestionCircleOutlined,
} = icons;

/* ---------- 状态 → 颜色（全局统一） ---------- */
const STC: Record<string, string> = {
  待完善: 'gold', 待审核: 'orange', 审核通过: 'green', 审核驳回: 'red', 已暂停: 'default', 已禁用: 'red',
  草稿: 'default', 已入课程库: 'green', 已下架: 'default',
  待合作: 'orange', 已合作: 'green', 暂停合作: 'gold', 已停用: 'default',
  启用: 'green', 禁用: 'red', 已上架: 'green', 未到购买时间: 'gold',
  报名中: 'blue', 待成班: 'orange', 已成班: 'green', 已排课: 'cyan', 上课中: 'processing', 已结课: 'default', 已取消: 'red',
  待支付: 'orange', 已支付: 'green', 已退款: 'red', 部分退款: 'gold',
  待上课: 'default', 已上课待确认: 'orange', 待上架确认: 'orange', 部分确认: 'orange', 全部确认: 'green', 已确认销课: 'green', 异常: 'red', 已计入结算: 'cyan',
  待生成: 'default', 结算中: 'blue', 已结算: 'green', 结算异常: 'red', 已驳回: 'red',
  待处理: 'orange', 处理中: 'blue', 机构处理中: 'gold', 平台介入: 'purple', 已完成: 'green',
  正常: 'green', 未签到: 'default', 已签到: 'green', 待确认: 'orange', 待上架确认: 'orange', 已确认: 'green',
  已上传: 'green', 未上传: 'orange',
  已开通: 'green', 未开通: 'orange',
};
/* ---------- 名词解释词典（顶部 ? 查看全量，状态标签悬停即显） ---------- */
const GLOSSARY: { title: string; items: [string, string][] }[] = [
  { title: '销课状态（核心流程）', items: [
    ['待上课', '课程已排期、尚未到上课时间，本节不产生任何费用。'],
    ['已上课待确认', '教师已完成签到并提交课堂记录，等待家长确认（3 天自动确认）；确认之前本节不计入结算。'],
    ['已确认销课', '平台/学校已确认本节课真实完成，本节费用进入当月可结算范围。'],
    ['异常', '本节课数据存疑：如实到人数与签到不符、教师未签到、家长投诉课程未上等，暂停计费。处理方式：机构在 2 个工作日内补充说明或更正记录，平台复核后转为「已确认销课」，或作废本节（不计费）。'],
    ['已计入结算', '本节课已随月度结算单锁定，金额不再变动。'],
  ] },
  { title: '结算状态', items: [
    ['待生成', '结算周期未结束，结算单尚未生成。'],
    ['待审核（结算）', '结算单已生成，等待平台财务核对销课明细与各项扣减。'],
    ['结算中', '财务审核通过，进入打款流程。'],
    ['已结算', '款项已打至机构结算账户，本期结算完成。'],
    ['结算异常', '打款失败或明细存在争议（如账户信息错误、退款争议），需财务人工处理。'],
    ['已驳回', '审核不通过（如销课明细与课堂记录不符），退回重新核对后再提交。'],
  ] },
  { title: '结算相关名词', items: [
    ['应结算金额', '当月所有「已确认销课」节次的金额合计。'],
    ['平台服务费', '按合作协议比例（Demo 为 10%）从应结算金额中扣除。'],
    ['学校服务费', '涉及学校服务费时按约定比例扣除（规则预留，Demo 为 5%）。'],
    ['退款扣减', '当月发生退款的订单，对应金额从机构结算中扣回。'],
    ['机构实收', '应结算金额 − 平台服务费 − 学校服务费 − 退款扣减。'],
  ] },
  { title: '机构状态', items: [
    ['待完善', '平台已创建机构基础档案，机构可登录后补充营业执照、法人、服务范围等资料，再提交平台审核。'],
    ['待审核', '机构已提交入驻资料，平台审核中；审核通过前不能创建教师、发布课程。'],
    ['审核通过', '入驻审核通过，可创建教师、发布课程。'],
    ['审核驳回', '资料不符合要求，按驳回原因补充后重新提交。'],
    ['已暂停', '合作暂停，机构课程停止分发与报名。'],
    ['已禁用', '因违规或退出合作，账号冻结。'],
  ] },
  { title: '教师状态', items: [
    ['待审核（教师）', '机构已创建教师并提交资质，平台审核中；通过前不能绑定班级授课。'],
    ['审核通过（教师）', '资质审核通过，可绑定课程与班级授课。'],
    ['已停用', '教师不再授课，账号停用。'],
  ] },
  { title: '课程状态', items: [
    ['草稿', '机构编辑中，尚未提交平台审核。'],
    ['待审核（课程）', '课程已提交，平台审核中（重点审核课程内容与资质合规）。'],
    ['已入课程库', '课程进入平台课程库，由平台分发到指定学校后该校家长方可见；机构不直接对家长上架。'],
    ['已下架', '课程停止分发与报名。'],
  ] },
  { title: '班级状态', items: [
    ['报名中', '班级已上架，家长可报名。'],
    ['待成班', '报名人数未达最低成班人数，暂不能开课。'],
    ['已成班', '达到最低成班人数，可安排排课开课。'],
    ['已排课', '已确定上课时间、场地与教师。'],
    ['上课中', '班级正常上课中。'],
    ['已结课', '全部课时完成，进入结课确认与结算。'],
    ['已取消', '未成班或其他原因取消，家长已缴费用自动全额退款。'],
  ] },
  { title: '订单 / 支付状态', items: [
    ['待支付', '家长已提交报名，尚未完成付款。'],
    ['已支付', '费用已进入平台监管账户托管，不直接支付给机构。'],
    ['已退款', '费用已全额退回家长，对应金额从机构结算中扣减。'],
    ['部分退款', '按未上课时比例退回部分费用。'],
    ['已取消', '订单关闭（未支付超时或家长主动取消）。'],
  ] },
  { title: '售后状态', items: [
    ['待处理', '家长已提交售后申请，平台尚未受理。'],
    ['处理中', '平台客服核实处理中。'],
    ['机构处理中', '售后已转机构，机构须在时限内（2 个工作日）反馈处理方案，超时平台介入。'],
    ['平台介入', '机构处理超时或双方有争议，由平台仲裁处理。'],
    ['已完成', '售后处理完毕结案。'],
  ] },
  { title: '学校 / 场地状态', items: [
    ['待合作', '学校已建档，合作协议未签署，暂不能分发课程。'],
    ['已合作', '合作中，可向该校分发课程。'],
    ['暂停合作', '暂停向该校分发新课程，存量班级正常上完。'],
    ['启用 / 停用', '场地是否可用于排课；停用后不可被新班级选用。'],
    ['待上架确认 / 已上架 / 已下架', '课程配置由平台运营与学校线下核对场地时间后确认上架，上架后该校家长端可见、可报名（学校端不做线上确认）。'],
  ] },
  { title: '通用名词', items: [
    ['资金托管', '家长报名费一次性支付后进入平台监管账户，机构按已确认销课的课时逐节累计，按月结算。'],
    ['销课', '每完成一节课形成一条销课记录，经确认状态后机构累计一节可结算费用。'],
    ['成班人数', '开班所需的最低报名人数，未达标班级将取消并自动退款。'],
    ['课程分发', '平台将课程库中的课程配置到指定合作学校；场地与时间由平台运营与学校线下确认后上架，该校家长端才可见。'],
  ] },
];
/* 悬停提示：状态 → 解释（带「（xx）」限定的词条映射回原状态名） */
const TERM_DEF: Record<string, string> = {};
GLOSSARY.forEach((g) => g.items.forEach(([t, d]) => {
  const key = t.replace(/（.*?）/g, '').split(' / ')[0];
  if (!TERM_DEF[key]) TERM_DEF[key] = d;
}));
TERM_DEF['已签到'] = '教师已在系统完成本节课签到。';
TERM_DEF['未签到'] = '教师尚未签到，本节课未开始或存在异常。';
TERM_DEF['待确认'] = TERM_DEF['已上课待确认'];
TERM_DEF['已确认'] = '平台/学校已确认本节课真实完成。';

const S = ({ v }: { v: string }) => {
  const t = <Tag color={STC[v] || 'default'} style={TERM_DEF[v] ? { cursor: 'help' } : {}}>{v}</Tag>;
  return TERM_DEF[v] ? <Tooltip title={TERM_DEF[v]}>{t}</Tooltip> : t;
};

/* ---------- 表格字段解释（列名后的 ? 点击查看） ---------- */
const FIELD_DEF: Record<string, string> = {
  机构名称: '入驻或合作机构的主体名称，通常与营业执照名称一致。',
  服务方向: '机构可提供的业务方向，创建时从平台固定模板中多选，便于审核和后续筛选。',
  提交时间: '机构、教师或课程提交给平台审核的时间。',
  状态: '当前业务状态，点击状态标签或顶部名词解释可查看完整含义。',
  教师: '负责该班级或课程授课的教师。',
  教师姓名: '机构提交并由平台审核的授课教师姓名。',
  机构: '课程、教师、班级、订单或结算所属的服务机构。',
  所属机构: '教师或课程归属的机构，由机构维护并提交平台审核。',
  方向: '教师或课程的教学方向。',
  课程: '平台课程库中的课程或订单报名课程。',
  课程名称: '课程在平台课程库中的标准名称。',
  分类: '课程所属类目，如 AI、编程、科学、研学等。',
  班级: '课程分发到学校后形成的具体上课班级，家长最终报名到班级。',
  班级名称: '课程在某个学校、时段和场地下形成的具体班级名称。',
  学校: '课程投放、班级上课、订单学生所属的学校。',
  投放学校: '课程被平台配置到的学校，只有这些学校的家长端可见。',
  时间: '固定上课时段或业务发生时间。',
  上课时间: '班级固定的周期性上课时段。',
  上课日期: '单节课实际发生的日期。',
  场地: '学校提供的上课教室或场馆。',
  类型: '场地或业务对象的分类。',
  容纳: '场地可承载的学生人数。',
  容纳人数: '场地可容纳的最大学生人数，用于限制班额。',
  可用时间: '场地可被排课使用的时间范围。',
  适合课程: '该场地适合承接的课程类型。',
  对外开放: '该场地是否允许本校以外学生报名使用。',
  星期: '场地排课占用对应的星期。',
  时段: '场地排课占用的具体时间段。',
  占用班级: '该场地时段已安排的班级。',
  姓名: '平台账号或学生/家长姓名。',
  手机号: '账号或联系人手机号，Demo 中做脱敏展示。',
  角色: '平台账号的权限角色。',
  角色名称: '后台权限角色的名称。',
  所属单位: '账号归属的平台、学校或机构。',
  最近登录: '该账号最近一次登录后台的时间。',
  说明: '角色或字段的业务说明。',
  权限点: '该角色拥有的后台功能权限数量。',
  学校名称: '合作学校或校外点位的标准名称；校内为学校，校外为社区/街道等点位。',
  '学校/点位名称': '校内记录学校名称；校外记录社区、街道、党群服务中心等点位名称。',
  类型: '校内表示学校；校外表示社区、街道、公共服务中心等点位。',
  区域: '学校或校外点位所属行政区域。',
  地址: '学校详细地址。',
  联系人: '学校或机构对接联系人。',
  电话: '对接联系人电话。',
  合作状态: '学校/点位与平台的合作进度和可用状态。',
  已配置课程: '已分发到该学校、可在家长端展示的课程数量。',
  场地名称: '学校场地的名称。',
  所属学校: '场地归属的学校。',
  审核状态: '平台审核进度或结果，通过前不能进入下一业务环节。',
  课程库: '平台审核通过后的课程资源池，课程需分发到学校后家长才可见。',
  课程数: '机构已维护或已通过审核的课程数量。',
  教师数: '机构已维护或已通过审核的教师数量。',
  课程数量: '机构已维护或已通过审核的课程数量。',
  教师数量: '机构已维护或已通过审核的教师数量。',
  结算账户: '机构用于接收月度结算款的账户配置状态。',
  登录账户: '机构或教师是否已开通后台登录账号，账号统一使用手机号，可复制链接、手机号和初始密码发给对应用户。',
  资质类型: '教师提交的资质证书类型，如教师资格证、行业资格证等。',
  材料照片: '教师资质审核所需图片材料，包括教师本人照片和资格证照片。',
  个人照片: '教师本人照片，用于平台核验教师身份与后续账号资料展示。',
  资格证照片: '教师资格证或行业资质证书的照片材料，用于平台审核。',
  教授方向: '教师主要承担的课程方向。',
  适合年级: '课程建议报名的学生年级范围。',
  课时: '一期课程包含的上课节次总数。',
  建议价格: '机构建议售价，实际报名价以学校课程配置为准。',
  '成班/上限': '最低成班人数 / 最大报名人数。',
  所需场地: '课程上课所需的教室或场馆类型。',
  上课场地: '班级实际使用的学校场地。',
  报名上限: '班级允许报名的最大人数。',
  '报名/上限': '当前报名人数 / 班级最大人数。',
  截止: '家长端报名截止时间。',
  成班状态: '班级是否达到最低成班人数。',
  上架状态: '平台确认上架后课程在该校家长端可见、可报名（场地时间与学校线下核对）。',
  课时进度: '已上课时 / 总课时。',
  '报名（成班 /上限）': '当前报名人数，以及最低成班人数 / 最大报名人数。',
  班级状态: '班级从报名到结课的业务状态。',
  学生: '报名学生姓名。',
  家长: '报名学生对应家长。',
  支付: '该报名的支付状态。',
  订单编号: '家长报名支付后形成的订单编号。',
  金额: '订单或结算对应的费用金额。',
  支付方式: '家长完成付款使用的渠道。',
  支付状态: '订单款项状态，已支付表示资金进入平台监管账户托管。',
  退款: '订单是否发生退款及退款状态。',
  下单时间: '家长提交报名订单的时间。',
  节次: '该班级课程的第几节课。',
  '应到/实到': '应到为报名人数，实到为本节实际到课人数。',
  教师签到: '教师是否在系统完成本节课签到。',
  
  销课状态: '单节课的计费流转状态，确认后才进入结算。',
  可结算金额: '本节课确认销课后计入当月结算的金额。',
  结算单号: '月度结算单编号。',
  月份: '结算所属月份。',
  结算月份: '结算所属自然月。',
  涉及学校: '结算单覆盖的上课学校。',
  班级数: '结算单涉及的班级数量。',
  完成课时: '本期已确认可结算的课时数量。',
  已完成课时: '本期已确认可结算的课时数量。',
  应结算: '当月所有已确认销课节次的金额合计。',
  平台服务费: '按合作协议比例从应结算金额中扣除。',
  学校服务费: '按协议预留给学校或场地相关方的分成金额。',
  退款扣减: '当月退款订单对应金额，从机构结算中扣回。',
  机构实收: '应结算金额扣除平台服务费、学校服务费、退款扣减后的机构到账金额。',
  日期: '销课明细对应的上课日期。',
  实到: '本节课实际到课人数。',
  可结算: '该节课确认后可计入结算的金额。',
  售后编号: '家长售后申请形成的工单编号。',
  课程班级: '售后涉及的课程和班级。',
  问题类型: '家长提交售后时选择的问题分类。',
  申请时间: '售后工单提交时间。',
  操作时间: '后台操作发生时间。',
  操作人: '执行后台操作的账号或人员。',
  模块: '操作发生的后台功能模块。',
  操作内容: '本次后台操作的具体内容。',
  IP: '执行操作时记录的网络地址。',
  结果: '后台操作执行结果。',
};
const explainTitle = (title: any) => {
  if (typeof title !== 'string') return title;
  const def = FIELD_DEF[title];
  if (!def) return title;
  return <Space size={4}>{title}<Tooltip title={def} trigger="click"><QuestionCircleOutlined style={{ color: '#8a919f', fontSize: 12, cursor: 'pointer' }} onClick={(e: any) => e.stopPropagation()} /></Tooltip></Space>;
};
const explainColumns = (cols: any[] = []): any[] => cols.map((c) => ({
  ...c,
  title: explainTitle(c.title),
  children: c.children ? explainColumns(c.children) : c.children,
}));
const Table = (props: any) => <AntTable {...props} columns={explainColumns(props.columns)} />;

/* ---------- Mock 数据 ---------- */
const initDB = {
  schools: [
    { id: 'sc1', scene: '校内', name: '成都天府新区实验小学', area: '天府新区', addr: '天府大道南段 1 号', contact: '周校长', phone: '138****1001', status: '已合作', courses: 3, venues: 3 },
    { id: 'sc2', scene: '校内', name: '成都天府新区第七小学', area: '天府新区', addr: '科学城中路 88 号', contact: '吴主任', phone: '139****1002', status: '已合作', courses: 2, venues: 2 },
    { id: 'sc3', scene: '校内', name: '成都麓湖小学', area: '天府新区', addr: '麓湖生态城 12 号', contact: '郑老师', phone: '137****1003', status: '待合作', courses: 0, venues: 1 },
    { id: 'sc4', scene: '校内', name: '成都华阳实验小学', area: '双流区', addr: '华阳大道二段 66 号', contact: '刘校长', phone: '136****1004', status: '暂停合作', courses: 1, venues: 2 },
    { id: 'sc5', scene: '校外', name: '华阳街道党群服务中心', area: '天府新区', addr: '华阳街道社区服务中心 3 楼', contact: '陈主任', phone: '135****1105', status: '已合作', courses: 1, venues: 2 },
  ],
  venues: [
    { id: 'v1', name: '科技教室 A', school: '成都天府新区实验小学', type: '科技教室', scene: '校内', cap: 30, time: '周一至周五 16:00-18:00', fit: 'AI / 编程 / 科创', open: '否', status: '启用' },
    { id: 'v2', name: '计算机教室 1', school: '成都天府新区实验小学', type: '计算机教室', scene: '校内', cap: 36, time: '周一至周五 16:00-18:00', fit: '编程 / 信息素养', open: '否', status: '启用' },
    { id: 'v3', name: '美术教室', school: '成都天府新区实验小学', type: '美术教室', scene: '校内', cap: 28, time: '周一至周五 16:30-18:00', fit: '美术 / 手工', open: '否', status: '启用' },
    { id: 'v4', name: '科学实验室', school: '成都天府新区第七小学', type: '科技教室', scene: '校内', cap: 30, time: '周一至周五 16:30-18:00', fit: '科学实验', open: '否', status: '启用' },
    { id: 'v5', name: '多功能室', school: '成都天府新区第七小学', type: '多功能室', scene: '校外', cap: 60, time: '周一至周五 16:00-18:00', fit: '通用', open: '是', status: '启用' },
    { id: 'v6', name: '操场（东侧）', school: '成都华阳实验小学', type: '操场', scene: '校内', cap: 100, time: '周一至周五 16:00-18:00', fit: '体育 / 户外', open: '否', status: '停用' },
  ],
  orgs: [
    { id: 'og1', name: '成都智创未来教育科技有限公司', contact: '王总', phone: '138****2001', dir: 'AI / 编程 / 科创', submitAt: '2026-05-12', status: '审核通过', courses: 3, teachers: 3, account: '已配置', accountInfo: { url: 'https://future-edu.demo/org/', username: '138****2001', password: 'TfOG1@2026' }, license: '统一社会信用代码 91510100MA6XXXX01', licensePhoto: '智创未来营业执照.jpg', legal: '王建国（法人）', scope: '面向中小学的人工智能与编程素质教育', agreement: '2026-2027 学年课后服务合作协议（已签署）',
      audits: [{ t: '2026-05-15 10:20', who: '审核员-李敏', act: '审核通过', note: '资质齐全' }, { t: '2026-05-12 14:03', who: '机构', act: '提交入驻申请', note: '' }] },
    { id: 'og2', name: '童心美育艺术中心', contact: '林老师', phone: '139****2002', dir: '美术 / 手工 / 书法', submitAt: '2026-06-28', status: '待审核', courses: 1, teachers: 2, account: '未配置', license: '统一社会信用代码 91510100MA6XXXX02', licensePhoto: '童心美育营业执照.png', legal: '林晓芸（法人）', scope: '少儿美术、创意手工、硬笔书法', agreement: '待审核通过后签署',
      audits: [{ t: '2026-06-28 09:41', who: '机构', act: '提交入驻申请', note: '' }] },
    { id: 'og3', name: '星辰体育培训中心', contact: '赵教练', phone: '137****2003', dir: '篮球 / 田径 / 体适能', submitAt: '2026-06-30', status: '待审核', courses: 0, teachers: 1, account: '未配置', license: '统一社会信用代码 91510100MA6XXXX03', licensePhoto: '', legal: '赵刚（法人）', scope: '青少年体育培训与体适能训练', agreement: '待审核通过后签署',
      audits: [{ t: '2026-06-30 16:22', who: '机构', act: '提交入驻申请', note: '' }] },
    { id: 'og4', name: '快乐星球机器人俱乐部', contact: '孙老师', phone: '136****2004', dir: '机器人 / 无人机', submitAt: '2026-06-10', status: '审核驳回', courses: 0, teachers: 0, account: '未配置', license: '统一社会信用代码 91510100MA6XXXX04', licensePhoto: '快乐星球营业执照.jpg', legal: '孙志强（法人）', scope: '机器人搭建与竞赛培训', agreement: '—',
      audits: [{ t: '2026-06-12 11:00', who: '审核员-李敏', act: '审核驳回', note: '营业执照经营范围不含教育培训，请补充变更后重新提交' }, { t: '2026-06-10 10:15', who: '机构', act: '提交入驻申请', note: '' }] },
  ],
  teachers: [
    { id: 't1', name: '王思远', org: '成都智创未来教育科技有限公司', phone: '138****3001', dir: 'AI 启蒙', cert: '教师资格证（小学信息技术）', teacherPhoto: '王思远个人照片.jpg', certPhoto: '王思远教师资格证.jpg', submitAt: '2026-05-20', status: '审核通过', accountInfo: { url: 'https://future-edu.demo/org/teacher/', username: '138****3001', password: 'TfT1@2026' }, idcard: '5101**********0011', bio: '6 年少儿 AI 教学经验，市级科技社团指导教师。',
      audits: [{ t: '2026-05-22 15:00', who: '审核员-李敏', act: '审核通过', note: '' }] },
    { id: 't2', name: '陈亦然', org: '成都智创未来教育科技有限公司', phone: '139****3002', dir: '少儿编程', cert: '教师资格证（小学信息技术）', teacherPhoto: '陈亦然个人照片.jpg', certPhoto: '陈亦然教师资格证.jpg', submitAt: '2026-05-20', status: '审核通过', idcard: '5101**********0022', bio: 'Scratch / Python 项目导师，信息科技骨干教师。',
      audits: [{ t: '2026-05-22 15:05', who: '审核员-李敏', act: '审核通过', note: '' }] },
    { id: 't3', name: '刘嘉敏', org: '成都智创未来教育科技有限公司', phone: '137****3003', dir: '科学实验', cert: '教师资格证（小学科学）', teacherPhoto: '刘嘉敏个人照片.jpg', certPhoto: '刘嘉敏教师资格证.jpg', submitAt: '2026-06-02', status: '审核通过', idcard: '5101**********0033', bio: 'STEAM 实验课程导师，多次承担校级公开课。',
      audits: [{ t: '2026-06-03 09:30', who: '审核员-李敏', act: '审核通过', note: '' }] },
    { id: 't4', name: '林晓芸', org: '童心美育艺术中心', phone: '135****3004', dir: '少儿美术', cert: '美术教师资格证', teacherPhoto: '林晓芸个人照片.jpg', certPhoto: '林晓芸美术教师资格证.jpg', submitAt: '2026-06-28', status: '待审核', idcard: '5101**********0044', bio: '10 年少儿美术教学经验，省美协会员。',
      audits: [] },
    { id: 't5', name: '赵刚', org: '星辰体育培训中心', phone: '136****3005', dir: '篮球', cert: '社会体育指导员（篮球）', teacherPhoto: '赵刚个人照片.jpg', certPhoto: '赵刚社会体育指导员证.jpg', submitAt: '2026-06-30', status: '待审核', idcard: '5101**********0055', bio: '前省青年队队员，青少年篮球教练 8 年。',
      audits: [] },
  ],
  courses: [
    { id: 'c1', name: '人工智能启蒙课', org: '成都智创未来教育科技有限公司', cat: 'AI 素质', grade: '1-3 年级', lessons: 10, price: 800, min: 10, max: 30, venue: '科技教室', status: '已入课程库', teacher: '王思远', intro: '游戏化认识 AI，完成个人 AI 小作品。', device: '平板 / 投影',
      syllabus: ['认识人工智能', '和 AI 对话', 'AI 画图体验', '训练小模型', 'AI 故事创作', 'AI 音乐体验', 'AI 编程游戏', '综合创作（一）', '综合创作（二）', '成果展示'],
      outcome: '完成个人 AI 作品并展示', audits: [{ t: '2026-06-05 10:00', who: '审核员-李敏', act: '审核通过，入课程库', note: '' }] },
    { id: 'c2', name: '少儿编程思维课', org: '成都智创未来教育科技有限公司', cat: '编程', grade: '3-5 年级', lessons: 10, price: 900, min: 12, max: 30, venue: '计算机教室', status: '已入课程库', teacher: '陈亦然', intro: '图形化编程入门，独立完成小游戏。', device: '电脑机房',
      syllabus: ['认识编程', '顺序结构', '循环结构', '条件判断', '变量与计分', '角色与交互', '关卡设计', '调试优化', '作品完善', '项目展示'],
      outcome: '提交个人编程作品', audits: [{ t: '2026-06-05 10:05', who: '审核员-李敏', act: '审核通过，入课程库', note: '' }] },
    { id: 'c3', name: '科学实验探索课', org: '成都智创未来教育科技有限公司', cat: '科学', grade: '1-4 年级', lessons: 8, price: 640, min: 10, max: 30, venue: '科技教室', status: '待审核', teacher: '刘嘉敏', intro: '趣味实验培养科学探究精神。', device: '实验器材包',
      share: { org: 68, platform: 12, region: 15, tf: 5 },
      syllabus: ['观察与猜想', '浮沉与密度', '磁力探索', '气压与流动', '植物观察', '声音传播', '自制小装置', '实验报告展示'],
      outcome: '完成个人实验报告', audits: [{ t: '2026-06-29 14:30', who: '机构', act: '提交课程审核', note: '' }] },
    { id: 'c4', name: '创意水彩画课', org: '童心美育艺术中心', cat: '美术', grade: '1-6 年级', lessons: 12, price: 960, min: 8, max: 28, venue: '美术教室', status: '待审核', teacher: '林晓芸', intro: '从色彩感知到独立创作水彩作品。', device: '画材包',
      syllabus: ['色彩认知', '水彩基础', '晕染技法', '风景写生', '静物写生', '动物主题', '人物入门', '想象创作', '主题创作（一）', '主题创作（二)', '装裱知识', '作品展'],
      outcome: '完成 3 幅独立水彩作品', audits: [{ t: '2026-06-29 16:10', who: '机构', act: '提交课程审核', note: '' }] },
    { id: 'c5', name: '硬笔书法课', org: '童心美育艺术中心', cat: '书法', grade: '2-6 年级', lessons: 10, price: 600, min: 10, max: 30, venue: '多功能室', status: '审核驳回', teacher: '林晓芸', intro: '规范书写习惯，掌握基本笔画结构。', device: '字帖 / 练习纸',
      syllabus: ['坐姿与握笔', '基本笔画（一）', '基本笔画（二）', '偏旁部首', '间架结构', '独体字', '合体字', '作品纸书写', '综合练习', '结课展示'],
      outcome: '完成一幅书法作品', audits: [{ t: '2026-06-20 11:00', who: '审核员-李敏', act: '审核驳回', note: '课程大纲与课时数不匹配，请补充每节课教学目标' }] },
    { id: 'c6', name: '趣味篮球启蒙', org: '星辰体育培训中心', cat: '体育', grade: '1-3 年级', lessons: 10, price: 700, min: 15, max: 40, venue: '操场', status: '草稿', teacher: '赵刚', intro: '基础运球传球，培养运动习惯。', device: '篮球 / 标志桶',
      syllabus: ['热身与球性', '运球基础', '传接球', '投篮姿势', '上篮步伐', '攻防意识', '小组配合', '趣味对抗', '综合练习', '友谊赛'],
      outcome: '掌握基础篮球技能', audits: [] },
  ],
  deployments: [
    { id: 'd1', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', className: '周三班', time: '每周三 16:30-17:30', venue: '科技教室 A', teacher: '王思远', enrolled: 18, max: 30, min: 10, price: 800, signupStart: '2026-07-01', deadline: '2026-07-08', formed: '已成班', shelf: '已上架' },
    { id: 'd1b', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', className: '周五拓展班', time: '每周五 17:00-18:00', venue: '计算机教室 1', teacher: '王思远', enrolled: 6, max: 24, min: 10, price: 820, signupStart: '2026-07-12', deadline: '2026-07-20', formed: '未到购买时间', shelf: '已上架' },
    { id: 'd2', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区第七小学', className: '周五班', time: '每周五 16:30-17:30', venue: '科学实验室', teacher: '王思远', enrolled: 8, max: 30, min: 10, price: 780, signupStart: '2026-07-01', deadline: '2026-07-10', formed: '待成班', shelf: '已上架' },
    { id: 'd3', course: '少儿编程思维课', org: '智创未来', school: '成都天府新区实验小学', className: '周二/周四班', time: '每周二 16:30-17:30、每周四 17:00-18:00', schedule: [{ day: '周二', slot: '16:30-17:30' }, { day: '周四', slot: '17:00-18:00' }], venue: '计算机教室 1', teacher: '陈亦然', enrolled: 25, max: 30, min: 12, price: 900, signupStart: '2026-07-02', deadline: '2026-07-12', formed: '已成班', shelf: '已上架' },
    { id: 'd4', course: '少儿编程思维课', org: '智创未来', school: '成都华阳实验小学', className: '周四班', time: '每周四 16:30-17:30', venue: '多功能室', teacher: '陈亦然', enrolled: 5, max: 30, min: 12, price: 850, signupStart: '2026-07-12', deadline: '2026-07-20', formed: '未到购买时间', shelf: '已上架' },
  ],
  classes: [
    { id: 'cl1', name: '人工智能启蒙课·周三班', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', venue: '科技教室 A', time: '每周三 16:30-17:30', teacher: '王思远', total: 10, done: 4, min: 10, max: 30, enrolled: 18, status: '上课中' },
    { id: 'cl2', name: '人工智能启蒙课·周五班', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区第七小学', venue: '科学实验室', time: '每周五 16:30-17:30', teacher: '王思远', total: 10, done: 0, min: 10, max: 30, enrolled: 8, status: '待成班' },
    { id: 'cl3', name: '少儿编程思维课·周二/周四班', course: '少儿编程思维课', org: '智创未来', school: '成都天府新区实验小学', venue: '计算机教室 1', time: '每周二 16:30-17:30、每周四 17:00-18:00', schedule: [{ day: '周二', slot: '16:30-17:30' }, { day: '周四', slot: '17:00-18:00' }], teacher: '陈亦然', total: 10, done: 6, min: 12, max: 30, enrolled: 25, status: '上课中' },
    { id: 'cl4', name: '创意水彩画课·周一班', course: '创意水彩画课', org: '童心美育', school: '成都天府新区实验小学', venue: '美术教室', time: '每周一 16:30-17:30', teacher: '林晓芸', total: 12, done: 0, min: 8, max: 28, enrolled: 3, status: '报名中' },
    { id: 'cl5', name: '科学实验探索课·周四班', course: '科学实验探索课', org: '智创未来', school: '成都天府新区第七小学', venue: '科学实验室', time: '每周四 16:30-17:30', teacher: '刘嘉敏', total: 8, done: 8, min: 10, max: 30, enrolled: 28, status: '已结课' },
  ],
  orders: [
    { id: 'DD20260620001', parent: '李先生', student: '李小明', school: '成都天府新区实验小学', course: '人工智能启蒙课', cls: '周三班', amount: 800, way: '天府通支付', pay: '已支付', refund: '—', time: '2026-06-20 10:23' },
    { id: 'DD20260621002', parent: '张女士', student: '张一诺', school: '成都天府新区实验小学', course: '人工智能启蒙课', cls: '周三班', amount: 800, way: '天府通支付', pay: '已支付', refund: '—', time: '2026-06-21 09:11' },
    { id: 'DD20260622003', parent: '陈先生', student: '陈梓航', school: '成都天府新区实验小学', course: '少儿编程思维课', cls: '周二班', amount: 900, way: '微信支付', pay: '已支付', refund: '—', time: '2026-06-22 14:52' },
    { id: 'DD20260623004', parent: '刘女士', student: '刘思彤', school: '成都天府新区第七小学', course: '人工智能启蒙课', cls: '周五班', amount: 780, way: '天府通支付', pay: '已支付', refund: '—', time: '2026-06-23 16:40' },
    { id: 'DD20260624005', parent: '杨先生', student: '杨浩然', school: '成都天府新区实验小学', course: '少儿编程思维课', cls: '周二班', amount: 900, way: '天府通支付', pay: '已退款', refund: '已退款', time: '2026-06-24 11:05' },
    { id: 'DD20260701006', parent: '黄女士', student: '黄雨桐', school: '成都天府新区实验小学', course: '创意水彩画课', cls: '周一班', amount: 960, way: '微信支付', pay: '待支付', refund: '—', time: '2026-07-01 08:30' },
  ],
  lessons: [
    { id: 'ls1', cls: '人工智能启蒙课·周三班', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-06-24', no: 3, teacher: '王思远', due: 18, actual: 17, sign: '已签到', schoolConfirm: '已确认', status: '已计入结算', amount: 1440 },
    { id: 'ls2', cls: '人工智能启蒙课·周三班', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-07-01', no: 4, teacher: '王思远', due: 18, actual: 18, sign: '已签到', schoolConfirm: '已确认', status: '已确认销课', amount: 1440 },
    { id: 'ls3', cls: '少儿编程思维课·周二班', course: '少儿编程思维课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-06-30', no: 6, teacher: '陈亦然', due: 25, actual: 24, sign: '已签到', schoolConfirm: '待确认', status: '已上课待确认', amount: 2250 },
    { id: 'ls4', cls: '人工智能启蒙课·周三班', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-07-08', no: 5, teacher: '王思远', due: 18, actual: 0, sign: '未签到', schoolConfirm: '—', status: '待上课', amount: 0 },
    { id: 'ls5', cls: '少儿编程思维课·周二班', course: '少儿编程思维课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-06-23', no: 5, teacher: '陈亦然', due: 25, actual: 21, sign: '已签到', schoolConfirm: '已确认', status: '异常', amount: 0, note: '实到人数与考勤记录不符，待机构补充说明' },
    { id: 'ls6', cls: '科学实验探索课·周四班', course: '科学实验探索课', org: '智创未来', school: '成都天府新区第七小学', date: '2026-06-26', no: 8, teacher: '刘嘉敏', due: 28, actual: 27, sign: '已签到', schoolConfirm: '已确认', status: '已计入结算', amount: 2240 },
  ],
  settlements: [
    { id: 'JS202606-01', org: '成都智创未来教育科技有限公司', month: '2026-06', schools: '实验小学、第七小学', clsCount: 3, doneLessons: 18, gross: 25920, fee: 2592, schoolShare: 1296, refund: 900, net: 21132, status: '已结算' },
    { id: 'JS202607-01', org: '成都智创未来教育科技有限公司', month: '2026-07', schools: '实验小学、第七小学', clsCount: 3, doneLessons: 2, gross: 2880, fee: 288, schoolShare: 144, refund: 0, net: 2448, status: '待审核' },
    { id: 'JS202607-02', org: '童心美育艺术中心', month: '2026-07', schools: '实验小学', clsCount: 1, doneLessons: 0, gross: 0, fee: 0, schoolShare: 0, refund: 0, net: 0, status: '待生成' },
  ],
  aftersales: [
    { id: 'SH20260625001', parent: '杨先生', student: '杨浩然', cls: '少儿编程思维课·周二班', type: '申请退款', org: '智创未来', school: '成都天府新区实验小学', time: '2026-06-24 15:20', status: '已退款' },
    { id: 'SH20260628002', parent: '刘女士', student: '刘思彤', cls: '人工智能启蒙课·周五班', type: '课程未开班', org: '智创未来', school: '成都天府新区第七小学', time: '2026-06-28 10:05', status: '处理中' },
    { id: 'SH20260630003', parent: '王女士', student: '王梓萱', cls: '人工智能启蒙课·周三班', type: '教师缺课', org: '智创未来', school: '成都天府新区实验小学', time: '2026-06-30 18:44', status: '待处理' },
    { id: 'SH20260701004', parent: '周先生', student: '周子墨', cls: '创意水彩画课·周一班', type: '其他问题', org: '童心美育', school: '成都天府新区实验小学', time: '2026-07-01 09:12', status: '待处理' },
  ],
  users: [
    { id: 'u1', name: '张运营', phone: '138****9001', role: '平台管理员', unit: '天府未来教育中心', status: '启用', last: '2026-07-01 09:12' },
    { id: 'u2', name: '李敏', phone: '139****9002', role: '审核人员', unit: '天府未来教育中心', status: '启用', last: '2026-07-01 08:45' },
    { id: 'u3', name: '王芳', phone: '137****9003', role: '财务人员', unit: '天府未来教育中心', status: '启用', last: '2026-06-30 17:30' },
    { id: 'u4', name: '周校长', phone: '138****1001', role: '学校管理员', unit: '成都天府新区实验小学', status: '启用', last: '2026-06-30 16:02' },
    { id: 'u5', name: '王总', phone: '138****2001', role: '机构管理员', unit: '成都智创未来教育科技有限公司', status: '启用', last: '2026-07-01 10:18' },
    { id: 'u6', name: '测试客服', phone: '135****9006', role: '客服人员', unit: '天府未来教育中心', status: '禁用', last: '2026-05-20 11:00' },
  ],
  roles: [
    { id: 'r1', name: '平台管理员', desc: '全部权限', perms: 24 }, { id: 'r2', name: '运营人员', desc: '学校 / 课程配置 / 班级', perms: 14 },
    { id: 'r3', name: '审核人员', desc: '机构 / 教师 / 课程审核', perms: 8 }, { id: 'r4', name: '财务人员', desc: '订单 / 销课 / 结算', perms: 9 },
    { id: 'r5', name: '客服人员', desc: '售后 / 订单查看', perms: 5 }, { id: 'r6', name: '学校管理员', desc: '本校场地 / 班级 / 销课确认', perms: 7 },
    { id: 'r7', name: '机构管理员', desc: '本机构教师 / 课程 / 销课', perms: 10 }, { id: 'r8', name: '教师子账号', desc: '上课签到 / 提交销课', perms: 3 },
  ],
  logs: [
    { t: '2026-07-01 10:32', who: '张运营', mod: '学校课程配置', act: '将「人工智能启蒙课」分发至 成都天府新区第七小学', ip: '10.8.1.21', ret: '成功' },
    { t: '2026-07-01 10:18', who: '王总', mod: '课程管理', act: '提交课程「科学实验探索课」审核', ip: '113.54.2.8', ret: '成功' },
    { t: '2026-07-01 09:40', who: '李敏', mod: '机构审核', act: '驳回「快乐星球机器人俱乐部」入驻申请', ip: '10.8.1.22', ret: '成功' },
    { t: '2026-06-30 17:12', who: '王芳', mod: '结算管理', act: '确认打款 结算单 JS202606-01（¥21,132）', ip: '10.8.1.23', ret: '成功' },
    { t: '2026-06-30 16:55', who: '周校长', mod: '销课管理', act: '确认 6 月 30 日「少儿编程·周二班」第 6 节销课', ip: '171.221.4.9', ret: '成功' },
    { t: '2026-06-30 15:04', who: '张运营', mod: '班级管理', act: '「人工智能启蒙课·周三班」达到成班人数，标记已成班', ip: '10.8.1.21', ret: '成功' },
    { t: '2026-06-28 11:30', who: '李敏', mod: '教师审核', act: '通过教师「刘嘉敏」资质审核', ip: '10.8.1.22', ret: '成功' },
    { t: '2026-06-24 11:06', who: '王芳', mod: '订单管理', act: '订单 DD20260624005 退款 ¥900', ip: '10.8.1.23', ret: '成功' },
  ],
};

/* ---------- 工具 ---------- */
const patch = (list: any[], id: string, ch: any) => list.map((x) => (x.id === id ? { ...x, ...ch } : x));
const money = (n: number) => '¥' + n.toLocaleString('zh-CN');
const portalUrl = (path: string) => 'https://future-edu.demo' + path;
const initialPassword = (id: string) => 'Tf' + id.toUpperCase() + '@2026';
const accountText = (role: string, target: any, info: any) => [
  role + '登录信息',
  '对象：' + target.name,
  '登录链接：' + info.url,
  '登录手机号：' + info.username,
  '初始密码：' + info.password,
  '首次登录后请修改密码。',
].join('\n');
const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('登录信息已复制，可直接发送给用户');
  } catch (e) {
    message.warning('浏览器未允许自动复制，请手动复制弹窗内容');
  }
};
/* 四方分账默认比例：机构 / 平台 / 地方平台 / 天府通通道（不同课程可在审核时单独配置） */
const DEFAULT_SHARE = { org: 70, platform: 12, region: 13, tf: 5 };
const ORG_SERVICE_OPTIONS = [
  '课后素质服务',
  '科技 / AI / 编程',
  '科学实验 / STEAM',
  '艺术美育 / 书法',
  '体育 / 体适能',
  '研学实践',
  '赛事活动',
  '升学规划',
  '社区校外服务',
  '心理健康 / 家庭教育',
].map((value) => ({ value, label: value }));
const tblProps = { size: 'small' as const, rowKey: 'id', pagination: false as const, locale: { emptyText: '暂无数据' }, scroll: { x: 'max-content' } };
const statThemes = [
  { bg: 'linear-gradient(135deg, #eef6ff 0%, #ffffff 48%, #e9f0ff 100%)', glow: 'rgba(22,119,255,.18)', value: '#1765d8' },
  { bg: 'linear-gradient(135deg, #fff4df 0%, #ffffff 48%, #fff0ec 100%)', glow: 'rgba(250,140,22,.18)', value: '#d46b08' },
  { bg: 'linear-gradient(135deg, #e8fff8 0%, #ffffff 48%, #e6f6ff 100%)', glow: 'rgba(19,194,194,.18)', value: '#08979c' },
  { bg: 'linear-gradient(135deg, #f5eeff 0%, #ffffff 48%, #f0f5ff 100%)', glow: 'rgba(114,46,209,.17)', value: '#642ab5' },
  { bg: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 48%, #eafff1 100%)', glow: 'rgba(82,196,26,.18)', value: '#389e0d' },
  { bg: 'linear-gradient(135deg, #fff1f0 0%, #ffffff 48%, #fff7e6 100%)', glow: 'rgba(255,77,79,.16)', value: '#cf1322' },
  { bg: 'linear-gradient(135deg, #e6fffb 0%, #ffffff 48%, #f9f0ff 100%)', glow: 'rgba(47,84,235,.16)', value: '#2f54eb' },
  { bg: 'linear-gradient(135deg, #fff7e6 0%, #ffffff 48%, #fff1f0 100%)', glow: 'rgba(250,84,28,.17)', value: '#d4380d' },
];
const statCardStyle = (i: number): React.CSSProperties => ({
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,.76)',
  background: statThemes[i % statThemes.length].bg,
  boxShadow: '0 8px 22px rgba(28,45,72,.07), 0 1px 3px rgba(0,21,41,.04)',
});
const statGlowStyle = (i: number): React.CSSProperties => ({
  position: 'absolute',
  width: 84,
  height: 84,
  right: -28,
  top: -30,
  borderRadius: '50%',
  background: statThemes[i % statThemes.length].glow,
  pointerEvents: 'none',
});

/* ---------- 表格字段解释（列名后的 ? 悬停提示） ---------- */
const COLDEF: Record<string, string> = {
  '角色': '账号在平台中的角色，决定可见菜单与操作权限。',
  '所属单位': '账号归属的平台 / 学校 / 机构。',
  '最近登录': '最近一次登录系统的时间。',
  '权限点': '该角色拥有的功能权限数量，点「权限分配」查看明细。',
  '区域': '学校或点位所在行政区域。',
  '合作状态': '学校/点位与平台的合作签约状态，已合作方可分发课程。',
  '已配置课程': '已分发到该校并配置班级的课程数量。',
  '场地': '学校可用于课后服务的场地数量。',
  '场地类型': '教室 / 场馆类型，决定可承接的课程类别。',
  '容纳人数': '场地最大容纳学生数，限制班级报名上限。',
  '可用时间': '场地可排课的时间段（课后延时时段）。',
  '适合课程': '该场地适合开展的课程类型。',
  '对外开放': '是否允许非本校课程 / 学生使用该场地。',
  '服务方向': '机构主营的业务方向，采用固定模板多选，避免自由填写导致审核口径不一致。',
  '提交时间': '提交平台审核的时间。',
  '审核状态': '平台审核结果，悬停状态标签查看含义。',
  '结算账户': '机构是否已配置对公收款账户；未配置无法结算打款。',
  '资质类型': '教师提交的资质证书类型（教师资格证 / 从业证书等）。',
  '教授方向': '教师主要授课的课程方向。',
  '分类': '课程所属类目。',
  '适合年级': '建议报名的学生年级范围。',
  '课时': '一期课程包含的上课节次总数。',
  '建议价格': '机构建议售价；实际以分发学校时的配置价为准。',
  '成班/上限': '最低开班人数 / 班级最大容量。',
  '所需场地': '开课所需的场地类型。',
  '投放学校': '课程被分发（配置）到的学校；未分发或学校未确认的家长端不可见。',
  '班级': '课程在学校形成的具体班级，家长报名的是班级。',
  '上课时间': '固定周期的上课时间（课后延时服务时段）。',
  '报名/上限': '当前报名人数 / 班级最大容量。',
  '价格': '该校该班的实际报名价格。',
  '截止': '报名截止时间。',
  '成班状态': '是否达到最低开班人数（达到后可排课开课）。',
  '上架状态': '平台确认上架后进入对应学校家长端展示（学校侧线下配合，无需线上确认）。',
  '课时进度': '已上节次 / 总节次。',
  '报名（成班 /上限）': '当前报名人数（最低成班人数 / 最大容量）。',
  '班级状态': '班级当前阶段，悬停标签查看含义。',
  '金额': '家长实付金额，进入平台监管账户托管。',
  '支付方式': '家长付款渠道。',
  '支付状态': '订单支付流转状态。',
  '退款': '退款状态。',
  '下单时间': '家长提交订单的时间。',
  '上课日期': '本节课实际上课日期。',
  '节次': '本班课程的第几节课。',
  '应到/实到': '应到 = 班级报名人数；实到 = 实际到课人数。两者与签到不符会触发销课异常。',
  '教师签到': '教师是否已在系统完成本节课签到。',
  '确认状态': '家长对本节课的逐节确认（3 天未确认自动转全部确认），平台兜底核实；已剔除学校确认环节',
  '销课状态': '本节课的计费流转状态（待上课 → 已上课待确认 → 已确认销课 → 已计入结算；异常暂停计费）。',
  '可结算金额': '本节课确认销课后计入当月结算的金额；待上课 / 异常节次不计费。',
  '结算单号': '月度结算单编号。',
  '月份': '结算所属自然月。',
  '涉及学校': '本结算单包含的上课学校。',
  '班级数': '本结算单涉及的班级数量。',
  '完成课时': '当月经确认、可计费的课时数。',
  '已完成课时': '当月经确认、可计费的课时数。',
  '应结算': '当月所有已确认销课节次的金额合计。',
  '应结算金额': '当月所有已确认销课节次的金额合计。',
  '平台服务费': '按合作协议比例（Demo 为 10%）从应结算金额中扣除。',
  '学校服务费': '涉及学校服务费时按约定比例扣除（规则预留，Demo 为 5%）。',
  '退款扣减': '当月退款订单对应金额，从机构结算中扣回。',
  '机构实收': '应结算金额 − 平台服务费 − 学校服务费 − 退款扣减。',
  '问题类型': '家长提交的售后问题分类。',
  '课程班级': '售后涉及的课程与班级。',
  '操作内容': '本次操作的具体描述。',
  'IP': '操作来源 IP 地址。',
  '结果': '操作是否执行成功。',
  '状态': '当前业务状态，悬停状态标签查看含义，全量见右上角「名词解释」。',
};
const colTip = (cols: any[]) => (cols || []).map((c: any) =>
  typeof c.title === 'string' && COLDEF[c.title]
    ? { ...c, title: <span>{c.title} <Tooltip title={COLDEF[c.title]}><QuestionCircleOutlined style={{ color: '#b6bcc7', fontSize: 12, cursor: 'help' }} /></Tooltip></span> }
    : c);
const Tbl = (props: any) => <Table {...props} columns={colTip(props.columns)} />;
const now = () => '2026-07-01 ' + new Date().toTimeString().slice(0, 5);

/* ---------- 通用列表筛选（下拉框，默认全部，可组合多个，一键重置） ---------- */
// 生成「全部 + 去重可选值」的下拉项
const optsOf = (list: any[], key: string, label: string) =>
  [{ value: '', label: '全部' + label }, ...Array.from(new Set(list.map((r) => r[key]).filter((v) => v != null && v !== ''))).map((v: any) => ({ value: v, label: String(v) }))];
// 筛选状态 Hook：configs = [{ key, label, options, match? }]
function useTableFilter(configs: any[]) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const dirty = configs.some((c) => vals[c.key]);
  const bar = (
    <Space wrap size={8}>
      {configs.map((c) => (
        <Select key={c.key} size="small" style={{ minWidth: c.width || 150 }}
          value={vals[c.key] ?? ''} options={c.options}
          onChange={(v) => setVals((s) => ({ ...s, [c.key]: v }))} />
      ))}
      {dirty && <Button size="small" type="link" onClick={() => setVals({})}>重置筛选</Button>}
    </Space>
  );
  const apply = (list: any[]) => list.filter((row) => configs.every((c) => {
    const v = vals[c.key];
    if (!v) return true;
    return c.match ? c.match(row, v) : row[c.key] === v;
  }));
  return { bar, apply };
}
// 把筛选条放在表格上方的统一容器
const FilterRow = ({ children }: any) => <div style={{ marginBottom: 12 }}>{children}</div>;

/* ---------- 上课时间安排：一个班次可含多个「星期 + 时段」，各不相同 ---------- */
const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_SLOTS = ['16:00-17:00', '16:30-17:30', '17:00-18:00', '17:30-18:30', '09:00-10:30', '10:00-11:30', '14:30-16:00'];
// 时间段数组 → 展示文案，如「每周二 16:30-17:30、每周四 17:00-18:00」
const scheduleText = (sch: any[]) => (sch || []).length
  ? sch.map((s) => `每${s.day} ${s.slot}`).join('、')
  : '未设置';
// 兼容旧数据：字符串 time → 单条 schedule
const toSchedule = (row: any) => {
  if (Array.isArray(row?.schedule) && row.schedule.length) return row.schedule;
  const m = String(row?.time || '').match(/每?周([一二三四五六日])\s*([\d:：\-~至\s]+)/);
  return m ? [{ day: '周' + m[1], slot: m[2].trim().replace(/：/g, ':') }] : [];
};
// 每周课次数
const weeklyCount = (row: any) => toSchedule(row).length || 1;

/* 时间安排编辑器：可加多条，每条独立选星期与时段 */
function ScheduleEditor({ value = [], onChange }: any) {
  const list = value.length ? value : [{ day: '周三', slot: '16:30-17:30' }];
  const update = (i: number, key: string, v: string) => onChange(list.map((x: any, j: number) => j === i ? { ...x, [key]: v } : x));
  const add = () => onChange([...list, { day: '周四', slot: '17:00-18:00' }]);
  const remove = (i: number) => onChange(list.filter((_: any, j: number) => j !== i));
  return (
    <div>
      {list.map((s: any, i: number) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
          <Select style={{ width: 96 }} value={s.day} onChange={(v: string) => update(i, 'day', v)}
            options={WEEKDAYS.map((d) => ({ value: d, label: d }))} />
          <Select style={{ width: 150 }} value={s.slot} onChange={(v: string) => update(i, 'slot', v)}
            showSearch popupMatchSelectWidth={false}
            options={Array.from(new Set([...TIME_SLOTS, s.slot])).map((t) => ({ value: t, label: t }))} />
          <Button type="text" danger size="small" disabled={list.length <= 1} onClick={() => remove(i)}>删除</Button>
          {i === list.length - 1 && <Button type="link" size="small" onClick={add}>+ 添加一节</Button>}
        </Space>
      ))}
      <div style={{ color: '#8a919f', fontSize: 12 }}>
        每周 <b>{list.length}</b> 节 · {scheduleText(list)}（各节星期与时段可不同，如需隔周/单次调整由机构在排课中处理）
      </div>
    </div>
  );
}

/* ---------- 通用：审核弹窗 ---------- */
function AuditModal({ open, title, onClose, onSubmit }: any) {
  const [result, setResult] = useState('通过');
  const [reason, setReason] = useState('');
  return (
    <Modal open={open} title={title} okText="提交" cancelText="取消" onCancel={onClose}
      onOk={() => {
        if (result === '驳回' && !reason.trim()) { message.warning('请填写驳回原因'); return; }
        onSubmit(result, reason); setResult('通过'); setReason('');
      }}>
      <Space direction="vertical" style={{ width: '100%' }} size={14}>
        <Radio.Group value={result} onChange={(e: any) => setResult(e.target.value)}>
          <Radio.Button value="通过">审核通过</Radio.Button>
          <Radio.Button value="驳回">审核驳回</Radio.Button>
        </Radio.Group>
        {result === '驳回' && <TextArea rows={3} placeholder="请填写驳回原因（必填）" value={reason} onChange={(e: any) => setReason(e.target.value)} />}
        {result === '通过' && <Alert type="success" showIcon message="审核通过后将进入下一业务环节" />}
      </Space>
    </Modal>
  );
}

/* ---------- 通用：审核记录 ---------- */
const AuditTimeline = ({ items }: { items: any[] }) => (
  <Timeline items={(items || []).map((a) => ({
    color: a.act.includes('驳回') ? 'red' : a.act.includes('通过') ? 'green' : 'blue',
    children: <div><b>{a.act}</b> · {a.who}<div style={{ color: '#999', fontSize: 12 }}>{a.t}{a.note ? ' · ' + a.note : ''}</div></div>,
  }))} />
);

/* ============================================================
 * 页面组件
 * ============================================================ */

/* 一、首页看板 */
function Dashboard({ db, go }: any) {
  const stat = [
    { t: '合作学校/点位', v: db.schools.filter((s: any) => s.status === '已合作').length, u: '个', k: 'school' },
    { t: '入驻机构', v: db.orgs.filter((o: any) => o.status === '审核通过').length, u: '家', k: 'org' },
    { t: '课程库课程', v: db.courses.filter((c: any) => c.status === '已入课程库').length, u: '门', k: 'course' },
    { t: '待审核事项', v: db.orgs.filter((o: any) => o.status === '待审核').length + db.teachers.filter((t: any) => t.status === '待审核').length + db.courses.filter((c: any) => c.status === '待审核').length, u: '项', k: 'org', warn: true },
    { t: '今日上课班级', v: 2, u: '个', k: 'class' },
    { t: '本月报名人数', v: 56, u: '人', k: 'order' },
    { t: '本月交易金额', v: '¥46,780', u: '', k: 'order' },
    { t: '待结算金额', v: money(db.settlements.filter((s: any) => s.status !== '已结算').reduce((a: number, s: any) => a + s.net, 0)), u: '', k: 'settle', warn: true },
  ];
  const mini = (rows: any[], cols: any[], key: string, title: string, tab: string) => (
    <Card size="small" title={title} extra={<a onClick={() => go(tab)}>查看全部 <RightOutlined /></a>} style={{ height: '100%' }}>
      <Tbl {...tblProps} rowKey={key} columns={cols} dataSource={rows} />
    </Card>
  );
  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Steps size="small" items={['创建学校/点位/场地', '机构入驻审核', '教师资质审核', '课程审核入库', '课程分发学校/点位', '家长报名付费', '按节上课销课', '按月结算机构'].map((t) => ({ title: t, status: 'finish' }))} />
      </Card>
      <Row gutter={[16, 16]}>
        {stat.map((s, i) => (
          <Col span={6} key={i}>
            <Card size="small" hoverable onClick={() => go(s.k)} style={statCardStyle(i)} bodyStyle={{ position: 'relative', zIndex: 1 }}>
              <div style={statGlowStyle(i)} />
              <Statistic
                title={<span style={{ color: '#5f6673' }}>{s.t}</span>}
                value={s.v}
                suffix={s.u}
                valueStyle={{ color: s.warn ? '#fa8c16' : statThemes[i % statThemes.length].value, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>{mini(db.orgs.filter((o: any) => o.status === '待审核'), [
          { title: '机构名称', dataIndex: 'name' }, { title: '服务方向', dataIndex: 'dir' }, { title: '提交时间', dataIndex: 'submitAt' }, { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        ], 'id', '待审核机构', 'org')}</Col>
        <Col span={12}>{mini(db.teachers.filter((t: any) => t.status === '待审核'), [
          { title: '教师', dataIndex: 'name' }, { title: '机构', dataIndex: 'org', ellipsis: true }, { title: '方向', dataIndex: 'dir' }, { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        ], 'id', '待审核教师', 'teacher')}</Col>
        <Col span={12}>{mini(db.courses.filter((c: any) => c.status === '待审核'), [
          { title: '课程', dataIndex: 'name' }, { title: '机构', dataIndex: 'org', ellipsis: true }, { title: '分类', dataIndex: 'cat' }, { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        ], 'id', '待审核课程', 'course')}</Col>
        <Col span={12}>{mini([
          { id: 1, cls: '人工智能启蒙课·周三班', school: '实验小学', time: '16:30-17:30', teacher: '王思远' },
          { id: 2, cls: '少儿编程思维课·周二班', school: '实验小学', time: '16:30-17:30', teacher: '陈亦然' },
        ], [
          { title: '班级', dataIndex: 'cls' }, { title: '学校', dataIndex: 'school' }, { title: '时间', dataIndex: 'time' }, { title: '教师', dataIndex: 'teacher' },
        ], 'id', '今日上课安排', 'class')}</Col>
        <Col span={24}>{mini(db.settlements, [
          { title: '结算单号', dataIndex: 'id' }, { title: '机构', dataIndex: 'org', ellipsis: true }, { title: '月份', dataIndex: 'month' },
          { title: '已完成课时', dataIndex: 'doneLessons' }, { title: '应结算', dataIndex: 'gross', render: money }, { title: '机构实收', dataIndex: 'net', render: money },
          { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        ], 'id', '本月结算概览', 'settle')}</Col>
      </Row>
    </div>
  );
}

/* 二、平台用户管理 */
function UserPage({ db, setDb }: any) {
  const [addOpen, setAddOpen] = useState(false);
  const [permRole, setPermRole] = useState<any>(null);
  return (
    <Tabs items={[
      {
        key: 'users', label: '用户列表', children: (
          <Card size="small" title="平台账号" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>新增用户</Button>}>
            <Tbl {...tblProps} dataSource={db.users} columns={[
              { title: '姓名', dataIndex: 'name' }, { title: '手机号', dataIndex: 'phone' }, { title: '角色', dataIndex: 'role', render: (v: string) => <Tag color="blue">{v}</Tag> },
              { title: '所属单位', dataIndex: 'unit', ellipsis: true }, { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> }, { title: '最近登录', dataIndex: 'last' },
              { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => message.info('Demo：查看用户 ' + r.name)}>查看</a><a onClick={() => message.info('Demo：编辑用户')}>编辑</a>
                <a style={{ color: r.status === '启用' ? '#ff4d4f' : '#52c41a' }} onClick={() => setDb((d: any) => ({ ...d, users: patch(d.users, r.id, { status: r.status === '启用' ? '禁用' : '启用' }) }))}>{r.status === '启用' ? '禁用' : '启用'}</a></Space> },
            ]} />
            <Modal open={addOpen} title="新增用户" okText="创建" cancelText="取消" onCancel={() => setAddOpen(false)}
              onOk={() => { setAddOpen(false); message.success('Demo：用户创建成功，已发送初始密码短信'); }}>
              <Form layout="vertical">
                <Form.Item label="姓名"><Input placeholder="请输入姓名" /></Form.Item>
                <Form.Item label="手机号"><Input placeholder="请输入手机号" /></Form.Item>
                <Form.Item label="角色"><Select placeholder="请选择角色" options={db.roles.map((r: any) => ({ value: r.name, label: r.name }))} /></Form.Item>
                <Form.Item label="所属单位"><Input placeholder="如：天府未来教育中心 / 某学校 / 某机构" /></Form.Item>
              </Form>
            </Modal>
          </Card>
        ),
      },
      {
        key: 'roles', label: '角色与权限', children: (
          <Card size="small" title="角色管理">
            <Tbl {...tblProps} dataSource={db.roles} columns={[
              { title: '角色名称', dataIndex: 'name', render: (v: string) => <Tag color="geekblue">{v}</Tag> }, { title: '说明', dataIndex: 'desc' },
              { title: '权限点', dataIndex: 'perms', render: (v: number) => v + ' 项' },
              { title: '操作', render: (_: any, r: any) => <a onClick={() => setPermRole(r)}>权限分配</a> },
            ]} />
            <Modal open={!!permRole} title={'权限分配：' + (permRole?.name || '')} okText="保存" cancelText="取消" onCancel={() => setPermRole(null)}
              onOk={() => { setPermRole(null); message.success('Demo：权限已保存'); }}>
              <Checkbox.Group style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
                defaultValue={['看板', '学校/点位管理', '机构审核']}
                options={['看板', '用户管理', '学校/点位管理', '场地管理', '机构审核', '教师审核', '课程审核', '课程配置', '成班管理', '订单管理', '销课管理', '结算管理', '售后管理', '操作日志'].map((x) => ({ label: x, value: x }))} />
            </Modal>
          </Card>
        ),
      },
    ]} />
  );
}

/* 三、学校/点位管理 */
function SchoolPage({ db, setDb, go }: any) {
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [form] = Form.useForm();
  const sceneWatch = Form.useWatch('scene', form) || '校内';
  const flt = useTableFilter([
    { key: 'scene', label: '类型', options: optsOf(db.schools, 'scene', '类型') },
    { key: 'area', label: '区域', options: optsOf(db.schools, 'area', '区域') },
    { key: 'status', label: '合作状态', options: optsOf(db.schools, 'status', '状态') },
  ]);
  const createSchoolOrSite = () => {
    form.validateFields().then((v: any) => {
      const row = {
        id: 'sc' + Date.now(),
        scene: v.scene,
        name: v.name,
        area: v.area,
        addr: v.addr,
        contact: v.contact,
        phone: v.phone,
        status: '待合作',
        courses: 0,
        venues: 0,
        openOutside: v.openOutside || '否',
      };
      setDb((d: any) => ({ ...d, schools: [row, ...d.schools] }));
      setAddOpen(false);
      form.resetFields();
      setDetail(row);
      message.success((row.scene === '校外' ? '校外点位' : '学校') + '已创建，状态为「待合作」');
    });
  };
  return (
    <Card size="small" title="合作学校/点位" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>新增学校/点位</Button>}>
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.schools)} columns={[
        { title: '学校/点位名称', dataIndex: 'name' },
        { title: '类型', dataIndex: 'scene', render: (v: string) => <Tag color={v === '校外' ? 'purple' : 'geekblue'}>{v || '校内'}</Tag> },
        { title: '区域', dataIndex: 'area' }, { title: '地址', dataIndex: 'addr', ellipsis: true },
        { title: '联系人', dataIndex: 'contact' }, { title: '电话', dataIndex: 'phone' },
        { title: '合作状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '已配置课程', dataIndex: 'courses', render: (v: number) => v + ' 门' }, { title: '场地', dataIndex: 'venues', render: (v: number) => v + ' 个' },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => setDetail(r)}>查看</a><a onClick={() => message.info('Demo：编辑学校/点位')}>编辑</a><a onClick={() => go('venue')}>场地管理</a><a onClick={() => go('deploy')}>课程配置</a></Space> },
      ]} />
      <Modal open={addOpen} width={560} title="新增学校/点位" okText="创建" cancelText="取消" onCancel={() => { setAddOpen(false); form.resetFields(); }}
        onOk={createSchoolOrSite}>
        <Form form={form} layout="vertical" initialValues={{ scene: '校内', openOutside: '否' }}>
          <Alert type="info" showIcon style={{ marginBottom: 12 }} message="校内按学校管理；校外按社区/街道/公共服务中心等点位管理。" />
          <Form.Item label="类型" name="scene" rules={[{ required: true, message: '请选择类型' }]}>
            <Radio.Group><Radio value="校内">校内（学校）</Radio><Radio value="校外">校外（点位）</Radio></Radio.Group>
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item label={sceneWatch === '校外' ? '点位名称' : '学校名称'} name="name" rules={[{ required: true, message: sceneWatch === '校外' ? '请输入点位名称' : '请输入学校名称' }]}><Input placeholder={sceneWatch === '校外' ? '如：华阳街道党群服务中心' : '请输入学校全称'} /></Form.Item></Col>
            <Col span={12}><Form.Item label="所属区域" name="area" rules={[{ required: true, message: '请选择所属区域' }]}><Select placeholder="请选择" options={['天府新区', '双流区', '武侯区', '高新区'].map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
          </Row>
          <Form.Item label={sceneWatch === '校外' ? '点位地址' : '学校地址'} name="addr" rules={[{ required: true, message: '请输入详细地址' }]}><Input placeholder="请输入详细地址" /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item label={sceneWatch === '校外' ? '点位联系人' : '学校联系人'} name="contact" rules={[{ required: true, message: '请输入联系人' }]}><Input placeholder="姓名" /></Form.Item></Col>
            <Col span={12}><Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}><Input placeholder="手机号" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item label={sceneWatch === '校外' ? '点位管理员账号' : '学校管理员账号'} name="adminPhone"><Input placeholder="手机号（自动创建账号）" /></Form.Item></Col>
            <Col span={12}><Form.Item label={sceneWatch === '校外' ? '是否面向周边开放' : '是否允许外校学生报名'} name="openOutside"><Radio.Group><Radio value="是">是</Radio><Radio value="否">否</Radio></Radio.Group></Form.Item></Col>
          </Row>
          <Form.Item label="备注"><TextArea rows={2} placeholder="选填" /></Form.Item>
        </Form>
      </Modal>
      <Drawer open={!!detail} width={520} title={(detail?.scene === '校外' ? '点位详情' : '学校详情')} onClose={() => setDetail(null)}>
        {detail && <>
          <Descriptions column={1} size="small" bordered items={[
            { key: '1', label: '学校/点位名称', children: detail.name }, { key: '2', label: '类型', children: <Tag color={detail.scene === '校外' ? 'purple' : 'geekblue'}>{detail.scene || '校内'}</Tag> },
            { key: '3', label: '所属区域', children: detail.area },
            { key: '4', label: detail.scene === '校外' ? '点位地址' : '学校地址', children: detail.addr }, { key: '5', label: '联系人', children: detail.contact + ' / ' + detail.phone },
            { key: '6', label: '合作状态', children: <S v={detail.status} /> },
            { key: '7', label: '已配置课程', children: detail.courses + ' 门' }, { key: '8', label: '场地数量', children: detail.venues + ' 个' },
          ]} />
          <Divider>{detail.scene === '校外' ? '本点位场地' : '本校场地'}</Divider>
          <Tbl {...tblProps} dataSource={db.venues.filter((v: any) => detail.scene === '校外' ? v.site === detail.name : v.school === detail.name)} columns={[
            { title: '场地', dataIndex: 'name' }, { title: '类型', dataIndex: 'type' }, { title: '容纳', dataIndex: 'cap' }, { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
          ]} />
        </>}
      </Drawer>
    </Card>
  );
}

/* 四、场地管理 */
function VenuePage({ db, setDb }: any) {
  const [addOpen, setAddOpen] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [form] = Form.useForm();
  const sceneWatch = Form.useWatch('scene', form);
  const isOutside = sceneWatch === '校外';
  const createVenue = async () => {
    const values = await form.validateFields();
    // 校内：归属学校；校外：归属社区点位（无学校）
    const place = values.scene === '校外' ? values.site : values.school;
    const duplicate = db.venues.some((v: any) => (v.school || v.site) === place && v.name === values.name);
    if (duplicate) return message.warning('该' + (values.scene === '校外' ? '点位' : '学校') + '已存在同名场地，请更换名称');
    const venue = {
      id: 'v' + Date.now(),
      name: values.name,
      scene: values.scene,
      school: values.scene === '校外' ? '' : values.school,
      site: values.scene === '校外' ? values.site : '',
      type: values.type,
      cap: values.cap,
      time: values.time,
      fit: values.fit,
      open: values.open,
      status: values.status,
    };
    setDb((d: any) => ({
      ...d,
      venues: [venue, ...d.venues],
      schools: values.scene === '校外' ? d.schools : d.schools.map((s: any) => s.name === values.school ? { ...s, venues: d.venues.filter((v: any) => v.school === s.name).length + 1 } : s),
    }));
    setAddOpen(false);
    form.resetFields();
    message.success((values.scene === '校外' ? '校外点位场地' : '校内场地') + '创建成功，可在课程分发时选择使用');
  };
  const flt = useTableFilter([
    { key: 'school', label: '所属学校', width: 200, options: optsOf(db.venues, 'school', '学校') },
    { key: 'scene', label: '场景', width: 110, options: optsOf(db.venues, 'scene', '场景') },
    { key: 'type', label: '类型', options: optsOf(db.venues, 'type', '类型') },
    { key: 'status', label: '状态', width: 110, options: optsOf(db.venues, 'status', '状态') },
  ]);
  return (
    <Card size="small" title="场地管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>新增场地</Button>}>
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.venues)} columns={[
        { title: '场地名称', dataIndex: 'name' },
        { title: '所属学校 / 点位', ellipsis: true, render: (_: any, r: any) => r.scene === '校外' ? (r.site || r.school || '—') + ' · 校外点位' : (r.school || '—') },
        { title: '场景', dataIndex: 'scene', render: (v: string) => <Tag color={v === '校外' ? 'purple' : 'geekblue'}>{v || '校内'}</Tag> },
        { title: '类型', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> }, { title: '容纳人数', dataIndex: 'cap' },
        { title: '可用时间', dataIndex: 'time' }, { title: '适合课程', dataIndex: 'fit' }, { title: '对外开放', dataIndex: 'open' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => message.info('Demo：编辑场地')}>编辑</a>
          <a onClick={() => setDb((d: any) => ({ ...d, venues: patch(d.venues, r.id, { status: r.status === '启用' ? '停用' : '启用' }) }))}>{r.status === '启用' ? '停用' : '启用'}</a>
          <a onClick={() => setSchedule(r)}>查看排课</a></Space> },
      ]} />
      <Modal open={addOpen} title="新增场地" okText="创建" cancelText="取消" onCancel={() => { setAddOpen(false); form.resetFields(); }}
        onOk={createVenue}>
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message={isOutside ? '校外场地归属社区党群服务中心等社会点位，由地方平台运营，不挂靠学校。' : '校内场地挂靠合作学校；课程分发配置班级时，只能选择该学校已创建且启用的场地。'} />
        <Form form={form} layout="vertical" initialValues={{ open: '否', status: '启用', scene: '校内' }}>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="场景" name="scene"><Radio.Group><Radio value="校内">校内</Radio><Radio value="校外">校外</Radio></Radio.Group></Form.Item></Col>
            <Col span={12}>
              {isOutside
                ? <Form.Item label="所属点位（地点名称）" name="site" rules={[{ required: true, message: '请输入点位地点名称' }]}><Input placeholder="如：天府少年宫 / 万象城商场 / 麓山社区党群服务中心" /></Form.Item>
                : <Form.Item label="所属学校" name="school" rules={[{ required: true, message: '请选择学校' }]}><Select placeholder="请选择学校" options={db.schools.map((s: any) => ({ value: s.name, label: s.name }))} /></Form.Item>}
            </Col>
          </Row>
          <Form.Item label="场地名称" name="name" rules={[{ required: true, message: '请输入场地名称' }]}><Input placeholder="如：科技教室 B" /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="场地类型" name="type" rules={[{ required: true, message: '请选择场地类型' }]}><Select placeholder="请选择" options={['科技教室', '计算机教室', '美术教室', '音乐教室', '操场', '多功能室'].map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
            <Col span={12}><Form.Item label="容纳人数" name="cap" rules={[{ required: true, message: '请输入容纳人数' }]}><InputNumber min={1} style={{ width: '100%' }} placeholder="30" /></Form.Item></Col>
          </Row>
          <Form.Item label="可用时间" name="time" rules={[{ required: true, message: '请输入可用时间' }]}><Input placeholder="如：周一至周五 16:00-18:00" /></Form.Item>
          <Form.Item label="适合课程" name="fit" rules={[{ required: true, message: '请输入适合课程' }]}><Input placeholder="如：AI / 编程 / 科学实验" /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="对外开放" name="open"><Radio.Group><Radio value="是">是</Radio><Radio value="否">否</Radio></Radio.Group></Form.Item></Col>
            <Col span={12}><Form.Item label="状态" name="status"><Radio.Group><Radio value="启用">启用</Radio><Radio value="停用">停用</Radio></Radio.Group></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
      <Drawer open={!!schedule} width={480} title={'场地排课：' + (schedule?.name || '')} onClose={() => setSchedule(null)}>
        <Tbl {...tblProps} rowKey="k" dataSource={[
          { k: 1, day: '周一', slot: '16:30-17:30', cls: '创意水彩画课·周一班' },
          { k: 2, day: '周二', slot: '16:30-17:30', cls: '少儿编程思维课·周二班' },
          { k: 3, day: '周三', slot: '16:30-17:30', cls: '人工智能启蒙课·周三班' },
        ]} columns={[{ title: '星期', dataIndex: 'day' }, { title: '时段', dataIndex: 'slot' }, { title: '占用班级', dataIndex: 'cls' }]} />
      </Drawer>
    </Card>
  );
}

/* 五、机构入驻管理 */
function OrgPage({ db, setDb }: any) {
  const [detail, setDetail] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [accountTarget, setAccountTarget] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const saveLicensePhoto = (org: any, info: any) => {
    const name = info?.file?.name || '营业执照照片.jpg';
    setDb((d: any) => ({ ...d, orgs: patch(d.orgs, org.id, { licensePhoto: name }) }));
    setDetail((cur: any) => cur?.id === org.id ? { ...cur, licensePhoto: name } : cur);
    message.success('营业执照照片已上传（Demo 记录文件名）');
  };
  const orgAccount = (org: any) => org.accountInfo || {
    url: portalUrl('/org/'),
    username: org.phone,
    password: initialPassword(org.id),
  };
  const openOrgAccount = (org: any) => {
    const info = orgAccount(org);
    setDb((d: any) => ({ ...d, orgs: patch(d.orgs, org.id, { account: '已配置', accountInfo: info }) }));
    setDetail((cur: any) => cur?.id === org.id ? { ...cur, account: '已配置', accountInfo: info } : cur);
    setAccountTarget({ ...org, account: '已配置', accountInfo: info });
  };
  const licensePhotoField = (org: any) => (
    <Space direction="vertical" size={6}>
      <Space size={6}>
        <S v={org.licensePhoto ? '已上传' : '未上传'} />
        <span>{org.licensePhoto || '请上传营业执照照片'}</span>
      </Space>
      <Upload accept="image/*,.pdf" beforeUpload={() => false} showUploadList={false} onChange={(info: any) => saveLicensePhoto(org, info)}>
        <Button size="small" icon={<PlusOutlined />}>{org.licensePhoto ? '重新上传' : '上传营业执照照片'}</Button>
      </Upload>
    </Space>
  );
  const doAudit = (result: string, reason: string) => {
    const st = result === '通过' ? '审核通过' : '审核驳回';
    setDb((d: any) => ({ ...d, orgs: patch(d.orgs, audit.id, { status: st, audits: [{ t: now(), who: '审核员-李敏', act: st, note: reason }, ...audit.audits] }) }));
    message.success(result === '通过' ? '机构审核通过，已开通教师创建与课程发布权限' : '已驳回，原因将通知机构');
    setAudit(null); setDetail(null);
  };
  const submitOrg = (org: any) => {
    const next = { ...org, status: '待审核', audits: [{ t: now(), who: '平台运营', act: '提交机构入驻审核', note: '资料已补充，进入平台审核' }, ...(org.audits || [])] };
    setDb((d: any) => ({ ...d, orgs: patch(d.orgs, org.id, next) }));
    setDetail((cur: any) => cur?.id === org.id ? next : cur);
    message.success('机构已提交审核');
  };
  const createOrg = (submit = false) => {
    createForm.validateFields().then((v: any) => {
      const id = 'og' + (Date.now() % 100000);
      const dir = Array.isArray(v.dir) ? v.dir.join(' / ') : v.dir;
      const org = {
        id,
        name: v.name,
        contact: v.contact,
        phone: v.phone,
        dir,
        submitAt: now().slice(0, 10),
        status: submit ? '待审核' : '待完善',
        courses: 0,
        teachers: 0,
        account: '未配置',
        license: v.license || '待补充',
        licensePhoto: '',
        legal: v.legal || '待补充',
        scope: v.scope || dir,
        agreement: '待审核通过后签署',
        audits: [{ t: now(), who: '平台运营', act: submit ? '后台代填并提交审核' : '创建机构基础档案', note: submit ? '后台协助补充机构资料，直接进入平台审核' : '机构可登录后补充资料，再提交审核' }],
      };
      setDb((d: any) => ({ ...d, orgs: [org, ...d.orgs] }));
      message.success(submit ? '机构已创建并提交审核' : '机构基础档案已创建，可开通账户给机构补充资料');
      createForm.resetFields();
      setCreateOpen(false);
      setDetail(org);
    });
  };
  const flt = useTableFilter([
    { key: 'status', label: '审核状态', options: optsOf(db.orgs, 'status', '审核状态') },
    { key: 'account', label: '结算账户', options: optsOf(db.orgs, 'account', '账户状态') },
  ]);
  return (
    <Card size="small" title="培训机构入驻" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新增机构</Button>}>
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.orgs)} columns={[
        { title: '机构名称', dataIndex: 'name', ellipsis: true }, { title: '联系人', dataIndex: 'contact' }, { title: '电话', dataIndex: 'phone' },
        { title: '服务方向', dataIndex: 'dir' }, { title: '提交时间', dataIndex: 'submitAt' },
        { title: '审核状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '执照照片', render: (_: any, r: any) => <S v={r.licensePhoto ? '已上传' : '未上传'} /> },
        { title: '登录账户', render: (_: any, r: any) => <S v={r.accountInfo ? '已开通' : '未开通'} /> },
        { title: '课程', dataIndex: 'courses' }, { title: '教师', dataIndex: 'teachers' }, { title: '结算账户', dataIndex: 'account' },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => setDetail(r)}>查看资料</a>
          {r.status === '待审核' && <a style={{ color: '#fa8c16' }} onClick={() => setAudit(r)}>审核</a>}
          <a onClick={() => openOrgAccount(r)}>{r.accountInfo ? '复制账户' : '开通账户'}</a>
          <a onClick={() => message.info('Demo：编辑机构')}>编辑</a>
          <a style={{ color: '#ff4d4f' }} onClick={() => setDb((d: any) => ({ ...d, orgs: patch(d.orgs, r.id, { status: '已禁用' }) }))}>禁用</a></Space> },
      ]} />
      <Drawer open={!!detail} width={620} title="机构详情" onClose={() => setDetail(null)}
        extra={detail && <Space>
          {detail.status === '待完善' && <Button type="primary" onClick={() => submitOrg(detail)}>提交审核</Button>}
          {detail.status === '待审核' && <Button type="primary" onClick={() => setAudit(detail)}>审核</Button>}
        </Space>}>
        {detail && <>
          <Descriptions column={2} size="small" bordered items={[
            { key: '1', label: '机构名称', span: 2, children: detail.name },
            { key: '2', label: '审核状态', children: <S v={detail.status} /> }, { key: '3', label: '提交时间', children: detail.submitAt },
            { key: '4', label: '营业执照', span: 2, children: detail.license },
            { key: '5', label: '营业执照照片', span: 2, children: licensePhotoField(detail) },
            { key: '6', label: '法人信息', children: detail.legal }, { key: '7', label: '联系人', children: detail.contact + ' / ' + detail.phone },
            { key: '8', label: '服务范围', span: 2, children: detail.scope },
            { key: '9', label: '课程方向', children: detail.dir }, { key: '10', label: '结算账户', children: detail.account },
            { key: '11', label: '合作协议', span: 2, children: detail.agreement },
            { key: '12', label: '机构端账户', span: 2, children: detail.accountInfo ? <Space direction="vertical" size={4}>
              <span>链接：{detail.accountInfo.url}</span><span>手机号：{detail.accountInfo.username}</span><span>初始密码：{detail.accountInfo.password}</span>
              <Button size="small" onClick={() => copyText(accountText('机构端', detail, detail.accountInfo))}>复制链接和密码</Button>
            </Space> : <Button size="small" type="primary" onClick={() => openOrgAccount(detail)}>开通机构端账户</Button> },
          ]} />
          <Divider>审核记录</Divider>
          <AuditTimeline items={detail.audits} />
        </>}
      </Drawer>
      <Modal open={!!accountTarget} title="机构端登录信息" onCancel={() => setAccountTarget(null)} footer={[
        <Button key="close" onClick={() => setAccountTarget(null)}>关闭</Button>,
        <Button key="copy" type="primary" onClick={() => copyText(accountText('机构端', accountTarget, accountTarget.accountInfo))}>复制链接和密码</Button>,
      ]}>
        {accountTarget && <TextArea rows={7} readOnly value={accountText('机构端', accountTarget, accountTarget.accountInfo)} />}
      </Modal>
      <Modal open={createOpen} title="新增机构" onCancel={() => setCreateOpen(false)} footer={[
        <Button key="cancel" onClick={() => setCreateOpen(false)}>取消</Button>,
        <Button key="save" onClick={() => createOrg(false)}>保存基础信息</Button>,
        <Button key="submit" type="primary" onClick={() => createOrg(true)}>后台代填并提交审核</Button>,
      ]} width={640}>
        <Form form={createForm} layout="vertical">
          <Form.Item label="机构名称" name="name" rules={[{ required: true, message: '请输入机构名称' }]}><Input placeholder="如：成都未来科学教育中心" /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="联系人" name="contact" rules={[{ required: true, message: '请输入联系人' }]}><Input placeholder="如：陈老师" /></Form.Item></Col>
            <Col span={12}><Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入联系电话' }]}><Input placeholder="如：138****2008" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={24}><Form.Item label="服务方向" name="dir" rules={[{ required: true, message: '请选择服务方向' }]}><Select mode="multiple" allowClear maxTagCount="responsive" placeholder="请选择机构可提供的服务方向" options={ORG_SERVICE_OPTIONS} /></Form.Item></Col>
          </Row>
          <Form.Item label="营业执照编号" name="license"><Input placeholder="统一社会信用代码..." /></Form.Item>
          <Form.Item label="法人信息" name="legal"><Input placeholder="如：陈某某（法人）" /></Form.Item>
          <Form.Item label="服务范围" name="scope"><TextArea rows={3} placeholder="填写机构服务范围或经营说明" /></Form.Item>
          <Alert type="info" showIcon message="服务方向采用固定模板多选，便于平台审核和后续课程/机构筛选。只保存基础信息：机构登录后自己补充资料再提交审核；后台代填并提交审核：运营人员已协助补齐资料，直接进入待审核。" />
        </Form>
      </Modal>
      <AuditModal open={!!audit} title={'机构入驻审核：' + (audit?.name || '')} onClose={() => setAudit(null)} onSubmit={doAudit} />
    </Card>
  );
}

/* 六、教师审核管理 */
function TeacherPage({ db, setDb }: any) {
  const [detail, setDetail] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [accountTarget, setAccountTarget] = useState<any>(null);
  const teacherAccount = (teacher: any) => teacher.accountInfo || {
    url: portalUrl('/org/teacher/'),
    username: teacher.phone,
    password: initialPassword(teacher.id),
  };
  const openTeacherAccount = (teacher: any) => {
    const info = teacherAccount(teacher);
    setDb((d: any) => ({ ...d, teachers: patch(d.teachers, teacher.id, { accountInfo: info }) }));
    setDetail((cur: any) => cur?.id === teacher.id ? { ...cur, accountInfo: info } : cur);
    setAccountTarget({ ...teacher, accountInfo: info });
  };
  const doAudit = (result: string, reason: string) => {
    const st = result === '通过' ? '审核通过' : '审核驳回';
    setDb((d: any) => ({ ...d, teachers: patch(d.teachers, audit.id, { status: st, audits: [{ t: now(), who: '审核员-李敏', act: st, note: reason }, ...(audit.audits || [])] }) }));
    message.success(result === '通过' ? '教师审核通过，可绑定到课程和班级' : '已驳回');
    setAudit(null); setDetail(null);
  };
  const flt = useTableFilter([
    { key: 'org', label: '所属机构', width: 240, options: optsOf(db.teachers, 'org', '机构') },
    { key: 'dir', label: '教授方向', options: optsOf(db.teachers, 'dir', '方向') },
    { key: 'status', label: '审核状态', options: optsOf(db.teachers, 'status', '审核状态') },
  ]);
  return (
    <Card size="small" title="机构教师审核" extra={<Alert type="info" showIcon message="教师审核通过后，才能被绑定到课程或班级" style={{ padding: '2px 10px' }} />}>
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.teachers)} columns={[
        { title: '教师姓名', dataIndex: 'name' }, { title: '所属机构', dataIndex: 'org', ellipsis: true }, { title: '手机号', dataIndex: 'phone' },
        { title: '教授方向', dataIndex: 'dir' }, { title: '资质类型', dataIndex: 'cert', ellipsis: true },
        { title: '材料照片', render: (_: any, r: any) => <Space size={4}>
          <Tag color={r.teacherPhoto ? 'green' : 'default'}>个人照</Tag>
          <Tag color={r.certPhoto ? 'green' : 'default'}>资格证</Tag>
        </Space> },
        { title: '提交时间', dataIndex: 'submitAt' },
        { title: '审核状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '登录账户', render: (_: any, r: any) => <S v={r.accountInfo ? '已开通' : '未开通'} /> },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => setDetail(r)}>查看</a>
          {r.status === '待审核' && <a style={{ color: '#fa8c16' }} onClick={() => setAudit(r)}>审核</a>}
          <a onClick={() => openTeacherAccount(r)}>{r.accountInfo ? '复制账户' : '开通账户'}</a>
          <a style={{ color: '#ff4d4f' }} onClick={() => setDb((d: any) => ({ ...d, teachers: patch(d.teachers, r.id, { status: '已停用' }) }))}>停用</a></Space> },
      ]} />
      <Drawer open={!!detail} width={520} title="教师详情" onClose={() => setDetail(null)}
        extra={detail?.status === '待审核' && <Button type="primary" onClick={() => setAudit(detail)}>审核</Button>}>
        {detail && <>
          <Descriptions column={1} size="small" bordered items={[
            { key: '1', label: '教师姓名', children: detail.name }, { key: '2', label: '所属机构', children: detail.org },
            { key: '3', label: '手机号', children: detail.phone }, { key: '4', label: '教授方向', children: detail.dir },
            { key: '5', label: '身份证信息', children: detail.idcard }, { key: '6', label: '资质证书', children: detail.cert },
            { key: '7', label: '个人照片', children: detail.teacherPhoto || '未上传' },
            { key: '8', label: '资格证照片', children: detail.certPhoto || '未上传' },
            { key: '9', label: '个人简介', children: detail.bio }, { key: '10', label: '审核状态', children: <S v={detail.status} /> },
            { key: '11', label: '教师端账户', children: detail.accountInfo ? <Space direction="vertical" size={4}>
              <span>链接：{detail.accountInfo.url}</span><span>手机号：{detail.accountInfo.username}</span><span>初始密码：{detail.accountInfo.password}</span>
              <Button size="small" onClick={() => copyText(accountText('教师端', detail, detail.accountInfo))}>复制链接和密码</Button>
            </Space> : <Button size="small" type="primary" onClick={() => openTeacherAccount(detail)}>开通教师端账户</Button> },
          ]} />
          <Divider>审核记录</Divider>
          {(detail.audits || []).length ? <AuditTimeline items={detail.audits} /> : <div style={{ color: '#999' }}>暂无审核记录</div>}
        </>}
      </Drawer>
      <Modal open={!!accountTarget} title="教师端登录信息" onCancel={() => setAccountTarget(null)} footer={[
        <Button key="close" onClick={() => setAccountTarget(null)}>关闭</Button>,
        <Button key="copy" type="primary" onClick={() => copyText(accountText('教师端', accountTarget, accountTarget.accountInfo))}>复制链接和密码</Button>,
      ]}>
        {accountTarget && <TextArea rows={7} readOnly value={accountText('教师端', accountTarget, accountTarget.accountInfo)} />}
      </Modal>
      <AuditModal open={!!audit} title={'教师资质审核：' + (audit?.name || '')} onClose={() => setAudit(null)} onSubmit={doAudit} />
    </Card>
  );
}

/* 七、课程审核与课程库 */
function CoursePage({ db, setDb }: any) {
  const [detail, setDetail] = useState<any>(null);
  const [courseDraft, setCourseDraft] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [audit, setAudit] = useState<any>(null);
  const canManageCourse = true; // Demo 当前登录人为「张运营（平台管理员）」，具备课程资料与分账比例维护权限。
  const openDetail = (r: any) => {
    const draft = { ...r, share: { ...(r.share || DEFAULT_SHARE) } };
    setDetail(r);
    setCourseDraft(draft);
    setEditMode(false);
  };
  const updateDraft = (key: string, value: any) => setCourseDraft((d: any) => ({ ...d, [key]: value }));
  const updateShare = (key: string, value: any) => setCourseDraft((d: any) => ({ ...d, share: { ...(d.share || DEFAULT_SHARE), [key]: Number(value || 0) } }));
  const saveCourse = () => {
    const sh = courseDraft.share || DEFAULT_SHARE;
    const total = Number(sh.org || 0) + Number(sh.platform || 0) + Number(sh.region || 0) + Number(sh.tf || 0);
    if (total !== 100) return message.warning('四方分账比例合计必须为 100%');
    setDb((d: any) => ({ ...d, courses: patch(d.courses, courseDraft.id, courseDraft) }));
    setDetail(courseDraft);
    setEditMode(false);
    message.success('课程资料与分账比例已保存');
  };
  const doAudit = (result: string, reason: string) => {
    const st = result === '通过' ? '已入课程库' : '审核驳回';
    setDb((d: any) => ({ ...d, courses: patch(d.courses, audit.id, { status: st, audits: [{ t: now(), who: '审核员-李敏', act: result === '通过' ? '审核通过，入课程库' : '审核驳回', note: reason }, ...(audit.audits || [])] }) }));
    message.success(result === '通过' ? '课程已进入课程库，可分发到合作学校' : '已驳回');
    setAudit(null); setDetail(null);
  };
  const flt = useTableFilter([
    { key: 'org', label: '所属机构', width: 240, options: optsOf(db.courses, 'org', '机构') },
    { key: 'cat', label: '课程分类', options: optsOf(db.courses, 'cat', '分类') },
    { key: 'status', label: '审核状态', options: optsOf(db.courses, 'status', '状态') },
  ]);
  const cols = (isLib: boolean) => [
    { title: '课程名称', dataIndex: 'name' },
    { title: '所属机构', dataIndex: 'org', ellipsis: true },
    { title: '分类', dataIndex: 'cat', render: (v: string) => <Tag>{v}</Tag> },
    { title: '适合年级', dataIndex: 'grade' },
    { title: '课时', dataIndex: 'lessons' }, { title: '建议价格', dataIndex: 'price', render: money },
    { title: '成班/上限', render: (_: any, r: any) => r.min + ' / ' + r.max }, { title: '所需场地', dataIndex: 'venue' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
    { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => openDetail(r)}>查看</a>
      {r.status === '待审核' && <a style={{ color: '#fa8c16' }} onClick={() => setAudit(r)}>审核</a>}
      {isLib && ['已入课程库', '已下架'].includes(r.status) && <a onClick={() => setDb((d: any) => ({ ...d, courses: patch(d.courses, r.id, { status: r.status === '已入课程库' ? '已下架' : '已入课程库' }) }))}>{r.status === '已入课程库' ? '下架' : '上架'}</a>}</Space> },
  ];
  const all = db.courses;
  const pend = db.courses.filter((c: any) => ['待审核', '审核驳回', '草稿'].includes(c.status));
  const lib = db.courses.filter((c: any) => ['已入课程库', '已下架'].includes(c.status));
  const tableCard = (data: any[], isLib = false, title?: string) => (
    <Card size="small" title={title}>
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(data)} columns={cols(isLib)} />
    </Card>
  );
  return (
    <>
      <Tabs items={[
        { key: 'all', label: `全部（${all.length}）`, children: tableCard(all, true, '全部课程 · 可按机构、状态、分类筛选') },
        { key: 'audit', label: `课程审核（${pend.filter((c: any) => c.status === '待审核').length} 待审）`, children: tableCard(pend, false, '待审核 / 驳回 / 草稿课程 · 可按机构、状态、分类筛选') },
        { key: 'lib', label: `课程库（${lib.filter((c: any) => c.status === '已入课程库').length}）`, children: tableCard(lib, true, '课程库中的课程不直接对家长展示，须分发到学校后其学生方可见') },
      ]} />
      <Drawer open={!!detail} width={640} title="课程详情" onClose={() => setDetail(null)}
        extra={detail && <Space>
          {detail.status === '待审核' && <Button type="primary" onClick={() => setAudit(detail)}>审核</Button>}
          {canManageCourse && (editMode
            ? <><Button onClick={() => { setCourseDraft({ ...detail, share: { ...(detail.share || DEFAULT_SHARE) } }); setEditMode(false); }}>取消编辑</Button><Button type="primary" onClick={saveCourse}>保存</Button></>
            : <Button onClick={() => setEditMode(true)}>编辑资料 / 分账比例</Button>)}
        </Space>}>
        {detail && courseDraft && <>
          <Alert type="info" showIcon style={{ marginBottom: 12 }}
            message={canManageCourse ? '当前账号：平台运营管理员，可维护课程资料与分账比例。' : '仅平台运营管理权限可维护课程资料与分账比例。'} />
          <Form layout="vertical" disabled={!editMode || !canManageCourse}>
            <Row gutter={12}>
              <Col span={12}><Form.Item label="课程名称"><Input value={courseDraft.name} onChange={(e: any) => updateDraft('name', e.target.value)} /></Form.Item></Col>
              <Col span={12}><Form.Item label="所属机构"><Input value={courseDraft.org} onChange={(e: any) => updateDraft('org', e.target.value)} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}><Form.Item label="课程分类"><Input value={courseDraft.cat} onChange={(e: any) => updateDraft('cat', e.target.value)} /></Form.Item></Col>
              <Col span={8}><Form.Item label="适合年级"><Input value={courseDraft.grade} onChange={(e: any) => updateDraft('grade', e.target.value)} /></Form.Item></Col>
              <Col span={8}><Form.Item label="状态"><Select value={courseDraft.status} onChange={(v: string) => updateDraft('status', v)}
                options={['草稿', '待审核', '审核驳回', '已入课程库', '已下架'].map((v) => ({ value: v, label: v }))} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={6}><Form.Item label="课时数量"><InputNumber style={{ width: '100%' }} value={courseDraft.lessons} onChange={(v: any) => updateDraft('lessons', v)} /></Form.Item></Col>
              <Col span={6}><Form.Item label="建议价格"><InputNumber style={{ width: '100%' }} value={courseDraft.price} onChange={(v: any) => updateDraft('price', v)} /></Form.Item></Col>
              <Col span={6}><Form.Item label="最低成班"><InputNumber style={{ width: '100%' }} value={courseDraft.min} onChange={(v: any) => updateDraft('min', v)} /></Form.Item></Col>
              <Col span={6}><Form.Item label="最大人数"><InputNumber style={{ width: '100%' }} value={courseDraft.max} onChange={(v: any) => updateDraft('max', v)} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}><Form.Item label="所需场地"><Input value={courseDraft.venue} onChange={(e: any) => updateDraft('venue', e.target.value)} /></Form.Item></Col>
              <Col span={8}><Form.Item label="所需设备"><Input value={courseDraft.device} onChange={(e: any) => updateDraft('device', e.target.value)} /></Form.Item></Col>
              <Col span={8}><Form.Item label="关联教师"><Input value={courseDraft.teacher} onChange={(e: any) => updateDraft('teacher', e.target.value)} /></Form.Item></Col>
            </Row>
            <Form.Item label="课程介绍"><TextArea rows={3} value={courseDraft.intro} onChange={(e: any) => updateDraft('intro', e.target.value)} /></Form.Item>
            <Form.Item label="课程成果"><TextArea rows={2} value={courseDraft.outcome} onChange={(e: any) => updateDraft('outcome', e.target.value)} /></Form.Item>
          </Form>
          <Divider>分账比例配置（仅平台运营管理权限可配置）</Divider>
          {(() => {
            const sh = courseDraft.share || DEFAULT_SHARE;
            const total = Number(sh.org || 0) + Number(sh.platform || 0) + Number(sh.region || 0) + Number(sh.tf || 0);
            return <>
              <Row gutter={12}>
                <Col span={6}><Form.Item label="机构"><InputNumber style={{ width: '100%' }} value={sh.org} formatter={(v) => v + '%'} disabled={!editMode || !canManageCourse} onChange={(v: any) => updateShare('org', v)} /></Form.Item></Col>
                <Col span={6}><Form.Item label="平台"><InputNumber style={{ width: '100%' }} value={sh.platform} formatter={(v) => v + '%'} disabled={!editMode || !canManageCourse} onChange={(v: any) => updateShare('platform', v)} /></Form.Item></Col>
                <Col span={6}><Form.Item label="地方平台"><InputNumber style={{ width: '100%' }} value={sh.region} formatter={(v) => v + '%'} disabled={!editMode || !canManageCourse} onChange={(v: any) => updateShare('region', v)} /></Form.Item></Col>
                <Col span={6}><Form.Item label="天府通通道"><InputNumber style={{ width: '100%' }} value={sh.tf} formatter={(v) => v + '%'} disabled={!editMode || !canManageCourse} onChange={(v: any) => updateShare('tf', v)} /></Form.Item></Col>
              </Row>
              <Alert type={total === 100 ? 'success' : 'error'} showIcon
                message={`四方合计 ${total}%（不同课程可配置不同分账比例，保存后立即作为该课程规则）`} />
            </>;
          })()}
          <Divider>课程大纲（每节课标题）</Divider>
          <List size="small" dataSource={detail.syllabus} renderItem={(s: string, i: number) => <List.Item><Tag color="blue">{i + 1}</Tag> {s}</List.Item>} />
          <Divider>审核记录</Divider>
          {(detail.audits || []).length ? <AuditTimeline items={detail.audits} /> : <div style={{ color: '#999' }}>暂无审核记录</div>}
        </>}
      </Drawer>
      <AuditModal open={!!audit} title={'课程审核：' + (audit?.name || '')} onClose={() => setAudit(null)} onSubmit={doAudit} />
    </>
  );
}

/* 八、学校课程配置（核心：课程分发） */
function DeployPage({ db, setDb }: any) {
  const [wizOpen, setWizOpen] = useState(false);
  const [slotDetail, setSlotDetail] = useState<any>(null);
  const [slotFormOpen, setSlotFormOpen] = useState(false);
  const [slotTarget, setSlotTarget] = useState<any>(null);
  const [slotDraft, setSlotDraft] = useState<any>({});
  const [step, setStep] = useState(0);
  const [selCourse, setSelCourse] = useState<string>();
  const [selSchools, setSelSchools] = useState<string[]>([]);
  const [cfg, setCfg] = useState<any>({ className: '周三班', schedule: [{ day: '周三', slot: '16:30-17:30' }], venues: {}, price: 800, min: 10, max: 30, signupStart: '2026-07-01', deadline: '2026-07-15', openDate: '2026-09-01' });
  const libCourses = db.courses.filter((c: any) => c.status === '已入课程库');
  const course = libCourses.find((c: any) => c.name === selCourse);
  const venueOptionsFor = (schoolName: string) => db.venues
    .filter((v: any) => v.school === schoolName && v.status === '启用')
    .map((v: any) => ({ value: v.name, label: `${v.name}（${v.type} · 容纳 ${v.cap} 人）` }));
  const venueOf = (schoolName: string) => cfg.venues?.[schoolName] || venueOptionsFor(schoolName)[0]?.value || '';
  const setVenueFor = (schoolName: string, venue: string) => setCfg((c: any) => ({ ...c, venues: { ...(c.venues || {}), [schoolName]: venue } }));
  const fillVenueDefaults = () => {
    const venues = { ...(cfg.venues || {}) };
    selSchools.forEach((sc) => { if (!venues[sc]) venues[sc] = venueOptionsFor(sc)[0]?.value || ''; });
    setCfg({ ...cfg, venues });
  };
  const selectedVenueItems = selSchools.map((sc) => ({ school: sc, venue: venueOf(sc) }));
  const hasMissingVenue = selectedVenueItems.some((x) => !x.venue);
  const deploymentGroups = Object.values(db.deployments.reduce((acc: any, item: any) => {
    const key = item.course + '|' + item.school;
    if (!acc[key]) acc[key] = { key, course: item.course, org: item.org, school: item.school, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {})).map((g: any) => ({
    ...g,
    id: g.key,
    classCount: g.items.length,
    enrolled: g.items.reduce((sum: number, x: any) => sum + x.enrolled, 0),
    max: g.items.reduce((sum: number, x: any) => sum + x.max, 0),
    minPrice: Math.min(...g.items.map((x: any) => x.price)),
    signupStart: g.items.map((x: any) => x.signupStart).sort()[0],
    deadline: g.items.map((x: any) => x.deadline).sort().slice(-1)[0],
    shelf: g.items.every((x: any) => x.shelf === '已下架') ? '已下架' : g.items.some((x: any) => x.shelf === '待确认') ? '待确认' : '已上架',
    status: g.items.some((x: any) => x.formed === '报名中') ? '报名中' : g.items.some((x: any) => x.formed === '未到购买时间') ? '未到购买时间' : g.items[0]?.formed,
  }));
  const activeSlotDetail = slotDetail ? deploymentGroups.find((g: any) => g.id === slotDetail.id) || slotDetail : null;
  const deployFlt = useTableFilter([
    { key: 'course', label: '课程', width: 200, options: optsOf(deploymentGroups, 'course', '课程') },
    { key: 'school', label: '投放学校', width: 200, options: optsOf(deploymentGroups, 'school', '学校') },
    { key: 'status', label: '成班状态', options: optsOf(deploymentGroups, 'status', '成班状态') },
    { key: 'shelf', label: '上架状态', options: optsOf(deploymentGroups, 'shelf', '上架状态') },
  ]);
  const reset = () => { setWizOpen(false); setStep(0); setSelCourse(undefined); setSelSchools([]); };
  const openSlotForm = (group: any, row?: any) => {
    if (!group) return;
    const base = row || group.items?.[0] || {};
    setSlotTarget(group);
    setSlotDraft({
      id: row?.id,
      oldClassName: row?.className,
      className: row?.className || '',
      schedule: toSchedule(row || base).length ? toSchedule(row || base) : [{ day: '周三', slot: '16:30-17:30' }],
      venue: row?.venue || venueOptionsFor(group.school)[0]?.value || base.venue || '',
      teacher: base.teacher || '',
      price: base.price || group.minPrice || 800,
      min: base.min || 10,
      max: base.max || 30,
      signupStart: base.signupStart || '2026-07-12',
      deadline: base.deadline || '2026-07-20',
      formed: '未到购买时间',
      shelf: group.shelf === '已下架' ? '已下架' : '已上架',
    });
    setSlotFormOpen(true);
  };
  const saveSlot = () => {
    if (!slotTarget) return;
    if (!slotDraft.className?.trim()) return message.warning('请输入班次名称');
    if (!slotDraft.schedule?.length) return message.warning('请至少设置一节上课时间');
    if (!slotDraft.venue) return message.warning('请选择上课场地');
    const courseInfo = db.courses.find((c: any) => c.name === slotTarget.course) || {};
    const slotTime = scheduleText(slotDraft.schedule); // 兼容旧字段：同时写入展示用 time
    if (slotDraft.id) {
      const nextName = slotTarget.course + '·' + slotDraft.className.trim();
      const oldName = slotTarget.course + '·' + (slotDraft.oldClassName || slotDraft.className).trim();
      setDb((d: any) => ({
        ...d,
        deployments: patch(d.deployments, slotDraft.id, {
          className: slotDraft.className.trim(),
          time: slotTime,
          schedule: slotDraft.schedule,
          venue: slotDraft.venue,
          teacher: slotDraft.teacher || courseInfo.teacher || '',
          max: slotDraft.max,
          min: slotDraft.min,
          price: slotDraft.price,
          signupStart: slotDraft.signupStart,
          deadline: slotDraft.deadline,
          formed: slotDraft.formed,
          shelf: slotDraft.shelf,
        }),
        classes: d.classes.map((x: any) => x.course === slotTarget.course && x.school === slotTarget.school && x.name === oldName
          ? {
            ...x,
            name: nextName,
            venue: slotDraft.venue,
            time: slotTime,
            schedule: slotDraft.schedule,
            teacher: slotDraft.teacher || courseInfo.teacher || '',
            min: slotDraft.min,
            max: slotDraft.max,
            status: slotDraft.formed,
          }
          : x),
      }));
      message.success('已保存班次');
      setSlotFormOpen(false);
      return;
    }
    const id = 'd' + Date.now();
    const row = {
      id, course: slotTarget.course, org: slotTarget.org, school: slotTarget.school,
      className: slotDraft.className.trim(), time: slotTime, schedule: slotDraft.schedule, venue: slotDraft.venue, teacher: slotDraft.teacher || courseInfo.teacher || '',
      enrolled: 0, max: slotDraft.max, min: slotDraft.min, price: slotDraft.price,
      signupStart: slotDraft.signupStart, deadline: slotDraft.deadline, formed: slotDraft.formed, shelf: slotDraft.shelf,
    };
    const clsRow = {
      id: 'cl' + Date.now(), name: slotTarget.course + '·' + row.className, course: slotTarget.course, org: slotTarget.org, school: slotTarget.school,
      venue: row.venue, time: row.time, schedule: row.schedule, teacher: row.teacher, total: courseInfo.lessons || 8, done: 0, min: row.min, max: row.max, enrolled: 0, status: row.formed,
    };
    setDb((d: any) => ({ ...d, deployments: [row, ...d.deployments], classes: [clsRow, ...d.classes] }));
    message.success('已创建上课班次');
    setSlotFormOpen(false);
  };
  const deleteSlot = (row: any) => {
    Modal.confirm({
      title: '删除班次',
      content: `确认删除「${row.className}」？删除后该班次不再出现在家长端报名选择中。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setDb((d: any) => ({
          ...d,
          deployments: d.deployments.filter((x: any) => x.id !== row.id),
          classes: d.classes.filter((x: any) => !(x.course === row.course && x.school === row.school && x.name === row.course + '·' + row.className)),
        }));
        message.success('已删除班次');
      },
    });
  };
  const publish = () => {
    if (hasMissingVenue) return message.warning('请先为每所学校选择已创建且启用的场地');
    const rows = selSchools.map((sc, i) => ({
      id: 'd' + Date.now() + i, course: course.name, org: course.org.slice(2, 6), school: sc,
      className: cfg.className, time: scheduleText(cfg.schedule), schedule: cfg.schedule, venue: venueOf(sc), teacher: course.teacher,
      enrolled: 0, max: cfg.max, min: cfg.min, price: cfg.price, signupStart: cfg.signupStart, deadline: cfg.deadline, formed: '未到购买时间', shelf: '待上架确认',
    }));
    const clsRows = selSchools.map((sc, i) => ({
      id: 'cl' + Date.now() + i, name: course.name + '·' + cfg.className, course: course.name, org: course.org.slice(2, 6), school: sc,
      venue: venueOf(sc), time: scheduleText(cfg.schedule), schedule: cfg.schedule, teacher: course.teacher, total: course.lessons, done: 0, min: cfg.min, max: cfg.max, enrolled: 0, status: '待确认',
    }));
    setDb((d: any) => ({ ...d, deployments: [...rows, ...d.deployments], classes: [...clsRows, ...d.classes] }));
    message.success(`已将「${course.name}」分发到 ${selSchools.length} 所学校，并创建首个上课班次`);
    reset();
  };
  return (
    <Card size="small" title="学校课程配置"
      extra={<Space><Alert type="warning" showIcon message="课程分发后由平台运营与学校线下核对场地时间、确认上架，该校家长端才可见" style={{ padding: '2px 10px' }} /><Button type="primary" icon={<SendOutlined />} onClick={() => setWizOpen(true)}>分发课程到学校</Button></Space>}>
      <FilterRow>{deployFlt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={deployFlt.apply(deploymentGroups)} columns={[
        { title: '课程名称', dataIndex: 'course' }, { title: '机构', dataIndex: 'org' }, { title: '投放学校', dataIndex: 'school', ellipsis: true },
        { title: '上课班次', render: (_: any, r: any) => <Space><b>{r.classCount}</b><span style={{ color: '#999' }}>个班次</span></Space> },
        { title: '总报名/上限', render: (_: any, r: any) => `${r.enrolled} / ${r.max}` },
        { title: '价格', render: (_: any, r: any) => money(r.minPrice) + ' 起' }, { title: '购买时间', render: (_: any, r: any) => `${r.signupStart || '立即'} 至 ${r.deadline}` },
        { title: '课程状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '上架状态', dataIndex: 'shelf', render: (v: string) => <S v={v} /> },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => setSlotDetail(r)}>班次配置</a><a onClick={() => openSlotForm(r)}>添加班次</a>
          {r.shelf === '待确认'
            ? <Tag color="orange">待上架确认</Tag>
            : <a onClick={() => setDb((d: any) => ({ ...d, deployments: d.deployments.map((x: any) => x.course === r.course && x.school === r.school ? { ...x, shelf: r.shelf === '已上架' ? '已下架' : '已上架' } : x) }))}>{r.shelf === '已上架' ? '整体下架' : '整体上架'}</a>}</Space> },
      ]} />
      <Modal open={wizOpen} width={720} title="分发课程到学校" onCancel={reset} footer={null}>
        <Steps current={step} size="small" style={{ margin: '8px 0 20px' }} items={[{ title: '选择课程' }, { title: '选择学校' }, { title: '配置班次' }, { title: '确认发布' }]} />
        {step === 0 && <>
          <Select style={{ width: '100%' }} placeholder="从课程库选择课程" value={selCourse} onChange={setSelCourse}
            options={libCourses.map((c: any) => ({ value: c.name, label: `${c.name} · ${c.org}（${c.lessons} 节 / 建议 ${money(c.price)}）` }))} />
          {course && <Alert style={{ marginTop: 12 }} type="info" showIcon message={`${course.cat} · ${course.grade} · 需 ${course.venue} · 教师：${course.teacher}`} />}
          <div style={{ textAlign: 'right', marginTop: 20 }}><Button type="primary" disabled={!selCourse} onClick={() => setStep(1)}>下一步</Button></div>
        </>}
        {step === 1 && <>
          <Alert type="info" showIcon style={{ marginBottom: 12 }} message="一个课程可分发到多所学校；只有被分发学校的学生（家长端）能看到该课程" />
          <Checkbox.Group style={{ display: 'grid', gap: 10 }} value={selSchools} onChange={(v: any) => setSelSchools(v)}
            options={db.schools.filter((s: any) => s.status === '已合作').map((s: any) => ({ value: s.name, label: `${s.name}（${s.area} · 场地 ${s.venues} 个）` }))} />
          <div style={{ textAlign: 'right', marginTop: 20 }}><Space><Button onClick={() => setStep(0)}>上一步</Button><Button type="primary" disabled={!selSchools.length} onClick={() => { fillVenueDefaults(); setStep(2); }}>下一步</Button></Space></div>
        </>}
        {step === 2 && <>
          <Alert type="info" showIcon style={{ marginBottom: 12 }} message="这里创建该课程在每所学校的首个上课班次；后续可在主表「班次配置」中继续添加不同时间 / 场地 / 价格的班次" />
          <Form layout="vertical">
            <Row gutter={12}>
              <Col span={8}><Form.Item label="班次名称"><Input value={cfg.className} onChange={(e: any) => setCfg({ ...cfg, className: e.target.value })} /></Form.Item></Col>
            </Row>
            <Form.Item label="上课时间安排（每周可多节，各节星期与时段可不同）">
              <ScheduleEditor value={cfg.schedule || []} onChange={(v: any) => setCfg({ ...cfg, schedule: v })} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={8}><Form.Item label="课程价格（元/期）"><InputNumber style={{ width: '100%' }} value={cfg.price} onChange={(v: any) => setCfg({ ...cfg, price: v })} /></Form.Item></Col>
              <Col span={8}><Form.Item label="报名开始时间"><Input value={cfg.signupStart} onChange={(e: any) => setCfg({ ...cfg, signupStart: e.target.value })} /></Form.Item></Col>
              <Col span={8}><Form.Item label="报名截止时间"><Input value={cfg.deadline} onChange={(e: any) => setCfg({ ...cfg, deadline: e.target.value })} /></Form.Item></Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}><Form.Item label="开课时间"><Input value={cfg.openDate} onChange={(e: any) => setCfg({ ...cfg, openDate: e.target.value })} /></Form.Item></Col>
            </Row>
            <Divider style={{ margin: '4px 0 16px' }}>按学校选择上课场地</Divider>
            {selSchools.map((sc) => {
              const options = venueOptionsFor(sc);
              return (
                <Form.Item key={sc} label={sc + ' · 学校场地'}>
                  <Select placeholder="请选择该学校已创建场地" value={venueOf(sc) || undefined} onChange={(v: string) => setVenueFor(sc, v)}
                    status={!options.length ? 'error' : undefined}
                    options={options} />
                  {!options.length && <Alert style={{ marginTop: 8 }} type="warning" showIcon message="该学校暂无启用场地，请先到「场地管理」创建或启用场地" />}
                </Form.Item>
              );
            })}
            <Row gutter={12}>
              <Col span={8}><Form.Item label="最低成班人数"><InputNumber style={{ width: '100%' }} value={cfg.min} onChange={(v: any) => setCfg({ ...cfg, min: v })} /></Form.Item></Col>
              <Col span={8}><Form.Item label="最大报名人数"><InputNumber style={{ width: '100%' }} value={cfg.max} onChange={(v: any) => setCfg({ ...cfg, max: v })} /></Form.Item></Col>
            </Row>
          </Form>
          <div style={{ textAlign: 'right' }}><Space><Button onClick={() => setStep(1)}>上一步</Button><Button type="primary" disabled={hasMissingVenue} onClick={() => setStep(3)}>下一步</Button></Space></div>
        </>}
        {step === 3 && course && <>
          <Descriptions column={2} size="small" bordered items={[
            { key: '1', label: '课程', span: 2, children: course.name + '（' + course.org + '）' },
            { key: '2', label: '投放学校', span: 2, children: selSchools.join('、') },
            { key: '3', label: '班次', children: cfg.className }, { key: '4', label: '上课时间', children: `每周 ${(cfg.schedule || []).length} 节 · ${scheduleText(cfg.schedule)}` },
            { key: '5', label: '场地', span: 2, children: selectedVenueItems.map((x) => `${x.school}：${x.venue}`).join('；') }, { key: '6', label: '价格', children: money(cfg.price) + ' /期' },
            { key: '7', label: '成班/上限', children: cfg.min + ' / ' + cfg.max + ' 人' },
            { key: '8', label: '报名时间', children: cfg.signupStart + ' 至 ' + cfg.deadline }, { key: '9', label: '开课时间', children: cfg.openDate },
          ]} />
          <Alert style={{ marginTop: 12 }} type="success" showIcon message={`发布后进入上架确认流程；平台运营与学校线下核对场地时间并确认上架后，该校家长端才展示对应班级`} />
          <div style={{ textAlign: 'right', marginTop: 16 }}><Space><Button onClick={() => setStep(2)}>上一步</Button><Button type="primary" onClick={publish}>确认发布到学校</Button></Space></div>
        </>}
      </Modal>
      <Drawer open={!!slotDetail} width={820} title={`${activeSlotDetail?.course || ''} · ${activeSlotDetail?.school || ''} · 班次配置`} onClose={() => setSlotDetail(null)}
        extra={<Button type="primary" onClick={() => openSlotForm(activeSlotDetail)}>添加班次</Button>}>
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message="一个课程在同一学校下可以配置多个上课班次；家长端点击报名时选择的就是这里的时间 + 场地组合。" />
        <Tbl {...tblProps} dataSource={activeSlotDetail?.items || []} columns={[
          { title: '班次', dataIndex: 'className' }, { title: '上课时间', dataIndex: 'time', ellipsis: true }, { title: '上课场地', dataIndex: 'venue' },
          { title: '教师', dataIndex: 'teacher' }, { title: '价格', dataIndex: 'price', render: money },
          { title: '报名/上限', render: (_: any, r: any) => `${r.enrolled} / ${r.max}` },
          { title: '购买时间', render: (_: any, r: any) => `${r.signupStart || '立即'} 至 ${r.deadline}` },
          { title: '班次状态', dataIndex: 'formed', render: (v: string) => <S v={v} /> },
          { title: '上架', dataIndex: 'shelf', render: (v: string) => <S v={v} /> },
          { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => openSlotForm(activeSlotDetail, r)}>编辑</a><a onClick={() => setDb((d: any) => ({ ...d, deployments: patch(d.deployments, r.id, { shelf: r.shelf === '已上架' ? '已下架' : '已上架' }) }))}>{r.shelf === '已上架' ? '下架' : '上架'}</a><a style={{ color: '#ff4d4f' }} onClick={() => deleteSlot(r)}>删除</a></Space> },
        ]} />
      </Drawer>
      <Modal open={slotFormOpen} width={640} title={`${slotTarget?.course || ''} · ${slotDraft.id ? '编辑上课班次' : '新增上课班次'}`} okText={slotDraft.id ? '保存班次' : '创建班次'} cancelText="取消"
        onCancel={() => setSlotFormOpen(false)} onOk={saveSlot}>
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message="班次是家长端报名时选择的时间 + 场地组合；每个班次可单独配置价格、名额和购买时间。" />
        <Form layout="vertical">
          <Row gutter={12}>
            <Col span={8}><Form.Item label="班次名称" required><Input value={slotDraft.className} placeholder="如 周五拓展班" onChange={(e: any) => setSlotDraft({ ...slotDraft, className: e.target.value })} /></Form.Item></Col>
          </Row>
          <Form.Item label="上课时间安排（每周可多节，各节星期与时段可不同）" required>
            <ScheduleEditor value={slotDraft.schedule || []} onChange={(v: any) => setSlotDraft({ ...slotDraft, schedule: v })} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="上课场地" required><Select value={slotDraft.venue || undefined} options={slotTarget ? venueOptionsFor(slotTarget.school) : []} onChange={(v: string) => setSlotDraft({ ...slotDraft, venue: v })} /></Form.Item></Col>
            <Col span={12}><Form.Item label="任课老师"><Input value={slotDraft.teacher} onChange={(e: any) => setSlotDraft({ ...slotDraft, teacher: e.target.value })} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item label="价格"><InputNumber style={{ width: '100%' }} value={slotDraft.price} onChange={(v: any) => setSlotDraft({ ...slotDraft, price: v })} /></Form.Item></Col>
            <Col span={8}><Form.Item label="最低成班人数"><InputNumber style={{ width: '100%' }} value={slotDraft.min} onChange={(v: any) => setSlotDraft({ ...slotDraft, min: v })} /></Form.Item></Col>
            <Col span={8}><Form.Item label="最大报名人数"><InputNumber style={{ width: '100%' }} value={slotDraft.max} onChange={(v: any) => setSlotDraft({ ...slotDraft, max: v })} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item label="购买开始"><Input value={slotDraft.signupStart} onChange={(e: any) => setSlotDraft({ ...slotDraft, signupStart: e.target.value })} /></Form.Item></Col>
            <Col span={8}><Form.Item label="购买结束"><Input value={slotDraft.deadline} onChange={(e: any) => setSlotDraft({ ...slotDraft, deadline: e.target.value })} /></Form.Item></Col>
            <Col span={8}><Form.Item label="班次状态"><Select value={slotDraft.formed} options={['未到购买时间', '报名中', '待成班', '已成班'].map((v) => ({ value: v, label: v }))} onChange={(v: string) => setSlotDraft({ ...slotDraft, formed: v })} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}

/* 九、成班管理（原班级管理，0713 更名；财务结算以实际销课为准而非成班状态） */
function ClassPage({ db, setDb }: any) {
  const [roster, setRoster] = useState<any>(null);
  const flt = useTableFilter([
    { key: 'school', label: '学校', width: 200, options: optsOf(db.classes, 'school', '学校') },
    { key: 'org', label: '机构', options: optsOf(db.classes, 'org', '机构') },
    { key: 'course', label: '课程', width: 200, options: optsOf(db.classes, 'course', '课程') },
    { key: 'status', label: '班级状态', options: optsOf(db.classes, 'status', '状态') },
  ]);
  return (
    <Card size="small" title="成班管理" extra={<Alert type="info" showIcon message="达到最低成班人数可成班；达到上限自动停止报名；未达标可取消 / 延期 / 转班" style={{ padding: '2px 10px' }} />}>
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.classes)} columns={[
        { title: '班级名称', dataIndex: 'name', ellipsis: true }, { title: '机构', dataIndex: 'org' }, { title: '学校', dataIndex: 'school', ellipsis: true },
        { title: '场地', dataIndex: 'venue' },
        { title: '上课时间', ellipsis: true, render: (_: any, r: any) => <Tooltip title={scheduleText(toSchedule(r))}><span>每周 {weeklyCount(r)} 节 · {scheduleText(toSchedule(r))}</span></Tooltip> },
        { title: '教师', dataIndex: 'teacher' },
        { title: '课时进度', render: (_: any, r: any) => <Tooltip title={`已上 ${r.done} / 共 ${r.total} 节`}><Progress size="small" style={{ width: 90 }} percent={Math.round((r.done / r.total) * 100)} /></Tooltip> },
        { title: '报名（成班 ' + '/上限）', render: (_: any, r: any) => <span style={{ color: r.enrolled >= r.min ? '#52c41a' : '#fa8c16' }}>{r.enrolled}<span style={{ color: '#999' }}>（{r.min}/{r.max}）</span></span> },
        { title: '班级状态', dataIndex: 'status', render: (v: string, r: any) => <Space size={4}><S v={v} />{r.enrolled >= r.min && ['报名中', '待成班'].includes(v) && <Tag color="green">可成班</Tag>}</Space> },
        { title: '操作', render: (_: any, r: any) => <Space>
          <a onClick={() => setRoster(r)}>查看名单</a>
          {r.enrolled >= r.min && ['报名中', '待成班'].includes(r.status) && <a style={{ color: '#52c41a' }} onClick={() => { setDb((d: any) => ({ ...d, classes: patch(d.classes, r.id, { status: '已成班' }) })); message.success('已成班，可通知机构排课'); }}>标记成班</a>}
          <a onClick={() => message.info('Demo：上课记录')}>上课记录</a>
          <a style={{ color: '#ff4d4f' }} onClick={() => message.info('Demo：关闭报名')}>关闭报名</a></Space> },
      ]} />
      <Drawer open={!!roster} width={480} title={'报名名单：' + (roster?.name || '')} onClose={() => setRoster(null)}>
        {roster && <Tbl {...tblProps} rowKey="k" dataSource={Array.from({ length: Math.min(roster.enrolled, 8) }, (_, i) => ({
          k: i, student: ['李小明', '张一诺', '陈梓航', '刘思彤', '黄雨桐', '周子墨', '王梓萱', '杨浩然'][i], parent: ['李先生', '张女士', '陈先生', '刘女士', '黄女士', '周先生', '王女士', '杨先生'][i], pay: '已支付',
        }))} columns={[{ title: '学生', dataIndex: 'student' }, { title: '家长', dataIndex: 'parent' }, { title: '支付', dataIndex: 'pay', render: (v: string) => <S v={v} /> }]} />}
        {roster && roster.enrolled > 8 && <div style={{ color: '#999', marginTop: 8 }}>…共 {roster.enrolled} 人（Demo 仅展示部分）</div>}
      </Drawer>
    </Card>
  );
}

/* 十、订单管理 */
function OrderPage({ db, setDb }: any) {
  const [refund, setRefund] = useState<any>(null);
  const flt = useTableFilter([
    { key: 'school', label: '学校', width: 200, options: optsOf(db.orders, 'school', '学校') },
    { key: 'course', label: '课程', width: 200, options: optsOf(db.orders, 'course', '课程') },
    { key: 'pay', label: '支付状态', options: optsOf(db.orders, 'pay', '支付状态') },
    { key: 'way', label: '支付方式', options: optsOf(db.orders, 'way', '支付方式') },
  ]);
  return (
    <Card size="small" title="订单管理（家长一次性付费，资金进入平台监管账户）">
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.orders)} columns={[
        { title: '订单编号', dataIndex: 'id' }, { title: '家长', dataIndex: 'parent' }, { title: '学生', dataIndex: 'student' },
        { title: '学校', dataIndex: 'school', ellipsis: true }, { title: '课程', dataIndex: 'course' }, { title: '班级', dataIndex: 'cls' },
        { title: '金额', dataIndex: 'amount', render: money }, { title: '支付方式', dataIndex: 'way' },
        { title: '支付状态', dataIndex: 'pay', render: (v: string) => <S v={v} /> }, { title: '退款', dataIndex: 'refund' }, { title: '下单时间', dataIndex: 'time' },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => message.info('Demo：订单详情')}>查看</a>
          {r.pay === '已支付' && <a style={{ color: '#ff4d4f' }} onClick={() => setRefund(r)}>退款</a>}
          <a onClick={() => message.info('Demo：跳转销课记录')}>查看销课</a></Space> },
      ]} />
      <Modal open={!!refund} title={'订单退款：' + (refund?.id || '')} okText="确认退款" cancelText="取消" onCancel={() => setRefund(null)}
        onOk={() => { setDb((d: any) => ({ ...d, orders: patch(d.orders, refund.id, { pay: '已退款', refund: '已退款' }) })); message.success('退款成功，将同步计入机构结算扣减'); setRefund(null); }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert type="warning" showIcon message={`应退金额 ${refund ? money(refund.amount) : ''}（按未上课时比例，Demo 简化为全额）`} />
          <Select style={{ width: '100%' }} placeholder="退款原因" options={['课程未开班', '家长主动申请', '课程质量问题', '其他'].map((x) => ({ value: x, label: x }))} />
          <TextArea rows={2} placeholder="备注（选填）" />
        </Space>
      </Modal>
    </Card>
  );
}

/* 十一、上课销课管理 */
function LessonPage({ db, setDb }: any) {
  const [detail, setDetail] = useState<any>(null);
  const flt = useTableFilter([
    { key: 'school', label: '学校', width: 200, options: optsOf(db.lessons, 'school', '学校') },
    { key: 'org', label: '机构', options: optsOf(db.lessons, 'org', '机构') },
    { key: 'course', label: '课程', width: 200, options: optsOf(db.lessons, 'course', '课程') },
    { key: 'status', label: '销课状态', options: optsOf(db.lessons, 'status', '销课状态') },
  ]);
  return (
    <Card size="small" title="上课销课（教师上完课提交记录 → 确认状态 → 计入可结算）">
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.lessons)} columns={[
        { title: '班级', dataIndex: 'cls', ellipsis: true }, { title: '机构', dataIndex: 'org' }, { title: '学校', dataIndex: 'school', ellipsis: true },
        { title: '上课日期', dataIndex: 'date' }, { title: '节次', dataIndex: 'no', render: (v: number) => '第 ' + v + ' 节' }, { title: '教师', dataIndex: 'teacher' },
        { title: '应到/实到', render: (_: any, r: any) => `${r.due} / ${r.actual || '—'}` },
        { title: '教师签到', dataIndex: 'sign', render: (v: string) => <S v={v} /> },
        { title: '确认状态', dataIndex: 'schoolConfirm', render: (v: string) => (v === '—' ? '—' : <S v={v} />) },
        { title: '销课状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '可结算金额', dataIndex: 'amount', render: (v: number) => (v ? <b style={{ color: '#52c41a' }}>{money(v)}</b> : '—') },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => setDetail(r)}>查看</a>
          {r.status === '已上课待确认' && <a style={{ color: '#52c41a' }} onClick={() => {
            setDb((d: any) => ({ ...d, lessons: patch(d.lessons, r.id, { status: '已确认销课', schoolConfirm: '已确认', amount: r.due * 90 }) }));
            message.success('销课已确认，该节费用计入本月可结算范围');
          }}>确认销课</a>}
          <a style={{ color: '#ff4d4f' }} onClick={() => { setDb((d: any) => ({ ...d, lessons: patch(d.lessons, r.id, { status: '异常', amount: 0 }) })); message.warning('已标记异常，待机构补充说明'); }}>标记异常</a></Space> },
      ]} />
      <Drawer open={!!detail} width={480} title="销课记录详情" onClose={() => setDetail(null)}>
        {detail && <Descriptions column={1} size="small" bordered items={[
          { key: '1', label: '班级', children: detail.cls }, { key: '2', label: '课程', children: detail.course },
          { key: '3', label: '机构 / 学校', children: detail.org + ' / ' + detail.school },
          { key: '4', label: '上课时间', children: detail.date + '（第 ' + detail.no + ' 节）' }, { key: '5', label: '任课教师', children: detail.teacher },
          { key: '6', label: '出勤', children: `应到 ${detail.due} 人 · 实到 ${detail.actual || '—'} 人` },
          { key: '7', label: '销课状态', children: <S v={detail.status} /> },
          { key: '8', label: '可结算金额', children: detail.amount ? money(detail.amount) : '—' },
          ...(detail.note ? [{ key: '9', label: '异常说明', children: detail.note }] : []),
        ]} />}
      </Drawer>
    </Card>
  );
}

/* 十二、结算管理 */
function SettlePage({ db, setDb }: any) {
  const [detail, setDetail] = useState<any>(null);
  const flt = useTableFilter([
    { key: 'org', label: '机构', width: 240, options: optsOf(db.settlements, 'org', '机构') },
    { key: 'month', label: '结算月份', options: optsOf(db.settlements, 'month', '月份') },
    { key: 'status', label: '结算状态', options: optsOf(db.settlements, 'status', '状态') },
  ]);
  return (
    <Card size="small" title="机构结算（按月：销课累计 − 平台服务费 − 学校服务费 − 退款扣减）"
      extra={<Button type="primary" onClick={() => message.success('Demo：已按 2026-07 销课记录生成结算单草稿')}>生成本月结算单</Button>}>
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.settlements)} columns={[
        { title: '结算单号', dataIndex: 'id' }, { title: '机构名称', dataIndex: 'org', ellipsis: true }, { title: '月份', dataIndex: 'month' },
        { title: '涉及学校', dataIndex: 'schools', ellipsis: true }, { title: '班级数', dataIndex: 'clsCount' }, { title: '完成课时', dataIndex: 'doneLessons' },
        { title: '应结算', dataIndex: 'gross', render: money }, { title: '平台服务费', dataIndex: 'fee', render: money },
        { title: '学校服务费', dataIndex: 'schoolShare', render: money }, { title: '退款扣减', dataIndex: 'refund', render: money },
        { title: '机构实收', dataIndex: 'net', render: (v: number) => <b style={{ color: '#1677ff' }}>{money(v)}</b> },
        { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => setDetail(r)}>查看明细</a>
          {r.status === '待审核' && <a style={{ color: '#fa8c16' }} onClick={() => { setDb((d: any) => ({ ...d, settlements: patch(d.settlements, r.id, { status: '结算中' }) })); message.success('结算单审核通过，进入打款流程'); }}>审核</a>}
          {r.status === '结算中' && <a style={{ color: '#52c41a' }} onClick={() => { setDb((d: any) => ({ ...d, settlements: patch(d.settlements, r.id, { status: '已结算' }) })); message.success('已确认打款，结算完成'); }}>确认打款</a>}</Space> },
      ]} />
      <Drawer open={!!detail} width={680} title={'结算明细：' + (detail?.id || '')} onClose={() => setDetail(null)}>
        {detail && <>
          <Descriptions column={2} size="small" bordered items={[
            { key: '1', label: '机构', span: 2, children: detail.org },
            { key: '2', label: '结算月份', children: detail.month }, { key: '3', label: '状态', children: <S v={detail.status} /> },
            { key: '4', label: '涉及学校', span: 2, children: detail.schools },
          ]} />
          <Divider>销课明细（每节课）</Divider>
          <Tbl {...tblProps} dataSource={db.lessons.filter((l: any) => ['已计入结算', '已确认销课'].includes(l.status))} columns={[
            { title: '班级', dataIndex: 'cls', ellipsis: true }, { title: '日期', dataIndex: 'date' }, { title: '节次', dataIndex: 'no' },
            { title: '实到', dataIndex: 'actual' }, { title: '可结算', dataIndex: 'amount', render: money }, { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
          ]} />
          <Divider>结算计算</Divider>
          <Descriptions column={1} size="small" bordered items={[
            { key: '1', label: '销课累计（应结算）', children: money(detail.gross) },
            { key: '2', label: '平台服务费（10%）', children: '− ' + money(detail.fee) },
            { key: '3', label: '学校服务费（5%，规则预留）', children: '− ' + money(detail.schoolShare) },
            { key: '4', label: '退款扣减', children: '− ' + money(detail.refund) },
            { key: '5', label: '最终应付机构金额', children: <b style={{ color: '#1677ff', fontSize: 16 }}>{money(detail.net)}</b> },
          ]} />
          <Divider>四方分账（按课程配置比例，天府通内部完成分账）</Divider>
          <Tbl {...tblProps} rowKey="party" dataSource={[
            { party: '机构', ratio: '70%', amount: Math.round(detail.gross * 0.70) },
            { party: '平台（未来教育中心）', ratio: '12%', amount: Math.round(detail.gross * 0.12) },
            { party: '地方平台', ratio: '13%', amount: Math.round(detail.gross * 0.13) },
            { party: '天府通（支付通道）', ratio: '5%', amount: Math.round(detail.gross * 0.05) },
          ]} columns={[
            { title: '分账方', dataIndex: 'party' }, { title: '比例', dataIndex: 'ratio' }, { title: '金额（示例）', dataIndex: 'amount', render: money },
          ]} />
          <Alert style={{ marginTop: 12 }} type="info" showIcon
            message="资金监管：平台向天府通下发「订单详情」与「对账单」两份独立数据（订单用于资金入账核查、对账单用于四方分账），不合并；机构确认对账单后由天府通完成分账打款。" />
        </>}
      </Drawer>
    </Card>
  );
}

/* 十三、售后管理 */
function AftersalePage({ db, setDb }: any) {
  const [handle, setHandle] = useState<any>(null);
  return (
    <Card size="small" title="售后管理">
      <Tbl {...tblProps} dataSource={db.aftersales} columns={[
        { title: '售后编号', dataIndex: 'id' }, { title: '家长', dataIndex: 'parent' }, { title: '学生', dataIndex: 'student' },
        { title: '课程班级', dataIndex: 'cls', ellipsis: true }, { title: '问题类型', dataIndex: 'type', render: (v: string) => <Tag color="volcano">{v}</Tag> },
        { title: '机构', dataIndex: 'org' }, { title: '学校', dataIndex: 'school', ellipsis: true }, { title: '申请时间', dataIndex: 'time' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => message.info('Demo：售后详情与沟通记录')}>查看</a>
          {['待处理', '处理中'].includes(r.status) && <a style={{ color: '#fa8c16' }} onClick={() => setHandle(r)}>处理</a>}</Space> },
      ]} />
      <Modal open={!!handle} title={'处理售后：' + (handle?.id || '')} okText="提交处理" cancelText="取消" onCancel={() => setHandle(null)}
        onOk={() => { setDb((d: any) => ({ ...d, aftersales: patch(d.aftersales, handle.id, { status: '处理中' }) })); message.success('已提交处理，转机构响应；超时将平台介入'); setHandle(null); }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select style={{ width: '100%' }} placeholder="处理方式" options={['转机构处理', '平台介入', '安排补课', '同意退款', '驳回申请'].map((x) => ({ value: x, label: x }))} />
          <TextArea rows={3} placeholder="处理意见" />
        </Space>
      </Modal>
    </Card>
  );
}

/* 十四、操作日志 */
const LogPage = ({ db }: any) => (
  <Card size="small" title="操作日志">
    <Tbl {...tblProps} rowKey="t" dataSource={db.logs} columns={[
      { title: '操作时间', dataIndex: 't' }, { title: '操作人', dataIndex: 'who' }, { title: '模块', dataIndex: 'mod', render: (v: string) => <Tag>{v}</Tag> },
      { title: '操作内容', dataIndex: 'act' }, { title: 'IP', dataIndex: 'ip' }, { title: '结果', dataIndex: 'ret', render: (v: string) => <Tag color="green">{v}</Tag> },
    ]} />
  </Card>
);

/* ============================================================
 * 应用外壳
 * ============================================================ */
const MENUS = [
  { key: 'dash', icon: <DashboardOutlined />, label: '首页看板' },
  { key: 'user', icon: <TeamOutlined />, label: '平台用户管理' },
  { key: 'school', icon: <BankOutlined />, label: '学校/点位管理' },
  { key: 'venue', icon: <EnvironmentOutlined />, label: '场地管理' },
  { key: 'org', icon: <ShopOutlined />, label: '机构入驻管理' },
  { key: 'teacher', icon: <IdcardOutlined />, label: '教师审核管理' },
  { key: 'course', icon: <BookOutlined />, label: '课程审核与课程库' },
  { key: 'deploy', icon: <SendOutlined />, label: '学校课程配置' },
  { key: 'class', icon: <ClusterOutlined />, label: '成班管理' },
  { key: 'order', icon: <ProfileOutlined />, label: '订单管理' },
  { key: 'lesson', icon: <CheckSquareOutlined />, label: '上课销课管理' },
  { key: 'settle', icon: <AccountBookOutlined />, label: '结算管理' },
  { key: 'aftersale', icon: <CustomerServiceOutlined />, label: '售后管理' },
  { key: 'log', icon: <FileSearchOutlined />, label: '操作日志' },
];

function App() {
  const [nav, setNav] = useState('dash');
  const [db, setDb] = useState(initDB);
  const [helpOpen, setHelpOpen] = useState(false);
  const title = MENUS.find((m) => m.key === nav)?.label || '';
  const pages: Record<string, any> = {
    dash: <Dashboard db={db} go={setNav} />, user: <UserPage db={db} setDb={setDb} />,
    school: <SchoolPage db={db} setDb={setDb} go={setNav} />, venue: <VenuePage db={db} setDb={setDb} />,
    org: <OrgPage db={db} setDb={setDb} />, teacher: <TeacherPage db={db} setDb={setDb} />,
    course: <CoursePage db={db} setDb={setDb} />, deploy: <DeployPage db={db} setDb={setDb} />,
    class: <ClassPage db={db} setDb={setDb} />, order: <OrderPage db={db} setDb={setDb} />,
    lesson: <LessonPage db={db} setDb={setDb} />, settle: <SettlePage db={db} setDb={setDb} />,
    aftersale: <AftersalePage db={db} setDb={setDb} />, log: <LogPage db={db} />,
  };
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={216} theme="dark" style={{ height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: '#fff', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>未</div>
            <div style={{ lineHeight: 1.25 }}><b>天府未来教育中心</b><div style={{ fontSize: 11, opacity: .65 }}>后台管理系统 Demo</div></div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <Menu theme="dark" mode="inline" selectedKeys={[nav]} items={MENUS} onClick={(e: any) => setNav(e.key)} />
          </div>
          <div style={{ flexShrink: 0, padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,.12)', background: '#001529' }}>
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, marginBottom: 8 }}>友情链接</div>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <a href="../" style={{ color: 'rgba(255,255,255,.82)', fontSize: 13 }}>家长端</a>
              <a href="../school/" style={{ color: 'rgba(255,255,255,.82)', fontSize: 13 }}>学校端</a>
              <a href="../org/" style={{ color: 'rgba(255,255,255,.82)', fontSize: 13 }}>机构端 / 教师端</a>
              <a href="../edu/" style={{ color: 'rgba(255,255,255,.82)', fontSize: 13 }}>教育局端</a>
            </Space>
          </div>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,21,41,.06)' }}>
          <b style={{ fontSize: 16 }}>{title}</b>
          <Space size={14}>
            <Button size="small" icon={<QuestionCircleOutlined />} onClick={() => setHelpOpen(true)}>名词解释</Button>
            <Tag color="blue">天府通 · 课后延时服务平台</Tag>
            <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />
            <span>张运营（平台管理员）</span>
          </Space>
        </Header>
        <Content style={{ margin: 16, overflow: 'auto' }}>{pages[nav]}</Content>
        <Drawer open={helpOpen} width={560} title="平台名词解释" onClose={() => setHelpOpen(false)}>
          <Alert type="info" showIcon style={{ marginBottom: 16 }} message="表格中的状态标签，鼠标悬停也会显示对应解释" />
          {GLOSSARY.map((g) => (
            <div key={g.title}>
              <Divider orientation="left" orientationMargin={0} style={{ fontSize: 14, fontWeight: 600 }}>{g.title}</Divider>
              {g.items.map(([t, d]) => (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <Tag color={STC[t.replace(/（.*?）/g, '').split(' / ')[0]] || 'blue'} style={{ flexShrink: 0, marginTop: 1 }}>{t}</Tag>
                  <span style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>{d}</span>
                </div>
              ))}
            </div>
          ))}
        </Drawer>
      </Layout>
    </Layout>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
