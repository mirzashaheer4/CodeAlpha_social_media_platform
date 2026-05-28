module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  
  // Log server errors for developer visibility (in non-production environments)
  if (process.env.NODE_ENV !== 'production' && status === 500) {
    console.error(err);
  }

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: status,
      ...(err.fields && { fields: err.fields })
    }
  });
};
