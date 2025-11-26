const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors,
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Reference error',
      message: 'Referenced record does not exist',
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
};

module.exports = { errorHandler, notFound };
