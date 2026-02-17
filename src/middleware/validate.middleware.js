const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); 
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: err.issues?.map(e => ({
        field: e.path.join("."),
        message: e.message
      }))
    });
  }
};

module.exports = validate;