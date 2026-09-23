// Simple localStorage-backed reservation store.
// In production this should be swapped for a real backend (see README),
// but this keeps the app fully functional as a static Vercel deployment.

const KEY = 'id-reserve.reservations.v1'
const COUNTER_KEY = 'id-reserve.queue-counter.v1'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

function readCounter() {
  try {
    return JSON.parse(localStorage.getItem(COUNTER_KEY)) || {}
  } catch {
    return {}
  }
}

function nextQueueNumber() {
  const today = new Date().toISOString().slice(0, 10)
  const counter = readCounter()
  const n = (counter[today] || 0) + 1
  counter[today] = n
  localStorage.setItem(COUNTER_KEY, JSON.stringify(counter))
  return `${today.replace(/-/g, '')}-${String(n).padStart(3, '0')}`
}

// Lightweight non-cryptographic token so a scanned QR can be sanity-checked
// without a backend round trip. This is NOT secure against a determined
// forger — see README "What to add next" for a real signed-token approach.
function makeToken(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

export function createReservation(data) {
  const list = readAll()
  const id = nextQueueNumber()
  const reservation = {
    id,
    token: makeToken(id),
    fullName: data.fullName,
    contactNumber: data.contactNumber,
    email: data.email,
    idType: data.idType,
    purpose: data.purpose,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
    status: 'pending', // pending -> checked-in -> done  (or cancelled)
    createdAt: new Date().toISOString(),
    scannedAt: null,
  }
  list.push(reservation)
  writeAll(list)
  return reservation
}

export function getReservation(id) {
  return readAll().find((r) => r.id === id) || null
}

export function verifyToken(id, token) {
  return makeToken(id) === token
}

export function listReservations() {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function markCheckedIn(id) {
  const list = readAll()
  const idx = list.findIndex((r) => r.id === id)
  if (idx === -1) return null
  if (list[idx].status === 'pending') {
    list[idx].status = 'checked-in'
    list[idx].scannedAt = new Date().toISOString()
  }
  writeAll(list)
  return list[idx]
}

export function markDone(id) {
  const list = readAll()
  const idx = list.findIndex((r) => r.id === id)
  if (idx === -1) return null
  list[idx].status = 'done'
  writeAll(list)
  return list[idx]
}
