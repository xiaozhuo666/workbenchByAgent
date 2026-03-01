const repository = require("./todo.repository");

async function createTodo(userId, { title, description }) {
  if (!title) throw new Error("Title is required");
  return await repository.create(userId, title, description);
}

async function getUserTodos(userId) {
  return await repository.findByUserId(userId);
}

async function updateTodoStatus(id, userId, status) {
  const todo = await repository.findByIdAndUserId(id, userId);
  if (!todo) throw new Error("Todo not found or unauthorized");
  await repository.updateStatus(id, userId, status);
  return { ...todo, status };
}

async function deleteTodo(id, userId) {
  const todo = await repository.findByIdAndUserId(id, userId);
  if (!todo) throw new Error("Todo not found or unauthorized");
  await repository.remove(id, userId);
  return true;
}

async function batchUpdateStatus(userId, updates) {
  // updates is an array of {id, status}
  // We should verify each todo belongs to the user
  for (const update of updates) {
    const todo = await repository.findByIdAndUserId(update.id, userId);
    if (todo) {
      await repository.updateStatus(update.id, userId, update.status);
    }
  }
  return true;
}

module.exports = {
  createTodo,
  getUserTodos,
  updateTodoStatus,
  deleteTodo,
  batchUpdateStatus,
};
