import { useEffect, useRef } from 'react';
import axios from 'axios';
import { getSocket, joinAuction, leaveAuction } from '../services/socket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

/**
 * Subscribe to real-time bid events for an auction.
 * Keeps a local "last seen seq" so on reconnect we can REST-catch-up the missed bids.
 *
 * @param {string} productId
 * @param {(payload) => void} onBid         - called for each bid (live OR catch-up)
 */
export default function useAuctionSocket(productId, onBid) {
  const lastSeqRef = useRef(0);

  useEffect(() => {
    if (!productId) return undefined;
    lastSeqRef.current = 0;

    const socket = getSocket();
    joinAuction(productId);

    const handler = (payload) => {
      if (payload && payload.productId === productId && typeof onBid === 'function') {
        if (payload.bidSeq && payload.bidSeq > lastSeqRef.current) {
          lastSeqRef.current = payload.bidSeq;
        }
        onBid(payload);
      }
    };

    const catchUp = async () => {
      try {
        const r = await axios.get(
          `${API_URL}/bids/product/${productId}/since`,
          { params: { sinceSeq: lastSeqRef.current } }
        );
        for (const b of (r.data.bids || [])) {
          if (typeof onBid === 'function') {
            onBid({
              productId,
              bidId: b.id,
              bidSeq: b.seq,
              amount: b.amount,
              bidCount: r.data.bidCount,
              time: b.time,
              bidder: b.bidder,
              auctionEnd: r.data.auctionEnd,
              caughtUp: true,
            });
          }
          if (b.seq > lastSeqRef.current) lastSeqRef.current = b.seq;
        }
      } catch (_) { /* silent */ }
    };

    socket.on('bid:new', handler);
    socket.on('reconnect', () => {
      joinAuction(productId);
      catchUp();
    });
    socket.io.on('reconnect', () => {
      joinAuction(productId);
      catchUp();
    });

    return () => {
      socket.off('bid:new', handler);
      leaveAuction(productId);
    };
  }, [productId, onBid]);
}
