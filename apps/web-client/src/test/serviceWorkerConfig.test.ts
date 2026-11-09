import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Service Worker & Robots Isolation (R-023, R-024)', () => {
  it('robots.txt existe y desautoriza el indexado de /admin y /auth/', () => {
    const robotsPath = resolve(import.meta.dirname, '../../public/robots.txt');
    const content = readFileSync(robotsPath, 'utf-8');

    expect(content).toContain('Disallow: /admin');
    expect(content).toContain('Disallow: /auth/');
  });

  it('vite.config.ts excluye /auth/ del Service Worker y aísla el chunk admin', () => {
    const viteConfigPath = resolve(import.meta.dirname, '../../vite.config.ts');
    const content = readFileSync(viteConfigPath, 'utf-8');

    // Denylist del Service Worker
    expect(content).toContain('/^\\/auth\\//');
    expect(content).toContain("globIgnores: ['**/admin*.js', '**/assets/admin*.js']");

    // manualChunks admin
    expect(content).toContain("return 'admin';");
  });
});
