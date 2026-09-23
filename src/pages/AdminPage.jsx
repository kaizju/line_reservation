import { useEffect, useState } from 'react'
import { listReservations, markDone } from '../utils/store.js'

export default function AdminPage() {
  const [reservations, setReservations] = useState(() => listReservations())

  function refresh() {
    setReservations(listReservations())
  }

  useEffect(() => {
    const t = setInterval(refresh, 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="card">
      <h2>Today&apos;s queue</h2>
      <p className="muted">Stored on this device only — see README for a shared backend.</p>

      {reservations.length === 0 && <p className="muted">No reservations yet.</p>}

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
              <button className="btn secondary" onClick={() => { markDone(r.id); refresh() }}>
                Mark done
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
