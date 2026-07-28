function createValidationError(message, path = []) {
  const error = new Error(message);
  error.name = "ZodError";
  error.issues = [{ path, message }];
  return error;
}

function requireObject(value, schemaName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(`${schemaName} must be an object.`);
  }
  return value;
}

function requireStringField(source, field, message) {
  const value = String(source?.[field] || "").trim();
  if (!value) {
    throw createValidationError(message, [field]);
  }
  return value;
}

export const googleOAuthSchema = Object.freeze({
  parse(payload) {
    const source = requireObject(payload, "Google credential payload");
    return {
      credential: requireStringField(source, "credential", "Missing Google credential"),
    };
  },
});

export const schemas = Object.freeze({
  googleOAuthSchema,
});
