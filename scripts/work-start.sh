#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${WORK_PORT:-4178}"
URL="http://127.0.0.1:${PORT}"
PID_FILE="$REPO_ROOT/.local-dev.pid"
LOG_FILE="$REPO_ROOT/.local-dev.log"
source "$REPO_ROOT/scripts/server-common.sh"

cd "$REPO_ROOT"

bash "$REPO_ROOT/scripts/sync-down.sh"

if [[ -f "$PID_FILE" ]]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if is_project_server_pid "$EXISTING_PID" "$REPO_ROOT" "$PORT" && curl --silent --fail "$URL" >/dev/null 2>&1; then
    echo "本地预览已在运行：$URL"
  elif [[ "$EXISTING_PID" =~ ^[0-9]+$ ]] && ! kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "正在清理已退出服务遗留的 PID 文件。"
    rm -f "$PID_FILE"
  else
    echo "错误：PID 文件存在，但无法确认对应进程属于本项目。" >&2
    echo "为避免影响其他项目，已停止操作，请人工核对：$PID_FILE" >&2
    exit 1
  fi
fi

if [[ ! -f "$PID_FILE" ]]; then
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "错误：端口 $PORT 已被其他进程占用，未启动预览服务。" >&2
    exit 1
  fi

  echo "正在启动本地预览……"
  nohup npm run dev >"$LOG_FILE" 2>&1 < /dev/null &
  LAUNCHER_PID=$!

  READY=0
  for _ in {1..40}; do
    if [[ -f "$PID_FILE" ]]; then
      SERVER_PID="$(cat "$PID_FILE")"
    else
      SERVER_PID=""
    fi
    if [[ -n "$SERVER_PID" ]] && is_project_server_pid "$SERVER_PID" "$REPO_ROOT" "$PORT" && curl --silent --fail "$URL" >/dev/null 2>&1; then
      READY=1
      break
    fi
    sleep 0.25
  done

  if [[ "$READY" -ne 1 ]]; then
    kill "$LAUNCHER_PID" 2>/dev/null || true
    if [[ -f "$PID_FILE" ]]; then
      SERVER_PID="$(cat "$PID_FILE")"
      if is_project_server_pid "$SERVER_PID" "$REPO_ROOT" "$PORT"; then
        kill "$SERVER_PID" 2>/dev/null || true
      fi
    fi
    echo "错误：本地预览启动失败，请查看 ${LOG_FILE}。" >&2
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
