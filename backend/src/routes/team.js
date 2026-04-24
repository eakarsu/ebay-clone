const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');

// All team routes require authentication
router.use(authenticateToken);

// Get team members
router.get('/members', teamController.getTeamMembers);

// Invite a team member
router.post('/invite', teamController.inviteTeamMember);

// Accept invitation
router.post('/accept/:inviteId', teamController.acceptInvitation);

// Update team member role/permissions
router.put('/members/:memberId', teamController.updateTeamMember);

// Remove team member
router.delete('/members/:memberId', teamController.removeTeamMember);

// Get activity log
router.get('/activity', teamController.getActivityLog);

// Get pending invitations
router.get('/invitations', teamController.getPendingInvitations);

// Get available roles and permissions
router.get('/roles', teamController.getAvailableRoles);

module.exports = router;
