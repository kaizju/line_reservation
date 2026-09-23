import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createReservation } from '../utils/store.js'

const ID_TYPES = [
  'Barangay ID',
  "Voter's ID",
  'Postal ID',
  'National ID (PhilSys)',
  'Student ID',
  "Senior Citizen's ID",
  'PWD ID',
  'Other',
]

const PURPOSES = ['New application', 'Renewal', 'Replacement (lost/damaged)', 'Data correction']

const TIME_SLOTS = [
  '8:00 – 9:00 AM',
  '9:00 – 10:00 AM',
  '10:00 – 11:00 AM',
  '1:00 – 2:00 PM',
  '2:00 – 3:00 PM',
  '3:00 – 4:00 PM',
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReservationForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    email: '',
    idType: ID_TYPES[0],
    purpose: PURPOSES[0],
    preferredDate: todayISO(),
    preferredTime: TIME_SLOTS[0],
  })
  const [error, setError] = useState('')

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName.trim() || !form.contactNumber.trim()) {
      setError('Full name and contact number are required.')
      return
    }
    const reservation = createReservation(form)
    navigate(`/pass/${reservation.id}`)
  }

  return (
    <div className="card">
      <h2>Book a reservation</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        Fill this out once — you&apos;ll get a QR pass to skip the walk-in line.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={form.fullName} onChange={update('fullName')} required />
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="contactNumber">Contact number</label>
            <input
              id="contactNumber"
              type="tel"
              value={form.contactNumber}
              onChange={update('contactNumber')}
              placeholder="09xx xxx xxxx"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email (optional)</label>
            <input id="email" type="email" value={form.email} onChange={update('email')} />
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="idType">Valid ID type</label>
            <select id="idType" value={form.idType} onChange={update('idType')}>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="purpose">Purpose</label>
            <select id="purpose" value={form.purpose} onChange={update('purpose')}>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="preferredDate">Preferred date</label>
            <input
              id="preferredDate"
              type="date"
              min={todayISO()}
              value={form.preferredDate}
              onChange={update('preferredDate')}
            />
          </div>
          <div className="field">
            <label htmlFor="preferredTime">Preferred time slot</label>
            <select id="preferredTime" value={form.preferredTime} onChange={update('preferredTime')}>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

        <button type="submit" className="btn">Reserve my slot</button>
      </form>
    </div>
  )
}
