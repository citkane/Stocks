import type * as components from "@frontend/components";

type component_t = InstanceType<typeof HTMLElement>;
type callback_t = (data: any) => any;

type subkeys_t<T> = T extends any ? keyof T : never;
type components_key_t = keyof typeof components;
export type component_key_t = subkeys_t<(typeof components)[components_key_t]>;

export type event_data_t = { action: string; data: any };

export class Events {
  listen(component: component_t, topic: component_key_t, callback: callback_t) {
    const _callback = (e: Event) =>
      callback((e as unknown as { detail: event_data_t }).detail);

    if (!this.listeners.has(topic))
      this.listeners.set(topic, new Set<component_t>());
    const components = this.listeners.get(topic)!;
    component.addEventListener(topic, _callback);
    components.add(component);
  }
  dispatch(topic: component_key_t, data: event_data_t) {
    const _data = { detail: data };
    const event = new CustomEvent(topic, _data);
    this.listeners
      .get(topic)
      ?.forEach((listener) => listener.dispatchEvent(event));
  }
  message(action: string, data?: any): event_data_t {
    return { action, data };
  }

  private listeners = new Map<component_key_t, Set<component_t>>();
}
