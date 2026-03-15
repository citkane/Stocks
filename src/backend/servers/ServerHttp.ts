import index_html from "@frontend/index.html";

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
      //fetch: (req) => {
      //  const url = new URL(req.url).pathname;
      //  console.log(url);
      //
      //  if (url.endsWith(".css")) return this.serve_css(url);
      //  if (url.startsWith("/") || url.endsWith(".html"))
      //    return this.serve_html(url);
      //  return new Response("Not Found", { status: 404 });
      //  //return this.serve_css(req);
      //},
      routes: {
        "/css/*": this.get_css,
        "/*": index_html,
      },
    });
  }
  //private serve_html = async (url: string) => {
  //  const html = await Bun.file("./src/frontend/index.html").text();
  //  return new Response(index_html.files, {
  //    headers: { "Content-Type": "text/html" },
  //  });
  //};
  private get_css = {
    async GET(req: Request) {
      let filepath = new URL(req.url).pathname;
      filepath = `${css_root}${filepath}`;
      //console.log(filepath);
      const css = await Bun.file(filepath).text();
      return new Response(css, {
        headers: {
          "Content-Type": "text/css",
          "Cache-Control": "no-store",
        },
      });
    },
    //const filePath = `${css_root}${pathname}`;
    //const file = Bun.file(filePath);
    //const css = (await file.exists()) ? await file.text() : false;
    //return !!css
    //  ? new Response(css, {
    //      headers: {
    //        "Cache-Control": "no-cache",
    //        "Content-Type": "text/css",
    //      },
    //    })
    //  : new Response("Not Found", { status: 404 });
  };

  private http: ReturnType<typeof this.make_http_server>;
}
