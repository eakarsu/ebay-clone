import React, { useState } from 'react';
import api from '../services/api';

const sample = JSON.stringify([
  { title: 'Vintage camera', price: 220, categoryFeePct: 0.1325, promotedPct: 0.08, shippingSubsidy: 12 },
  { title: 'Sneakers', price: 145, categoryFeePct: 0.12, promotedPct: 0.04, shippingSubsidy: 0 }
], null, 2);

export default function SellerFeeOptimizer() {
  const [payload, setPayload] = useState(sample);
  const [result, setResult] = useState(null);

  async function run() {
    const { data } = await api.post('/seller-fee-optimizer/score', { listings: JSON.parse(payload) });
    setResult(data);
  }

  return (
    <div className="container" style={{ padding: 24 }}>
      <h1>Seller Fee Optimizer</h1>
      <p>Estimate listing fee drag and find promoted-listing or shipping changes that protect margin.</p>
      <textarea rows={12} value={payload} onChange={(event) => setPayload(event.target.value)} style={{ width: '100%', fontFamily: 'monospace' }} />
      <button onClick={run}>Optimize fees</button>
      {result && (
        <section>
          <h2>Average fee {result.averageFeePct}%</h2>
          {result.scored.map((row) => (
            <div key={row.title} style={{ borderBottom: '1px solid #ddd', padding: '10px 0' }}>
              <strong>{row.title}</strong> | ${row.totalFees} | {row.feePct}% | {row.recommendation}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
