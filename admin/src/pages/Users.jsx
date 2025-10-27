import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Users.css'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await api.getConnectedUsers()
      if (res.success) {
        setUsers(res.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="page-loading">Loading users...</div>
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
      </div>

      <div className="users-section">
        <div className="section-header">
          <h2>All Users ({users.length})</h2>
        </div>

        <div className="users-table">
          {users.length === 0 ? (
            <div className="empty-state">No users found</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>IP Address</th>
                  <th>Fingerprint</th>
                  <th>Page</th>
                  <th>Connected</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.ip}</td>
                    <td className="fingerprint">{user.fingerprint?.substring(0, 12)}...</td>
                    <td><span className="badge">{user.page}</span></td>
                    <td>{new Date(user.connect_time).toLocaleString()}</td>
                    <td>{new Date(user.last_activity).toLocaleString()}</td>
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

export default Users
