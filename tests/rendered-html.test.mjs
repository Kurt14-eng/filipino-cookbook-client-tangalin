import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished cookbook experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Sarap Atlas \| Filipino Cookbook Explorer<\/title>/i);
  assert.match(html, /Find your next/);
  assert.match(html, /Filipino favorite/);
  assert.match(html, /Chicken Adobo/);
  assert.match(html, /The cookbook/);
  assert.match(html, /API developed by/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("does not hard-code a bearer token in the client source", async () => {
  const source = await readFile(
    new URL("../app/CookbookClient.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /type="password"/);
  assert.match(source, /Authorization: `Bearer \$\{source\.token\}`/);
  assert.doesNotMatch(
    source,
    /dmmmsu-cookbook-token|sk-[a-z0-9]|ghp_[a-z0-9]/i,
  );
  assert.match(source, /sessionStorage/);
  assert.match(source, /token: ""/);
});

