import type { Request } from 'express';

export interface RequestUser {
  id: string;
}

export type AuthenticatedRequest = Request & {
  user?: RequestUser;
};
