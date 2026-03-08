#!/usr/bin/env bash
# shellcheck disable=SC2329
# shellcheck disable=SC1091

temp_dir="$(pwd)/.temp"
log_dir="$(pwd)/.logs"

[ ! -d "$temp_dir" ] && mkdir "$temp_dir"
[ ! -d "$log_dir" ] && mkdir "$log_dir"

function process_running {
	pid_file=$1
	[ ! -f "$pid_file" ] && return 1
	pid=$(cat "$pid_file")
	[ -d "/proc/$pid" ] && return 0
	return 1
}
function process_stop {
	pid_file=$1
	[ ! -f "$pid_file" ] && return 1
	! process_running "$pid_file" && return 0
	pid=$(cat "$pid_file")
	rm "$pid_file"
	kill "$pid"
}

source src/scripts/ibkr.sh
source src/scripts/app.sh

ibkr_start
app_start



