import { hasRole, hasAnyRole, isAdmin, isHR, isManager, CurrentUser } from '@/types';

describe('Role Helpers', () => {
  const createUser = (roles: string[]): CurrentUser => ({
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    roles: roles as any[],
  });

  describe('hasRole', () => {
    it('returns true when user has the role', () => {
      const user = createUser(['ADMIN']);
      expect(hasRole(user, 'ADMIN')).toBe(true);
    });

    it('returns false when user does not have the role', () => {
      const user = createUser(['EMPLOYEE']);
      expect(hasRole(user, 'ADMIN')).toBe(false);
    });

    it('returns false for null user', () => {
      expect(hasRole(null, 'ADMIN')).toBe(false);
    });

    it('handles multiple roles', () => {
      const user = createUser(['EMPLOYEE', 'HR']);
      expect(hasRole(user, 'HR')).toBe(true);
      expect(hasRole(user, 'ADMIN')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('returns true when user has any of the roles', () => {
      const user = createUser(['EMPLOYEE', 'MANAGER']);
      expect(hasAnyRole(user, ['HR', 'MANAGER'])).toBe(true);
    });

    it('returns false when user has none of the roles', () => {
      const user = createUser(['EMPLOYEE']);
      expect(hasAnyRole(user, ['HR', 'ADMIN'])).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true for ADMIN role', () => {
      const user = createUser(['ADMIN']);
      expect(isAdmin(user)).toBe(true);
    });

    it('returns false for non-ADMIN roles', () => {
      const user = createUser(['HR', 'MANAGER']);
      expect(isAdmin(user)).toBe(false);
    });
  });

  describe('isHR', () => {
    it('returns true for HR role', () => {
      const user = createUser(['HR']);
      expect(isHR(user)).toBe(true);
    });

    it('returns true for ADMIN role (implicit HR access)', () => {
      const user = createUser(['ADMIN']);
      expect(isHR(user)).toBe(true);
    });

    it('returns false for EMPLOYEE role', () => {
      const user = createUser(['EMPLOYEE']);
      expect(isHR(user)).toBe(false);
    });
  });

  describe('isManager', () => {
    it('returns true for MANAGER role', () => {
      const user = createUser(['MANAGER']);
      expect(isManager(user)).toBe(true);
    });

    it('returns true for HR role', () => {
      const user = createUser(['HR']);
      expect(isManager(user)).toBe(true);
    });

    it('returns true for ADMIN role', () => {
      const user = createUser(['ADMIN']);
      expect(isManager(user)).toBe(true);
    });

    it('returns false for EMPLOYEE role only', () => {
      const user = createUser(['EMPLOYEE']);
      expect(isManager(user)).toBe(false);
    });
  });
});
