describe("POST /api/auth/register contract", () => {
  test.todo("returns 201 with { code, message, data.token, data.user } on success");
  test.todo("returns 409 with AUTH_USERNAME_EXISTS when username duplicated");
  test.todo("returns 422 with AUTH_PASSWORD_WEAK for weak passwords");
});
