import httpClient from "./httpClient";

export async function listMcpTools() {
  const res = await httpClient.get("/ai/mcp/tools");
  return res.data?.data || [];
}

export async function toggleMcpTool(toolName, enabled, reason = "") {
  const res = await httpClient.patch(`/ai/mcp/tools/${encodeURIComponent(toolName)}/toggle`, {
    enabled,
    reason,
  });
  return res.data?.data || null;
}

export async function toggleMcpServer(serverName, enabled, reason = "") {
  const res = await httpClient.patch(
    `/ai/mcp/servers/${encodeURIComponent(serverName)}/toggle`,
    { enabled, reason }
  );
  return res.data?.data || null;
}
