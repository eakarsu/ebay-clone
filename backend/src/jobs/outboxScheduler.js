const crypto = require('node:crypto');
const { pool } = require('../config/database');
const { dispatchBatch } = require('../services/outboxDispatcher');

let timer;

async function publish(event) {
  const body = JSON.stringify(event);
  const signature = crypto.createHmac('sha256', process.env.EVENT_SINK_SECRET).update(body).digest('hex');
  const response = await fetch(process.env.EVENT_SINK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-marketplace-signature': signature, 'idempotency-key': event.id },
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`event sink returned ${response.status}`);
}

function start() {
  if (!process.env.EVENT_SINK_URL) {
    console.warn('Outbox delivery disabled: EVENT_SINK_URL is not configured');
    return;
  }
  if (!process.env.EVENT_SINK_SECRET) throw new Error('EVENT_SINK_SECRET is required when outbox delivery is enabled');
  const run = () => dispatchBatch({ pool, publish }).catch((error) => console.error('Outbox dispatch failed:', error.message));
  run();
  timer = setInterval(run, Number(process.env.OUTBOX_POLL_MS || 10000));
  timer.unref();
}

function stop() { if (timer) clearInterval(timer); }
module.exports = { start, stop };
