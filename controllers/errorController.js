const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;

  return new AppError(message, 400);
};
const handleValidationError = (err) => {
  console.log(err.errors);
  const message = `Invalid validator ${err.errors}`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleMongoErrorDB = (err) => {
  //const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
  const value = err.keyValue.name;
  //console.log('value =================================================', value);

  const message = `duplicated name in DB: ${value}`;

  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.stack.startsWith('CastError')) {
      error = handleCastErrorDB(error);
    }
    if (err.code === 11000) {
      error = handleMongoErrorDB(error);
    }
    if (err.stack.startsWith('ValidationError')) {
      error = handleValidationError(error);
    }

    sendErrorProd(error, res);
  }
};
