import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';

const processes = [
  {
    name: 'api',
    command: 'node',
    args: ['server/index.js'],
  },
  {
    name: 'web',
    command: 'npx',
    args: ['vite', '--host', '127.0.0.1'],
  },
];

const children = processes.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: isWindows,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] finalizou com erro ${code}`);
    }
  });

  return child;
});

function stopAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on('SIGINT', () => {
  stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(0);
});
