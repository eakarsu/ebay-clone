import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Grid, Card, CardMedia, CardContent, Avatar, Box,
  Alert, Chip, CardActionArea,
} from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { publicWishlistService } from '../services/api';

export default function PublicWishlist() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    publicWishlistService.getByToken(token)
      .then(({ data }) => setData(data))
      .catch(e => setErr(e.response?.data?.error || 'Wishlist not found'));
  }, [token]);

  if (err) return <Container sx={{ py: 4 }}><Alert severity="error">{err}</Alert></Container>;
  if (!data) return <Container sx={{ py: 4 }}><Typography>Loading…</Typography></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar src={data.owner.avatarUrl} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{data.owner.username}'s wishlist</Typography>
          <Typography variant="body2" color="text.secondary">{data.items.length} item{data.items.length === 1 ? '' : 's'}</Typography>
        </Box>
      </Box>

      {data.items.length === 0 ? (
        <Alert severity="info">This wishlist is empty.</Alert>
      ) : (
        <Grid container spacing={2}>
          {data.items.map(it => (
            <Grid item xs={6} sm={4} md={3} key={it.id}>
              <Card>
                <CardActionArea component={Link} to={`/product/${it.id}`}>
                  {it.image && <CardMedia component="img" height={160} image={it.image} alt={it.title} />}
                  <CardContent>
                    <Typography variant="subtitle2" noWrap>{it.title}</Typography>
                    <Typography variant="h6" color="primary">${Number(it.price).toFixed(2)}</Typography>
                    <Chip size="small" label={it.condition} sx={{ mt: 0.5 }} />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
