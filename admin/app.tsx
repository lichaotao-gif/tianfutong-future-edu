/* ============================================================
 * 天府未来教育中心 · 后台管理系统 Demo
 * React 18 + TSX + Ant Design 5（UMD 免构建，mock 数据）
 * 业务闭环：建校/场地 → 审机构 → 审教师 → 审课程 → 课程库
 *          → 分发学校 → 家长报名付费 → 按节销课 → 按月结算
 * ============================================================ */
const { useState, useMemo, useEffect, useRef } = React;
const {
  Layout, Menu, Table: AntTable, Tag, Button, Modal, Drawer, Descriptions, Card, Statistic,
  Row, Col, Space, Input, Select, Steps, message, Tabs, Divider, Form, InputNumber,
  Checkbox, Timeline, Alert, Progress, Radio, Avatar, Tooltip, List, Upload, Badge, Grid, DatePicker,
} = antd;
const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const {
  DashboardOutlined, TeamOutlined, BankOutlined, EnvironmentOutlined, ShopOutlined,
  IdcardOutlined, BookOutlined, SendOutlined, ClusterOutlined, ProfileOutlined,
  CheckSquareOutlined, AccountBookOutlined, CustomerServiceOutlined, FileSearchOutlined,
  UserOutlined, PlusOutlined, RightOutlined, QuestionCircleOutlined, TrophyOutlined, MenuOutlined,
  ArrowLeftOutlined, LinkOutlined, CopyOutlined, EyeOutlined,
} = icons;

/* ---------- 状态 → 颜色（全局统一） ---------- */
const STC: Record<string, string> = {
  待完善: 'gold', 待审核: 'orange', 审核通过: 'green', 审核驳回: 'red', 已暂停: 'default', 已禁用: 'red',
  草稿: 'default', 已入课程库: 'green', 已下架: 'default',
  待合作: 'orange', 已合作: 'green', 暂停合作: 'gold', 已停用: 'default',
  启用: 'green', 禁用: 'red', 已上架: 'green', 未到购买时间: 'gold',
  报名中: 'blue', 待成班: 'orange', 已成班: 'green', 已排课: 'cyan', 上课中: 'processing', 已结课: 'default', 已取消: 'red',
  待支付: 'orange', 已支付: 'green', 已退款: 'red', 部分退款: 'gold',
  待上课: 'default', 已上课待确认: 'orange', 待上架确认: 'orange', 部分确认: 'orange', 全部确认: 'green', 已确认销课: 'green', 异常: 'red', 客服处理中: 'purple', 不结算已关闭: 'default', 已计入结算: 'cyan',
  待生成: 'default', 结算中: 'blue', 已结算: 'green', 结算异常: 'red', 已驳回: 'red',
  待处理: 'orange', 处理中: 'blue', 机构处理中: 'gold', 平台介入: 'purple', 已完成: 'green',
  正常: 'green', 未签到: 'default', 已签到: 'green', 待确认: 'orange', 待上架确认: 'orange', 已确认: 'green', 无异议: 'green', 有异议: 'red', 客服判定结算: 'green', 客服判定不结算: 'default',
  已上传: 'green', 未上传: 'orange',
  已开通: 'green', 未开通: 'orange',
  未开始: 'gold', 报名结束: 'gold', 征集中: 'blue', 征集截止: 'gold', 评审中: 'processing', 待发布: 'purple', 结果已发布: 'green', 已归档: 'default',
  资格待审: 'orange', 资格通过: 'green', 资格驳回: 'red', 待分配: 'gold', 待评分: 'blue', 评分中: 'processing', 已评分: 'cyan', 待复核: 'purple', 结果确定: 'green',
  可接任务: 'green', 暂停接单: 'default', 已分配: 'blue', 已提交: 'cyan', 已锁定: 'green', 已退回: 'red',
};
/* ---------- 名词解释词典（顶部 ? 查看全量，状态标签悬停即显） ---------- */
const GLOSSARY: { title: string; items: [string, string][] }[] = [
  { title: '销课状态（核心流程）', items: [
    ['待上课', '课程已排期、尚未到上课时间，本节不产生任何费用。'],
    ['已上课待确认', '教师已提交课堂记录，等待家长反馈；3 天内未提出“没上课”异议，系统自动正常结算消课。'],
    ['已确认销课', '课程正常开展；无论学生已到或因个人原因缺勤，均正常消课并进入当月可结算范围。'],
    ['客服处理中', '家长反馈该节课没上并提出异议，暂停自动结算，由客服人工核实后决定是否结算消课。'],
    ['不结算已关闭', '客服核实该节课未按约开展，决定本节不结算、不消课，工单已关闭。'],
    ['异常', '本节课存在异常线索，已转客服核实；客服将人工决定是否结算消课。'],
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
TERM_DEF['已确认'] = '家长无异议，或客服已核实可正常结算消课。';
TERM_DEF['无异议'] = '家长选择正常结算消课，或在 3 天内未提交异议。';
TERM_DEF['有异议'] = '家长反馈该节课实际没上，已转客服人工处理。';
TERM_DEF['客服判定结算'] = '客服核实后决定本节正常结算消课。';
TERM_DEF['客服判定不结算'] = '客服核实后决定本节不结算、不消课。';

const S = ({ v }: { v: string }) => {
  const label = ({ 资格驳回: '资格不通过', 结果确定: '结果已确定', 征集中: '报名中', 征集截止: '报名结束' } as Record<string, string>)[v] || v;
  const t = <Tag color={STC[v] || 'default'} style={TERM_DEF[v] ? { cursor: 'help' } : {}}>{label}</Tag>;
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
    { id: 'og1', name: '成都智创未来教育科技有限公司', contact: '王总', phone: '138****2001', dir: 'AI / 编程 / 科创', submitAt: '2026-05-12', status: '审核通过', courses: 3, teachers: 3, account: '已配置', accountInfo: { url: 'https://future-edu.demo/org/', username: '138****2001', password: 'TfOG1@2026' }, license: '统一社会信用代码 91510100MA6XXXX01', licensePhoto: '智创未来营业执照.jpg', docs: { license: { file: '智创未来-营业执照(鲜章).jpg', verified: true }, bank: { file: '智创未来-开户许可证(银行章).jpg', verified: true, bankName: '中国银行成都天府支行', bankAcct: '1234 5678 9012 3456' }, idCard: { file: '王建国-身份证正反面.jpg', verified: true }, schoolPermit: { file: '智创未来-办学许可证.jpg', verified: true }, legalPhone: { file: '', verified: true, phone: '138****2001', isFinance: false }, storefront: { file: '智创未来-门头照.jpg', verified: true }, interior: { file: '智创未来-内景照(编程教室).jpg', verified: true } },  legal: '王建国（法人）', scope: '面向中小学的人工智能与编程素质教育', agreement: '2026-2027 学年课后服务合作协议（已签署）',
      audits: [{ t: '2026-05-15 10:20', who: '审核员-李敏', act: '审核通过', note: '资质齐全' }, { t: '2026-05-12 14:03', who: '机构', act: '提交入驻申请', note: '' }] },
    { id: 'og2', name: '童心美育艺术中心', contact: '林老师', phone: '139****2002', dir: '美术 / 手工 / 书法', submitAt: '2026-06-28', status: '待审核', courses: 1, teachers: 2, account: '未配置', license: '统一社会信用代码 91510100MA6XXXX02', licensePhoto: '童心美育营业执照.png', docs: { license: { file: '童心美育-营业执照.png', verified: false }, bank: { file: '童心美育-开户许可证.jpg', verified: false, bankName: '成都银行高新支行', bankAcct: '6222 0000 1111 2222' }, idCard: { file: '林晓芸-身份证正反面.jpg', verified: false }, schoolPermit: { file: '', verified: false }, legalPhone: { file: '', verified: false, phone: '139****2002', isFinance: true, auth: '' }, storefront: { file: '童心美育-门头照.jpg', verified: false }, interior: { file: '童心美育-内景照(美术教室).jpg', verified: false } },  legal: '林晓芸（法人）', scope: '少儿美术、创意手工、硬笔书法', agreement: '待审核通过后签署',
      audits: [{ t: '2026-06-28 09:41', who: '机构', act: '提交入驻申请', note: '' }] },
    { id: 'og3', name: '星辰体育培训中心', contact: '赵教练', phone: '137****2003', dir: '篮球 / 田径 / 体适能', submitAt: '2026-06-30', status: '待审核', courses: 0, teachers: 1, account: '未配置', license: '统一社会信用代码 91510100MA6XXXX03', licensePhoto: '', docs: { license: { file: '', verified: false }, bank: { file: '', verified: false }, idCard: { file: '赵刚-身份证正反面.jpg', verified: false }, schoolPermit: { file: '', verified: false }, legalPhone: { file: '', verified: false, phone: '137****2003', isFinance: false }, storefront: { file: '星辰体育-门头照.jpg', verified: false }, interior: { file: '', verified: false } }, legal: '赵刚（法人）', scope: '青少年体育培训与体适能训练', agreement: '待审核通过后签署',
      audits: [{ t: '2026-06-30 16:22', who: '机构', act: '提交入驻申请', note: '' }] },
    { id: 'og4', name: '快乐星球机器人俱乐部', contact: '孙老师', phone: '136****2004', dir: '机器人 / 无人机', submitAt: '2026-06-10', status: '审核驳回', courses: 0, teachers: 0, account: '未配置', license: '统一社会信用代码 91510100MA6XXXX04', licensePhoto: '快乐星球营业执照.jpg', docs: { license: { file: '快乐星球-营业执照.jpg', verified: false, note: '经营范围不含教育培训' }, bank: { file: '', verified: false }, idCard: { file: '孙志强-身份证正反面.jpg', verified: false }, schoolPermit: { file: '', verified: false }, legalPhone: { file: '', verified: false, phone: '136****2004', isFinance: false }, storefront: { file: '', verified: false }, interior: { file: '', verified: false } },  legal: '孙志强（法人）', scope: '机器人搭建与竞赛培训', agreement: '—',
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
    { id: 'ls1', cls: '人工智能启蒙课·周三班', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-06-24', no: 3, teacher: '王思远', due: 18, actual: 17, sign: '已签到', schoolConfirm: '无异议', status: '已计入结算', amount: 1440 },
    { id: 'ls2', cls: '人工智能启蒙课·周三班', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-07-01', no: 4, teacher: '王思远', due: 18, actual: 18, sign: '已签到', schoolConfirm: '无异议', status: '已确认销课', amount: 1440 },
    { id: 'ls3', cls: '少儿编程思维课·周二班', course: '少儿编程思维课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-06-30', no: 6, teacher: '陈亦然', due: 25, actual: 24, sign: '已签到', schoolConfirm: '待确认', status: '已上课待确认', amount: 2250 },
    { id: 'ls4', cls: '人工智能启蒙课·周三班', course: '人工智能启蒙课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-07-08', no: 5, teacher: '王思远', due: 18, actual: 0, sign: '未签到', schoolConfirm: '—', status: '待上课', amount: 0 },
    { id: 'ls5', cls: '少儿编程思维课·周二班', course: '少儿编程思维课', org: '智创未来', school: '成都天府新区实验小学', date: '2026-06-23', no: 5, teacher: '陈亦然', due: 25, actual: 21, sign: '已签到', schoolConfirm: '有异议', status: '客服处理中', amount: 0, note: '家长反馈本节课实际没上，待客服核实是否结算消课' },
    { id: 'ls6', cls: '科学实验探索课·周四班', course: '科学实验探索课', org: '智创未来', school: '成都天府新区第七小学', date: '2026-06-26', no: 8, teacher: '刘嘉敏', due: 28, actual: 27, sign: '已签到', schoolConfirm: '无异议', status: '已计入结算', amount: 2240 },
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
  competitions: [
    {
      id: 'innovation-2026', name: '2026 年天府新区青少年创新实践大赛', category: '创新实践', organizer: '成都天府新区教育卫健局',
      audience: '全区中小学生', signupStart: '2026-06-20', signupEnd: '2026-11-15', reviewEnd: '2026-12-10', status: '征集中', reviewerCount: 2,
      expertIds: ['expert-001', 'expert-002'],
      materialRule: '图片、视频、附件至少提交一项；作品须为学生本人或团队原创。',
      criteria: [
        { key: 'innovation', name: '创新性', max: 30 }, { key: 'completion', name: '完成度', max: 25 },
        { key: 'practice', name: '技术与实践', max: 25 }, { key: 'presentation', name: '表达展示', max: 20 },
      ],
    },
    {
      id: 'ai-2026', name: '2026 年成都市青少年人工智能大赛', category: '人工智能', organizer: '成都市教育局',
      audience: '全市中小学生', signupStart: '2026-07-01', signupEnd: '2026-10-20', reviewEnd: '2026-11-25', status: '评审中', reviewerCount: 2,
      expertIds: ['expert-001', 'expert-004'],
      materialRule: '作品说明须写明使用的 AI 工具，团队作品填写全部成员。',
      criteria: [
        { key: 'innovation', name: '创新性', max: 30 }, { key: 'completion', name: '完成度', max: 25 },
        { key: 'practice', name: '技术与实践', max: 25 }, { key: 'presentation', name: '表达展示', max: 20 },
      ],
    },
  ],
  contestEntries: [
    {
      id: 'work-001', competitionId: 'innovation-2026', studentName: '李小明', school: '成都天府新区实验小学', grade: '三年级 2 班', teamType: '个人',
      title: '会提醒节水的智能花盆', desc: '通过土壤湿度传感器判断植物是否需要浇水，并用灯光提醒。', submittedAt: '2026-09-10 19:20',
      assets: [{ name: '作品说明.pdf', type: '附件', size: '1.2 MB' }, { name: '演示视频.mp4', type: '视频', size: '36.5 MB' }],
      eligibilityStatus: '资格待审', reviewStatus: '资格待审', auditNote: '', award: '', resultPublished: false,
      audits: [{ t: '2026-09-10 19:20', who: '李先生', act: '提交报名作品', note: '' }],
    },
    {
      id: 'work-002', competitionId: 'innovation-2026', studentName: '李小雨', school: '成都天府新区实验小学', grade: '一年级 4 班', teamType: '团队',
      title: '校园声音地图', desc: '记录校园不同区域的声音变化，并制作可视化声音地图。', submittedAt: '2026-09-11 20:06',
      assets: [{ name: '声音地图展示.pptx', type: '附件', size: '4.8 MB' }],
      eligibilityStatus: '资格通过', reviewStatus: '待分配', auditNote: '资格和材料完整', award: '', resultPublished: false,
      audits: [{ t: '2026-09-12 09:10', who: '李敏', act: '资格审核通过', note: '资格和材料完整' }],
    },
    {
      id: 'work-003', competitionId: 'innovation-2026', studentName: '李晨曦', school: '成都天府新区第七小学', grade: '五年级 1 班', teamType: '个人',
      title: '校园垃圾分类识别箱', desc: '用图像识别模型区分常见校园垃圾并提示投放类别。', submittedAt: '2026-09-12 16:30',
      assets: [{ name: '设计文档.pdf', type: '附件', size: '2.6 MB' }, { name: '识别测试.mp4', type: '视频', size: '28.1 MB' }],
      eligibilityStatus: '资格通过', reviewStatus: '待评分', auditNote: '材料完整', award: '', resultPublished: false,
      audits: [{ t: '2026-09-13 10:00', who: '李敏', act: '资格审核通过', note: '材料完整' }],
    },
    {
      id: 'work-004', competitionId: 'ai-2026', studentName: '张一诺', school: '成都天府新区实验小学', grade: '四年级 3 班', teamType: '个人',
      title: '会认垃圾的小助手', desc: '训练垃圾分类小模型，帮助同学判断垃圾桶类别。', submittedAt: '2026-08-28 20:14',
      assets: [{ name: '作品说明文档.pdf', type: '附件', size: '1.1 MB' }, { name: '作品演示.mp4', type: '视频', size: '18.4 MB' }],
      eligibilityStatus: '资格通过', reviewStatus: '待复核', auditNote: '资格通过', award: '', resultPublished: false,
      audits: [{ t: '2026-08-30 09:20', who: '李敏', act: '资格审核通过', note: '' }],
    },
    {
      id: 'work-005', competitionId: 'ai-2026', studentName: '陈梓航', school: '成都高新区实验小学', grade: '三年级 1 班', teamType: '个人',
      title: 'AI 故事绘本', desc: '使用生成式 AI 辅助创作环保主题绘本。', submittedAt: '2026-08-29 18:42',
      assets: [{ name: '绘本作品.pdf', type: '附件', size: '8.7 MB' }],
      eligibilityStatus: '资格驳回', reviewStatus: '资格驳回', auditNote: '缺少 AI 工具使用说明', award: '', resultPublished: false,
      audits: [{ t: '2026-08-30 11:05', who: '李敏', act: '资格审核驳回', note: '缺少 AI 工具使用说明' }],
    },
    {
      id: 'work-006', competitionId: 'innovation-2026', studentName: '赵子墨', school: '成都天府新区华阳实验小学', grade: '六年级 2 班', teamType: '团队',
      title: '校园雨水回收灌溉系统', desc: '收集教学楼屋顶雨水，根据花圃湿度自动控制滴灌。', submittedAt: '2026-09-12 18:20',
      assets: [{ name: '项目报告.pdf', type: '附件', size: '3.6 MB' }, { name: '现场演示.mp4', type: '视频', size: '42.3 MB' }],
      eligibilityStatus: '资格通过', reviewStatus: '评分中', auditNote: '材料完整', award: '', resultPublished: false,
      audits: [{ t: '2026-09-13 09:25', who: '李敏', act: '资格审核通过', note: '材料完整' }],
    },
    {
      id: 'work-007', competitionId: 'innovation-2026', studentName: '周可欣', school: '成都天府新区第三小学', grade: '四年级 4 班', teamType: '个人',
      title: '盲文药盒提醒器', desc: '结合触觉标记与语音提醒，帮助视障人群安全按时用药。', submittedAt: '2026-09-09 17:46',
      assets: [{ name: '作品说明.pdf', type: '附件', size: '2.1 MB' }],
      eligibilityStatus: '资格通过', reviewStatus: '结果确定', auditNote: '材料完整', award: '二等奖', resultPublished: false,
      audits: [{ t: '2026-09-10 10:18', who: '李敏', act: '资格审核通过', note: '材料完整' }],
    },
    {
      id: 'work-008', competitionId: 'ai-2026', studentName: '孙浩宇', school: '成都高新区锦城小学', grade: '五年级 3 班', teamType: '团队',
      title: 'AI 校园植物医生', desc: '拍摄植物叶片后识别常见病害，并给出校园养护建议。', submittedAt: '2026-08-30 20:12',
      assets: [{ name: '模型说明.pdf', type: '附件', size: '3.9 MB' }, { name: '测试视频.mp4', type: '视频', size: '25.7 MB' }],
      eligibilityStatus: '资格通过', reviewStatus: '待评分', auditNote: '材料完整', award: '', resultPublished: false,
      audits: [{ t: '2026-08-31 10:05', who: '李敏', act: '资格审核通过', note: '材料完整' }],
    },
    {
      id: 'work-009', competitionId: 'ai-2026', studentName: '何语桐', school: '成都天府新区第七小学', grade: '六年级 1 班', teamType: '个人',
      title: '课堂专注度自评助手', desc: '通过课堂记录帮助学生进行专注度自评，不采集人脸信息。', submittedAt: '2026-08-31 19:08',
      assets: [{ name: '隐私设计说明.pdf', type: '附件', size: '1.8 MB' }],
      eligibilityStatus: '资格通过', reviewStatus: '待分配', auditNote: '资格通过', award: '', resultPublished: false,
      audits: [{ t: '2026-09-01 09:48', who: '李敏', act: '资格审核通过', note: '资格通过' }],
    },
  ],
  contestExperts: [
    { id: 'expert-001', reviewToken: 'review-wang-7k2p', name: '王思远', phone: '138****3001', unit: '成都智创未来教育科技有限公司', specialties: ['人工智能', '创新实践'], capacity: 8, status: '可接任务' },
    { id: 'expert-002', reviewToken: 'review-liu-9m4x', name: '刘嘉敏', phone: '137****3003', unit: '成都智创未来教育科技有限公司', specialties: ['创新实践', '科学实验'], capacity: 6, status: '可接任务' },
    { id: 'expert-003', reviewToken: 'review-chen-3c8n', name: '陈亦然', phone: '139****3002', unit: '成都天府新区实验小学', specialties: ['人工智能', '机器人'], capacity: 6, status: '暂停接单' },
    { id: 'expert-004', reviewToken: 'review-zhou-5h6q', name: '周若兰', phone: '136****3018', unit: '电子科技大学信息与软件工程学院', specialties: ['人工智能', '创新实践'], capacity: 8, status: '可接任务' },
  ],
  contestAssignments: [
    { id: 'assignment-001', entryId: 'work-003', expertId: 'expert-002', status: '已分配', assignedAt: '2026-09-13 11:20', submittedAt: '' },
    { id: 'assignment-002', entryId: 'work-004', expertId: 'expert-001', status: '已提交', assignedAt: '2026-09-01 10:00', submittedAt: '2026-09-05 16:40' },
    { id: 'assignment-003', entryId: 'work-006', expertId: 'expert-001', status: '评分中', assignedAt: '2026-09-13 14:10', submittedAt: '' },
    { id: 'assignment-004', entryId: 'work-007', expertId: 'expert-002', status: '已锁定', assignedAt: '2026-09-10 11:30', submittedAt: '2026-09-12 15:20' },
    { id: 'assignment-005', entryId: 'work-008', expertId: 'expert-004', status: '已分配', assignedAt: '2026-09-02 09:15', submittedAt: '' },
  ],
  contestScores: [
    { id: 'score-002', assignmentId: 'assignment-002', status: '已提交', items: { innovation: 27, completion: 22, practice: 21, presentation: 18 }, total: 88, comment: '选题贴近校园生活，模型演示完整；建议补充训练样本来源和误识别分析。', updatedAt: '2026-09-05 16:40' },
    { id: 'score-003', assignmentId: 'assignment-003', status: '暂存', items: { innovation: 26, completion: 21 }, total: 47, comment: '', updatedAt: '2026-09-14 09:32' },
    { id: 'score-004', assignmentId: 'assignment-004', status: '已锁定', items: { innovation: 28, completion: 23, practice: 22, presentation: 18 }, total: 91, comment: '需求洞察清晰，原型完整且注重无障碍体验，建议继续优化药盒尺寸。', updatedAt: '2026-09-12 15:20', reviewNote: '评分依据完整，同意二等奖。' },
  ],
  contestLogs: [
    { id: 'contest-log-001', t: '2026-09-13 11:20', who: '张运营', mod: '评审分配', act: '将《校园垃圾分类识别箱》分配给专家刘嘉敏', ret: '成功' },
    { id: 'contest-log-002', t: '2026-09-05 16:40', who: '王思远', mod: '专家评分', act: '提交《会认垃圾的小助手》评分 88 分', ret: '成功' },
  ],
  users: [
    { id: 'u1', name: '张运营', phone: '138****9001', role: '平台管理员', unit: '天府未来教育中心', status: '启用', last: '2026-07-01 09:12' },
    { id: 'u2', name: '李敏', phone: '139****9002', role: '审核人员', unit: '天府未来教育中心', status: '启用', last: '2026-07-01 08:45' },
    { id: 'u3', name: '王芳', phone: '137****9003', role: '财务人员', unit: '天府未来教育中心', status: '启用', last: '2026-06-30 17:30' },
    { id: 'u4', name: '周校长', phone: '138****1001', role: '学校管理员', unit: '成都天府新区实验小学', status: '启用', last: '2026-06-30 16:02' },
    { id: 'u5', name: '王总', phone: '138****2001', role: '机构管理员', unit: '成都智创未来教育科技有限公司', status: '启用', last: '2026-07-01 10:18' },
    { id: 'u6', name: '测试客服', phone: '135****9006', role: '客服人员', unit: '天府未来教育中心', status: '禁用', last: '2026-05-20 11:00' },
    { id: 'u7', name: '王思远', phone: '138****3001', role: '赛事专家', unit: '成都智创未来教育科技有限公司', status: '启用', last: '2026-09-14 09:35' },
    { id: 'u8', name: '赛事复核员', phone: '139****9010', role: '赛事复核员', unit: '天府未来教育中心', status: '启用', last: '2026-09-14 08:50' },
  ],
  roles: [
    { id: 'r1', name: '平台管理员', desc: '全部权限', perms: 32 }, { id: 'r2', name: '运营人员', desc: '学校 / 课程配置 / 班级 / 赛事运营', perms: 20 },
    { id: 'r3', name: '审核人员', desc: '机构 / 教师 / 课程 / 作品资格审核', perms: 10 }, { id: 'r4', name: '财务人员', desc: '订单 / 销课 / 结算', perms: 9 },
    { id: 'r5', name: '客服人员', desc: '售后 / 订单查看', perms: 5 }, { id: 'r6', name: '学校管理员', desc: '本校场地 / 班级 / 销课确认', perms: 7 },
    { id: 'r7', name: '机构管理员', desc: '本机构教师 / 课程 / 销课', perms: 10 }, { id: 'r8', name: '教师子账号', desc: '上课签到 / 提交销课', perms: 3 },
    { id: 'r9', name: '赛事专家', desc: '仅查看本人分配作品并评分', perms: 3 }, { id: 'r10', name: '赛事复核员', desc: '评分复核、退回重评与结果确认', perms: 4 },
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

const ADMIN_STORE_KEY = 'futureEdu.admin.state.v3';
const contestStore = (window as any).FutureEduContestStore;
const toAdminContestEntry = (entry: any) => {
  const canonical = contestStore ? contestStore.normalizeEntry(entry) : entry;
  const work = canonical.work || { title: canonical.title || '', desc: canonical.desc || '', images: [], videos: [], files: [] };
  return {
    ...canonical,
    title: work.title,
    desc: work.desc,
    assets: [
      ...(work.images || []).map((asset: any) => ({ ...asset, type: '图片' })),
      ...(work.videos || []).map((asset: any) => ({ ...asset, type: '视频' })),
      ...(work.files || []).map((asset: any) => ({ ...asset, type: '附件' })),
    ],
  };
};
const loadAdminDB = () => {
  let saved: any = null;
  try { saved = JSON.parse(localStorage.getItem(ADMIN_STORE_KEY) || 'null'); } catch (_) {}
  const adminState = saved ? { ...initDB, ...saved } : initDB;
  if (!contestStore) return adminState;
  const publicDB = (window as any).DB || {};
  const shared = contestStore.load(
    [...(publicDB.contests || []), ...(initDB.competitions || []), ...(saved?.competitions || [])],
    [...(publicDB.contestEntries || []), ...(initDB.contestEntries || []), ...(saved?.contestEntries || [])],
  );
  const demoAssignments = shared.contestEntries.filter((e: any) => e.demo && ['待评分', '评分中', '待复核', '结果确定'].includes(e.reviewStatus)).map((e: any) => ({
    id: `assignment-${e.id}`, entryId: e.id, expertId: 'expert-001', assignedAt: '2026-09-14 11:00',
    status: ({ 待评分: '已分配', 评分中: '评分中', 待复核: '已提交', 结果确定: '已锁定' } as any)[e.reviewStatus],
  }));
  const demoScores = demoAssignments.filter((a: any) => a.status !== '已分配').map((a: any) => ({
    id: `score-${a.entryId}`, assignmentId: a.id, status: a.status === '评分中' ? '暂存' : a.status,
    items: a.status === '评分中' ? { innovation: 26 } : { innovation: 26, completion: 22, practice: 22, presentation: 18 },
    total: a.status === '评分中' ? 26 : 88, comment: a.status === '评分中' ? '' : '作品完整，选题有实践价值，建议进一步完善测试。', updatedAt: '2026-09-14 12:00',
  }));
  return { ...adminState, competitions: shared.competitions, contestEntries: shared.contestEntries.map(toAdminContestEntry),
    contestAssignments: [...demoAssignments.filter((a: any) => !adminState.contestAssignments.some((x: any) => x.id === a.id)), ...adminState.contestAssignments],
    contestScores: [...demoScores.filter((a: any) => !adminState.contestScores.some((x: any) => x.id === a.id)), ...adminState.contestScores],
  };
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
/* ---------- 机构入驻资料清单（审核必备项，支持逐项上传 / 核验 / 导出） ---------- */
const ORG_DOCS = [
  { key: 'license', name: '营业执照', required: true, tip: '原件照片或加盖鲜章的复印件' },
  { key: 'bank', name: '对公账户信息', required: true, tip: '开户许可证 / 银行印鉴页，须有银行章' },
  { key: 'idCard', name: '法人身份证（正反面）', required: true, tip: '原件照片或加盖鲜章的复印件，正反面齐全' },
  { key: 'schoolPermit', name: '办学许可证', required: false, tip: '如有需提供，原件照片或加盖鲜章的复印件' },
  { key: 'legalPhone', name: '法人实名手机号', required: true, tip: '须为法人实名手机号；如使用财务或其他非法人手机号，须另附加盖鲜章的签字授权书' },
  { key: 'storefront', name: '门店门头照', required: true, tip: '需清晰体现机构名称与门头' },
  { key: 'interior', name: '门店内景照', required: true, tip: '内景需能体现实际经营内容（教室 / 教学场景）' },
];
/* 资料校验：返回 { done, total, missing[] }，只计必填项 */
const docStat = (org: any) => {
  const docs = org?.docs || {};
  const req = ORG_DOCS.filter((d) => d.required);
  // 法人手机号项以「填了手机号」为准，其余项以「上传了文件」为准
  const filled = (d: any) => d.key === 'legalPhone' ? !!docs.legalPhone?.phone : !!docs[d.key]?.file || (d.key === 'license' && !!org?.licensePhoto);
  const missing = req.filter((d) => !filled(d)).map((d) => d.name);
  // 使用财务或其他非法人手机号时，必须附加盖鲜章的签字授权书
  if (docs.legalPhone?.isFinance && !docs.legalPhone?.auth) missing.push('非法人手机号授权书');
  return { done: req.filter(filled).length, total: req.length, missing };
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
  '家长反馈': '无异议 = 正常结算消课（含学生个人缺勤）；有异议 = 家长反馈没上课，转客服人工判定。',
  '确认状态': '家长对课程是否正常开展的反馈；3 天内未提出异议，系统自动正常结算消课。',
  '销课状态': '正常开展的课时自动结算消课；只有“没上课且有异议”的课时转客服人工判定。',
  '可结算金额': '正常开展的课时计入当月结算；客服处理中的课时暂不计入，待人工判定。',
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
const colTip = (cols: any[]) => (cols || []).map((c: any) => {
  const column = c.title === '操作' ? { ...c, onCell: () => ({ style: { whiteSpace: 'nowrap' } }) } : c;
  return typeof column.title === 'string' && COLDEF[column.title]
    ? { ...column, title: <span>{column.title} <Tooltip title={COLDEF[column.title]}><QuestionCircleOutlined style={{ color: '#b6bcc7', fontSize: 12, cursor: 'help' }} /></Tooltip></span> }
    : column;
});
const Tbl = (props: any) => <Table {...props} columns={colTip(props.columns)} />;
const now = () => '2026-07-01 ' + new Date().toTimeString().slice(0, 5);
const contestNow = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const contestLog = (mod: string, act: string, who = '张运营') => ({
  id: 'contest-log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
  t: contestNow(), who, mod, act, ret: '成功',
});

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
                options={['看板', '用户管理', '学校/点位管理', '场地管理', '机构审核', '教师审核', '课程审核', '课程配置', '赛事配置', '作品资格审核', '专家库', '评审分配', '专家评分', '评分复核', '结果发布', '成班管理', '订单管理', '销课管理', '结算管理', '售后管理', '操作日志'].map((x) => ({ label: x, value: x }))} />
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

  /* ---------- 入驻资料：逐项上传 / 核验 / 备注 ---------- */
  const patchDoc = (org: any, key: string, ch: any) => {
    const next = { ...(org.docs || {}), [key]: { ...((org.docs || {})[key] || {}), ...ch } };
    setDb((d: any) => ({ ...d, orgs: patch(d.orgs, org.id, { docs: next }) }));
    setDetail((cur: any) => cur?.id === org.id ? { ...cur, docs: next } : cur);
  };
  const auditMaterialRows = (org: any) => {
    const bank = org.docs?.bank;
    const base = [
      { key: 'base-license-no', name: '营业执照编号', required: true, tip: '机构基础信息', type: 'base', value: org.license, complete: !!org.license && org.license !== '待补充' },
      { key: 'base-legal', name: '法人信息', required: true, tip: '机构基础信息', type: 'base', value: org.legal, complete: !!org.legal && org.legal !== '待补充' },
      { key: 'base-dir', name: '服务方向 / 课程方向', required: true, tip: '按平台统一模板多选', type: 'base', value: org.dir, complete: !!org.dir },
      { key: 'base-scope', name: '服务范围', required: true, tip: '机构服务说明或经营范围', type: 'base', value: org.scope, complete: !!org.scope },
      {
        key: 'base-bank',
        name: '对公账户',
        required: true,
        tip: '与对公账户信息附件一致',
        type: 'base',
        value: bank?.bankAcct ? `${bank.bankName || '—'} · ${bank.bankAcct}` : '',
        complete: !!bank?.bankAcct,
      },
      { key: 'base-agreement', name: '合作协议', required: false, tip: '审核通过后可补签', type: 'base', value: org.agreement, complete: !!org.agreement && org.agreement !== '待签署' },
    ];
    return [...base, ...ORG_DOCS.map((d) => ({ ...d, type: 'doc' }))];
  };
  const docsTable = (org: any) => {
    const docs = org.docs || {};
    const st = docStat(org);
    return (
      <>
        <Alert style={{ marginBottom: 10 }} type={st.missing.length ? 'warning' : 'success'} showIcon
          message={st.missing.length
            ? `审核必备附件 ${st.done}/${st.total} 项已上传，缺：${st.missing.join('、')}`
            : `审核必备附件 ${st.done}/${st.total} 项齐全，可进入审核`} />
        <Tbl {...tblProps} rowKey="key" dataSource={auditMaterialRows(org)} columns={[
          {
            title: '审核资料项', dataIndex: 'name', width: 190,
            render: (v: string, r: any) => <Space direction="vertical" size={0}>
              <span>{v}{r.required ? <Tag color="red" style={{ marginLeft: 6 }}>必备</Tag> : <Tag style={{ marginLeft: 6 }}>选填</Tag>}</span>
              <span style={{ color: '#8a919f', fontSize: 12 }}>{r.tip}</span>
            </Space>,
          },
          {
            title: '内容 / 文件', render: (_: any, r: any) => {
              if (r.type === 'base') return r.value || <span style={{ color: '#bbb' }}>待补充</span>;
              const d = docs[r.key] || {};
              if (r.key === 'legalPhone') {
                return <Space direction="vertical" size={4}>
                  <span>手机号：{d.phone || '—'} {d.isFinance ? <Tag color="orange">财务 / 非法人手机号</Tag> : <Tag color="green">法人实名</Tag>}</span>
                  {d.isFinance && <span style={{ color: d.auth ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>
                    盖章授权书：{d.auth || '未上传（非法人手机号须提供加盖鲜章的签字授权书）'}
                  </span>}
                </Space>;
              }
              const file = d.file || (r.key === 'license' ? org.licensePhoto : '');
              return file
                ? <Space direction="vertical" size={2}>
                  <a onClick={() => message.info('Demo：预览 ' + file)}>{file}</a>
                  {d.note && <span style={{ color: '#ff4d4f', fontSize: 12 }}>{d.note}</span>}
                </Space>
                : <span style={{ color: '#bbb' }}>未上传</span>;
            },
          },
          {
            title: '核验', width: 100, render: (_: any, r: any) => {
              if (r.type === 'base') return <Tag color={r.complete ? 'green' : 'orange'}>{r.complete ? '已填写' : '待补充'}</Tag>;
              const d = docs[r.key] || {};
              const has = r.key === 'legalPhone' ? !!d.phone : !!d.file || (r.key === 'license' && !!org.licensePhoto);
              if (!has) return <Tag>待上传</Tag>;
              return <Tag color={d.verified ? 'green' : 'orange'}>{d.verified ? '已核验' : '待核验'}</Tag>;
            },
          },
          {
            title: '操作', width: 190, render: (_: any, r: any) => {
              if (r.type === 'base') return <span style={{ color: '#bbb' }}>—</span>;
              const d = docs[r.key] || {};
              const isPhone = r.key === 'legalPhone';
              const has = isPhone ? !!d.phone : !!d.file || (r.key === 'license' && !!org.licensePhoto);
              return <Space size={4}>
                {isPhone
                  ? <>
                    <a onClick={() => patchDoc(org, r.key, { isFinance: !d.isFinance })}>{d.isFinance ? '改为法人实名号' : '标记为非法人号'}</a>
                    {d.isFinance && <Upload accept="image/*,.pdf" beforeUpload={() => false} showUploadList={false}
                      onChange={(info: any) => { patchDoc(org, r.key, { auth: info?.file?.name || '授权书.jpg' }); message.success('盖章授权书已上传'); }}>
                      <a>传盖章授权书</a>
                    </Upload>}
                  </>
                  : <Upload accept="image/*,.pdf" beforeUpload={() => false} showUploadList={false}
                    onChange={(info: any) => { patchDoc(org, r.key, { file: info?.file?.name || (r.name + '.jpg'), verified: false }); message.success(r.name + ' 已上传'); }}>
                    <a>{d.file ? '重新上传' : '上传'}</a>
                  </Upload>}
                {has && <a style={{ color: d.verified ? '#8a919f' : '#52c41a' }}
                  onClick={() => patchDoc(org, r.key, { verified: !d.verified })}>{d.verified ? '撤销核验' : '核验通过'}</a>}
              </Space>;
            },
          },
        ]} />
      </>
    );
  };
  /* 导出机构资料清单（CSV，可交监管/存档） */
  const exportDocs = (list: any[], label: string) => {
    const head = ['机构名称', '联系人', '联系电话', '审核状态', '资料完整度', ...ORG_DOCS.map((d) => d.name), '缺失项'];
    const rows = list.map((o) => {
      const docs = o.docs || {}; const st = docStat(o);
      return [o.name, o.contact, o.phone, o.status, `${st.done}/${st.total}`,
        ...ORG_DOCS.map((d) => {
          const x = docs[d.key] || {};
          if (d.key === 'legalPhone') return (x.phone || '未填') + (x.isFinance ? `（财务/非法人号，盖章授权书：${x.auth || '缺'}）` : '（法人实名）');
          return x.file ? `${x.file}${x.verified ? '｜已核验' : '｜待核验'}` : '未上传';
        }),
        st.missing.join('；') || '无'];
    });
    const csv = '﻿' + [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `机构入驻资料_${label}_${now().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    message.success(`已导出 ${list.length} 家机构资料清单`);
  };
  const doAudit = (result: string, reason: string) => {
    // 通过前必须资料齐全（缺件只能驳回或退回补充）
    if (result === '通过') {
      const miss = docStat(audit).missing;
      if (miss.length) return message.warning('资料不全，无法通过：缺 ' + miss.join('、'));
    }
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
        docs: {
          license: { file: '', verified: false },
          bank: { file: '', verified: false, bankName: v.bankName || '', bankAcct: v.bankAcct || '' },
          idCard: { file: '', verified: false },
          schoolPermit: { file: '', verified: false },
          legalPhone: { file: '', verified: false, phone: v.legalPhone || v.phone || '', isFinance: false },
          storefront: { file: '', verified: false },
          interior: { file: '', verified: false },
        },
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
    <Card size="small" title="培训机构入驻" extra={<Space>
      <Button icon={<FileSearchOutlined />} onClick={() => exportDocs(flt.apply(db.orgs), '当前筛选')}>导出资料清单</Button>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新增机构</Button>
    </Space>}>
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.orgs)} columns={[
        { title: '机构名称', dataIndex: 'name', ellipsis: true }, { title: '联系人', dataIndex: 'contact' }, { title: '电话', dataIndex: 'phone' },
        { title: '服务方向', dataIndex: 'dir' }, { title: '提交时间', dataIndex: 'submitAt' },
        { title: '审核状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        {
          title: '资料完整度', render: (_: any, r: any) => {
            const st = docStat(r);
            const ok = st.missing.length === 0;
            return <Tooltip title={ok ? '必备资料齐全' : '缺：' + st.missing.join('、')}>
              <Tag color={ok ? 'green' : st.done === 0 ? 'red' : 'orange'}>{st.done}/{st.total}{ok ? ' 齐全' : ' 待补'}</Tag>
            </Tooltip>;
          },
        },
        { title: '登录账户', render: (_: any, r: any) => <S v={r.accountInfo ? '已开通' : '未开通'} /> },
        { title: '课程', dataIndex: 'courses' }, { title: '教师', dataIndex: 'teachers' }, { title: '结算账户', dataIndex: 'account' },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => setDetail(r)}>查看资料</a>
          {r.status === '待审核' && <a style={{ color: '#fa8c16' }} onClick={() => setAudit(r)}>审核</a>}
          <a onClick={() => openOrgAccount(r)}>{r.accountInfo ? '复制账户' : '开通账户'}</a>
          <a onClick={() => message.info('Demo：编辑机构')}>编辑</a>
          <a style={{ color: '#ff4d4f' }} onClick={() => setDb((d: any) => ({ ...d, orgs: patch(d.orgs, r.id, { status: '已禁用' }) }))}>禁用</a></Space> },
      ]} />
      <Drawer open={!!detail} width={860} title="机构详情" onClose={() => setDetail(null)}
        extra={detail && <Space>
          <Button onClick={() => exportDocs([detail], detail.name)}>导出本机构资料</Button>
          {detail.status === '待完善' && <Button type="primary" onClick={() => submitOrg(detail)}>提交审核</Button>}
          {detail.status === '待审核' && <Button type="primary" onClick={() => setAudit(detail)}>审核</Button>}
        </Space>}>
        {detail && <>
          <Descriptions column={2} size="small" bordered items={[
            { key: '1', label: '机构名称', span: 2, children: detail.name },
            { key: '2', label: '联系人 / 电话', children: detail.contact + ' / ' + detail.phone },
            { key: '3', label: '审核状态', children: <S v={detail.status} /> },
            { key: '4', label: '提交时间', children: detail.submitAt },
            { key: '5', label: '机构端账户', span: 2, children: detail.accountInfo ? <Space direction="vertical" size={4}>
              <span>链接：{detail.accountInfo.url}</span><span>手机号：{detail.accountInfo.username}</span><span>初始密码：{detail.accountInfo.password}</span>
              <Button size="small" onClick={() => copyText(accountText('机构端', detail, detail.accountInfo))}>复制链接和密码</Button>
            </Space> : <Button size="small" type="primary" onClick={() => openOrgAccount(detail)}>开通机构端账户</Button> },
          ]} />
          <Divider>审核资料（基础信息 + 入驻资料清单）</Divider>
          {docsTable(detail)}
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
          <Row gutter={12}>
            <Col span={12}><Form.Item label="法人信息" name="legal"><Input placeholder="如：陈某某（法人）" /></Form.Item></Col>
            <Col span={12}><Form.Item label="法人实名手机号" name="legalPhone"><Input placeholder="如：138****2008（财务或非法人号须附盖章授权书）" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="开户银行" name="bankName"><Input placeholder="如：中国银行成都天府支行" /></Form.Item></Col>
            <Col span={12}><Form.Item label="对公账号" name="bankAcct"><Input placeholder="须与带银行章的开户信息一致" /></Form.Item></Col>
          </Row>
          <Form.Item label="服务范围" name="scope"><TextArea rows={3} placeholder="填写机构服务范围或经营说明" /></Form.Item>
          <Alert type="info" showIcon message="创建后请在机构详情的「入驻资料清单」中上传营业执照、对公账户（银行章）、法人身份证正反面、办学许可证（如有）、门头照与内景照；手机号须为法人实名，如使用财务或其他非法人手机号须另附加盖鲜章的签字授权书。必备资料齐全后方可审核通过。" />
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
  const [supportCase, setSupportCase] = useState<any>(null);
  const [supportDecision, setSupportDecision] = useState('settle');
  const [supportNote, setSupportNote] = useState('');
  const flt = useTableFilter([
    { key: 'school', label: '学校', width: 200, options: optsOf(db.lessons, 'school', '学校') },
    { key: 'org', label: '机构', options: optsOf(db.lessons, 'org', '机构') },
    { key: 'course', label: '课程', width: 200, options: optsOf(db.lessons, 'course', '课程') },
    { key: 'status', label: '销课状态', options: optsOf(db.lessons, 'status', '销课状态') },
  ]);
  const submitSupportDecision = () => {
    if (!supportCase) return;
    const shouldSettle = supportDecision === 'settle';
    setDb((d: any) => ({
      ...d,
      lessons: patch(d.lessons, supportCase.id, {
        status: shouldSettle ? '已确认销课' : '不结算已关闭',
        schoolConfirm: shouldSettle ? '客服判定结算' : '客服判定不结算',
        amount: shouldSettle ? supportCase.due * 90 : 0,
        note: supportNote.trim() || (shouldSettle ? '客服核实后确认正常结算消课' : '客服核实后确认不结算、不消课'),
      }),
    }));
    message.success(shouldSettle ? '客服已判定：正常结算消课' : '客服已判定：不结算、不消课');
    setSupportCase(null);
    setSupportNote('');
  };
  const openSupportCase = (record: any) => {
    setSupportCase(record);
    setSupportDecision('settle');
    setSupportNote('');
  };
  return (
    <Card size="small" title="上课销课（正常课时自动结算消课；没上课且有异议由客服人工判定）">
      <Alert style={{ marginBottom: 12 }} type="info" showIcon message="销课规则"
        description="学生已到或因个人原因缺勤，只要课程正常开展，均正常结算消课；只有家长反馈该节没上并提出异议时，才暂停自动结算并转客服人工处理。" />
      <FilterRow>{flt.bar}</FilterRow>
      <Tbl {...tblProps} dataSource={flt.apply(db.lessons)} columns={[
        { title: '班级', dataIndex: 'cls', ellipsis: true }, { title: '机构', dataIndex: 'org' }, { title: '学校', dataIndex: 'school', ellipsis: true },
        { title: '上课日期', dataIndex: 'date' }, { title: '节次', dataIndex: 'no', render: (v: number) => '第 ' + v + ' 节' }, { title: '教师', dataIndex: 'teacher' },
        { title: '应到/实到', render: (_: any, r: any) => `${r.due} / ${r.actual || '—'}` },
        { title: '教师签到', dataIndex: 'sign', render: (v: string) => <S v={v} /> },
        { title: '家长反馈', dataIndex: 'schoolConfirm', render: (v: string) => (v === '—' ? '—' : <S v={v} />) },
        { title: '销课状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '可结算金额', dataIndex: 'amount', render: (v: number) => (v ? <b style={{ color: '#52c41a' }}>{money(v)}</b> : '—') },
        { title: '操作', render: (_: any, r: any) => <Space><a onClick={() => setDetail(r)}>查看</a>
          {['客服处理中', '异常'].includes(r.status) && <a style={{ color: '#722ed1' }} onClick={() => openSupportCase(r)}>客服处理</a>}
        </Space> },
      ]} />
      <Drawer open={!!detail} width={480} title="销课记录详情" onClose={() => setDetail(null)}>
        {detail && <Descriptions column={1} size="small" bordered items={[
          { key: '1', label: '班级', children: detail.cls }, { key: '2', label: '课程', children: detail.course },
          { key: '3', label: '机构 / 学校', children: detail.org + ' / ' + detail.school },
          { key: '4', label: '上课时间', children: detail.date + '（第 ' + detail.no + ' 节）' }, { key: '5', label: '任课教师', children: detail.teacher },
          { key: '6', label: '出勤', children: `应到 ${detail.due} 人 · 实到 ${detail.actual || '—'} 人` },
          { key: '6a', label: '家长反馈', children: detail.schoolConfirm === '—' ? '—' : <S v={detail.schoolConfirm} /> },
          { key: '7', label: '销课状态', children: <S v={detail.status} /> },
          { key: '8', label: '可结算金额', children: detail.amount ? money(detail.amount) : '—' },
          ...(detail.note ? [{ key: '9', label: '异常说明', children: detail.note }] : []),
        ]} />}
      </Drawer>
      <Modal open={!!supportCase} title="客服人工判定是否结算消课" okText="提交处理结果" cancelText="取消"
        onCancel={() => setSupportCase(null)} onOk={submitSupportDecision}>
        <Alert style={{ marginBottom: 16 }} type="warning" showIcon
          message={supportCase ? `${supportCase.cls} · 第 ${supportCase.no} 节` : ''}
          description={supportCase?.note || '家长反馈该节课没上并提出异议，请核对教师签到、考勤、课堂记录及沟通材料。'} />
        <Radio.Group value={supportDecision} onChange={(e: any) => setSupportDecision(e.target.value)} style={{ display: 'grid', gap: 10 }}>
          <Radio value="settle">核实可结算：正常结算并消课</Radio>
          <Radio value="no-settle">核实不可结算：不结算、不消课</Radio>
        </Radio.Group>
        <TextArea style={{ marginTop: 14 }} rows={3} value={supportNote} onChange={(e: any) => setSupportNote(e.target.value)} placeholder="填写核实依据或处理说明（选填）" />
      </Modal>
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

function ExpertReviewPage({ db, setDb, token, eventId }: any) {
  const [scoreTarget, setScoreTarget] = useState<any>(null);
  const [draft, setDraft] = useState<any>({ items: {}, comment: '' });
  const expert = (db.contestExperts || []).find((item: any) => item.reviewToken === token);
  const competition = (db.competitions || []).find((item: any) => item.id === eventId && (item.expertIds || []).includes(expert?.id));
  const entries = db.contestEntries || [];
  const assignments = db.contestAssignments || [];
  const scores = db.contestScores || [];
  const tasks = expert && competition ? assignments.filter((assignment: any) => assignment.expertId === expert.id).map((assignment: any) => {
    const entry = entries.find((item: any) => item.id === assignment.entryId);
    const score = scores.find((item: any) => item.assignmentId === assignment.id);
    return entry?.competitionId === competition.id ? { assignment, entry, score } : null;
  }).filter(Boolean) : [];
  const openReview = (task: any) => {
    setScoreTarget(task);
    setDraft({ items: { ...(task.score?.items || {}) }, comment: task.score?.comment || '' });
  };
  const saveReview = (submit: boolean) => {
    if (!scoreTarget) return;
    const criteria = competition.criteria || [];
    if (submit && criteria.some((criterion: any) => !Number.isFinite(draft.items[criterion.key]))) return message.warning('请完成全部评分维度');
    if (submit && !draft.comment.trim()) return message.warning('请填写专家评语');
    const invalid = criteria.find((criterion: any) => Number(draft.items[criterion.key] || 0) < 0 || Number(draft.items[criterion.key] || 0) > criterion.max);
    if (invalid) return message.warning(`${invalid.name}应在 0-${invalid.max} 分之间`);
    const total = criteria.reduce((sum: number, criterion: any) => sum + Number(draft.items[criterion.key] || 0), 0);
    const score = {
      id: scoreTarget.score?.id || 'score-' + Date.now(), assignmentId: scoreTarget.assignment.id,
      status: submit ? '已提交' : '暂存', items: { ...draft.items }, total,
      comment: draft.comment.trim(), updatedAt: contestNow(),
    };
    setDb((state: any) => ({
      ...state,
      contestScores: scoreTarget.score ? patch(state.contestScores, score.id, score) : [score, ...state.contestScores],
      contestAssignments: patch(state.contestAssignments, scoreTarget.assignment.id, { status: submit ? '已提交' : '评分中', submittedAt: submit ? contestNow() : '' }),
      contestEntries: patch(state.contestEntries, scoreTarget.entry.id, { reviewStatus: submit ? '待复核' : '评分中' }),
      contestLogs: [contestLog('专家评分', `${submit ? '提交' : '暂存'}《${scoreTarget.entry.title}》评分${submit ? ` ${total} 分` : ''}`, expert.name), ...(state.contestLogs || [])],
    }));
    setScoreTarget(null);
    message.success(submit ? '评分已提交，等待赛事方复核' : '评分草稿已保存');
  };
  if (!expert || !competition) return <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: 24 }}><Card style={{ maxWidth: 620, margin: '80px auto' }}><Alert type="error" showIcon message="评审链接无效或已失效" description="请联系赛事工作人员重新获取专属评审链接。" /></Card></div>;
  const doneCount = tasks.filter((task: any) => ['已提交', '已锁定'].includes(task.assignment.status)).length;
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header style={{ height: 'auto', minHeight: 64, lineHeight: 1.4, padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Space><div style={{ width: 36, height: 36, borderRadius: 8, background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>未</div><span><b>专家评审工作台</b><div style={{ color: '#777', fontSize: 12 }}>天府未来教育中心</div></span></Space>
        <Space><Tag color="green">专属链接 · 免登录</Tag><Avatar style={{ background: '#1677ff' }}>{expert.name.slice(0, 1)}</Avatar><b>{expert.name} 专家</b></Space>
      </Header>
      <Content style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '20px 12px 40px', boxSizing: 'border-box' }}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} md={17}><Space direction="vertical" size={4}><Space wrap><h1 style={{ margin: 0, fontSize: 22 }}>{competition.name}</h1><S v={competition.status} /></Space><span style={{ color: '#666' }}>{competition.organizer} · 评审截止 {competition.reviewEnd}</span></Space></Col>
            <Col xs={24} md={7}><Progress percent={tasks.length ? Math.round(doneCount / tasks.length * 100) : 0} format={() => `${doneCount} / ${tasks.length} 已提交`} /></Col>
          </Row>
        </Card>
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message="此链接仅供本人评审使用，请勿转发" description="您只能查看赛事方分配给您的作品。评分提交后不可修改，如需调整请联系赛事复核员退回。" />
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          {[
            ['全部任务', tasks.length],
            ['待评分', tasks.filter((task: any) => task.assignment.status === '已分配').length],
            ['评分中', tasks.filter((task: any) => task.assignment.status === '评分中').length],
            ['已提交', doneCount],
          ].map(([title, value], index) => <Col xs={12} md={6} key={String(title)}><Card size="small" style={statCardStyle(index)}><Statistic title={title} value={value} /></Card></Col>)}
        </Row>
        <Card size="small" title="我的评审任务">
          <Tbl {...tblProps} dataSource={tasks} columns={[
            { title: '作品', width: 260, render: (_: any, task: any) => <span><b>{task.entry.title}</b><div style={{ color: '#888', fontSize: 12 }}>{task.entry.teamType} · {task.entry.assets.length} 项材料</div></span> },
            { title: '参赛学生', width: 150, render: (_: any, task: any) => <span>{task.entry.studentName}<div style={{ color: '#888', fontSize: 12 }}>{task.entry.grade}</div></span> },
            { title: '学校', render: (_: any, task: any) => task.entry.school },
            { title: '分配时间', width: 160, render: (_: any, task: any) => task.assignment.assignedAt },
            { title: '状态', width: 100, render: (_: any, task: any) => <S v={task.assignment.status} /> },
            { title: '得分', width: 80, render: (_: any, task: any) => task.score ? <b style={{ color: '#1677ff' }}>{task.score.total} 分</b> : '—' },
            { title: '操作', fixed: 'right', width: 110, render: (_: any, task: any) => <Button type="link" onClick={() => openReview(task)}>{['已提交', '已锁定'].includes(task.assignment.status) ? '查看评分' : task.score ? '继续评分' : '开始评审'}</Button> },
          ]} />
        </Card>
      </Content>
      <Modal open={!!scoreTarget} width={760} title={`作品评审：${scoreTarget?.entry.title || ''}`} onCancel={() => setScoreTarget(null)} footer={scoreTarget && ['已提交', '已锁定'].includes(scoreTarget.assignment.status) ? <Button onClick={() => setScoreTarget(null)}>关闭</Button> : [<Button key="cancel" onClick={() => setScoreTarget(null)}>取消</Button>, <Button key="draft" onClick={() => saveReview(false)}>保存草稿</Button>, <Button key="submit" type="primary" onClick={() => saveReview(true)}>提交评分</Button>]}>
        {scoreTarget && <>
          <Descriptions bordered size="small" column={2} items={[
            { key: 'student', label: '参赛学生', children: `${scoreTarget.entry.studentName} · ${scoreTarget.entry.grade}` },
            { key: 'school', label: '学校', children: scoreTarget.entry.school },
            { key: 'desc', label: '作品说明', span: 2, children: scoreTarget.entry.desc },
          ]} />
          <Divider orientation="left">作品材料</Divider>
          <List bordered size="small" dataSource={scoreTarget.entry.assets} renderItem={(asset: any) => <List.Item actions={[<a onClick={() => message.info('演示环境未连接真实文件存储')}>查看材料</a>]}><List.Item.Meta title={asset.name} description={`${asset.type} · ${asset.size}`} /></List.Item>} />
          <Divider orientation="left">评分表</Divider>
          {(competition.criteria || []).map((criterion: any) => <div key={criterion.key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><span style={{ width: 110 }}>{criterion.name}</span><InputNumber disabled={['已提交', '已锁定'].includes(scoreTarget.assignment.status)} min={0} max={criterion.max} value={draft.items[criterion.key]} onChange={(value) => setDraft((state: any) => ({ ...state, items: { ...state.items, [criterion.key]: value } }))} /><span style={{ color: '#777' }}>/ {criterion.max} 分</span></div>)}
          <div style={{ marginBottom: 8 }}>专家评语</div>
          <TextArea disabled={['已提交', '已锁定'].includes(scoreTarget.assignment.status)} rows={4} value={draft.comment} onChange={(event: any) => setDraft((state: any) => ({ ...state, comment: event.target.value }))} placeholder="请评价作品亮点、问题与改进建议" />
          <div style={{ textAlign: 'right', marginTop: 12, fontSize: 18 }}>总分：<b style={{ color: '#1677ff' }}>{(competition.criteria || []).reduce((sum: number, criterion: any) => sum + Number(draft.items[criterion.key] || 0), 0)}</b> / 100</div>
        </>}
      </Modal>
    </Layout>
  );
}

/* 十三、赛事评审中心 */
function CompetitionPage({ db, setDb }: any) {
  const [tab, setTab] = useState('events');
  const [activeCompetitionId, setActiveCompetitionId] = useState('');
  const [reviewLinkCompetition, setReviewLinkCompetition] = useState<any>(null);
  const [expertManageCompetition, setExpertManageCompetition] = useState<any>(null);
  const [expertToAdd, setExpertToAdd] = useState('');
  const [eventEdit, setEventEdit] = useState<any>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventTabKey, setEventTabKey] = useState('basic');
  const [eventErrors, setEventErrors] = useState<any[]>([]);
  const eventErrorRef = useRef<HTMLDivElement>(null);
  const [uploadPending, setUploadPending] = useState(0);
  const [previewCompetition, setPreviewCompetition] = useState<any>(null);
  const uploadCount = useRef(0);
  const gallerySlots = useRef(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [coverDraft, setCoverDraft] = useState('');
  const [galleryDraft, setGalleryDraft] = useState<any[]>([]);
  const [attachmentDraft, setAttachmentDraft] = useState<any[]>([]);
  const [videoDraft, setVideoDraft] = useState<any>(null);
  const [videoPosterDraft, setVideoPosterDraft] = useState('');
  const [ruleCompetition, setRuleCompetition] = useState<any>(null);
  const [workDetail, setWorkDetail] = useState<any>(null);
  const [auditTarget, setAuditTarget] = useState<any>(null);
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [assignExpertId, setAssignExpertId] = useState('');
  const [expertOpen, setExpertOpen] = useState(false);
  const [scoreTarget, setScoreTarget] = useState<any>(null);
  const [scoreDraft, setScoreDraft] = useState<any>({ items: {}, comment: '' });
  const [scoreExpertId, setScoreExpertId] = useState('expert-001');
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState('confirm');
  const [reviewAward, setReviewAward] = useState('无奖项');
  const [reviewNote, setReviewNote] = useState('');
  const [selectedWorks, setSelectedWorks] = useState<React.Key[]>([]);
  const [resultCompetitionId, setResultCompetitionId] = useState((db.competitions || [])[0]?.id || '');
  const [eventForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [expertForm] = Form.useForm();
  const screens = Grid.useBreakpoint();

  const competitions = db.competitions || [];
  useEffect(() => {
    let active = true;
    let url = '';
    setVideoPreviewUrl('');
    if (videoDraft?.mediaKey) (window as any).FutureEduContestMedia.get(videoDraft.mediaKey).then((file: any) => {
      if (active && file) { url = URL.createObjectURL(file); setVideoPreviewUrl(url); }
    }).catch(() => message.warning('视频预览读取失败，请重新选择文件'));
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [videoDraft?.mediaKey]);
  const entries = db.contestEntries || [];
  const experts = db.contestExperts || [];
  const assignments = db.contestAssignments || [];
  const scores = db.contestScores || [];
  const competitionOf = (id: string) => competitions.find((c: any) => c.id === id);
  const entryOf = (id: string) => entries.find((e: any) => e.id === id);
  const expertOf = (id: string) => experts.find((e: any) => e.id === id);
  const assignmentOf = (entryId: string) => assignments.find((a: any) => a.entryId === entryId);
  const scoreOf = (assignmentId: string) => scores.find((s: any) => s.assignmentId === assignmentId);
  const expertLoad = (expertId: string, competitionId?: string) => assignments.filter((a: any) => {
    const entry = entryOf(a.entryId);
    return a.expertId === expertId && (!competitionId || entry?.competitionId === competitionId);
  }).length;
  const competitionExperts = (competitionId: string) => {
    const competition = competitionOf(competitionId);
    return experts.filter((expert: any) => (competition?.expertIds || []).includes(expert.id));
  };
  const reviewUrl = (competition: any, expert: any) => `${window.location.origin}${window.location.pathname}?review=${expert.reviewToken}&event=${competition.id}`;
  const copyReviewUrl = (competition: any, expert: any) => {
    navigator.clipboard.writeText(reviewUrl(competition, expert))
      .then(() => message.success(`已复制 ${expert.name} 的评审链接`))
      .catch(() => message.warning('浏览器未允许复制，请先点击页面后重试'));
  };
  const addLog = (state: any, mod: string, act: string, who?: string) => ({
    ...state,
    contestLogs: [contestLog(mod, act, who), ...(state.contestLogs || [])],
  });

  const textLines = (value: any) => String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const joinLines = (rows: any[], formatter: (row: any) => string) => (rows || []).map(formatter).join('\n');
  const parseColumns = (value: any, count: number) => textLines(value).map((line) => {
    const columns = line.split('|').map((part) => part.trim());
    while (columns.length < count) columns.push('');
    return columns;
  });
  const uploadSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const uploadKind = (file: any) => (String(file.name || '').split('.').pop() || file.type || '文件').toUpperCase();
  const adminMediaUrl = (src: string) => !src || /^(data:|blob:|https?:|\/)/.test(src) || src.startsWith('../') ? src : `../${src}`;
  const adminCoverUrl = (src: string) => ({ science: '../assets/images/courses/science-lab.png', ai: '../assets/images/courses/ai-basics.png', code: '../assets/images/courses/coding-thinking.png', art: '../assets/images/courses/ai-art.png' } as Record<string, string>)[src] || adminMediaUrl(src);
  const imagePreview = (file: any, maxSide = 960) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('图片解析失败'));
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .78));
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
  const uploading = (delta: number) => { uploadCount.current += delta; setUploadPending(uploadCount.current); };

  const addGalleryImage = async (file: any) => {
    if (!String(file.type || '').startsWith('image/')) { message.warning('展示图集只能上传图片'); return Upload.LIST_IGNORE; }
    if (file.size > 10 * 1048576) { message.warning('单张图片不能超过 10 MB'); return Upload.LIST_IGNORE; }
    if (gallerySlots.current >= 9) { message.warning('图集最多 9 张，超出图片未添加'); return Upload.LIST_IGNORE; }
    gallerySlots.current += 1;
    uploading(1);
    try {
      const img = await imagePreview(file);
      setGalleryDraft((rows) => rows.length >= 9 ? rows : [...rows, { uid: `${Date.now()}-${file.uid || file.name}`, img, name: file.name, caption: '' }]);
      message.success(`${file.name} 已加入展示图集`);
    } catch (error: any) {
      gallerySlots.current -= 1;
      message.error(error.message || '图片上传失败');
    } finally { uploading(-1); }
    return Upload.LIST_IGNORE;
  };
  const addListCover = async (file: any) => {
    if (!String(file.type || '').startsWith('image/')) { message.warning('列表封面只能上传图片'); return Upload.LIST_IGNORE; }
    if (file.size > 10 * 1048576) { message.warning('列表封面不能超过 10 MB'); return Upload.LIST_IGNORE; }
    uploading(1);
    try {
      setCoverDraft(await imagePreview(file, 1280));
      message.success('列表封面已上传');
    } catch (error: any) {
      message.error(error.message || '列表封面上传失败');
    } finally { uploading(-1); }
    return Upload.LIST_IGNORE;
  };
  const replaceGalleryImage = async (file: any, uid: string) => {
    if (!String(file.type || '').startsWith('image/') || file.size > 10 * 1048576) { message.warning('请选择不超过 10 MB 的图片'); return Upload.LIST_IGNORE; }
    uploading(1);
    try {
      const img = await imagePreview(file);
      setGalleryDraft((rows) => rows.map((row) => row.uid === uid ? { ...row, img, name: file.name } : row));
      message.success('图片已替换，说明已保留');
    } catch (error: any) { message.error(error.message); } finally { uploading(-1); }
    return Upload.LIST_IGNORE;
  };
  const addAttachment = async (file: any) => {
    if (file.size > 50 * 1048576) { message.warning('单个赛事附件不能超过 50 MB'); return Upload.LIST_IGNORE; }
    uploading(1);
    try {
      const mediaKey = await (window as any).FutureEduContestMedia.put(file);
      setAttachmentDraft((rows) => [...rows.filter((item) => item.name !== file.name), { uid: mediaKey, mediaKey, name: file.name, kind: uploadKind(file), size: uploadSize(file.size), bytes: file.size, mimeType: file.type }]);
      message.success(`${file.name} 已保存到本浏览器（同名附件替换）`);
    } catch (error: any) { message.error(error.message); } finally { uploading(-1); }
    return Upload.LIST_IGNORE;
  };
  const addVideo = async (file: any) => {
    if (!String(file.type || '').startsWith('video/')) { message.warning('请选择视频文件'); return Upload.LIST_IGNORE; }
    if (file.size > 500 * 1048576) { message.warning('宣传片不能超过 500 MB'); return Upload.LIST_IGNORE; }
    uploading(1);
    try {
      const mediaKey = await (window as any).FutureEduContestMedia.put(file);
      setVideoDraft({ uid: file.uid, mediaKey, name: file.name, size: uploadSize(file.size), bytes: file.size, mimeType: file.type });
      message.success('宣传片已保存到本浏览器');
    } catch (error: any) { message.error(error.message); } finally { uploading(-1); }
    return Upload.LIST_IGNORE;
  };
  const addVideoPoster = async (file: any) => {
    if (!String(file.type || '').startsWith('image/')) { message.warning('宣传片封面只能上传图片'); return Upload.LIST_IGNORE; }
    if (file.size > 10 * 1048576) { message.warning('封面图片不能超过 10 MB'); return Upload.LIST_IGNORE; }
    uploading(1);
    try {
      setVideoPosterDraft(await imagePreview(file, 1280));
      message.success('宣传片封面已上传');
    } catch (error: any) {
      message.error(error.message || '封面上传失败');
    } finally { uploading(-1); }
    return Upload.LIST_IGNORE;
  };

  const openEvent = (event?: any) => {
    const row = event || {
      name: '', category: '创新实践', cover: '', desc: '', organizer: '', audience: '全区中小学生', signupStart: '', signupEnd: '', reviewEnd: '', status: '草稿',
      eligibility: { gradeMin: 1, gradeMax: 12, schoolKeywords: [] }, teamForm: '个人 / 团队', fee: '免费', requiresEligibilityReview: true,
      intro: [], gallery: [], schedule: [], attachments: [], awards: [], video: null,
      materialRule: '图片、视频、附件至少提交一项；作品须为学生本人或团队原创。',
      workSpec: { imageMax: 9, videoMax: 1, fileMax: 5, fileTypes: 'PDF / Word / PPT / 压缩包', requiredFileNameIncludes: [] },
    };
    setEventEdit(event || null);
    setEventTabKey('basic');
    setEventErrors([]);
    eventForm.resetFields();
    gallerySlots.current = (row.gallery || []).length;
    setCoverDraft(row.cover || '');
    setGalleryDraft((row.gallery || []).map((item: any, index: number) => ({ uid: item.uid || `gallery-${index}`, ...item })));
    setAttachmentDraft((row.attachments || []).map((item: any, index: number) => ({ uid: item.uid || `attachment-${index}`, ...item })));
    setVideoDraft(row.video ? { name: row.video.fileName || '内置演示素材', mediaKey: row.video.mediaKey, demo: !row.video.mediaKey, size: row.video.fileSize || '', bytes: row.video.bytes || 0, mimeType: row.video.mimeType || '' } : null);
    setVideoPosterDraft(row.video?.poster || '');
    eventForm.setFieldsValue({
      ...row,
      requiresEligibilityReview: row.requiresEligibilityReview !== false,
      materialRule: row.materialRule || row.workSpec?.note,
      gradeMin: row.eligibility?.gradeMin ?? 1,
      gradeMax: row.eligibility?.gradeMax ?? 12,
      schoolKeywords: (row.eligibility?.schoolKeywords || []).join('、'),
      introText: (row.intro || []).join('\n'),
      schedule: row.schedule || [],
      awards: contestStore.awardsOf(row),
      status: ({ 征集中: '报名中', 征集截止: '报名结束', 待发布: '评审中' } as any)[row.status] || row.status,
      videoTitle: row.video?.title || '', videoDuration: row.video?.duration || '',
      imageMax: row.workSpec?.imageMax ?? 9, videoMax: row.workSpec?.videoMax ?? 1, fileMax: row.workSpec?.fileMax ?? 5,
      allowedFileExtensions: row.workSpec?.allowedFileExtensions || ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'rar', '7z'],
      requiredFiles: (row.workSpec?.requiredFileNameIncludes || []).join('、'),
    });
    setEventOpen(true);
  };

  const saveEvent = () => {
    if (uploadCount.current) return message.warning('文件处理中，请稍后保存');
    setEventErrors([]);
    eventForm.validateFields().then((v: any) => {
      if (v.gradeMin > v.gradeMax) return message.warning('最低年级不能高于最高年级');
      if (v.signupStart > v.signupEnd) return message.warning('报名截止日期不能早于报名开始日期');
      if (v.reviewEnd < v.signupEnd) return message.warning('评审截止日期不能早于报名截止日期');
      if (!coverDraft) return message.warning('请上传赛事列表封面');
      if (!(v.imageMax || v.videoMax || v.fileMax)) { setEventTabKey('material'); return message.warning('至少允许上传一种作品材料'); }
      if (v.requiredFiles?.trim() && !v.fileMax) { setEventTabKey('material'); return message.warning('设置必交文件时，附件上限不能为 0'); }
      if ((videoDraft || videoPosterDraft || v.videoTitle) && (!videoDraft || !videoPosterDraft || !v.videoTitle?.trim())) { setEventTabKey('content'); return message.warning('宣传片请同时配置视频、封面和标题；不展示时请全部移除'); }
      const awardNames = (v.awards || []).map((a: any) => a.name.trim());
      if (new Set(awardNames).size !== awardNames.length || awardNames.includes('无奖项')) return message.warning('奖项名称不能重复，也不能使用“无奖项”');
      const schedule = v.schedule || [];
      const video = videoDraft || videoPosterDraft || v.videoTitle ? {
        poster: videoPosterDraft, title: v.videoTitle, duration: v.videoDuration, mediaKey: videoDraft?.mediaKey, demo: videoDraft?.demo,
        fileName: videoDraft?.name || '', fileSize: videoDraft?.size || '', bytes: videoDraft?.bytes || 0, mimeType: videoDraft?.mimeType || '',
      } : undefined;
      const row = {
        ...(eventEdit || {}),
        id: eventEdit?.id || 'contest-' + Date.now(),
        name: v.name,
        category: v.category,
        cover: coverDraft,
        desc: v.desc,
        organizer: v.organizer,
        audience: v.audience,
        signupStart: v.signupStart,
        signupEnd: v.signupEnd,
        reviewEnd: v.reviewEnd,
        status: v.status,
        requiresEligibilityReview: v.requiresEligibilityReview !== false,
        signupCount: eventEdit?.signupCount || 0,
        eligibility: {
          gradeMin: v.gradeMin, gradeMax: v.gradeMax,
          schoolKeywords: String(v.schoolKeywords || '').split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
        },
        teamForm: v.teamForm,
        fee: v.fee,
        intro: textLines(v.introText).length ? textLines(v.introText) : [v.desc],
        gallery: galleryDraft.map(({ uid, name, ...item }) => item),
        video,
        schedule,
        attachments: attachmentDraft.map(({ uid, ...item }) => item),
        awards: (v.awards || []).map((a: any) => ({ ...a, name: a.name.trim() })),
        expertIds: eventEdit?.expertIds || [],
        reviewerCount: (eventEdit?.expertIds || []).length,
        materialRule: v.materialRule,
        workSpec: {
          ...(eventEdit?.workSpec || {}), note: v.materialRule,
          imageMax: v.imageMax, videoMax: v.videoMax, fileMax: v.fileMax, allowedFileExtensions: v.allowedFileExtensions,
          fileTypes: (v.allowedFileExtensions || []).join(' / ').toUpperCase(),
          requiredFileNameIncludes: String(v.requiredFiles || '').split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
        },
        criteria: eventEdit?.criteria || [
          { key: 'innovation', name: '创新性', max: 30 }, { key: 'completion', name: '完成度', max: 25 },
          { key: 'practice', name: '技术与实践', max: 25 }, { key: 'presentation', name: '表达展示', max: 20 },
        ],
      };
      setDb((d: any) => {
        const list = eventEdit ? patch(d.competitions, row.id, row) : [row, ...d.competitions];
        const contestEntries = d.contestEntries.map((e: any) => e.competitionId !== row.id ? e : { ...e,
          resultPublished: row.status === '结果已发布' ? e.reviewStatus === '结果确定' : row.status === '已归档' ? e.resultPublished : false,
        });
        return addLog({ ...d, competitions: list, contestEntries }, '赛事配置', `${eventEdit ? '更新' : '创建'}赛事《${row.name}》`);
      });
      setEventOpen(false);
      message.success(eventEdit ? '赛事配置已保存' : '赛事已创建');
    }).catch((error: any) => {
      const field = error.errorFields?.[0]?.name;
      setEventErrors(error.errorFields || []);
      if (field) focusEventField(field);
      message.warning('请检查标红的必填项，已定位到对应分区');
      setTimeout(() => eventErrorRef.current?.focus(), 120);
    });
  };
  const focusEventField = (field: any[]) => {
    const key = field[0];
    setEventTabKey(['schedule', 'awards', 'introText', 'videoTitle', 'videoDuration'].includes(key) ? 'content' : ['materialRule', 'imageMax', 'videoMax', 'fileMax', 'allowedFileExtensions', 'requiredFiles'].includes(key) ? 'material' : 'basic');
    setTimeout(() => { eventForm.scrollToField(field, { block: 'center' }); document.getElementById(field.join('_'))?.focus(); }, 80);
  };

  const openReviewRules = (competition: any) => {
    setRuleCompetition(competition);
    ruleForm.setFieldsValue({ criteria: (competition.criteria || []).map((item: any) => ({ ...item })) });
  };

  const saveReviewRules = () => {
    ruleForm.validateFields().then((values: any) => {
      const criteria = (values.criteria || []).map((item: any, index: number) => ({
        key: item.key || `criterion-${Date.now()}-${index}`,
        name: item.name.trim(), max: Number(item.max),
      }));
      if (criteria.length < 2) return message.warning('至少配置 2 个评分维度');
      const total = criteria.reduce((sum: number, item: any) => sum + item.max, 0);
      if (total !== 100) return message.warning(`评分维度总分当前为 ${total}，必须等于 100 分`);
      const save = () => {
        setDb((state: any) => addLog({ ...state, competitions: patch(state.competitions, ruleCompetition.id, { criteria }) }, '评审规则', `更新《${ruleCompetition.name}》评分维度`));
        setRuleCompetition(null);
        message.success('评审规则已保存');
      };
      const hasScores = assignments.some((assignment: any) => entryOf(assignment.entryId)?.competitionId === ruleCompetition.id && scoreOf(assignment.id));
      if (hasScores) Modal.confirm({ title: '本赛事已有评分记录', content: '修改后新评分使用新规则，历史评分不会自动重算。此 Demo 不管理规则版本，请确认需要修改。', okText: '确认修改', cancelText: '返回检查', onOk: save });
      else save();
    }).catch(() => message.warning('请补全评分维度名称与分值'));
  };

  const addCompetitionExpert = () => {
    if (!expertManageCompetition || !expertToAdd) return message.warning('请选择要加入的专家');
    const expert = expertOf(expertToAdd);
    if (!expert) return;
    const currentIds = competitionOf(expertManageCompetition.id)?.expertIds || [];
    if (currentIds.includes(expert.id)) return message.info('该专家已在本赛事中');
    const expertIds = [...currentIds, expert.id];
    setDb((state: any) => addLog({ ...state, competitions: patch(state.competitions, expertManageCompetition.id, { expertIds, reviewerCount: expertIds.length }) }, '赛事专家', `将专家${expert.name}加入《${expertManageCompetition.name}》`));
    setExpertToAdd('');
    message.success(`已将 ${expert.name} 加入本赛事`);
  };

  const removeCompetitionExpert = (expert: any) => {
    if (!expertManageCompetition) return;
    const assignedCount = assignments.filter((assignment: any) => assignment.expertId === expert.id && entryOf(assignment.entryId)?.competitionId === expertManageCompetition.id).length;
    if (assignedCount) return message.warning(`该专家还有 ${assignedCount} 份作品，请先调整作品分配后再移除`);
    const currentIds = competitionOf(expertManageCompetition.id)?.expertIds || [];
    const expertIds = currentIds.filter((id: string) => id !== expert.id);
    setDb((state: any) => addLog({ ...state, competitions: patch(state.competitions, expertManageCompetition.id, { expertIds, reviewerCount: expertIds.length }) }, '赛事专家', `将专家${expert.name}移出《${expertManageCompetition.name}》`));
    message.success(`已将 ${expert.name} 从本赛事移除`);
  };

  const auditWork = (result: string, reason: string) => {
    if (!auditTarget) return;
    const passed = result === '通过';
    const audit = { t: contestNow(), who: '李敏', act: passed ? '资格审核通过' : '资格审核驳回', note: reason };
    setDb((d: any) => {
      const contestEntries = d.contestEntries.map((e: any) => e.id === auditTarget.id ? {
        ...e,
        eligibilityStatus: passed ? '资格通过' : '资格驳回',
        reviewStatus: passed ? '待分配' : '资格驳回',
        auditNote: reason,
        audits: [audit, ...(e.audits || [])],
      } : e);
      return addLog({ ...d, contestEntries }, '作品审核', `${passed ? '通过' : '驳回'}《${auditTarget.title}》资格审核：${reason || '材料完整'}`, '李敏');
    });
    setAuditTarget(null);
    message.success(passed ? '资格审核已通过，作品进入待分配' : '作品已驳回');
  };

  const batchApprove = () => {
    const ids = selectedWorks.filter((id) => entryOf(String(id))?.eligibilityStatus === '资格待审');
    if (!ids.length) return message.warning('请选择资格待审作品');
    const stamp = contestNow();
    setDb((d: any) => {
      const contestEntries = d.contestEntries.map((e: any) => ids.includes(e.id) ? {
        ...e, eligibilityStatus: '资格通过', reviewStatus: '待分配', auditNote: '批量审核通过',
        audits: [{ t: stamp, who: '李敏', act: '资格审核通过', note: '批量审核通过' }, ...(e.audits || [])],
      } : e);
      return addLog({ ...d, contestEntries }, '作品审核', `批量通过 ${ids.length} 份作品资格审核`, '李敏');
    });
    setSelectedWorks([]);
    message.success(`已通过 ${ids.length} 份作品`);
  };

  const availableExperts = (entry: any) => {
    const competition = competitionOf(entry.competitionId);
    const existing = assignmentOf(entry.id);
    return competitionExperts(entry.competitionId).filter((expert: any) => {
      const load = expertLoad(expert.id) - (existing?.expertId === expert.id ? 1 : 0);
      return expert.status === '可接任务'
        && expert.unit !== entry.school
        && expert.specialties.includes(competition?.category)
        && load < expert.capacity;
    });
  };

  const openExpertAssignment = (entry: any) => {
    if (entry.eligibilityStatus !== '资格通过') return message.info('资格审核通过后才能分配专家');
    const existing = assignmentOf(entry.id);
    if (existing && ['已提交', '已锁定'].includes(existing.status)) return message.info('专家已提交评分，当前分配已锁定');
    setAssignTarget(entry);
    setAssignExpertId(existing?.expertId || '');
  };

  const assignWork = (entryId: string, expertId: string, automatic = false) => {
    const entry = entryOf(entryId);
    const expert = expertOf(expertId);
    if (!entry || entry.eligibilityStatus !== '资格通过') return message.warning('仅资格通过的作品可以分配');
    if (!expert || !availableExperts(entry).some((x: any) => x.id === expert.id)) return message.warning('该专家不满足专业、容量或回避要求');
    const existing = assignmentOf(entryId);
    if (existing && ['已提交', '已锁定'].includes(existing.status)) return message.warning('专家已提交评分，不能直接重新分配');
    const assignment = existing
      ? { ...existing, expertId, status: '已分配', assignedAt: contestNow(), submittedAt: '' }
      : { id: 'assignment-' + Date.now() + '-' + entryId, entryId, expertId, status: '已分配', assignedAt: contestNow(), submittedAt: '' };
    setDb((d: any) => {
      const contestAssignments = existing
        ? patch(d.contestAssignments, existing.id, assignment)
        : [assignment, ...d.contestAssignments];
      const contestEntries = patch(d.contestEntries, entryId, { reviewStatus: '待评分' });
      const contestScores = existing ? d.contestScores.filter((s: any) => s.assignmentId !== existing.id) : d.contestScores;
      return addLog({ ...d, contestAssignments, contestEntries, contestScores }, '评审分配', `${automatic ? '自动' : '手动'}将《${entry.title}》分配给专家${expert.name}`);
    });
    setAssignTarget(null);
    setAssignExpertId('');
    message.success(`已分配给 ${expert.name}；该作品仅保留这一位专家`);
  };

  const autoAssign = (competitionId: string) => {
    const selectedIds = new Set(selectedWorks.map(String));
    const pending = entries.filter((entry: any) => entry.competitionId === competitionId
      && entry.eligibilityStatus === '资格通过'
      && entry.reviewStatus === '待分配'
      && !assignmentOf(entry.id)
      && (!selectedIds.size || selectedIds.has(entry.id)));
    if (!pending.length) return message.info(selectedIds.size ? '所选作品中没有待分配作品' : '当前赛事没有待分配作品');
    const eventExperts = competitionExperts(competitionId);
    if (!eventExperts.length) return message.warning('请先在赛事配置中加入评审专家');
    const loads: Record<string, number> = {};
    eventExperts.forEach((expert: any) => { loads[expert.id] = expertLoad(expert.id, competitionId); });
    const created: any[] = [];
    const assignedEntryIds = new Set<string>();
    const logs: any[] = [];
    pending.forEach((entry: any) => {
      const competition = competitionOf(entry.competitionId);
      const candidates = eventExperts.filter((expert: any) => expert.status === '可接任务'
        && expert.unit !== entry.school
        && expert.specialties.includes(competition?.category)
        && expertLoad(expert.id) + created.filter((item: any) => item.expertId === expert.id).length < expert.capacity)
        .sort((a: any, b: any) => loads[a.id] - loads[b.id]);
      const expert = candidates[0];
      if (!expert) return;
      created.push({ id: 'assignment-' + Date.now() + '-' + entry.id, entryId: entry.id, expertId: expert.id, status: '已分配', assignedAt: contestNow(), submittedAt: '' });
      assignedEntryIds.add(entry.id);
      loads[expert.id] += 1;
      logs.push(contestLog('评审分配', `均衡分配《${entry.title}》给专家${expert.name}`));
    });
    if (!created.length) return message.warning('没有符合专业、容量与回避条件的专家');
    setDb((d: any) => ({
      ...d,
      contestAssignments: [...created, ...d.contestAssignments],
      contestEntries: d.contestEntries.map((entry: any) => assignedEntryIds.has(entry.id) ? { ...entry, reviewStatus: '待评分' } : entry),
      contestLogs: [...logs, ...(d.contestLogs || [])],
    }));
    setSelectedWorks([]);
    message.success(`已将 ${created.length} 份作品平均分配给 ${new Set(created.map((item: any) => item.expertId)).size} 位专家`);
  };

  const saveExpert = () => {
    expertForm.validateFields().then((v: any) => {
      const stamp = Date.now();
      const row = { id: 'expert-' + stamp, reviewToken: `review-${stamp.toString(36)}-${Math.random().toString(36).slice(2, 7)}`, ...v, status: '可接任务' };
      setDb((d: any) => addLog({ ...d, contestExperts: [row, ...d.contestExperts] }, '专家库', `新增专家${row.name}`));
      setExpertOpen(false);
      expertForm.resetFields();
      message.success('专家已加入专家库');
    });
  };

  const openScore = (assignment: any) => {
    const saved = scoreOf(assignment.id);
    setScoreTarget(assignment);
    setScoreDraft({ items: { ...(saved?.items || {}) }, comment: saved?.comment || '' });
  };

  const saveScore = (submit: boolean) => {
    if (!scoreTarget) return;
    const entry = entryOf(scoreTarget.entryId);
    const competition = competitionOf(entry?.competitionId);
    const criteria = competition?.criteria || [];
    if (submit && criteria.some((c: any) => !Number.isFinite(scoreDraft.items[c.key]))) return message.warning('请完成全部评分维度');
    if (submit && !scoreDraft.comment.trim()) return message.warning('请填写专家评语');
    const invalid = criteria.find((c: any) => Number(scoreDraft.items[c.key] || 0) < 0 || Number(scoreDraft.items[c.key] || 0) > c.max);
    if (invalid) return message.warning(`${invalid.name}应在 0-${invalid.max} 分之间`);
    const total = criteria.reduce((sum: number, c: any) => sum + Number(scoreDraft.items[c.key] || 0), 0);
    const existing = scoreOf(scoreTarget.id);
    const score = {
      id: existing?.id || 'score-' + Date.now(), assignmentId: scoreTarget.id,
      status: submit ? '已提交' : '暂存', items: { ...scoreDraft.items }, total,
      comment: scoreDraft.comment.trim(), updatedAt: contestNow(),
    };
    setDb((d: any) => {
      const contestScores = existing ? patch(d.contestScores, existing.id, score) : [score, ...d.contestScores];
      const contestAssignments = patch(d.contestAssignments, scoreTarget.id, { status: submit ? '已提交' : '评分中', submittedAt: submit ? contestNow() : '' });
      const contestEntries = patch(d.contestEntries, scoreTarget.entryId, { reviewStatus: submit ? '待复核' : '评分中' });
      return addLog({ ...d, contestScores, contestAssignments, contestEntries }, '专家评分', `${submit ? '提交' : '暂存'}《${entry.title}》评分${submit ? ` ${total} 分` : ''}`, expertOf(scoreTarget.expertId)?.name || '专家');
    });
    setScoreTarget(null);
    message.success(submit ? '评分已提交，等待复核' : '评分草稿已保存');
  };

  const reviewScore = () => {
    if (!reviewTarget) return;
    if (!reviewNote.trim()) return message.warning('请填写复核意见');
    if (reviewAction === 'confirm' && !reviewAward) return message.warning('请选择奖项结果');
    const assignment = assignmentOf(reviewTarget.id);
    const score = assignment && scoreOf(assignment.id);
    if (!assignment || !score) return message.warning('评分记录不存在');
    const confirmed = reviewAction === 'confirm';
    setDb((d: any) => {
      const contestEntries = patch(d.contestEntries, reviewTarget.id, {
        reviewStatus: confirmed ? '结果确定' : '评分中',
        award: confirmed && reviewAward !== '无奖项' ? reviewAward : '',
        reviewNote,
      });
      const contestAssignments = patch(d.contestAssignments, assignment.id, { status: confirmed ? '已锁定' : '已退回' });
      const contestScores = patch(d.contestScores, score.id, { status: confirmed ? '已锁定' : '暂存', reviewNote });
      return addLog({ ...d, contestEntries, contestAssignments, contestScores }, '评分复核', `${confirmed ? '确认' : '退回'}《${reviewTarget.title}》评分：${reviewNote}`, '复核员-李敏');
    });
    setReviewTarget(null);
    setReviewNote('');
    setReviewAction('confirm');
    setReviewAward('无奖项');
    message.success(confirmed ? '评分已锁定，作品结果已确定' : '已退回原专家重新评分');
  };

  const publishResults = (competition: any) => {
    if (!competition) return message.warning('请选择赛事');
    if (competition.status === '结果已发布') return message.info('结果已经公布');
    const pending = entries.filter((e: any) => e.competitionId === competition.id && e.eligibilityStatus === '资格待审');
    if (pending.length) return message.warning(`还有 ${pending.length} 份作品资格待审，请先审核后发布`);
    const qualified = entries.filter((e: any) => e.competitionId === competition.id && e.eligibilityStatus === '资格通过');
    if (!qualified.length) return message.warning('当前赛事没有资格通过的作品');
    if (qualified.some((e: any) => e.reviewStatus !== '结果确定')) return message.warning('仍有作品未完成评分复核，不能发布结果');
    Modal.confirm({
      title: '确认发布赛事结果？',
      content: '发布后家长端可查看最终结果。本原型仅模拟发布状态。',
      okText: '确认发布',
      onOk: () => {
        setDb((d: any) => {
          const competitions = patch(d.competitions, competition.id, { status: '结果已发布' });
          const contestEntries = d.contestEntries.map((e: any) => e.competitionId === competition.id && e.reviewStatus === '结果确定' ? { ...e, resultPublished: true } : e);
          return addLog({ ...d, competitions, contestEntries }, '结果发布', `发布赛事《${competition.name}》评审结果`, '发布员-张运营');
        });
        message.success('赛事结果已发布（演示状态）');
      },
    });
  };

  const workRows = entries.map((entry: any) => ({ ...entry, competitionName: competitionOf(entry.competitionId)?.name || '—' }));
  const assignmentRows = entries.filter((e: any) => e.eligibilityStatus === '资格通过').map((entry: any) => {
    const assignment = assignmentOf(entry.id);
    return { ...entry, assignment, expert: assignment ? expertOf(assignment.expertId) : null };
  });
  const expertAssignments = assignments.filter((a: any) => a.expertId === scoreExpertId).map((assignment: any) => {
    const entry = entryOf(assignment.entryId);
    const score = scoreOf(assignment.id);
    return { ...assignment, entry, score, competition: competitionOf(entry?.competitionId) };
  });
  const resultRows = entries.filter((e: any) => e.competitionId === resultCompetitionId).map((entry: any) => {
    const assignment = assignmentOf(entry.id);
    const score = assignment ? scoreOf(assignment.id) : null;
    return { ...entry, assignment, expert: assignment ? expertOf(assignment.expertId) : null, score };
  }).filter((e: any) => e.score).sort((a: any, b: any) => b.score.total - a.score.total).map((e: any, index: number) => ({ ...e, rank: index + 1 }));
  const activeCompetition = competitionOf(activeCompetitionId);
  const activeWorkRows = activeCompetition ? entries.filter((entry: any) => entry.competitionId === activeCompetition.id).map((entry: any) => {
    const assignment = assignmentOf(entry.id);
    return { ...entry, assignment, expert: assignment ? expertOf(assignment.expertId) : null };
  }) : [];
  const activeExperts = activeCompetition ? competitionExperts(activeCompetition.id) : [];
  const worksPage = activeCompetition && (
    <div>
      <Button type="text" icon={<ArrowLeftOutlined />} style={{ marginBottom: 8, paddingInline: 0 }} onClick={() => { setActiveCompetitionId(''); setSelectedWorks([]); }}>返回赛事列表</Button>
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={4}>
              <Space wrap><h2 style={{ margin: 0, fontSize: 20 }}>{activeCompetition.name}</h2><S v={activeCompetition.status} /></Space>
              <span style={{ color: '#666' }}>{activeCompetition.category} · 评审截止 {activeCompetition.reviewEnd} · 共 {activeWorkRows.length} 份参赛作品</span>
            </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: screens.lg ? 'right' : 'left' }}>
            <Space wrap>
              <Button icon={<LinkOutlined />} onClick={() => setReviewLinkCompetition(activeCompetition)}>专家评审链接</Button>
              <Button type="primary" onClick={() => autoAssign(activeCompetition.id)}>一键平均分配</Button>
            </Space>
          </Col>
        </Row>
      </Card>
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {[
          ['作品总数', activeWorkRows.length],
          ['资格待审', activeWorkRows.filter((entry: any) => entry.eligibilityStatus === '资格待审').length],
          ['待分配', activeWorkRows.filter((entry: any) => entry.reviewStatus === '待分配').length],
          ['评审进行中', activeWorkRows.filter((entry: any) => ['待评分', '评分中', '待复核'].includes(entry.reviewStatus)).length],
        ].map(([title, value], index) => <Col xs={12} lg={6} key={String(title)}><Card size="small" style={statCardStyle(index)}><Statistic title={title} value={value} /></Card></Col>)}
      </Row>
      <Card size="small" title={`本赛事专家（${activeExperts.length} 人）`} extra={<Space><Button type="link" onClick={() => { setExpertManageCompetition(activeCompetition); setExpertToAdd(''); }}>配置专家</Button><Button type="link" icon={<LinkOutlined />} onClick={() => setReviewLinkCompetition(activeCompetition)}>生成评审链接</Button></Space>} style={{ marginBottom: 12 }}>
        <Row gutter={[12, 12]}>
          {activeExperts.map((expert: any) => <Col xs={24} md={12} xl={8} key={expert.id}>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Space><Avatar style={{ background: '#1677ff' }}>{expert.name.slice(0, 1)}</Avatar><span><b>{expert.name}</b><div style={{ color: '#777', fontSize: 12 }}>{expertLoad(expert.id, activeCompetition.id)} 项任务 · 容量 {expert.capacity}</div></span></Space>
              <S v={expert.status} />
            </div>
          </Col>)}
          {!activeExperts.length && <Col span={24}><Alert type="warning" showIcon message="尚未为本赛事添加专家，请点击“配置专家”添加。" /></Col>}
        </Row>
      </Card>
      <Card size="small" title="全部学生参赛作品" extra={<Space wrap><span style={{ color: '#777' }}>{selectedWorks.length ? `已选 ${selectedWorks.length} 份待分配作品` : '可勾选待分配作品'}</span><Button disabled={!selectedWorks.length} type="primary" onClick={() => autoAssign(activeCompetition.id)}>平均分配所选</Button></Space>}>
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message="一键平均分配会在本赛事专家中按当前任务量均衡分配；也可在每份作品后单独指定或调整专家。" />
        <Tbl {...tblProps} rowSelection={{ selectedRowKeys: selectedWorks, onChange: setSelectedWorks, getCheckboxProps: (row: any) => ({ disabled: row.reviewStatus !== '待分配' || row.eligibilityStatus !== '资格通过' }) }} dataSource={activeWorkRows} columns={[
          { title: '作品', dataIndex: 'title', width: 205, render: (value: string, row: any) => <span><b>{value}</b><div style={{ color: '#888', fontSize: 12 }}>{row.teamType} · {row.assets.length} 项材料</div></span> },
          { title: '学生', width: 115, render: (_: any, row: any) => <span>{row.studentName}<div style={{ color: '#888', fontSize: 12 }}>{row.grade}</div></span> },
          { title: '学校', dataIndex: 'school', width: 190, ellipsis: true },
          { title: '资格状态', dataIndex: 'eligibilityStatus', width: 100, render: (value: string) => <S v={value} /> },
          { title: '评审状态', dataIndex: 'reviewStatus', width: 100, render: (value: string) => <S v={value} /> },
          { title: '分配专家', width: 165, render: (_: any, row: any) => {
            const locked = row.assignment && ['已提交', '已锁定'].includes(row.assignment.status);
            if (row.eligibilityStatus !== '资格通过') return <span style={{ color: '#999' }}>资格通过后可分配</span>;
            if (!row.assignment) return <Button type="primary" size="small" onClick={() => openExpertAssignment(row)}>分配专家</Button>;
            return <Space direction="vertical" size={2}>
              <Space size={6}><Avatar size={22} style={{ background: '#1677ff' }}>{row.expert?.name?.slice(0, 1) || '专'}</Avatar><b>{row.expert?.name || '专家已移除'}</b></Space>
              {locked ? <span style={{ color: '#999', fontSize: 12 }}>评分已提交 · 不可更换</span> : <Button type="link" size="small" style={{ height: 24, padding: 0 }} onClick={() => openExpertAssignment(row)}>更换专家</Button>}
            </Space>;
          } },
          { title: '操作', fixed: 'right', width: 100, render: (_: any, row: any) => {
            return <Space><a onClick={() => setWorkDetail(row)}>查看详情</a>{['资格待审', '资格驳回'].includes(row.eligibilityStatus) && <a onClick={() => setAuditTarget(row)}>资格审核</a>}</Space>;
          } },
        ]} />
      </Card>
    </div>
  );

  const eventTab = (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {[
          ['赛事总数', competitions.length], ['报名中', competitions.filter((c: any) => contestStore.phaseOf(c) === 'open').length],
          ['待审核作品', entries.filter((e: any) => e.eligibilityStatus === '资格待审').length], ['待复核评分', entries.filter((e: any) => e.reviewStatus === '待复核').length],
        ].map(([title, value], index) => <Col xs={12} lg={6} key={String(title)}><Card size="small" style={statCardStyle(index)}><Statistic title={title} value={value} /></Card></Col>)}
      </Row>
      <Alert showIcon type="info" style={{ marginBottom: 12 }} message="演示说明：状态由后台选择，日期仅作展示。列表内“状态演示”样例覆盖各阶段，可直接查看作品、打开专家链接或预览家长端。" />
      <Card size="small" title="赛事配置" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openEvent()}>创建赛事</Button>}>
        <Tbl {...tblProps} dataSource={competitions} columns={[
          { title: '赛事名称', dataIndex: 'name', width: 290 }, { title: '分类', dataIndex: 'category', render: (v: string) => <Tag color="cyan">{v}</Tag> },
          { title: '报名时间', render: (_: any, r: any) => `${r.signupStart} ~ ${r.signupEnd}` }, { title: '评审截止', dataIndex: 'reviewEnd' },
          { title: '参赛作品', render: (_: any, r: any) => <a onClick={() => { setActiveCompetitionId(r.id); setSelectedWorks([]); }}><b>{entries.filter((e: any) => e.competitionId === r.id).length} 份作品</b></a> },
          { title: '赛事专家', render: (_: any, r: any) => <a onClick={() => { setExpertManageCompetition(r); setExpertToAdd(''); }}>{competitionExperts(r.id).length} 位专家</a> },
          { title: '状态', dataIndex: 'status', filters: ['草稿', '未开始', '报名中', '报名结束', '评审中', '结果已发布', '已归档'].map((s) => ({ text: s, value: s })), onFilter: (value: any, row: any) => contestStore.phaseOf(row) === contestStore.phaseOf({ status: value }), render: (v: string) => <S v={v === '征集中' ? '报名中' : v === '征集截止' ? '报名结束' : v} /> },
          { title: '前端预览', width: 110, render: (_: any, r: any) => <Button type="link" icon={<EyeOutlined />} onClick={() => setPreviewCompetition(r)}>预览</Button> },
          { title: '操作', width: 410, render: (_: any, r: any) => <Space wrap><a onClick={() => { setActiveCompetitionId(r.id); setSelectedWorks([]); }}>参赛作品</a><a onClick={() => { setExpertManageCompetition(r); setExpertToAdd(''); }}>配置专家</a><a onClick={() => openReviewRules(r)}>评审规则</a><a onClick={() => setReviewLinkCompetition(r)}>评审链接</a><a onClick={() => openEvent(r)}>编辑赛事</a><a onClick={() => { setResultCompetitionId(r.id); setTab('results'); }}>查看结果</a></Space> },
        ]} />
      </Card>
    </div>
  );

  const worksTab = (
    <Card size="small" title="报名与作品库" extra={<Button disabled={!selectedWorks.length} onClick={batchApprove}>批量通过资格</Button>}>
      <Alert type="info" showIcon style={{ marginBottom: 12 }} message="家长端上传在本原型中仅保存文件名、大小和缩略图；正式环境须接入私有对象存储与病毒扫描。" />
      <Tbl {...tblProps} rowSelection={{ selectedRowKeys: selectedWorks, onChange: setSelectedWorks, getCheckboxProps: (r: any) => ({ disabled: r.eligibilityStatus !== '资格待审' }) }} dataSource={workRows} columns={[
        { title: '作品', dataIndex: 'title', width: 220 }, { title: '学生', render: (_: any, r: any) => <span>{r.studentName}<div style={{ color: '#999', fontSize: 12 }}>{r.grade}</div></span> },
        { title: '学校', dataIndex: 'school', width: 220, ellipsis: true }, { title: '赛事', dataIndex: 'competitionName', width: 260, ellipsis: true },
        { title: '材料', render: (_: any, r: any) => `${r.assets.length} 项` }, { title: '提交时间', dataIndex: 'submittedAt' },
        { title: '资格状态', dataIndex: 'eligibilityStatus', render: (v: string) => <S v={v} /> }, { title: '评审状态', dataIndex: 'reviewStatus', render: (v: string) => <S v={v} /> },
        { title: '操作', fixed: 'right', render: (_: any, r: any) => <Space><a onClick={() => setWorkDetail(r)}>详情</a>{['资格待审', '资格驳回'].includes(r.eligibilityStatus) && <a onClick={() => setAuditTarget(r)}>审核</a>}</Space> },
      ]} />
    </Card>
  );

  const expertsTab = (
    <Card size="small" title="专家库" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setExpertOpen(true)}>新增专家</Button>}>
      <Tbl {...tblProps} dataSource={experts} columns={[
        { title: '专家', render: (_: any, r: any) => <Space><Avatar>{r.name.slice(0, 1)}</Avatar><span>{r.name}<div style={{ color: '#999', fontSize: 12 }}>{r.phone}</div></span></Space> },
        { title: '所属单位', dataIndex: 'unit', width: 260, ellipsis: true }, { title: '专业方向', dataIndex: 'specialties', render: (v: string[]) => v.map((x) => <Tag key={x}>{x}</Tag>) },
        { title: '任务量', render: (_: any, r: any) => <span>{expertLoad(r.id)} / {r.capacity}</span> }, { title: '状态', dataIndex: 'status', render: (v: string) => <S v={v} /> },
        { title: '操作', render: (_: any, r: any) => <a onClick={() => setDb((d: any) => addLog({ ...d, contestExperts: patch(d.contestExperts, r.id, { status: r.status === '可接任务' ? '暂停接单' : '可接任务' }) }, '专家库', `${r.status === '可接任务' ? '暂停' : '启用'}专家${r.name}`))}>{r.status === '可接任务' ? '暂停接单' : '恢复接单'}</a> },
      ]} />
    </Card>
  );

  const assignmentsTab = (
    <Card size="small" title="评审分配" extra={<Button type="primary" onClick={autoAssign}>自动补齐待分配作品</Button>}>
      <Alert type="success" showIcon style={{ marginBottom: 12 }} message="当前规则：一份作品固定一位专家。系统按专业匹配、任务容量和同校回避进行分配，不计算多人平均分。" />
      <Tbl {...tblProps} dataSource={assignmentRows} columns={[
        { title: '作品', dataIndex: 'title', width: 240 }, { title: '赛事', render: (_: any, r: any) => competitionOf(r.competitionId)?.name },
        { title: '学校', dataIndex: 'school', ellipsis: true }, { title: '专家', render: (_: any, r: any) => r.expert ? <span>{r.expert.name}<div style={{ color: '#999', fontSize: 12 }}>{r.expert.unit}</div></span> : <Tag color="orange">待分配</Tag> },
        { title: '任务状态', render: (_: any, r: any) => r.assignment ? <S v={r.assignment.status} /> : <S v="待分配" /> },
        { title: '操作', render: (_: any, r: any) => {
          const locked = r.assignment && ['已提交', '已锁定'].includes(r.assignment.status);
          return locked ? <span style={{ color: '#999' }}>评分提交后不可更换</span> : <Button type={r.assignment ? 'link' : 'primary'} size="small" onClick={() => openExpertAssignment(r)}>{r.assignment ? '更换专家' : '分配专家'}</Button>;
        } },
      ]} />
    </Card>
  );

  const scoringTab = (
    <Card size="small" title="专家评分台" extra={<Select style={{ width: 220 }} value={scoreExpertId} onChange={setScoreExpertId} options={experts.map((x: any) => ({ value: x.id, label: `${x.name} · ${expertLoad(x.id)} 项任务` }))} />}>
      <Alert type="info" showIcon style={{ marginBottom: 12 }} message="演示模式下可切换专家身份。正式环境中专家只能通过本人账号查看分配给自己的脱敏作品。" />
      <Tbl {...tblProps} dataSource={expertAssignments} columns={[
        { title: '作品', render: (_: any, r: any) => r.entry?.title || '—' }, { title: '赛事', render: (_: any, r: any) => r.competition?.name || '—' },
        { title: '学生', render: (_: any, r: any) => r.entry?.studentName || '—' }, { title: '分配时间', dataIndex: 'assignedAt' },
        { title: '任务状态', dataIndex: 'status', render: (v: string) => <S v={v} /> }, { title: '当前得分', render: (_: any, r: any) => r.score ? `${r.score.total} 分` : '—' },
        { title: '操作', render: (_: any, r: any) => ['已提交', '已锁定'].includes(r.status) ? <a onClick={() => openScore(r)}>查看评分</a> : <a onClick={() => openScore(r)}>{r.score ? '继续评分' : '开始评分'}</a> },
      ]} />
    </Card>
  );

  const resultsTab = (
    <Card size="small" title="评分复核与结果发布" extra={<Space><Select style={{ width: 280 }} value={resultCompetitionId} onChange={setResultCompetitionId} options={competitions.map((c: any) => ({ value: c.id, label: c.name }))} /><Button type="primary" onClick={() => publishResults(competitionOf(resultCompetitionId))}>发布结果</Button></Space>}>
      <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="单专家评分即该作品最终分。复核员只检查评分完整性与违规情况，可退回原专家重评，不重新打分。" />
      <Tbl {...tblProps} dataSource={resultRows} columns={[
        { title: '排名', dataIndex: 'rank', render: (v: number) => <b>#{v}</b> }, { title: '作品', dataIndex: 'title', width: 240 },
        { title: '学生', dataIndex: 'studentName' }, { title: '专家', render: (_: any, r: any) => r.expert?.name || '—' },
        { title: '专家评分', render: (_: any, r: any) => <b style={{ color: '#1677ff' }}>{r.score.total} 分</b> },
        { title: '复核状态', dataIndex: 'reviewStatus', render: (v: string) => <S v={v} /> }, { title: '奖项', dataIndex: 'award', render: (v: string) => v ? <Tag color="gold">{v}</Tag> : '—' },
        { title: '发布', render: (_: any, r: any) => r.resultPublished ? <Tag color="green">已发布</Tag> : '未发布' },
        { title: '操作', render: (_: any, r: any) => r.reviewStatus === '待复核' ? <a onClick={() => setReviewTarget(r)}>复核</a> : <a onClick={() => setWorkDetail(r)}>查看</a> },
      ]} />
    </Card>
  );

  const logsTab = (
    <Card size="small" title="赛事操作日志">
      <Tbl {...tblProps} dataSource={db.contestLogs || []} columns={[
        { title: '操作时间', dataIndex: 't' }, { title: '操作人', dataIndex: 'who' }, { title: '模块', dataIndex: 'mod', render: (v: string) => <Tag>{v}</Tag> },
        { title: '操作内容', dataIndex: 'act' }, { title: '结果', dataIndex: 'ret', render: (v: string) => <Tag color="green">{v}</Tag> },
      ]} />
    </Card>
  );

  const pendingCount = entries.filter((e: any) => e.eligibilityStatus === '资格待审').length;
  const unassignedCount = entries.filter((e: any) => e.reviewStatus === '待分配').length;
  const reviewCount = entries.filter((e: any) => e.reviewStatus === '待复核').length;
  return (
    <div>
      {worksPage || <>
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message="赛事评审演示中心" description="从赛事列表进入参赛作品页，可统一均衡分配或单独指定专家；专家通过专属链接免登录评审。" />
        <Tabs activeKey={tab} onChange={setTab} items={[
          { key: 'events', label: '赛事列表', children: eventTab },
          { key: 'experts', label: '专家库', children: expertsTab },
          { key: 'results', label: <Badge count={reviewCount} size="small" offset={[8, -2]}>复核与发布</Badge>, children: resultsTab },
          { key: 'logs', label: '赛事日志', children: logsTab },
        ]} />
      </>}

      <Modal open={eventOpen} width={920} title={eventEdit ? '编辑赛事' : '创建赛事'} okText={uploadPending ? '文件处理中…' : '保存赛事'} confirmLoading={uploadPending > 0} cancelButtonProps={{ disabled: uploadPending > 0 }} closable={!uploadPending} maskClosable={false} cancelText="取消" onCancel={() => { if (!uploadCount.current) setEventOpen(false); }} onOk={saveEvent} destroyOnClose>
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message="赛事展示与报名字段已和家长端保持一致；评分维度请在赛事列表的“评审规则”中单独维护。" />
        {!!eventErrors.length && <div role="alert" tabIndex={-1} ref={eventErrorRef} style={{ marginBottom: 12, padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8 }}><b>还有 {eventErrors.length} 项需要填写或修正</b><Space wrap>{eventErrors.map((error: any) => <Button key={error.name.join('.')} type="link" danger onClick={() => focusEventField(error.name)}>{error.errors[0]}</Button>)}</Space></div>}
        <div style={{ maxHeight: '66vh', overflowY: 'auto', paddingRight: 8 }}>
          <Form form={eventForm} layout="vertical" validateMessages={{ required: '请填写${label}' }}>
            <Tabs activeKey={eventTabKey} onChange={setEventTabKey} items={[
              { key: 'basic', forceRender: true, label: '基础信息', children: <Row gutter={12}>
                <Col span={16}><Form.Item name="name" label="赛事名称" rules={[{ required: true, message: '请输入赛事名称' }]}><Input /></Form.Item></Col>
                <Col span={8}><Form.Item name="category" label="赛事分类" rules={[{ required: true }]}><Select options={['创新实践', '人工智能', '机器人', '无人机'].map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
                <Col span={24}><Form.Item name="desc" label="列表简介" rules={[{ required: true, message: '请输入列表简介' }]}><TextArea rows={2} showCount maxLength={120} /></Form.Item></Col>
                <Col span={12}><Form.Item name="organizer" label="主办单位" rules={[{ required: true }]}><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="audience" label="参赛对象" rules={[{ required: true }]}><Input placeholder="如：全区中小学生" /></Form.Item></Col>
                {['signupStart', 'signupEnd', 'reviewEnd'].map((name, i) => <Col span={8} key={name}><Form.Item name={name} label={['报名开始', '报名截止', '评审截止'][i]} rules={[{ required: true, message: '请选择日期' }]} getValueProps={(value: any) => ({ value: value ? (window as any).dayjs(value) : null })} getValueFromEvent={(_: any, date: string) => date}><DatePicker style={{ width: '100%' }} placeholder="选择日期" /></Form.Item></Col>)}
                <Col span={8}><Form.Item name="gradeMin" label="最低年级" rules={[{ required: true }]}><InputNumber min={1} max={12} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="gradeMax" label="最高年级" rules={[{ required: true }]}><InputNumber min={1} max={12} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="schoolKeywords" label="学校范围关键词" tooltip="多个关键词用顿号分隔；留空表示不限制学校"><Input placeholder="如：天府新区、成都" /></Form.Item></Col>
                <Col span={8}><Form.Item name="teamForm" label="参赛形式" rules={[{ required: true }]}><Select options={['个人', '团队', '个人 / 团队'].map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
                <Col span={8}><Form.Item name="fee" label="报名费用" extra="Demo 不包含赛事支付流程" rules={[{ required: true }]}><Select options={[{ value: '免费', label: '免费' }]} /></Form.Item></Col>
                <Col span={8}><Form.Item name="status" label="赛事状态" extra="演示以此状态为准，不按日期自动切换" rules={[{ required: true }]}><Select options={['草稿', '未开始', '报名中', '报名结束', '评审中', '结果已发布', '已归档'].map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
                <Col span={24}><Form.Item name="requiresEligibilityReview" label="作品资格审核" extra="无需审核时，新提交作品将直接进入专家分配；已有作品状态不变"><Radio.Group options={[{ value: true, label: '需要审核' }, { value: false, label: '无需审核' }]} /></Form.Item></Col>
                <Col span={16}>
                  <Form.Item label="列表封面" required extra="建议 16:9，支持 JPG、PNG、WebP，单张不超过 10 MB；用于家长端赛事列表卡片。">
                    <Upload accept="image/*" maxCount={1} showUploadList={false} beforeUpload={addListCover}><Button icon={<PlusOutlined />}>{coverDraft ? '更换列表封面' : '上传列表封面'}</Button></Upload>
                    {coverDraft && <div style={{ position: 'relative', marginTop: 10, width: 320, maxWidth: '100%' }}><img src={adminCoverUrl(coverDraft)} alt="赛事列表封面预览" style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8, background: '#f0f2f5' }} /><Button danger size="small" onClick={() => setCoverDraft('')} style={{ position: 'absolute', right: 6, top: 6 }}>移除</Button></div>}
                  </Form.Item>
                </Col>
              </Row> },
              { key: 'content', forceRender: true, label: '前端展示内容', children: <Row gutter={12}>
                <Col span={24}><Form.Item name="introText" label="赛事详情介绍" extra="每行作为一个介绍段落"><TextArea rows={4} placeholder="输入赛事背景、目标和评审关注点，每段一行" /></Form.Item></Col>
                <Col span={24}><Divider orientation="left">赛程安排</Divider><Form.List name="schedule">{(fields, { add, remove, move }) => <>
                  {fields.map(({ key, name }, index) => <Card key={key} size="small" style={{ marginBottom: 8 }} title={`节点 ${index + 1}`} extra={<Space><Button disabled={!index} onClick={() => move(index, index - 1)}>上移</Button><Button danger onClick={() => remove(name)}>删除</Button></Space>}><Row gutter={12}>
                    <Col span={8}><Form.Item name={[name, 'title']} label="阶段名称" rules={[{ required: true, whitespace: true, message: '填写阶段名称' }]}><Input /></Form.Item></Col>
                    <Col span={16}><Form.Item name={[name, 'date']} label="展示时间" rules={[{ required: true, message: '填写展示时间' }]}><Input placeholder="如：2026-09-01 ~ 2026-09-30" /></Form.Item></Col>
                    <Col span={24}><Form.Item name={[name, 'desc']} label="阶段说明"><Input /></Form.Item></Col>
                  </Row></Card>)}<Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ title: '', date: '', desc: '' })}>新增赛程节点</Button>
                </>}</Form.List></Col>
                <Col span={24}><Divider orientation="left">奖项设置</Divider><Alert type="info" message="图标会显示在家长端；奖项名称同步用于结果复核，名额仅作展示说明。" style={{ marginBottom: 12 }} /><Form.List name="awards">{(fields, { add, remove }) => <>
                  {fields.map(({ key, name }) => <Row key={key} gutter={8} align="middle">
                    <Col span={7}><Form.Item name={[name, 'name']} label="奖项名称" rules={[{ required: true, whitespace: true, message: '填写奖项名称' }]}><Input placeholder="如：金奖" /></Form.Item></Col>
                    <Col span={5}><Form.Item name={[name, 'icon']} label="图标"><Select options={[{ value: 'trophy', label: '奖杯' }, { value: 'award', label: '奖章' }, { value: 'star', label: '星星' }]} /></Form.Item></Col>
                    <Col span={9}><Form.Item name={[name, 'quota']} label="名额 / 组别说明"><Input placeholder="如：小学组 3 名" /></Form.Item></Col>
                    <Col span={3}><Button danger onClick={() => remove(name)}>删除</Button></Col>
                  </Row>)}<Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ name: '', icon: 'trophy', quota: '' })}>新增奖项</Button>
                </>}</Form.List></Col>
                <Col span={24}>
                  <Form.Item label="展示图集" extra="支持 JPG、PNG、WebP，单张不超过 10 MB，最多 9 张；上传后可逐张填写前端展示说明。">
                    <Upload accept="image/*" multiple showUploadList={false} beforeUpload={addGalleryImage}>
                      <Button icon={<PlusOutlined />} disabled={galleryDraft.length >= 9}>上传展示图片（{galleryDraft.length}/9）</Button>
                    </Upload>
                    {galleryDraft.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
                      {galleryDraft.map((item, index) => <Card key={item.uid || `${item.img}-${index}`} size="small" styles={{ body: { padding: 10 } }}>
                        <img src={adminMediaUrl(item.img)} alt={item.caption || item.name || `展示图 ${index + 1}`} style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 6, marginBottom: 8, background: '#f0f2f5' }} />
                        <Input value={item.caption} aria-label={`第 ${index + 1} 张图片说明`} placeholder="填写图片说明" onChange={(event: any) => setGalleryDraft((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, caption: event.target.value } : row))} />
                        <Upload accept="image/*" disabled={uploadPending > 0} showUploadList={false} beforeUpload={(file: any) => replaceGalleryImage(file, item.uid)}><Button type="link" disabled={uploadPending > 0}>替换图片</Button></Upload>
                        <Button danger type="link" block disabled={uploadPending > 0} style={{ marginTop: 4, minHeight: 36 }} onClick={() => { gallerySlots.current -= 1; setGalleryDraft((rows) => rows.filter((_, rowIndex) => rowIndex !== index)); }}>移除图片</Button>
                      </Card>)}
                    </div>}
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="赛事附件" extra="单个不超过 50 MB；同名文件替换。仅保存在本浏览器，未上传服务器；内置附件下载为演示文本。">
                    <Upload multiple showUploadList={false} beforeUpload={addAttachment}>
                      <Button icon={<PlusOutlined />}>上传赛事附件</Button>
                    </Upload>
                    {attachmentDraft.length > 0 && <List style={{ marginTop: 12 }} bordered size="small" dataSource={attachmentDraft} renderItem={(item: any, index: number) => <List.Item actions={[<Button key="download" type="link" onClick={() => (window as any).FutureEduContestMedia.download(item).catch((error: any) => message.error(error.message))}>下载预览</Button>, <Button key="remove" danger type="link" style={{ minHeight: 36 }} onClick={() => setAttachmentDraft((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>移除</Button>]}><List.Item.Meta title={item.name} description={`${item.kind || '文件'} · ${item.size || '大小未知'} · ${item.mediaKey ? '本地文件' : '演示素材'}`} /></List.Item>} />}
                  </Form.Item>
                </Col>
                <Col span={24}><Divider orientation="left">赛事宣传片</Divider></Col>
                <Col span={12}>
                  <Form.Item label="宣传片视频" extra="文件不超过 500 MB。仅保存到本浏览器，未上传服务器；换设备后需重新选择。">
                    <Upload accept="video/*" maxCount={1} showUploadList={false} beforeUpload={addVideo}><Button icon={<PlusOutlined />}>{videoDraft ? '重新上传视频' : '上传宣传片'}</Button></Upload>
                    {videoDraft && <Card size="small" style={{ marginTop: 10 }}><Space style={{ width: '100%', justifyContent: 'space-between' }}><span><b>{videoDraft.name}</b><div style={{ color: '#8a919f', fontSize: 12 }}>{videoDraft.size || '大小未知'}</div></span><Button danger type="link" onClick={() => setVideoDraft(null)}>移除</Button></Space></Card>}
                    {videoPreviewUrl && <video src={videoPreviewUrl} poster={adminMediaUrl(videoPosterDraft)} controls style={{ width: '100%', marginTop: 8 }} />}
                    <Button type="link" onClick={() => { setVideoDraft({ demo: true, name: '内置演示素材' }); setVideoPosterDraft('assets/images/contests/hero-banner.webp'); eventForm.setFieldsValue({ videoTitle: '赛事宣传片 · 演示素材', videoDuration: '演示动画' }); }}>使用内置演示素材</Button>
                    <Button type="link" danger onClick={() => { setVideoDraft(null); setVideoPosterDraft(''); eventForm.setFieldsValue({ videoTitle: '', videoDuration: '' }); }}>移除整个宣传片</Button>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="宣传片封面" extra="建议 16:9，支持 JPG、PNG、WebP，单张不超过 10 MB。">
                    <Upload accept="image/*" maxCount={1} showUploadList={false} beforeUpload={addVideoPoster}><Button icon={<PlusOutlined />}>{videoPosterDraft ? '更换封面' : '上传封面'}</Button></Upload>
                    {videoPosterDraft && <div style={{ position: 'relative', marginTop: 10, width: 240 }}><img src={adminMediaUrl(videoPosterDraft)} alt="宣传片封面预览" style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8, background: '#f0f2f5' }} /><Button danger size="small" onClick={() => setVideoPosterDraft('')} style={{ position: 'absolute', right: 6, top: 6 }}>移除</Button></div>}
                  </Form.Item>
                </Col>
                <Col span={18}><Form.Item name="videoTitle" label="宣传片标题"><Input placeholder="如：赛事官方宣传片" /></Form.Item></Col>
                <Col span={6}><Form.Item name="videoDuration" label="视频时长"><Input placeholder="02:18" /></Form.Item></Col>
              </Row> },
              { key: 'material', forceRender: true, label: '报名与材料', children: <Row gutter={12}>
                <Col span={24}><Form.Item name="materialRule" label="作品与材料规则" rules={[{ required: true, message: '请输入作品与材料规则' }]}><TextArea rows={3} /></Form.Item></Col>
                <Col span={6}><Form.Item name="imageMax" label="图片上限" rules={[{ required: true }]}><InputNumber min={0} max={30} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name="videoMax" label="视频上限" rules={[{ required: true }]}><InputNumber min={0} max={10} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name="fileMax" label="附件上限" rules={[{ required: true }]}><InputNumber min={0} max={30} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={18}><Form.Item name="allowedFileExtensions" label="允许的附件类型" rules={[{ required: true, message: '至少选择一种文件类型' }]}><Select mode="multiple" options={['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', '7z', 'txt'].map((x) => ({ value: x, label: x.toUpperCase() }))} /></Form.Item></Col>
                <Col span={24}><Form.Item name="requiredFiles" label="必交文件名关键词" tooltip="多个关键词用顿号分隔；例如安全承诺书"><Input placeholder="选填，如：安全承诺书" /></Form.Item></Col>
              </Row> },
            ]} />
          </Form>
        </div>
      </Modal>

      <Modal open={!!previewCompetition} title={`家长端预览：${previewCompetition?.name || ''}`} width={440} footer={null} onCancel={() => setPreviewCompetition(null)} destroyOnClose>
        <Alert type="info" showIcon message="预览已保存内容；草稿和归档仅在此预览中可见。" style={{ marginBottom: 8 }} />
        {previewCompetition && <iframe title="家长端赛事预览" src={`../index.html?contestPreview=1#/contest/${encodeURIComponent(previewCompetition.id)}`} style={{ width: '100%', height: '65vh', border: '1px solid #eee', borderRadius: 12 }} />}
      </Modal>

      <Modal open={!!ruleCompetition} width={720} title={`评审规则：${ruleCompetition?.name || ''}`} okText="保存评审规则" cancelText="取消" onCancel={() => setRuleCompetition(null)} onOk={saveReviewRules} destroyOnClose>
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="评分维度总分必须为 100 分" description="评审已开始后修改维度会影响后续评分，请确认规则已同步给所有赛事专家。已提交的历史评分不会自动重算。" />
        <Form form={ruleForm} layout="vertical">
          <Form.List name="criteria">
            {(fields, { add, remove }) => <>
              {fields.map((field, index) => <Row gutter={12} align="middle" key={field.key}>
                <Form.Item name={[field.name, 'key']} hidden><Input /></Form.Item>
                <Col span={15}><Form.Item name={[field.name, 'name']} label={index === 0 ? '评分维度' : undefined} rules={[{ required: true, message: '请输入维度名称' }]}><Input placeholder="如：创新性" /></Form.Item></Col>
                <Col span={6}><Form.Item name={[field.name, 'max']} label={index === 0 ? '分值' : undefined} rules={[{ required: true, message: '请输入分值' }]}><InputNumber min={1} max={100} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={3}><Button danger type="link" disabled={fields.length <= 2} onClick={() => remove(field.name)} style={{ minHeight: 44 }}>删除</Button></Col>
              </Row>)}
              <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: `criterion-${Date.now()}`, name: '', max: 10 })}>添加评分维度</Button>
            </>}
          </Form.List>
        </Form>
      </Modal>

      <Drawer open={!!workDetail} width={620} title={workDetail ? `作品详情：${workDetail.title}` : ''} onClose={() => setWorkDetail(null)}>
        {workDetail && <>
          <Descriptions bordered size="small" column={2} items={[
            { key: '1', label: '赛事', span: 2, children: competitionOf(workDetail.competitionId)?.name },
            { key: '2', label: '学生', children: workDetail.studentName }, { key: '3', label: '年级', children: workDetail.grade },
            { key: '4', label: '学校', span: 2, children: workDetail.school }, { key: '5', label: '参赛形式', children: workDetail.teamType },
            { key: '6', label: '资格', children: <S v={workDetail.eligibilityStatus} /> }, { key: '7', label: '评审', children: <S v={workDetail.reviewStatus} /> },
            { key: '8', label: '作品说明', span: 2, children: workDetail.desc },
          ]} />
          <Divider orientation="left">作品材料</Divider>
          <List bordered size="small" dataSource={workDetail.assets || []} renderItem={(asset: any) => <List.Item actions={[<a onClick={() => message.info('演示环境未连接真实文件存储')}>查看</a>]}><List.Item.Meta title={asset.name} description={`${asset.type} · ${asset.size}`} /></List.Item>} />
          <Divider orientation="left">审核记录</Divider>
          <AuditTimeline items={workDetail.audits || []} />
        </>}
      </Drawer>

      <AuditModal open={!!auditTarget} title={`资格审核：${auditTarget?.title || ''}`} onClose={() => setAuditTarget(null)} onSubmit={auditWork} />

      <Modal open={!!expertManageCompetition} width={720} title={`配置赛事专家：${expertManageCompetition?.name || ''}`} footer={<Button onClick={() => { setExpertManageCompetition(null); setExpertToAdd(''); }}>关闭</Button>} onCancel={() => { setExpertManageCompetition(null); setExpertToAdd(''); }}>
        <Alert type="info" showIcon style={{ marginBottom: 14 }} message="从专家库单独添加或移除本赛事专家" description="已分配作品的专家需先调整作品分配后才能移出赛事。专家库资料不受影响。" />
        <Space.Compact style={{ width: '100%', marginBottom: 14 }}>
          <Select style={{ flex: 1 }} value={expertToAdd || undefined} placeholder="选择要加入本赛事的专家" onChange={setExpertToAdd} options={experts.filter((expert: any) => !(competitionOf(expertManageCompetition?.id)?.expertIds || []).includes(expert.id)).map((expert: any) => ({ value: expert.id, label: `${expert.name} · ${expert.specialties.join('/')} · ${expert.status}` }))} />
          <Button type="primary" disabled={!expertToAdd} onClick={addCompetitionExpert}>添加专家</Button>
        </Space.Compact>
        <List bordered dataSource={expertManageCompetition ? competitionExperts(expertManageCompetition.id) : []} locale={{ emptyText: '本赛事暂无专家' }} renderItem={(expert: any) => {
          const assignedCount = assignments.filter((assignment: any) => assignment.expertId === expert.id && entryOf(assignment.entryId)?.competitionId === expertManageCompetition.id).length;
          const removeButton = <Button key="remove" type="link" danger style={{ minHeight: 44, paddingInline: screens.sm ? undefined : 0 }} onClick={() => removeCompetitionExpert(expert)}>移出赛事</Button>;
          return <List.Item actions={screens.sm ? [removeButton] : undefined}><List.Item.Meta avatar={<Avatar style={{ background: '#1677ff' }}>{expert.name.slice(0, 1)}</Avatar>} title={<Space wrap size={8}><span style={{ whiteSpace: 'nowrap' }}>{expert.name}</span><S v={expert.status} /></Space>} description={<Space direction="vertical" size={2}><span>{expert.unit} · {expert.specialties.join('/')} · 已分配 {assignedCount} 份作品</span>{!screens.sm && removeButton}</Space>} /></List.Item>;
        }} />
      </Modal>

      <Modal open={!!reviewLinkCompetition} width={720} title={`专家评审链接：${reviewLinkCompetition?.name || ''}`} footer={<Button onClick={() => setReviewLinkCompetition(null)}>关闭</Button>} onCancel={() => setReviewLinkCompetition(null)}>
        <Alert type="success" showIcon style={{ marginBottom: 14 }} message="专家无需用户名和密码" description="每位专家使用自己的专属链接，只能看到本赛事中分配给自己的作品。可直接复制发送，也可打开链接演示评审。" />
        <List bordered dataSource={reviewLinkCompetition ? competitionExperts(reviewLinkCompetition.id) : []} locale={{ emptyText: '本赛事尚未加入专家' }} renderItem={(expert: any) => <List.Item actions={[
          <Button key="copy" type="link" icon={<CopyOutlined />} onClick={() => copyReviewUrl(reviewLinkCompetition, expert)}>复制链接</Button>,
          <Button key="open" type="link" icon={<EyeOutlined />} onClick={() => window.open(reviewUrl(reviewLinkCompetition, expert), '_blank', 'noopener,noreferrer')}>打开评审页</Button>,
        ]}><List.Item.Meta avatar={<Avatar style={{ background: '#1677ff' }}>{expert.name.slice(0, 1)}</Avatar>} title={<Space>{expert.name}<S v={expert.status} /></Space>} description={<span>{expert.unit}<br /><span style={{ color: '#1677ff' }}>当前分配 {expertLoad(expert.id, reviewLinkCompetition.id)} 份作品</span></span>} /></List.Item>} />
      </Modal>

      <Modal open={!!assignTarget} title={`${assignmentOf(assignTarget?.id) ? '更换' : '分配'}专家：${assignTarget?.title || ''}`} okText={assignmentOf(assignTarget?.id) ? '确认更换' : '确认分配'} okButtonProps={{ disabled: !assignExpertId }} cancelText="取消" onCancel={() => { setAssignTarget(null); setAssignExpertId(''); }} onOk={() => assignWork(assignTarget.id, assignExpertId)}>
        <Alert type="info" showIcon style={{ marginBottom: 14 }} message="仅显示已加入本赛事且符合专业、容量与同校回避规则的专家。每份作品分配 1 位专家。" />
        {assignmentOf(assignTarget?.id) && <Descriptions size="small" column={1} style={{ marginBottom: 12 }} items={[{ key: 'current', label: '当前专家', children: expertOf(assignmentOf(assignTarget.id)?.expertId)?.name || '专家已移除' }]} />}
        <Select showSearch optionFilterProp="label" style={{ width: '100%' }} value={assignExpertId || undefined} placeholder="请选择专家" onChange={setAssignExpertId} options={(assignTarget ? availableExperts(assignTarget) : []).map((x: any) => ({ value: x.id, label: `${x.name} · ${x.specialties.join('/')} · 本赛事 ${expertLoad(x.id, assignTarget.competitionId)} 项` }))} />
        {assignTarget && !availableExperts(assignTarget).length && <Alert type="warning" showIcon style={{ marginTop: 12 }} message="暂无可分配专家" description={<span>请先为赛事加入专业匹配且有容量的专家。<Button type="link" onClick={() => { setExpertManageCompetition(competitionOf(assignTarget.competitionId)); setExpertToAdd(''); setAssignTarget(null); }}>去配置赛事专家</Button></span>} />}
      </Modal>

      <Modal open={expertOpen} title="新增专家" okText="加入专家库" cancelText="取消" onCancel={() => setExpertOpen(false)} onOk={saveExpert} destroyOnClose>
        <Form form={expertForm} layout="vertical" initialValues={{ capacity: 6 }}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="手机号" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="unit" label="所属单位" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={16}><Form.Item name="specialties" label="专业方向" rules={[{ required: true }]}><Select mode="multiple" options={['创新实践', '人工智能', '机器人', '无人机', '科学实验'].map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="capacity" label="任务容量" rules={[{ required: true }]}><InputNumber min={1} max={50} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal open={!!scoreTarget} width={680} title={`专家评分：${entryOf(scoreTarget?.entryId)?.title || ''}`} footer={scoreTarget && ['已提交', '已锁定'].includes(scoreTarget.status) ? <Button onClick={() => setScoreTarget(null)}>关闭</Button> : [<Button key="cancel" onClick={() => setScoreTarget(null)}>取消</Button>, <Button key="draft" onClick={() => saveScore(false)}>暂存</Button>, <Button key="submit" type="primary" onClick={() => saveScore(true)}>提交评分</Button>]} onCancel={() => setScoreTarget(null)}>
        {scoreTarget && <>
          <Alert type="info" showIcon style={{ marginBottom: 14 }} message="评分提交后不可修改；如需重评，必须由复核员退回。" />
          {(competitionOf(entryOf(scoreTarget.entryId)?.competitionId)?.criteria || []).map((criterion: any) => <div key={criterion.key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><span style={{ width: 110 }}>{criterion.name}</span><InputNumber disabled={['已提交', '已锁定'].includes(scoreTarget.status)} min={0} max={criterion.max} value={scoreDraft.items[criterion.key]} onChange={(v) => setScoreDraft((s: any) => ({ ...s, items: { ...s.items, [criterion.key]: v } }))} /><span style={{ color: '#999' }}>/ {criterion.max} 分</span></div>)}
          <Divider />
          <div style={{ marginBottom: 8 }}>专家评语</div>
          <TextArea disabled={['已提交', '已锁定'].includes(scoreTarget.status)} rows={4} value={scoreDraft.comment} onChange={(e: any) => setScoreDraft((s: any) => ({ ...s, comment: e.target.value }))} placeholder="请评价作品亮点、问题与改进建议" />
          <div style={{ textAlign: 'right', marginTop: 12, fontSize: 18 }}>总分：<b style={{ color: '#1677ff' }}>{(competitionOf(entryOf(scoreTarget.entryId)?.competitionId)?.criteria || []).reduce((sum: number, c: any) => sum + Number(scoreDraft.items[c.key] || 0), 0)}</b> / 100</div>
        </>}
      </Modal>

      <Modal open={!!reviewTarget} title={`评分复核：${reviewTarget?.title || ''}`} okText="提交复核" cancelText="取消" onCancel={() => setReviewTarget(null)} onOk={reviewScore}>
        {reviewTarget && <Space direction="vertical" style={{ width: '100%' }} size={14}>
          <Alert type="info" showIcon message={`专家 ${reviewTarget.expert?.name || ''} 评分：${reviewTarget.score?.total || 0} 分`} description={reviewTarget.score?.comment} />
          <Radio.Group value={reviewAction} onChange={(e: any) => setReviewAction(e.target.value)}><Radio.Button value="confirm">确认评分</Radio.Button><Radio.Button value="return">退回重评</Radio.Button></Radio.Group>
          {reviewAction === 'confirm' && <Select style={{ width: '100%' }} value={reviewAward} onChange={setReviewAward} options={[...new Set([...contestStore.awardsOf(competitionOf(reviewTarget?.competitionId)).map((a: any) => a.name), '无奖项'])].map((x: any) => ({ value: x, label: x }))} />}
          <TextArea rows={3} value={reviewNote} onChange={(e: any) => setReviewNote(e.target.value)} placeholder={reviewAction === 'confirm' ? '填写复核意见' : '填写退回原因，专家将重新评分'} />
        </Space>}
      </Modal>
    </div>
  );
}

/* 十四、售后管理 */
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
  { key: 'competition', icon: <TrophyOutlined />, label: '赛事评审中心' },
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
  const [db, setDb] = useState(loadAdminDB);
  const [helpOpen, setHelpOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const query = new URLSearchParams(window.location.search);
  const reviewToken = query.get('review');
  const reviewEventId = contestStore ? contestStore.normalizeCompetitionId(query.get('event')) : query.get('event');
  useEffect(() => {
    const { competitions, contestEntries, ...adminState } = db;
    try { localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(adminState)); } catch (_) {}
    if (contestStore && !contestStore.save({ competitions, contestEntries })) message.error('浏览器存储空间不足，赛事未持久保存，请减少图片后重试');
  }, [db]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === contestStore?.KEY || event.key === ADMIN_STORE_KEY) setDb(loadAdminDB());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  if (reviewToken) return <ExpertReviewPage db={db} setDb={setDb} token={reviewToken} eventId={reviewEventId} />;
  const title = MENUS.find((m) => m.key === nav)?.label || '';
  const pages: Record<string, any> = {
    dash: <Dashboard db={db} go={setNav} />, user: <UserPage db={db} setDb={setDb} />,
    school: <SchoolPage db={db} setDb={setDb} go={setNav} />, venue: <VenuePage db={db} setDb={setDb} />,
    org: <OrgPage db={db} setDb={setDb} />, teacher: <TeacherPage db={db} setDb={setDb} />,
    course: <CoursePage db={db} setDb={setDb} />, competition: <CompetitionPage db={db} setDb={setDb} />,
    deploy: <DeployPage db={db} setDb={setDb} />, class: <ClassPage db={db} setDb={setDb} />, order: <OrderPage db={db} setDb={setDb} />,
    lesson: <LessonPage db={db} setDb={setDb} />, settle: <SettlePage db={db} setDb={setDb} />,
    aftersale: <AftersalePage db={db} setDb={setDb} />, log: <LogPage db={db} />,
  };
  const selectNav = (key: string) => {
    setNav(key);
    setNavOpen(false);
  };
  const sidebar = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#001529' }}>
      <div style={{ color: '#fff', padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>未</div>
        <div style={{ lineHeight: 1.25 }}><b>天府未来教育中心</b><div style={{ fontSize: 11, opacity: .65 }}>后台管理系统 Demo</div></div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Menu theme="dark" mode="inline" selectedKeys={[nav]} items={MENUS} onClick={(e: any) => selectNav(e.key)} />
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
  );
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && <Sider width={216} theme="dark" style={{ height: '100vh', position: 'sticky', top: 0 }}>{sidebar}</Sider>}
      <Drawer open={isMobile && navOpen} placement="left" width={280} closable={false} onClose={() => setNavOpen(false)} styles={{ body: { padding: 0, background: '#001529' } }}>
        {sidebar}
      </Drawer>
      <Layout style={{ minWidth: 0 }}>
        <Header style={{ background: '#fff', height: isMobile ? 56 : 64, padding: isMobile ? '0 10px' : '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, boxShadow: '0 1px 4px rgba(0,21,41,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            {isMobile && <Button type="text" aria-label="打开导航" icon={<MenuOutlined />} onClick={() => setNavOpen(true)} style={{ width: 44, height: 44, flexShrink: 0 }} />}
            <b style={{ fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</b>
          </div>
          <Space size={isMobile ? 4 : 14}>
            <Button size={isMobile ? 'middle' : 'small'} aria-label="打开名词解释" icon={<QuestionCircleOutlined />} onClick={() => setHelpOpen(true)} style={isMobile ? { width: 44, height: 44 } : undefined}>{isMobile ? null : '名词解释'}</Button>
            {!isMobile && <Tag color="blue">天府通 · 课后延时服务平台</Tag>}
            <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />
            {!isMobile && <span>张运营（平台管理员）</span>}
          </Space>
        </Header>
        <Content style={{ margin: isMobile ? 8 : 16, overflow: 'auto', minWidth: 0 }}>{pages[nav]}</Content>
        <Drawer open={helpOpen} width={isMobile ? 'calc(100vw - 16px)' : 560} title="平台名词解释" onClose={() => setHelpOpen(false)}>
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
