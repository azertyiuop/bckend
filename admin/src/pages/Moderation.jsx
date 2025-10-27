import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Moderation.css'

function Moderation() {
  const [bannedUsers, setBannedUsers] = useState([])
  const [mutedUsers, setMutedUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('banned')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [bannedRes, mutedRes, messagesRes] = await Promise.all([
        api.getBannedUsers(),
        api.getMutedUsers(),
        api.getChatMessages(50, 0)
      ])

      if (bannedRes.success) setBannedUsers(bannedRes.users || [])
      if (mutedRes.success) setMutedUsers(mutedRes.users || [])
      if (messagesRes.success) setMessages(messagesRes.messages || [])
    } catch (error) {
      console.error('Error loading moderation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnban = async (fingerprint, ip) => {
    if (!confirm('Unban this user?')) return

    try {
      const res = await api.unbanUser(fingerprint, ip, 'admin')
      if (res.success) {
        alert('User unbanned successfully')
        loadData()
      } else {
        alert(res.error || 'Failed to unban user')
      }
    } catch (error) {
      alert('Error unbanning user')
    }
  }

  const handleUnmute = async (fingerprint) => {
    if (!confirm('Unmute this user?')) return

    try {
      const res = await api.unmuteUser(fingerprint, 'admin')
      if (res.success) {
        alert('User unmuted successfully')
        loadData()
      } else {
        alert(res.error || 'Failed to unmute user')
      }
    } catch (error) {
      alert('Error unmuting user')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return

    try {
      const res = await api.deleteMessage(messageId, 'admin')
      if (res.success) {
        alert('Message deleted successfully')
        loadData()
      } else {
        alert(res.error || 'Failed to delete message')
      }
    } catch (error) {
      alert('Error deleting message')
    }
  }

  if (loading) {
    return <div className="page-loading">Loading moderation data...</div>
  }

  return (
    <div className="moderation-page">
      <h1 className="page-title">Moderation</h1>

      <div className="tabs">
        <button
          className={activeTab === 'banned' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('banned')}
        >
          Banned Users ({bannedUsers.length})
        </button>
        <button
          className={activeTab === 'muted' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('muted')}
        >
          Muted Users ({mutedUsers.length})
        </button>
        <button
          className={activeTab === 'messages' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('messages')}
        >
          Recent Messages ({messages.length})
        </button>
      </div>

      {activeTab === 'banned' && (
        <div className="moderation-section">
          <h2>Banned Users</h2>
          {bannedUsers.length === 0 ? (
            <div className="empty-state">No banned users</div>
          ) : (
            <div className="moderation-table">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>IP</th>
                    <th>Reason</th>
                    <th>Banned At</th>
                    <th>Banned By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bannedUsers.map(user => (
                    <tr key={user.id}>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.ip}</td>
                      <td>{user.reason || 'No reason'}</td>
                      <td>{new Date(user.banned_at).toLocaleString()}</td>
                      <td>{user.banned_by}</td>
                      <td>
                        <button
                          className="action-btn unban"
                          onClick={() => handleUnban(user.fingerprint, user.ip)}
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'muted' && (
        <div className="moderation-section">
          <h2>Muted Users</h2>
          {mutedUsers.length === 0 ? (
            <div className="empty-state">No muted users</div>
          ) : (
            <div className="moderation-table">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Reason</th>
                    <th>Muted At</th>
                    <th>Expires At</th>
                    <th>Muted By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mutedUsers.map(user => (
                    <tr key={user.id}>
                      <td><strong>{user.username}</strong></td>
                      <td>{user.reason || 'No reason'}</td>
                      <td>{new Date(user.muted_at).toLocaleString()}</td>
                      <td>{new Date(user.mute_end_time).toLocaleString()}</td>
                      <td>{user.muted_by}</td>
                      <td>
                        <button
                          className="action-btn unmute"
                          onClick={() => handleUnmute(user.fingerprint)}
                        >
                          Unmute
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="moderation-section">
          <h2>Recent Messages</h2>
          {messages.length === 0 ? (
            <div className="empty-state">No messages found</div>
          ) : (
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className="message-item">
                  <div className="message-header">
                    <div>
                      <strong>{msg.username}</strong>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteMessage(msg.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Moderation
