const makeDbMiddleware = (db) => (req, res, next) => {
  req.db = db;
  next();
};

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  const { statusCode, message } = err;
  return res.status(statusCode).json({ message });
};

module.exports = {
  makeDbMiddleware,
  errorMiddleware,
};
