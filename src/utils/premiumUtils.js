/**
 * Returns true when user has active premium OR active trial access.
 * Works from the user object stored in Redux/localStorage.
 */
export function isPremiumOrTrial(user) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'premium') return true;
  const sub = user.subscription;
  if (!sub) return false;
  if (sub.status === 'trial' && sub.expiresAt) {
    return new Date() < new Date(sub.expiresAt);
  }
  return false;
}

/**
 * Returns trial info for UI display.
 * { isTrial, isExpired, daysLeft, hoursLeft }
 */
export function getTrialInfo(user) {
  const sub = user?.subscription;
  if (!sub || sub.status !== 'trial') {
    return { isTrial: false, isExpired: false, daysLeft: 0, hoursLeft: 0 };
  }
  const now     = Date.now();
  const expiry  = new Date(sub.expiresAt).getTime();
  const msLeft  = expiry - now;
  const isExpired = msLeft <= 0;
  const daysLeft  = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  return { isTrial: true, isExpired, daysLeft, hoursLeft };
}
