/**
 * Admin Configuration
 * 
 * Add email addresses of users who should have admin access to the review page.
 * 
 * For production, consider using Firebase Custom Claims instead:
 * https://firebase.google.com/docs/auth/admin/custom-claims
 */

export const ADMIN_EMAILS: string[] = [
  // Add admin email addresses here
  // 'admin@rit.edu',
  // 'moderator@rit.edu',
];

/**
 * Check if an email is in the admin list
 */
export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if a user has admin privileges based on custom claims or email
 */
export function isAdmin(user: { email?: string | null; customClaims?: any }): boolean {
  // Check custom claims first (recommended for production)
  if (user.customClaims?.admin === true || user.customClaims?.role === 'admin') {
    return true;
  }
  
  // Fallback to email whitelist
  return isAdminEmail(user.email || null);
}
