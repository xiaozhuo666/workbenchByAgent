import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input, Button, List, Card, Badge, Typography, Space, message, Spin, Tooltip, Drawer, Divider, Tag, Avatar } from "antd";
import { 
  SendOutlined, RobotOutlined, UserOutlined, PlusOutlined, 
  CheckCircleOutlined, DeleteOutlined, HistoryOutlined,
  DownloadOutlined, ThunderboltOutlined, RocketOutlined,
  GlobalOutlined
} from "@ant-design/icons";
import aiStore from "../../services/aiStore";
import { getTodos, batchUpdateTodoStatus, createTodo } from "../../api/todoApi";
import { createSchedule } from "../../api/scheduleApi";
import { createTicketDraft } from "../../api/ticketApi";
import AIConfirmationModal from "../AIConfirmationModal";
import ConversationList from "../AI/ConversationList";
import ModelSelector from "../AI/ModelSelector";
import TripDraftCard from "../AI/TripDraftCard";
import { exportToMarkdown } from "../../utils/exportUtils";
import dayjs from "dayjs";

const { Text, Title, Paragraph } = Typography;

const AISidebar = ({ onDraftSaved }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "你好！我是你的 AI 助手。我可以帮你创建任务、批量操作、或者自由对话。有什么需要吗？" }
  ]);
  const [loading, setLoading] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ open: false, summary: "", updates: [], todos: [] });
  const [conversationId, setConversationId] = useState(null);
  const [model, setModel] = useState(() => localStorage.getItem("ai_model") || "qwen-plus");
  const [showHistory, setShowHistory] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const scrollRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  // Persistent model preference
  useEffect(() => {
    localStorage.setItem("ai_model", model);
  }, [model]);

  /**
   * Start a new chat
   */
  const handleNewChat = () => {
    setMessages([{ role: "assistant", content: "新会话已开启，有什么可以帮你的吗？" }]);
    setConversationId(null);
    setShowHistory(false);
    message.success("已切换到新会话");
  };

  /**
   * Load a specific conversation
   */
  const handleSelectConversation = async (id) => {
    setLoading(true);
    setShowHistory(false);
    try {
      const history = await aiStore.getConversationHistory(id);
      setMessages(history.length > 0 ? history : [{ role: "assistant", content: "正在恢复对话..." }]);
      setConversationId(id);
    } catch (error) {
      message.error("恢复会话失败");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process sending a message (supports streaming)
   */
  const parseTicketDraftInput = (text) => {
    const input = String(text || "").trim();
    const matched = input.match(/(?:查|看).*(?:从)?([\u4e00-\u9fa5]{2,8})到([\u4e00-\u9fa5]{2,8}).*(今天|明天|后天|\d{4}-\d{2}-\d{2})/);
    if (!matched) return null;
    const fromCity = matched[1];
    const toCity = matched[2];
    let date = matched[3];
    const now = dayjs();
    if (date === "今天") date = now.format("YYYY-MM-DD");
    if (date === "明天") date = now.add(1, "day").format("YYYY-MM-DD");
    if (date === "后天") date = now.add(2, "day").format("YYYY-MM-DD");
    return {
      route: { fromCity, toCity },
      date,
      preferences: {
        trainTypes: /高铁|动车/.test(input) ? ["G", "D"] : [],
        seatTypes: [],
        departureTimeRange: "",
        strategy: "fastest",
      },
    };
  };

  const processSend = async (text) => {
    if (!text || !text.trim()) return;
    
    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setLoading(true);

    try {
      const ticketDraftPayload = parseTicketDraftInput(text);
      if (ticketDraftPayload) {
        const draftMeta = await createTicketDraft(ticketDraftPayload);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "已为你生成行程卡，你可以直接查看结果或继续细化条件。",
            ticketDraft: {
              ...ticketDraftPayload,
              draftId: draftMeta.draftId,
              status: draftMeta.status,
              expiresAt: draftMeta.expiresAt,
            },
          },
        ]);
        setLoading(false);
        return;
      }

      // 1. Check for batch commands or task generation first (Legacy features)
      const currentTodos = await getTodos();
      const commandResult = await aiStore.executeCommand(text, currentTodos, conversationId);
      
      // 增加 summary 判断，只有 AI 确认是操作指令且有更新项时才弹出
      if (commandResult.updates && commandResult.updates.length > 0 && commandResult.summary !== "不是操作指令") {
        if (commandResult.conversationId && !conversationId) {
          setConversationId(commandResult.conversationId);
        }
        // 同步后端已保存的确认消息到前端状态中，确保对话历史实时展示
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: commandResult.summary || "已识别出批量操作指令，请确认："
        }]);
        setConfirmationModal({
          open: true,
          summary: commandResult.summary,
          updates: commandResult.updates,
          todos: currentTodos
        });
        setLoading(false);
        return;
      }

      const res = await aiStore.generateTasks(text, conversationId);
      if (res.tasks && res.tasks.length > 0) {
        if (res.conversationId && !conversationId) {
          setConversationId(res.conversationId);
        }
        const reply = `我已为你解析出 ${res.tasks.length} 个任务，是否保存？`;
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: reply,
          drafts: res.tasks 
        }]);
        setLoading(false);
        return;
      }

      // 2. Default to Streaming Chat
      setIsStreaming(true);
      let fullReply = "";
      
      // Add a placeholder assistant message for streaming
      setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);

      await aiStore.chatStream({
        text,
        conversationId,
        model,
        onChunk: (chunk) => {
          if (chunk.content) {
            fullReply += chunk.content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last && last.isStreaming) {
                return [...prev.slice(0, -1), { ...last, content: fullReply }];
              }
              return prev;
            });
          }
          if (chunk.conversationId && !conversationId) {
            setConversationId(chunk.conversationId);
          }
        },
        onDone: () => {
          setIsStreaming(false);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, isStreaming: false }];
          });
          setLoading(false);
        },
        onError: (err) => {
          setIsStreaming(false);
          setLoading(false);
          message.error("流式回复中断");
        }
      });

    } catch (error) {
      console.error("AI Error:", error);
      message.error(error.message || "AI 助手开小差了");
      setMessages(prev => [...prev, { role: "assistant", content: "抱歉，由于网络或 API 限制，无法完成对话。" }]);
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSend = () => {
    processSend(inputValue);
  };

  const handleExport = (msg) => {
    exportToMarkdown(msg.content, `AI_回复_${dayjs().format('YYYYMMDD_HHmm')}`);
    message.success("内容已导出");
  };

  /**
   * 保存所有解析出的任务
   */
  const handleSaveDrafts = async (drafts, index) => {
    if (!drafts || drafts.length === 0) return;
    
    setLoading(true);
    try {
      const promises = drafts.map(draft => {
        if (draft.type === "todo") {
          return createTodo({
            title: draft.title,
            description: draft.description || "",
            status: "pending"
          });
        } else if (draft.type === "schedule") {
          return createSchedule({
            title: draft.title,
            description: draft.description || "",
            startTime: draft.startTime,
            endTime: draft.endTime
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      
      message.success(`成功保存 ${drafts.length} 个任务`);
      
      // 在消息列表中标记为已保存
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[index]) {
          newMessages[index] = { ...newMessages[index], saved: true };
        }
        return newMessages;
      });

      // 触发回调以刷新主列表（如果提供了）
      if (onDraftSaved) {
        onDraftSaved();
      }
    } catch (error) {
      console.error("Failed to save drafts:", error);
      message.error("保存任务失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", position: "relative", overflow: "hidden" }}>
      {/* Header & Controls */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
        <Space>
          <Tooltip title="历史记录">
            <Button 
              type="text" 
              icon={<HistoryOutlined />} 
              onClick={() => setShowHistory(true)} 
            />
          </Tooltip>
          <Tooltip title="开启新会话">
            <Button 
              type="text" 
              icon={<PlusOutlined />} 
              onClick={handleNewChat} 
            />
          </Tooltip>
        </Space>
        
        <ModelSelector value={model} onChange={setModel} disabled={isStreaming} />
      </div>

      {/* History Drawer */}
      <Drawer
        title="对话历史"
        placement="left"
        onClose={() => setShowHistory(false)}
        open={showHistory}
        width={320}
        styles={{ body: { padding: 0 } }}
        getContainer={false}
      >
        {showHistory && (
          <ConversationList 
            activeId={conversationId} 
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        )}
      </Drawer>

      {/* Message List */}
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#f9f9f9" }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: 20, textAlign: msg.role === "user" ? "right" : "left" }}>
            <Space direction="vertical" style={{ maxWidth: "90%", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 8, marginBottom: 4 }}>
                {msg.role === "assistant" && <Avatar size="small" icon={<RobotOutlined />} style={{ background: "var(--primary-color, #0EA5E9)" }} />}
                <Text type="secondary" style={{ fontSize: 12 }}>{msg.role === "user" ? "你" : "AI 助手"}</Text>
                {msg.role === "user" && <Avatar size="small" icon={<UserOutlined />} style={{ background: "#8c8c8c" }} />}
              </div>
              
              <Card 
                size="small" 
                hoverable={msg.role === "assistant"}
                style={{ 
                  borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", 
                  background: msg.role === "user" ? "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)" : "#fff",
                  color: msg.role === "user" ? "#fff" : "var(--text-main)",
                  border: msg.role === "user" ? "none" : "1px solid #F1F5F9",
                  boxShadow: msg.role === "user" ? "0 4px 12px rgba(14, 165, 233, 0.2)" : "0 2px 8px rgba(0,0,0,0.02)"
                }}
                className="message-bubble"
              >
                <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 }}>{msg.content}</div>
                
                {index === 0 && msg.role === "assistant" && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>你可以试着这样说：</Text>
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => processSend("帮我安排今天上午的会议，提醒我明天下午买牛奶")}
                      >
                        “帮我安排今天上午的会议，提醒我明天下午买牛奶”
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => processSend("添加3个代办事项，分别是买牛奶，买衣服，买零食")}
                      >
                        “添加3个代办事项，分别是买牛奶，买衣服，买零食”
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => processSend("确认第一个代办事项")}
                      >
                        “确认第一个代办事项”
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => processSend("我已经买了零食了")}
                      >
                        “我已经买了零食了”
                      </Button>
                    </Space>
                  </div>
                )}
                
                {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                    <Tooltip title="导出为 Markdown">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<DownloadOutlined />} 
                        onClick={() => handleExport(msg)}
                        style={{ color: "#8c8c8c" }}
                      />
                    </Tooltip>
                  </div>
                )}

                {msg.drafts && msg.drafts.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                    <List
                      size="small"
                      dataSource={msg.drafts}
                      renderItem={item => (
                        <List.Item style={{ padding: "4px 0", border: "none" }}>
                          <Space align="start">
                            <Badge status={item.type === "schedule" ? "processing" : "default"} />
                            <div>
                              <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                              {item.startTime && (
                                <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                                  {dayjs(item.startTime).format("YYYY-MM-DD HH:mm")}
                                </div>
                              )}
                            </div>
                          </Space>
                        </List.Item>
                      )}
                    />
                    <Button 
                      type="primary" 
                      size="small" 
                      block 
                      icon={<PlusOutlined />} 
                      style={{ marginTop: 12 }}
                      disabled={msg.saved}
                      onClick={() => handleSaveDrafts(msg.drafts, index)}
                    >
                      {msg.saved ? "已保存" : "全部保存"}
                    </Button>
                  </div>
                )}

                {msg.ticketDraft && (
                  <TripDraftCard
                    draft={msg.ticketDraft}
                    onRefine={() => {
                      message.info("请继续描述偏好，例如：最早出发、最短耗时、二等座。");
                    }}
                  />
                )}
              </Card>
            </Space>
          </div>
        ))}
        {loading && !isStreaming && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin tip="加载中..." />
          </div>
        )}
      </div>

      <AIConfirmationModal
        open={confirmationModal.open}
        summary={confirmationModal.summary}
        updates={confirmationModal.updates}
        todos={confirmationModal.todos}
        onCancel={() => setConfirmationModal({ ...confirmationModal, open: false })}
        onConfirm={async () => {
          await batchUpdateTodoStatus(confirmationModal.updates);
          setConfirmationModal({ ...confirmationModal, open: false });
          onDraftSaved && onDraftSaved();
        }}
      />

      {/* Input Area */}
      <div style={{ padding: 16, background: "#fff", borderTop: "1px solid #f0f0f0" }}>
        <Input.TextArea
          placeholder="输入你的消息，使用 Shift + Enter 换行"
          autoSize={{ minRows: 2, maxRows: 5 }}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onPressEnter={e => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading || isStreaming}
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
        <Button 
          type="primary" 
          block 
          size="large"
          icon={isStreaming ? <Spin size="small" style={{ marginRight: 8 }} /> : <SendOutlined />} 
          onClick={handleSend}
          disabled={loading || isStreaming || !inputValue.trim()}
          style={{ borderRadius: 8, height: 40 }}
        >
          {isStreaming ? "AI 正在思考..." : "发送消息"}
        </Button>
      </div>
    </div>
  );
};

export default AISidebar;
