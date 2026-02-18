import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const isAdmin = () => user?.role === 'admin';
  const isManager = () => user?.role === 'manager';
  const isRecruiter = () => user?.role === 'recruiter';

  const canViewAllData = () => isAdmin();
  const canViewTeamData = () => isAdmin() || isManager();
  const canManageUsers = () => isAdmin();
  const canManageTeams = () => isAdmin();
  const canSetGoals = () => isAdmin() || isManager();

  return {
    hasRole,
    isAdmin,
    isManager,
    isRecruiter,
    canViewAllData,
    canViewTeamData,
    canManageUsers,
    canManageTeams,
    canSetGoals,
    user,
  };
}
