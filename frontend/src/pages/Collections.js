import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Skeleton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Collections as CollectionsIcon,
  MoreVert,
  Public,
  Lock,
  Delete,
  Edit,
  Favorite,
  Share,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { collectionService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Collections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [publicCollections, setPublicCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', description: '', isPublic: false });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCollections();
    fetchPublicCollections();
  }, []);

  const fetchCollections = async () => {
    if (!user) return;
    try {
      const response = await collectionService.getMyCollections();
      setCollections(response.data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicCollections = async () => {
    try {
      const response = await collectionService.getPublicCollections();
      setPublicCollections(response.data || []);
    } catch (error) {
      console.error('Error fetching public collections:', error);
    }
  };

  const handleCreateCollection = async () => {
    try {
      await collectionService.create(newCollection);
      setCreateDialog(false);
      setNewCollection({ name: '', description: '', isPublic: false });
      fetchCollections();
      setSnackbar({ open: true, message: 'Collection created!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create collection', severity: 'error' });
    }
  };

  const handleDeleteCollection = async (id) => {
    try {
      await collectionService.delete(id);
      fetchCollections();
      setSnackbar({ open: true, message: 'Collection deleted', severity: 'info' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete collection', severity: 'error' });
    }
    setAnchorEl(null);
  };

  const handleFollowCollection = async (id) => {
    try {
      await collectionService.follow(id);
      fetchPublicCollections();
      setSnackbar({ open: true, message: 'Now following this collection!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to follow collection', severity: 'error' });
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CollectionsIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in to view your collections</Typography>
        <Button variant="contained" component={Link} to="/login">Sign In</Button>
      </Container>
    );
  }

  const CollectionCard = ({ collection, isOwner = false }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="160"
        image={collection.coverImage || collection.items?.[0]?.product?.images?.[0]?.url || 'https://via.placeholder.com/300x160?text=Collection'}
        alt={collection.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {collection.name}
          </Typography>
          {isOwner && (
            <IconButton
              size="small"
              onClick={(e) => {
                setAnchorEl(e.currentTarget);
                setSelectedCollection(collection);
              }}
            >
              <MoreVert />
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {collection.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={collection.isPublic ? <Public /> : <Lock />}
            label={collection.isPublic ? 'Public' : 'Private'}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            {collection.itemCount || collection.items?.length || 0} items
          </Typography>
        </Box>
        {!isOwner && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Avatar sx={{ width: 24, height: 24 }}>{collection.owner?.username?.[0]}</Avatar>
            <Typography variant="caption">{collection.owner?.username}</Typography>
          </Box>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" component={Link} to={`/collections/${collection.id}`}>
          View
        </Button>
        {!isOwner && (
          <Button size="small" startIcon={<Favorite />} onClick={() => handleFollowCollection(collection.id)}>
            Follow
          </Button>
        )}
        <IconButton size="small">
          <Share />
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CollectionsIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Collections</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialog(true)}
        >
          Create Collection
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="My Collections" />
        <Tab label="Discover" />
      </Tabs>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={280} />
            </Grid>
          ))}
        </Grid>
      ) : tabValue === 0 ? (
        collections.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CollectionsIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              You haven't created any collections yet
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setCreateDialog(true)}
              sx={{ mt: 2 }}
            >
              Create Your First Collection
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {collections.map((collection) => (
              <Grid item xs={12} sm={6} md={4} key={collection.id}>
                <CollectionCard collection={collection} isOwner />
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        <Grid container spacing={3}>
          {publicCollections.map((collection) => (
            <Grid item xs={12} sm={6} md={4} key={collection.id}>
              <CollectionCard collection={collection} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Collection</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Collection Name"
            value={newCollection.name}
            onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={newCollection.description}
            onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<Lock />}
              label="Private"
              onClick={() => setNewCollection({ ...newCollection, isPublic: false })}
              variant={!newCollection.isPublic ? 'filled' : 'outlined'}
              color={!newCollection.isPublic ? 'primary' : 'default'}
            />
            <Chip
              icon={<Public />}
              label="Public"
              onClick={() => setNewCollection({ ...newCollection, isPublic: true })}
              variant={newCollection.isPublic ? 'filled' : 'outlined'}
              color={newCollection.isPublic ? 'primary' : 'default'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCollection} disabled={!newCollection.name}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { setAnchorEl(null); }}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteCollection(selectedCollection?.id)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default Collections;
