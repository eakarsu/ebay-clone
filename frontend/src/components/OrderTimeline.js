import React, { useEffect, useState } from 'react';
import { Box, Stepper, Step, StepLabel, StepContent, Typography, Alert } from '@mui/material';
import { orderTimelineService } from '../services/api';

// The canonical order status flow. We still render any unknown status the
// backend reports, but this defines the expected "happy path" steps for the
// stepper — unreached steps render greyed out.
const HAPPY_PATH = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS = {
  pending: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const OrderTimeline = ({ orderId, currentStatus }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res = await orderTimelineService.get(orderId);
        setEvents(res.data.events || []);
        if (res.data.warning === 'timeline_not_migrated') {
          setWarning('Timeline is empty — run add_social_and_timeline.sql to populate status history.');
        }
      } catch (_) { /* leave events empty */ }
      finally { setLoading(false); }
    })();
  }, [orderId]);

  // Build a status → event map so we can show the timestamp each status was
  // reached. If an event fires for a step we don't know, we still list it at
  // the end so nothing is lost.
  const byStatus = new Map();
  events.forEach((e) => { if (!byStatus.has(e.to_status)) byStatus.set(e.to_status, e); });

  // Expand the stepper to include off-happy-path statuses that were reached
  // (e.g. cancelled/returned), tacked on after the reached happy-path steps.
  const offPath = [...byStatus.keys()].filter((s) => !HAPPY_PATH.includes(s));
  const stepOrder = [...HAPPY_PATH, ...offPath];

  // The active step: the index of currentStatus in stepOrder.
  const activeIdx = Math.max(0, stepOrder.indexOf(currentStatus));

  if (loading) return <Typography color="text.secondary">Loading timeline…</Typography>;

  return (
    <Box>
      {warning && <Alert severity="info" sx={{ mb: 2 }}>{warning}</Alert>}
      <Stepper activeStep={activeIdx} orientation="vertical">
        {stepOrder.map((status) => {
          const evt = byStatus.get(status);
          const label = STATUS_LABELS[status] || status;
          return (
            <Step key={status} completed={!!evt && status !== currentStatus}>
              <StepLabel
                optional={
                  evt ? (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(evt.created_at).toLocaleString()}
                    </Typography>
                  ) : null
                }
              >
                {label}
              </StepLabel>
              <StepContent>
                {evt?.note && <Typography variant="body2">{evt.note}</Typography>}
                {evt?.from_status && (
                  <Typography variant="caption" color="text.secondary">
                    from {STATUS_LABELS[evt.from_status] || evt.from_status}
                  </Typography>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default OrderTimeline;
