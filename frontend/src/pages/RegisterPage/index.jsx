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
import { doRegister } from "../../services/authStore";
import authTechBg from "../../assets/auth-tech-bg.svg";
import "./index.css";

const IconUser = () => <span className="auth-input-icon">用户名</span>;
const IconMail = () => <span className="auth-input-icon">邮箱</span>;
const IconLock = () => <span className="auth-input-icon">密码</span>;

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const onFinish = async (values) => {
    setSubmitting(true);
    setAuthError("");
    try {
      await doRegister(values);
      navigate("/", { replace: true });
    } catch (error) {
      const code = error?.response?.data?.code;
      const backendMessage = error?.response?.data?.message;
      if (code === "AUTH_USERNAME_EXISTS") {
        form.setFields([{ name: "username", errors: ["用户名已存在"] }]);
      }
      if (code === "AUTH_EMAIL_EXISTS") {
        form.setFields([{ name: "email", errors: ["邮箱已被注册"] }]);
      }
      if (code === "AUTH_INVALID_EMAIL") {
        form.setFields([{ name: "email", errors: ["请输入有效邮箱"] }]);
      }
      setAuthError(backendMessage || "注册失败，请重试");
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
          <div className="auth-slogan-badge">Secure Signup</div>
          <h1 className="auth-slogan-title">你的工作台，从这里开始</h1>
          <p className="auth-slogan-desc">
            完成注册后即可统一管理登录态，为后续邮件、日程与会话能力提供安全入口。
          </p>
          <ul className="auth-slogan-points">
            <li>邮箱唯一性校验</li>
            <li>密码强度安全策略</li>
            <li>明确可读的错误提示</li>
          </ul>
        </div>
        <Card className="auth-card">
          <Typography.Title level={3} className="auth-title">
            创建账号
          </Typography.Title>
          <Typography.Paragraph className="auth-subtitle">
            完成注册后即可进入智能工作台
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
              label="用户名"
              name="username"
              rules={[
                { required: true, message: "请输入用户名" },
                { pattern: /^[a-zA-Z0-9_]{3,32}$/, message: "3-32位字母数字下划线" },
              ]}
            >
              <Input prefix={<IconUser />} placeholder="用户名" />
            </Form.Item>
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "邮箱格式不正确" },
              ]}
            >
              <Input prefix={<IconMail />} placeholder="邮箱" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: "请输入密码" },
                { pattern: passwordRule, message: "至少8位，含大小写字母和数字" },
              ]}
            >
              <Input.Password prefix={<IconLock />} placeholder="密码" />
            </Form.Item>
            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "请再次输入密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("两次输入密码不一致"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<IconLock />} placeholder="再次输入密码" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="auth-submit"
              >
                注册
              </Button>
            </Form.Item>
          </Form>
          <Typography.Text className="auth-switch-text">
            已有账号？<Link to="/login">去登录</Link>
          </Typography.Text>
        </Card>
      </div>
    </div>
  );
}
