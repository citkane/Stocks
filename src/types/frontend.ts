import type { App } from "../frontend";

declare global {
	interface Window {
		app: App
	}
}

export { }

