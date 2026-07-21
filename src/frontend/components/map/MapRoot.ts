import { LandingComponent } from "@frontend/components/LandingComponent";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export class MapRoot extends LandingComponent {
  static observedAttributes = ["instruments"];

  constructor() {
    super();
    this.dom.template_to_self("map-root");
    this.props.watch("instruments", this.handlers.render);
    this.make_map();
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
      this.instruments.forEach((i) => {
        this.place_point(i);
        this.region_shape(i);
      });
    },
  };

  private dom = this.api.dom({});
  private props = this.api.props({});
  private make_map = () => {
    this.map = new maplibregl.Map({
      container: "map_container", // container id
      style: "https://demotiles.maplibre.org/globe.json", // style URL
      center: [0, 0], // starting position [lng, lat]
      zoom: 2, // starting zoom
    });
    this.map.addControl(new maplibregl.FullscreenControl());
  };
  private place_point = (instrmnt: filter.instrmnt) => {
    const { place_point, place_qid } = instrmnt;
    if (!place_point || this.place_points[place_qid]) return;
    const coord = place_point.split(",").map(Number) as [number, number];
    this.place_points[place_qid] = new maplibregl.Marker()
      .setLngLat(coord)
      .addTo(this.map);
  };
  private region_shape = (instrmnt: filter.instrmnt) => {
    const { region_qid, region_shape, region } = instrmnt;
    if (!region_shape || this.region_shapes[region_qid]) return;
    const shape = JSON.parse(region_shape);
    this.region_shapes[region_qid] = shape.data;
    this.map.addSource(region, {
      type: "geojson",
      data: shape.data,
    });
    this.map.addLayer({
      id: `${region}_boundary`,
      type: "fill",
      source: region,
      paint: {
        "fill-color": "#888888",
        "fill-opacity": 0.4,
      },
      filter: ["==", "$type", "Polygon"],
    });
  };

  private get instruments() {
    return Object.values(this.cache.instruments);
  }

  private map!: maplibregl.Map;
  private place_points = {} as { [qid: string]: maplibregl.Marker };
  private region_shapes = {} as { [qid: string]: {} };
}
