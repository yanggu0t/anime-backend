import { Hono } from "hono";
import { MoeService } from "./services/api";
import { cors } from "hono/cors";
import { Context, Next } from "hono";

const app = new Hono();

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
      return null;
    },
    allowMethods: ["POST", "GET"],
    exposeHeaders: ["Content-Length"],
    // maxAge: 600,
    credentials: true,
  })
);

// Middleware for performing pre-checks
const preCheckMiddleware = async (c: Context, next: Next) => {
  const preCheck = await MoeService.checkStatus();
  if (!preCheck) {
    // If the pre-check fails, respond with a 429 (Too Many Requests) or appropriate status
    return c.json(
      {
        status: 429,
        message: "Pre-check failed: Quota exceeded or service unavailable.",
      },
      429
    );
  }
  // If the pre-check passes, proceed with the next middleware or route handler
  return next();
};

console.log(`================${Date()}===============`);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Middleware for POST routes
app.use("/v1/*", preCheckMiddleware); // Apply preCheckMiddleware to all POST routes under '/v1/'

app.post("/v1/url", async (c) => {
  try {
    const req = await c.req.json();
    const { url } = req;
    // If the pre-check passes, proceed with the main request
    const res = await MoeService.searchByUrl(url);
    return c.json(
      {
        status: res.status,
        res: res,
      },
      200
    );
  } catch (error) {
    console.error("Error in /v1/url route:", error);
    if (error instanceof Error) {
      // If it's an Error instance, we can safely access message, name, stack, etc.
      return c.json(
        {
          status: 400,
          message: error.message,
        },
        400
      );
    } else {
      // If it's not an Error instance, handle or log appropriately
      return c.json(
        {
          status: 400,
          message: "An unknown error occurred",
        },
        400
      );
    }
  }
});

app.post("/v1/upload", async (c) => {
  const contentType = c.req.header("Content-Type");
  if (contentType?.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    const file = formData.get("file");

    console.log();

    if (file && file instanceof File) {
      try {
        const res = await MoeService.searchByUpload(file);
        return c.json(res);
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ message: error.message }, 500);
        }
      }
    } else {
      return c.json(
        {
          status: 400,
          message: "No file uploaded or invalid file type.",
        },
        400
      );
    }
  } else {
    return c.json(
      {
        status: 400,
        message: "Invalid content type.",
      },
      400
    );
  }
});

export default app;
