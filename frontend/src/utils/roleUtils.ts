/**
 * Helper utility to format user roles for UI display.
 * Translates backend role enum MANAGER to human-readable "Sales Representative".
 */
export const formatRoleDisplay = (role?: string | null): string => {
  if (!role) return '';
  const normalized = role.toUpperCase();
  switch (normalized) {
    case 'MANAGER':
      return 'Sales Representative';
    case 'ADMIN':
      return 'Administrator';
    case 'DELIVERY':
      return 'Delivery Agent';
    default:
      return role;
  }
};
