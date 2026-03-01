type window_t = ReturnType<typeof window.open>

type resolve_t = (value: any) => void;
type resolver_t = {
	resolve: resolve_t;
	reject: resolve_t;
}
type ws_t = Bun.ServerWebSocket | WebSocket;
type res_error_t = {
	status: number;
	statusText: string;
}
type req_t = {
	messenger: Messenger,
	req_uid: string
}

type currency_t = "EUR" | "HKD" | "CNH"
type broker_t = "saxo" | "ibkr";
type position_t = {
	id: string;
	original_id: string,
	broker: broker_t;
	account_id: string;
	description: string;
	ticker: string;
	currency: currency_t
	exchange: string
}
type account_t = {
	id: string;
	original_id: string,
	broker: broker_t;
	alias: string;
	currency: currency_t
}
type stock_t = {
	ticker: string;
	description: string;
	positions: Set<position_t>
}

interface Api_t {
	request: {
		[key: string]: (p: req_t, ...params: any[]) => void
	};
	set: {
		[key: string]: (...params: any[]) => void;
	}
	init: (app: Class) => void
}
