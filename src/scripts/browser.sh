#!/usr/bin/env bash
url="$1"
function browser_open {

	if [ -n "$BROWSER" ] && command -v "$BROWSER" >/dev/null 2>&1; then
		echo "BROWSER"
		"$BROWSER" "$url"
	elif command -v xdg-open >/dev/null 2>&1; then
		echo "XDG"
	  	xdg-open "$url"
	else
		echo "FIREFOX"
		firefox "$url"
	fi
}

browser_open



