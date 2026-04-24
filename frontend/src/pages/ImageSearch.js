import React, { useRef, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Link } from 'react-router-dom';
import { imageSearchService, getImageUrl } from '../services/api';

const ImageSearch = () => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await imageSearchService.byFile(file);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Search by photo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a product photo and we'll find matching listings. Works best with a single item on a clean background.
      </Typography>

      <Paper
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: 'divider',
          cursor: 'pointer',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {preview ? (
          <Box
            component="img"
            src={preview}
            alt="uploaded"
            sx={{ maxHeight: 220, borderRadius: 1, objectFit: 'contain' }}
          />
        ) : (
          <Stack alignItems="center" gap={1}>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body1">Click or drop an image here</Typography>
            <Button variant="contained">Choose image</Button>
          </Stack>
        )}
      </Paper>

      {loading && (
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 3 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Analyzing image…</Typography>
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {result && (
        <Box>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              What we see
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {result.query.title && <Chip label={result.query.title} color="primary" />}
              {result.query.brand && <Chip label={`Brand: ${result.query.brand}`} />}
              {result.query.color && <Chip label={`Color: ${result.query.color}`} />}
              {result.query.category && <Chip label={`Category: ${result.query.category}`} />}
              {(result.query.keywords || []).map((k) => (
                <Chip key={k} label={k} size="small" variant="outlined" />
              ))}
            </Stack>
          </Paper>

          <Typography variant="h6" sx={{ mb: 2 }}>
            {result.products.length > 0
              ? `${result.products.length} match${result.products.length === 1 ? '' : 'es'}`
              : 'No matching listings yet — try another photo.'}
          </Typography>

          <Grid container spacing={2}>
            {result.products.map((p) => (
              <Grid item xs={6} sm={4} md={3} key={p.id}>
                <Card
                  component={Link}
                  to={`/product/${p.id}`}
                  sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  {p.imageUrl && (
                    <CardMedia
                      component="img"
                      image={getImageUrl(p.imageUrl)}
                      alt={p.title}
                      sx={{ aspectRatio: '1/1', objectFit: 'cover' }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                      {p.title}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      ${p.price?.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default ImageSearch;
