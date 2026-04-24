import { genSalt, hash } from "bcryptjs";

export async function saltAndHashPassword(password: string) {
  const salt = await genSalt(10);
  return await hash(password, salt);
}
