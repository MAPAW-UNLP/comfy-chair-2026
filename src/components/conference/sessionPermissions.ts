import type { User } from '@/services/auth';
import type { Conference } from './ConferenceApp';

export function canManageSessions(
  user: User | null,
  conference?: Conference | null
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return conference?.chairs?.includes(Number(user.id)) ?? false;
}
