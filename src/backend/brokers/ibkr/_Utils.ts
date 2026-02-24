import { RateLimiter } from "../RateLimiter.ts";
import type * as ibkr from "../../../types/ibkr_t.ts"

const limit_rate = 1000 / 10;
const url_base = "localhost:5000/v1/api";
const pid_file = `${process.cwd()}/ibkr_pid`;
const bash_script = "./src/scripts/ibkr.sh"

export class Utils {

	private urls = {
		api: `https://${url_base}`,
		ws: `wss://${url_base}/ws`,
		tickle: `https://${url_base}/tickle`
	}
	protected endpoints = {
		status: () => "iserver/auth/status",
		accounts: () => "portfolio/accounts",
		positions: (account_id: string) => `portfolio2/${account_id}/positions?direction=a&sort=position`,
		position: (account_id: string, con_id: number) => `portfolio/${account_id}/position/${con_id}`
	}

	protected get_status(): Promise<ibkr.status_t> {
		return this.fetch(this.endpoints.status())
			.then(res => res.json())
			.then(json => json)

	}


	/**
	 * Polls the Client Portal server until the connection is authorised
	 */
	private poll_status(resolve: Function) {
		setTimeout(async () => {
			try {
				const status = await this.get_status();
				if (!status.authenticated) {
					this.poll_status(resolve)
				} else { resolve() }

			} catch (err) {
				this.poll_status(resolve);
			}
		}, 1000)
	}
	/**
	 * Spawns and then connects to the Client Portal server
	 */
	protected connect = () => {
		console.log("IBKR is not authorised. Please log in from the browser.")
		Bun.spawn(["bash", bash_script, pid_file], { stdout: "inherit", stderr: "inherit" });
		return new Promise(resolve => this.poll_status(resolve))
	}
	/**
	 * Disconnects from and shuts down the Client Portal server
	 */
	protected disconnect = () => {
		console.log("disconnect")
		Bun.spawn(["bash", bash_script, pid_file, "kill"], { stderr: "inherit", stdout: "inherit" })
	}
	protected fetch(endpoint: string, params: RequestInit = {}, base_url = this.urls.api) {
		const req = new Request(`${base_url}/${endpoint}`);
		params = {
			...params, ...{
				tls: { rejectUnauthorized: false }
			}
		}
		return this.limiter.fetch(() => fetch(req, params));
	}

	protected parsed_positions: ibkr.position_t[] = [];
	protected limiter = new RateLimiter(limit_rate);
}
