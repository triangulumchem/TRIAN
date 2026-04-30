const express = require('express');
const db = require('../utils/database');
const { Parser } = require('json2csv');

const router = express.Router();

router.get('/', (req, res) => {
  const {
    page = 1,
    limit = 50,
    search,
    product,
    city,
    state,
    dateFrom,
    dateTo,
    sortBy = 'date',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(`(company_name LIKE ? OR person_name LIKE ? OR requirement LIKE ?)`);
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (product) {
    conditions.push('product_name LIKE ?');
    params.push(`%${product}%`);
  }

  if (city) {
    conditions.push('city LIKE ?');
    params.push(`%${city}%`);
  }

  if (state) {
    conditions.push('state LIKE ?');
    params.push(`%${state}%`);
  }

  if (dateFrom) {
    conditions.push('date >= ?');
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push('date <= ?');
    params.push(dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortColumns = ['date', 'company_name', 'product_name', 'city', 'state', 'created_at'];
  const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'date';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const countQuery = `SELECT COUNT(*) as total FROM inquiries ${whereClause}`;

  db.get(countQuery, params, (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const dataQuery = `
      SELECT * FROM inquiries 
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, parseInt(limit), offset];

    db.all(dataQuery, dataParams, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countRow.total,
          totalPages: Math.ceil(countRow.total / parseInt(limit))
        }
      });
    });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM inquiries WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json(row);
  });
});

router.put('/:id', (req, res) => {
  const {
    company_name, person_name, product_name, city, state,
    contact_number, email, requirement
  } = req.body;

  db.run(`
    UPDATE inquiries SET
      company_name = COALESCE(?, company_name),
      person_name = COALESCE(?, person_name),
      product_name = COALESCE(?, product_name),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      contact_number = COALESCE(?, contact_number),
      email = COALESCE(?, email),
      requirement = COALESCE(?, requirement)
    WHERE id = ?
  `, [company_name, person_name, product_name, city, state, contact_number, email, requirement, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json({ message: 'Inquiry updated successfully' });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM inquiries WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json({ message: 'Inquiry deleted successfully' });
  });
});

router.get('/export/csv', (req, res) => {
  const { search, product, city, state, dateFrom, dateTo } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(`(company_name LIKE ? OR person_name LIKE ? OR requirement LIKE ?)`);
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (product) {
    conditions.push('product_name LIKE ?');
    params.push(`%${product}%`);
  }

  if (city) {
    conditions.push('city LIKE ?');
    params.push(`%${city}%`);
  }

  if (state) {
    conditions.push('state LIKE ?');
    params.push(`%${state}%`);
  }

  if (dateFrom) {
    conditions.push('date >= ?');
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push('date <= ?');
    params.push(dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  db.all(`SELECT * FROM inquiries ${whereClause} ORDER BY date DESC`, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const fields = [
      'id', 'date', 'company_name', 'person_name', 'product_name',
      'city', 'state', 'contact_number', 'email', 'requirement', 'source'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inquiries.csv');
    res.send(csv);
  });
});

module.exports = router;
