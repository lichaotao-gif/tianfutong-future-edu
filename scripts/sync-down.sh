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

if [[ -n "$(git status --porcelain)" ]]; then
  echo "错误：检测到未提交修改，已停止同步。请先提交、暂存或清理这些修改：" >&2
  git status --short >&2
  exit 1
fi

echo "正在从 GitHub 快进同步……"
git pull --ff-only origin "$BRANCH"

for command_name in node npm python3 curl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "错误：缺少依赖命令 $command_name，请安装后重试。" >&2
    exit 1
  fi
done

if [[ ! -d node_modules ]] || ! npm ls --depth=0 >/dev/null 2>&1; then
  echo "正在安装缺失的项目依赖……"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
else
  echo "项目依赖已就绪。"
fi

echo "同步完成：当前分支 $BRANCH 已与 GitHub 保持一致。"
