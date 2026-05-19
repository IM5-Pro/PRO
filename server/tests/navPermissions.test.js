import { readFileSync } from 'fs';
import path from 'path';
import { hasPermission } from '../src/config/permissions.js';

const manifestPath = path.resolve(process.cwd(), '../client/src/config/portalNavManifest.js');
const manifestSource = readFileSync(manifestPath, 'utf8');
const probeMatch = manifestSource.match(/PORTAL_NAV_API_PROBES\s*=\s*(\{[\s\S]*?\n\});/);

if (!probeMatch) {
  throw new Error('Could not parse PORTAL_NAV_API_PROBES from portalNavManifest.js');
}

// eslint-disable-next-line no-eval
const PORTAL_NAV_API_PROBES = eval(`(${probeMatch[1]})`);

const unrestricted = new Set(['SUPER_ADMIN', 'HR_ADMIN']);

describe('portal nav permission probes', () => {
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
