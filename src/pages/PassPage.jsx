import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { getReservation } from '../utils/store.js'

export default function PassPage() {
  const { id } = useParams()
  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const r = await getReservation(id)
        if (!cancelled) {
          setReservation(r)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    // Poll for status changes (e.g. staff scanning this pass on another
    // device) — a Supabase realtime subscription would replace this.
    const t = setInterval(load, 3000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [id])

  if (loading) {
    return (
      <div className="card">
        <p className="muted">Loading your pass…</p>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="card">
        <h2>Pass not found</h2>
        <p className="muted">We couldn&apos;t find a reservation with that ID.</p>
        <Link to="/" className="btn secondary">Book a new slot</Link>
      </div>
    )
  }

  const qrValue = JSON.stringify({ id: reservation.id, token: reservation.token })

  return (
    <div className="card">
      <h2>Your pass</h2>
      <p className="muted">Show this QR code at the entrance to check in.</p>

      <div className="qr-wrap">
        <QRCode value={qrValue} size={200} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-h)', letterSpacing: 1 }}>
          {reservation.id}
        </div>
        <span className={`badge ${reservation.status}`}>{reservation.status.replace('-', ' ')}</span>
      </div>

      <div className="field">
        <label>Name</label>
        <div>{reservation.fullName}</div>
      </div>
      <div className="row">
        <div className="field">
          <label>ID type</label>
          <div>{reservation.idType}</div>
        </div>
        <div className="field">
          <label>Purpose</label>
          <div>{reservation.purpose}</div>
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label>Date</label>
          <div>{reservation.preferredDate}</div>
        </div>
        <div className="field">
          <label>Time slot</label>
          <div>{reservation.preferredTime}</div>
        </div>
      </div>

      {reservation.status === 'checked-in' && (
        <p style={{ color: 'var(--accent)', fontWeight: 600 }}>
          ✓ Checked in — you&apos;re in the queue.
        </p>
      )}

      <Link to="/" className="btn secondary" style={{ display: 'inline-block', marginTop: 8 }}>
        Book another
      </Link>
    </div>
  )
}
