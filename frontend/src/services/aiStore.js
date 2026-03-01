import httpClient from "../api/httpClient";

class AIStore {
  async generateTodos(text) {
    const { data } = await httpClient.post("/ai/generate-todos", { text });
    return data.data;
  }

  async executeCommand(text, currentTodos) {
    const { data } = await httpClient.post("/ai/execute-command", { text, currentTodos });
    return data.data;
  }
}

export default new AIStore();
