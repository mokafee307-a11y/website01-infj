// Layout is independent of the inner card's proportions and hover transforms.
export const orbitDelta = (value: number, count: number) => ((value + count / 2) % count + count) % count - count / 2;
export function orbitOpacity(distance: number) {
  const stops = [1, .75, .35, .25];
  const index = Math.min(2, Math.floor(distance));
  return stops[index] + (stops[index + 1] - stops[index]) * Math.min(1, distance - index);
}
export function orbitSlots(width: number, cardWidth: number) {
  const perspective = 1100, gap = Math.max(10, Math.min(18, width * .009));
  const slots = [{ x: 0, z: 0, yaw: 0, right: cardWidth / 2 }];
  for (let k = 1; k <= 5; k++) {
    const yaw = Math.min(58, 34 * .38 * Math.pow(k, .65));
    const rad = yaw * Math.PI / 180, z = -cardWidth * .075 * k * k;
    const halfX = cardWidth / 2 * Math.cos(rad), halfZ = cardWidth / 2 * Math.sin(rad);
    const x = (slots[k - 1].right + gap) * (perspective - z - halfZ) / perspective + halfX;
    slots.push({ x, z, yaw, right: (x + halfX) * perspective / (perspective - z + halfZ) });
  }
  return slots;
}
export function fitOrbitWidth(width: number) {
  let low = 60, high = width / 2;
  for (let i = 0; i < 18; i++) {
    const mid = (low + high) / 2;
    if (orbitSlots(width, mid)[3].right > width / 2 - 24) high = mid;
    else low = mid;
  }
  return low;
}
