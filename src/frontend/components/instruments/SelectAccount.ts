import { Select } from "@frontend/components/widgets";

export class SelectAccount extends Select {
  static observedAttributes = ["broker", "a_id"];
  constructor() {
    super();

    this.dom.set_label("account", "Account:");
    this.props.watch("a_id", this.handlers.render);
    this.props.watch("broker", this.handlers.broker);
    this.select_el.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.dom.add_option("all");
      this.accounts.forEach((o) =>
        this.dom.add_option(o.name, o.value, o.broker),
      );
      this.dom.add_option("Select a broker", "hidden", "hidden");
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.select.apply_select("a_id", value);
    },
    broker: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.select.apply_select("a_id", "all");
      p.new === "all" ? this.dom.disable_options() : this.dom.enable_options();
    },
  };

  private props = this.api.props({});
  private dom = {
    ...this.base_dom,
    enable_options: () => {
      this.select_el.disabled = false;
      this.select_el.value = "all";
      this.querySelectorAll("option").forEach((option) => {
        const class_name = option.className;
        const hidden = !!class_name && class_name !== this.broker;
        option.hidden = hidden;
      });
    },
    disable_options: () => {
      this.select_el.disabled = true;
      this.select_el.value = "hidden";
      this.querySelectorAll("option").forEach((option) => {
        const class_name = option.className;
        option.hidden = class_name !== "hidden";
      });
    },
  };

  private get accounts() {
    return this.cache.accounts.reduce(
      (c, account) => {
        c.push({
          name: account.alias || account.a_id_original,
          value: account.a_id_original,
          broker: account.broker,
        });
        return c;
      },
      [] as { name: string; value: string; broker: string }[],
    );
  }

  private get broker() {
    return this.getAttribute("broker")!;
  }
}
