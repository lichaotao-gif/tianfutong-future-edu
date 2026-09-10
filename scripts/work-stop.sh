#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$REPO_ROOT/.local-dev.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "本地预览当前未由工作流启动。"
  exit 0
fi

SERVER_PID="$(cat "$PID_FILE")"
SERVER_COMMAND="$(ps -p "$SERVER_PID" -o command= 2>/dev/null || true)"
if [[ "$SERVER_COMMAND" == *"http.server"* ]]; then
  kill "$SERVER_PID"
  echo "已停止本地预览服务。"
else
  echo "未停止进程：PID $SERVER_PID 已不属于本项目预览服务。" >&2
fi
rm -f "$PID_FILE"
