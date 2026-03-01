import { Api } from "./Api";
import { Events } from "./Events"
import { Brokers } from "./brokers"
import { Cache } from "./Cache";
import { ClientWs } from "./servers"
import "../types/frontend"


export class App {
	constructor() {
		window.app = this;

		this.cache = new Cache()
		this.events = new Events();
		this.api = new Api()
		this.ws = new ClientWs(this)
		this.brokers = new Brokers(this);
		this.api.init(this);

		window.addEventListener("beforeunload", this.shutdown)
	}
	get set_topics() {
		return Object.keys(this.api.set)
	}
	async run() {
		try {
			console.info("App awaiting authorisation")
			await this.brokers.authorise();

			console.info("App awaiting accounts and positions")
			await Promise.all([
				this.brokers.get_accounts(),
				this.brokers.get_positions()
			])

			//this.events.dispatch("AccountsRoot", this.events.message("ready"))
			console.info("App ready")
		} catch (err) {
			//throw err;
			console.error(err)
		}
	}
	ready() {
		const app_element = document.getElementsByTagName("app-root")[0];
		app_element?.setAttribute("ready", "true")

		//this.events.dispatch("AppRoot", this.events.message("init", this))
	}

	add_shutdown_task(task: Function) {
		this.shutdown_tasks.push(task);
	}

	private shutdown = (e: Event) => {
		//e.preventDefault();
		Promise.all(this.shutdown_tasks.map(fnc => fnc(), []))
			.then(() => console.info("Shutting down"))
	}

	public brokers: Brokers
	public api: Api
	public ws: ClientWs
	public cache: Cache
	public events: Events
	private shutdown_tasks: Function[] = [];
}
