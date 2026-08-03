import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth-actions";
import { buttonClasses, cn } from "@/lib/ui";

const navByRole: Record<string, { href: string; label: string }[]> = {
  customer: [
    { href: "/search", label: "Search" },
    { href: "/bookings", label: "My Bookings" },
  ],
  nurse: [{ href: "/dashboard", label: "Dashboard" }],
  admin: [
    { href: "/admin/vetting", label: "Vetting" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/reassignments", label: "Reassignments" },
  ],
};

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const links = user ? navByRole[user.role] ?? [] : [];

  return (
    <header className="border-b border-border bg-cream/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="font-serif text-2xl font-semibold text-primary-dark"
        >
          Saathi
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-soft flex-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-primary-dark"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/support" className="hover:text-primary-dark">
            Support
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-ink-soft hover:text-primary-dark"
              >
                Log in
              </Link>
              <Link href="/signup" className={buttonClasses("primary", "sm")}>
                Book Now
              </Link>
            </>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "hidden sm:inline text-sm text-muted",
                  user.status !== "active" && "text-danger"
                )}
              >
                {user.name}
                {user.status !== "active" && " · pending verification"}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm font-semibold text-ink-soft hover:text-primary-dark"
                >
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
