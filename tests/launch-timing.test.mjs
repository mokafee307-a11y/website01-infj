import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntryTiming, ENTRY_START_RATE, ENTRY_FADE_SECONDS, ENTRY_MAX_SECONDS } from '../app/launch-timing.ts';
import { prepareFirstModule } from '../app/launch-navigation.ts';

test('launch always prepares the first module without smooth scrolling or losing query/history state', () => {
  for (const hash of ['', '#salon', '#cards', '#explore', '#map']) {
    const calls = [], state = { preserved: true };
    const view = {
      location: { pathname: '/website01-infj/', search: '?preview=1', hash },
      history: { state, replaceState: (...args) => calls.push(['history', ...args]) },
      scrollTo: options => calls.push(['scroll', options]),
    };
    prepareFirstModule(view);
    assert.deepEqual(calls, [
      ['history', state, '', '/website01-infj/?preview=1#map'],
      ['scroll', { top: 0, left: 0, behavior: 'instant' }],
    ]);
  }
});

test('entry plays at a constant speed and completes within 3.5 viewing seconds', () => {
  let previousRemaining = Infinity;
  for (let time = 0; time <= 10; time += 0.125) {
    const timing = getEntryTiming(time, 10);
    assert.equal(timing.playbackRate, 10 / ENTRY_MAX_SECONDS);
    assert.ok(timing.remainingSeconds < previousRemaining);
    assert.ok(timing.opacity >= 0 && timing.opacity <= 1);
    previousRemaining = timing.remainingSeconds;
  }
  for (const duration of [0.1, 3, 3.5, 4.966667, 10]) {
    const timing = getEntryTiming(0, duration);
    assert.ok(duration / timing.playbackRate <= ENTRY_MAX_SECONDS + 1e-10);
    assert.ok(timing.playbackRate >= 1);
    assert.equal(timing.playbackRate, getEntryTiming(duration, duration).playbackRate);
  }
  assert.equal(getEntryTiming(10, 10).opacity, 0);
});

test('fade stays linear over the final half-second of viewing time at the faster rate', () => {
  const duration = 10;
  for (const remaining of [1, 0.5, 0.25, 0.1, 0]) {
    const mediaTime = duration - remaining * getEntryTiming(0, duration).playbackRate;
    const timing = getEntryTiming(mediaTime, duration);
    assert.ok(Math.abs(timing.remainingSeconds - remaining) < 1e-10);
    assert.ok(Math.abs(timing.opacity - Math.min(1, remaining / ENTRY_FADE_SECONDS)) < 1e-10);
  }
});

test('unknown metadata and out-of-range timestamps remain safe', () => {
  for (const duration of [0, NaN, Infinity]) {
    assert.equal(getEntryTiming(0, duration).opacity, 1);
    assert.equal(getEntryTiming(0, duration).playbackRate, ENTRY_START_RATE);
  }
  assert.equal(getEntryTiming(-1, 10).opacity, 1);
  assert.equal(getEntryTiming(11, 10).opacity, 0);
  assert.equal(getEntryTiming(0, 0.1).opacity, 1);
});
