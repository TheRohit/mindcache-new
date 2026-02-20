"use client"

import { createContext, use, useState } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Sun01Icon,
  MoonIcon,
  FingerPrintScanIcon,
  LockPasswordIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const PasskeysDialog = dynamic(
  () => import("./passkeys-dialog").then((m) => m.PasskeysDialog),
  { ssr: false },
)

const ChangePasswordDialog = dynamic(
  () => import("./change-password-dialog").then((m) => m.ChangePasswordDialog),
  { ssr: false },
)

interface HeaderContextValue {
  session: ReturnType<typeof authClient.useSession>
}

const HeaderContext = createContext<HeaderContextValue | null>(null)

function useHeaderContext() {
  const ctx = use(HeaderContext)
  if (!ctx) throw new Error("Header compound components must be used inside <Header.Root>")
  return ctx
}

function HeaderRoot({ children, className }: { children: React.ReactNode; className?: string }) {
  const session = authClient.useSession()

  return (
    <HeaderContext value={{ session }}>
      <header
        className={cn(
          "sticky top-0 z-30 w-full",
          "bg-transparent",
          className,
        )}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {children}
        </div>
      </header>
    </HeaderContext>
  )
}

function HeaderLogo({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {children ?? (
        <>
          {/* Logo mark */}
          <div className="relative flex size-7 items-center justify-center">
            <div className="absolute inset-0 rounded-none bg-primary/20 blur-sm" />
            <div className="relative flex size-7 items-center justify-center rounded-none bg-primary/15 border border-primary/25">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <circle cx="7" cy="3" r="2" fill="currentColor" />
                <circle cx="3" cy="10" r="1.5" fill="currentColor" opacity="0.7" />
                <circle cx="11" cy="10" r="1.5" fill="currentColor" opacity="0.7" />
                <line x1="7" y1="5" x2="3" y2="8.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <line x1="7" y1="5" x2="11" y2="8.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <line x1="3" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              </svg>
            </div>
          </div>
          <span
            className="text-sm font-bold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            MindCache
          </span>
        </>
      )}
    </div>
  )
}

function HeaderActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {children}
    </div>
  )
}

function HeaderThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("size-8 text-muted-foreground hover:text-foreground", className)}
    >
      <HugeiconsIcon icon={Sun01Icon} className="size-4 hidden dark:block" strokeWidth={1.5} />
      <HugeiconsIcon icon={MoonIcon}  className="size-4 block dark:hidden" strokeWidth={1.5} />
    </Button>
  )
}

function HeaderUserMenu({ className }: { className?: string }) {
  const { session } = useHeaderContext()
  const router = useRouter()
  const [passkeyOpen, setPasskeyOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  if (session.isPending) {
    return (
      <div className={cn("size-7 animate-pulse rounded-full bg-muted", className)} />
    )
  }

  if (!session.data) return null

  const { user } = session.data
  const initials = user.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="User menu"
              className={cn("rounded-full size-8 p-0", className)}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? "User avatar"}
                  className="size-7 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary ring-1 ring-primary/30">
                  {initials}
                </span>
              )}
            </Button>
          }
        />

        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-2.5 px-2 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/20">
              {user.image ? (
                <img src={user.image} alt={user.name ?? "User"} className="size-8 rounded-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-primary">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              {user.name && (
                <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
              )}
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setPasskeyOpen(true)}>
              <HugeiconsIcon icon={FingerPrintScanIcon} className="size-4 text-muted-foreground" strokeWidth={1.5} />
              Manage Passkeys
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
              <HugeiconsIcon icon={LockPasswordIcon} className="size-4 text-muted-foreground" strokeWidth={1.5} />
              Change Password
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <HugeiconsIcon icon={Logout01Icon} className="size-4" strokeWidth={1.5} />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {passkeyOpen && (
        <PasskeysDialog open={passkeyOpen} onOpenChange={setPasskeyOpen} />
      )}
      {changePasswordOpen && (
        <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      )}
    </>
  )
}

export function SiteHeader({ className }: { className?: string }) {
  return (
    <HeaderRoot className={className}>
      <HeaderLogo />
      <HeaderActions>
        <HeaderThemeToggle />
        <HeaderUserMenu />
      </HeaderActions>
    </HeaderRoot>
  )
}

export const Header = {
  Root: HeaderRoot,
  Logo: HeaderLogo,
  Actions: HeaderActions,
  ThemeToggle: HeaderThemeToggle,
  UserMenu: HeaderUserMenu,
}
