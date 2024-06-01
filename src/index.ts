import { Hono } from "hono";
import { Moe } from "./services/api";
import { cors } from "hono/cors";

const app = new Hono();
const moe = new Moe();

// 使用 CORS 中间件，允许来自 anime1.work 和 localhost 的请求
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (
        origin === "https://anime1.work" ||
        origin?.startsWith("http://localhost")
      ) {
        return origin;
      }
      return null; // 如果 origin 不匹配，拒绝请求
    },
    allowMethods: ["POST", "GET"],
    exposeHeaders: ["Content-Length"],
    // maxAge: 600,
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

console.log(`================${Date()}===============`);

app.post("/v1/url", async (c) => {
  try {
    const req = await c.req.json();
    const { url } = req;
    const res = await moe.searchByUrl(url);
    return c.json(
      {
        test: 200,
        res: res,
      },
      200
    );
  } catch (error) {
    console.error("Error in /v1 route:", error);
    // 捕获解析 JSON 时的错误，并返回 400 错误响应
    return c.json(
      {
        error: error,
      },
      400
    );
  }
});

export default app;
