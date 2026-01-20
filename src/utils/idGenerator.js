const pool = require('../config/db');

async function generateCustomId(entity) {
  const entityName = entity.toUpperCase();

  const [updateResult] = await pool.query(
    `
    UPDATE id_sequences
    SET last_number = LAST_INSERT_ID(last_number + 1)
    WHERE entity_name = ?
    `,
    [entityName]
  );

  if (updateResult.affectedRows === 0) {
    throw new Error(`ID sequence not found for entity: ${entityName}`);
  }

  const [[row]] = await pool.query(
    `
    SELECT prefix, LAST_INSERT_ID() AS next_number
    FROM id_sequences
    WHERE entity_name = ?
    `,
    [entityName]
  );

  return `${row.prefix}${String(row.next_number).padStart(4, '0')}`;
}

module.exports = { generateCustomId };


