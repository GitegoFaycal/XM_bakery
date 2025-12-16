const db = require('../config/db');

exports.addProduct= (req, res) => { 
    const {name, category, price, quantity}= req.body;
    const sql = "INSERT INTO products SET?";
    db.query(sql, {name, category, price, quantity}, (err) =>{
        if (err) return res.status(500).json(err);
        res.json({ message: " Product added"});
    });
};

exports.searchProducts= (req,res) => {
    const {category, minPrice, maxPrice}= req.query;
    let sql = "SELECT* FROM products WHERE 1=1";

    if(category) sql += 'AND category = ${category}';
    if(minPrice) sql += 'AND price >= ${minPrice}';
    if(maxPrice) sql += 'AND price <= ${maxPrice}';

    db.query(sql, (err,results) =>{
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};