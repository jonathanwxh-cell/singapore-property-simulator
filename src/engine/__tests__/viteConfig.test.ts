import { describe, expect, it } from 'vitest';
import type { UserConfig, UserConfigFnObject } from 'vite';
import viteConfig from '../../../vite.config';

async function resolveViteConfig(mode: string): Promise<UserConfig> {
  if (typeof viteConfig === 'function') {
    return await (viteConfig as UserConfigFnObject)({
      command: mode === 'development' ? 'serve' : 'build',
      mode,
      isSsrBuild: false,
      isPreview: false,
    });
  }

  return viteConfig;
}

function pluginNames(config: UserConfig): string[] {
  return (config.plugins ?? [])
    .flat()
    .filter(Boolean)
    .map((plugin) => plugin && typeof plugin === 'object' && 'name' in plugin ? String(plugin.name) : '');
}

describe('vite config', () => {
  it('does not ship React inspect attributes in production builds', async () => {
    const productionConfig = await resolveViteConfig('production');
    const developmentConfig = await resolveViteConfig('development');

    expect(pluginNames(productionConfig)).not.toContain('vite-plugin-inspect-dom-simple');
    expect(pluginNames(developmentConfig)).toContain('vite-plugin-inspect-dom-simple');
  });
});
