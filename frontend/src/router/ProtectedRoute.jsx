import React from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../services/authStore";

export default function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  return children;
}
