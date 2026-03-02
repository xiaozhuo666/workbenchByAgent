# API Contract: AI 会话服务 (v1.1.0)

## Overview
所有请求需携带 `Authorization: Bearer <token>`。

## 1. 对话流式推送 (SSE)
发送用户消息并开启流式回复。

- **Endpoint**: `POST /api/ai/chat`
- **Body**:
```json
{
  "text": "你好，帮我写段代码",
  "conversationId": "uuid-xxxx-xxxx", (可选)
  "model": "qwen-max", (可选, 默认 qwen-plus)
  "stream": true
}
```
- **Response**: `text/event-stream`
- **Events**:
    - `data: {"role": "assistant", "content": "..."}`: 流式回复片段。
    - `data: {"conversationId": "uuid-xxxx"}`: 如果是新会话，返回 ID。
    - `data: [DONE]`: 回复结束。

## 2. 获取历史会话列表
用户侧边栏显示。

- **Endpoint**: `GET /api/ai/conversations`
- **Response**:
```json
{
  "code": "OK",
  "data": [
    {
      "id": "uuid-1",
      "title": "关于 React 的讨论",
      "model": "qwen-plus",
      "updated_at": "2026-03-02 12:00:00"
    }
  ]
}
```

## 3. 获取特定会话消息详情
点击切换会话时。

- **Endpoint**: `GET /api/ai/conversations/:id`
- **Response**:
```json
{
  "code": "OK",
  "data": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

## 4. 删除会话
- **Endpoint**: `DELETE /api/ai/conversations/:id`
- **Response**: `{"code": "OK"}`
