#!/usr/bin/env bash

set -euo pipefail

repo_name="${1:-x-video-link-extractor}"
visibility="${2:-public}"

git init
git branch -M main
git add .
git commit -m "feat: add x video link extractor"
gh repo create "$repo_name" --"$visibility" --source=. --remote=origin --push

printf '\n仓库已创建：%s\n' "$repo_name"
