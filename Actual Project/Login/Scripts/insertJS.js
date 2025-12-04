var express1 = require('express');
var app = express1();
var con = require('../../ServerConnection.js');
const multer = require('multer');
const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables from secret.env file
require('dotenv').config({ path: path.join(__dirname, '../../secret.env') });

// Debug: Verify environment variables are loaded
console.log('🔍 Loading environment from:', path.join(__dirname, '../../secret.env'));
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Loaded' : '❌ Missing');
console.log('🔐 EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Loaded' : '❌ Missing');

const fs = require('fs');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../User/views'));

// Paths
const parentDir = path.join(__dirname, '..');
const rootDir = path.join(__dirname, '../..')
const homePageDir = path.join(rootDir, 'Home Page');




app.use(express1.static(parentDir));
app.use('/uploads', express1.static(path.join(rootDir, 'uploads')));
app.use('/User/Scripts', express1.static(path.join(rootDir, 'User/Scripts')));
app.use('/User/CSS', express1.static(path.join(rootDir, 'User/CSS')));
app.use('/User', express1.static(path.join(rootDir, 'User')));


app.use('/Admin Page', express1.static(path.join(rootDir, 'Admin Page')));
app.use('/Home Page', express1.static(path.join(rootDir, 'Home Page')));








// Updated cache control middleware
app.use((req, res, next) => {
    // Only prevent caching for HTML pages and sensitive routes, NOT for CSS/JS/images
    if (req.url.includes('/admin-dashboard') ||
        req.url.includes('/login') ||
        req.url.includes('/adminLogin') ||
        req.url.includes('/get-admin-settings') ||
        req.url.includes('/update-') ||
        req.url.endsWith('.html') ||
        req.url.includes('/admin-chat/') ||
        req.url.includes('/send-chat-message')) {


        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    } else if (req.url.endsWith('.css') || req.url.endsWith('.js') || req.url.endsWith('.png') || req.url.endsWith('.jpg') || req.url.endsWith('.ico')) {
        // Allow caching for static assets
        res.set('Cache-Control', 'public, max-age=3600');
    }
    next();
});

// Admin notification sender function
function createNotification(complaintId, message, type = 'system') {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO complaint_notifications (complaint_id, message, type, created_at, is_read) VALUES (?, ?, ?, NOW(), 0)";

        con.query(sql, [complaintId, message, type], function(err, result) {
            if (err) {
                console.error("Error creating notification:", err);
                reject(err);
            } else {
                console.log("Notification created successfully:", result);
                resolve(result);
            }
        });
    });
}





const session = require('express-session');

// Nodemailer for sending emails (Alternative to EmailJS)
const nodemailer = require('nodemailer');

// Create transporter for sending emails with explicit configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration on startup
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Email configuration error:', error.message);
        console.log('📧 Please check your EMAIL_USER and EMAIL_PASS in the .env file');
        console.log('🔐 Make sure you:');
        console.log('   1. Enabled 2-Step Verification on Gmail');
        console.log('   2. Generated an App Password (not your regular password)');
        console.log('   3. Used the App Password in .env file without spaces');
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

app.use(session({
    secret: 'your_secure_random_string_here',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

;






















// Admin login route
app.post('/adminLogin', function(req, res) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const district_name = req.body.district_name;
    
    // Check if admin already exists by username OR email
    con.query('SELECT * FROM admins WHERE username = ? OR email = ?', [username, email], function(err, results) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                success: false,
                message: "Database error during login"
            });
        }

        // If admin exists, try to log in
        if (results.length > 0) {
            const admin = results[0];
            
            // Compare password with hashed password in database
            bcrypt.compare(password, admin.password, function(err, isMatch) {
                if (err) {
                    console.error("Password comparison error:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Error verifying password"
                    });
                }

                if (!isMatch) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid username or password"
                    });
                }

                // Password is correct, set session data
                req.session.adminId = admin.adminid;
                req.session.adminUsername = admin.username;
                req.session.adminEmail = admin.email;
                req.session.district = admin.district_name;

                // Send success response
                res.json({
                    success: true,
                    message: "Login successful",
                    redirect: "/admin-dashboard"
                });
            });
        } 

        else if (username && email && password && district_name) {
            const createdAT = new Date();
            
            // Check if username already exists (double check to prevent race conditions)
            con.query('SELECT * FROM admins WHERE username = ?', [username], function(checkErr, checkResults) {
                if (checkErr) {
                    console.error("Database error:", checkErr);
                    return res.status(500).json({
                        success: false,
                        message: "Database error during registration"
                    });
                }
                
                if (checkResults.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: "Username already exists. Please choose a different username."
                    });
                }
                
                // Hash the password before storing it
                bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
                    if (err) {
                        console.error("Password hashing error:", err);
                        return res.status(500).json({
                            success: false,
                            message: "Error processing your request"
                        });
                    }
                    
                    var sql = "INSERT INTO admins(username, email, password, fullName, created_at, district_name) VALUES ?";
                    var values = [
                        [username, email, hashedPassword, null, createdAT, district_name]
                    ];

                    con.query(sql, [values], function(err, result){
                        if (err) {
                            console.error("Error inserting admin data:", err);
                            return res.status(500).json({
                                success: false,
                                message: "Error inserting data into the database."
                            });
                        } 
                        
                        console.log("Admin registered:", result);
                        
                        // Store admin info in session
                        req.session.adminId = result.insertId;
                        req.session.adminUsername = username;
                        req.session.adminEmail = email;
                        req.session.district = district_name;
                        

                        res.json({
                            success: true,
                            message: "Admin registration successful!",
                            redirect: "/admin-dashboard"
                        });
                    });
                });
            });
        } else {
            // Incomplete registration data
            return res.status(400).json({
                success: false,
                message: "Missing required fields for registration"
            });
        }
    });
});

// Route to serve admin dashboard with complaints data
app.get('/admin-dashboard', function(req, res) {
    console.log("Admin dashboard accessed with session:", req.session);

    // Check if admin is logged in
    if (!req.session.adminId) {
        console.log("Unauthorized access attempt to admin dashboard");
        return res.redirect('/adminLogin');
    }

    // Get admin username for filtering complaints
    const adminUsername = req.session.adminUsername;

    // Fetch admin data
    const adminQuery = 'SELECT * FROM admins WHERE adminid = ?';

    // FIXED: Use the same query structure as get-admin-cases
    const complaintsQuery = `
        SELECT 
            c.complaint_id,
            c.username as complainant_username,
            COALESCE(u.fullName, 'N/A') as complainant_fullname,
            COALESCE(c.complaint_type, 'General') as complaint_type,
            c.created_at,
            c.status,
            COALESCE(c.description, '') as description,
            COALESCE(c.location_address, '') as location_address,
            COALESCE(ac.last_updated, c.created_at) as last_updated
        FROM complaint c 
        INNER JOIN users u ON c.username = u.username
        LEFT JOIN admin_cases ac ON c.complaint_id = ac.complaint_id AND ac.admin_username = ?
        WHERE c.admin_username = ?
        ORDER BY c.created_at DESC
    `;

    // Fetch users who have complained under this admin
    const usersQuery = `
        SELECT DISTINCT 
            u.username,
            u.fullName,
            u.email,
            u.phone,
            u.location,
            u.age
        FROM users u 
        INNER JOIN complaint c ON u.username = c.username 
        WHERE c.admin_username = ?
        ORDER BY u.fullName ASC
    `;

    con.query(adminQuery, [req.session.adminId], function(err, adminResults) {
        if (err) {
            console.error("Error fetching admin data:", err);
            return res.status(500).send("Error fetching admin data");
        }

        if (adminResults.length === 0) {
            console.log("Admin not found in database");
            req.session.destroy();
            return res.redirect('/adminLogin');
        }

        // Fetch complaints with the same structure as the AJAX endpoint
        con.query(complaintsQuery, [adminUsername, adminUsername], function(err, complaintsResults) {
            if (err) {
                console.error("Error fetching complaints:", err);
                return res.status(500).send("Error fetching complaints");
            }

            // Process results to ensure consistency
            const processedComplaints = complaintsResults.map(complaint => ({
                complaint_id: complaint.complaint_id,
                username: complaint.complainant_username, // For backward compatibility
                complainant_username: complaint.complainant_username,
                complainant_fullname: complaint.complainant_fullname,
                complaint_type: complaint.complaint_type,
                created_at: complaint.created_at,
                status: complaint.status,
                description: complaint.description,
                location_address: complaint.location_address,
                last_updated: complaint.last_updated
            }));

            // Fetch users
            con.query(usersQuery, [adminUsername], function(err, usersResults) {
                if (err) {
                    console.error("Error fetching users:", err);
                    return res.status(500).send("Error fetching users");
                }

                // Set security headers
                res.set({
                    'X-Frame-Options': 'DENY',
                    'X-Content-Type-Options': 'nosniff',
                    'X-XSS-Protection': '1; mode=block',
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                });

                // Render admin dashboard with all data
                res.render('admin-page', {
                    admin: adminResults[0],
                    complaints: processedComplaints,
                    users: usersResults
                });
            });
        });
    });
});



// Get admin settings
app.get('/get-admin-settings', function(req, res) {
    if (!req.session.adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const adminUsername = req.session.adminUsername;

    con.query('SELECT * FROM admin_settings WHERE admin_username = ?', [adminUsername], function(err, results) {
        if (err) {
            console.error("Error fetching admin settings:", err);
            return res.status(500).json({ success: false, message: "Error fetching settings" });
        }

        if (results.length === 0) {
            // Create default settings if none exist
            const defaultSettings = {
                dark_mode: false,
                email_notifications: true
            };

            con.query('INSERT INTO admin_settings (admin_username, dark_mode, email_notifications) VALUES (?, ?, ?)',
                [adminUsername, defaultSettings.dark_mode, defaultSettings.email_notifications],
                function(insertErr, insertResult) {
                    if (insertErr) {
                        console.error("Error creating default settings:", insertErr);
                        return res.status(500).json({ success: false, message: "Error creating settings" });
                    }
                    res.json({ success: true, settings: defaultSettings });
                });
        } else {
            res.json({ success: true, settings: results[0] });
        }
    });
});

// Update admin settings
app.post('/update-admin-settings', function(req, res) {
    if (!req.session.adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const adminUsername = req.session.adminUsername;
    const { dark_mode, email_notifications } = req.body;

    const sql = `
        INSERT INTO admin_settings (admin_username, dark_mode, email_notifications) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
        dark_mode = VALUES(dark_mode), 
        email_notifications = VALUES(email_notifications),
        updated_at = CURRENT_TIMESTAMP
    `;

    con.query(sql, [adminUsername, dark_mode, email_notifications], function(err, result) {
        if (err) {
            console.error("Error updating admin settings:", err);
            return res.status(500).json({ success: false, message: "Error updating settings" });
        }

        res.json({ success: true, message: "Settings updated successfully" });
    });
});







































// Route to update admin profile
app.post('/update-admin-profile', function(req, res) {
    // Check if admin is logged in
    if (!req.session.adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    console.log("Update admin profile request received:", req.body);
    const { fullName, dob } = req.body;

    // Update query
    const sql = "UPDATE admins SET fullName = ?, dob = ? WHERE adminid = ?";

    con.query(sql, [fullName, dob, req.session.adminId], function(err, result) {
        if (err) {
            console.error("Error updating admin profile:", err);
            return res.status(500).json({ success: false, message: "Error updating profile: " + err.message });
        }

        console.log("Update result:", result);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "No admin updated - check admin ID" });
        }
        return res.json({ success: true, message: "Profile updated successfully" });
    });
});


// Admin: Get chat messages for a complaint
app.get('/admin-chat/:complaintId', function(req, res) {


    if (!req.session.adminId) {
        console.log('Authentication failed - no adminId in session');
        return res.status(401).json({
            success: false,
            message: "Please log in as admin"
        });
    }

    const complaintId = req.params.complaintId;
    const adminUsername = req.session.adminUsername;

    console.log('Processing request with:', { complaintId, adminUsername });


    con.query('SELECT admin_username FROM complaint WHERE complaint_id = ?', [complaintId], function(err, results) {
        if (err) {
            console.error("Database error in complaint verification:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        console.log('Complaint verification results:', results);

        if (results.length === 0) {
            console.log('No complaint found with ID:', complaintId);
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        if (results[0].admin_username !== adminUsername) {
            console.log('Access denied - complaint assigned to:', results[0].admin_username, 'but requesting admin is:', adminUsername);
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        console.log('Complaint verification passed, fetching messages...');

        // Get chat messages
        const query = `
            SELECT * FROM complaint_chat 
            WHERE complaint_id = ? 
            ORDER BY sent_at ASC
        `;

        con.query(query, [complaintId], function(err, messages) {
            if (err) {
                console.error("Database error fetching messages:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error fetching messages"
                });
            }

            console.log('Found messages:', messages.length);
            console.log('Messages data:', messages);

            res.json({
                success: true,
                messages: messages
            });
        });
    });
});


// Admin: Send chat message
app.post('/admin-send-chat-message', function(req, res) {


    if (!req.session.adminId) {
        console.log('Authentication failed - no adminId in session');
        return res.status(401).json({
            success: false,
            message: "Please log in as admin"
        });
    }

    const { complaintId, message, senderType } = req.body;
    const adminUsername = req.session.adminUsername;

    console.log('Extracted values:', {
        complaintId: complaintId,
        complaintId_type: typeof complaintId,
        message: message ? message.substring(0, 50) + '...' : message,
        message_type: typeof message,
        senderType: senderType,
        adminUsername: adminUsername
    });

    // Validate required fields
    if (!complaintId || !message || !message.trim()) {
        console.log('Validation failed:', {
            complaintId_exists: !!complaintId,
            message_exists: !!message,
            message_trimmed: message ? !!message.trim() : false,
            senderType: senderType
        });
        return res.status(400).json({
            success: false,
            message: "Missing required fields: complaintId and message"
        });
    }

    // Check Duplicate
    const duplicateCheckQuery = `
        SELECT COUNT(*) as count 
        FROM complaint_chat 
        WHERE complaint_id = ? 
        AND sender_username = ? 
        AND sender_type = 'admin'
        AND message = ? 
        AND sent_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)
    `;

    con.query(duplicateCheckQuery, [complaintId, adminUsername, message.trim()], function(err, duplicateResults) {
        if (err) {
            console.error("Error checking for duplicates:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (duplicateResults[0].count > 0) {
            console.log('Duplicate message detected, rejecting...');
            return res.status(429).json({
                success: false,
                message: "Duplicate message detected. Please wait before sending the same message again."
            });
        }

        console.log('Validation passed, verifying complaint assignment...');


        con.query('SELECT admin_username FROM complaint WHERE complaint_id = ?', [complaintId], function(err, results) {
            if (err) {
                console.error("Database error in complaint verification:", err);
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            console.log('Complaint verification results:', results);

            if (results.length === 0) {
                console.log('No complaint found with ID:', complaintId);
                return res.status(404).json({
                    success: false,
                    message: "Complaint not found"
                });
            }

            if (results[0].admin_username !== adminUsername) {
                console.log('Access denied - complaint assigned to:', results[0].admin_username, 'but requesting admin is:', adminUsername);
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }

            console.log('Complaint verification passed, inserting message...');

            // Insert chat message
            const query = `
                INSERT INTO complaint_chat (complaint_id, sender_type, sender_username, message, sent_at) 
                VALUES (?, 'admin', ?, ?, NOW())
            `;

            con.query(query, [complaintId, adminUsername, message.trim()], async function(err, result) {
                if (err) {
                    console.error("Database error inserting message:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Error sending message"
                    });
                }

                console.log('Message inserted successfully:', result);

                try {

                    await createNotification(complaintId, `New message from admin regarding complaint #${complaintId}`, 'admin_comment');
                    console.log('Notification created successfully');

                    res.json({
                        success: true,
                        message: "Message sent successfully"
                    });
                } catch (notificationError) {
                    console.error("Error creating notification:", notificationError);

                    res.json({
                        success: true,
                        message: "Message sent successfully (notification error logged)"
                    });
                }
            });
        });
    });
});

























// Route to get evidence for a complaint
app.get('/get-complaint-evidence/:complaintId', function(req, res) {
    // Check if admin is logged in
    if (!req.session.adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const complaintId = req.params.complaintId;
    const adminUsername = req.session.adminUsername;


    const verifyQuery = "SELECT * FROM complaint WHERE complaint_id = ? AND admin_username = ?";

    con.query(verifyQuery, [complaintId, adminUsername], function(err, complaintResults) {
        if (err) {
            console.error("Error verifying complaint:", err);
            return res.status(500).json({ success: false, message: "Error verifying complaint" });
        }

        if (complaintResults.length === 0) {
            return res.status(404).json({ success: false, message: "Complaint not found or unauthorized" });
        }

        // Get evidence for this complaint
        const evidenceQuery = "SELECT * FROM evidence WHERE complaint_id = ?";

        con.query(evidenceQuery, [complaintId], function(err, evidenceResults) {
            if (err) {
                console.error("Error fetching evidence:", err);
                return res.status(500).json({ success: false, message: "Error fetching evidence" });
            }


            const processedEvidence = evidenceResults.map(evidence => {
                let processedFilePath = evidence.file_path;


                if (processedFilePath.includes('\\') || processedFilePath.includes(':/') || processedFilePath.startsWith('/')) {

                    const filename = path.basename(processedFilePath);
                    const fileExtension = filename.split('.').pop().toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExtension);
                    const isAudio = ['mp3', 'wav', 'ogg', 'aac'].includes(fileExtension);

                    // Determine the correct subdirectory
                    if (isImage) {
                        processedFilePath = `images/${filename}`;
                    } else if (isVideo) {
                        processedFilePath = `videos/${filename}`;
                    } else if (isAudio) {
                        processedFilePath = `audio/${filename}`;
                    } else {
                        processedFilePath = filename;
                    }
                }

                return {
                    ...evidence,
                    file_path: processedFilePath
                };
            });

            res.json({
                success: true,
                evidence: processedEvidence,
                complaint: complaintResults[0]
            });
        });
    });
});




app.get('/get-admin-cases', function(req, res) {
    // Check if admin is logged in
    if (!req.session.adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const adminUsername = req.session.adminUsername;
    const { username, dateFrom, dateTo } = req.query;

    console.log("Fetching cases with filters:", { username, dateFrom, dateTo, adminUsername });


    let casesQuery = `
        SELECT 
            c.complaint_id,
            c.username as complainant_username,
            COALESCE(u.fullName, 'N/A') as complainant_fullname,
            COALESCE(c.complaint_type, 'General') as complaint_type,
            c.created_at,
            c.status,
            COALESCE(c.description, '') as description,
            COALESCE(c.location_address, '') as location_address,
            COALESCE(ac.last_updated, c.created_at) as last_updated
        FROM complaint c 
        INNER JOIN users u ON c.username = u.username
        LEFT JOIN admin_cases ac ON c.complaint_id = ac.complaint_id AND ac.admin_username = ?
        WHERE c.admin_username = ?
    `;

    const queryParams = [adminUsername, adminUsername];


    if (username && username.trim() !== '') {
        casesQuery += ' AND (LOWER(c.username) LIKE LOWER(?) OR LOWER(COALESCE(u.fullName, "")) LIKE LOWER(?))';
        const searchTerm = `%${username.trim()}%`;
        queryParams.push(searchTerm, searchTerm);
    }

    // Date filtering with proper format handling
    if (dateFrom && dateFrom.trim() !== '') {
        casesQuery += ' AND DATE(c.created_at) >= ?';
        queryParams.push(dateFrom);
    }

    if (dateTo && dateTo.trim() !== '') {
        casesQuery += ' AND DATE(c.created_at) <= ?';
        queryParams.push(dateTo);
    }

    casesQuery += ' ORDER BY c.created_at DESC';

    console.log("Executing query:", casesQuery);
    console.log("With parameters:", queryParams);

    con.query(casesQuery, queryParams, function(err, results) {
        if (err) {
            console.error("Error fetching cases:", err);
            return res.status(500).json({ success: false, message: "Error fetching cases: " + err.message });
        }

        console.log("Cases found:", results.length);

        // Debug: Log first few results to check data
        if (results.length > 0) {
            console.log("Sample case data:", results[0]);
        }

        // Ensure all required fields are present
        const processedResults = results.map(case_item => ({
            complaint_id: case_item.complaint_id,
            complainant_username: case_item.complainant_username || 'Unknown',
            complainant_fullname: case_item.complainant_fullname || 'N/A',
            complaint_type: case_item.complaint_type || 'General',
            created_at: case_item.created_at,
            status: case_item.status || 'pending',
            description: case_item.description || '',
            location_address: case_item.location_address || '',
            last_updated: case_item.last_updated
        }));

        // Group by status for analytics
        const analytics = {
            total: processedResults.length,
            pending: processedResults.filter(c => c.status === 'pending').length,
            verifying: processedResults.filter(c => c.status === 'verifying').length,
            investigating: processedResults.filter(c => c.status === 'investigating').length,
            resolved: processedResults.filter(c => c.status === 'resolved').length
        };

        res.json({
            success: true,
            cases: processedResults,
            analytics: analytics
        });
    });
});




















// Admin: Update complaint status
app.post('/update-complaint-status', function(req, res) {
    console.log('Status update request:', req.body);
    console.log('Session:', req.session);

    if (!req.session.adminId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }


    const { complaintId, newStatus } = req.body;
    const adminUsername = req.session.adminUsername;


    const complaint_id = complaintId;
    const status = newStatus;


    if (!complaint_id || !status) {
        console.log('Missing required fields:', { complaint_id, status });
        return res.status(400).json({
            success: false,
            message: "Missing required fields: complaint_id and status"
        });
    }

    // Convert complaint_id to integer to ensure it's valid
    const complaintIdInt = parseInt(complaint_id);
    if (isNaN(complaintIdInt)) {
        return res.status(400).json({
            success: false,
            message: "Invalid complaint_id format"
        });
    }

    console.log('Updating complaint status:', { complaint_id: complaintIdInt, status, adminUsername });

    // Verify the complaint is assigned to this admin
    con.query('SELECT admin_username FROM complaint WHERE complaint_id = ?', [complaintIdInt], function(err, results) {
        if (err) {
            console.error("Error verifying complaint:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        if (results[0].admin_username !== adminUsername) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Start transaction
        con.beginTransaction(function(err) {
            if (err) {
                console.error('Transaction start error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            // Update complaint status
            const updateComplaintQuery = 'UPDATE complaint SET status = ? WHERE complaint_id = ?';
            con.query(updateComplaintQuery, [status, complaintIdInt], function(err, result) {
                if (err) {
                    console.error('Error updating complaint status:', err);
                    return con.rollback(function() {
                        res.status(500).json({ success: false, message: 'Error updating complaint status' });
                    });
                }

                // Insert status update record (without remarks)
                const statusUpdateQuery = 'INSERT INTO status_updates (complaint_id, status, updated_by, updated_at) VALUES (?, ?, ?, NOW())';
                con.query(statusUpdateQuery, [complaintIdInt, status, adminUsername], function(err, statusResult) {
                    if (err) {
                        console.error('Error inserting status update:', err);
                        return con.rollback(function() {
                            res.status(500).json({ success: false, message: 'Error recording status update' });
                        });
                    }


                    const adminCasesQuery = `
                        INSERT INTO admin_cases (complaint_id, admin_username, complainant_username, status, last_updated) 
                        SELECT ?, ?, c.username, ?, NOW()
                        FROM complaint c 
                        WHERE c.complaint_id = ?
                        ON DUPLICATE KEY UPDATE 
                        status = VALUES(status), 
                        last_updated = VALUES(last_updated)
                    `;

                    con.query(adminCasesQuery, [complaintIdInt, adminUsername, status, complaintIdInt], function(err, adminCaseResult) {
                        if (err) {
                            console.error('Error updating admin cases:', err);
                            return con.rollback(function() {
                                res.status(500).json({ success: false, message: 'Error updating admin case' });
                            });
                        }


                        const notificationMessage = `Your complaint #${complaintIdInt} status has been updated to: ${status.toUpperCase()}`;
                        const notificationQuery = 'INSERT INTO complaint_notifications (complaint_id, message, type, created_at) VALUES (?, ?, ?, NOW())';

                        console.log('Creating notification for complaint_id:', complaintIdInt);

                        con.query(notificationQuery, [complaintIdInt, notificationMessage, 'status_change'], function(err, notificationResult) {
                            if (err) {
                                console.error('Error creating notification:', err);

                            } else {
                                console.log('Notification created successfully:', notificationResult);
                            }

                            // Commit the transaction
                            con.commit(function(err) {
                                if (err) {
                                    console.error('Transaction commit error:', err);
                                    return con.rollback(function() {
                                        res.status(500).json({ success: false, message: 'Error committing changes' });
                                    });
                                }

                                console.log('Status update completed successfully');
                                res.json({
                                    success: true,
                                    message: 'Complaint status updated successfully'
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});





// Admin logout route
app.post('/admin-logout', function(req, res) {
    console.log("Admin logout requested");

    // Store session ID for logging
    const sessionId = req.session.id;

    req.session.destroy(function(err) {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({
                success: false,
                message: "Error logging out"
            });
        }

        console.log("Admin session destroyed successfully:", sessionId);

        // Clear the session cookie
        res.clearCookie('connect.sid');

        // Send success response
        res.json({
            success: true,
            message: "Logged out successfully"
        });
    });

});

// Add authentication check endpoint
app.get('/check-admin-auth', function(req, res) {
    if (req.session && req.session.adminId) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// Modify homepage route to show admin username
app.get('/homepage', function(req, res) {
    const isUserAuthenticated = req.session && req.session.userId ? true : false;
    const isAdminAuthenticated = req.session && req.session.adminId ? true : false;
    const username = req.session && req.session.username ? req.session.username : null;
    const adminUsername = req.session && req.session.adminUsername ? req.session.adminUsername : null;

    const homepagePath = path.join(homePageDir, 'homepage.html');

    if (!fs.existsSync(homepagePath)) {
        console.error("Homepage file not found:", homepagePath);
        return res.status(404).send("Homepage file not found");
    }

    fs.readFile(homepagePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading homepage file:", err);
            return res.status(500).send("Error loading homepage");
        }

        // Add authentication data and security measures
        const authScript = `
        <script>
            // Clear any cached authentication data first
            if (typeof window.isAuthenticated !== 'undefined') {
                delete window.isAuthenticated;
            }
            if (typeof window.currentUser !== 'undefined') {
                delete window.currentUser;
            }
            if (typeof window.isAdmin !== 'undefined') {
                delete window.isAdmin;
            }
            if (typeof window.adminUsername !== 'undefined') {
                delete window.adminUsername;
            }
            
            // Set current authentication state
            window.isAuthenticated = ${isUserAuthenticated};
            window.currentUser = ${JSON.stringify(username)};
            window.isAdmin = ${isAdminAuthenticated};
            window.adminUsername = ${JSON.stringify(adminUsername)};
            
            // Add body class for admin authentication
            if (window.isAdmin && window.adminUsername) {
                document.body.classList.add('admin-logged-in');
            }
            
            // Prevent back button abuse
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, null, window.location.href);
            }
            
            console.log('Auth variables set:', {
                isAuthenticated: window.isAuthenticated,
                currentUser: window.currentUser,
                isAdmin: window.isAdmin,
                adminUsername: window.adminUsername
            });
        </script>
        `;

        let modifiedData = data.replace('</head>', authScript + '</head>');

        // Update links
        modifiedData = modifiedData.replace(/href="\.\.\/Login\/login\.html"/g, 'href="/login"');
        modifiedData = modifiedData.replace(/href="\.\.\/Login\/adminLogin\.html"/g, 'href="/adminLogin"');

        // Add appropriate auth handlers
        if (isAdminAuthenticated) {
            modifiedData = modifiedData.replace(
                '</head>',
                '<link rel="stylesheet" href="assets/css/base/adminAuth-header.css">\n<script src="assets/js/adminAuth-handler.js"></script>\n</head>'
            );
        } else if (isUserAuthenticated) {
            modifiedData = modifiedData.replace(
                '</head>',
                '<script src="assets/js/auth-handler.js"></script>\n</head>'
            );
        }

        res.send(modifiedData);
    });
});


// serve static files from Home Page directory
app.use('/Home Page', express1.static(homePageDir));

// serve static files from assets directory within Home Page
app.use('/assets', express1.static(path.join(homePageDir, 'assets')));


// route for the contact-us page
app.get('/contact-us', function(req, res) {
    // Check if user is logged in - similar to the homepage route
    const isAuthenticated = req.session && req.session.userId ? true : false;
    const username = req.session && req.session.username ? req.session.username : null;

    // Correct path to contact-us.html
    const contactUsPath = path.join(homePageDir, 'contact-us.html');

    // Check if file exists
    if (!fs.existsSync(contactUsPath)) {
        console.error("Contact Us file not found:", contactUsPath);
        return res.status(404).send("Contact Us page not found");
    }

    fs.readFile(contactUsPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading contact-us file:", err);
            return res.status(500).send("Error loading contact-us page");
        }

        // user authentication data to be used by JavaScript
        const authScript = `
        <script>
            window.isAuthenticated = ${isAuthenticated};
            window.currentUser = ${JSON.stringify(username)};
        </script>
        `;

        // Insert the script right before the closing </head> tag
        const modifiedData = data.replace('</head>', authScript + '</head>\n<link rel="stylesheet" href="assets/css/base/auth-header.css">');

        res.send(modifiedData);
    });
});




// Route for the admin login page
app.get('/adminLogin', function(req, res) {
    // Path to adminLogin.html
    const adminLoginPath = path.join(parentDir, 'adminLogin.html');

    // Check if file exists
    if (!fs.existsSync(adminLoginPath)) {
        console.error("Admin login file not found:", adminLoginPath);
        return res.status(404).send("Admin login page not found");
    }

    fs.readFile(adminLoginPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading admin login file:", err);
            return res.status(500).send("Error loading admin login page");
        }
        res.send(data);
    });
});


app.get('/signup',function(req,res){
    res.sendFile(path.join(parentDir,'login.html'));
});

app.get('/login', function(req, res) {
    // Path to login.html in the Login folder
    const loginPath = path.join(__dirname, '../../Login/login.html');

    // Check if file exists
    if (!fs.existsSync(loginPath)) {
        console.error("Login file not found:", loginPath);
        return res.status(404).send("Login page not found");
    }

    res.sendFile(loginPath);
});

// Test email endpoint - Visit http://localhost:3000/test-email to check if email works
app.get('/test-email', function(req, res) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to yourself
        subject: '✅ SecureVoice - Email Test Successful!',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">🎉 Success!</h2>
                <p>Your email configuration is working correctly!</p>
                <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                <p style="color: #666; font-size: 12px;">SecureVoice Crime Reporting System</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('❌ Test email failed:', error.message);
            res.status(500).json({ 
                success: false, 
                error: error.message,
                message: 'Email configuration error. Check server console for details.'
            });
        } else {
            console.log('✅ Test email sent successfully:', info.response);
            res.json({ 
                success: true, 
                message: 'Test email sent successfully! Check your inbox.',
                info: info.response 
            });
        }
    });
});

// New endpoint to send OTP via email
app.post('/send-otp', function(req, res) {
    const email = req.body.email;
    
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5-minute expiration
    otpStore.set(email, {
        otp: otp,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Email content
    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'SecureVoice - Your OTP Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #21566a;">SecureVoice - Email Verification</h2>
                <p>Your OTP code is:</p>
                <h1 style="background-color: #f0f0f0; padding: 15px; text-align: center; letter-spacing: 5px; color: #21566a;">
                    ${otp}
                </h1>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="margin-top: 30px;">
                <p style="color: #666; font-size: 12px;">SecureVoice Crime Reporting System</p>
            </div>
        `
    };

    // Send email
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Email sending error:', error);
            return res.status(500).json({ 
                success: false, 
                message: "Failed to send OTP. Please check your email configuration." 
            });
        }
        
        console.log('OTP email sent:', info.response);
        res.json({ 
            success: true, 
            message: "OTP sent successfully to your email" 
        });
    });
});

// New endpoint to verify OTP
app.post('/verify-otp', function(req, res) {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const storedData = otpStore.get(email);
    
    if (!storedData) {
        return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP is valid, remove it from store
    otpStore.delete(email);
    
    res.json({ success: true, message: "OTP verified successfully" });
});


app.post('/signup',function(req,res){
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var createdAT = new Date();

    // Hash the password before storing it
    bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
        if (err) {
            console.error("Password hashing error:", err);
            return res.status(500).send("Error processing your request");
        }
        
        con.connect(function(err){
            if(err) {
                console.error("Connection error:", err);
                return res.status(500).send("Database connection error");
            }

            var sql = "INSERT INTO users(username, email, password, created_at) VALUES ?";
            var values = [
                [username, email, hashedPassword, createdAT] // Store the hashed password
            ];

            con.query(sql, [values], function(err, result){
                if (err) {
                    console.error("Error inserting data:", err);
                    res.status(500).send("Error inserting data into the database.");
                } else {
                    console.log("User registered:", result);
                    
                    // Store user info in session
                    req.session.userId = result.insertId;
                    req.session.username = username;
                    req.session.email = email;
                    
                    // Send success message with redirection flag
                    res.json({
                        success: true,
                        message: "Registration successful!"
                    });
                }
            });
        });
    });
});


//Login form submission
app.post('/login', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }

    // Query database for the user
    con.query('SELECT * FROM users WHERE username = ?', [username], function(err, results) {
        if (err) {
            console.error("Database error during login:", err);
            return res.status(500).json({
                success: false,
                message: "Database error during login"
            });
        }

        // Check if user exists
        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const user = results[0];

        //Compare password with hashed password in database
        bcrypt.compare(password, user.password, function(err, isMatch) {
            if (err) {
                console.error("Password comparison error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error verifying password"
                });
            }

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password"
                });
            }

            // Password is correct, set session data
            req.session.userId = user.userid;
            req.session.username = user.username;
            req.session.email = user.email;

            console.log("Session after login:", req.session);


            // Send success response
            res.json({
                success: true,
                message: "Login successful",
                redirect: "/profile"
            });
        });
    });
});

//Helper function to calculate age from date of birth
function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

// Add a route for the profile page
app.get('/profile', function(req, res) {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.redirect('/signup');
    }
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });


    // Fetch user data from database
    con.query('SELECT * FROM users WHERE userid = ?', [req.session.userId], function(err, results) {
        if (err) {
            console.error("Error fetching user data:", err);
            return res.status(500).send("Error fetching user data");
        }
        
        if (results.length === 0) {
            return res.status(404).send("User not found");
        }
        
        // Render profile page with user data and pass the calculateAge function
        res.render('profile', { 
            user: results[0],
            calculateAge: calculateAge 
        });
    });
});

//Update Profile
// Update user profile endpoint
app.post('/update-profile', function(req, res) {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    console.log("Update profile request received:", req.body);
    const { fullName, email, phone, location, dob } = req.body;
    

    
    // Calculate age from DOB (if needed)
    let age = null;
    if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
    }
    
    // Update query with age calculation
    const sql = "UPDATE users SET fullName = ?, phone = ?, dob = ?, location = ?, age = ? WHERE userid = ?";
    
    con.query(sql, [fullName, phone, dob, location, age, req.session.userId], function(err, result) {
        if (err) {
            console.error("Error updating profile:", err);
            return res.status(500).json({ success: false, message: "Error updating profile: " + err.message });
        }

        console.log("Update result:", result);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "No user updated - check user ID" });
        }
        return res.json({ success: true, message: "Profile updated successfully" });
    });
});
// Add this route to get user data for the edit form
app.get('/get-user-data', function(req, res) {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Fetch user data from database
    con.query('SELECT fullName, email, phone, location, dob FROM users WHERE userid = ?', [req.session.userId], function(err, results) {
        if (err) {
            console.error("Error fetching user data:", err);
            return res.status(500).json({ success: false, message: "Error fetching user data" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Return user data
        res.json({
            success: true,
            user: results[0]
        });
    });
});




// Logout endpoint
// User logout route (add this near your other logout route)
// Authentication middleware for user routes
function requireUserAuth(req, res, next) {
    if (!req.session.username) {
        // If it's an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({
                success: false,
                message: "Please log in to access this page",
                redirect: "/signup"
            });
        }
        // For regular requests, redirect to login
        return res.redirect('/signup');
    }
    next();
}


app.post('/logout', function(req, res) {
    console.log('Logout endpoint hit');
    console.log('Current session:', req.session);
    console.log('User attempting logout:', req.session.username);

    req.session.destroy(function(err) {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).json({
                success: false,
                message: "Error logging out"
            });
        }

        console.log('Session destroyed successfully');

        // Clear the session cookie
        res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            secure: false // set to true if using HTTPS
        });

        // Set headers to prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.json({
            success: true,
            message: "Logout successful"
        });
    });
});



//COMPLAIN







// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.mimetype.startsWith('image/')) {
            uploadPath = path.join(__dirname, '../../uploads/images/');
        } else if (file.mimetype.startsWith('video/')) {
            uploadPath = path.join(__dirname, '../../uploads/videos/');
        } else if (file.mimetype.startsWith('audio/')) {
            uploadPath = path.join(__dirname, '../../uploads/audio/');
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images, videos, and audio files
        if (file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/') ||
            file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});


// Route to serve complaint form
app.get('/complain', function(req, res) {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.redirect('/signup');
    }

    // Correct path: from Login/Scripts/ go up two levels, then to User/complain.html
    const complainPath = path.join(__dirname, '../../User/complain.html');

    if (!fs.existsSync(complainPath)) {
        console.error("Complaint form not found:", complainPath);
        return res.status(404).send("Complaint form not found");
    }

    fs.readFile(complainPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading complaint form:", err);
            return res.status(500).send("Error loading complaint form");
        }

        // Fix CSS and JS paths to work with your static file serving
        let modifiedData = data;

        // Update CSS path
        modifiedData = modifiedData.replace('href="CSS/complainForm.css"', 'href="/User/CSS/complainForm.css"');

        // Update JS paths
        modifiedData = modifiedData.replace('src="Scripts/creds/config.js"', 'src="/User/Scripts/creds/config.js"');
        modifiedData = modifiedData.replace('src="Scripts/complainForm.js"', 'src="/User/Scripts/complainForm.js"');

        // Add user session data to be used by JavaScript
        const authScript = `
        <script>
            window.currentUser = ${JSON.stringify(req.session.username)};
            window.isAuthenticated = true;
        </script>
        `;

        // Insert the script before closing head tag
        modifiedData = modifiedData.replace('</head>', authScript + '</head>');

        res.send(modifiedData);
    });
});

// Helper function to find admin by location using callback pattern
function findAdminByLocation(location, callback) {
    const query = `
        SELECT username, district_name FROM admins 
        WHERE district_name IS NOT NULL 
        AND LOWER(?) LIKE CONCAT('%', LOWER(district_name), '%')
        LIMIT 1
    `;

    con.query(query, [location], function(err, results) {
        if (err) {
            console.error('Error finding admin:', err);
            return callback(err, null, null);
        }

        if (results.length > 0) {
            const adminUsername = results[0].username;
            const districtName = results[0].district_name;
            callback(null, adminUsername, districtName);
        } else {
            callback(null, null, null);
        }
    });
}

// Helper function to get or create location using callback pattern
function getOrCreateLocation(locationName, districtName, callback) {
    // First, try to find existing location
    con.query(
        'SELECT location_id FROM location WHERE LOWER(location_name) = LOWER(?)',
        [locationName],
        function(err, existingLocation) {
            if (err) {
                console.error('Error checking existing location:', err);
                return callback(err, null);
            }

            if (existingLocation.length > 0) {
                return callback(null, existingLocation[0].location_id);
            }

            // If not found, create new location with the district name
            con.query(
                'INSERT INTO location (location_name, district_name) VALUES (?, ?)',
                [locationName, districtName],
                function(err, insertResult) {
                    if (err) {
                        console.error('Error creating location:', err);
                        return callback(err, null);
                    }

                    callback(null, insertResult.insertId);
                }
            );
        }
    );
}

// Helper function to get category ID using callback pattern
function getCategoryId(complaintType, callback) {
    con.query(
        'SELECT category_id FROM category WHERE LOWER(name) = LOWER(?)',
        [complaintType],
        function(err, results) {
            if (err) {
                console.error('Error getting category:', err);
                return callback(err, null);
            }

            const categoryId = results.length > 0 ? results[0].category_id : null;
            callback(null, categoryId);
        }
    );
}

// Complaint submission route
app.post('/submit-complaint', upload.array('evidence', 10), function(req, res) {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const {
        complaintType,
        description,
        incidentDate,
        location
    } = req.body;

    const username = req.session.username;

    // Validate required fields
    if (!complaintType || !description || !incidentDate || !location) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    console.log("Looking for admin for location:", location);

    // Find admin by location - now returns both admin username and district name
    findAdminByLocation(location, function(err, adminUsername, districtName) {
        if (err) {
            console.error("Error finding admin:", err);
            return res.status(500).json({
                success: false,
                message: "Error processing complaint"
            });
        }

        if (!adminUsername) {
            return res.status(400).json({
                success: false,
                message: "No authority from this district is available right now"
            });
        }

        console.log("Found admin:", adminUsername, "for district:", districtName);

        // Get or create location - now passes the district name
        getOrCreateLocation(location, districtName, function(err, locationId) {
            if (err) {
                console.error("Error handling location:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error processing location"
                });
            }

            // Get category ID
            getCategoryId(complaintType, function(err, categoryId) {
                if (err) {
                    console.error("Error getting category:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Error processing complaint type"
                    });
                }

                // Format the incident date
                const formattedDate = new Date(incidentDate).toISOString().slice(0, 19).replace('T', ' ');
                const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

                // Insert complaint
                const complaintQuery = `
                    INSERT INTO complaint (
                        description, created_at, status, username, admin_username, 
                        location_id, complaint_type, location_address, category_id
                    ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)
                `;

                con.query(complaintQuery, [
                    description,
                    formattedDate,
                    username,
                    adminUsername,
                    locationId,
                    complaintType,
                    location,
                    categoryId
                ], function(err, complaintResult) {
                    if (err) {
                        console.error("Error inserting complaint:", err);
                        return res.status(500).json({
                            success: false,
                            message: "Error submitting complaint"
                        });
                    }

                    const complaintId = complaintResult.insertId;

                    // Handle file uploads (evidence)
                    if (req.files && req.files.length > 0) {
                        let filesProcessed = 0;
                        let hasError = false;

                        req.files.forEach(function(file) {
                            let fileType;
                            if (file.mimetype.startsWith('image/')) fileType = 'image';
                            else if (file.mimetype.startsWith('video/')) fileType = 'video';
                            else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

                            // FIX: Create relative path instead of using absolute path
                            let relativePath;
                            if (file.mimetype.startsWith('image/')) {
                                relativePath = `images/${file.filename}`;
                            } else if (file.mimetype.startsWith('video/')) {
                                relativePath = `videos/${file.filename}`;
                            } else if (file.mimetype.startsWith('audio/')) {
                                relativePath = `audio/${file.filename}`;
                            } else {
                                relativePath = file.filename;
                            }

                            const evidenceQuery = `
            INSERT INTO evidence (uploaded_at, file_type, file_path, complaint_id)
            VALUES (?, ?, ?, ?)
        `;

                            con.query(evidenceQuery, [
                                createdAt,
                                fileType,
                                relativePath,  // Use relativePath instead of file.path
                                complaintId
                            ], function(err, evidenceResult) {
                                filesProcessed++;

                                if (err && !hasError) {
                                    hasError = true;
                                    console.error("Error inserting evidence:", err);
                                    return res.status(500).json({
                                        success: false,
                                        message: "Error uploading evidence"
                                    });
                                }

                                // Check if all files are processed
                                if (filesProcessed === req.files.length && !hasError) {
                                    res.json({
                                        success: true,
                                        message: "Complaint submitted successfully!",
                                        complaintId: complaintId
                                    });
                                }
                            });
                        });
                    } else {
                        // No files to process, send success response
                        res.json({
                            success: true,
                            message: "Complaint submitted successfully!",
                            complaintId: complaintId
                        });
                    }

                });
            });
        });
    });
});



// Route to handle admin notifications when complaint is submitted
app.post('/notify-admin', function(req, res) {
    // Remove admin authentication requirement since this is called after user submits complaint
    const { complaintId } = req.body;

    if (!complaintId) {
        return res.status(400).json({ success: false, message: "Complaint ID is required" });
    }

    // Get complaint details and admin email
    con.query(`
        SELECT c.*, u.fullName as user_fullname, a.email as admin_email 
        FROM complaint c 
        JOIN users u ON c.username = u.username 
        LEFT JOIN admins a ON c.admin_username = a.username
        WHERE c.complaint_id = ?
    `, [complaintId], function(err, results) {
        if (err) {
            console.error("Error fetching complaint for notification:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        const complaint = results[0];

        // If no admin is assigned, get a default admin (you can modify this logic)
        if (!complaint.admin_email) {
            con.query(`
                SELECT email FROM admins LIMIT 1
            `, function(err, adminResults) {
                if (err || adminResults.length === 0) {
                    console.error("Error fetching default admin:", err);
                    return res.status(500).json({ success: false, message: "No admin found" });
                }

                res.json({
                    success: true,
                    message: "Admin notified successfully",
                    complaint: {
                        id: complaint.complaint_id,
                        type: complaint.complaint_type,
                        username: complaint.username,
                        user_fullname: complaint.user_fullname,
                        description: complaint.description,
                        location: complaint.location_address,
                        submittedDate: complaint.created_at
                    },
                    adminEmail: adminResults[0].email
                });
            });
        } else {
            res.json({
                success: true,
                message: "Admin notified successfully",
                complaint: {
                    id: complaint.complaint_id,
                    type: complaint.complaint_type,
                    username: complaint.username,
                    user_fullname: complaint.user_fullname,
                    description: complaint.description,
                    location: complaint.location_address,
                    submittedDate: complaint.created_at
                },
                adminEmail: complaint.admin_email
            });
        }
    });
});





// Get admin settings - Complete version
app.get('/get-admin-settings', function(req, res) {
    if (!req.session.adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const adminUsername = req.session.adminUsername;

    con.query('SELECT * FROM admin_settings WHERE admin_username = ?', [adminUsername], function(err, results) {
        if (err) {
            console.error("Error fetching admin settings:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        // If no settings exist, create default settings
        if (results.length === 0) {
            const defaultSettings = {
                admin_username: adminUsername,
                dark_mode: false,
                email_notifications: true
            };

            con.query('INSERT INTO admin_settings SET ?', defaultSettings, function(insertErr, insertResult) {
                if (insertErr) {
                    console.error("Error creating default settings:", insertErr);
                    return res.status(500).json({ success: false, message: "Error creating settings" });
                }

                res.json({
                    success: true,
                    settings: defaultSettings
                });
            });
        } else {
            res.json({
                success: true,
                settings: {
                    dark_mode: Boolean(results[0].dark_mode),
                    email_notifications: Boolean(results[0].email_notifications)
                }
            });
        }
    });
});

// Update admin settings
app.post('/update-admin-settings', function(req, res) {
    if (!req.session.adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const adminUsername = req.session.adminUsername;
    const { dark_mode, email_notifications } = req.body;

    const settings = {
        dark_mode: dark_mode ? 1 : 0,
        email_notifications: email_notifications ? 1 : 0,
        updated_at: new Date()
    };

    con.query(`
        INSERT INTO admin_settings (admin_username, dark_mode, email_notifications, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        dark_mode = VALUES(dark_mode),
        email_notifications = VALUES(email_notifications),
        updated_at = VALUES(updated_at)
    `, [adminUsername, settings.dark_mode, settings.email_notifications], function(err, result) {
        if (err) {
            console.error("Error updating admin settings:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        res.json({
            success: true,
            message: "Settings updated successfully"
        });
    });
});





















// User: Get user's complaints with notification counts
app.get('/my-complaints', function(req, res) {
    if (!req.session.userId && !req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Please log in to view your complaints"
        });
    }

    const username = req.session.username;

    const complaintsQuery = `
        SELECT 
            c.complaint_id,
            c.description,
            c.created_at,
            c.status,
            c.complaint_type,
            c.location_address,
            COALESCE(evidence_count.count, 0) as evidence_count,
            COALESCE(notification_count.unread_notifications, 0) as unread_notifications
        FROM complaint c
        LEFT JOIN (
            SELECT complaint_id, COUNT(*) as count
            FROM evidence
            GROUP BY complaint_id
        ) evidence_count ON c.complaint_id = evidence_count.complaint_id
        LEFT JOIN (
            SELECT complaint_id, COUNT(*) as unread_notifications
            FROM complaint_notifications
            WHERE is_read = 0
            GROUP BY complaint_id
        ) notification_count ON c.complaint_id = notification_count.complaint_id
        WHERE c.username = ?
        ORDER BY c.created_at DESC
    `;

    con.query(complaintsQuery, [username], function(err, complaints) {
        if (err) {
            console.error('Error fetching user complaints:', err);
            return res.status(500).json({
                success: false,
                message: "Error fetching complaints"
            });
        }

        res.json({
            success: true,
            complaints: complaints
        });
    });
});



// User: Get complaint notifications
app.get('/complaint-notifications/:complaint_id', function(req, res) {
    const complaint_id = req.params.complaint_id;

    if (!req.session.userId && !req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const username = req.session.username;

    // First, verify that the complaint belongs to the logged-in user
    const verifyQuery = 'SELECT username FROM complaint WHERE complaint_id = ?';
    con.query(verifyQuery, [complaint_id], function(err, verifyResult) {
        if (err) {
            console.error('Error verifying complaint ownership:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (verifyResult.length === 0 || verifyResult[0].username !== username) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Get notifications for the complaint
        const notificationQuery = `
            SELECT 
                notification_id,
                message,
                type,
                is_read,
                created_at
            FROM complaint_notifications 
            WHERE complaint_id = ? 
            ORDER BY created_at DESC
        `;

        con.query(notificationQuery, [complaint_id], function(err, notifications) {
            if (err) {
                console.error('Error fetching notifications:', err);
                return res.status(500).json({ success: false, message: 'Error fetching notifications' });
            }

            res.json({
                success: true,
                notifications: notifications
            });
        });
    });
});



// User: Mark notifications as read
app.post('/mark-notifications-read/:complaint_id', function(req, res) {
    const complaint_id = req.params.complaint_id;

    if (!req.session.userId && !req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        });
    }

    const username = req.session.username;

    // First, verify that the complaint belongs to the logged-in user
    const verifyQuery = 'SELECT username FROM complaint WHERE complaint_id = ?';
    con.query(verifyQuery, [complaint_id], function(err, verifyResult) {
        if (err) {
            console.error('Error verifying complaint ownership:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (verifyResult.length === 0 || verifyResult[0].username !== username) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Mark notifications as read
        const updateQuery = 'UPDATE complaint_notifications SET is_read = 1 WHERE complaint_id = ? AND is_read = 0';
        con.query(updateQuery, [complaint_id], function(err, result) {
            if (err) {
                console.error('Error marking notifications as read:', err);
                return res.status(500).json({ success: false, message: 'Error updating notifications' });
            }

            res.json({
                success: true,
                message: 'Notifications marked as read'
            });
        });
    });
});


// User: Get chat messages for a complaint
app.get('/complaint-chat/:complaintId', function(req, res) {
    if (!req.session.userId && !req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Please log in"
        });
    }

    const complaintId = req.params.complaintId;
    const username = req.session.username;

    // First verify the complaint belongs to the user
    con.query('SELECT username FROM complaint WHERE complaint_id = ?', [complaintId], function(err, results) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (results.length === 0 || results[0].username !== username) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Get chat messages
        const query = `
            SELECT * FROM complaint_chat 
            WHERE complaint_id = ? 
            ORDER BY sent_at ASC
        `;

        con.query(query, [complaintId], function(err, messages) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error fetching messages"
                });
            }

            res.json({
                success: true,
                messages: messages
            });
        });
    });
});


// User: Send chat message
app.post('/send-chat-message', function(req, res) {
    if (!req.session.userId && !req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Please log in"
        });
    }

    const { complaint_id, message } = req.body;
    const username = req.session.username;

    if (!complaint_id || !message || !message.trim()) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    // First verify the complaint belongs to the user
    con.query('SELECT username FROM complaint WHERE complaint_id = ?', [complaint_id], function(err, results) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (results.length === 0 || results[0].username !== username) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Insert chat message
        const query = `
            INSERT INTO complaint_chat (complaint_id, sender_type, sender_username, message, sent_at) 
            VALUES (?, 'user', ?, ?, NOW())
        `;

        con.query(query, [complaint_id, username, message.trim()], function(err, result) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error sending message"
                });
            }

            res.json({
                success: true,
                message: "Message sent successfully"
            });
        });
    });
});


// version with file deletion
app.delete('/delete-complaint/:id', function(req, res) {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated"
        });
    }

    const complaintId = req.params.id;
    const userId = req.session.userId;

    // First, check if the complaint exists and belongs to the user and is pending
    con.query(
        'SELECT * FROM complaint WHERE complaint_id = ? AND username = (SELECT username FROM users WHERE userid = ?) AND status = "pending"',
        [complaintId, userId],
        function(err, results) {
            if (err) {
                console.error("Error checking complaint:", err);
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Complaint not found or cannot be deleted (must be in pending status)"
                });
            }

            // Get all evidence files for this complaint before deleting
            con.query(
                'SELECT file_path FROM evidence WHERE complaint_id = ?',
                [complaintId],
                function(evidenceErr, evidenceFiles) {
                    if (evidenceErr) {
                        console.error("Error fetching evidence files:", evidenceErr);
                        return res.status(500).json({
                            success: false,
                            message: "Error fetching evidence files"
                        });
                    }

                    // Start transaction
                    con.beginTransaction(function(transactionErr) {
                        if (transactionErr) {
                            console.error("Error starting transaction:", transactionErr);
                            return res.status(500).json({
                                success: false,
                                message: "Database transaction error"
                            });
                        }

                        // Delete evidence files from database
                        con.query(
                            'DELETE FROM evidence WHERE complaint_id = ?',
                            [complaintId],
                            function(evidenceErr, evidenceResult) {
                                if (evidenceErr) {
                                    console.error("Error deleting evidence:", evidenceErr);
                                    return con.rollback(function() {
                                        res.status(500).json({
                                            success: false,
                                            message: "Error deleting evidence files"
                                        });
                                    });
                                }

                                // Delete status updates
                                con.query(
                                    'DELETE FROM status_updates WHERE complaint_id = ?',
                                    [complaintId],
                                    function(statusErr, statusResult) {
                                        if (statusErr) {
                                            console.error("Error deleting status updates:", statusErr);
                                            return con.rollback(function() {
                                                res.status(500).json({
                                                    success: false,
                                                    message: "Error deleting status updates"
                                                });
                                            });
                                        }

                                        // Delete the complaint
                                        con.query(
                                            'DELETE FROM complaint WHERE complaint_id = ? AND username = (SELECT username FROM users WHERE userid = ?)',
                                            [complaintId, userId],
                                            function(deleteErr, deleteResult) {
                                                if (deleteErr) {
                                                    console.error("Error deleting complaint:", deleteErr);
                                                    return con.rollback(function() {
                                                        res.status(500).json({
                                                            success: false,
                                                            message: "Error deleting complaint"
                                                        });
                                                    });
                                                }

                                                if (deleteResult.affectedRows === 0) {
                                                    return con.rollback(function() {
                                                        res.status(404).json({
                                                            success: false,
                                                            message: "Complaint not found"
                                                        });
                                                    });
                                                }

                                                // Commit the transaction
                                                con.commit(function(commitErr) {
                                                    if (commitErr) {
                                                        console.error("Error committing transaction:", commitErr);
                                                        return con.rollback(function() {
                                                            res.status(500).json({
                                                                success: false,
                                                                message: "Error committing changes"
                                                            });
                                                        });
                                                    }

                                                    // After successful database deletion, delete physical files
                                                    evidenceFiles.forEach(file => {
                                                        if (file.file_path) {
                                                            const filePath = path.join(rootDir, file.file_path);
                                                            fs.unlink(filePath, (fileErr) => {
                                                                if (fileErr) {
                                                                    console.error(`Error deleting file ${filePath}:`, fileErr);
                                                                    // Don't fail the request for file deletion errors
                                                                } else {
                                                                    console.log(`File deleted: ${filePath}`);
                                                                }
                                                            });
                                                        }
                                                    });

                                                    console.log(`Complaint ${complaintId} and all related data deleted successfully`);
                                                    res.json({
                                                        success: true,
                                                        message: "Complaint deleted successfully"
                                                    });
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    });
                }
            );
        }
    );
});



//dashboard stats route
app.get('/dashboard-stats', function(req, res) {
    if (!req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Please log in to view stats"
        });
    }

    const username = req.session.username;

    const query = `
        SELECT 
            status,
            COUNT(*) as count
        FROM complaint 
        WHERE username = ?
        GROUP BY status
    `;

    con.query(query, [username], function(err, results) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                success: false,
                message: "Error fetching stats"
            });
        }

        const stats = {
            pending: 0,
            verifying: 0,
            investigating: 0,
            resolved: 0,
            total: 0
        };

        results.forEach(row => {
            stats[row.status] = row.count;
            stats.total += row.count;
        });

        res.json({
            success: true,
            stats: stats
        });
    });
});




const PORT = process.env.PORT || 3000;

// Function to open browser
function openBrowser(url) {
    const { exec } = require('child_process');
    const platform = process.platform;
    
    let command;
    if (platform === 'win32') {
        command = `start ${url}`;
    } else if (platform === 'darwin') {
        command = `open ${url}`;
    } else {
        command = `xdg-open ${url}`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.error('Could not open browser:', error);
        }
    });
}

app.listen(PORT, () => {
    const url = `http://localhost:${PORT}/homepage`;
    console.log(`Server running on port ${PORT}`);
    console.log(`Opening browser at ${url}`);
    
    // Open browser after a short delay to ensure server is ready
    setTimeout(() => {
        openBrowser(url);
    }, 1000);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is in use. Trying another port...`);
        const newPort = PORT + 1;
        app.listen(newPort, () => {
            const url = `http://localhost:${newPort}/homepage`;
            console.log(`Server running on port ${newPort}`);
            console.log(`Opening browser at ${url}`);
            setTimeout(() => {
                openBrowser(url);
            }, 1000);
        });
    } else {
        console.error(err);
    }
});