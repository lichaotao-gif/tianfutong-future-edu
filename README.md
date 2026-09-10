# 天府通 · 未来教育 — 家长端

嵌入天府通小程序的**校内课后延时服务**入口。第一版仅做**家长端**，纯前端 HTML（写死 mock 数据，无后端）。后续可扩展：学校端 / 运营端 / 老师端。

## 一句话产品

家长在天府通点击「未来教育」进入 → 自动识别孩子所在学校 → 只展示本校开放课程 → 报名时先做**费用预授权**（冻结不扣款） → 学生完成课程后老师上传**学习成果** → 家长查看满意后**再确认扣款**（先学后付）。

## 运行方式

- **推荐工作流**：运行 `npm run work:start`，自动同步 GitHub、检查依赖并打开本地预览。
- **最简单**：双击打开 `index.html`（纯静态，`file://` 即可，无需服务器）。
- **手动启动服务器**：`npm run dev`，浏览器访问 `http://127.0.0.1:4178`。
- 手机查看效果最佳；桌面端会显示为居中的手机外框。

## 多电脑一键同步

本机推荐开发目录：`~/Documents/www/tianfutong-future-edu`。

### 开始工作

```bash
npm run work:start
```

该命令会检查当前分支和工作区；只要存在未提交修改，就立即停止，避免覆盖本地内容。工作区干净时，它会执行 `git pull --ff-only`、检查并安装缺失依赖、启动本地服务，然后打开 `http://127.0.0.1:4178`。

### 结束工作

```bash
npm run sync:up
```

该命令会运行测试、暂存项目改动、排查常见密钥和构建产物、使用中文默认提交信息提交，然后执行 `git pull --rebase` 和 `git push`，成功后停止本地预览。也可以传入更具体的中文提交信息：

```bash
npm run sync:up -- "完善报名流程"
```

### 其他电脑首次使用

```bash
mkdir -p ~/Documents/www
git clone git@github.com:lichaotao-gif/tianfutong-future-edu.git ~/Documents/www/tianfutong-future-edu
cd ~/Documents/www/tianfutong-future-edu
npm run work:start
```

## 主流程

天府通入口 → 未来教育首页（学生/学校信息） → 课程详情（先学后付说明） → 报名确认（规则勾选） → 预授权成功（待成班） → 我的报名 → 上课安排 → 学习成果 → 确认满意并付款 → 付款成功；学习成果页可「发起售后」。

## 页面与路由（hash 路由）

| 页面 | 路由 |
|---|---|
| 天府通入口页 | `#/` |
| 未来教育首页 | `#/home` |
| 课程详情 | `#/course/:id` |
| 报名确认 | `#/enroll/:id` |
| 预授权成功 | `#/preauth/:id` |
| 我的报名 | `#/orders` |
| 上课安排 | `#/schedule/:id` |
| 学习成果 | `#/result/:id` |
| 付款成功 | `#/paid/:id` |
| 我的 | `#/me` |
| 售后申请 | 学习成果页内底部弹层 |

底部 Tab：首页 / 我的报名 / 我的。

## 目录结构

```
index.html              入口（手机外框 + 容器）
assets/css/app.css      全部样式（天府通橙色主题）
assets/js/data.js       全部 mock 数据（学生/课程/订单/状态字典/售后）
assets/js/app.js        路由 + 各屏渲染 + 交互
.claude/launch.json     本地预览服务器配置
package.json            本地预览、测试与同步命令
scripts/work-start.sh   开始工作：拉取、依赖检查与预览
scripts/sync-up.sh      结束工作：测试、提交与推送
scripts/work-stop.sh    安全停止本项目预览服务
```

## 改数据

所有预览数据集中在 `assets/js/data.js`：学生信息、3 门课程、2 条报名记录（待成班 / 待确认付款）、报名状态字典、售后问题类型。改这里即可调整内容。

## 本版未做（用 mock 表现，后续接入）

真实登录 / 真实支付 / 天府通真实接口 / 订单接口 / 复杂退款 / 多学校管理 / 老师端 / 学校端 / 运营后台 / 分账结算 / 权限。
