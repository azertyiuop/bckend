import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.getDashboardStats(),
        api.getConnectedUsers()
      ])

      if (statsRes.success) setStats(statsRes.stats)
      if (usersRes.success) setConnectedUsers(usersRes.users)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="page-loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-blue)' }}>👥</div>
          <div className="stat-content">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats?.users.total || 0}</div>
            <div className="stat-subtext">{stats?.users.online || 0} online</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-green)' }}>💬</div>
          <div className="stat-content">
            <div className="stat-label">Messages</div>
            <div className="stat-value">{stats?.messages.total || 0}</div>
            <div className="stat-subtext">{stats?.messages.today || 0} today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-red)' }}>📺</div>
          <div className="stat-content">
            <div className="stat-label">Active Streams</div>
            <div className="stat-value">{stats?.streams.active || 0}</div>
            <div className="stat-subtext">{stats?.streams.totalToday || 0} today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-yellow)' }}>🛡️</div>
          <div className="stat-content">
            <div className="stat-label">Moderation</div>
            <div className="stat-value">{stats?.moderation.bannedUsers || 0}</div>
            <div className="stat-subtext">{stats?.moderation.mutedUsers || 0} muted</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Connected Users ({connectedUsers.length})</h2>
        <div className="connected-users-table">
          {connectedUsers.length === 0 ? (
            <div className="empty-state">No users connected</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>IP Address</th>
                  <th>Page</th>
                  <th>Connected At</th>
                </tr>
              </thead>
              <tbody>
                {connectedUsers.map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.ip}</td>
                    <td><span className="badge">{user.page}</span></td>
                    <td>{new Date(user.connect_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
