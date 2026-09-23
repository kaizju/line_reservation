import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { checkInPass } from '../utils/store.js'
import { sendConfirmationNotification } from '../utils/notify.js'

const SCANNER_ID = 'scanner-view'

export default function ScannerPage() {
  const scannerRef = useRef(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null) // { ok, message, reservation }
  const [toast, setToast] = useState('')

  useEffect(() => {
    return () => {
      if (scannerRef.current && running) {
        scannerRef.current.stop().catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDecoded(text) {
    // Pause further scans while we process this one.
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true)
      } catch {
        /* ignore */
      }
    }

    let payload
    try {
      payload = JSON.parse(text)
    } catch {
      setResult({ ok: false, message: 'Not a recognized ID Reserve pass.' })
      resumeAfterDelay()
      return
    }

    let updated
    try {
      // The database verifies id + token together and only flips a
      // pending pass to checked-in — see check_in_reservation() in
      // supabase/schema.sql. A null result means no match was found.
      updated = await checkInPass(payload.id, payload.token)
    } catch {
      setResult({ ok: false, message: 'Could not reach the database — try again.' })
      resumeAfterDelay()
      return
    }

    if (!updated) {
      setResult({ ok: false, message: 'Invalid or unrecognized pass.' })
      resumeAfterDelay()
      return
    }
    if (updated.alreadyCheckedIn) {
      setResult({
        ok: false,
        message: `Queue #${updated.id} was already checked in.`,
        reservation: updated,
      })
      resumeAfterDelay()
      return
    }

    const notif = await sendConfirmationNotification(updated)
    setResult({ ok: true, reservation: updated })
    setToast(
      notif.delivered
        ? `Confirmation sent to ${updated.fullName}.`
        : `Checked in — enable notifications to auto-confirm next time.`,
    )
    setTimeout(() => setToast(''), 3500)
    resumeAfterDelay()
  }

  function resumeAfterDelay() {
    setTimeout(() => {
      if (scannerRef.current) {
        scannerRef.current.resume()
      }
    }, 2000)
  }

  async function startScanning() {
    setResult(null)
    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => handleDecoded(decodedText),
        () => {}, // per-frame scan failure — expected while searching, ignore
      )
      setRunning(true)
    } catch {
      setResult({ ok: false, message: 'Could not access the camera. Check browser permissions.' })
    }
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {
        /* ignore */
      }
    }
    setRunning(false)
  }

  return (
    <div className="card">
      <h2>Scan a pass</h2>
      <p className="muted">Point the camera at the applicant&apos;s QR pass to check them in.</p>

      <div id={SCANNER_ID} style={{ marginBottom: 16 }} />

      {!running ? (
        <button className="btn" onClick={startScanning}>Start camera</button>
      ) : (
        <button className="btn secondary" onClick={stopScanning}>Stop camera</button>
      )}

      {result && (
        <div
          className="card"
          style={{
            marginTop: 16,
            borderColor: result.ok ? 'var(--accent)' : 'var(--danger)',
          }}
        >
          {result.ok ? (
            <>
              <h3 style={{ color: 'var(--accent)' }}>✓ Checked in</h3>
              <p>
                <strong>{result.reservation.fullName}</strong> — Queue #{result.reservation.id}
              </p>
              <p className="muted">{result.reservation.idType} · {result.reservation.purpose}</p>
            </>
          ) : (
            <>
              <h3 style={{ color: 'var(--danger)' }}>{result.message}</h3>
              {result.reservation && (
                <p className="muted">
                  {result.reservation.fullName} · Queue #{result.reservation.id}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
