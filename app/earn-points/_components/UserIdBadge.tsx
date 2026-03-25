'use client'

import { useState, useEffect } from 'react'

/** Returns the first 6 chars of userId (dashes stripped, uppercased). */
export function toShortId(userId: string): string {
  return userId.replace(/-/g, '').substring(0, 6).toUpperCase()
}

/** Fetches the current user's short ID from /api/user/me. */
export function useShortUserId(): string | null {
  const [shortId, setShortId] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/user/me')
      .then(r => r.json())
      .then(data => {
        if (data.userId) setShortId(toShortId(data.userId))
      })
      .catch(() => {})
  }, [])
  return shortId
}

/** Subtle monospace chip shown on customer-facing screens. */
export function UserIdBadge({ shortId }: { shortId: string | null }) {
  if (!shortId) return null
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131313] border border-[#262626]">
      <span className="text-[#494847] text-[9px] font-bold uppercase tracking-widest select-none">ID</span>
      <span className="text-[#777575] text-[10px] font-mono font-bold tracking-wider">{shortId}</span>
    </div>
  )
}
