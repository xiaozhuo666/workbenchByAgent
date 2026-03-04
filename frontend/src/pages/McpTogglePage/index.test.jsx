import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import McpTogglePage from "./index";
import * as mcpApi from "../../api/mcpApi";

jest.mock("../../api/mcpApi");

describe("McpTogglePage", () => {
  test("loads tools and toggles switch", async () => {
    mcpApi.listMcpTools.mockResolvedValue([
      { toolName: "tool.mock.query", displayName: "模拟查询工具", enabled: true, riskLevel: "low" },
    ]);
    mcpApi.toggleMcpTool.mockResolvedValue({});

    render(<McpTogglePage />);

    await waitFor(() => {
      expect(screen.getByText("tool.mock.query")).toBeInTheDocument();
    });

    const switchButton = screen.getByRole("switch");
    await userEvent.click(switchButton);

    await waitFor(() => {
      expect(mcpApi.toggleMcpTool).toHaveBeenCalled();
    });
  });
});
