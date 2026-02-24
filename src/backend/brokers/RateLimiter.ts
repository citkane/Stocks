type fetch_fnc = () => Promise<Response>;
type fetcher = [fetch_fnc, resolve_t, resolve_t]

export class RateLimiter {
	constructor(private rate: number) {
		this.start_interval();
	}
	fetch = (fnc: fetch_fnc) => {
		return new Promise((resolve, reject) => {
			this.req_queue.push([fnc, resolve, reject]);
		}) as Promise<Response>;
	}
	private start_interval = () => {
		return setInterval(() => {
			if (!this.req_queue.length) return;
			const [fetch_fnc, resolve, reject] = this.req_queue.pop()!;

			fetch_fnc()
				.then((res) => res.ok ? resolve(res) : reject(res))
				.catch(err => reject(err));
		}, this.rate)
	}
	private req_queue: fetcher[] = []
}
