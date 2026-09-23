import { NavLink, Route, Routes } from 'react-router-dom'
import ReservationForm from './pages/ReservationForm.jsx'
import PassPage from './pages/PassPage.jsx'
import ScannerPage from './pages/ScannerPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import { supabaseConfigured } from './lib/supabaseClient.js'
import './App.css'

function App() {
  if (!supabaseConfigured) {
    return (
      <div className="card" style={{ marginTop: 40 }}>
        <h2>Supabase isn&apos;t configured yet</h2>
        <p className="muted">
          This app needs two environment variables to talk to your database:
        </p>
        <ul>
          <li><code>VITE_SUPABASE_URL</code></li>
          <li><code>VITE_SUPABASE_ANON_KEY</code></li>
        </ul>
        <p className="muted">
          <strong>Running locally?</strong> Copy <code>.env.example</code> to{' '}
          <code>.env.local</code>, paste in the values from your Supabase
          project&apos;s Settings → API page, then restart <code>npm run dev</code>.
        </p>
        <p className="muted">
          <strong>Deployed on Vercel?</strong> Add both variables under your
          project&apos;s Settings → Environment Variables, then redeploy —
          Vercel only picks up new env vars on the next build.
        </p>
      </div>
    )
  }

  return (
    <>
      <header>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>ID Reserve</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Reserve your slot, skip the line, verify with a QR pass.
        </p>
      </header>

      <nav className="tabs">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Book a slot
        </NavLink>
        <NavLink to="/scan" className={({ isActive }) => (isActive ? 'active' : '')}>
          Scan pass
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
          Queue list
        </NavLink>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<ReservationForm />} />
          <Route path="/pass/:id" element={<PassPage />} />
          <Route path="/scan" element={<ScannerPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
