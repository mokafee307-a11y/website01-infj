import assert from "node:assert/strict";
import test from "node:test";

test("renders the finished INFJ cognitive system metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
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

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /INFJ 认知操作系统/);
  assert.doesNotMatch(html, /codex-preview/);
  for (const person of ["jung", "frankl", "hesse", "dostoevsky", "kierkegaard", "camus"]) {
    assert.ok(html.includes(`/portraits/${person}.webp`), `Missing portrait for ${person}`);
  }
  assert.doesNotMatch(html, /three-button-particles/);
  const panels = [...html.matchAll(/<section\b[^>]*role="tabpanel"[^>]*>/g)].map(([tag]) => tag);
  assert.equal(panels.length, 6, "Every workspace module must have a tab panel");
  assert.equal(panels.filter(tag => !/\bhidden(?:=|\s|>)/.test(tag)).length, 1, "Only one module is visible on first render");
  for (const id of ["now", "map", "lab", "boundary", "salon", "archive"]) {
    assert.match(html, new RegExp(`id="tab-${id}"[^>]*role="tab"[^>]*aria-controls="${id}"`));
    assert.ok(panels.some(tag => tag.includes(`aria-labelledby="tab-${id}"`)));
  }
  assert.doesNotMatch(html, /class="hero"|class="manifesto"/);
});
