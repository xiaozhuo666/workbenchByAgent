const pool = require("../../db");

async function create(userId, title, description, startTime, endTime) {
  const [result] = await pool.execute(
    "INSERT INTO schedules (user_id, title, description, start_time, end_time) VALUES (?, ?, ?, ?, ?)",
    [userId, title, description || null, startTime, endTime || null]
  );
  return { id: result.insertId, userId, title, description, startTime, endTime };
}

async function findByUserId(userId, startTime, endTime) {
  let query = "SELECT * FROM schedules WHERE user_id = ?";
  const params = [userId || null];
  if (startTime) {
    query += " AND start_time >= ?";
    params.push(startTime);
  }
  if (endTime) {
    query += " AND start_time <= ?";
    params.push(endTime);
  }
  query += " ORDER BY start_time ASC";
  const [rows] = await pool.execute(query, params);
  return rows;
}

async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM schedules WHERE id = ? AND user_id = ?",
    [id || null, userId || null]
  );
  return rows[0];
}

async function remove(id, userId) {
  await pool.execute(
    "DELETE FROM schedules WHERE id = ? AND user_id = ?",
    [id || null, userId || null]
  );
}

module.exports = {
  create,
  findByUserId,
  findByIdAndUserId,
  remove,
};
