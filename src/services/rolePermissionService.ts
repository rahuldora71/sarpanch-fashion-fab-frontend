import apiClient from "@/config/ApiClient";

export interface RoleDto {
  id: number;
  name: string;
}

export interface PermissionDto {
  id: number;
  permissionKey: string;
  resourceKey: string;
  action: string;
  displayName: string;
  description: string;
}

export interface AppResourceDto {
  id: number;
  resourceKey: string;
  displayName: string;
  category: string;
  route: string;
  description: string;
  sortOrder: number;
  active: boolean;
  permissions: PermissionDto[];
}

export interface RolePermissionItemDto {
  permissionId: number;
  permissionKey: string;
  resourceKey: string;
  resourceDisplayName: string;
  category: string;
  action: string;
  displayName: string;
  granted: boolean;
  locked: boolean;
}

export interface RolePermissionMatrixDto {
  roleId: number;
  roleName: string;
  systemRole: boolean;
  permissions: RolePermissionItemDto[];
}

export interface UpdateRolePermissionsRequest {
  permissionsMap?: Record<number, boolean>;
  grantedPermissionIds?: number[];
}

export interface UserAccessDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  enable: boolean;
  roles: RoleDto[];
  effectivePermissions: string[];
}

export interface UserRoleAssignmentRequest {
  roleIds: number[];
}

export interface AuditAccessLogDto {
  id: number;
  actorEmail: string;
  actionType: string;
  target: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export const getAllRoles = async (): Promise<RoleDto[]> => {
  const response = await apiClient.get<RoleDto[]>("/roles");
  return response.data;
};

export const getAllResources = async (): Promise<AppResourceDto[]> => {
  const response = await apiClient.get<AppResourceDto[]>("/roles/resources");
  return response.data;
};

export const getRolePermissions = async (
  roleId: number
): Promise<RolePermissionMatrixDto> => {
  const response = await apiClient.get<RolePermissionMatrixDto>(
    `/roles/${roleId}/permissions`
  );
  return response.data;
};

export const updateRolePermissions = async (
  roleId: number,
  data: UpdateRolePermissionsRequest
): Promise<{ message: string }> => {
  const response = await apiClient.put<{ message: string }>(
    `/roles/${roleId}/permissions`,
    data
  );
  return response.data;
};

export const getUsersWithAccess = async (): Promise<UserAccessDto[]> => {
  const response = await apiClient.get<UserAccessDto[]>("/roles/users");
  return response.data;
};

export const assignUserRoles = async (
  userId: number,
  roleIds: number[]
): Promise<{ message: string }> => {
  const response = await apiClient.put<{ message: string }>(
    `/roles/users/${userId}/role`,
    { roleIds }
  );
  return response.data;
};

export const getAuditLogs = async (): Promise<AuditAccessLogDto[]> => {
  const response = await apiClient.get<AuditAccessLogDto[]>("/roles/audit-logs");
  return response.data;
};
