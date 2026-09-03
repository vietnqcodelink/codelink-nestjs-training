export interface AccessTokenPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export function isAccessTokenPayload(
  payload: unknown,
): payload is AccessTokenPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return typeof candidate.sub === 'string' && candidate.sub.length > 0;
}
