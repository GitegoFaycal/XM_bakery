exports.validateProduct = (req, res, next) => {
  const { name, price, quantity } = req.body;

  if (!name || !price || !quantity) {
    return res.status(400).json({ message: "All fields required" });
  }

  next();
};