const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/inquiries.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      company_name TEXT,
      person_name TEXT,
      product_name TEXT,
      city TEXT,
      state TEXT,
      contact_number TEXT,
      email TEXT,
      requirement TEXT,
      source TEXT DEFAULT 'TradeIndia',
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating table:', err.message);
    else console.log('Inquiries table ready.');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_date ON inquiries(date);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_product ON inquiries(product_name);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_city ON inquiries(city);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_company ON inquiries(company_name);`);
}

module.exports = db;
