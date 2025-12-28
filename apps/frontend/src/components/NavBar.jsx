import Link from "next/link";
import { Boxes, LayoutDashboard, Shuffle } from "lucide-react";

function NavItem({ href, label, Icon }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-900">
          Inventory Flashlight
        </Link>

        <nav className="flex items-center gap-1">
          <NavItem href="/dashboard" label="Dashboard" Icon={LayoutDashboard} />
          <NavItem href="/inventory" label="Inventory" Icon={Boxes} />
          <NavItem href="/move-stock" label="Move Stock" Icon={Shuffle} />
        </nav>
      </div>
    </header>
  );
}
