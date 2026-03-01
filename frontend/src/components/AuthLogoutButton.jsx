import React from "react";
import { Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { doLogout } from "../services/authStore";

export default function AuthLogoutButton() {
  const navigate = useNavigate();

  const onLogout = async () => {
    await doLogout();
    message.success("已退出登录");
    navigate("/login", { replace: true });
  };

  return (
    <Button danger onClick={onLogout}>
      退出登录
    </Button>
  );
}
