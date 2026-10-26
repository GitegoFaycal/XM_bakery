const Order = require('../models/orderModel');

exports.placeOrder = (req, res) => {
  const order = {
    user_id: req.user.id,
    total: req.body.total,
    status: "Pending"
  };

  Order.createOrder(order, (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Order placed successfully",
      orderId: result.insertId
    });
  });
};

exports.myOrders = (req, res) => {
  Order.getUserOrders(req.user.id, (err, orders) => {
    if (err) return res.status(500).json(err);
    res.json(orders);
  });
};