import httpClient from "./httpClient";

export const getTodos = async () => {
  const { data } = await httpClient.get("/todos");
  return data.data;
};

export const createTodo = async (todoData) => {
  const { data } = await httpClient.post("/todos", todoData);
  return data.data;
};

export const updateTodoStatus = async (id, status) => {
  const { data } = await httpClient.patch(`/todos/${id}/status`, { status });
  return data.data;
};

export const batchUpdateTodoStatus = async (updates) => {
  await httpClient.patch("/todos/batch-status", { updates });
};

export const deleteTodo = async (id) => {
  await httpClient.delete(`/todos/${id}`);
};
