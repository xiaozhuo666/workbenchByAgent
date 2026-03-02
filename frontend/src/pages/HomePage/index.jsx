import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Typography, Button, Tooltip, Spin } from "antd";
import {
  MessageOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  RedditOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getUser, doLogout } from "../../services/authStore";
import httpClient from "../../api/httpClient";
import TodoList from "../../components/TodoList";
import ScheduleList from "../../components/ScheduleList";
import AISidebar from "../../components/AISidebar";
import "./index.css";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const HomePage = ({ isGuest }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("sessions");
  const [refreshKey, setRefreshKey] = useState(0);
  const [guestLoading, setGuestLoading] = useState(isGuest);
  const user = isGuest ? { username: "访客" } : getUser();
  const navigate = useNavigate();

  // 访客模式下自动获取临时令牌
  useEffect(() => {
    if (isGuest && guestLoading) {
      (async () => {
        try {
          const { data } = await httpClient.post("/auth/guest-token");
          if (data && data.token) {
            window.localStorage.setItem("auth_token", data.token);
            setGuestLoading(false);
          }
        } catch (error) {
          console.error("获取访客令牌失败:", error);
          setGuestLoading(false);
        }
      })();
    }
  }, [isGuest, guestLoading]);

  const handleLogout = () => {
    if (isGuest) {
      navigate("/auth?mode=login");
    } else {
      doLogout();
      navigate("/auth?mode=login");
    }
  };

  const menuItems = [
    {
      key: "sessions",
      icon: <MessageOutlined />,
      label: "会话中心",
    },
    {
      key: "todos",
      icon: <UnorderedListOutlined />,
      label: "待办事项",
    },
    {
      key: "schedules",
      icon: <CalendarOutlined />,
      label: "日程管理",
    },
  ];

  const handleMenuClick = ({ key }) => {
    setActiveTab(key);
  };

  const handleDraftSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderContent = () => {
    if (guestLoading) {
      return <Spin style={{ marginTop: 120, width: "100%" }} tip="初始化访客环境中..." />;
    }
    switch (activeTab) {
      case "todos":
        return <TodoList key={refreshKey} />;
      case "schedules":
        return <ScheduleList key={refreshKey} />;
      case "sessions":
      default:
        return (
          <div style={{ textAlign: "center", marginTop: 100 }}>
            <Title level={4}>欢迎回来，{user?.username}</Title>
            <Text type="secondary">会话中心正在建设中，请尝试侧边栏的 待办事项 或 日程管理</Text>
          </div>
        );
    }
  };

  return (
    <Layout className="home-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        className="sider-content"
        width={220}
      >
        <div className="logo-container">
          {!collapsed && "智能工作台"}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          className="sider-menu"
          items={menuItems}
          onClick={handleMenuClick}
        />
        <div className="user-info-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
            <Avatar icon={<UserOutlined />} size={collapsed ? "small" : "default"} />
            {!collapsed && (
              <div style={{ marginLeft: 8, flex: 1, overflow: "hidden" }}>
                <Text ellipsis strong block>{user?.username}</Text>
              </div>
            )}
            {!collapsed && (
              <Tooltip title={isGuest ? "登录" : "退出登录"}>
                <Button
                  type="text"
                  icon={isGuest ? <LoginOutlined /> : <LogoutOutlined />}
                  onClick={handleLogout}
                  size="small"
                />
              </Tooltip>
            )}
          </div>
        </div>
      </Sider>
      <Layout>
        <Content className="main-content" style={{ position: "relative" }}>
          {renderContent()}

          {/* AI Toggle Button */}
          <Tooltip title="AI 助手">
            <Button
              type="primary"
              shape="circle"
              icon={<RedditOutlined style={{ fontSize: 24 }} />}
              style={{
                position: "fixed",
                right: showAISidebar ? 444 : 24,
                bottom: 24,
                width: 56,
                height: 56,
                boxShadow: "0 6px 16px rgba(22, 119, 255, 0.4)",
                zIndex: 1000,
                transition: "right 0.3s ease",
              }}
              onClick={() => setShowAISidebar(!showAISidebar)}
            />
          </Tooltip>
        </Content>
      </Layout>

      {/* AISidebar */}
      {showAISidebar && (
        <Sider
          width={420}
          theme="light"
          style={{
            borderLeft: "1px solid var(--border-color)",
            height: "100vh",
            position: "sticky",
            right: 0,
            top: 0,
            zIndex: 1001,
            boxShadow: "-4px 0 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
              <Title level={5} style={{ margin: 0 }}>AI 助手</Title>
              <Button type="text" onClick={() => setShowAISidebar(false)}>关闭</Button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <AISidebar onDraftSaved={handleDraftSaved} />
            </div>
          </div>
        </Sider>
      )}
    </Layout>
  );
};

export default HomePage;
