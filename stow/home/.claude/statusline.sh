#!/bin/bash
set -euo pipefail

# === Claude Code Status Line (4-line layout) ===
# Line 1: [Model (ctx-size)] 🔗 repo │ 🌳 worktree │ 🤖 agent
# Line 2: 🌿 branch +staged ~modified │ +lines -lines
# Line 3: 📊 Ctx bar │ ⏱️ 5h bar │ 📅 7d bar
# Line 4: 💰 cost │ ⏱️ time │ 📥 in 📤 out

# jq が無い場合はフォールバック表示
if ! command -v jq > /dev/null 2>&1; then
  echo "[statusline] jq not found"
  exit 0
fi

input=$(cat)

readonly CYAN='\033[36m'; readonly GREEN='\033[32m'; readonly YELLOW='\033[33m'; readonly RED='\033[31m'
readonly BLUE='\033[1;34m'; readonly MAGENTA='\033[1;35m'; readonly DIM='\033[2m'; readonly RESET='\033[0m'

# ── Helper: cross-platform hash ──
compute_hash() {
  if command -v md5sum > /dev/null 2>&1; then
    md5sum | cut -c1-8
  elif command -v md5 > /dev/null 2>&1; then
    md5 -q | cut -c1-8
  elif command -v cksum > /dev/null 2>&1; then
    cksum | awk '{print $1}'
  else
    echo "default"
  fi
}

# ── Helper: cross-platform file mtime ──
get_mtime() {
  local path="$1"
  if [ ! -e "$path" ]; then
    echo 0
    return
  fi
  case "$(uname -s)" in
    Darwin) stat -f %m "$path" 2>/dev/null || echo 0 ;;
    *)      stat -c %Y "$path" 2>/dev/null || echo 0 ;;
  esac
}

# ── Helper: build colored bar ──
make_bar() {
  local pct="${1:-0}"
  local width="${2:-10}"
  [ "$pct" -lt 0 ] 2>/dev/null && pct=0
  [ "$pct" -gt 100 ] 2>/dev/null && pct=100
  local filled=$(( pct * width / 100 ))
  local empty=$(( width - filled ))
  local bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done
  local color=""
  if [ "$pct" -ge 90 ]; then color="$RED"
  elif [ "$pct" -ge 70 ]; then color="$YELLOW"
  elif [ "$pct" -ge 50 ]; then color="$CYAN"
  else color="$GREEN"; fi
  printf "%b%s%b %3d%%" "$color" "$bar" "$RESET" "$pct"
}

# ── Parse JSON fields ──
model_name=$(echo "$input" | jq -r '.model.display_name // empty' 2>/dev/null || true)
ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size // 0' 2>/dev/null || echo "0")
ctx_size="${ctx_size:-0}"
worktree_name=$(echo "$input" | jq -r '.worktree.name // empty' 2>/dev/null || true)
agent_name=$(echo "$input" | jq -r '.agent.name // empty' 2>/dev/null || true)
total_cost=$(echo "$input" | jq -r '.cost.total_cost_usd // 0' 2>/dev/null || echo "0")
total_cost="${total_cost:-0}"
duration_ms=$(echo "$input" | jq -r '.cost.total_duration_ms // 0' 2>/dev/null || echo "0")
duration_ms="${duration_ms:-0}"
ctx_pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0' 2>/dev/null || echo "0")
ctx_pct="${ctx_pct:-0}"
input_tokens=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0' 2>/dev/null || echo "0")
input_tokens="${input_tokens:-0}"
output_tokens=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0' 2>/dev/null || echo "0")
output_tokens="${output_tokens:-0}"
lines_added=$(echo "$input" | jq -r '.cost.total_lines_added // 0' 2>/dev/null || echo "0")
lines_added="${lines_added:-0}"
lines_removed=$(echo "$input" | jq -r '.cost.total_lines_removed // 0' 2>/dev/null || echo "0")
lines_removed="${lines_removed:-0}"
five_hour_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty' 2>/dev/null || true)
seven_day_pct=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty' 2>/dev/null || true)

# ── Format context window size (200k / 1M) ──
if [ "$ctx_size" -ge 1000000 ]; then
  ctx_size_fmt="1M"
elif [ "$ctx_size" -gt 0 ]; then
  ctx_size_fmt="$(( ctx_size / 1000 ))k"
else
  ctx_size_fmt=""
fi

# ── Format cost ──
cost_fmt=$(printf '$%.2f' "$total_cost" 2>/dev/null || echo '$0.00')

# ── Format duration ──
duration_s=$(( ${duration_ms%.*} / 1000 ))
hours=$(( duration_s / 3600 ))
mins=$(( (duration_s % 3600) / 60 ))
secs=$(( duration_s % 60 ))
if [ "$hours" -gt 0 ]; then
  duration_fmt="${hours}h ${mins}m ${secs}s"
else
  duration_fmt="${mins}m ${secs}s"
fi

# ── Format tokens ──
in_k=$(echo "$input_tokens" | awk '{printf "%.0fk", $1/1000}')
out_k=$(echo "$output_tokens" | awk '{printf "%.0fk", $1/1000}')

# ── Context bar ──
ctx_int=$(printf "%.0f" "$ctx_pct" 2>/dev/null || echo "0")

# ── Rate limit bars ──
five_int=$(printf "%.0f" "${five_hour_pct:-0}" 2>/dev/null || echo "0")
seven_int=$(printf "%.0f" "${seven_day_pct:-0}" 2>/dev/null || echo "0")

# ── Git info (cached, per-directory isolation) ──
readonly CACHE_MAX_AGE=5
cache_dir_hash=$(printf '%s' "$PWD" | compute_hash)
readonly CACHE_FILE="/tmp/statusline-git-cache-${cache_dir_hash}"
cache_stale=true
if [ -f "$CACHE_FILE" ]; then
  cache_mtime=$(get_mtime "$CACHE_FILE")
  cache_age=$(( $(date +%s) - cache_mtime ))
  [ "$cache_age" -le "$CACHE_MAX_AGE" ] && cache_stale=false
fi

if $cache_stale; then
  tmp_cache=$(mktemp "/tmp/statusline-git-cache.XXXXXX")
  trap 'rm -f "$tmp_cache"' EXIT
  if git rev-parse --git-dir > /dev/null 2>&1; then
    branch=$(git branch --show-current 2>/dev/null || echo "")
    staged=$(git diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
    modified=$(git diff --numstat 2>/dev/null | wc -l | tr -d ' ')
    printf '%s\n' "${branch}|${staged}|${modified}" > "$tmp_cache"
  else
    printf '||\n' > "$tmp_cache"
  fi
  mv "$tmp_cache" "$CACHE_FILE"
  trap - EXIT
fi
IFS='|' read -r branch staged modified < "$CACHE_FILE"

# ── Clickable repo link ──
repo_link=""
if git rev-parse --git-dir > /dev/null 2>&1; then
  remote=$(git remote get-url origin 2>/dev/null | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//' || true)
  if [ -n "$remote" ]; then
    repo_name=$(basename "$remote")
    repo_link=$(printf '\e]8;;%s\a%s\e]8;;\a' "$remote" "$repo_name")
  fi
fi

# ── Worktree ticket prefix (suppress if WT_LABEL is set) ──
ticket_prefix=""
if [ -z "${WT_LABEL:-}" ]; then
  toplevel=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
  if [ -n "$toplevel" ]; then
    hash=$(echo -n "$toplevel" | compute_hash)
    ticket_file="/tmp/claude-worktree-tickets-${hash}"
    if [ -f "$ticket_file" ] && [ -s "$ticket_file" ]; then
      ticket_prefix=$(printf "${YELLOW}[%s]${RESET} " "$(cat "$ticket_file")")
    fi
  fi
fi

# ── WT_LABEL prefix ──
wt_prefix=""
if [ -n "${WT_LABEL:-}" ]; then
  wt_prefix=$(printf "${MAGENTA}%s${RESET} │ " "$WT_LABEL")
fi

# ══════════════════════════════════════
# LINE 1: [Model (ctx-size)] 🔗 repo │ 🌳 worktree │ 🤖 agent
# ══════════════════════════════════════
model_label="$model_name"
[ -n "$ctx_size_fmt" ] && model_label="${model_name} ${DIM}(${ctx_size_fmt})${RESET}"
line1=$(printf "%b%b${BLUE}[%b]${RESET}" "$wt_prefix" "$ticket_prefix" "$model_label")
[ -n "$repo_link" ] && line1=$(printf "%b 🔗 %b" "$line1" "$repo_link")
[ -n "$worktree_name" ] && line1=$(printf "%b │ 🌳 ${CYAN}%s${RESET}" "$line1" "$worktree_name")
[ -n "$agent_name" ] && line1=$(printf "%b │ 🤖 ${MAGENTA}%s${RESET}" "$line1" "$agent_name")

# ══════════════════════════════════════
# LINE 2: 🌿 branch +staged ~modified │ +lines -lines
# ══════════════════════════════════════
if [ -n "$branch" ]; then
  git_status=""
  [ "${staged:-0}" -gt 0 ] && git_status="${GREEN}+${staged}${RESET} "
  [ "${modified:-0}" -gt 0 ] && git_status="${git_status}${YELLOW}~${modified}${RESET}"
  line2=$(printf "🌿 ${CYAN}%s${RESET} %b" "$branch" "$git_status")
  line2=$(printf "%b │ ${GREEN}+%s${RESET} ${RED}-%s${RESET} lines" \
    "$line2" "$lines_added" "$lines_removed")
else
  line2=$(printf "${DIM}(no git)${RESET}")
  line2=$(printf "%b │ ${GREEN}+%s${RESET} ${RED}-%s${RESET} lines" \
    "$line2" "$lines_added" "$lines_removed")
fi

# ══════════════════════════════════════
# LINE 3: 📊 Ctx bar │ ⏱️ 5h bar │ 📅 7d bar
# ══════════════════════════════════════
ctx_bar=$(make_bar "$ctx_int" 10)
line3=$(printf "📊 Ctx %b" "$ctx_bar")

if [ -n "$five_hour_pct" ]; then
  five_bar=$(make_bar "$five_int" 10)
  line3=$(printf "%b │ ⏱️ 5h %b" "$line3" "$five_bar")
fi

if [ -n "$seven_day_pct" ]; then
  seven_bar=$(make_bar "$seven_int" 10)
  line3=$(printf "%b │ 📅 7d %b" "$line3" "$seven_bar")
fi

# ══════════════════════════════════════
# LINE 4: 💰 cost │ ⏱️ time │ 📥 in 📤 out
# ══════════════════════════════════════
line4=$(printf "💰 ${YELLOW}%s${RESET} │ ⏱️ %s │ 📥 %s 📤 %s" \
  "$cost_fmt" "$duration_fmt" "$in_k" "$out_k")

# ── Output ──
printf "%b\n%b\n%b\n%b" "$line1" "$line2" "$line3" "$line4"
