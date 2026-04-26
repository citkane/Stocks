#!/usr/bin/env bash

app_pid_file="$temp_dir/app.pid"
app_index="$(pwd)/src/backend/index.ts"
chrome_bins=(
  "/var/lib/flatpak/exports/bin/io.github.ungoogled_software.ungoogled_chromium"
);


function app_start {
	chrome_bin=$(_chrome_bin)
	app_stop
	(
		if [[ -n $chrome_bin ]];then
			export BUN_CHROME_PATH="$chrome_bin"
		fi
		bun "$app_index" &
		pid=$!
		echo "$pid" > "$app_pid_file"
	)
	sleep 1
}

function app_stop {
	process_stop "$app_pid_file"
	sleep 1
}

function app_running {
	process_running "$app_pid_file" && return 0
	return 1
}

function _chrome_bin {
	_path=""
	for path in "${chrome_bins[@]}"; do
		if [[ -e "$path" ]]; then
			_path="$path"
			break	
		fi
	done
	if [[ -n "$_path" ]];then
		echo "$_path"
	else
		return 1
	fi
}
