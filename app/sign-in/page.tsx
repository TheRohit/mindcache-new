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
    <div className="relative min-h-[calc(100svh-56px)] flex items-center justify-center overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        {/* Dot grid */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="w-full max-w-sm px-4 py-12 sm:max-w-4xl sm:px-6">
        <AuthForm />
      </div>
    </div>
  );
}
