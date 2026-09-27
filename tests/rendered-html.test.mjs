import assert from "node:assert/strict";
import test from "node:test";

test("renders the monochrome four-module prototype", async () => {
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
  assert.match(html, /<strong>INFJ漫游飞船<\/strong>/);
  assert.match(html, /绿老头漫游飞船/);
  assert.match(html, /开始漫游/);
  assert.match(html, /class="launch-workspace" inert="" aria-hidden="true"/);
  assert.doesNotMatch(html, /codex-preview/);
  assert.match(html, /交互原型/);
  assert.match(html, /非实测分数/);
  assert.match(html, /未接入模型/);
  assert.doesNotMatch(html, /刷新即清空|刷新将清空|class="tab-number"/);
  for (const person of ["荣格", "弗兰克尔", "黑塞", "陀思妥耶夫斯基", "克尔凯郭尔", "托尔斯泰", "柏拉图", "斯宾诺莎", "马丁·路德·金", "曼德拉"]) {
    assert.ok(html.includes(person), `Missing thinker ${person}`);
  }
  assert.doesNotMatch(html, /three-button-particles/);
  const panels = [...html.matchAll(/<section\b[^>]*class="module-panel scroll-section"[^>]*>/g)].map(([tag]) => tag);
  assert.equal(panels.length, 4, "Exactly four independent anchored sections");
  assert.equal(panels.filter(tag => !/\bhidden(?:=|\s|>)/.test(tag)).length, 4, "All four sections are available by page scrolling");
  for (const id of ["map", "cards", "explore", "salon"]) {
    assert.match(html, new RegExp(`id="tab-${id}"[^>]*href="#${id}"`));
    assert.ok(panels.some(tag => tag.includes(`aria-labelledby="heading-${id}"`)));
  }
  assert.doesNotMatch(html, /class="hero"|class="manifesto"/);
  assert.doesNotMatch(html, /交互原型正在补全此模块/);
  assert.match(html, /class="card-deck"/);
  assert.match(html, /class="flip-rotator"/);
  assert.match(html, /class="thinker-rail"/);
});
