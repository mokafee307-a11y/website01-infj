import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntryTiming, ENTRY_START_RATE, ENTRY_FADE_SECONDS } from '../app/launch-timing.ts';

test('entry plays at normal speed throughout without acceleration', () => {
  let previousRemaining = Infinity;
  for (let time = 0; time <= 10; time += 0.125) {
    const timing = getEntryTiming(time, 10);
    assert.equal(timing.playbackRate, 1);
    assert.ok(timing.remainingSeconds < previousRemaining);
    assert.ok(timing.opacity >= 0 && timing.opacity <= 1);
    previousRemaining = timing.remainingSeconds;
  }
  assert.equal(getEntryTiming(0, 10).playbackRate, ENTRY_START_RATE);
  assert.equal(getEntryTiming(10, 10).playbackRate, ENTRY_START_RATE);
  assert.equal(getEntryTiming(10, 10).opacity, 0);
});

test('fade is linear over the final half-second at normal speed', () => {
  const duration = 10;
  for (const remaining of [1, 0.5, 0.25, 0.1, 0]) {
    const mediaTime = duration - remaining;
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
  assert.equal(getEntryTiming(-1, 10).playbackRate, ENTRY_START_RATE);
  assert.equal(getEntryTiming(11, 10).opacity, 0);
  assert.equal(getEntryTiming(0, 0.1).opacity, 1);
});
