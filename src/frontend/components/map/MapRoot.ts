import { LandingComponent } from "@frontend/components/LandingComponent";
import maplibregl from "maplibre-gl";
import { type GeoJSON } from "geojson"; // or from maplibre-gl's re-exports
import "maplibre-gl/dist/maplibre-gl.css";

export class MapRoot extends LandingComponent {
  static observedAttributes = ["instrmnts"];

  constructor() {
    super();

    const { dom, props, handlers, make_map } = this;
    dom.template_to_self("map-root");
    props.watch("instrmnts", handlers.render);
    make_map();
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { map, instruments, place_point, region_shape } = this;
      map.once("idle", () => {
        instruments.forEach((i) => {
          place_point(i);
          region_shape(i);
        });
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
  private place_point = (instrmnt: g.meta_view) => {
    const { place_qid } = instrmnt.geo;
    if (!place_qid) return;

    const { cache, map, place_points } = this;
    const { geo_point } = cache.get.geo(place_qid!);
    if (!geo_point || place_points[place_qid]) return;

    place_points[place_qid] = new maplibregl.Marker()
      .setLngLat(geo_point)
      .addTo(map);
  };

  private region_shape = (instrmnt: g.meta_view) => {
    const { region_qid } = instrmnt.geo;
    if (!region_qid) return;

    const { cache, map } = this;
    const { geo_shape, name } = cache.get.geo(region_qid!);

    if (!region_qid || !!map.getSource(name)) return;
    if (!geo_shape?.data) return;

    map
      .addSource(name, {
        type: "geojson",
        data: geo_shape.data as GeoJSON,
      })
      .addLayer({
        id: `${name}_boundary`,
        type: "fill",
        source: name,
        paint: {
          "fill-color": "#888888",
          "fill-opacity": 0.4,
        },
        //   filter: ["==", "$type", "Polygon"],
      });
  };

  private get instruments() {
    return Object.values(this.cache.get.instrmnts());
  }

  private map!: maplibregl.Map;
  private place_points = {} as { [qid: string]: maplibregl.Marker };
  // private region_shapes = {} as { [qid: string]: {} };
}
