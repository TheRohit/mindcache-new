"use client"

import { useState, useTransition } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockPasswordIcon, ViewIcon, ViewOffIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onClose() {
    reset()
    onOpenChange(false)
  }

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: false,
      })
      if (error) {
        setError("root", { message: error.message ?? "Failed to change password." })
        return
      }
      reset()
      onOpenChange(false)
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-xl data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95 transition-all duration-200 outline-none">
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <HugeiconsIcon icon={LockPasswordIcon} className="size-4.5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <Dialog.Title className="text-sm font-semibold text-foreground">
                  Change Password
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Update your account password
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PasswordField
              label="Current Password"
              id="current-password"
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              registration={register("currentPassword")}
              error={errors.currentPassword?.message}
              autoComplete="current-password"
            />
            <PasswordField
              label="New Password"
              id="new-password"
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              registration={register("newPassword")}
              error={errors.newPassword?.message}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm New Password"
              id="confirm-password"
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              registration={register("confirmPassword")}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />

            {errors.root && (
              <p className="text-xs text-destructive">{errors.root.message}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving…" : "Update Password"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface PasswordFieldProps {
  label: string
  id: string
  show: boolean
  onToggle: () => void
  registration: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>
  error?: string
  autoComplete?: string
}

function PasswordField({ label, id, show, onToggle, registration, error, autoComplete }: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={cn("pr-9", error && "border-destructive")}
          {...registration}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <HugeiconsIcon
            icon={show ? ViewOffIcon : ViewIcon}
            className="size-4"
            strokeWidth={1.5}
          />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
