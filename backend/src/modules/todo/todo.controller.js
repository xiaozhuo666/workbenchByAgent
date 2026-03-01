const service = require("./todo.service");

async function list(req, res, next) {
  try {
    const todos = await service.getUserTodos(req.auth.id);
    res.json({ code: "OK", data: todos });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const todo = await service.createTodo(req.auth.id, req.body);
    res.status(201).json({ code: "OK", data: todo });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const todo = await service.updateTodoStatus(req.params.id, req.auth.id, req.body.status);
    res.json({ code: "OK", data: todo });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await service.deleteTodo(req.params.id, req.auth.id);
    res.json({ code: "OK", message: "Deleted" });
  } catch (error) {
    next(error);
  }
}

async function batchUpdateStatus(req, res, next) {
  try {
    const { updates } = req.body;
    await service.batchUpdateStatus(req.auth.id, updates);
    res.json({ code: "OK", message: "Updated" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  updateStatus,
  remove,
  batchUpdateStatus,
};
