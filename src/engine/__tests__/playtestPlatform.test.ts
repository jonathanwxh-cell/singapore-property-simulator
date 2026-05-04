import { describe, expect, it } from 'vitest';
import { createDevServerCommand, createWindowsKillCommand } from '../../../scripts/playtest-platform.mjs';

describe('playtest smoke platform helpers', () => {
  it('uses Windows shell wrappers only on win32', () => {
    const windowsCommand = createDevServerCommand(5173, 'win32');
    const linuxCommand = createDevServerCommand(5173, 'linux');

    expect(windowsCommand).toMatchObject({
      command: 'cmd.exe',
      options: {
        detached: false,
        shell: false,
      },
    });
    expect(windowsCommand.args).toEqual([
      '/c',
      'npm.cmd',
      'run',
      'dev',
      '--',
      '--host',
      '127.0.0.1',
      '--strictPort',
      '--port',
      '5173',
    ]);

    expect(linuxCommand).toMatchObject({
      command: 'npm',
      options: {
        detached: true,
        shell: false,
      },
    });
  });

  it('keeps Windows process-tree killing isolated to win32', () => {
    expect(createWindowsKillCommand(1234)).toEqual({
      command: 'taskkill.exe',
      args: ['/pid', '1234', '/t', '/f'],
    });
  });
});
