import type { App } from "@frontend/App";

declare global {
  interface Window {
    app: App;
  }
}

export {};
