const pool = require("../../../db");

async function createDraft({
  draftId,
  userId,
  source,
  route,
  date,
  preferences,
  status,
  expiresAt,
}) {
  await pool.execute(
    `INSERT INTO ticket_drafts
    (draft_id, user_id, source, from_city, from_station_code, to_city, to_station_code, travel_date, train_types, departure_time_range, seat_types, strategy, status, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      draftId,
      userId,
      source || "ai_assistant",
      route.fromCity,
      route.fromStationCode || null,
      route.toCity,
      route.toStationCode || null,
      date,
      JSON.stringify(preferences?.trainTypes || []),
      preferences?.departureTimeRange || null,
      JSON.stringify(preferences?.seatTypes || []),
      preferences?.strategy || null,
      status || "ready",
      expiresAt,
    ]
  );
}

async function getDraftById(userId, draftId) {
  const [rows] = await pool.execute(
    `SELECT draft_id, user_id, source, from_city, from_station_code, to_city, to_station_code, travel_date,
      train_types, departure_time_range, seat_types, strategy, status, expires_at, created_at, updated_at
    FROM ticket_drafts
    WHERE user_id = ? AND draft_id = ?
    LIMIT 1`,
    [userId, draftId]
  );
  return rows[0] || null;
}

async function updateDraftStatus(draftId, status) {
  await pool.execute(
    "UPDATE ticket_drafts SET status = ? WHERE draft_id = ?",
    [status, draftId]
  );
}

async function logTicketQuery({
  draftId,
  userId,
  queryStatus = "success",
  resultCount = 0,
  durationMs = 0,
  errorCode = null,
}) {
  await pool.execute(
    `INSERT INTO ticket_query_logs
    (draft_id, user_id, query_status, result_count, duration_ms, error_code)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [draftId, userId, queryStatus, resultCount, durationMs, errorCode]
  );
}

module.exports = {
  createDraft,
  getDraftById,
  updateDraftStatus,
  logTicketQuery,
};
