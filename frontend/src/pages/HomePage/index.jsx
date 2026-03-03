import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Typography, Button, Tooltip, Spin, Card, Row, Col, Space, Drawer } from "antd";
import {
  UnorderedListOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  MailOutlined,
  CloudOutlined,
  CarOutlined,
  ShoppingOutlined,
  RightOutlined,
  MenuOutlined,
  CloseOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getUser, doLogout } from "../../services/authStore";
import httpClient from "../../api/httpClient";
import TodoList from "../../components/TodoList";
import ScheduleList from "../../components/ScheduleList";
import AISidebar from "../../components/AISidebar";
import "./index.css";

const { Sider, Content, Header } = Layout;
const { Title, Text, Paragraph } = Typography;

const HomePage = ({ isGuest }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(window.innerWidth > 1200);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [refreshKey, setRefreshKey] = useState(0);
  const [guestLoading, setGuestLoading] = useState(isGuest);
  const user = isGuest ? { username: "访客" } : getUser();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width < 1200) {
        setShowAISidebar(false);
      } else {
        setShowAISidebar(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isGuest && guestLoading) {
      (async () => {
        try {
          const response = await httpClient.post("/auth/guest-token");
          const resBody = response.data;
          const token = resBody?.data?.token;
          if (token) {
            window.localStorage.setItem("auth_token", token);
            setTimeout(() => {
              setGuestLoading(false);
              setRefreshKey(prev => prev + 1);
            }, 500);
          } else {
            setGuestLoading(false);
          }
        } catch (error) {
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

  const handleMenuClick = ({ key }) => {
    setActiveTab(key);
    if (isMobile) setMobileMenuOpen(false);
  };

  const menuItems = [
    {
      key: "home",
      icon: <ThunderboltOutlined />,
      label: "首页看板",
    },
    {
      key: "todos",
      icon: <UnorderedListOutlined />,
      label: "待办清单",
    },
    {
      key: "schedules",
      icon: <CalendarOutlined />,
      label: "日程计划",
    },
    {
      key: "email",
      icon: <MailOutlined />,
      label: "邮件助手",
    },
  ];

  const FeatureCard = ({ icon, title, desc, onClick, color, bgColor }) => (
    <div className="feature-card" onClick={onClick}>
      <div className="icon-wrapper" style={{ backgroundColor: bgColor, color: color }}>
        {icon}
      </div>
      <div className="card-title">{title}</div>
      <div className="card-desc">{desc}</div>
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <Button type="text" size="small" style={{ padding: 0, color: color }}>
          立即开启 <RightOutlined style={{ fontSize: 10 }} />
        </Button>
      </div>
    </div>
  );

  const renderWelcome = () => (
    <div className="welcome-section">
      <div style={{ marginBottom: 40 }}>
        <h1 className="user-greeting">你好，{user?.username} 👋</h1>
        <p className="subtitle">我是你的个人生活助手，今天准备做些什么？</p>
      </div>

      <Row gutter={[20, 20]} className="feature-grid">
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard 
            icon={<CloudOutlined />} 
            title="实时天气" 
            desc="获取今日精准天气预测与穿衣建议"
            onClick={() => setActiveTab("home")}
            color="#0EA5E9"
            bgColor="#E0F2FE"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard 
            icon={<CarOutlined />} 
            title="出行票务" 
            desc="查询高铁动态，智能规划最优行程"
            onClick={() => setActiveTab("home")}
            color="#6366F1"
            bgColor="#EEF2FF"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard 
            icon={<ShoppingOutlined />} 
            title="精选外卖" 
            desc="根据口味为您推荐附近最高评分美食"
            onClick={() => setActiveTab("home")}
            color="#F59E0B"
            bgColor="#FFFBEB"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard 
            icon={<UnorderedListOutlined />} 
            title="待办管理" 
            desc="整理并追踪所有任务，生活井井有条"
            onClick={() => setActiveTab("todos")}
            color="#10B981"
            bgColor="#ECFDF5"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard 
            icon={<CalendarOutlined />} 
            title="重要日程" 
            desc="设置纪念日提醒，不再错过关键时刻"
            onClick={() => setActiveTab("schedules")}
            color="#EC4899"
            bgColor="#FDF2F8"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard 
            icon={<MailOutlined />} 
            title="智能邮件" 
            desc="通过自然语言极速处理 QQ 邮箱沟通"
            onClick={() => setActiveTab("email")}
            color="#8B5CF6"
            bgColor="#F5F3FF"
          />
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    if (guestLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" tip="正在开启生活助手空间..." />
        </div>
      );
    }
    switch (activeTab) {
      case "todos":
        return <TodoList key={refreshKey} />;
      case "schedules":
        return <ScheduleList key={refreshKey} />;
      case "email":
        return (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: 24, background: '#F5F3FF', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 24px', color: '#8B5CF6', fontSize: 32 
            }}>
              <MailOutlined />
            </div>
            <Title level={3}>智能邮件集成中</Title>
            <Paragraph type="secondary" style={{ maxWidth: 400, margin: '0 auto 32px' }}>
              我们正在为您打通 QQ 邮箱的极速通道，很快您就可以通过 AI 助手直接发送邮件了。
            </Paragraph>
            <Button type="primary" size="large" onClick={() => setActiveTab("home")} shape="round">
              返回看板
            </Button>
          </div>
        );
      case "home":
      default:
        return renderWelcome();
    }
  };

  const NavigationContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="logo-container">
        <ThunderboltOutlined style={{ marginRight: 12, fontSize: 24 }} />
        个人生活助手
      </div>
      <Menu
        mode="inline"
        selectedKeys={[activeTab]}
        className="sider-menu"
        items={menuItems}
        onClick={handleMenuClick}
      />
      <div className="user-info-footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Avatar 
            src={user?.avatar}
            icon={<UserOutlined />} 
            style={{ backgroundColor: "var(--primary-color)" }}
          />
          <div style={{ marginLeft: 12, flex: 1, overflow: "hidden" }}>
            <Text ellipsis strong block style={{ color: "var(--text-main)" }}>{user?.username}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>生活管理中</Text>
          </div>
          <Tooltip title={isGuest ? "登录" : "退出登录"}>
            <Button
              type="text"
              icon={isGuest ? <LoginOutlined /> : <LogoutOutlined />}
              onClick={handleLogout}
              size="small"
              style={{ color: "var(--text-muted)" }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <Layout className="home-layout">
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="light"
          className="sider-content"
          width={260}
        >
          {NavigationContent}
        </Sider>
      )}

      {/* Mobile Menu Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{ body: { padding: 0 } }}
      >
        {NavigationContent}
      </Drawer>
      
      <Layout style={{ backgroundColor: "transparent" }}>
        {/* Mobile Header */}
        <div className="mobile-header">
          <Button 
            type="text" 
            icon={<MenuOutlined />} 
            onClick={() => setMobileMenuOpen(true)}
            style={{ fontSize: 20 }}
          />
          <Text strong style={{ fontSize: 16 }}>个人生活助手</Text>
          <div style={{ width: 32 }}></div> {/* Spacer */}
        </div>

        <Content style={{ position: 'relative', overflowY: 'auto' }}>
          <div className="main-content">
            {renderContent()}
          </div>

          <Tooltip title={showAISidebar ? "隐藏助手" : "唤起 AI 助手"}>
            <Button
              type="primary"
              shape="circle"
              className="ai-toggle-btn"
              icon={showAISidebar && isMobile ? <CloseOutlined /> : <ThunderboltOutlined style={{ fontSize: 24 }} />}
              style={{
                position: "fixed",
                right: showAISidebar ? 444 : 32,
                bottom: 32,
                width: 64,
                height: 64,
                boxShadow: "0 12px 24px -6px rgba(14, 165, 233, 0.5)",
                zIndex: 1000,
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)"
              }}
              onClick={() => setShowAISidebar(!showAISidebar)}
            />
          </Tooltip>
        </Content>
      </Layout>

      {/* AI Assistant - Sidebar for Desktop, Drawer for Mobile */}
      {isMobile ? (
        <Drawer
          placement="right"
          open={showAISidebar}
          onClose={() => setShowAISidebar(false)}
          width="100%"
          closable={true}
          title={
            <Space>
              <ThunderboltOutlined style={{ color: "var(--primary-color)" }} />
              AI 助手
            </Space>
          }
          styles={{ body: { padding: 0 } }}
        >
          <AISidebar onDraftSaved={() => setRefreshKey(prev => prev + 1)} />
        </Drawer>
      ) : (
        showAISidebar && (
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
              boxShadow: "-10px 0 30px rgba(0,0,0,0.03)",
            }}
            className="ai-sider"
          >
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ 
                padding: "20px 24px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                borderBottom: "1px solid var(--border-color)",
                background: "#fff"
              }}>
                <Space>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 10, 
                    background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    <ThunderboltOutlined style={{ color: "#fff", fontSize: 16 }} />
                  </div>
                  <Title level={5} style={{ margin: 0, fontWeight: 700 }}>AI 助手</Title>
                </Space>
                <Button type="text" onClick={() => setShowAISidebar(false)} icon={<RightOutlined />} />
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <AISidebar onDraftSaved={() => setRefreshKey(prev => prev + 1)} />
              </div>
            </div>
          </Sider>
        )
      )}
    </Layout>
  );
};

export default HomePage;
