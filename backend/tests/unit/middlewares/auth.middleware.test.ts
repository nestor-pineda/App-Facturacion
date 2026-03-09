import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '@/api/middlewares/auth.middleware';
import { env } from '@/config/env';

const makeReq = (cookies: Record<string, string> = {}) =>
  ({ cookies } as unknown as Request);

const makeRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

const makeNext = () => vi.fn() as unknown as NextFunction;

describe('authenticate middleware', () => {
  it('should call next() and set req.user with a valid accessToken cookie', () => {
    // Arrange
    const userId = 'abc-123';
    const token = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '1h' });
    const req = makeReq({ accessToken: token });
    const res = makeRes();
    const next = makeNext();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: userId });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 NO_TOKEN when accessToken cookie is absent', () => {
    // Arrange
    const req = makeReq({});
    const res = makeRes();
    const next = makeNext();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NO_TOKEN' }),
      }),
    );
  });

  it('should return 401 INVALID_TOKEN when token is malformed', () => {
    // Arrange
    const req = makeReq({ accessToken: 'this.is.not.a.valid.jwt' });
    const res = makeRes();
    const next = makeNext();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
      }),
    );
  });

  it('should return 401 INVALID_TOKEN when token is expired', () => {
    // Arrange - token con exp en el pasado
    const userId = 'abc-123';
    const expiredToken = jwt.sign(
      { userId, exp: Math.floor(Date.now() / 1000) - 3600 },
      env.JWT_SECRET,
    );
    const req = makeReq({ accessToken: expiredToken });
    const res = makeRes();
    const next = makeNext();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
      }),
    );
  });

  it('should return 401 INVALID_TOKEN when token is signed with a different secret', () => {
    // Arrange
    const userId = 'abc-123';
    const wrongSecretToken = jwt.sign({ userId }, 'wrong-secret-min-32-chars-padding-xx', {
      expiresIn: '1h',
    });
    const req = makeReq({ accessToken: wrongSecretToken });
    const res = makeRes();
    const next = makeNext();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
      }),
    );
  });
});
