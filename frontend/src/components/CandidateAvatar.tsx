import Image from "next/image"
import { CANDIDATE_PHOTOS } from "@/lib/candidate-photos"

const IDEOLOGY_RING: Record<string, string> = {
  right:          "ring-red-400",
  "center-right": "ring-orange-400",
  center:         "ring-slate-300",
  "center-left":  "ring-blue-400",
  left:           "ring-indigo-500",
}

const IDEOLOGY_BG: Record<string, string> = {
  right:          "bg-red-100 text-red-700",
  "center-right": "bg-orange-100 text-orange-700",
  center:         "bg-slate-100 text-slate-600",
  "center-left":  "bg-blue-100 text-blue-700",
  left:           "bg-indigo-100 text-indigo-700",
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

interface Props {
  shortName: string
  fullName?: string
  ideology?: string
  size?: number
}

export default function CandidateAvatar({ shortName, fullName, ideology, size = 40 }: Props) {
  const photo = CANDIDATE_PHOTOS[shortName]
  const ringClass = IDEOLOGY_RING[ideology ?? ""] ?? "ring-slate-300"
  const bgClass = IDEOLOGY_BG[ideology ?? ""] ?? "bg-slate-100 text-slate-600"

  if (photo) {
    return (
      <div
        className={`relative shrink-0 rounded-full ring-2 ${ringClass} overflow-hidden`}
        style={{ width: size, height: size }}
      >
        <Image
          src={photo}
          alt={fullName ?? shortName}
          fill
          className="object-cover object-top"
          sizes={`${size}px`}
        />
      </div>
    )
  }

  return (
    <div
      className={`shrink-0 rounded-full ring-2 ${ringClass} ${bgClass} flex items-center justify-center font-bold`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials(shortName)}
    </div>
  )
}
