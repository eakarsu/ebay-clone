import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  PersonAdd,
  Delete,
  Edit,
  Group,
  Security,
  History,
  Check,
  Close,
  Visibility,
  EditNote,
  ManageAccounts,
  AdminPanelSettings,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const roleIcons = {
  viewer: <Visibility />,
  editor: <EditNote />,
  manager: <ManageAccounts />,
  admin: <AdminPanelSettings />,
};

const roleColors = {
  viewer: 'default',
  editor: 'info',
  manager: 'warning',
  admin: 'error',
};

const TeamAccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Data
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [roles, setRoles] = useState([]);

  // Dialog state
  const [inviteDialog, setInviteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form data
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitationsRes, rolesRes, activityRes] = await Promise.all([
        api.get('/team/members').catch(() => ({ data: { members: [] } })),
        api.get('/team/invitations').catch(() => ({ data: { invitations: [] } })),
        api.get('/team/roles').catch(() => ({ data: { roles: [] } })),
        api.get('/team/activity').catch(() => ({ data: { activities: [] } })),
      ]);

      setMembers(membersRes.data.members || []);
      setInvitations(invitationsRes.data.invitations || []);
      setRoles(rolesRes.data.roles || []);
      setActivities(activityRes.data.activities || []);
    } catch (err) {
      // Use mock data
      setRoles([
        { id: 'viewer', name: 'Viewer', description: 'Can view listings, orders, and messages' },
        { id: 'editor', name: 'Editor', description: 'Can edit listings and respond to messages' },
        { id: 'manager', name: 'Manager', description: 'Can manage orders and listings' },
        { id: 'admin', name: 'Admin', description: 'Full access to all features' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) {
      setError('Please enter email and select a role');
      return;
    }

    try {
      await api.post('/team/invite', { email: inviteEmail, role: inviteRole });
      setSuccess('Invitation sent successfully!');
      setInviteDialog(false);
      setInviteEmail('');
      setInviteRole('viewer');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    }
  };

  const handleAcceptInvitation = async (inviteId) => {
    try {
      await api.post(`/team/accept/${inviteId}`);
      setSuccess('Invitation accepted!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept invitation');
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      await api.put(`/team/members/${selectedMember.id}`, {
        role: selectedMember.role,
        isActive: selectedMember.isActive,
      });
      setSuccess('Team member updated successfully!');
      setEditDialog(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update team member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;

    try {
      await api.delete(`/team/members/${memberId}`);
      setSuccess('Team member removed');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove team member');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Group sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Team Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share your eBay account with team members
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setInviteDialog(true)}
          sx={{ bgcolor: '#3665f3' }}
        >
          Invite Member
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Pending Invitations for Current User */}
      {invitations.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: '#fff3e0' }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd /> Pending Invitations
          </Typography>
          <List>
            {invitations.map((inv) => (
              <ListItem key={inv.id}>
                <ListItemAvatar>
                  <Avatar src={inv.ownerAvatar}>{inv.ownerUsername?.[0]?.toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${inv.ownerUsername} invited you`}
                  secondary={`Role: ${inv.roleName}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    startIcon={<Check />}
                    onClick={() => handleAcceptInvitation(inv.id)}
                    sx={{ mr: 1 }}
                  >
                    Accept
                  </Button>
                  <Button variant="outlined" size="small" color="error" startIcon={<Close />}>
                    Decline
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Roles Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {roles.map((role) => (
          <Grid item xs={12} sm={6} md={3} key={role.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {roleIcons[role.id]}
                  <Typography variant="h6">{role.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {role.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Group />} label="Team Members" />
          <Tab icon={<History />} label="Activity Log" />
        </Tabs>
      </Paper>

      {/* Team Members Tab */}
      {tabValue === 0 && (
        <Paper>
          {members.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No team members yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Invite team members to help manage your eBay business
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setInviteDialog(true)}
              >
                Invite Your First Member
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={member.avatarUrl}>
                            {member.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {member.firstName} {member.lastName || member.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {member.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={roleIcons[member.role]}
                          label={member.roleName}
                          size="small"
                          color={roleColors[member.role]}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.acceptedAt ? 'Active' : 'Pending'}
                          size="small"
                          color={member.acceptedAt ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {member.acceptedAt
                          ? new Date(member.acceptedAt).toLocaleDateString()
                          : 'Invited ' + new Date(member.invitedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedMember(member);
                            setEditDialog(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Activity Log Tab */}
      {tabValue === 1 && (
        <Paper>
          {activities.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <History sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No activity yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Team member actions will appear here
              </Typography>
            </Box>
          ) : (
            <List>
              {activities.map((activity) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {activity.username?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${activity.username} ${activity.actionType.replace(/_/g, ' ')}`}
                      secondary={new Date(activity.createdAt).toLocaleString()}
                    />
                    <Chip label={activity.role} size="small" />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            sx={{ mt: 2, mb: 3 }}
            placeholder="colleague@example.com"
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} label="Role">
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {roleIcons[role.id]}
                    <Box>
                      <Typography variant="body2">{role.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {role.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Team Member</DialogTitle>
        <DialogContent>
          {selectedMember && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                <Avatar src={selectedMember.avatarUrl}>
                  {selectedMember.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedMember.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMember.email}
                  </Typography>
                </Box>
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedMember.role}
                  onChange={(e) => setSelectedMember({ ...selectedMember, role: e.target.value })}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={selectedMember.isActive}
                    onChange={(e) =>
                      setSelectedMember({ ...selectedMember, isActive: e.target.checked })
                    }
                  />
                }
                label="Active"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateMember}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamAccess;
