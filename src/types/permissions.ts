export interface UserPermissions {
  canViewClients: boolean;
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
  canViewSales: boolean;
  canCreateSales: boolean;
  canEditSales: boolean;
  canDeleteSales: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  is_admin: boolean;
  permissions: UserPermissions;
  created_at: string;
}