import React, { useMemo } from 'react';
import { Paper, Typography, Box, Divider, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Seller fee calculator. Gives sellers a preview of fees before listing.
 *
 * Default schedule mirrors the common eBay pattern (customizable via props):
 *   - Insertion fee: $0.35 per listing beyond the free-listing quota (ignored here;
 *     we assume within quota by default).
 *   - Final Value Fee: ~13.25% of (sale price + shipping) for most categories.
 *   - Per-order fee: $0.30 fixed.
 *   - Payment processing (not separately charged in the managed-payments era) is
 *     folded into the FVF percent; we expose it as one lever.
 */
const FeeCalculator = ({
  salePrice = 0,
  shippingCost = 0,
  insertionFee = 0,
  finalValuePct = 0.1325,
  perOrderFee = 0.3,
  cost = 0,
}) => {
  const nums = useMemo(() => {
    const sp = parseFloat(salePrice) || 0;
    const sh = parseFloat(shippingCost) || 0;
    const co = parseFloat(cost) || 0;
    const gross = sp + sh;
    const fvf = gross * finalValuePct;
    const totalFees = insertionFee + fvf + perOrderFee;
    const net = sp - totalFees;
    const netAfterCost = net - co;
    const marginPct = co > 0 ? (netAfterCost / co) * 100 : null;
    return { sp, sh, gross, fvf, totalFees, net, netAfterCost, marginPct };
  }, [salePrice, shippingCost, insertionFee, finalValuePct, perOrderFee, cost]);

  if (!nums.sp) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Enter a price to preview seller fees.
        </Typography>
      </Paper>
    );
  }

  const row = (label, value, hint) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {hint && (
          <Tooltip title={hint}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </Tooltip>
        )}
      </Box>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Fee Preview
      </Typography>
      {row('Sale price', `$${nums.sp.toFixed(2)}`)}
      {row('Shipping charged', `$${nums.sh.toFixed(2)}`)}
      {row(
        `Final value fee (${(finalValuePct * 100).toFixed(2)}%)`,
        `-$${nums.fvf.toFixed(2)}`,
        'Charged on the total transaction amount (price + shipping).'
      )}
      {insertionFee > 0 &&
        row('Insertion fee', `-$${insertionFee.toFixed(2)}`, 'Charged on listings beyond the free quota.')}
      {row('Per-order fee', `-$${perOrderFee.toFixed(2)}`, 'Flat per-order charge.')}
      <Divider sx={{ my: 1 }} />
      {row('Total fees', `-$${nums.totalFees.toFixed(2)}`)}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          You receive
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
          ${nums.net.toFixed(2)}
        </Typography>
      </Box>
      {nums.marginPct !== null && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pt: 0.5 }}>
          Net after cost of goods: <strong>${nums.netAfterCost.toFixed(2)}</strong> ({nums.marginPct.toFixed(1)}% margin)
        </Typography>
      )}
    </Paper>
  );
};

export default FeeCalculator;
