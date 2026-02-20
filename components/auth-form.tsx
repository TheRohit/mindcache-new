"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { FingerPrintScanIcon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { signInSchema, signUpSchema } from "@/lib/validations";
import type { SignInValues, SignUpValues } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

let conditionalUIStarted = false;

function SignInFields({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [isPasskeyPending, startPasskeyTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const busy = isSubmitting || isPasskeyPending || isGooglePending;

  const onSubmit = async (data: SignInValues) => {
    const { error } = await authClient.signIn.email(data);
    if (error) {
      setError("root", { message: error.message ?? "Sign in failed." });
      return;
    }
    router.push("/dashboard");
  };

  function handlePasskey() {
    startPasskeyTransition(async () => {
      const { error } = await authClient.signIn.passkey();
      if (error) {
        setError("root", { message: error.message ?? "Passkey sign-in failed." });
        return;
      }
      router.push("/dashboard");
    });
  }

  function handleGoogleSignIn() {
    startGoogleTransition(async () => {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (error) {
        setError("root", { message: error.message ?? "Google sign-in failed." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your MindCache account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username webauthn"
            disabled={busy}
            className="h-11 bg-muted/50 border-border focus:border-primary transition-colors"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Password
            </Label>
            <a
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Forgot?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password webauthn"
            disabled={busy}
            className="h-11 bg-muted/50 border-border focus:border-primary transition-colors"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        {errors.root && (
          <div className="rounded-none bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-destructive text-sm">{errors.root.message}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full font-semibold"
          disabled={busy}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/40" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground/60 uppercase tracking-widest">
            or
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full gap-2"
          onClick={handlePasskey}
          disabled={busy}
        >
          <HugeiconsIcon icon={FingerPrintScanIcon} size={16} />
          {isPasskeyPending ? "Waiting for passkey…" : "Sign in with passkey"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full gap-2.5"
          onClick={handleGoogleSignIn}
          disabled={busy}
        >
          {/* Google logo */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isGooglePending ? "Redirecting…" : "Continue with Google"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sign up free
        </button>
      </p>
    </div>
  );
}

function SignUpFields({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpValues) => {
    const { error } = await authClient.signUp.email(data);
    if (error) {
      setError("root", { message: error.message ?? "Sign up failed." });
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1
          className="text-2xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Create account
        </h1>
        <p className="text-sm text-muted-foreground">
          Your second brain awaits
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            disabled={isSubmitting}
            className="h-11 bg-muted/50 border-border focus:border-primary transition-colors"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="su-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Email
          </Label>
          <Input
            id="su-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            disabled={isSubmitting}
            className="h-11 bg-muted/50 border-border focus:border-primary transition-colors"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="su-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Password
          </Label>
          <Input
            id="su-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            className="h-11 bg-muted/50 border-border focus:border-primary transition-colors"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        {errors.root && (
          <div className="rounded-none bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-destructive text-sm">{errors.root.message}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account…" : "Get started"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </button>
      </p>

      <p className="text-center text-xs text-muted-foreground/60">
        By continuing, you agree to our{" "}
        <a href="/terms" className="underline underline-offset-4 hover:text-muted-foreground transition-colors">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-muted-foreground transition-colors">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}

function AuthDecorative() {
  const features = [
    { icon: "📝", label: "Notes", color: "type-badge-note" },
    { icon: "🌐", label: "Websites", color: "type-badge-website" },
    { icon: "▶", label: "YouTube", color: "type-badge-youtube" },
    { icon: "𝕏", label: "Tweets", color: "type-badge-tweet" },
  ];

  const memories = [
    {
      type: "website",
      title: "The Feynman Technique for Learning",
      domain: "fs.blog",
      time: "2 hours ago",
    },
    {
      type: "note",
      title: "Build systems that outlast motivation",
      time: "Yesterday",
    },
    {
      type: "youtube",
      title: "How Diffusion Models Work",
      channel: "Andrej Karpathy",
      time: "3 days ago",
    },
  ];

  return (
    <div className="relative flex h-full flex-col justify-between gap-8 overflow-hidden p-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-20 h-[300px] w-[300px] rounded-full bg-primary/12 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 h-[250px] w-[250px] rounded-full bg-primary/8 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="relative">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="relative flex size-8 items-center justify-center rounded-none bg-primary/20 border border-primary/30">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="text-primary">
              <circle cx="7" cy="3" r="2" fill="currentColor" />
              <circle cx="3" cy="10" r="1.5" fill="currentColor" opacity="0.7" />
              <circle cx="11" cy="10" r="1.5" fill="currentColor" opacity="0.7" />
              <line x1="7" y1="5" x2="3" y2="8.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="7" y1="5" x2="11" y2="8.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="3" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
          <span className="text-sm font-bold text-foreground/80" style={{ fontFamily: "var(--font-display)" }}>
            MindCache
          </span>
        </div>

        <h2
          className="text-3xl font-bold leading-tight text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Capture everything.
          <br />
          <span className="text-primary">Forget nothing.</span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Your personal knowledge base with AI-powered semantic search.
          Save from anywhere, find anything instantly.
        </p>
      </div>

      {/* Source types */}
      <div className="relative flex flex-wrap gap-2">
        {features.map((f) => (
          <span
            key={f.label}
            className={cn("inline-flex items-center gap-1.5 rounded-none px-3 py-1 text-xs font-medium", f.color)}
          >
            <span>{f.icon}</span>
            {f.label}
          </span>
        ))}
      </div>

      {/* Mini memory cards preview */}
      <div className="relative space-y-2.5">
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">
          Recent memories
        </p>
        {memories.map((m, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-none border border-border/40 bg-background/40 px-3.5 py-3 backdrop-blur-sm"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-none text-[9px]",
                m.type === "note" && "type-badge-note",
                m.type === "website" && "type-badge-website",
                m.type === "youtube" && "type-badge-youtube",
              )}
            >
              {m.type === "note" ? "📝" : m.type === "website" ? "🌐" : "▶"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground/90">{m.title}</p>
              <p className="text-[11px] text-muted-foreground/60">
                {m.domain ?? m.channel ?? ""}{m.domain || m.channel ? " · " : ""}{m.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  useEffect(() => {
    if (conditionalUIStarted) return;
    conditionalUIStarted = true;

    if (!window.PublicKeyCredential?.isConditionalMediationAvailable) {
      conditionalUIStarted = false;
      return;
    }

    let cancelled = false;

    PublicKeyCredential.isConditionalMediationAvailable().then((available) => {
      if (!available || cancelled) {
        conditionalUIStarted = false;
        return;
      }
      authClient.signIn.passkey({ autoFill: true }).then(({ error }) => {
        if (!cancelled && !error) router.push("/dashboard");
        // AbortError is expected when the user navigates away — not a real error
      });
    });

    return () => {
      cancelled = true;
      conditionalUIStarted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="overflow-hidden rounded-none border-2 border-border bg-card shadow-2xl md:grid md:grid-cols-[1fr_1.1fr]">
        {/* Form side */}
        <div className="p-8 md:p-10">
          {mode === "sign-in" ? (
            <SignInFields onSwitch={() => setMode("sign-up")} />
          ) : (
            <SignUpFields onSwitch={() => setMode("sign-in")} />
          )}
        </div>

        {/* Decorative side */}
        <div className="hidden bg-muted/30 dark:bg-primary/5 md:block border-l border-border/40">
          <AuthDecorative />
        </div>
      </div>
    </div>
  );
}
