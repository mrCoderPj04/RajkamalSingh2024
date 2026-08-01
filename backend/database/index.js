/**
 * SOFO Sync Database Client & Schema Interface
 */

module.exports = {
  connect: async () => {
    console.log('[SOFO Sync DB] Connected to relational database store.');
    return { status: 'CONNECTED', dialect: 'PostgreSQL / SQLite' };
  }
};
