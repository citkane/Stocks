#!/usr/bin/env bash
app_pid=

function app_start {
	app_running && echo "App already running"
	bun "$app_index" "saxo_token_file" &
	app_pid=$!
	echo "running: $app_pid"
}

function app_stop {
	app_running && kill "$app_pid"
}

function app_running {
	[ $app_pid ] && [ -d "/proc/$app_pid" ] && return 0
	return 1
}
