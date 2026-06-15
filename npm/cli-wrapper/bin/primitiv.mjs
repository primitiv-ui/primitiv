#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const require = createRequire(import.meta.url);

const PLATFORM_PACKAGES = {
  'darwin:arm64': '@primitiv-ui/cli-darwin-arm64',
  'darwin:x64':   '@primitiv-ui/cli-darwin-x64',
  'linux:x64':    '@primitiv-ui/cli-linux-x64-gnu',
  'linux:arm64':  '@primitiv-ui/cli-linux-arm64-gnu',
  'win32:x64':    '@primitiv-ui/cli-win32-x64',
};

const key = `${process.platform}:${process.arch}`;
const pkg = PLATFORM_PACKAGES[key];

if (!pkg) {
  process.stderr.write(
    `primitiv: unsupported platform (${process.platform}/${process.arch}).\n` +
    `Install from source: cargo install primitiv-cli\n`
  );
  process.exit(1);
}

let binaryPath;
try {
  const pkgDir = dirname(require.resolve(`${pkg}/package.json`));
  const binary = process.platform === 'win32' ? 'primitiv.exe' : 'primitiv';
  binaryPath = join(pkgDir, binary);
} catch {
  process.stderr.write(
    `primitiv: the ${pkg} platform package could not be found.\n` +
    `Try reinstalling: pnpm add -D primitiv-ui\n` +
    `Or install from source: cargo install primitiv-cli\n`
  );
  process.exit(1);
}

if (!existsSync(binaryPath)) {
  process.stderr.write(
    `primitiv: binary not found at ${binaryPath}.\n` +
    `Try: cargo install primitiv-cli\n`
  );
  process.exit(1);
}

const { status } = spawnSync(binaryPath, process.argv.slice(2), { stdio: 'inherit' });
process.exit(status ?? 1);
