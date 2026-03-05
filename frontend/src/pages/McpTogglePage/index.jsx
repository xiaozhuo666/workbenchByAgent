import React, { useEffect, useState, useMemo } from "react";
import { Alert, Button, Card, Collapse, Space, Switch, Table, Tag, Typography } from "antd";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import { listMcpTools, toggleMcpTool, toggleMcpServer } from "../../api/mcpApi";
import "./index.css";

const { Title, Text } = Typography;

const SERVER_DISPLAY_NAMES = {
  "12306-server": "12306 票务",
  "web-search-server": "网页搜索",
};

function getServerDisplayName(serverName) {
  return SERVER_DISPLAY_NAMES[serverName] || serverName;
}

function McpTogglePage({ embedded = false }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedServers, setExpandedServers] = useState([]);

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

  const groups = useMemo(() => {
    const map = new Map();
    for (const t of tools) {
      const server = t.serverName || "other";
      if (!map.has(server)) {
        map.set(server, []);
      }
      map.get(server).push(t);
    }
    return Array.from(map.entries()).map(([serverName, list]) => ({
      serverName,
      displayName: getServerDisplayName(serverName),
      tools: list,
      allEnabled: list.length > 0 && list.every((x) => x.enabled),
      anyEnabled: list.some((x) => x.enabled),
    }));
  }, [tools]);

  const onToolToggle = async (record, checked) => {
    try {
      await toggleMcpTool(record.toolName, checked, checked ? "manual-enable" : "manual-disable");
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.message || "切换开关失败");
    }
  };

  const onServerToggle = async (serverName, checked) => {
    try {
      await toggleMcpServer(
        serverName,
        checked,
        checked ? "manual-enable-all" : "manual-disable-all"
      );
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.message || "切换分类开关失败");
    }
  };

  const toggleExpand = (serverName) => {
    setExpandedServers((prev) =>
      prev.includes(serverName) ? prev.filter((s) => s !== serverName) : [...prev, serverName]
    );
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
              <Text type="secondary">
                按分类管理，可一键开关整类或展开后单独开关每个工具。
              </Text>
            </div>
            <Button onClick={refresh} loading={loading}>
              刷新
            </Button>
          </Space>

          {error ? <Alert type="error" showIcon message={error} /> : null}

          <div className="mcp-toggle-page__list">
            {groups.map((group) => {
              const isExpanded = expandedServers.includes(group.serverName);
              const allEnabled = group.allEnabled;
              return (
                <div key={group.serverName} className="mcp-toggle-page__group">
                  <div
                    className="mcp-toggle-page__group-header"
                    onClick={() => toggleExpand(group.serverName)}
                  >
                    <span className="mcp-toggle-page__group-expand">
                      {isExpanded ? <DownOutlined /> : <RightOutlined />}
                    </span>
                    <span className="mcp-toggle-page__group-title">{group.displayName}</span>
                    <span className="mcp-toggle-page__group-meta">
                      <Tag color="default">{group.tools.length} 个工具</Tag>
                      <Switch
                        checked={allEnabled}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(checked) => onServerToggle(group.serverName, checked)}
                      />
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="mcp-toggle-page__group-body">
                      <Table
                        rowKey="toolName"
                        size="small"
                        dataSource={group.tools}
                        pagination={false}
                        scroll={{ x: 640 }}
                        columns={[
                          { title: "工具名", dataIndex: "toolName", ellipsis: true },
                          {
                            title: "说明",
                            dataIndex: "description",
                            ellipsis: true,
                            render: (d) => d || "—",
                          },
                          {
                            title: "状态",
                            dataIndex: "enabled",
                            width: 88,
                            render: (enabled) => (
                              <Tag color={enabled ? "blue" : "default"}>
                                {enabled ? "已启用" : "已关闭"}
                              </Tag>
                            ),
                          },
                          {
                            title: "操作",
                            key: "action",
                            width: 72,
                            render: (_, record) => (
                              <Switch
                                checked={Boolean(record.enabled)}
                                onChange={(checked) => onToolToggle(record, checked)}
                              />
                            ),
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default McpTogglePage;
