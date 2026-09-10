#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMMIT_MESSAGE="${1:-同步本地开发修改}"

cd "$REPO_ROOT"

BRANCH="$(git symbolic-ref --quiet --short HEAD || true)"
if [[ -z "$BRANCH" ]]; then
  echo "错误：当前处于 detached HEAD，请先切换到工作分支。" >&2
  exit 1
fi
echo "当前 Git 分支：$BRANCH"

echo "正在运行项目测试……"
npm test

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A

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
