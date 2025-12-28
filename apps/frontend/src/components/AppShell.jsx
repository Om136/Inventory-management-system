import { NavBar } from "@/components/NavBar";

export function AppShell({ children }) {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
