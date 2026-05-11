import index_html from "@frontend/index.html";
//import saxo_html from "@frontend/app/brokers/saxo/success.html";

const css_root = "./src/frontend";

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
        "/css/*": this.get_css,
        "/*": index_html,
      },
    });
  }

  private get_css = {
    async GET(req: Request) {
      let filepath = new URL(req.url).pathname;
      filepath = `${css_root}${filepath}`;
      const css = await Bun.file(filepath).text();
      return new Response(css, {
        headers: {
          "Content-Type": "text/css",
          "Cache-Control": "no-store",
        },
      });
    },
  };

  private http: ReturnType<typeof this.make_http_server>;
}
