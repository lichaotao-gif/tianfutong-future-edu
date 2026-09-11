#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$REPO_ROOT/.local-dev.pid"
PORT="${WORK_PORT:-4178}"
source "$REPO_ROOT/scripts/server-common.sh"

if [[ ! -f "$PID_FILE" ]]; then
  echo "本地预览当前未由工作流启动。"
  exit 0
fi

SERVER_PID="$(cat "$PID_FILE")"
if ! is_project_server_pid "$SERVER_PID" "$REPO_ROOT" "$PORT"; then
  if [[ "$SERVER_PID" =~ ^[0-9]+$ ]] && ! kill -0 "$SERVER_PID" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "预览服务已经退出，已清理遗留的 PID 文件。"
    exit 0
  fi
  echo "错误：无法确认 PID $SERVER_PID 属于当前项目预览服务。" >&2
  echo "为避免误停其他项目，未发送停止信号，也未删除 PID 文件。" >&2
  exit 1
fi

kill "$SERVER_PID"
for _ in {1..30}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "已停止本项目预览服务（PID ${SERVER_PID}）。"
    exit 0
  fi
  sleep 0.1
done

echo "错误：PID ${SERVER_PID} 未在预期时间内退出，未使用强制或批量停止命令。" >&2
exit 1
