#!/usr/bin/env bash

ibkr_pid_file="$temp_dir/ibkr.pid"
ibkr_portal="clientportal.gw"
ibkr_portal_dir=".ibkr_portal"
ibkr_conf="conf.yaml"
ibkr_download=https://download2.interactivebrokers.com/portal/${ibkr_portal}.zip
ibkr_api="https://localhost:5000/v1/api"

function ibkr_install {
	zip_file="./$ibkr_portal.zip"
	[ ! -f $zip_file ] && wget $ibkr_download
	unzip -o $zip_file -d "./$ibkr_portal_dir"
	rm $zip_file
}

function ibkr_start {
	ibkr_running &&
		echo "IBKR portal already running" &&
		return 1

	cd $ibkr_portal_dir
	bin/run.sh root/conf.yaml &>"$log_dir/ibkr.log" &
	ibkr_pid=$!
	cd $cwd

	echo "$ibkr_pid" >"$ibkr_pid_file"
	echo "IBKR portal running under pid $ibkr_pid"

}

function ibkr_restart {
	ibkr_stop
	sleep 3
	ibkr_start
	sleep 3
}

function ibkr_stop {
	! ibkr_running && return 0

	curl \
		--url "$ibkr_api/logout" \
		--header 'Content-Type:application/json' \
		--data '{}' \
		--connect-timeout 2 \
		--insecure \
		&>/dev/null

	process_stop "$ibkr_pid_file"
}

function ibkr_running {
	process_running "$ibkr_pid_file" && return 0
	return 1
}

if [ ! -d "$ibkr_portal_dir/bin" ]; then
	echo "Installing IBKR client portal to $ibkr_portal_dir"
	ibkr_install
fi
