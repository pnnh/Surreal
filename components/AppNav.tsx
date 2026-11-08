"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function AppNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: "/", label: t.nav.chat },
    { href: "/assets", label: t.nav.assets },
    { href: "/mcp-sessions", label: t.nav.mcpSessions },
    { href: "/settings", label: t.nav.settings },
  ];

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-amber-700"
        >
          Surreal
        </Link>
        <div className="flex items-center gap-3">
          <nav className="flex gap-1">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-stone-900 text-white"
                      : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
