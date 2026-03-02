import httpClient from "../api/httpClient";

class AIStore {
  async generateTasks(text, conversationId = null) {
    const { data } = await httpClient.post("/ai/generate-tasks", { text, conversationId });
    return data.data;
  }

  async executeCommand(text, currentTodos, conversationId = null) {
    const { data } = await httpClient.post("/ai/execute-command", { text, currentTodos, conversationId });
    return data.data;
  }

  async chat({ text, conversationId = null, model = "qwen-plus" }) {
    const { data } = await httpClient.post("/ai/chat", { 
      text, 
      conversationId,
      model,
      stream: false
    });
    return data.data;
  }

  /**
   * Chat with streaming response (SSE)
   */
  async chatStream({ text, conversationId = null, model = "qwen-plus", onChunk, onDone, onError }) {
    try {
      const response = await fetch(`${httpClient.defaults.baseURL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          text,
          conversationId,
          model,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`网络响应异常: ${response.status}`);
      }

      // Check if it's actually an event stream
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        // Fallback for non-streaming response
        const data = await response.json();
        if (data.code === 'OK') {
          onChunk && onChunk({ content: data.data.reply, conversationId: data.data.conversationId });
          onDone && onDone();
          return;
        } else {
          throw new Error(data.message || '获取回复失败');
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                onDone && onDone();
                return;
              }

              try {
                const data = JSON.parse(dataStr);
                onChunk && onChunk(data);
              } catch (e) {
                console.error('Error parsing stream chunk:', e, dataStr);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // Call onDone if the loop finished normally without [DONE]
      onDone && onDone();
    } catch (error) {
      console.error('Stream error:', error);
      onError && onError(error);
    }
  }

  async getConversationHistory(conversationId) {
    const { data } = await httpClient.get(`/ai/conversations/${conversationId}`);
    return data.data;
  }

  async listConversations(limit = 20, offset = 0) {
    console.log(`AIStore: listConversations calling ${httpClient.defaults.baseURL}/ai/conversations`);
    const { data } = await httpClient.get("/ai/conversations", {
      params: { limit, offset }
    });
    console.log('AIStore: listConversations result:', data);
    return data.data;
  }

  async deleteConversation(conversationId) {
    const { data } = await httpClient.delete(`/ai/conversations/${conversationId}`);
    return data.data;
  }
}

const aiStore = new AIStore();
export default aiStore;
