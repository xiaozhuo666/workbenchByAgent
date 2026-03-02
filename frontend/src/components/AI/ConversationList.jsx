import React, { useEffect, useState } from "react";
import { List, Typography, Button, Popconfirm, message, Skeleton, Empty } from "antd";
import { MessageOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import aiStore from "../../services/aiStore";
import dayjs from "dayjs";

const { Text } = Typography;

const ConversationList = ({ activeId, onSelect, onNewChat }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await aiStore.listConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      message.error("加载历史会话失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await aiStore.deleteConversation(id);
      message.success("会话已删除");
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) {
        onNewChat();
      }
    } catch (error) {
      message.error("删除失败");
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div style={{ padding: "0 16px" }}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 16px" }}>
        <Button 
          type="dashed" 
          block 
          icon={<PlusOutlined />} 
          onClick={onNewChat}
          style={{ borderRadius: 8 }}
        >
          开启新会话
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {conversations.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史会话" />
        ) : (
          <List
            dataSource={conversations}
            renderItem={item => (
              <List.Item
                onClick={() => onSelect(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  background: activeId === item.id ? "#e6f4ff" : (hoveredId === item.id ? "#f5f5f5" : "transparent"),
                  borderLeft: activeId === item.id ? "3px solid #1677ff" : "3px solid transparent",
                  transition: "all 0.3s",
                  borderBottom: "1px solid #f0f0f0"
                }}
              >
                <div style={{ display: "flex", width: "100%", alignItems: "center", gap: 8 }}>
                  <MessageOutlined style={{ color: activeId === item.id ? "#1677ff" : "#8c8c8c" }} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <Text 
                      strong={activeId === item.id} 
                      ellipsis 
                      style={{ display: "block", fontSize: 13, color: activeId === item.id ? "#1677ff" : "rgba(0,0,0,0.88)" }}
                    >
                      {item.title || "新会话"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {dayjs(item.updated_at).format("MM-DD HH:mm")} · {item.model}
                    </Text>
                  </div>
                  <Popconfirm
                    title="确定删除此会话吗？"
                    onConfirm={(e) => handleDelete(e, item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<DeleteOutlined />} 
                      style={{ 
                        opacity: hoveredId === item.id ? 1 : 0,
                        transition: "opacity 0.2s"
                      }}
                    />
                  </Popconfirm>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default ConversationList;
