# scripts

## 多电脑一键同步

项目通过 GitHub SSH 远程仓库同步。同步脚本会校验 `origin`；如果发现标准的
`https://github.com/用户名/仓库名.git` 地址，会自动转换为
`git@github.com:用户名/仓库名.git`。

开始工作：

```bash
npm run work:start
```

该命令会先确认工作区干净，然后通过 SSH 快进拉取当前分支、检查并按需安装依赖，
最后启动本地预览并打开 `http://127.0.0.1:4178`。

结束工作：

```bash
npm run sync:up -- "本次修改的中文说明"
```

该命令会测试项目、暂存并检查修改、提交、变基拉取、推送，最后只停止由本项目工作流
记录并验证过的预览进程。发生 Git 冲突或非快进同步时脚本会立即停止，不会覆盖代码。

多电脑使用顺序：上一台电脑先完成“结束工作”并确认推送成功，下一台电脑再执行
“开始工作”。旧电脑首次使用前执行：

```bash
git pull --ff-only origin main
```

## md2docx.js — 法律文本 Markdown → Word

`docs/` 下两份家长端法律文本以 Markdown 为唯一正本（家长端 App 也直接读取该 Markdown 渲染），
需要给法务、机构或监管方交纸质/Word 版本时用此脚本生成 `docs/word/*.docx`。

```bash
npm install docx          # 仅首次
node scripts/md2docx.js docs docs/word
```

生成的两份文件：

| 源文件 | 输出 |
|---|---|
| `docs/家长端用户协议（草稿）.md` | `天府未来教育中心_用户服务协议（家长端）_草稿v0.2.docx` |
| `docs/家长端隐私政策（草稿）.md` | `天府未来教育中心_隐私政策（家长端）_草稿v0.2.docx` |

儿童个人信息保护规则**不单独成文**，已并入《隐私政策》第四条（儿童个人信息专章）。

**法务修订后：改 Markdown、重跑脚本**，不要只改 Word——否则家长端展示的正文会与定稿版本不一致。
版本号变更时同步修改 `JOBS` 中的输出文件名与 `md2docx.js` 页眉里的版本标识。
