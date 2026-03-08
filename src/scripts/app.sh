#!/usr/bin/env bash

app_pid_file="$temp_dir/app.pid"
app_index="$(pwd)/src/backend/index.ts"

function app_start {
	app_stop
	(
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
