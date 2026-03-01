import React, { useState, useRef, useEffect } from "react";
import { Input, Button, List, Card, Badge, Typography, Space, message, Spin } from "antd";
import { SendOutlined, RobotOutlined, UserOutlined, PlusOutlined, CheckCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import aiStore from "../../services/aiStore";
import { createTodo, getTodos, batchUpdateTodoStatus } from "../../api/todoApi";
import { createSchedule } from "../../api/scheduleApi";
import AIConfirmationModal from "../AIConfirmationModal";
import dayjs from "dayjs";

const { Text } = Typography;

const AISidebar = ({ onDraftSaved }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "你好！我是你的 AI 助手。我可以帮你创建任务、批量操作、或者自由对话。有什么需要吗？" }
  ]);
  const [loading, setLoading] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ open: false, summary: "", updates: [], todos: [] });
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const processSend = async (text) => {
    if (!text || !text.trim()) return;
    
    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setLoading(true);

    try {
      const currentTodos = await getTodos();
      const result = await aiStore.executeCommand(text, currentTodos);
      
      if (result.updates && result.updates.length > 0) {
        setConfirmationModal({
          open: true,
          summary: result.summary,
          updates: result.updates,
          todos: currentTodos
        });
        setLoading(false);
        return;
      }

      const drafts = await aiStore.generateTasks(text);
      if (drafts.length > 0) {
        const assistantMsg = { 
          role: "assistant", 
          content: `我已为你解析出 ${drafts.length} 个任务，是否保存？`,
          drafts: drafts 
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const chatResult = await aiStore.chat(
          text, 
          conversationId,
          updatedMessages.slice(0, -1)
        );
        setConversationId(chatResult.conversationId);
        const assistantMsg = { 
          role: "assistant", 
          content: chatResult.reply
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error("AI Error:", error);
      message.error(error.message || "AI 助手开小差了");
      setMessages(prev => [...prev, { role: "assistant", content: "抱歉，执行指令时出错了，请稍后再试。" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    processSend(inputValue);
  };

  const handleExampleClick = (text) => {
    if (loading) return;
    processSend(text);
  };

  const handleConfirmBatch = async () => {
    try {
      setLoading(true);
      await batchUpdateTodoStatus(confirmationModal.updates);
      message.success("批量操作已完成");
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `已成功执行批量操作：${confirmationModal.summary}`,
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />
      }]);
      setConfirmationModal({ ...confirmationModal, open: false });
      if (onDraftSaved) onDraftSaved();
    } catch (error) {
      message.error("批量操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDrafts = async (drafts, index) => {
    try {
      setLoading(true);
      await Promise.all(drafts.map(d => {
        if (d.type === "schedule") {
          return createSchedule({
            title: d.title,
            description: d.description,
            startTime: d.startTime,
            endTime: d.endTime
          });
        } else {
          return createTodo({
            title: d.title,
            description: d.description
          });
        }
      }));
      message.success("任务已保存");
      
      const newMessages = [...messages];
      newMessages[index].saved = true;
      setMessages(newMessages);
      
      if (onDraftSaved) onDraftSaved();
    } catch (error) {
      console.error("Save Error:", error);
      message.error("保存失败");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      { role: "assistant", content: "你好！我是你的 AI 助手。我可以帮你创建任务、批量操作、或者自由对话。有什么需要吗？" }
    ]);
    setConversationId(null);
    message.success("对话已清除");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "flex-end" }}>
        <Button 
          type="text" 
          size="small" 
          icon={<DeleteOutlined />} 
          onClick={handleClearChat}
          title="清除当前对话"
        >
          清除
        </Button>
      </div>
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#f9f9f9" }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: 16, textAlign: msg.role === "user" ? "right" : "left" }}>
            <Space direction="vertical" style={{ maxWidth: "85%", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                {msg.role === "assistant" && <Badge count={<RobotOutlined style={{ color: "#1677ff" }} />} />}
                <Text type="secondary" style={{ fontSize: 12 }}>{msg.role === "user" ? "你" : "AI 助手"}</Text>
                {msg.role === "user" && <Badge count={<UserOutlined style={{ color: "#8c8c8c" }} />} />}
              </div>
              <Card 
                size="small" 
                style={{ 
                  borderRadius: 8, 
                  background: msg.role === "user" ? "#1677ff" : "#fff",
                  color: msg.role === "user" ? "#fff" : "rgba(0,0,0,0.88)",
                  border: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                
                {index === 0 && msg.role === "assistant" && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>你可以试着这样说：</Text>
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => handleExampleClick("帮我安排明天上午的会议，提醒我明天下午买牛奶")}
                      >
                        “帮我安排明天上午的会议，提醒我明天下午买牛奶”
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => handleExampleClick("添加3个代办事项，分别是买牛奶，买衣服，买零食")}
                      >
                        “添加3个代办事项，分别是买牛奶，买衣服，买零食”
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => handleExampleClick("确认第一个代办事项")}
                      >
                        “确认第一个代办事项”
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => handleExampleClick("我已经买了零食了")}
                      >
                        “我已经买了零食了”
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: "auto", textAlign: "left", fontSize: 13 }}
                        onClick={() => handleExampleClick("特朗普是谁")}
                      >
                        “特朗普是谁”
                      </Button>
                    </Space>
                  </div>
                )}
                
                {msg.drafts && msg.drafts.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                    <List
                      size="small"
                      dataSource={msg.drafts}
                      renderItem={item => (
                        <List.Item style={{ padding: "4px 0", border: "none" }}>
                          <Space direction="vertical" size={0}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Badge status={item.type === "schedule" ? "processing" : "default"} />
                              <Text style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</Text>
                            </div>
                            {item.startTime && (
                              <Text type="secondary" style={{ fontSize: 11, marginLeft: 12 }}>
                                {dayjs(item.startTime).format("MM-DD HH:mm")}
                              </Text>
                            )}
                          </Space>
                        </List.Item>
                      )}
                    />
                    {!msg.saved ? (
                      <Button 
                        type="primary" 
                        size="small" 
                        block 
                        icon={<PlusOutlined />} 
                        style={{ marginTop: 8 }}
                        onClick={() => handleSaveDrafts(msg.drafts, index)}
                        disabled={loading}
                      >
                        全部保存
                      </Button>
                    ) : (
                      <div style={{ textAlign: "center", color: "#52c41a", marginTop: 8, fontSize: 13 }}>
                        <CheckCircleOutlined /> 已保存
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Space>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <Spin size="small" tip="思考中..." />
          </div>
        )}
      </div>

      <AIConfirmationModal
        open={confirmationModal.open}
        summary={confirmationModal.summary}
        updates={confirmationModal.updates}
        todos={confirmationModal.todos}
        onCancel={() => setConfirmationModal({ ...confirmationModal, open: false })}
        onConfirm={handleConfirmBatch}
      />

      <div style={{ padding: 16, background: "#fff", borderTop: "1px solid #f0f0f0" }}>
        <Input.TextArea
          placeholder="说出你的任务，例如：帮我安排明天上午十点的会议"
          autoSize={{ minRows: 2, maxRows: 4 }}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onPressEnter={e => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          style={{ marginBottom: 8 }}
        />
        <Button 
          type="primary" 
          block 
          icon={<SendOutlined />} 
          onClick={handleSend}
          disabled={loading || !inputValue.trim()}
        >
          发送
        </Button>
      </div>
    </div>
  );
};

export default AISidebar;
