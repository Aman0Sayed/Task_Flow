// Utility to check if the user is the manager
export function isManager(user?: { role?: string | null; email?: string | null }): boolean {
  if (!user) return false;

  const normalizedRole = user.role?.toLowerCase();
  if (normalizedRole) {
    return normalizedRole === 'manager' || normalizedRole === 'admin';
  }

  // Backward compatibility for legacy user objects that may not include role.
  return user.email === 'manager@gmail.com';
}
