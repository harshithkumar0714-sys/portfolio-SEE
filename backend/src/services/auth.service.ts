import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";

const publicUser = <T extends { passwordHash: string }>(user: T) => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

export async function register(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("An account with this email already exists", 409);
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
  });
  return { user: publicUser(user), token: createToken(user.id, user.role) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Email or password is incorrect", 401);
  }
  return { user: publicUser(user), token: createToken(user.id, user.role) };
}

export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return publicUser(user);
}

function createToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });
}
