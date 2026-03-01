import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "../../src/router/ProtectedRoute";

describe("auth guard", () => {
  test("redirects to login when no token", () => {
    window.localStorage.removeItem("auth_token");
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>protected-content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText("protected-content")).not.toBeInTheDocument();
  });
});
