import { storageService } from './storageService';

/**
 * Authentication and RBAC permission evaluation service.
 */
export const authService = {
  /**
   * Get currently active session user.
   */
  getCurrentUser() {
    return storageService.getActiveUser();
  },

  /**
   * Evaluate if a user has a specific permission based on their assigned role.
   */
  hasPermission(user, permissionId, rolesList) {
    if (!user) return false;

    // Direct role lookup from rolesList or storage
    const roles = rolesList || storageService.getRoles();
    const userRole = roles.find((r) => r.id === user.role);

    if (!userRole) return false;

    // Administrator always has access to all permissions
    if (userRole.id === 'admin') return true;

    return userRole.permissions.includes(permissionId);
  },

  /**
   * Mock login / user switch.
   */
  login(user) {
    storageService.setActiveUser(user);
    return user;
  },

  /**
   * Logout.
   */
  logout() {
    storageService.clearActiveUser();
  },
};
