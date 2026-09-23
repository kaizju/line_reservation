// On-device confirmation notification (works with zero backend).
// For real off-device notifications (SMS/email push to the applicant's own
// phone), see the "What to add next" section in the README — this function
// is the single place you'd wire that in.

export async function ensurePermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function sendConfirmationNotification(reservation) {
  const title = 'ID Reservation Confirmed'
  const body = `${reservation.fullName} — Queue #${reservation.id} checked in successfully.`

  const granted = await ensurePermission()
  if (granted) {
    try {
      const n = new Notification(title, { body, tag: reservation.id })
      void n
    } catch {
      // Notification constructor can fail on some mobile browsers;
      // the in-app toast (handled by the caller) still covers this case.
    }
  }

  // Placeholder hook for a real email/SMS send. Wire this to a Vercel
  // serverless function (e.g. /api/notify) backed by Resend, Twilio, etc.
  // once a backend is added — see README.
  return { delivered: granted, channel: granted ? 'browser-push' : 'in-app-only' }
}
