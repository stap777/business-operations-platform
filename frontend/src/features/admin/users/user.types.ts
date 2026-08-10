export type UserRole = 'ADMIN' | 'MANAGER' | 'DELIVERY';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserResponse {
  id: number;
  fullName: string;
  username: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  firstLogin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  username: string;
  password: string;
  phoneNumber: string;
}

export interface UpdateUserRequest {
  fullName: string;
  phoneNumber: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UserQueryParams {
  query?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  size?: number;
}

export interface UserPageResponse {
  content: UserResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
