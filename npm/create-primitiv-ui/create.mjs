#!/usr/bin/env node
// Entry point for `pnpm create primitiv-ui` / `npm create primitiv-ui`.
// Installs primitiv-ui as a dev dependency, then delegates to `primitiv init`.
import { execSync, spawnSync } from 'child_process';
import { existsSync } from 'fs';

const pm = existsSync('pnpm-lock.yaml') ? 'pnpm'
         : existsSync('yarn.lock') ? 'yarn'
         : existsSync('bun.lockb') ? 'bun'
         : 'npm';

const addCmd = pm === 'npm' ? 'install --save-dev' : 'add -D';

process.stdout.write(`\nInstalling primitiv-ui via ${pm}…\n`);
execSync(`${pm} ${addCmd} primitiv-ui`, { stdio: 'inherit' });

const args = process.argv.slice(2);
const result = spawnSync('primitiv', ['init', ...args], { stdio: 'inherit' });
process.exit(result.status ?? 1);
