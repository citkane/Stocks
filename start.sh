#!/usr/bin/env bash

ibkr_pid_file=".ibkr_pid"
saxo_token_file=".saxo_token"
app_index="src/backend/index.ts"

source src/scripts/ibkr.sh
source src/scripts/app.sh
#source src/scripts/browser.sh


ibkr_start
app_start


