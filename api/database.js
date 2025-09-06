const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../db/ecofinds.db');
const schemaPath = path.join(__dirname, '../db/schema.sql');
const seedPath = path.join(__dirname, '../db/seed.sql');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database with schema and seed data
function initializeDatabase() {
  // Read and execute schema
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error creating schema:', err.message);
    } else {
      console.log('Database schema created successfully');
      
      // Read and execute seed data
      const seed = fs.readFileSync(seedPath, 'utf8');
      db.exec(seed, (err) => {
        if (err) {
          console.error('Error seeding database:', err.message);
        } else {
          console.log('Database seeded successfully');
        }
      });
    }
  });
}

// Database helper functions
const dbHelpers = {
  // Get a single row
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Get all rows
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Run a query (INSERT, UPDATE, DELETE)
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  },

  // Begin transaction
  beginTransaction: () => {
    return new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  // Commit transaction
  commit: () => {
    return new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  // Rollback transaction
  rollback: () => {
    return new Promise((resolve, reject) => {
      db.run('ROLLBACK', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

// Close database connection on process termination
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

module.exports = { db, dbHelpers };
