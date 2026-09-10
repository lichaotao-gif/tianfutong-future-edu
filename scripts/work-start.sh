#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${WORK_PORT:-4178}"
URL="http://127.0.0.1:${PORT}"
PID_FILE="$REPO_ROOT/.local-dev.pid"
LOG_FILE="$REPO_ROOT/.local-dev.log"

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

if [[ -f "$PID_FILE" ]]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if kill -0 "$EXISTING_PID" 2>/dev/null && curl --silent --fail "$URL" >/dev/null 2>&1; then
    echo "本地预览已在运行：$URL"
  else
    rm -f "$PID_FILE"
  fi
fi

if [[ ! -f "$PID_FILE" ]]; then
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "错误：端口 $PORT 已被其他进程占用，未启动预览服务。" >&2
    exit 1
  fi

  echo "正在启动本地预览……"
  nohup python3 -m http.server "$PORT" --bind 127.0.0.1 >"$LOG_FILE" 2>&1 < /dev/null &
  SERVER_PID=$!
  echo "$SERVER_PID" > "$PID_FILE"

  READY=0
  for _ in {1..20}; do
    if curl --silent --fail "$URL" >/dev/null 2>&1; then
      READY=1
      break
    fi
    sleep 0.25
  done

  if [[ "$READY" -ne 1 ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    rm -f "$PID_FILE"
    echo "错误：本地预览启动失败，请查看 $LOG_FILE。" >&2
    exit 1
  fi
fi

if [[ "${WORK_OPEN_BROWSER:-1}" == "1" ]]; then
  if command -v open >/dev/null 2>&1; then
    open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 &
  fi
fi

echo "开始工作完成：代码已同步，依赖已检查，本地预览地址为 $URL"
