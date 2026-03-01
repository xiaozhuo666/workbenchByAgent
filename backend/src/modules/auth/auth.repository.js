const pool = require("../../db");

async function findByUsername(username) {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username || null]);
  return rows[0] || null;
}

async function findByAccount(account) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1",
    [account || null, account || null]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email || null]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    "SELECT id, username, email, status, created_at FROM users WHERE id = ? LIMIT 1",
    [id || null]
  );
  return rows[0] || null;
}

async function createUser({ username, email, passwordHash }) {
  const [result] = await pool.query(
    "INSERT INTO users (username, email, password_hash, status) VALUES (?, ?, ?, 1)",
    [username || null, email || null, passwordHash || null]
  );
  return findById(result.insertId);
}

async function createSession({ userId, jti, tokenExpiresAt, ip, userAgent }) {
  await pool.query(
    "INSERT INTO sessions (user_id, jti, token_expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)",
    [userId || null, jti || null, tokenExpiresAt || null, ip || null, userAgent || null]
  );
}

async function findActiveSessionByJti(jti) {
  const [rows] = await pool.query(
    "SELECT * FROM sessions WHERE jti = ? AND revoked_at IS NULL AND token_expires_at > NOW() LIMIT 1",
    [jti || null]
  );
  return rows[0] || null;
}

async function revokeSessionByJti(jti) {
  await pool.query("UPDATE sessions SET revoked_at = NOW() WHERE jti = ? AND revoked_at IS NULL", [jti || null]);
}

module.exports = {
  findByUsername,
  findByAccount,
  findByEmail,
  findById,
  createUser,
  createSession,
  findActiveSessionByJti,
  revokeSessionByJti,
};
