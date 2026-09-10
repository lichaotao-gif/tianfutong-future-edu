#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

BRANCH="$(git symbolic-ref --quiet --short HEAD || true)"
if [[ -z "$BRANCH" ]]; then
  echo "错误：当前处于 detached HEAD，请先切换到工作分支。" >&2
  exit 1
fi
echo "当前 Git 分支：$BRANCH"

echo "正在运行项目测试……"
npm test

generate_commit_message() {
  local files html_count=0 css_count=0 js_count=0 doc_count=0 script_count=0 other_count=0
  files="$(git diff --cached --name-only)"

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    case "$f" in
      *.md|*.docx|docs/*) ((doc_count++)) ;;
      *.html) ((html_count++)) ;;
      *.css) ((css_count++)) ;;
      *.js) ((js_count++)) ;;
      scripts/*|*.sh|package*.json|*.yml|*.yaml) ((script_count++)) ;;
      *) ((other_count++)) ;;
    esac
  done <<< "$files"

  local parts=()
  ((html_count > 0)) && parts+=("页面")
  ((css_count > 0)) && parts+=("样式")
  ((js_count > 0)) && parts+=("脚本")
  ((doc_count > 0)) && parts+=("文档")
  ((script_count > 0)) && parts+=("配置与脚本")
  ((other_count > 0)) && parts+=("其他文件")

  if [[ ${#parts[@]} -eq 0 ]]; then
    echo "同步本地开发修改"
  else
    local joined
    joined="$(IFS=、; echo "${parts[*]}")"
    echo "更新${joined}"
  fi
}

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A

  echo "正在检查暂存区格式……"
  if ! git diff --cached --check; then
    echo "错误：暂存区存在空白符或格式问题，请先修正。" >&2
    exit 1
  fi

  UNSAFE_FILE=""
  while IFS= read -r FILE_NAME; do
    case "$FILE_NAME" in
      .env|.env.*|*.pem|*.key|*.p12|*.pfx|node_modules/*|dist/*|build/*|coverage/*|.cache/*)
        if [[ "$FILE_NAME" != ".env.example" ]]; then
          UNSAFE_FILE="$FILE_NAME"
          break
        fi
        ;;
    esac
  done < <(git diff --cached --name-only)

  if [[ -n "$UNSAFE_FILE" ]]; then
    echo "错误：发现可能包含密钥或构建产物的文件：$UNSAFE_FILE" >&2
    echo "已停止提交，请人工确认暂存内容。" >&2
    exit 1
  fi

  COMMIT_MESSAGE="${1:-$(generate_commit_message)}"

  echo "即将提交以下项目文件："
  git diff --cached --name-status
  git commit -m "$COMMIT_MESSAGE"
else
  echo "没有需要提交的本地修改。"
fi

echo "提交前正在与 GitHub 变基同步……"
git pull --rebase origin "$BRANCH"

echo "正在推送到 GitHub……"
git push origin "$BRANCH"

bash "$REPO_ROOT/scripts/work-stop.sh"
echo "结束工作完成：测试、提交、同步和推送均已完成。"
