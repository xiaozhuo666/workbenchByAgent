const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const env = require("../config/env");

async function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptSaltRounds);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signAccessToken(payload) {
  const jti = uuidv4();
  const token = jwt.sign({ ...payload, jti }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  const decoded = jwt.decode(token);
  return { token, jti, exp: decoded.exp };
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
};
