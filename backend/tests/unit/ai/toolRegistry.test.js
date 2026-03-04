const toolRegistry = require("../../../src/modules/ai/mcp/toolRegistry");

describe("toolRegistry", () => {
  test("lists default tools", async () => {
    const tools = await toolRegistry.listTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });
});
