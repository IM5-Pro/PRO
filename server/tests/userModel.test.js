import User from '../src/models/User.js';
import Roles from '../src/constants/roles.js';

describe('User schema', () => {
  test('adds a partial unique index for the SUPER_ADMIN role', () => {
    const roleIndexes = User.schema.indexes().filter(([keys]) => keys.role === 1);

    expect(roleIndexes.length).toBeGreaterThan(0);

    const superAdminIndex = roleIndexes.find(([, options]) => options?.partialFilterExpression?.role === Roles.SUPER_ADMIN);

    expect(superAdminIndex).toBeDefined();
    expect(superAdminIndex?.[1]?.unique).toBe(true);
  });
});
