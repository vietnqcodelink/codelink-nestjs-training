import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_ROLE } from '../rbac/rbac.constants';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const userRecord = {
    id: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
    email: 'user@example.com',
    roles: [{ role: { name: SYSTEM_ROLE.USER } }],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const authenticatedUser = {
    ...userRecord,
    roles: [SYSTEM_ROLE.USER],
  };
  type LoginUser = typeof userRecord & { passwordHash: string };
  const createUser =
    jest.fn<
      (args: {
        data: { email: string; passwordHash: string };
      }) => Promise<typeof userRecord>
    >();
  const findUser =
    jest.fn<
      (args: { where: { email: string } }) => Promise<LoginUser | null>
    >();
  const signAsync = jest
    .fn<(payload: { sub: string }) => Promise<string>>()
    .mockResolvedValue('signed-access-token');
  const prisma = {
    user: { create: createUser, findUnique: findUser },
  } as unknown as PrismaService;
  const jwtService = { signAsync } as unknown as JwtService;
  const service = new AuthService(prisma, jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
    signAsync.mockResolvedValue('signed-access-token');
  });

  it('normalizes the email, hashes the password, and returns a safe response', async () => {
    let savedCredentials: { email: string; passwordHash: string } | undefined;
    createUser.mockImplementation(
      ({ data }: { data: { email: string; passwordHash: string } }) => {
        savedCredentials = data;
        return Promise.resolve(userRecord);
      },
    );

    const result = await service.register({
      email: '  USER@Example.com ',
      password: 'a sufficiently long password',
    });

    expect(savedCredentials).toBeDefined();
    if (!savedCredentials) {
      throw new Error('Expected credentials to be persisted');
    }
    expect(savedCredentials.email).toBe('user@example.com');
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roles: {
            create: {
              role: { connect: { name: SYSTEM_ROLE.USER } },
            },
          },
        }) as object,
      }),
    );
    await expect(
      argon2.verify(
        savedCredentials.passwordHash,
        'a sufficiently long password',
      ),
    ).resolves.toBe(true);
    expect(result).toEqual({
      accessToken: 'signed-access-token',
      tokenType: 'Bearer',
      user: authenticatedUser,
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(signAsync).toHaveBeenCalledWith({
      sub: userRecord.id,
    });
  });

  it('returns conflict when the normalized email already exists', async () => {
    createUser.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await expect(
      service.register({
        email: userRecord.email,
        password: 'a sufficiently long password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies credentials and never returns the password hash', async () => {
    const passwordHash = await argon2.hash('a sufficiently long password');
    findUser.mockResolvedValue({ ...userRecord, passwordHash });

    const result = await service.login({
      email: 'USER@example.com',
      password: 'a sufficiently long password',
    });

    expect(findUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: userRecord.email } }),
    );
    expect(result.user).toEqual(authenticatedUser);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects an unknown email with a generic error', async () => {
    findUser.mockResolvedValue(null);

    await expect(
      service.login({
        email: userRecord.email,
        password: 'a sufficiently long password',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        constructor: UnauthorizedException,
        message: 'Invalid email or password',
      }),
    );
  });

  it('rejects a wrong password with the same generic error', async () => {
    const passwordHash = await argon2.hash(
      'the actual sufficiently long password',
    );
    findUser.mockResolvedValue({ ...userRecord, passwordHash });

    await expect(
      service.login({
        email: userRecord.email,
        password: 'wrong password value',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        constructor: UnauthorizedException,
        message: 'Invalid email or password',
      }),
    );
  });
});
