import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Spin } from "antd";
import AuthPage from "../pages/AuthPage";
import HomePage from "../pages/HomePage";
import ProtectedRoute from "./ProtectedRoute";
import { restoreSession } from "../services/authStore";

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

  const basename = process.env.PUBLIC_URL || "";
  return (
    <BrowserRouter basename={basename}>
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
        <Route
          path="/mcp-tools"
          element={
            <ProtectedRoute>
              <HomePage initialTab="mcp" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <HomePage initialTab="tickets" />
            </ProtectedRoute>
          }
        />
        <Route path="/guest" element={<HomePage isGuest={true} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
