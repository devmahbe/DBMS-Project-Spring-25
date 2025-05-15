var express1 = require('express');
var app = express1();
var con = require('../../ServerConnection.js');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Add this line
const saltRounds = 10; // Add this line - defines the complexity of the hash
app.use(bodyParser.json());
const path = require('path');
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
const parentDir = path.join(__dirname, '..');
app.use(express1.static(parentDir));
console.log('Serving static files from:', parentDir);




app.get('/signup',function(req,res){


    res.sendFile(path.join(parentDir,'login.html'));
})

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
                    res.send("Registration successful!");
                }
            });
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