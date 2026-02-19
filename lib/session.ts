import { headers } from "next/headers";
import { auth } from "./auth";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireServerUser() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

