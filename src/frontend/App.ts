import { Api } from "./Api";
import { Brokers } from "./brokers"
import { Cache } from "./Cache";
import { ClientWs } from "./servers"

export class App {
	constructor() {
		this.cache = new Cache()
		this.api = new Api()
		this.ws = new ClientWs(this)
		this.brokers = new Brokers(this);

		this.api.init(this);
		window.addEventListener("beforeunload", this.shutdown)
	}
	get topics() {
		const { api } = this;
		type key_t = keyof typeof api;

		return Object.keys(api).filter((topic) => {
			return typeof api[topic as key_t] === "function" && topic !== "get_topics"
		})
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
			console.info("App ready")
		} catch (err) {
			console.error("ERROR", err)
		}
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
	private shutdown_tasks: Function[] = [];
}
