const service = require("./schedule.service");

async function list(req, res, next) {
  try {
    const schedules = await service.getUserSchedules(req.auth.id, req.query);
    res.json({ code: "OK", data: schedules });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const schedule = await service.createSchedule(req.auth.id, req.body);
    res.status(201).json({ code: "OK", data: schedule });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await service.deleteSchedule(req.params.id, req.auth.id);
    res.json({ code: "OK", message: "Deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  remove,
};
