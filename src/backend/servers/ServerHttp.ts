import * as conf from "conf";
import index_html from "@frontend/index.html";

export class ServerHttp {
  constructor() {
    this.http = this.make_http_server(conf.http_port);
  }
  get url() {
    return this.http.url.toString();
  }
  private make_http_server(port: number) {
    return Bun.serve({
      port,
      routes: {
        "/*": index_html,
      },
    });
  }
  private http: ReturnType<typeof this.make_http_server>;
}
