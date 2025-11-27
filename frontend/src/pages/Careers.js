import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  Work,
  LocationOn,
  Code,
  TrendingUp,
  People,
  Support,
  Campaign,
} from '@mui/icons-material';

const departments = [
  { icon: <Code />, name: 'Engineering', openings: 45 },
  { icon: <TrendingUp />, name: 'Product', openings: 12 },
  { icon: <Campaign />, name: 'Marketing', openings: 8 },
  { icon: <People />, name: 'Human Resources', openings: 5 },
  { icon: <Support />, name: 'Customer Experience', openings: 20 },
];

const jobs = [
  { id: 1, title: 'Senior Software Engineer', department: 'Engineering', location: 'San Jose, CA', type: 'Full-time' },
  { id: 2, title: 'Product Manager', department: 'Product', location: 'Remote', type: 'Full-time' },
  { id: 3, title: 'UX Designer', department: 'Product', location: 'New York, NY', type: 'Full-time' },
  { id: 4, title: 'Data Scientist', department: 'Engineering', location: 'San Jose, CA', type: 'Full-time' },
  { id: 5, title: 'Marketing Manager', department: 'Marketing', location: 'Remote', type: 'Full-time' },
  { id: 6, title: 'Customer Support Lead', department: 'Customer Experience', location: 'Austin, TX', type: 'Full-time' },
  { id: 7, title: 'DevOps Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
  { id: 8, title: 'Content Strategist', department: 'Marketing', location: 'New York, NY', type: 'Full-time' },
];

const benefits = [
  'Competitive salary & equity',
  'Health, dental & vision insurance',
  'Flexible work arrangements',
  'Generous PTO policy',
  '401(k) matching',
  'Professional development',
  'Parental leave',
  'Employee discounts',
];

const Careers = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Join Our Team
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
            Help us build the future of commerce
          </Typography>
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <TextField
              fullWidth
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Departments */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Explore Departments
        </Typography>
        <Grid container spacing={2}>
          {departments.map((dept) => (
            <Grid item xs={6} sm={4} md={2.4} key={dept.name}>
              <Card sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{dept.icon}</Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {dept.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dept.openings} openings
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Job Listings */}
      <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
            Open Positions ({filteredJobs.length})
          </Typography>
          <Grid container spacing={2}>
            {filteredJobs.map((job) => (
              <Grid item xs={12} md={6} key={job.id}>
                <Card sx={{ '&:hover': { boxShadow: 3 } }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {job.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Work fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {job.department}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {job.location}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip label={job.type} size="small" />
                      <Button size="small" variant="contained">
                        Apply Now
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Benefits & Perks
        </Typography>
        <Grid container spacing={2}>
          {benefits.map((benefit) => (
            <Grid item xs={6} sm={4} md={3} key={benefit}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body1">{benefit}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Careers;
