var express1 = require('express');
var app = express1();
var con = require('../../ServerConnection.js');
const multer = require('multer');
const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Add this line
const saltRounds = 10; // Add this line - defines the complexity of the hash
app.use(bodyParser.json());
const path = require('path');
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../User/views'));



const parentDir = path.join(__dirname, '..');
app.use(express1.static(parentDir));
console.log('Serving static files from:', parentDir);
app.use('/uploads', express1.static(path.join(__dirname, '../../uploads')));
app.use('/User/Scripts',express1.static(path.join(__dirname, '../../User/Scripts')))
app.use('/User/CSS', express1.static(path.join(__dirname, '../../User/CSS')));
app.use('/User', express1.static(path.join(__dirname, '../../User')));
app.use((req, res, next) => {
    // Prevent caching of sensitive pages
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});


// Make sure these imports are at the top of your file
const session = require('express-session');

// Update session middleware - make sure this is before any routes
app.use(session({
    secret: 'your_secure_random_string_here',
    resave: false,
    saveUninitialized: true, // Changed to true
    cookie: {
        secure: false, // set to true if using https
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Calculate correct paths
const rootDir = path.join(parentDir, '..');
const homePageDir = path.join(rootDir, 'Home Page');

// Add this line to serve static files from the Admin Page directory
app.use('/Admin Page', express1.static(path.join(rootDir, 'Admin Page')));


// Admin login route (handles both new registrations and existing admin logins)
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
        // If admin doesn't exist and registration form is complete, create a new admin
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
                        
                        // Send success message with redirection flag
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

    // Fetch admin data and complaints
    const adminQuery = 'SELECT * FROM admins WHERE adminid = ?';
    const complaintsQuery = `
        SELECT 
            c.complaint_id,
            c.username,
            c.complaint_type,
            c.created_at,
            c.location_address,
            c.status,
            c.description
        FROM complaint c 
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

        // Fetch complaints
        con.query(complaintsQuery, [adminUsername], function(err, complaintsResults) {
            if (err) {
                console.error("Error fetching complaints:", err);
                return res.status(500).send("Error fetching complaints");
            }

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
                    complaints: complaintsResults,
                    users: usersResults
                });
            });
        });
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




// Route to update complaint status
app.post('/update-complaint-status', function(req, res) {
    if (!req.session.adminUsername) {
        return res.status(401).json({
            success: false,
            message: "Admin access required"
        });
    }

    const { complaint_id, status, remarks } = req.body;
    const adminUsername = req.session.adminUsername;

    // Update complaint status
    con.query('UPDATE complaint SET status = ?, admin_username = ? WHERE complaint_id = ?',
        [status, adminUsername, complaint_id], function(err, result) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error updating status"
                });
            }

            // Insert status update record
            con.query('INSERT INTO status_updates (complaint_id, status, remarks, updated_by) VALUES (?, ?, ?, ?)',
                [complaint_id, status, remarks, adminUsername], function(err) {
                    if (err) {
                        console.error("Error inserting status update:", err);
                    }
                });

            // Create notification
            const statusMessages = {
                'verifying': 'Your complaint is now being verified by our team.',
                'investigating': 'Your complaint is under investigation.',
                'resolved': 'Your complaint has been resolved. Thank you for your patience.'
            };

            const notificationMessage = statusMessages[status] || `Your complaint status has been updated to ${status}.`;
            createNotification(complaint_id, notificationMessage, 'status_change');

            res.json({
                success: true,
                message: "Status updated successfully"
            });
        });
});



// Get chat messages for a specific complaint
app.get('/admin/chat/messages/:complaintId', function(req, res) {
    console.log('Chat messages request for complaint:', req.params.complaintId);
    console.log('Session check:', req.session);

    if (!req.session.adminId) {
        console.log('Unauthorized chat access attempt');
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const complaintId = req.params.complaintId;

    const query = `
        SELECT 
            chat_id,
            complaint_id,
            sender_type,
            sender_username,
            message,
            sent_at,
            is_read
        FROM complaint_chat 
        WHERE complaint_id = ? 
        ORDER BY sent_at ASC
    `;

    con.query(query, [complaintId], function(err, results) {
        if (err) {
            console.error("Error fetching chat messages:", err);
            return res.status(500).json({
                success: false,
                message: "Database error while fetching messages"
            });
        }

        console.log('Found messages:', results.length);

        // Mark admin messages as read when admin opens the chat
        const markReadQuery = `
            UPDATE complaint_chat 
            SET is_read = 1 
            WHERE complaint_id = ? AND sender_type = 'user' AND is_read = 0
        `;

        con.query(markReadQuery, [complaintId], function(markErr) {
            if (markErr) {
                console.error("Error marking messages as read:", markErr);
            }
        });

        res.json({
            success: true,
            messages: results
        });
    });
});

// Send a chat message
app.post('/admin/chat/send', function(req, res) {
    console.log('Chat send request:', req.body);
    console.log('Session check:', req.session);

    if (!req.session.adminId) {
        console.log('Unauthorized chat send attempt');
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { complaint_id, message, sender_type } = req.body;
    const sender_username = req.session.adminUsername; // Get admin username from session
    const sent_at = new Date();

    if (!complaint_id || !message || !sender_type) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    const query = `
        INSERT INTO complaint_chat (complaint_id, sender_type, sender_username, message, sent_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    // Admin messages are automatically marked as read (is_read = 1)
    con.query(query, [complaint_id, sender_type, sender_username, message, sent_at, 1], function(err, result) {
        if (err) {
            console.error("Error sending message:", err);
            return res.status(500).json({
                success: false,
                message: "Database error while sending message"
            });
        }

        console.log('Message sent successfully, ID:', result.insertId);

        res.json({
            success: true,
            message: "Message sent successfully",
            chatId: result.insertId
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

    // First verify this complaint belongs to this admin
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

            res.json({
                success: true,
                evidence: evidenceResults,
                complaint: complaintResults[0]
            });
        });
    });
});



app.post('/admin-update-status', function(req, res) {
    if (!req.session.adminUsername) {
        return res.status(401).json({
            success: false,
            message: "Admin access required"
        });
    }

    const { complaint_id, new_status, remarks } = req.body;
    const adminUsername = req.session.adminUsername;

    console.log('Status update request:', { complaint_id, new_status, remarks, adminUsername });

    if (!complaint_id || !new_status) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    // Update complaint status
    const updateQuery = 'UPDATE complaint SET status = ?, admin_username = ? WHERE complaint_id = ?';

    con.query(updateQuery, [new_status, adminUsername, complaint_id], function(err, result) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                success: false,
                message: "Error updating status"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        // Insert status update record
        const statusUpdateQuery = 'INSERT INTO status_updates (complaint_id, status, remarks, updated_by) VALUES (?, ?, ?, ?)';
        con.query(statusUpdateQuery, [complaint_id, new_status, remarks || '', adminUsername], function(err) {
            if (err) {
                console.error("Error inserting status update:", err);
            }
        });

        // Create notification
        const statusMessages = {
            'verifying': 'Your complaint is now being verified by our team.',
            'investigating': 'Your complaint is under investigation.',
            'resolved': 'Your complaint has been resolved. Thank you for your patience.'
        };

        const notificationMessage = statusMessages[new_status] || `Your complaint status has been updated to ${new_status}.`;
        createNotification(complaint_id, notificationMessage, 'status_change');

        res.json({
            success: true,
            message: "Status updated successfully"
        });
    });
});



















// Route to get cases (handled complaints) for analytics
app.get('/get-admin-cases', function(req, res) {
    // Check if admin is logged in
    if (!req.session.adminId) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const adminUsername = req.session.adminUsername;

    // Get all complaints handled by this admin with status updates
    const casesQuery = `
        SELECT 
            c.complaint_id,
            c.username,
            c.complaint_type,
            c.created_at,
            c.status,
            c.description,
            su.updated_at as last_updated,
            su.remarks
        FROM complaint c 
        LEFT JOIN status_updates su ON c.complaint_id = su.complaint_id 
        WHERE c.admin_username = ? 
        ORDER BY c.created_at DESC
    `;

    con.query(casesQuery, [adminUsername], function(err, results) {
        if (err) {
            console.error("Error fetching cases:", err);
            return res.status(500).json({ success: false, message: "Error fetching cases" });
        }

        // Group by status for analytics
        const analytics = {
            total: results.length,
            pending: results.filter(c => c.status === 'pending').length,
            verifying: results.filter(c => c.status === 'verifying').length,
            investigating: results.filter(c => c.status === 'investigating').length,
            resolved: results.filter(c => c.status === 'resolved').length
        };

        res.json({
            success: true,
            cases: results,
            analytics: analytics
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

// Serve uploaded files statically
app.use('/uploads', express1.static(path.join(__dirname, '../../uploads')));

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

                            const evidenceQuery = `
                                INSERT INTO evidence (uploaded_at, file_type, file_path, complaint_id)
                                VALUES (?, ?, ?, ?)
                            `;

                            con.query(evidenceQuery, [
                                createdAt,
                                fileType,
                                file.path,
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


// my-complaints route with notifications count
app.get('/my-complaints', function(req, res) {
    if (!req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Please log in to view complaints"
        });
    }

    const username = req.session.username;

    const query = `
        SELECT 
            c.*,
            COUNT(DISTINCT e.evidence_id) as evidence_count,
            COUNT(DISTINCT CASE WHEN cn.is_read = 0 THEN cn.notification_id END) as unread_notifications
        FROM complaint c
        LEFT JOIN evidence e ON c.complaint_id = e.complaint_id
        LEFT JOIN complaint_notifications cn ON c.complaint_id = cn.complaint_id
        WHERE c.username = ?
        GROUP BY c.complaint_id
        ORDER BY c.created_at DESC
    `;

    con.query(query, [username], function(err, results) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                success: false,
                message: "Error fetching complaints"
            });
        }

        res.json({
            success: true,
            complaints: results
        });
    });
});


// Get complaint notifications
app.get('/complaint-notifications/:complaintId', function(req, res) {
    if (!req.session.username) {
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

        // Get notifications
        const query = `
            SELECT * FROM complaint_notifications 
            WHERE complaint_id = ? 
            ORDER BY created_at DESC
        `;

        con.query(query, [complaintId], function(err, notifications) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error fetching notifications"
                });
            }

            res.json({
                success: true,
                notifications: notifications
            });
        });
    });
});


// Mark notifications as read
app.post('/mark-notifications-read/:complaintId', function(req, res) {
    if (!req.session.username) {
        return res.status(401).json({
            success: false,
            message: "Please log in"
        });
    }

    const complaintId = req.params.complaintId;
    const username = req.session.username;

    // First verify the complaint belongs to the user
    con.query('SELECT username FROM complaint WHERE complaint_id = ?', [complaintId], function(err, results) {
        if (err || results.length === 0 || results[0].username !== username) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Mark notifications as read
        con.query('UPDATE complaint_notifications SET is_read = 1 WHERE complaint_id = ?', [complaintId], function(err) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error updating notifications"
                });
            }

            res.json({
                success: true,
                message: "Notifications marked as read"
            });
        });
    });
});

// Get chat messages for a complaint
app.get('/complaint-chat/:complaintId', function(req, res) {
    if (!req.session.username) {
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

// Send chat message
app.post('/send-chat-message', function(req, res) {
    if (!req.session.username) {
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
            INSERT INTO complaint_chat (complaint_id, sender_type, sender_username, message) 
            VALUES (?, 'user', ?, ?)
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



// Function to create notification
function createNotification(complaintId, message, type = 'system') {
    // Add validation to ensure complaintId is not null/undefined
    if (!complaintId) {
        console.error("Cannot create notification: complaint_id is null or undefined");
        return;
    }

    const query = `
        INSERT INTO complaint_notifications (complaint_id, message, type) 
        VALUES (?, ?, ?)
    `;

    con.query(query, [complaintId, message, type], function(err, result) {
        if (err) {
            console.error("Error creating notification:", err);
        } else {
            console.log("Notification created successfully for complaint:", complaintId);
        }
    });
}


























// handle complaint deletion
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
        'SELECT * FROM complaints WHERE complaint_id = ? AND user_id = ? AND status = "pending"',
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

            // Delete the complaint
            con.query(
                'DELETE FROM complaints WHERE complaint_id = ? AND user_id = ?',
                [complaintId, userId],
                function(deleteErr, deleteResult) {
                    if (deleteErr) {
                        console.error("Error deleting complaint:", deleteErr);
                        return res.status(500).json({
                            success: false,
                            message: "Error deleting complaint"
                        });
                    }

                    if (deleteResult.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: "Complaint not found"
                        });
                    }

                    console.log(`Complaint ${complaintId} deleted successfully`);
                    res.json({
                        success: true,
                        message: "Complaint deleted successfully"
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is in use. Trying another port...`);
        app.listen(PORT + 1, () => console.log(`Server running on port ${PORT + 1}`));
    } else {
        console.error(err);
    }
});