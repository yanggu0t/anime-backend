import { Hono } from "hono";
import { Moe } from "./services/api";

const app = new Hono();
const moe = new Moe();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

console.log(`================${Date()}===============`);

app.post("/v1", async (c) => {
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
