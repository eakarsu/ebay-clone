import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  CircularProgress,
  Pagination,
} from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { categoryService, productService } from '../services/api';
import ProductGrid from '../components/Products/ProductGrid';

const Category = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catResponse = await categoryService.getBySlug(slug);
        setCategory(catResponse.data.category);
        setSubcategories(catResponse.data.subcategories);

        const prodResponse = await productService.getAll({
          category: slug,
          page: pagination.page,
          limit: 20,
        });
        setProducts(prodResponse.data.products);
        setPagination(prodResponse.data.pagination);
      } catch (error) {
        console.error('Error fetching category:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, pagination.page]);

  if (loading && !category) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!category) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Category not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Home
        </Link>
        <Typography color="text.primary">{category.name}</Typography>
      </Breadcrumbs>

      {/* Category Header */}
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        {category.name}
      </Typography>
      {category.description && (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {category.description}
        </Typography>
      )}

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Shop by Subcategory
          </Typography>
          <Grid container spacing={2}>
            {subcategories.map((sub) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={sub.id}>
                <Card
                  component={Link}
                  to={`/search?category=${slug}&subcategory=${sub.slug}`}
                  sx={{
                    textDecoration: 'none',
                    textAlign: 'center',
                    p: 2,
                    '&:hover': { boxShadow: 4 },
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {sub.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sub.productCount} items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Products */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          All Items ({pagination.total})
        </Typography>
        <ProductGrid products={products} loading={loading} />

        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={(e, page) => setPagination((prev) => ({ ...prev, page }))}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Category;
