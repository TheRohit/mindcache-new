"use client"

import { useTransition } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { FingerPrintScanIcon, Add01Icon, Cancel01Icon, Logout01Icon } from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

interface PasskeysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasskeysDialog({ open, onOpenChange }: PasskeysDialogProps) {
  const { data: passkeys, isPending, refetch } = authClient.useListPasskeys()
  const [isAdding, startAddTransition] = useTransition()
  const [deletingId, startDeleteTransition] = useTransition()

  function handleAdd() {
    startAddTransition(async () => {
      const { error } = await authClient.passkey.addPasskey()
      if (!error) refetch()
    })
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      await authClient.$fetch("/passkey/delete-passkey", {
        method: "POST",
        body: { id },
      })
      refetch()
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
                <HugeiconsIcon icon={FingerPrintScanIcon} className="size-4.5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <Dialog.Title className="text-sm font-semibold text-foreground">
                  Passkeys
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Manage your registered passkeys
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            </button>
          </div>

          <div className="mb-4 min-h-[80px]">
            {isPending ? (
              <div className="flex items-center justify-center py-6">
                <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : !passkeys || passkeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-6 text-center">
                <HugeiconsIcon icon={FingerPrintScanIcon} className="size-7 text-muted-foreground" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No passkeys registered yet</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {passkeys.map((passkey) => (
                  <li
                    key={passkey.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HugeiconsIcon icon={FingerPrintScanIcon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {passkey.name ?? "Unnamed passkey"}
                        </p>
                        {passkey.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(passkey.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(passkey.id)}
                      disabled={deletingId}
                      className="ml-3 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                      aria-label="Remove passkey"
                    >
                      <HugeiconsIcon icon={Logout01Icon} className="size-3.5" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              disabled={isAdding}
            >
              <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
              {isAdding ? "Registering…" : "Add Passkey"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
