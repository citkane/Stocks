#!/usr/bin/env bash

ibkr_portal="clientportal.beta.gw"
ibkr_download=https://download2.interactivebrokers.com/portal/${ibkr_portal}.zip
pid_file="$(pwd)/$ibkr_pid_file"

function ibkr_install {
	zip_file="./$ibkr_portal.zip"
	[ ! -f $zip_file ] && wget $ibkr_download
	unzip $zip_file -d "./$ibkr_portal"
	rm $zip_file
}
function ibkr_start {
	if [ "$(ibkr_process_running)" ]; then
		echo "IBKR portal already running"
		return 1
	fi
	(
		cd $ibkr_portal || exit
		sh bin/run.sh root/conf.yaml & child_pid=$!
		sleep 1
		java_pid=$(pgrep -P $child_pid java)
		echo "$java_pid" > "$pid_file"
	)
}

function ibkr_stop {
	pid="$(ibkr_process_running)"
	if [ "$pid" ]; then 
		kill "$pid"
		rm "$pid_file"
	fi
}

function ibkr_process_running {
	if [ "$1" ]; then 
		pid=$1
	else
		pid="$(get_ibkr_pid)"
	fi
	if [[ "$pid" && -d "/proc/$pid" ]]; then
		echo "$pid"
	fi
	return 1
}

function get_ibkr_pid {
	if [[ -f "$pid_file" ]]; then
		pid=$(cat "$pid_file")
		if [ ! "$(ibkr_process_running "$pid")" ] ;then
			rm "$pid_file"
			return 1
		fi
		echo "$pid"
	else
		return 1
	fi
}

if [ ! -d "$ibkr_portal" ]; then
	echo "Installing IBKR client portal to $ibkr_portal"
	ibkr_install
fi



#if [ "$2" == "kill" ]; then
#	if ! get_ibkr_pid; then
#		exit 1
#	fi
#	kill_ex_pid
#	exit 0
#fi
#
#
#if get_ibkr_pid; then
#	kill_ex_pid
#fi

#start_ibkr


