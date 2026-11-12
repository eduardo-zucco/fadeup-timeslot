export class ValidationError extends Error {
  constructor(message, fields = {}) { super(message); this.fields = fields; }
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
