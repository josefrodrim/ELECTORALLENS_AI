"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Resumen" },
  { href: "/2011", label: "EG 2011" },
  { href: "/2016", label: "EG 2016" },
  { href: "/2021", label: "EG 2021" },
  { href: "/2026", label: "EG 2026" },
  { href: "/keiko", label: "Patrón Keiko" },
]

export default function Header() {
  const pathname = usePathname()
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">
            Electoral<span className="text-blue-400">Lens</span>
            <span className="text-zinc-500 font-normal text-sm ml-1">AI</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname === href
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
            EG 2026 · 100% actas
          </span>
        </div>
      </div>
    </header>
  )
}
