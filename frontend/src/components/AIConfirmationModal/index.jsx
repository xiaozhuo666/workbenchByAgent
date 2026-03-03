import React from "react";
import { Modal, List, Typography } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const AIConfirmationModal = ({ open, onCancel, onConfirm, summary, updates, todos }) => {
  const getTodoTitle = (id) => todos.find(t => t.id === id)?.title || "未知任务";

  const getStatusIcon = (status) => {
    if (status === "delete") return <DeleteOutlined style={{ color: "#ff4d4f" }} />;
    if (status === "completed") return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    return <ClockCircleOutlined style={{ color: "#faad14" }} />;
  };

  const getStatusText = (status) => {
    if (status === "delete") return "删除任务";
    if (status === "completed") return "标记完成";
    return "恢复待办";
  };

  return (
    <Modal
      title="确认批量操作"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="立即执行"
      cancelText="稍后"
      destroyOnClose
      centered
      styles={{
        mask: { backdropFilter: "blur(4px)" },
        content: { borderRadius: 20, padding: 24 }
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ fontSize: 16, display: "block", marginBottom: 12 }}>AI 建议计划</Text>
        <div style={{ 
          padding: 16, 
          background: "var(--bg-color, #F0F9FF)", 
          borderRadius: 16, 
          border: "1px solid var(--border-color, #E0F2FE)",
          color: "var(--text-color, #0C4A6E)",
          lineHeight: 1.6
        }}>
          {summary}
        </div>
      </div>

      <List
        size="large"
        dataSource={updates}
        split={false}
        renderItem={item => (
          <List.Item style={{ padding: "8px 0" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12, 
              background: "#fff", 
              padding: "12px 16px", 
              borderRadius: 12, 
              width: "100%",
              border: "1px solid #f0f0f0"
            }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 8, 
                background: item.status === "delete" ? "#FFF1F0" : (item.status === "completed" ? "#F6FFED" : "#FFFBE6"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {getStatusIcon(item.status)}
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ display: "block" }}>{getTodoTitle(item.id)}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {getStatusText(item.status)}
                </Text>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default AIConfirmationModal;
