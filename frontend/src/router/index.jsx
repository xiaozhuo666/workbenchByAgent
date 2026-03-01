import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout, Spin, Typography } from "antd";
import AuthPage from "../pages/AuthPage";
import ProtectedRoute from "./ProtectedRoute";
import AuthLogoutButton from "../components/AuthLogoutButton";
import { getUser, restoreSession } from "../services/authStore";

function HomePage() {
  const user = getUser();
  return (
    <Layout style={{ minHeight: "100vh", padding: 24 }}>
      <Typography.Title level={3}>智能工作台</Typography.Title>
      <Typography.Paragraph>
        当前用户：{user?.username || "-"}
      </Typography.Paragraph>
      <AuthLogoutButton />
    </Layout>
  );
}

function AppRouter() {
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await restoreSession();
      } catch (_) {
        // Ignore restore errors; route guard handles redirect.
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  if (bootstrapping) {
    return <Spin style={{ marginTop: 120, width: "100%" }} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
        <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
