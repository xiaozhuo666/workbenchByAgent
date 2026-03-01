const repository = require("./schedule.repository");

async function createSchedule(userId, { title, description, startTime, endTime }) {
  if (!title || !startTime) throw new Error("Title and start time are required");
  return await repository.create(userId, title, description, startTime, endTime);
}

async function getUserSchedules(userId, { startTime, endTime } = {}) {
  return await repository.findByUserId(userId, startTime, endTime);
}

async function deleteSchedule(id, userId) {
  const schedule = await repository.findByIdAndUserId(id, userId);
  if (!schedule) throw new Error("Schedule not found or unauthorized");
  await repository.remove(id, userId);
  return true;
}

module.exports = {
  createSchedule,
  getUserSchedules,
  deleteSchedule,
};
