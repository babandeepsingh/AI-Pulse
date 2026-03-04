import jwt from 'jsonwebtoken';

export function generateToken(user: any) {
  return jwt.sign(user, process.env.JWT_SECRET!, {
    expiresIn: '1d',
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
