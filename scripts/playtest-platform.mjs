import process from 'node:process';

export function createDevServerCommand(port, platform = process.platform) {
  const isWindows = platform === 'win32';
  const npmArgs = ['run', 'dev', '--', '--host', '127.0.0.1', '--strictPort', '--port', String(port)];

  return {
    command: isWindows ? 'cmd.exe' : 'npm',
    args: isWindows ? ['/c', 'npm.cmd', ...npmArgs] : npmArgs,
    options: {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      detached: !isWindows,
    },
  };
}

export function createWindowsKillCommand(pid) {
  return {
    command: 'taskkill.exe',
    args: ['/pid', String(pid), '/t', '/f'],
  };
}
