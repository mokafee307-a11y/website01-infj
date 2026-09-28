import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntryTiming, ENTRY_START_RATE, ENTRY_END_RATE, ENTRY_FADE_SECONDS } from '../app/launch-timing.ts';

test('entry speed increases from normal speed to 5x without jumping backwards', () => {
  let previousRate = 0;
  let previousRemaining = Infinity;
  for (let time = 0; time <= 10; time += 0.125) {
    const timing = getEntryTiming(time, 10);
    assert.ok(timing.playbackRate > previousRate);
    assert.ok(timing.remainingSeconds < previousRemaining);
    assert.ok(timing.opacity >= 0 && timing.opacity <= 1);
    previousRate = timing.playbackRate;
    previousRemaining = timing.remainingSeconds;
  }
  assert.equal(getEntryTiming(0, 10).playbackRate, ENTRY_START_RATE);
  assert.equal(getEntryTiming(10, 10).playbackRate, ENTRY_END_RATE);
  assert.equal(getEntryTiming(10, 10).opacity, 0);
});

test('fade is linear over the final half-second of viewing time, not media time', () => {
  const duration = 10;
  const range = ENTRY_END_RATE - ENTRY_START_RATE;
  for (const remaining of [1, 0.5, 0.25, 0.1, 0]) {
    const rate = ENTRY_END_RATE * Math.exp(-remaining * range / duration);
    const mediaTime = duration * (rate - ENTRY_START_RATE) / range;
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
