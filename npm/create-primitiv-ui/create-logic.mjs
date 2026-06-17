export function spawnCommand(extraArgs) {
  return {
    cmd: 'npx',
    args: ['primitiv-ui@latest', 'init', ...extraArgs],
    options: { stdio: 'inherit', shell: true },
  };
}
