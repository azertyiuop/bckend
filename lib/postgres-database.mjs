import pkg from 'pg';
const { Pool } = pkg;

class PostgresDatabase {
  constructor(connectionString) {
    this.pool = null;
    this.connectionString = connectionString;
    this.init();
  }

  async init() {
    try {
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      await this.pool.query('SELECT NOW()');
      console.log('✅ Connexion DB PostgreSQL établie');
      await this.createTables();
    } catch (err) {
      console.error('Erreur ouverture DB PostgreSQL:', err.message);
      throw err;
    }
  }

  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS connected_users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        ip TEXT NOT NULL,
        user_agent TEXT,
        connect_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        page TEXT DEFAULT 'home',
        fingerprint TEXT
      )`,

      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'viewer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        discord_id TEXT,
        discord_username TEXT,
        expires_at TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role TEXT DEFAULT 'viewer',
        is_system BOOLEAN DEFAULT false,
        color TEXT,
        ip TEXT,
        fingerprint TEXT,
        stream_key TEXT
      )`,

      `CREATE TABLE IF NOT EXISTS banned_users (
        id SERIAL PRIMARY KEY,
        fingerprint TEXT,
        ip TEXT,
        username TEXT,
        banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ban_end_time TIMESTAMP,
        reason TEXT,
        banned_by TEXT,
        is_permanent BOOLEAN DEFAULT false
      )`,

      `CREATE TABLE IF NOT EXISTS muted_users (
        id SERIAL PRIMARY KEY,
        fingerprint TEXT NOT NULL,
        username TEXT,
        ip TEXT,
        muted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        mute_end_time TIMESTAMP NOT NULL,
        reason TEXT,
        muted_by TEXT,
        mute_count INTEGER DEFAULT 1
      )`,

      `CREATE TABLE IF NOT EXISTS streams (
        id SERIAL PRIMARY KEY,
        stream_key TEXT UNIQUE NOT NULL,
        title TEXT,
        description TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        is_live BOOLEAN DEFAULT true
      )`,

      `CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        action_type TEXT NOT NULL,
        username TEXT,
        ip_address TEXT,
        fingerprint TEXT,
        details TEXT,
        severity TEXT DEFAULT 'low',
        admin_username TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    try {
      for (const tableSQL of tables) {
        await this.pool.query(tableSQL);
      }
      console.log('✅ Tables PostgreSQL créées ou vérifiées');
    } catch (err) {
      console.error('Erreur création tables PostgreSQL:', err.message);
      throw err;
    }
  }

  async run(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return {
        id: result.rows[0]?.id || null,
        changes: result.rowCount
      };
    } catch (err) {
      throw err;
    }
  }

  async get(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows[0] || null;
    } catch (err) {
      throw err;
    }
  }

  async all(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (err) {
      throw err;
    }
  }

  async addConnectedUser(userData) {
    const sql = `INSERT INTO connected_users
                 (id, username, ip, user_agent, page, fingerprint)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO UPDATE SET
                 username = $2, ip = $3, user_agent = $4, page = $5, fingerprint = $6, last_activity = CURRENT_TIMESTAMP`;
    return await this.run(sql, [
      userData.id,
      userData.username,
      userData.ip,
      userData.userAgent,
      userData.page,
      userData.fingerprint
    ]);
  }

  async removeConnectedUser(userId) {
    return await this.run(`DELETE FROM connected_users WHERE id = $1`, [userId]);
  }

  async getConnectedUsers() {
    return await this.all(`SELECT * FROM connected_users ORDER BY connect_time DESC`);
  }

  async addChatMessage(messageData) {
    const sql = `INSERT INTO chat_messages
                 (id, username, message, timestamp, role, is_system, color, ip, fingerprint, stream_key)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
    return await this.run(sql, [
      messageData.id,
      messageData.username,
      messageData.message,
      messageData.timestamp,
      messageData.role || 'viewer',
      messageData.isSystem || false,
      messageData.color,
      messageData.ip,
      messageData.fingerprint,
      messageData.streamKey || null
    ]);
  }

  async deleteChatMessage(messageId) {
    return await this.run(`DELETE FROM chat_messages WHERE id = $1`, [messageId]);
  }

  async banUser(userData) {
    const sql = `INSERT INTO banned_users
                 (fingerprint, ip, username, ban_end_time, reason, banned_by, is_permanent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    return await this.run(sql, [
      userData.fingerprint,
      userData.ip,
      userData.username,
      userData.banEndTime,
      userData.reason,
      userData.bannedBy,
      userData.isPermanent || false
    ]);
  }

  async muteUser(userData) {
    const sql = `INSERT INTO muted_users
                 (fingerprint, username, ip, mute_end_time, reason, muted_by, mute_count)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    return await this.run(sql, [
      userData.fingerprint,
      userData.username,
      userData.ip,
      userData.muteEndTime,
      userData.reason,
      userData.mutedBy,
      userData.muteCount || 1
    ]);
  }

  async isUserBanned(fingerprint, ip) {
    const sql = `SELECT * FROM banned_users
                 WHERE (fingerprint = $1 OR ip = $2)
                 AND (ban_end_time IS NULL OR ban_end_time > CURRENT_TIMESTAMP)
                 ORDER BY banned_at DESC LIMIT 1`;
    return await this.get(sql, [fingerprint, ip]);
  }

  async isUserMuted(fingerprint) {
    const sql = `SELECT * FROM muted_users
                 WHERE fingerprint = $1
                 AND mute_end_time > CURRENT_TIMESTAMP
                 ORDER BY muted_at DESC LIMIT 1`;
    return await this.get(sql, [fingerprint]);
  }

  async getBannedUsers() {
    const sql = `SELECT * FROM banned_users
                 WHERE ban_end_time IS NULL OR ban_end_time > CURRENT_TIMESTAMP
                 ORDER BY banned_at DESC`;
    return await this.all(sql);
  }

  async getMutedUsers() {
    const sql = `SELECT * FROM muted_users
                 WHERE mute_end_time > CURRENT_TIMESTAMP
                 ORDER BY muted_at DESC`;
    return await this.all(sql);
  }

  async unbanUser(fingerprint, ip) {
    const sql = `UPDATE banned_users
                 SET ban_end_time = CURRENT_TIMESTAMP
                 WHERE (fingerprint = $1 OR ip = $2)
                 AND (ban_end_time IS NULL OR ban_end_time > CURRENT_TIMESTAMP)`;
    return await this.run(sql, [fingerprint, ip]);
  }

  async unmuteUser(fingerprint) {
    const sql = `UPDATE muted_users
                 SET mute_end_time = CURRENT_TIMESTAMP
                 WHERE fingerprint = $1
                 AND mute_end_time > CURRENT_TIMESTAMP`;
    return await this.run(sql, [fingerprint]);
  }

  async clearExpiredMutes() {
    return await this.run(`DELETE FROM muted_users WHERE mute_end_time <= CURRENT_TIMESTAMP`);
  }

  async createUser(userData) {
    const sql = `INSERT INTO users (id, username, password_hash, role) VALUES ($1, $2, $3, $4)`;
    return await this.run(sql, [
      userData.id,
      userData.username,
      userData.passwordHash,
      userData.role || 'viewer'
    ]);
  }

  async findUserByUsername(username) {
    return await this.get(`SELECT * FROM users WHERE username = $1 AND is_active = true`, [username]);
  }

  async updateUserLastLogin(userId) {
    return await this.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`, [userId]);
  }

  async addStream(streamData) {
    const sql = `INSERT INTO streams (stream_key, title, description) VALUES ($1, $2, $3)`;
    return await this.run(sql, [streamData.key, streamData.title, streamData.description]);
  }

  async endStream(streamKey) {
    const sql = `UPDATE streams SET ended_at = CURRENT_TIMESTAMP, is_live = false WHERE stream_key = $1`;
    return await this.run(sql, [streamKey]);
  }

  async getActiveStreams() {
    return await this.all(`SELECT * FROM streams WHERE is_live = true`);
  }

  async addActivityLog(logData) {
    const sql = `INSERT INTO activity_logs
                 (action_type, username, ip_address, fingerprint, details, severity, admin_username)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    return await this.run(sql, [
      logData.action_type,
      logData.username || '',
      logData.ip_address || '',
      logData.fingerprint || '',
      JSON.stringify(logData.details || {}),
      logData.severity || 'low',
      logData.admin_username || 'system'
    ]);
  }

  async getActivityLogs(limit = 100) {
    const logs = await this.all(`SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1`, [limit]);
    return logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : {}
    }));
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ PostgreSQL pool fermé');
    }
  }
}

export default PostgresDatabase;
