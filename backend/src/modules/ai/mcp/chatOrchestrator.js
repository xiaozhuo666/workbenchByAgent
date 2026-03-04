const env = require("../../../config/env");
const repository = require("../ai.repository");
const toolRegistry = require("./toolRegistry");
const { executeTool } = require("./toolExecutor");
const { TOOL_STATUS } = require("./tool.constants");

function buildArgsFromText(text) {
  return { keyword: String(text || "").slice(0, 40) };
}

function shouldTryTool(text) {
  const query = String(text || "");
  return /天气|查询|票务|外卖|工具|mcp/i.test(query);
}

async function runChatLoop({ text, baseReply, conversationId, userId }) {
  const maxRounds = Math.max(1, env.mcp.maxCallRounds);
  let currentReply = baseReply;
  let fallbackTriggered = false;
  let totalCalls = 0;
  let successCalls = 0;
  let failedCalls = 0;

  if (!shouldTryTool(text)) {
    return {
      reply: currentReply,
      finalResponseType: "model_only",
      fallbackTriggered: false,
    };
  }

  for (let roundIndex = 1; roundIndex <= maxRounds; roundIndex += 1) {
    const toolName = "tool.mock.query";
    totalCalls += 1;
    try {
      const tool = await toolRegistry.assertToolAllowed(toolName);
      const execResult = await executeTool({
        tool,
        args: buildArgsFromText(text),
      });

      await repository.logToolExecution({
        conversationId,
        userId,
        roundIndex,
        toolName,
        argsSummary: JSON.stringify(buildArgsFromText(text)),
        status: execResult.status,
        durationMs: execResult.durationMs,
        errorMessage: execResult.error?.message || null,
      });

      if (execResult.status === TOOL_STATUS.SUCCESS) {
        successCalls += 1;
        currentReply = `${baseReply}\n\n[工具补充] ${execResult.result.answer || ""}`.trim();
        break;
      }
      failedCalls += 1;
      fallbackTriggered = true;
      break;
    } catch (error) {
      failedCalls += 1;
      fallbackTriggered = true;
      await repository.logToolExecution({
        conversationId,
        userId,
        roundIndex,
        toolName,
        argsSummary: JSON.stringify(buildArgsFromText(text)),
        status: TOOL_STATUS.REJECTED,
        durationMs: 0,
        errorMessage: error.message || "工具被拒绝",
      });
      break;
    }
  }

  await repository.logToolTrace({
    conversationId,
    totalCalls,
    successCalls,
    failedCalls,
    fallbackTriggered,
    finalResponseType: fallbackTriggered ? "model_only" : "tool_enhanced",
  });

  return {
    reply: currentReply,
    finalResponseType: fallbackTriggered ? "model_only" : "tool_enhanced",
    fallbackTriggered,
  };
}

module.exports = {
  runChatLoop,
};
