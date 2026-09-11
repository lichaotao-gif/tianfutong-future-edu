#!/usr/bin/env bash

# 供同步脚本复用：确保 origin 指向 GitHub SSH 地址。
ensure_github_ssh_origin() {
  local origin_url ssh_url

  if ! origin_url="$(git remote get-url origin 2>/dev/null)"; then
    echo "错误：当前项目没有配置 origin 远程仓库。" >&2
    return 1
  fi

  case "$origin_url" in
    git@github.com:*.git|git@github.com:*)
      echo "GitHub SSH 地址已就绪：$origin_url"
      ;;
    https://github.com/*|http://github.com/*)
      ssh_url="${origin_url#*github.com/}"
      ssh_url="git@github.com:${ssh_url%.git}.git"
      echo "检测到 GitHub HTTPS 地址，正在转换为 SSH：$ssh_url"
      git remote set-url origin "$ssh_url"
      ;;
    ssh://git@github.com/*)
      echo "GitHub SSH 地址已就绪：$origin_url"
      ;;
    *)
      echo "错误：origin 不是受支持的 GitHub 地址：$origin_url" >&2
      echo "请将 origin 设置为 git@github.com:用户名/仓库名.git 后重试。" >&2
      return 1
      ;;
  esac
}
