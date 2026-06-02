import { InstrumentsRoot } from "./InstrumentsRoot";
import { InstrumentRow } from "./InstrumentRow";
import { InstrumentChart } from "./InstrumentChart";
import { SelectBroker } from "./SelectBroker";
import { SelectAccount } from "./SelectAccount";
import { SelectSector } from "./SelectSector";
import { SelectIndustry } from "./SelectIndustry";
import { SelectCountry } from "./SelectCountry";
import { SelectRegion } from "./SelectRegion";
import { SelectPlace } from "./SelectPlace";

export {
  InstrumentRow,
  InstrumentsRoot,
  InstrumentChart,
  SelectSector,
  SelectIndustry,
  SelectBroker,
  SelectAccount,
  SelectCountry,
  SelectRegion,
  SelectPlace,
};

customElements.define("instrmnts-root", InstrumentsRoot);
customElements.define("instrmnt-row", InstrumentRow);
customElements.define("instrmnt-chart", InstrumentChart);
customElements.define("select-broker", SelectBroker);
customElements.define("select-account", SelectAccount);
customElements.define("select-sector", SelectSector);
customElements.define("select-industry", SelectIndustry);
customElements.define("select-country", SelectCountry);
customElements.define("select-region", SelectRegion);
customElements.define("select-place", SelectPlace);
