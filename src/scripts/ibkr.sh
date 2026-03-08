#!/usr/bin/env bash

ibkr_pid_file="$temp_dir/ibkr.pid"
ibkr_portal="clientportal.beta.gw"
ibkr_download=https://download2.interactivebrokers.com/portal/${ibkr_portal}.zip

function ibkr_install {
	zip_file="./$ibkr_portal.zip"
	[ ! -f $zip_file ] && wget $ibkr_download
	unzip $zip_file -d "./$ibkr_portal"
	rm $zip_file
}

function ibkr_start {
	ibkr_running && 
	echo "IBKR portal already running" && 
	return 1
	(
		cd $ibkr_portal || exit
		sh bin/run.sh root/conf.yaml > "$log_dir/ibkr.log" & child_pid=$!
		sleep 1
		java_pid=$(pgrep -P $child_pid java)
		echo "$java_pid" > "$ibkr_pid_file"
	)
}

function ibkr_stop {
	process_stop "$ibkr_pid_file"
}

function ibkr_running {
	process_running "$ibkr_pid_file" && return 0
	return 1
}

if [ ! -d "$ibkr_portal" ]; then
	echo "Installing IBKR client portal to $ibkr_portal"
	ibkr_install
fi



