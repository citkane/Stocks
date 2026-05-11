#!/usr/bin/env bash

ibkr_pid_file="$temp_dir/ibkr.pid"
ibkr_portal="clientportal.beta.gw"
ibkr_portal_dir=".ibkr_portal"
ibkr_conf="conf.yaml"
ibkr_download=https://download2.interactivebrokers.com/portal/${ibkr_portal}.zip

function ibkr_install {
	zip_file="./$ibkr_portal.zip"
	[ ! -f $zip_file ] && wget $ibkr_download
	unzip $zip_file -d "./$ibkr_portal_dir"
	rm $zip_file
}

function ibkr_start {
	ibkr_running && 
	echo "IBKR portal already running" && 
	return 1

	export RUNTIME_PATH=\
"$ibkr_portal_dir\
:$ibkr_portal_dir/root\
:$ibkr_portal_dir/dist/ibgroup.web.core.iblink.router.clientportal.gw.jar\
:$ibkr_portal_dir/build/lib/runtime/*"

	
	java \
	-server \
	-Dvertx.disableDnsResolver=true \
	-Djava.net.preferIPv4Stack=true \
	-Dvertx.logger-delegate-factory-class-name=io.vertx.core.logging.SLF4JLogDelegateFactory \
	-Dnologback.statusListenerClass=ch.qos.logback.core.status.OnConsoleStatusListener \
	-Dnolog4j.debug=true \
	-Dnolog4j2.debug=true \
	-cp "${RUNTIME_PATH}" ibgroup.web.core.clientportal.gw.GatewayStart \
	--conf ./$ibkr_conf \
	 > "$log_dir/ibkr.log" &

	ibkr_pid=$!
	echo "$ibkr_pid" > "$ibkr_pid_file"
	echo "IBKR portal running on pid $ibkr_pid"

}

function ibkr_restart {
	ibkr_stop
	sleep 3
	ibkr_start
	sleep 3
}

function ibkr_stop {
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



