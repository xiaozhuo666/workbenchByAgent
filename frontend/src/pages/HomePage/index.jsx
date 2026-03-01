import React, { useState } from "react";
import { Layout, Menu, Avatar, Typography, Button, Tooltip } from "antd";
import {
  MessageOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  RocketOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getUser, doLogout } from "../../services/authStore";
import TodoList from "../../components/TodoList";
import ScheduleList from "../../components/ScheduleList";
import AISidebar from "../../components/AISidebar";
import "./index.css";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const HomePage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [activeTab, setActiveTab] = useState("sessions");
  const [refreshKey, setRefreshKey] = useState(0);
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    doLogout();
    navigate("/auth?mode=login");
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
              <Tooltip title="退出登录">
                <Button 
                  type="text" 
                  icon={<LogoutOutlined />} 
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
              icon={<RocketOutlined />}
              size="large"
              style={{
                position: "fixed",
                right: showAISidebar ? 374 : 24,
                bottom: 24,
                boxShadow: "0 4px 12px rgba(22, 119, 255, 0.4)",
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
          width={350}
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
