const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = (req, res) => {
  const { name, email, password, role } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  User.create({ name, email, password: hashedPassword, role }, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "User registered successfully" });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  User.findByEmail(email, (err, user) => {
    if (!user) return res.status(401).json({ message: "User not found" });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({ token });
  });
};