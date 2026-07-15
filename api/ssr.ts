// Vercel Serverless Function that adapts the incoming Node.js request into a
// Fetch API `Request` and hands it to the TanStack Start SSR entry produced by
// `vite build`.
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

import handler from "../dist/server/server.js";

export const config = {
  runtime: "nodejs",
};

export default async function (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const request = toFetchRequest(req);
    const response = await handler.fetch(request, process.env, {});
    await sendFetchResponse(res, response);
  } catch (error) {
    console.error("[ssr] handler failed", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
    }
    res.end("Internal Server Error");
  }
}

function toFetchRequest(req: IncomingMessage): Request {
  const forwardedProto = firstHeader(req.headers["x-forwarded-proto"]);
  const forwardedHost = firstHeader(req.headers["x-forwarded-host"]);
  const hostHeader = firstHeader(req.headers.host);

  const protocol =
    forwardedProto ??
    ((req.socket as { encrypted?: boolean } | undefined)?.encrypted
      ? "https"
      : "http");
  const host = forwardedHost ?? hostHeader ?? "localhost";
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const method = (req.method ?? "GET").toUpperCase();
  const init: RequestInit & { duplex?: "half" } = { method, headers };

  if (method !== "GET" && method !== "HEAD") {
    init.body = Readable.toWeb(req) as unknown as BodyInit;
    init.duplex = "half";
  }

  return new Request(url.toString(), init);
}

async function sendFetchResponse(
  res: ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const nodeStream = Readable.fromWeb(
    response.body as unknown as import("node:stream/web").ReadableStream,
  );
  await new Promise<void>((resolve, reject) => {
    nodeStream.pipe(res);
    nodeStream.on("end", () => resolve());
    nodeStream.on("error", reject);
  });
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
