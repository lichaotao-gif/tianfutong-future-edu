#!/usr/bin/env bash

# 只把带有本项目绝对目录和指定端口的 Python 服务认作当前项目预览。
is_project_server_pid() {
  local pid="$1"
  local repo_root="$2"
  local port="$3"
  local command_line

  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  command_line="$(ps -p "$pid" -o command= 2>/dev/null || true)"

  [[ "$command_line" == *" -m http.server $port"* ]] &&
    [[ "$command_line" == *"--directory $repo_root"* ]]
}
