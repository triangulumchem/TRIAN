const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../utils/database');
const { extractProductName, extractPersonName, extractLocation } = require('../utils/aiExtractor');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

async function processRow(row) {
  const requirementText = row['Requirement'] || row['requirement'] || row['REQUIREMENT'] || 
                          row['Description'] || row['description'] || row['Message'] || 
                          row['message'] || row['Inquiry'] || row['inquiry'] || 
                          row['Details'] || row['details'] || '';

  const date = row['Date'] || row['date'] || row['DATE'] || row['Inquiry Date'] || 
               row['inquiry_date'] || row['Date/Time'] || new Date().toISOString().split('T')[0];

  const companyName = row['Company Name'] || row['company_name'] || row['COMPANY'] || 
                      row['Company'] || row['company'] || row['Buyer'] || row['buyer'] || '';

  const contactNumber = row['Contact Number'] || row['contact_number'] || row['Phone'] || 
                        row['phone'] || row['Mobile'] || row['mobile'] || 
                        row['Contact'] || row['contact'] || row['Contact No'] || '';

  const email = row['Email'] || row['email'] || row['EMAIL'] || row['E-mail'] || 
                row['e-mail'] || row['EmailID'] || '';

  const city = row['City'] || row['city'] || row['CITY'] || '';
  const state = row['State'] || row['state'] || row['STATE'] || '';

  // Extract product name using AI or fallback
  const productName = await extractProductName(requirementText);

  // Extract person name
  let personName = row['Person Name'] || row['person_name'] || row['Contact Person'] || 
                   row['contact_person'] || row['Sender'] || '';
  if (!personName) {
    personName = extractPersonName(requirementText);
  }

  // Extract location if not provided
  let extractedCity = city;
  let extractedState = state;
  if (!city || !state) {
    const location = extractLocation(requirementText);
    if (!extractedCity) extractedCity = location.city;
    if (!extractedState) extractedState = location.state;
  }

  return {
    date: normalizeDate(date),
    company_name: companyName.trim(),
    person_name: personName ? personName.trim() : null,
    product_name: productName,
    city: extractedCity ? extractedCity.trim() : null,
    state: extractedState ? extractedState.trim() : null,
    contact_number: contactNumber.trim(),
    email: email.trim(),
    requirement: requirementText.trim(),
    source: row['Source'] || 'TradeIndia',
    raw_data: JSON.stringify(row)
  };
}

function normalizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  const dateString = String(dateStr).trim();

  // Try DD MMM YYYY format (e.g., "24 Feb 2026")
  const ddMmmYyyy = dateString.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (ddMmmYyyy) {
    const months = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
      'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    const month = months[ddMmmYyyy[2].toLowerCase()];
    if (month) {
      return `${ddMmmYyyy[3]}-${month}-${ddMmmYyyy[1].padStart(2, '0')}`;
    }
  }

  // Try native Date parsing
  const d = new Date(dateString);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

router.post('/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const rows = await parseCSV(filePath);

    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'CSV file is empty or invalid' });
    }

    const processedRows = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const processed = await processRow(rows[i]);
        processedRows.push(processed);
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO inquiries 
      (date, company_name, person_name, product_name, city, state, contact_number, email, requirement, source, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let insertedCount = 0;

    for (const row of processedRows) {
      try {
        insertStmt.run(
          row.date, row.company_name, row.person_name, row.product_name,
          row.city, row.state, row.contact_number, row.email,
          row.requirement, row.source, row.raw_data
        );
        insertedCount++;
      } catch (err) {
        errors.push({ error: err.message });
      }
    }

    insertStmt.finalize();
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      totalRows: rows.length,
      inserted: insertedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${insertedCount} of ${rows.length} inquiries`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      try {
        const rows = await parseCSV(file.path);
        const processedRows = [];

        for (const row of rows) {
          try {
            const processed = await processRow(row);
            processedRows.push(processed);
          } catch (err) {}
        }

        const insertStmt = db.prepare(`
          INSERT INTO inquiries 
          (date, company_name, person_name, product_name, city, state, contact_number, email, requirement, source, raw_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let insertedCount = 0;
        for (const row of processedRows) {
          try {
            insertStmt.run(
              row.date, row.company_name, row.person_name, row.product_name,
              row.city, row.state, row.contact_number, row.email,
              row.requirement, row.source, row.raw_data
            );
            insertedCount++;
          } catch (err) {}
        }
        insertStmt.finalize();

        fs.unlinkSync(file.path);

        results.push({
          filename: file.originalname,
          totalRows: rows.length,
          inserted: insertedCount
        });
      } catch (err) {
        fs.unlinkSync(file.path);
        results.push({
          filename: file.originalname,
          error: err.message
        });
      }
    }

    const totalInserted = results.reduce((sum, r) => sum + (r.inserted || 0), 0);

    res.json({
      success: true,
      totalFiles: req.files.length,
      totalInserted,
      files: results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
