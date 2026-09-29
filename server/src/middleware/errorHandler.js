function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(status).json({ message: err.message || "Something went wrong on the server." });
}

module.exports = { notFound, errorHandler };
