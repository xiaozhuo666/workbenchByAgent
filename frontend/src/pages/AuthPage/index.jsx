import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Typography,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doLogin, doRegister } from "../../services/authStore";
import authTechBg from "../../assets/auth-tech-bg.svg";
import "./index.css";

const IconUser = () => <span className="auth-input-icon">账号</span>;
const IconName = () => <span className="auth-input-icon">用户名</span>;
const IconMail = () => <span className="auth-input-icon">邮箱</span>;
const IconLock = () => <span className="auth-input-icon">密码</span>;

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const MODE_TEXT = {
  login: {
    badge: "Intelligent Workspace",
    title: "智能工作台助手",
    desc: "聚合日程、邮件与会话，打造一个更专注、更高效的个人工作流入口。",
    points: ["企业级登录与会话安全", "统一账号体系与权限入口", "清晰可追踪的错误反馈"],
    cardTitle: "欢迎登录",
    cardSubtitle: "智能工作台助手",
    submitText: "登录",
  },
  register: {
    badge: "Secure Signup",
    title: "你的工作台，从这里开始",
    desc: "完成注册后即可统一管理登录态，为后续邮件、日程与会话能力提供安全入口。",
    points: ["邮箱唯一性校验", "密码强度安全策略", "明确可读的错误提示"],
    cardTitle: "创建账号",
    cardSubtitle: "完成注册后即可进入智能工作台",
    submitText: "注册",
  },
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const urlMode = searchParams.get("mode");
  const initialMode = urlMode === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const uiText = useMemo(() => MODE_TEXT[mode], [mode]);

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setAuthError("");
    setMode(nextMode);
    setSearchParams({ mode: nextMode }, { replace: true });
  };

  const onLoginFinish = async (values) => {
    setSubmitting(true);
    setAuthError("");
    try {
      await doLogin(values);
      navigate("/", { replace: true });
    } catch (error) {
      const code = error?.response?.data?.code;
      const backendMessage = error?.response?.data?.message;
      if (code === "AUTH_INVALID_CREDENTIALS") {
        loginForm.setFields([
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

  const onRegisterFinish = async (values) => {
    setSubmitting(true);
    setAuthError("");
    try {
      await doRegister(values);
      navigate("/", { replace: true });
    } catch (error) {
      const code = error?.response?.data?.code;
      const backendMessage = error?.response?.data?.message;
      if (code === "AUTH_USERNAME_EXISTS") {
        registerForm.setFields([{ name: "username", errors: ["用户名已存在"] }]);
      }
      if (code === "AUTH_EMAIL_EXISTS") {
        registerForm.setFields([{ name: "email", errors: ["邮箱已被注册"] }]);
      }
      if (code === "AUTH_INVALID_EMAIL") {
        registerForm.setFields([{ name: "email", errors: ["请输入有效邮箱"] }]);
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
          <div className="auth-slogan-badge">{uiText.badge}</div>
          <h1 className="auth-slogan-title">{uiText.title}</h1>
          <p className="auth-slogan-desc">{uiText.desc}</p>
          <ul className="auth-slogan-points">
            {uiText.points.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <Card className="auth-card">
          <div className="auth-mode-tabs">
            <button
              type="button"
              className={mode === "login" ? "is-active" : ""}
              onClick={() => switchMode("login")}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === "register" ? "is-active" : ""}
              onClick={() => switchMode("register")}
            >
              注册
            </button>
          </div>

          <Typography.Title level={3} className="auth-title">
            {uiText.cardTitle}
          </Typography.Title>
          <Typography.Paragraph className="auth-subtitle">
            {uiText.cardSubtitle}
          </Typography.Paragraph>

          {authError ? (
            <Alert
              type="error"
              showIcon
              message={authError}
              className="auth-alert"
            />
          ) : null}

          {mode === "login" ? (
            <Form
              form={loginForm}
              layout="vertical"
              onFinish={onLoginFinish}
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
                  {uiText.submitText}
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form
              form={registerForm}
              layout="vertical"
              onFinish={onRegisterFinish}
              onValuesChange={() => authError && setAuthError("")}
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: "请输入用户名" },
                  {
                    pattern: /^[a-zA-Z0-9_]{3,32}$/,
                    message: "3-32位字母数字下划线",
                  },
                ]}
              >
                <Input prefix={<IconName />} placeholder="用户名" />
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
                  {uiText.submitText}
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
