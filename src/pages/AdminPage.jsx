import { useEffect, useState } from 'react'
import { listReservations, markDone } from '../utils/store.js'

export default function AdminPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const rows = await listReservations()
      setReservations(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 4000)
    return () => clearInterval(t)
  }, [])

  async function handleMarkDone(id) {
    await markDone(id)
    refresh()
  }

  return (
    <div className="card">
      <h2>Today&apos;s queue</h2>
      <p className="muted">Shared across every device — powered by Supabase.</p>

      {loading && <p className="muted">Loading…</p>}
      {!loading && reservations.length === 0 && <p className="muted">No reservations yet.</p>}

      {reservations.map((r) => (
        <div className="list-item" key={r.id}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>
              #{r.id} — {r.fullName}
            </div>
            <div className="muted">
              {r.idType} · {r.purpose} · {r.preferredDate} {r.preferredTime}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${r.status}`}>{r.status.replace('-', ' ')}</span>
            {r.status === 'checked-in' && (
              <button className="btn secondary" onClick={() => handleMarkDone(r.id)}>
                Mark done
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
