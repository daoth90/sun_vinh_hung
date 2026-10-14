const test = require('node:test');
const assert = require('node:assert/strict');
const geometry = require('../assets/js/map-overlay-geometry.js');

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);

test('page corners preserve ground scale and aspect ratio at the equator', () => {
  const corners = geometry.pageCorners({ center: { lat: 0, lng: 0 }, widthMeters: 1000, rotationDegrees: 0 }, 200, 100);
  const nw = geometry.project(corners[0]);
  const ne = geometry.project(corners[1]);
  const sw = geometry.project(corners[2]);
  close(nw.x, -500);
  close(nw.y, -250);
  close(ne.x, 500);
  close(sw.y, 250);
});

test('rotation is clockwise and ground scale accounts for latitude', () => {
  const corners = geometry.pageCorners({ center: { lat: 60, lng: 0 }, widthMeters: 1000, rotationDegrees: 90 }, 200, 100);
  const center = geometry.project({ lat: 60, lng: 0 });
  const nw = geometry.project(corners[0]);
  const ne = geometry.project(corners[1]);
  close(nw.x - center.x, 500);
  close(nw.y - center.y, -1000);
  close(ne.x - nw.x, 0);
  close(ne.y - nw.y, 2000);
});

test('affine transform maps page corners and follows map pan and zoom', () => {
  const matrix = geometry.pageMatrix([{ x: 10, y: 20 }, { x: 10, y: 220 }, { x: -90, y: 20 }], 200, 100);
  assert.deepEqual(matrix, [0, 1, -1, 0, 10, 20]);
  const zoomed = geometry.pageMatrix([{ x: 50, y: 80 }, { x: 50, y: 480 }, { x: -150, y: 80 }], 200, 100);
  assert.deepEqual(zoomed, [0, 2, -2, 0, 50, 80]);
});

test('invalid alignment and page dimensions are rejected', () => {
  for (const invalid of [0, -10, NaN]) {
    assert.throws(() => geometry.pageCorners({ center: { lat: 21, lng: 105 }, widthMeters: invalid, rotationDegrees: 0 }, 200, 100));
  }
  assert.throws(() => geometry.pageCorners({ center: { lat: 90, lng: 105 }, widthMeters: 1000, rotationDegrees: 0 }, 200, 100));
  assert.throws(() => geometry.pageMatrix([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }], 0, 100));
});
