import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnCommand } from './create-logic.mjs';

test('proxies to npx primitiv-ui@latest init with no extra args', () => {
  const { cmd, args } = spawnCommand([]);
  assert.equal(cmd, 'npx');
  assert.deepEqual(args, ['primitiv-ui@latest', 'init']);
});

test('forwards additional args to primitiv init', () => {
  const { cmd, args } = spawnCommand(['--yes', '--format', 'scss']);
  assert.deepEqual(args, ['primitiv-ui@latest', 'init', '--yes', '--format', 'scss']);
});

test('does not invoke a package manager to install primitiv-ui', () => {
  const { cmd } = spawnCommand([]);
  assert.ok(
    cmd !== 'npm' && cmd !== 'pnpm' && cmd !== 'yarn' && cmd !== 'bun',
    `expected npx, got: ${cmd}`
  );
});

test('enables shell mode for cross-platform npx resolution', () => {
  const { options } = spawnCommand([]);
  assert.equal(options.shell, true);
});
