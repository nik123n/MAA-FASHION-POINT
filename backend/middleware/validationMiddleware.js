const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array({ onlyFirstError: true }).map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });
};

module.exports = { validate };
