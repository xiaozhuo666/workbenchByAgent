import React, { useState, useRef, useEffect } from "react";
import { Input, Button, List, Card, Badge, Typography, Space, message, Spin, Empty } from "antd";
import { SendOutlined, RobotOutlined, UserOutlined, PlusOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
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
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg = { role: "user", content: inputValue };
    const currentInputValue = inputValue;
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setLoading(true);

    try {
      // Try to execute command (batch update)
      const currentTodos = await getTodos();
      const result = await aiStore.executeCommand(currentInputValue, currentTodos);
      
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

      // Try to generate new tasks
      const drafts = await aiStore.generateTasks(currentInputValue);
      if (drafts.length > 0) {
        const assistantMsg = { 
          role: "assistant", 
          content: `我已为你解析出 ${drafts.length} 个任务，是否保存？`,
          drafts: drafts 
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Fall back to free chat
        const reply = await aiStore.chat(currentInputValue, updatedMessages.slice(0, -1));
        const assistantMsg = { 
          role: "assistant", 
          content: reply
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
      
      // Update message to show saved status
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
                {msg.content}
                
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
