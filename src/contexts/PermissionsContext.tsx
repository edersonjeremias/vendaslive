import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSupabase } from './SupabaseContext';
import type { UserPermissions, UserRole } from '../types/permissions';

interface PermissionsContextType {
  isAdmin: boolean;
  permissions: UserPermissions;
  loading: boolean;
  error: string | null;
}

const defaultPermissions: UserPermissions = {
  canViewClients: false,
  canCreateClients: false,
  canEditClients: false,
  canDeleteClients: false,
  canViewSales: false,
  canCreateSales: false,
  canEditSales: false,
  canDeleteSales: false,
};

const PermissionsContext = createContext<PermissionsContextType>({
  isAdmin: false,
  permissions: defaultPermissions,
  loading: true,
  error: null,
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase();
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setIsAdmin(data.is_admin);
          setPermissions(data.permissions);
        }
      } catch (err: any) {
        console.error('Erro ao carregar permissões:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  return (
    <PermissionsContext.Provider value={{ isAdmin, permissions, loading, error }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}