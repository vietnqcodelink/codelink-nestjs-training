import { Prisma } from '../generated/prisma/client';

type PrismaErrorCode = 'P2002' | 'P2003' | 'P2025';

export function isPrismaError(
  error: unknown,
  code: PrismaErrorCode,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}
