import { App } from "./App";

export type { App } from "./App";
export type { Api } from "./Api";

const browser_script = "./src/scripts/browser.sh";
const app = new App();

await Bun.spawn([browser_script, app.http.url])
