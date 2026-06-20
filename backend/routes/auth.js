const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../email');
const { authenticateToken } = require('../middleware/auth');

// 1. Submit Access Request
router.post('/request', async (req, res) => {
  const { name, email, contact } = req.body;

  if (!name || !email || !contact) {
    return res.status(400).json({ message: 'All fields (name, email, contact) are required.' });
  }

  try {
    // Check if user is in blocked_users table
    const blockedCheck = await db.query('SELECT * FROM blocked_users WHERE email = $1', [email]);
    if (blockedCheck.rows.length > 0) {
      // Reject request silently (do not send email)
      return res.status(403).json({ message: 'Your request cannot be processed.' });
    }

    // Check if user is already in requests table
    const requestCheck = await db.query('SELECT * FROM authentication_requests WHERE email = $1', [email]);
    if (requestCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Your request is already in process. Please wait for admin approval.'
      });
    }

    // Check if user is already approved and registered
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Your account has already been approved and registered. Please login.'
      });
    }

    // Store request in database
    const insertRes = await db.query(
      'INSERT INTO authentication_requests (name, email, contact, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, contact, 'pending']
    );
    const newRequest = insertRes.rows[0];

    // Generate secure single-click token for admin approval/rejection from email
    const actionToken = jwt.sign(
      { requestId: newRequest.id, email: newRequest.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'vatsal.chandrani.11@gmail.com';
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const approveUrl = `${backendUrl}/api/admin/requests/email-action?action=approve&id=${newRequest.id}&token=${actionToken}`;
    const rejectUrl = `${backendUrl}/api/admin/requests/email-action?action=reject&id=${newRequest.id}&token=${actionToken}`;
    const dashboardUrl = `${frontendUrl}/admin`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #1e1b4b; border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-top: 0;">New Short-It Access Request</h2>
        <p style="font-size: 16px; color: #475569; line-height: 1.5;">A new user is requesting access to the private Short-It URL shortener platform:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #334155; width: 120px;">Name:</td>
              <td style="padding: 6px 0; color: #475569;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #334155;">Email:</td>
              <td style="padding: 6px 0; color: #475569;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #334155;">Contact:</td>
              <td style="padding: 6px 0; color: #475569;">${contact}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">Please choose an action below to process this request immediately:</p>
        
        <div style="margin-bottom: 30px; text-align: center;">
          <a href="${approveUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 15px; display: inline-block; transition: background-color 0.2s;">Approve Request</a>
          <a href="${rejectUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; transition: background-color 0.2s;">Reject Request</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 13px; color: #64748b; line-height: 1.4; text-align: center;">
          Alternatively, you can manage all access requests directly from the 
          <a href="${dashboardUrl}" style="color: #6366f1; text-decoration: underline; font-weight: 500;">Admin Dashboard</a>.
        </p>
      </div>
    `;

    await sendMail({
      to: adminEmail,
      subject: 'New Short-It authentication request',
      html: htmlContent
    });

    return res.status(201).json({
      message: 'Your authentication request has been sent successfully. Please wait for admin approval.'
    });
  } catch (err) {
    console.error('Error handling auth request:', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. Login Endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find user in users table
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Verify account status
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Your account is not approved or active.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact
      }
    });
  } catch (err) {
    console.error('Error logging in:', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 3. Get Current User Info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, contact, role, status, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
