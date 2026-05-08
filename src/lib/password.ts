import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export const saltAndHashPassword = hashPassword;

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function passwordValidationError(password: string) {
  if (password.length < 8) return "رمز عبور حداقل ۸ کاراکتر باشد";
  if (!/[A-Z]/.test(password)) return "رمز عبور باید حداقل یک حرف بزرگ داشته باشد";
  if (!/[0-9]/.test(password)) return "رمز عبور باید حداقل یک عدد داشته باشد";
  return null;
}
