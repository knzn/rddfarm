import { cookies } from "next/headers";
import { verifyAccessToken, JWTPayload } from "@/lib/auth";

export async function getAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireAuthUser(): Promise<JWTPayload> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
