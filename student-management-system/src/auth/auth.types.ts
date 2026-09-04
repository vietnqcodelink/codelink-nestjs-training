import type { AuthenticatedUser } from './auth.select';

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthenticatedUser;
}
