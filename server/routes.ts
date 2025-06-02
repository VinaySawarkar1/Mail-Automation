import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import nodemailer from "nodemailer";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertTemplateSchema, insertScheduledEmailSchema, type User } from "@shared/schema";

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    user: User;
  }
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'mail-automation-secret-key-dev',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'mail-automation-session'
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionMiddleware);

  // Initialize admin user
  await storage.initializeAdminUser();

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  const requireApproved = (req: any, res: any, next: any) => {
    if (!req.session?.user || req.session.user.approvalStatus !== 'approved') {
      return res.status(403).json({ message: "Account approval required" });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const { confirmPassword, ...userToCreate } = userData;

      const user = await storage.createUser({
        ...userToCreate,
        approvalStatus: 'pending',
        role: 'user'
      });

      res.status(201).json({ message: "Registration successful", user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const user = await storage.verifyPassword(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).user = user;
      res.json({ user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if ((req.session as any).user) {
      res.json({ user: (req.session as any).user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Forgot password route
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account with this email exists, a reset link has been sent." });
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substr(2, 32) + Date.now().toString(36);
      const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      // Store reset token
      await storage.setPasswordResetToken(user.id, resetToken, resetExpiry);

      // Send password reset email
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.ADMIN_EMAIL || 'your-admin-email@gmail.com',
            pass: process.env.ADMIN_EMAIL_PASSWORD || 'your-admin-password'
          }
        });

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        
        const mailOptions = {
          from: process.env.ADMIN_EMAIL || 'your-admin-email@gmail.com',
          to: email,
          subject: 'Password Reset - Mail Automation Platform',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>You have requested to reset your password for Mail Automation Platform.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #E55050; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to: ${email}`);
      } catch (emailError: any) {
        console.error('Failed to send password reset email:', emailError.message);
        // Continue anyway, don't reveal email sending failed
      }

      res.json({ message: "If an account with this email exists, a reset link has been sent." });
    } catch (error: any) {
      console.error('Forgot password error:', error.message);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  // Reset password route
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Verify reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Update password
      await storage.updateUserPassword(user.id, newPassword);
      
      // Clear reset token
      await storage.clearPasswordResetToken(user.id);

      res.json({ message: "Password has been reset successfully. You can now login with your new password." });
    } catch (error: any) {
      console.error('Reset password error:', error.message);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  // User management routes (admin only)
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/admin/users/:id/approval', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await storage.updateUserApprovalStatus(id, status);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = (req.session as any).user;

      // Prevent admin from deleting themselves
      if (id === currentUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Template routes
  app.get('/api/templates', requireAuth, requireApproved, async (req, res) => {
    try {
      const user = (req.session as any).user;
      const templates = await storage.getTemplatesByUserId(user.id);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/templates', requireAuth, requireApproved, async (req, res) => {
    try {
      const user = (req.session as any).user;
      const templateData = insertTemplateSchema.parse({
        ...req.body,
        userId: user.id
      });

      const template = await storage.createTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/templates/:id', requireAuth, requireApproved, async (req, res) => {
    try {
      const user = (req.session as any).user;
      const template = await storage.getTemplate(req.params.id);
      if (!template || template.userId !== user.id) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Scheduled email routes
  app.post('/api/scheduled-emails', requireAuth, requireApproved, async (req, res) => {
    try {
      const user = (req.session as any).user;
      const emailData = insertScheduledEmailSchema.parse({
        ...req.body,
        userId: user.id
      });

      const email = await storage.createScheduledEmail(emailData);
      res.status(201).json(email);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/scheduled-emails', requireAuth, requireApproved, async (req, res) => {
    try {
      const user = (req.session as any).user;
      const emails = await storage.getScheduledEmailsByUserId(user.id);
      res.json(emails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // File upload routes
  app.post('/api/upload/excel', requireAuth, requireApproved, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Here you would process the Excel file
      // For now, we'll just return success
      const fileInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      };

      res.json({ message: "File uploaded successfully", file: fileInfo });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/upload/image', requireAuth, requireApproved, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const fileInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      };

      res.json({ message: "Image uploaded successfully", image: fileInfo });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/upload/attachments', requireAuth, requireApproved, upload.array('attachments', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const files = (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`
      }));

      res.json({ message: "Files uploaded successfully", files });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    requireAuth(req, res, next);
  });

  // Real email sending routes
  app.post('/api/emails/simulate-send', requireAuth, requireApproved, async (req, res) => {
    try {
      const { validEmails, emailData } = req.body;

      if (!validEmails || !Array.isArray(validEmails)) {
        return res.status(400).json({ message: "Invalid email list provided" });
      }

      if (validEmails.length === 0) {
        return res.status(400).json({ message: "No emails to send" });
      }

      // Validate required email data
      if (!emailData || !emailData.senderEmail || !emailData.subject || !emailData.senderPassword) {
        return res.status(400).json({ message: "Missing required email configuration (email, password, subject)" });
      }

      console.log(`Starting email send to ${validEmails.length} recipients...`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`Sender: ${emailData.senderEmail}`);

      // Create transporter for Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailData.senderEmail,
          pass: emailData.senderPassword
        }
      });

      // Verify transporter configuration
      try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
      } catch (verifyError: any) {
        console.error('SMTP verification failed:', verifyError.message);
        return res.status(400).json({ 
          message: "Email configuration invalid. Please check your email and password.",
          error: verifyError.message
        });
      }

      const totalEmails = validEmails.length;
      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Create email HTML content
      const htmlContent = `
        <div style="font-family: ${emailData.fontFamily || 'Times New Roman'}, serif;">
          ${emailData.bodyPart1 ? `<div>${emailData.bodyPart1.replace(/\n/g, '<br>')}</div>` : ''}
          ${emailData.bodyFooter ? `<div style="margin-top: 20px;">${emailData.bodyFooter.replace(/\n/g, '<br>')}</div>` : ''}
        </div>
      `;

      // Handle BCC/CC based on configuration
      const bccCcCount = emailData.bccCcCount || 0;
      const bccCcType = emailData.bccCcType || 'BCC';

      if (bccCcCount > 0 && bccCcCount < validEmails.length) {
        // Send emails in batches with specified number of recipients in BCC/CC
        for (let i = 0; i < validEmails.length; i += bccCcCount) {
          const batch = validEmails.slice(i, i + bccCcCount);

          try {
            const mailOptions: any = {
              from: emailData.senderEmail,
              to: emailData.senderEmail, // Send to self when using BCC/CC
              subject: emailData.subject,
              html: htmlContent,
              text: `${emailData.bodyPart1 || ''}\n\n${emailData.bodyFooter || ''}`
            };

            // Add CC or BCC addresses
            if (bccCcType === 'BCC') {
              mailOptions.bcc = batch.join(', ');
            } else {
              mailOptions.cc = batch.join(', ');
            }

            // Add single CC/BCC if specified
            if (emailData.ccAddress) {
              mailOptions.cc = mailOptions.cc ? `${mailOptions.cc}, ${emailData.ccAddress}` : emailData.ccAddress;
            }
            if (emailData.bccAddress) {
              mailOptions.bcc = mailOptions.bcc ? `${mailOptions.bcc}, ${emailData.bccAddress}` : emailData.bccAddress;
            }

            await transporter.sendMail(mailOptions);
            sentCount += batch.length;
            console.log(`Email sent successfully to ${batch.length} recipients via ${bccCcType}: ${batch.join(', ')}`);

            // Add delay between batches
            if (i + bccCcCount < validEmails.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error: any) {
            failedCount += batch.length;
            const errorMsg = `Failed to send batch to ${batch.join(', ')}: ${error.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      } else {
        // Send individual emails to each recipient
        const batchSize = 5;
        for (let i = 0; i < validEmails.length; i += batchSize) {
          const batch = validEmails.slice(i, i + batchSize);

          const batchPromises = batch.map(async (email) => {
            try {
              const mailOptions = {
                from: emailData.senderEmail,
                to: email,
                cc: emailData.ccAddress || undefined,
                bcc: emailData.bccAddress || undefined,
                subject: emailData.subject,
                html: htmlContent,
                text: `${emailData.bodyPart1 || ''}\n\n${emailData.bodyFooter || ''}`
              };

              await transporter.sendMail(mailOptions);
              sentCount++;
              console.log(`Email sent successfully to: ${email}`);
              return { success: true, email };
            } catch (error: any) {
              failedCount++;
              const errorMsg = `Failed to send to ${email}: ${error.message}`;
              console.error(errorMsg);
              errors.push(errorMsg);
              return { success: false, email, error: error.message };
            }
          });

          await Promise.all(batchPromises);

          // Add delay between batches to respect rate limits
          if (i + batchSize < validEmails.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      const results = {
        totalEmails,
        sentCount,
        failedCount,
        status: 'completed',
        message: `Email sending completed: ${sentCount} sent, ${failedCount} failed`,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined // Limit error messages
      };

      console.log(`Email sending completed: ${sentCount} sent, ${failedCount} failed out of ${totalEmails} total`);

      res.json({
        success: true,
        message: "Email sending completed!",
        sentCount,
        failedCount,
        totalEmails: validEmails.length,
        data: {
          sent: sentCount,
          failed: failedCount,
          total: validEmails.length
        }
      });
    } catch (error: any) {
      console.error('Email sending error:', error);
      res.status(500).json({ message: `Email sending failed: ${error.message}` });
    }
  });

  // Scheduled email processor
  const processScheduledEmails = async () => {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

      // Get all pending scheduled emails
      const scheduledEmailsFile = path.join(process.cwd(), 'data', 'scheduled_emails.json');
      let scheduledEmails = [];

      try {
        const data = await fs.readFile(scheduledEmailsFile, 'utf-8');
        scheduledEmails = JSON.parse(data);
      } catch (error) {
        // File doesn't exist or is empty
        return;
      }

      const emailsToSend = scheduledEmails.filter((email: any) => 
        email.status === 'pending' && 
        email.scheduledDate <= currentDate &&
        (email.scheduledDate < currentDate || email.scheduledTime <= currentTime)
      );

      for (const email of emailsToSend) {
        try {
          console.log(`Processing scheduled email: ${email.subject} for user ${email.userId}`);

          // Mark as processing
          email.status = 'processing';
          await fs.writeFile(scheduledEmailsFile, JSON.stringify(scheduledEmails, null, 2));

          // Get user data to access sender credentials (in a real app, you'd store this securely)
          const user = await storage.getUserById(email.userId);
          if (!user) {
            throw new Error('User not found for scheduled email');
          }

          // For scheduled emails, you would need to store the recipient list and sender credentials
          // This is a simplified implementation - in production, you'd store this data securely
          console.log(`Would send scheduled email: ${email.subject} for user ${user.username}`);
          
          email.status = 'sent';
          email.sentAt = new Date().toISOString();

          console.log(`Scheduled email processed: ${email.subject}`);
        } catch (error: any) {
          console.error(`Failed to send scheduled email ${email.id}:`, error.message);
          email.status = 'failed';
          email.errorMessage = error.message;
        }
      }

      if (emailsToSend.length > 0) {
        await fs.writeFile(scheduledEmailsFile, JSON.stringify(scheduledEmails, null, 2));
      }
    } catch (error: any) {
      console.error('Error processing scheduled emails:', error.message);
    }
  };

  // Run scheduled email processor every minute
  setInterval(processScheduledEmails, 60000);

  // Password reset request endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await storage.getUserByUsername(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
      }

      // Generate reset token (in production, store this securely)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Create transporter for sending emails
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'your-email@gmail.com', // You'll need to provide this
          pass: 'your-app-password' // You'll need to provide this
        }
      });

      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Mail Automation account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #E55050; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Failed to send reset email' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}