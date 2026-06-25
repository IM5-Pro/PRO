/**
 * Verifies ROLE_PERMISSIONS matrix covers portal nav API probes.
 * Run: node scripts/verifyPortalNavPermissions.js
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import path from 'path';
import { hasPermission } from '../src/config/permissions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, '../../client/src/config/portalNavManifest.js');
const manifestSource = readFileSync(manifestPath, 'utf8');
if (!manifestSource.includes('PORTAL_NAV_API_PROBES')) {
  console.error('Could not find PORTAL_NAV_API_PROBES in portalNavManifest.js');
  process.exit(1);
}

const { PORTAL_NAV_API_PROBES } = await import(pathToFileURL(manifestPath).href);

const unrestricted = new Set(['SUPER_ADMIN', 'HR_ADMIN']);
let failures = 0;

for (const [role, pages] of Object.entries(PORTAL_NAV_API_PROBES)) {
  for (const page of pages) {
    const probes = page.apiProbes || [];
    if (!probes.length) continue;
    if (unrestricted.has(role)) continue;

    for (const { resource, action } of probes) {
      if (!hasPermission(role, resource, action)) {
        console.error(`FAIL ${role} / ${page.id}: missing ${resource}.${action}`);
        failures += 1;
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} permission gap(s). Update server/src/config/permissions.js`);
  process.exit(1);
}

console.log('OK: All portal nav API probes are allowed in ROLE_PERMISSIONS for scoped roles.');
