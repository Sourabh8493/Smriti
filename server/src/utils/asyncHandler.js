/*
  Wraps an async Express handler so a rejected promise reaches errorHandler.js
  instead of crashing the process — avoids a try/catch in every controller.
*/
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
