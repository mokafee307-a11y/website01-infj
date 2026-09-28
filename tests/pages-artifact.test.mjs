import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = resolve('dist-pages');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const assets = await readdir(resolve(root, 'assets'));

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
