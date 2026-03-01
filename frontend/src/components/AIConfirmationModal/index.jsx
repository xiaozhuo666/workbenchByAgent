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
              {getStatusIcon(item.status)}
              <Text>{getTodoTitle(item.id)}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                → {getStatusText(item.status)}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default AIConfirmationModal;
