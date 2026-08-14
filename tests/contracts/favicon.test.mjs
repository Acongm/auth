import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readOpaqueRgb(path) {
  const data = readFileSync(path);
  const size = data.readUInt32LE(14);
  const imageOff = data.readUInt32LE(18);
  const headerSize = data.readUInt32LE(imageOff);
  const xorOff = imageOff + headerSize;
  for (let i = xorOff; i < xorOff + size; i += 4) {
    const a = data[i + 3];
    if (a > 200) return [data[i + 2], data[i + 1], data[i]];
  }
  return null;
}

test('auth site uses a green portal 聪 favicon', () => {
  const layout = readFileSync('apps/auth/app/layout.tsx', 'utf8');
  assert.match(layout, /icon: "\/favicon.ico"/);
  assert.deepEqual(readOpaqueRgb('apps/auth/public/favicon.ico'), [34, 197, 94]);
});
