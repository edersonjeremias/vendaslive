import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, CheckCircle, XCircle, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePermissions } from '../../contexts/PermissionsContext';
import type { UserRole } from '../../types/permissions';

interface ExtendedUserRole extends UserRole {
  users: {
    email: string;
    user_metadata: {
      full_name: string;
    };
  };
}

function UsersPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: permissionsLoading } = usePermissions();
  const [users, setUsers] = useState<ExtendedUserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!permissionsLoading && !isAdmin) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [permissionsLoading, isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          users:user_id (
            email,
            user_metadata
          )
        `)
        .order('created_at');

      if (error) throw error;

      setUsers(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (userId: string, permission: keyof UserRole['permissions']) => {
    const user = users.find(u => u.user_id === userId);
    if (!user) return;

    const updatedPermissions = {
      ...user.permissions,
      [permission]: !user.permissions[permission],
    };

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ permissions: updatedPermissions })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev =>
        prev.map(u =>
          u.user_id === userId
            ? { ...u, permissions: updatedPermissions }
            : u
        )
      );
    } catch (err: any) {
      console.error('Erro ao atualizar permissões:', err);
      setError(err.message);
    }
  };

  const handleAdminChange = async (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_admin: !user.is_admin })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev =>
        prev.map(u =>
          u.user_id === userId
            ? { ...u, is_admin: !u.is_admin }
            : u
        )
      );
    } catch (err: any) {
      console.error('Erro ao atualizar status de admin:', err);
      setError(err.message);
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"></div>
        <p className="ml-3 text-gray-400">Carregando usuários...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Gerenciar Usuários
        </h1>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Permissões
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-200">
                        {user.users.user_metadata.full_name}
                      </div>
                      <div className="text-sm text-gray-400">{user.users.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleAdminChange(user.user_id)}
                    className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user.is_admin
                        ? 'bg-violet-900/50 text-violet-300'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    {user.is_admin ? 'Admin' : 'Usuário'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Clientes</h4>
                      <div className="space-y-1">
                        {Object.entries(user.permissions)
                          .filter(([key]) => key.includes('Client'))
                          .map(([key, value]) => (
                            <button
                              key={key}
                              onClick={() => handlePermissionChange(user.user_id, key as keyof UserRole['permissions'])}
                              className={`flex items-center text-sm w-full px-2 py-1 rounded ${
                                value
                                  ? 'bg-green-900/30 text-green-300'
                                  : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              {value ? (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              {key.replace('can', '').replace('Clients', '')}
                            </button>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Vendas</h4>
                      <div className="space-y-1">
                        {Object.entries(user.permissions)
                          .filter(([key]) => key.includes('Sales'))
                          .map(([key, value]) => (
                            <button
                              key={key}
                              onClick={() => handlePermissionChange(user.user_id, key as keyof UserRole['permissions'])}
                              className={`flex items-center text-sm w-full px-2 py-1 rounded ${
                                value
                                  ? 'bg-green-900/30 text-green-300'
                                  : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              {value ? (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              {key.replace('can', '').replace('Sales', '')}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersPage;