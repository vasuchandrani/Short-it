const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('../email');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Helper function to handle request approval
async function approveRequestLogic(requestId) {
  const reqRes = await db.query('SELECT * FROM authentication_requests WHERE id = $1', [requestId]);
  if (reqRes.rows.length === 0) {
    throw new Error('Authentication request not found.');
  }
  const request = reqRes.rows[0];

  if (request.status !== 'pending') {
    throw new Error(`Request is already ${request.status}.`);
  }

  // Generate temporary password
  const tempPassword = 'short-' + crypto.randomBytes(3).toString('hex');
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Start Transaction
  await db.query('BEGIN');
  try {
    // 1. Insert into users table
    await db.query(
      'INSERT INTO users (name, email, contact, password, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [request.name, request.email, request.contact, hashedPassword, 'user', 'approved']
    );

    // 2. Update request status to approved
    await db.query(
      'UPDATE authentication_requests SET status = $1 WHERE id = $2',
      ['approved', requestId]
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  // 3. Send email to user
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-top: 0;">Welcome to Short-It!</h2>
      <p style="font-size: 16px; color: #475569; line-height: 1.5;">Hi ${request.name},</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.5;">Great news! Your Short-It account has been approved by the administrator.</p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #166534;">Your Temporary Credentials:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-weight: 500; color: #334155; width: 100px;">Username:</td>
            <td style="padding: 4px 0; color: #475569;">${request.email}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 500; color: #334155;">Password:</td>
            <td style="padding: 4px 0; font-family: monospace; font-weight: bold; color: #166534; font-size: 16px;">${tempPassword}</td>
          </tr>
        </table>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #15803d; font-style: italic;">* Please change your password in the dashboard after logging in.</p>
      </div>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${frontendUrl}/login" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; transition: background-color 0.2s;">Open Dashboard</a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
    </div>
  `;

  await sendMail({
    to: request.email,
    subject: 'Your Short-It account has been approved',
    html: htmlContent
  });

  return { email: request.email, tempPassword };
}

// Helper function to handle request rejection
async function rejectRequestLogic(requestId) {
  const reqRes = await db.query('SELECT * FROM authentication_requests WHERE id = $1', [requestId]);
  if (reqRes.rows.length === 0) {
    throw new Error('Authentication request not found.');
  }
  const request = reqRes.rows[0];

  if (request.status !== 'pending') {
    throw new Error(`Request is already ${request.status}.`);
  }

  // Start Transaction
  await db.query('BEGIN');
  try {
    // 1. Insert into blocked_users
    await db.query(
      'INSERT INTO blocked_users (email, name, contact) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      [request.email, request.name, request.contact]
    );

    // 2. Update request status to rejected
    await db.query(
      'UPDATE authentication_requests SET status = $1 WHERE id = $2',
      ['rejected', requestId]
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
  return { email: request.email };
}

// 1. Single-Click Actions from Email Link (Public endpoint, but verified with secure token)
router.get('/requests/email-action', async (req, res) => {
  const { action, id, token } = req.query;

  if (!action || !id || !token) {
    return res.status(400).send('<h1>Invalid Link</h1><p>Missing required parameters.</p>');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.requestId !== id) {
      return res.status(403).send('<h1>Unauthorized</h1><p>Token verification failed.</p>');
    }

    let messageHtml = '';

    if (action === 'approve') {
      const result = await approveRequestLogic(id);
      messageHtml = `
        <div style="text-align: center; padding: 50px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="color: #10b981; font-size: 64px; margin-bottom: 20px;">✓</div>
          <h1 style="color: #1e293b;">Request Approved Successfully!</h1>
          <p style="color: #64748b; font-size: 16px;">An account has been created for <strong>${result.email}</strong>.</p>
          <p style="color: #64748b; font-size: 16px;">A welcome email with their temporary password (<code>${result.tempPassword}</code>) has been dispatched.</p>
          <br/>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: 500;">Go to Dashboard</a>
        </div>
      `;
    } else if (action === 'reject') {
      const result = await rejectRequestLogic(id);
      messageHtml = `
        <div style="text-align: center; padding: 50px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="color: #ef4444; font-size: 64px; margin-bottom: 20px;">✕</div>
          <h1 style="color: #1e293b;">Request Rejected & User Blocked</h1>
          <p style="color: #64748b; font-size: 16px;">The access request for <strong>${result.email}</strong> was rejected.</p>
          <p style="color: #64748b; font-size: 16px;">This user has been added to the block list. No future request notifications will be generated for this email.</p>
          <br/>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: 500;">Go to Dashboard</a>
        </div>
      `;
    } else {
      return res.status(400).send('<h1>Error</h1><p>Invalid action specified.</p>');
    }

    res.send(messageHtml);
  } catch (err) {
    console.error('Email action error:', err.message);
    res.status(500).send(`
      <div style="text-align: center; padding: 50px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="color: #ef4444; font-size: 64px; margin-bottom: 20px;">⚠</div>
        <h1 style="color: #1e293b;">Action Failed</h1>
        <p style="color: #64748b; font-size: 16px;">${err.message || 'An error occurred while processing the request.'}</p>
        <br/>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: 500;">Go to Dashboard</a>
      </div>
    `);
  }
});

// Apply auth + admin validation on the rest of the endpoints
router.use(authenticateToken, requireAdmin);

// 2. Get Pending Requests
router.get('/requests', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM authentication_requests WHERE status = $1 ORDER BY created_at DESC', ['pending']);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching requests:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 3. Approve Request API
router.post('/requests/:id/approve', async (req, res) => {
  try {
    const result = await approveRequestLogic(req.params.id);
    res.json({ message: 'Request approved successfully.', email: result.email });
  } catch (err) {
    console.error('Error approving request:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// 4. Reject Request API
router.post('/requests/:id/reject', async (req, res) => {
  try {
    const result = await rejectRequestLogic(req.params.id);
    res.json({ message: 'Request rejected and user blocked.', email: result.email });
  } catch (err) {
    console.error('Error rejecting request:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// 5. Get Approved Users (Excluding Admin)
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, contact, status, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['user']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 6. Remove User (Deletes account and all their shortened URLs)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Transaction to delete user (cascade triggers short URL deletion automatically due to foreign key)
    await db.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'user']);
    res.json({ message: 'User and all associated short links deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 7. Get Blocked Users
router.get('/blocked', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blocked_users ORDER BY blocked_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching blocked list:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 8. Unblock User (Removes email from blocked_users)
router.delete('/blocked/:email', async (req, res) => {
  try {
    const { email } = req.params;
    await db.query('DELETE FROM blocked_users WHERE email = $1', [email]);
    res.json({ message: 'User unblocked successfully.' });
  } catch (err) {
    console.error('Error unblocking user:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
