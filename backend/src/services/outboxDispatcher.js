async function claimBatch(pool, limit = 25) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `WITH candidates AS (
         SELECT id FROM marketplace_outbox
          WHERE state IN ('pending','failed') AND available_at<=NOW()
          ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $1
       )
       UPDATE marketplace_outbox o SET state='processing',attempts=attempts+1
        FROM candidates c WHERE o.id=c.id RETURNING o.*`,
      [limit],
    );
    await client.query('COMMIT');
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function dispatchBatch({ pool, publish, limit = 25 }) {
  const rows = await claimBatch(pool, limit);
  for (const row of rows) {
    try {
      await publish({ id: row.id, type: row.event_type, aggregateId: row.aggregate_id, payload: row.payload });
      await pool.query("UPDATE marketplace_outbox SET state='published',published_at=NOW(),last_error=NULL WHERE id=$1 AND state='processing'", [row.id]);
    } catch (error) {
      const dead = Number(row.attempts) >= 5;
      await pool.query(
        "UPDATE marketplace_outbox SET state=$1,available_at=NOW()+INTERVAL '5 minutes',last_error=$2 WHERE id=$3 AND state='processing'",
        [dead ? 'dead_letter' : 'failed', String(error.message).slice(0, 2000), row.id],
      );
      if (dead) await pool.query(
        `INSERT INTO reconciliation_issues(order_id,issue_type,severity,detail)
         VALUES($1,'outbox_dead_letter','critical',$2)`,
        [row.aggregate_id, { outboxId: row.id, eventType: row.event_type, error: String(error.message).slice(0, 500) }],
      );
    }
  }
  return rows.length;
}

module.exports = { claimBatch, dispatchBatch };
