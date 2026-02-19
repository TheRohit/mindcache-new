import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export default async function SignInPage() {
  try {
    const session = await getSession();
    if (session?.user) redirect("/dashboard");
  } catch {
    // allow page to render even if session check fails
  }

  return (
    <div className="min-h-svh bg-muted flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AuthForm />
      </div>
    </div>
  );
}
