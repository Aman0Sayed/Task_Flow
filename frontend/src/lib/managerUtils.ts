// Utility to check if the user is the manager
export function isManager(user?: { email?: string | null }): boolean {
  return user?.email === 'manager@gmail.com';
}
