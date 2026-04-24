const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Available roles and their default permissions
const ROLES = {
  viewer: {
    name: 'Viewer',
    description: 'Can view listings, orders, and messages',
    permissions: {
      view_listings: true,
      view_orders: true,
      view_messages: true,
      view_analytics: true,
      edit_listings: false,
      manage_orders: false,
      respond_messages: false,
      manage_settings: false,
    },
  },
  editor: {
    name: 'Editor',
    description: 'Can edit listings and respond to messages',
    permissions: {
      view_listings: true,
      view_orders: true,
      view_messages: true,
      view_analytics: true,
      edit_listings: true,
      manage_orders: false,
      respond_messages: true,
      manage_settings: false,
    },
  },
  manager: {
    name: 'Manager',
    description: 'Can manage orders and listings',
    permissions: {
      view_listings: true,
      view_orders: true,
      view_messages: true,
      view_analytics: true,
      edit_listings: true,
      manage_orders: true,
      respond_messages: true,
      manage_settings: false,
    },
  },
  admin: {
    name: 'Admin',
    description: 'Full access to all features',
    permissions: {
      view_listings: true,
      view_orders: true,
      view_messages: true,
      view_analytics: true,
      edit_listings: true,
      manage_orders: true,
      respond_messages: true,
      manage_settings: true,
    },
  },
};

// Get team members
const getTeamMembers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT tm.*, u.username, u.email, u.avatar_url, u.first_name, u.last_name
       FROM team_members tm
       JOIN users u ON tm.member_id = u.id
       WHERE tm.owner_id = $1 AND tm.is_active = true
       ORDER BY tm.created_at DESC`,
      [req.user.id]
    );

    const members = result.rows.map(member => ({
      id: member.id,
      memberId: member.member_id,
      username: member.username,
      email: member.email,
      avatarUrl: member.avatar_url,
      firstName: member.first_name,
      lastName: member.last_name,
      role: member.role,
      roleName: ROLES[member.role]?.name || member.role,
      permissions: member.permissions || ROLES[member.role]?.permissions,
      invitedAt: member.invited_at,
      acceptedAt: member.accepted_at,
      isActive: member.is_active,
    }));

    res.json({ members });
  } catch (error) {
    next(error);
  }
};

// Invite team member
const inviteTeamMember = async (req, res, next) => {
  try {
    const { email, role, customPermissions } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!ROLES[role]) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found. They must have an account first.',
      });
    }

    const invitedUser = userResult.rows[0];

    // Check if user is already a team member
    const existingResult = await pool.query(
      'SELECT id FROM team_members WHERE owner_id = $1 AND member_id = $2',
      [req.user.id, invitedUser.id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Can't add yourself
    if (invitedUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot add yourself as a team member' });
    }

    const permissions = customPermissions || ROLES[role].permissions;

    const result = await pool.query(
      `INSERT INTO team_members (owner_id, member_id, role, permissions, invited_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, invitedUser.id, role, JSON.stringify(permissions), req.user.id]
    );

    // Create notification for invited user
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'team_invite', 'Team Invitation', $2, '/team')`,
      [invitedUser.id, `You've been invited to join ${req.user.username}'s team as ${ROLES[role].name}`]
    );

    res.status(201).json({
      message: 'Team member invited successfully',
      member: {
        id: result.rows[0].id,
        memberId: invitedUser.id,
        username: invitedUser.username,
        email: invitedUser.email,
        role,
        invitedAt: result.rows[0].invited_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Accept invitation
const acceptInvitation = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    const result = await pool.query(
      `UPDATE team_members
       SET accepted_at = NOW(), is_active = true
       WHERE id = $1 AND member_id = $2 AND accepted_at IS NULL
       RETURNING *`,
      [inviteId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found or already accepted' });
    }

    // Get owner info
    const ownerResult = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [result.rows[0].owner_id]
    );

    // Notify owner
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'team_accepted', 'Invitation Accepted', $2, '/team')`,
      [result.rows[0].owner_id, `${req.user.username} has accepted your team invitation`]
    );

    res.json({
      message: 'Invitation accepted successfully',
      team: {
        ownerId: result.rows[0].owner_id,
        ownerUsername: ownerResult.rows[0]?.username,
        role: result.rows[0].role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update team member
const updateTeamMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { role, permissions, isActive } = req.body;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM team_members WHERE id = $1 AND owner_id = $2',
      [memberId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (role && ROLES[role]) {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      values.push(role);

      // Update permissions to match new role if not custom
      if (!permissions) {
        paramCount++;
        updates.push(`permissions = $${paramCount}`);
        values.push(JSON.stringify(ROLES[role].permissions));
      }
    }

    if (permissions) {
      paramCount++;
      updates.push(`permissions = $${paramCount}`);
      values.push(JSON.stringify(permissions));
    }

    if (typeof isActive === 'boolean') {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    paramCount++;
    values.push(memberId);

    const result = await pool.query(
      `UPDATE team_members SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    // Log activity
    await logTeamActivity(memberId, 'role_updated', {
      updatedBy: req.user.id,
      newRole: role,
    });

    res.json({
      message: 'Team member updated successfully',
      member: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Remove team member
const removeTeamMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const result = await pool.query(
      `DELETE FROM team_members
       WHERE id = $1 AND owner_id = $2
       RETURNING member_id`,
      [memberId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Notify removed member
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'team_removed', 'Team Access Removed', $2)`,
      [result.rows[0].member_id, `Your access to ${req.user.username}'s account has been removed`]
    );

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    next(error);
  }
};

// Get activity log
const getActivityLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT tal.*, tm.role, u.username
       FROM team_activity_log tal
       JOIN team_members tm ON tal.team_member_id = tm.id
       JOIN users u ON tm.member_id = u.id
       WHERE tm.owner_id = $1
       ORDER BY tal.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({
      activities: result.rows.map(row => ({
        id: row.id,
        username: row.username,
        role: row.role,
        actionType: row.action_type,
        actionDetails: row.action_details,
        entityType: row.entity_type,
        entityId: row.entity_id,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get pending invitations (for invited user)
const getPendingInvitations = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT tm.*, u.username as owner_username, u.avatar_url as owner_avatar
       FROM team_members tm
       JOIN users u ON tm.owner_id = u.id
       WHERE tm.member_id = $1 AND tm.accepted_at IS NULL
       ORDER BY tm.invited_at DESC`,
      [req.user.id]
    );

    res.json({
      invitations: result.rows.map(inv => ({
        id: inv.id,
        ownerUsername: inv.owner_username,
        ownerAvatar: inv.owner_avatar,
        role: inv.role,
        roleName: ROLES[inv.role]?.name || inv.role,
        invitedAt: inv.invited_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get available roles
const getAvailableRoles = async (req, res, next) => {
  res.json({
    roles: Object.entries(ROLES).map(([key, value]) => ({
      id: key,
      ...value,
    })),
  });
};

// Helper function to log team activity
const logTeamActivity = async (teamMemberId, actionType, details) => {
  try {
    await pool.query(
      `INSERT INTO team_activity_log (team_member_id, action_type, action_details)
       VALUES ($1, $2, $3)`,
      [teamMemberId, actionType, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Error logging team activity:', error);
  }
};

module.exports = {
  getTeamMembers,
  inviteTeamMember,
  acceptInvitation,
  updateTeamMember,
  removeTeamMember,
  getActivityLog,
  getPendingInvitations,
  getAvailableRoles,
};
