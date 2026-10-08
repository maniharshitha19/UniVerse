// Throw this anywhere to send a clean error to the app,
// e.g. throw new HttpError(404, 'Post not found')
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { HttpError };
