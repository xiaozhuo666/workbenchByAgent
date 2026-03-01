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

  async chat(text, conversationId = null, conversationHistory = []) {
    const { data } = await httpClient.post("/ai/chat", { 
      text, 
      conversationId,
      conversationHistory 
    });
    return {
      reply: data.data.reply,
      conversationId: data.data.conversationId
    };
  }

  async getConversationHistory(conversationId, limit = 20) {
    const { data } = await httpClient.get(`/ai/conversations/${conversationId}`, {
      params: { limit }
    });
    return data.data;
  }

  async listConversations(limit = 10, offset = 0) {
    const { data } = await httpClient.get("/ai/conversations", {
      params: { limit, offset }
    });
    return data.data;
  }

  async deleteConversation(conversationId) {
    const { data } = await httpClient.delete(`/ai/conversations/${conversationId}`);
    return data.data;
  }
}

const aiStore = new AIStore();
export default aiStore;
