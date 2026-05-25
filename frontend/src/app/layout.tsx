import type { Metadata } from "next"
import { DM_Sans, DM_Serif_Display, Fira_Code } from "next/font/google"
import "./globals.css"
import Header from "@/components/layout/Header"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
})

const BASE_URL = "https://electoral-lens-ai.vercel.app"

export const metadata: Metadata = {
  title: "ElectoralLens AI — Inteligencia Electoral Perú 2011–2026",
  description:
    "Análisis estadístico de 4 ciclos electorales peruanos (2011–2026). Resultados oficiales ONPE, flujos de votos P1→P2 (Inferencia Ecológica), proyección segunda vuelta 2026 y patrón histórico Keiko Fujimori.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "ElectoralLens AI — Inteligencia Electoral Perú",
    description:
      "Resultados ONPE · Sankey P1→P2 · Proyección segunda vuelta 2026 · ¿Le toca a Keiko? Análisis estadístico de 4 ciclos electorales peruanos.",
    url: BASE_URL,
    siteName: "ElectoralLens AI",
    locale: "es_PE",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "ElectoralLens AI — Inteligencia Electoral Perú 2011–2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElectoralLens AI — Inteligencia Electoral Perú",
    description:
      "Análisis estadístico de resultados ONPE 2011–2026. Flujos de votos, proyección P2 2026 y patrón Keiko.",
  },
  keywords: [
    "elecciones Peru",
    "ONPE",
    "resultados electorales",
    "Keiko Fujimori",
    "segunda vuelta 2026",
    "inferencia ecológica",
    "análisis electoral",
    "datos abiertos Peru",
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${dmSerif.variable} ${firaCode.variable}`}>
      <body className="antialiased bg-[#f5f4ef] text-slate-900 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
