const { executeTool } = require("../../../src/modules/ai/mcp/toolExecutor");

describe("toolExecutor", () => {
  test("executes tool successfully", async () => {
    const tool = {
      adapter: {
        execute: async (args) => ({ ok: true, args }),
      },
    };
    const result = await executeTool({
      tool,
      args: { keyword: "test" },
      timeoutMs: 1000,
      maxRetries: 0,
    });
    expect(result.status).toBe("success");
    expect(result.result.ok).toBe(true);
  });
});
