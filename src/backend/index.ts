import { App } from "./App";
//import { $ } from "bun";

export type { App } from "./App";
export type { Api } from "./Api";
export type { Messenger } from "../Messenger"

const browser_script = "./src/scripts/browser.sh";
const app = new App();

//wait app.brokers.start_ibkr_client_server();
//$`URL=${app.http.url} src/scripts/browser.sh`
await Bun.spawn([browser_script, app.http.url])
