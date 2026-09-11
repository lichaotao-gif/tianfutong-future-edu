#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${WORK_PORT:-4178}"
PID_FILE="$REPO_ROOT/.local-dev.pid"

source "$REPO_ROOT/scripts/server-common.sh"

if [[ -f "$PID_FILE" ]]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if is_project_server_pid "$EXISTING_PID" "$REPO_ROOT" "$PORT"; then
    echo "错误：本项目预览服务已在运行（PID ${EXISTING_PID}）。" >&2
    exit 1
  fi
  if [[ "$EXISTING_PID" =~ ^[0-9]+$ ]] && ! kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "正在清理已退出服务遗留的 PID 文件。"
    rm -f "$PID_FILE"
  else
    echo "错误：PID 文件存在，但无法确认其属于本项目：$PID_FILE" >&2
    echo "为避免误停其他进程，已停止启动，请人工核对。" >&2
    exit 1
  fi
fi

# exec 后 shell PID 即为 Python 服务 PID，便于后续精确停止。
echo "$$" > "$PID_FILE"
trap 'rm -f "$PID_FILE"' EXIT
exec python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$REPO_ROOT"
