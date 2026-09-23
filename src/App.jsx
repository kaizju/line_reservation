import { NavLink, Route, Routes } from 'react-router-dom'
import ReservationForm from './pages/ReservationForm.jsx'
import PassPage from './pages/PassPage.jsx'
import ScannerPage from './pages/ScannerPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import './App.css'

function App() {
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
