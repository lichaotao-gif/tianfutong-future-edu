# scripts

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
