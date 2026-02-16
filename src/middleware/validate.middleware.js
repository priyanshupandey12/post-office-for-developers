const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); 
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.errors?.[0]?.message || "Invalid request data"
    });
  }
};

module.exports = validate;
