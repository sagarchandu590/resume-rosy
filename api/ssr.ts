// Vercel Serverless Function that hands every request off to the
// TanStack Start SSR entry produced by `vite build`.
import handler from "../dist/server/server.js";

export default async function (request: Request) {
  return handler.fetch(request, process.env, {});
}

export const config = {
  runtime: "nodejs20.x",
};
