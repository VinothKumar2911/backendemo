const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

exports.logActivity = async ({
  userId,
  role,
  action,
  entityType,
  entityId,
  metadata = {}
}) => {
  await pool.query(
    `INSERT INTO activity_logs
     (id, user_id, role, action, entity_type, entity_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      userId,
      role,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata)
    ]
  );
};