import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Space, Switch, Table, Tag, Typography } from "antd";
import { listMcpTools, toggleMcpTool } from "../../api/mcpApi";
import "./index.css";

const { Title, Text } = Typography;

function McpTogglePage({ embedded = false }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMcpTools();
      setTools(data);
    } catch (e) {
      setError(e?.response?.data?.message || "加载 MCP 开关列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onToggle = async (record, checked) => {
    try {
      await toggleMcpTool(record.toolName, checked, checked ? "manual-enable" : "manual-disable");
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.message || "切换开关失败");
    }
  };

  return (
    <div className={`mcp-toggle-page ${embedded ? "embedded" : ""}`}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <div>
              <Title level={4} style={{ marginBottom: 6 }}>
                MCP 工具开关管理
              </Title>
              <Text type="secondary">可手动启停单个 MCP 工具，变更将在短时间内生效。</Text>
            </div>
            <Button onClick={refresh} loading={loading}>
              刷新
            </Button>
          </Space>

          {error ? <Alert type="error" showIcon message={error} /> : null}

          <div className="mcp-toggle-page__table">
            <Table
              rowKey="toolName"
              loading={loading}
              dataSource={tools}
              pagination={false}
              scroll={{ x: 900 }}
              columns={[
                { title: "工具名", dataIndex: "toolName" },
                { title: "显示名", dataIndex: "displayName" },
                {
                  title: "风险",
                  dataIndex: "riskLevel",
                  render: (risk) => <Tag color={risk === "low" ? "green" : "orange"}>{risk || "unknown"}</Tag>,
                },
                {
                  title: "状态",
                  dataIndex: "enabled",
                  render: (enabled) => <Tag color={enabled ? "blue" : "default"}>{enabled ? "已启用" : "已关闭"}</Tag>,
                },
                {
                  title: "操作",
                  key: "action",
                  render: (_, record) => (
                    <Switch
                      checked={Boolean(record.enabled)}
                      onChange={(checked) => onToggle(record, checked)}
                    />
                  ),
                },
              ]}
            />
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default McpTogglePage;
