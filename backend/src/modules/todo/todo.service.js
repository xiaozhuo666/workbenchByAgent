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
  // status can be 'pending', 'completed', or 'delete'
  console.log(`Processing batch update for user ${userId}:`, JSON.stringify(updates));
  
  for (const update of updates) {
    const todo = await repository.findByIdAndUserId(update.id, userId);
    if (todo) {
      const normalizedStatus = String(update.status).toLowerCase().trim();
      
      if (normalizedStatus === 'delete' || normalizedStatus === 'remove') {
        await repository.remove(update.id, userId);
      } else if (normalizedStatus === 'completed' || normalizedStatus === 'pending') {
        await repository.updateStatus(update.id, userId, normalizedStatus);
      } else {
        console.warn(`Invalid status received in batch update: ${update.status} for todo ${update.id}`);
      }
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
