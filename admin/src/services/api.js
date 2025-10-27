const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

const getHeaders = () => {
  const token = localStorage.getItem('admin_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

export const api = {
  async getDashboardStats() {
    const res = await fetch(`${API_URL}/api/analytics/dashboard`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async getConnectedUsers() {
    const res = await fetch(`${API_URL}/api/connected-users`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async getChatMessages(limit = 100, offset = 0) {
    const res = await fetch(`${API_URL}/api/chat/messages?limit=${limit}&offset=${offset}`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async getBannedUsers() {
    const res = await fetch(`${API_URL}/api/moderation/banned`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async getMutedUsers() {
    const res = await fetch(`${API_URL}/api/moderation/muted`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async banUser(data) {
    const res = await fetch(`${API_URL}/api/moderation/ban`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    return res.json()
  },

  async unbanUser(fingerprint, ip, adminUsername) {
    const res = await fetch(`${API_URL}/api/moderation/unban`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fingerprint, ip, adminUsername })
    })
    return res.json()
  },

  async muteUser(data) {
    const res = await fetch(`${API_URL}/api/moderation/mute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    return res.json()
  },

  async unmuteUser(fingerprint, adminUsername) {
    const res = await fetch(`${API_URL}/api/moderation/unmute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fingerprint, adminUsername })
    })
    return res.json()
  },

  async deleteMessage(messageId, adminUsername) {
    const res = await fetch(`${API_URL}/api/moderation/message/${messageId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ adminUsername })
    })
    return res.json()
  },

  async getActivityLogs(limit = 100, offset = 0) {
    const res = await fetch(`${API_URL}/api/analytics/logs?limit=${limit}&offset=${offset}`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async getMessageStats(period = '7days') {
    const res = await fetch(`${API_URL}/api/analytics/messages?period=${period}`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async getUserActivityStats() {
    const res = await fetch(`${API_URL}/api/analytics/activity`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async getStreamStats() {
    const res = await fetch(`${API_URL}/api/analytics/streams`, {
      headers: getHeaders()
    })
    return res.json()
  },

  async getModerationStats() {
    const res = await fetch(`${API_URL}/api/analytics/moderation`, {
      headers: getHeaders()
    })
    return res.json()
  }
}
