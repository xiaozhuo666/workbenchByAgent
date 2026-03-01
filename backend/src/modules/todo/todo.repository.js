const pool = require("../../db");

async function create(userId, title, description) {
  const [result] = await pool.execute(
    "INSERT INTO todos (user_id, title, description) VALUES (?, ?, ?)",
    [userId, title, description || null]
  );
  return { id: result.insertId, userId, title, description, status: "pending" };
}

async function findByUserId(userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC",
    [userId || null]
  );
  return rows;
}

async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM todos WHERE id = ? AND user_id = ?",
    [id || null, userId || null]
  );
  return rows[0];
}

async function updateStatus(id, userId, status) {
  await pool.execute(
    "UPDATE todos SET status = ? WHERE id = ? AND user_id = ?",
    [status || null, id || null, userId || null]
  );
}

async function remove(id, userId) {
  await pool.execute(
    "DELETE FROM todos WHERE id = ? AND user_id = ?",
    [id || null, userId || null]
  );
}

module.exports = {
  create,
  findByUserId,
  findByIdAndUserId,
  updateStatus,
  remove,
};
