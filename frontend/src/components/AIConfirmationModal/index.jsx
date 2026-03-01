import React from "react";
import { Modal, List, Typography, Badge } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const AIConfirmationModal = ({ open, onCancel, onConfirm, summary, updates, todos }) => {
  const getTodoTitle = (id) => todos.find(t => t.id === id)?.title || "未知任务";

  return (
    <Modal
      title="确认 AI 批量操作"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="确认执行"
      cancelText="取消"
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>AI 建议操作：</Text>
        <div style={{ padding: 12, background: "#f5f7fa", borderRadius: 4, marginTop: 8 }}>
          {summary}
        </div>
      </div>
      
      <List
        size="small"
        header={<Text type="secondary">变更详情：</Text>}
        dataSource={updates}
        renderItem={item => (
          <List.Item>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {item.status === "completed" ? (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
              ) : (
                <ClockCircleOutlined style={{ color: "#faad14" }} />
              )}
              <Text>{getTodoTitle(item.id)}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                → {item.status === "completed" ? "标记完成" : "恢复待办"}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default AIConfirmationModal;
