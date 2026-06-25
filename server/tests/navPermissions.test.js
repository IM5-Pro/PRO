import { readFileSync } from 'fs';
import path from 'path';
import { hasPermission } from '../src/config/permissions.js';

const manifestPath = path.resolve(process.cwd(), '../client/src/config/portalNavManifest.js');
const manifestSource = readFileSync(manifestPath, 'utf8');
if (!manifestSource.includes('PORTAL_NAV_API_PROBES')) {
  throw new Error('Could not find PORTAL_NAV_API_PROBES in portalNavManifest.js');
}

let PORTAL_NAV_API_PROBES = {};

const unrestricted = new Set(['SUPER_ADMIN', 'HR_ADMIN']);

describe('portal nav permission probes', () => {
  beforeAll(async () => {
    const manifestModule = await import(manifestPath);
    PORTAL_NAV_API_PROBES = manifestModule.PORTAL_NAV_API_PROBES;
  });

  test('scoped roles have matrix entries for each nav API probe', () => {
    const failures = [];

    for (const [role, pages] of Object.entries(PORTAL_NAV_API_PROBES)) {
      for (const page of pages) {
        const probes = page.apiProbes || [];
        if (!probes.length || unrestricted.has(role)) continue;

        for (const { resource, action } of probes) {
          if (!hasPermission(role, resource, action)) {
            failures.push(`${role} / ${page.id}: missing ${resource}.${action}`);
          }
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
