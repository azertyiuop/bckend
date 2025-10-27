import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import './Layout.css'

function Layout({ onLogout }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Admin Panel</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Users
          </NavLink>
          <NavLink to="/moderation" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Moderation
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Analytics
          </NavLink>
          <NavLink to="/streams" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Streams
          </NavLink>
          <NavLink to="/logs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Activity Logs
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
