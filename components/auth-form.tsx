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
import {
  Card,
  CardContent,
} from "@/components/ui/card";

let conditionalUIStarted = false;

function SignInFields({ onSwitch }: { onSwitch: () => void }) {
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

  const busy = isSubmitting || isPasskeyPending;

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
        setError("root", {
          message: error.message ?? "Passkey sign-in failed.",
        });
        return;
      }
      router.push("/dashboard");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Sign in to your MindCache account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username webauthn"
            disabled={busy}
            {...register("email")}
          />
          {errors.email !== undefined ? (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="/forgot-password"
              className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password webauthn"
            disabled={busy}
            {...register("password")}
          />
          {errors.password !== undefined ? (
            <p className="text-destructive text-xs">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {errors.root !== undefined ? (
          <p className="text-destructive text-sm">{errors.root.message}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground uppercase tracking-widest">
            or
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2"
        onClick={handlePasskey}
        disabled={busy}
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

  const busy = isSubmitting;

  const onSubmit = async (data: SignUpValues) => {
    const { error } = await authClient.signUp.email(data);
    if (error) {
      setError("root", { message: error.message ?? "Sign up failed." });
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          Get started with MindCache
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            disabled={busy}
            {...register("name")}
          />
          {errors.name !== undefined ? (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="su-email">Email</Label>
          <Input
            id="su-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            disabled={busy}
            {...register("email")}
          />
          {errors.email !== undefined ? (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="su-password">Password</Label>
          <Input
            id="su-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={busy}
            {...register("password")}
          />
          {errors.password !== undefined ? (
            <p className="text-destructive text-xs">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {errors.root !== undefined ? (
          <p className="text-destructive text-sm">{errors.root.message}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
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

export function AuthForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden py-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            {mode === "sign-in" ? (
              <SignInFields onSwitch={() => setMode("sign-up")} />
            ) : (
              <SignUpFields onSwitch={() => setMode("sign-in")} />
            )}
          </div>

          <div className="bg-muted relative hidden md:block">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/4 -right-1/4 h-[80%] w-[80%] rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-1/4 -left-1/4 h-[70%] w-[70%] rounded-full bg-primary/5 blur-3xl" />
              <svg
                className="absolute inset-0 h-full w-full opacity-[0.03]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative flex h-full flex-col items-center justify-center gap-4 p-10">
              <div className="rounded-2xl border border-primary/10 bg-background/60 p-6 shadow-sm backdrop-blur-sm">
                <HugeiconsIcon
                  icon={FingerPrintScanIcon}
                  size={48}
                  className="text-primary/80"
                />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">MindCache</p>
                <p className="mt-1 text-sm text-muted-foreground text-balance max-w-[220px]">
                  Your second brain — capture, connect, and recall everything.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs text-balance px-8">
        By continuing, you agree to our{" "}
        <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
