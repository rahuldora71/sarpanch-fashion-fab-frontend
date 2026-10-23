export interface AuthRole {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  image: string | null;
  enable: boolean;
  createdAt: string;
  updatedAt: string;
  provider: string;
  roles: AuthRole[];
  effectivePermissions?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: AuthUser;
  effectivePermissions?: string[];
}
