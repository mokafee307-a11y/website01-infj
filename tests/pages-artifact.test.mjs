import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { categories, scenarioCards, defaultQuestion, getExampleId } from '../app/prototype-data.ts';

const root = resolve('dist-pages');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const assets = await readdir(resolve(root, 'assets'));

test('each category has seven complete cards and a balanced circular fan', () => {
  assert.equal(new Set(scenarioCards.map(card => card.id)).size, 21);
  for (const category of categories) {
    const cards = scenarioCards.filter(card => card.category === category);
    assert.equal(cards.length, 7);
    for (const card of cards) for (const value of Object.values(card)) assert.ok(value.trim());
    for (let active = 0; active < cards.length; active++) {
      const half = Math.floor(cards.length / 2);
      const offsets = cards.map((_, index) => ((index - active + cards.length + half) % cards.length) - half);
      assert.deepEqual(offsets.sort((a, b) => a - b), [-3, -2, -1, 0, 1, 2, 3]);
    }
  }
});

test('short manual demo input matches with either punctuation style', () => {
  assert.ok(defaultQuestion.length <= 45);
  assert.equal(getExampleId(defaultQuestion), 'career');
  assert.equal(getExampleId(` ${defaultQuestion.replaceAll('，', ',').replaceAll('。', '.').replaceAll('？', '?')}\n`), 'career');
  assert.equal(getExampleId('一个不同的新问题'), 'custom');
  assert.equal(getExampleId(''), 'custom');
});

test('static entry has metadata and portable, existing entry assets', async () => {
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>INFJ漫游飞船<\/title>/);
  assert.match(html, /id="root"/);
  const urls = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]);
  for (const url of urls.filter(value => !/^https?:/.test(value))) {
    assert.ok(url.startsWith('./'), `Entry URL must be relative: ${url}`);
    assert.ok((await stat(resolve(root, url))).isFile());
  }
});

test('CSS media URLs work from a GitHub Pages subdirectory', async () => {
  for (const name of assets.filter(name => name.endsWith('.css'))) {
    const path = resolve(root, 'assets', name);
    const css = await readFile(path, 'utf8');
    for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/g)) {
      const url = match[1] ?? match[2] ?? match[3];
      if (/^(data:|https?:|#)/.test(url)) continue;
      assert.ok(!url.startsWith('/'), `Root-relative CSS URL: ${url}`);
      assert.ok((await stat(resolve(dirname(path), url))).isFile());
    }
  }
});

test('all public assets are included unchanged', async () => {
  async function check(directory, relative = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const name = `${relative}${entry.name}`;
      if (entry.isDirectory()) await check(resolve(directory, entry.name), `${name}/`);
      else assert.deepEqual(await readFile(resolve(root, name)), await readFile(resolve(directory, entry.name)), name);
    }
  }
  await check(resolve('public'));
});

test('client bundle contains the launch experience without Sites runtime', async () => {
  const js = (await Promise.all(assets.filter(name => name.endsWith('.js')).map(name => readFile(resolve(root, 'assets', name), 'utf8')))).join('\n');
  assert.match(js, /cosmic-entry-v2\.mp4/);
  assert.match(js, /绿老头漫游飞船/);
  assert.doesNotMatch(js, /signin-with-chatgpt|chatgpt\.site|process\.env\.NEXT_PUBLIC_ASSET_BASE/);
});
