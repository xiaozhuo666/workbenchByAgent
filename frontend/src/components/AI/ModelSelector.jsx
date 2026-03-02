import React from "react";
import { Select, Space, Typography, Tag } from "antd";
import { RobotOutlined, ThunderboltOutlined, RocketOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

const models = [
  { 
    id: "qwen-plus", 
    label: "Qwen Plus", 
    desc: "平衡型", 
    icon: <ThunderboltOutlined style={{ color: "#faad14" }} />,
    color: "gold"
  },
  { 
    id: "qwen-max", 
    label: "Qwen Max", 
    desc: "最强智能", 
    icon: <RocketOutlined style={{ color: "#1677ff" }} />,
    color: "blue"
  },
  { 
    id: "qwen-turbo", 
    label: "Qwen Turbo", 
    desc: "极速响应", 
    icon: <ThunderboltOutlined style={{ color: "#52c41a" }} />,
    color: "green"
  },
];

const ModelSelector = ({ value, onChange, disabled }) => {
  return (
    <div style={{ padding: "8px 16px", borderBottom: "1px solid #f0f0f0" }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Space size={4}>
          <RobotOutlined style={{ color: "#1677ff" }} />
          <Text strong style={{ fontSize: 13 }}>当前模型</Text>
        </Space>
        
        <Select
          value={value}
          onChange={onChange}
          disabled={disabled}
          variant="borderless"
          style={{ width: 140 }}
          dropdownStyle={{ borderRadius: 8 }}
          optionLabelProp="label"
        >
          {models.map(m => (
            <Option key={m.id} value={m.id} label={m.label}>
              <Space direction="vertical" size={0}>
                <Space size={8}>
                  {m.icon}
                  <Text strong style={{ fontSize: 13 }}>{m.label}</Text>
                  <Tag color={m.color} style={{ fontSize: 10, lineHeight: "16px", height: 16 }}>{m.desc}</Tag>
                </Space>
              </Space>
            </Option>
          ))}
        </Select>
      </Space>
    </div>
  );
};

export default ModelSelector;
export { models };
