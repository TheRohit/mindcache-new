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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Rule: advanced-init-once — module-level guard prevents StrictMode's
// double-invoke from starting two parallel Conditional UI flows.
let conditionalUIStarted = false;

// Rule: rendering-hoist-jsx — static JSX hoisted outside the render tree
// so it is never re-created across sign-in/sign-up switches.
const authDivider = (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-border" />
    </div>
    <div className="relative flex justify-center text-xs">
      <span className="bg-background px-2 text-muted-foreground uppercase tracking-widest">
        or
      </span>
    </div>
  </div>
);

// ─── Explicit variant: sign-in ────────────────────────────────────────────────

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [isPasskeyPending, startPasskeyTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const disabled = isSubmitting || isPasskeyPending;

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
        setError("root", { message: error.message ?? "Passkey sign in failed." });
        return;
      }
      router.push("/dashboard");
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username webauthn"
            disabled={disabled}
            {...register("email")}
          />
          {errors.email !== undefined ? (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password webauthn"
            disabled={disabled}
            {...register("password")}
          />
          {errors.password !== undefined ? (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          ) : null}
        </div>

        {/* Rule: rendering-conditional-render — explicit ternary, not && */}
        {errors.root !== undefined ? (
          <p className="text-destructive text-sm">{errors.root.message}</p>
        ) : null}

        <Button type="submit" className="w-full h-9" disabled={disabled}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {authDivider}

      <Button
        type="button"
        variant="outline"
        className="w-full h-9 gap-2"
        onClick={handlePasskey}
        disabled={disabled}
      >
        <HugeiconsIcon icon={FingerPrintScanIcon} size={16} />
        {isPasskeyPending ? "Waiting for passkey…" : "Sign in with passkey"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

// ─── Explicit variant: sign-up ────────────────────────────────────────────────

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            disabled={isSubmitting}
            {...register("name")}
          />
          {errors.name !== undefined ? (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="su-email">Email</Label>
          <Input
            id="su-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            disabled={isSubmitting}
            {...register("email")}
          />
          {errors.email !== undefined ? (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="su-password">Password</Label>
          <Input
            id="su-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("password")}
          />
          {errors.password !== undefined ? (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          ) : null}
        </div>

        {errors.root !== undefined ? (
          <p className="text-destructive text-sm">{errors.root.message}</p>
        ) : null}

        <Button type="submit" className="w-full h-9" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  useEffect(() => {
    if (conditionalUIStarted) return;
    conditionalUIStarted = true;

    if (!window.PublicKeyCredential?.isConditionalMediationAvailable) return;

    PublicKeyCredential.isConditionalMediationAvailable().then((available) => {
      if (!available) return;
      authClient.signIn.passkey({ autoFill: true }).then(({ error }) => {
        if (!error) router.push("/dashboard");
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            MindCache
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "sign-in" ? "Sign in to your account" : "Create an account"}
          </p>
        </div>

        {mode === "sign-in"
          ? <SignInForm onSwitch={() => setMode("sign-up")} />
          : <SignUpForm onSwitch={() => setMode("sign-in")} />
        }
      </div>
    </div>
  );
}
