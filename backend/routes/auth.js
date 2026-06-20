const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../email');
const { authenticateToken } = require('../middleware/auth');

// 1. Submit Access Request
router.post('/request', async (req, res) => {
  const { name, email, contact, password } = req.body;

  if (!name || !email || !contact || !password) {
    return res.status(400).json({ message: 'All fields (name, email, contact, password) are required.' });
  }

  try {
    // Check if user is in blocked_users table
    const blockedCheck = await db.query('SELECT * FROM blocked_users WHERE email = $1', [email]);
    if (blockedCheck.rows.length > 0) {
      // Reject request silently (do not send email)
      return res.status(403).json({ message: 'Your request cannot be processed.' });
    }

    // Check if user is already approved and registered
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Your account has already been approved and registered. Please login.'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if email ends with @ddu.ac.in
    const isDduEmail = email.toLowerCase().endsWith('@ddu.ac.in');

    if (isDduEmail) {
      // Direct Email Verification Flow for DDU Students
      // Generate a 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Upsert into authentication_requests with status 'verifying'
      const existingReq = await db.query('SELECT * FROM authentication_requests WHERE email = $1', [email]);
      if (existingReq.rows.length > 0) {
        await db.query(
          "UPDATE authentication_requests SET name = $1, contact = $2, password = $3, verification_code = $4, status = 'verifying' WHERE email = $5",
          [name, contact, hashedPassword, verificationCode, email]
        );
      } else {
        await db.query(
          "INSERT INTO authentication_requests (name, email, contact, password, verification_code, status) VALUES ($1, $2, $3, $4, $5, 'verifying')",
          [name, email, contact, hashedPassword, verificationCode]
        );
      }

      // Send verification code email to the DDU student
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-top: 0;">Verify Your Short-It Account</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.5;">Hi ${name},</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.5;">You requested access to the private Short-It URL shortener using your DDU email. Please use the verification code below to activate your account:</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px dashed #10b981;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #15803d; font-weight: 600;">Verification Code:</p>
            <h1 style="margin: 0; font-family: monospace; font-size: 36px; font-weight: 800; color: #166534; letter-spacing: 4px;">${verificationCode}</h1>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #15803d;">This code will expire in 15 minutes.</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">If you did not initiate this request, you can safely ignore this email.</p>
        </div>
      `;

      await sendMail({
        to: email,
        subject: 'Your Short-It Verification Code',
        html: htmlContent
      });

      return res.status(200).json({
        requiresVerification: true,
        email,
        message: 'A verification code has been sent to your DDU email. Please enter it to complete activation.'
      });

    } else {
      // Standard Admin Approval Flow
      // Check if user is already in requests table
      const requestCheck = await db.query('SELECT * FROM authentication_requests WHERE email = $1', [email]);
      if (requestCheck.rows.length > 0) {
        const existingReqStatus = requestCheck.rows[0].status;
        if (existingReqStatus === 'pending') {
          return res.status(400).json({
            message: 'Your request is already in process. Please wait for admin approval.'
          });
        } else {
          // If request was verifying or rejected, update it
          await db.query(
            "UPDATE authentication_requests SET name = $1, contact = $2, password = $3, verification_code = NULL, status = 'pending' WHERE email = $4",
            [name, contact, hashedPassword, email]
          );
        }
      } else {
        // Store request in database
        await db.query(
          "INSERT INTO authentication_requests (name, email, contact, password, status) VALUES ($1, $2, $3, $4, 'pending')",
          [name, email, contact, hashedPassword]
        );
      }

      // Fetch the created request for ID (for direct email action links)
      const freshReq = await db.query('SELECT * FROM authentication_requests WHERE email = $1', [email]);
      const newRequest = freshReq.rows[0];

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
        requiresVerification: false,
        message: 'Your authentication request has been sent successfully. Please wait for admin approval.'
      });
    }
  } catch (err) {
    console.error('Error handling auth request:', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 1.5. Confirm Verification Code (Direct Auto-Approval for DDU Students)
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required.' });
  }

  try {
    // Find requests with status 'verifying' matching email
    const reqRes = await db.query(
      "SELECT * FROM authentication_requests WHERE email = $1 AND status = 'verifying'",
      [email]
    );

    if (reqRes.rows.length === 0) {
      return res.status(400).json({ message: 'No pending email verification request found for this email.' });
    }

    const request = reqRes.rows[0];

    // Check code
    if (request.verification_code !== code) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // Direct Approval: Start Transaction
    await db.query('BEGIN');
    try {
      // 1. Insert into users
      const userInsert = await db.query(
        "INSERT INTO users (name, email, contact, password, role, status) VALUES ($1, $2, $3, $4, 'user', 'approved') RETURNING *",
        [request.name, request.email, request.contact, request.password]
      );

      // 2. Mark request as approved
      await db.query(
        "UPDATE authentication_requests SET status = 'approved', verification_code = NULL WHERE id = $1",
        [request.id]
      );

      await db.query('COMMIT');
      
      const user = userInsert.rows[0];

      // Generate JWT immediately for auto-login
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: 'Account successfully verified and activated.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          contact: user.contact
        }
      });
    } catch (txErr) {
      await db.query('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    console.error('Error in code verification:', err.message);
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
