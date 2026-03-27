import { Select } from "@frontend/components/widgets";

export class SelectAccount extends Select {
  static observedAttributes = ["broker"];
  constructor() {
    super();

    this.dom.set_label("account", "Account:");
    this.dom.disable_options();
    this.props.watch("broker", this.handlers.render);
    this.select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      if (this.broker === "all") return this.dom.disable_options();

      this.dom.remove_options();
      this.select.disabled = false;
      this.dom.add_option("all", "");
      this.options.forEach((o) => this.dom.add_option(o.name, o.value));
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.dom.stocks_root.setAttribute("account", value);
    },
  };

  private props = this.api.props({});
  private dom = {
    ...this.base_dom,
    remove_options: () => {
      this.querySelectorAll("option").forEach((option) => option.remove());
    },
    disable_options: () => {
      this.select.disabled = true;
      this.dom.remove_options();
      this.dom.add_option("Select a broker");
    },
  };

  private get options() {
    return this.cache.accounts.reduce(
      (c, account) => {
        if (account.broker !== this.broker) return c;
        c.push({
          name: account.alias || account.a_id_original,
          value: account.a_id_original,
        });
        return c;
      },
      [] as { name: string; value: string }[],
    );
  }

  private get broker() {
    return this.getAttribute("broker")!;
  }
}
