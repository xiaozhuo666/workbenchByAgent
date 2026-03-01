import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Typography,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { doLogin } from "../../services/authStore";
import authTechBg from "../../assets/auth-tech-bg.svg";
import "./index.css";

const IconUser = () => <span className="auth-input-icon">账号</span>;
const IconLock = () => <span className="auth-input-icon">密码</span>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const onFinish = async (values) => {
    setSubmitting(true);
    setAuthError("");
    try {
      await doLogin(values);
      navigate("/", { replace: true });
    } catch (error) {
      const code = error?.response?.data?.code;
      const backendMessage = error?.response?.data?.message;
      if (code === "AUTH_INVALID_CREDENTIALS") {
        form.setFields([
          { name: "account", errors: ["用户名或密码错误"] },
          { name: "password", errors: ["用户名或密码错误"] },
        ]);
        setAuthError("用户名或密码错误，请检查后重试");
      } else {
        setAuthError(backendMessage || "登录失败，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-bg"
        style={{ backgroundImage: `url(${authTechBg})` }}
      />
      <div className="auth-content">
        <div className="auth-slogan">
          <div className="auth-slogan-badge">Intelligent Workspace</div>
          <h1 className="auth-slogan-title">智能工作台助手</h1>
          <p className="auth-slogan-desc">
            聚合日程、邮件与会话，打造一个更专注、更高效的个人工作流入口。
          </p>
          <ul className="auth-slogan-points">
            <li>企业级登录与会话安全</li>
            <li>统一账号体系与权限入口</li>
            <li>清晰可追踪的错误反馈</li>
          </ul>
        </div>
        <Card className="auth-card">
          <Typography.Title level={3} className="auth-title">
            欢迎登录
          </Typography.Title>
          <Typography.Paragraph className="auth-subtitle">
            智能工作台助手
          </Typography.Paragraph>
          {authError ? (
            <Alert
              type="error"
              showIcon
              message={authError}
              className="auth-alert"
            />
          ) : null}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={() => authError && setAuthError("")}
          >
            <Form.Item
              label="账号"
              name="account"
              rules={[
                { required: true, message: "请输入用户名或邮箱" },
                { min: 3, message: "账号长度至少 3 位" },
              ]}
            >
              <Input prefix={<IconUser />} placeholder="用户名或邮箱" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 8, message: "密码长度至少 8 位" },
              ]}
            >
              <Input.Password prefix={<IconLock />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="auth-submit"
              >
                登录
              </Button>
            </Form.Item>
          </Form>
          <Typography.Text className="auth-switch-text">
            没有账号？<Link to="/register">去注册</Link>
          </Typography.Text>
        </Card>
      </div>
    </div>
  );
}
