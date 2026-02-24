export type * as saxo_t from "./saxo_t";
export type * as ibkr_t from "./ibkr_t";
export type { data_t, topic_t, message_t } from "../Messenger"

export function blank_resolver(): resolver_t {
	return { resolve: () => { }, reject: () => { } };
}
