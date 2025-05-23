var express1 = require('express');
var app = express1();
var con = require('../../ServerConnection.js');
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
app.use('/User/Scripts',express1.static(path.join(__dirname, '../../User/Scripts')))
app.use('/User/CSS', express1.static(path.join(__dirname, '../../User/CSS')));

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

// Route to serve homepage with authentication
app.get('/homepage', function(req, res) {
    // Add debugging information
    console.log("Session:", req.session);
    
    // Check if session and session.userId exist
    const isAuthenticated = req.session && req.session.userId ? true : false;
    const username = req.session && req.session.username ? req.session.username : null;

    
    // Correct path to homepage.html
    const homepagePath = path.join(homePageDir, 'homepage.html');
    
    // Check if file exists
    if (!fs.existsSync(homepagePath)) {
        console.error("Homepage file not found:", homepagePath);
        return res.status(404).send("Homepage file not found");
    }
    
    fs.readFile(homepagePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading homepage file:", err);
            return res.status(500).send("Error loading homepage");
        }
        
        // Add user authentication data to be used by JavaScript
        const authScript = `
        <script>
            window.isAuthenticated = ${isAuthenticated};
            window.currentUser = ${JSON.stringify(username)};
        </script>
        `;
        
        // Insert the script right before the closing </head> tag
        let modifiedData = data.replace('</head>', authScript + '</head>');
       // Update all links in the HTML to use routes instead of relative paths
        modifiedData = modifiedData.replace(/href="\.\.\/Login\/login\.html"/g, 'href="/login"');
        modifiedData = modifiedData.replace(/href="\.\.\/Login\/adminLogin\.html"/g, 'href="/adminLogin"');


        res.send(modifiedData);
    });
});

// Serve static files from Home Page directory
app.use('/Home Page', express1.static(homePageDir));

// Serve static files from assets directory within Home Page
app.use('/assets', express1.static(path.join(homePageDir, 'assets')));

// Add session management

// Route for the contact-us page
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
        
        // Add user authentication data to be used by JavaScript
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
app.post('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.redirect('/signup');
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