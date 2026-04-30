const express = require('express');
const db = require('../utils/database');

const router = express.Router();

router.get('/stats', (req, res) => {
  const { dateFrom, dateTo } = req.query;

  let dateFilter = '';
  const params = [];

  if (dateFrom && dateTo) {
    dateFilter = 'WHERE date >= ? AND date <= ?';
    params.push(dateFrom, dateTo);
  } else if (dateFrom) {
    dateFilter = 'WHERE date >= ?';
    params.push(dateFrom);
  } else if (dateTo) {
    dateFilter = 'WHERE date <= ?';
    params.push(dateTo);
  }

  db.get(`SELECT COUNT(*) as total FROM inquiries ${dateFilter}`, params, (err, totalRow) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(`
      SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
      FROM inquiries ${dateFilter}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, params, (err, monthlyRows) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(`
        SELECT product_name, COUNT(*) as count
        FROM inquiries ${dateFilter}
        AND product_name IS NOT NULL
        GROUP BY product_name
        ORDER BY count DESC
        LIMIT 10
      `, params, (err, productRows) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(`
          SELECT city, COUNT(*) as count
          FROM inquiries ${dateFilter}
          AND city IS NOT NULL
          GROUP BY city
          ORDER BY count DESC
          LIMIT 10
        `, params, (err, cityRows) => {
          if (err) return res.status(500).json({ error: err.message });

          db.all(`
            SELECT state, COUNT(*) as count
            FROM inquiries ${dateFilter}
            AND state IS NOT NULL
            GROUP BY state
            ORDER BY count DESC
            LIMIT 10
          `, params, (err, stateRows) => {
            if (err) return res.status(500).json({ error: err.message });

            db.all(`
              SELECT company_name, COUNT(*) as inquiry_count
              FROM inquiries ${dateFilter}
              AND company_name IS NOT NULL AND company_name != ''
              GROUP BY company_name
              HAVING inquiry_count > 1
              ORDER BY inquiry_count DESC
              LIMIT 10
            `, params, (err, repeatRows) => {
              if (err) return res.status(500).json({ error: err.message });

              res.json({
                totalInquiries: totalRow.total,
                monthlyStats: monthlyRows,
                topProducts: productRows,
                topCities: cityRows,
                topStates: stateRows,
                repeatCustomers: repeatRows
              });
            });
          });
        });
      });
    });
  });
});

router.get('/filters', (req, res) => {
  db.all(`SELECT DISTINCT product_name FROM inquiries WHERE product_name IS NOT NULL ORDER BY product_name`, [], (err, products) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(`SELECT DISTINCT city FROM inquiries WHERE city IS NOT NULL ORDER BY city`, [], (err, cities) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(`SELECT DISTINCT state FROM inquiries WHERE state IS NOT NULL ORDER BY state`, [], (err, states) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          products: products.map(p => p.product_name),
          cities: cities.map(c => c.city),
          states: states.map(s => s.state)
        });
      });
    });
  });
});

module.exports = router;
