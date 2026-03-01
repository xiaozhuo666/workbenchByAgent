const { randomUUID } = require("crypto");

function requestContext(req, res, next) {
  req.requestId = randomUUID();
  next();
}

module.exports = requestContext;
