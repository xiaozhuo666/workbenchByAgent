import React from "react";
import { Card, Space, Tag, Typography, Button } from "antd";
import { EnvironmentOutlined, CalendarOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

function TripDraftCard({ draft, onRefine }) {
  const navigate = useNavigate();

  if (!draft) return null;

  return (
    <Card
      size="small"
      style={{
        marginTop: 12,
        borderRadius: 12,
        border: "1px solid #BFDBFE",
        background: "#F8FAFF",
      }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Tag color="blue">来自 AI 助手</Tag>
        <Text strong>
          <EnvironmentOutlined /> {draft.route?.fromCity} -> {draft.route?.toCity}
        </Text>
        <Text type="secondary">
          <CalendarOutlined /> {draft.date}
        </Text>
        <Space wrap>
          {(draft.preferences?.trainTypes || []).map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
          {(draft.preferences?.seatTypes || []).map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </Space>
        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => navigate(`/tickets?draftId=${draft.draftId}`)}
          >
            查看结果
          </Button>
          <Button onClick={onRefine}>继续细化</Button>
        </Space>
      </Space>
    </Card>
  );
}

export default TripDraftCard;
