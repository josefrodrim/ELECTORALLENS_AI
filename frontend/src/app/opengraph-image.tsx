import { ImageResponse } from "next/og"

export const alt = "ElectoralLens AI — Inteligencia Electoral Perú 2011–2026"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const STATS = [
  { label: "Ciclos electorales", value: "4" },
  { label: "Actas EG 2026 P1", value: "100%" },
  { label: "Distritos EI", value: "1,873+" },
  { label: "Fuente oficial", value: "ONPE" },
]

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c0c10",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent — orange glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
          }}
        />
        {/* Background accent — blue glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Peru flag stripe — right edge */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 10,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, background: "#dc2626" }} />
          <div style={{ flex: 1, background: "#f1f5f9" }} />
          <div style={{ flex: 1, background: "#dc2626" }} />
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 52 }}>
          <span style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 300, letterSpacing: -0.5 }}>
            Electoral
          </span>
          <span style={{ color: "#60a5fa", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginLeft: 2 }}>
            Lens
          </span>
          <span
            style={{
              color: "#52525b",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginLeft: 6,
              marginBottom: 2,
            }}
          >
            AI
          </span>
          <div
            style={{
              marginLeft: 20,
              background: "#1e3a5f",
              border: "1px solid #2563eb",
              borderRadius: 6,
              padding: "3px 10px",
              color: "#93c5fd",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            EG 2026 · 100% actas
          </div>
        </div>

        {/* Main headline */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p
            style={{
              color: "#64748b",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: 3,
              textTransform: "uppercase",
              margin: "0 0 18px",
            }}
          >
            Inteligencia Electoral · Perú
          </p>
          <h1
            style={{
              color: "#f8fafc",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              margin: "0 0 20px",
              letterSpacing: -2,
            }}
          >
            Elecciones Generales{" "}
            <span style={{ color: "#f97316" }}>2011–2026</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 22, margin: "0 0 12px", fontWeight: 400 }}>
            Resultados ONPE · Flujos de votos P1→P2 · Proyección segunda vuelta
          </p>
          <p style={{ color: "#475569", fontSize: 16, margin: 0, fontWeight: 400 }}>
            Inferencia Ecológica (King 1997) · Análisis estadístico descriptivo · Datos públicos
          </p>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid #27272a",
            paddingTop: 28,
            marginTop: 28,
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                paddingRight: i < STATS.length - 1 ? 32 : 0,
                borderRight: i < STATS.length - 1 ? "1px solid #27272a" : "none",
                marginRight: i < STATS.length - 1 ? 32 : 0,
              }}
            >
              <span style={{ color: "#52525b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>
                {s.label}
              </span>
              <span style={{ color: "#f1f5f9", fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
