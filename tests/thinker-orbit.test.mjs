import test from 'node:test';
import assert from 'node:assert/strict';
import { fitOrbitWidth, orbitSlots, orbitOpacity, orbitDelta } from '../app/thinker-orbit.ts';

test('seven orbit cards fit desktop widths with uniform projected gaps', () => {
  for (const width of [900, 1280, 1440, 1920, 2560]) {
    const cardWidth = fitOrbitWidth(width), slots = orbitSlots(width, cardWidth);
    assert.ok(Math.abs(slots[3].right - (width / 2 - 24)) < .02);
    for (let k = 1; k <= 3; k++) {
      const slot = slots[k], rad = slot.yaw * Math.PI / 180;
      const left = (slot.x - cardWidth / 2 * Math.cos(rad)) * 1100 / (1100 - slot.z - cardWidth / 2 * Math.sin(rad));
      assert.ok(Math.abs(left - slots[k - 1].right - Math.max(10, Math.min(18, width * .009))) < .001);
      assert.ok(slot.right - left > 40);
    }
  }
});
test('depth opacity and circular motion match the approved demo', () => {
  assert.deepEqual([0, 1, 2, 3].map(orbitOpacity), [1, .75, .35, .25]);
  assert.equal(orbitOpacity(.5), .875);
  assert.equal(orbitDelta(9, 10), -1);
  assert.equal(orbitDelta(-9, 10), 1);
});
