const service = require("./ai.service");

async function generateTodos(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) throw new Error("请输入指令");
    const todos = await service.generateTodos(text);
    res.json({ code: "OK", data: todos });
  } catch (error) {
    next(error);
  }
}

async function executeCommand(req, res, next) {
  try {
    const { text, currentTodos } = req.body;
    const result = await service.executeBatchCommand(text, currentTodos);
    res.json({ code: "OK", data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateTodos,
  executeCommand,
};
