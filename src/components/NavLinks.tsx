"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type Item = { href: string; label: string };

export function NavLink({ item }: { item: Item }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      className={clsx(
        "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {item.label}
    </Link>
  );
}
