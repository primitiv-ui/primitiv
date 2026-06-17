#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { spawnCommand } from './create-logic.mjs';

const { cmd, args, options } = spawnCommand(process.argv.slice(2));
const result = spawnSync(cmd, args, options);
process.exit(result.status ?? 1);
