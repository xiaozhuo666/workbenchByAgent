import httpClient from "../api/httpClient";

class AIStore {
  async generateTasks(text) {
    const { data } = await httpClient.post("/ai/generate-tasks", { text });
    return data.data;
  }

  async executeCommand(text, currentTodos) {
    const { data } = await httpClient.post("/ai/execute-command", { text, currentTodos });
    return data.data;
  }

  async chat(text, conversationHistory = []) {
    const { data } = await httpClient.post("/ai/chat", { text, conversationHistory });
    return data.data.reply;
  }
}

export default new AIStore();
