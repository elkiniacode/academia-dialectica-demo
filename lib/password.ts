import bcrypt from "bcryptjs";

const WEAK_PASSWORDS = [
  "12345678",
  "password",
  "contraseña",
  "qwerty12",
  "abcd1234",
  "admin123",
  "password1",
  "123456789",
  "1234567890",
  "iloveyou",
  "qwerty123",
  "abc12345",
  "welcome1",
  "monkey123",
  "dragon12",
  "master12",
  "letmein1",
  "trustno1",
  "sunshine1",
  "princess1",
];

export function validatePassword(plain: string): string | null {
  const trimmed = plain.trim();
  if (trimmed.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (WEAK_PASSWORDS.includes(trimmed.toLowerCase()))
    return "Contraseña demasiado débil";
  // Reject passwords that are all the same character
  if (/^(.)\1+$/.test(trimmed))
    return "Contraseña demasiado débil";
  // Require at least one letter and one number
  if (!/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(trimmed) || !/\d/.test(trimmed))
    return "La contraseña debe incluir al menos una letra y un número";
  return null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain.trim(), 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain.trim(), hash);
}
