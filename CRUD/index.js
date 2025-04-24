const express = require('express');
const app = express();
const con= require('./connection');


const bodyParser=require('body-parser');
// to kill the process on port 3000 :
// npx kill-port 3000

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views',__dirname+'/CRUD');

//ejs is a embedded JS template ,
//it's a JavaScript template engine
// that's used to create dynamic web pages.
// EJS allows you to embed JavaScript code directly into HTML.


//Insert Students
app.get('/register',function(req, res){
   res.sendFile(__dirname+'/registerAJAX.html'); //sending the html file to local lost
});
app.post('/register',function(req,res){var id = req.body.student_id;
  var name = req.body.name;
  var email = req.body.email;
  var age = req.body.age;
  var Class = req.body.class;
  con.connect(function(err){
      if(err)throw err;

      var sql = "INSERT INTO student_info( name, email, age, class) VALUES ?";
      var values = [
          [name ,email, age, Class]
      ];
      con.query(sql,[values],function(err,result){
          if(err)throw err;
          res.redirect('/students');
          //res.send("Student Register Successfully " + result.insertId);
      })
  })


});


//Show ALl students
app.get('/students',function(req,res){
    con.connect(function(err){
        if(err) console.log(err);

        var sql = "select * from student_info";
        con.query(sql,function(err,result){
            if(err)throw err;
            res.render(__dirname+"/students",{students:result});
            // here students is the ejs file name
            // and the {students:result} here the "students" is the variable we are seding to that
            //ejs file to show it on the web


        });

    });

});

//Delete students
app.get('/delete_student',function(req,res){
    con.connect(function(err){
        if(err) console.log(err);
        var id = req.query.id; // this will get the id from the web that we want to delete


        var sql = "delete  from student_info where student_id=?";
        con.query(sql,[id],function(err,result){
            if(err) console.log(err);
            res.redirect('/students');


        });

    });
});

//Update Student

app.get('/update_student',function(req,res){
    con.connect(function(err){
        if(err) console.log(err);
        var id = req.query.id; // this will get the id from the web that we want to delete
        //as this is a GET request so we can use the query function of the HTTP request

        var sql = "select *  from student_info where student_id=?";
        con.query(sql,[id],function(err,result){
            if(err) console.log(err);
            res.render(__dirname+"/updateStudent",{updateStudent:result});
            // (updateStudent:result) will work as the result variable in out updateStudent ejs file
            //Here we will give the ejs file name not our url name



        });

    });
});

//Another route for updating (submit),
// As after updating we will have to use POST method

app.post('/update_student',function(req,res){
    var id = req.body.student_id;
    var name = req.body.name;
    var email = req.body.email;
    var age = req.body.age;
    var Class = req.body.class;

    con.connect(function(err){
        if(err) console.log(err);


        var sql = "UPDATE student_info set name=? ,email=?, age=? ,class=? WHERE student_id=?";
        con.query(sql,[name,email,age,Class,id],function(err,result){
            if(err) console.log(err);
            res.redirect('/students');




        });

    });
});




//Search


app.get('/search_student', (req, res) => {
    let sql = "SELECT * FROM student_info";

    con.query(sql, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send("Database Error");
        }
        res.render(__dirname+"/searchStudent", { students: result });
    });
});

// Route to handle the search request
app.get('/search', function (req, res) {
//This defines a GET route for /search
// When a user submits the search form, this route handles the request.


    let { criteria, query } = req.query;

    //here criteria will hold the value of the selected parameter
    //from our searchStudent page like name , email or class
    //the query will be the input we type in the input box


    //if no query is provided, return empty results
    if (!query) {
        return res.redirect('/search_student');
    }

    //to prevent SQL injection by using parameterized query
    let sql = `SELECT * FROM student_info WHERE ?? LIKE ?`;
    let searchValue = `%${query}%`;

    con.query(sql, [criteria, searchValue], function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send("Database Error");
        }
        res.render(__dirname+"/searchStudent", { students: result });
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


/*
Ejs formats :

//NOTE : we will use ejs instead of HTML file when we will need to show/load
data's from sever to our page

<% ... %> → Executes JavaScript Code
 Runs JavaScript code but does not output anything in HTML.
Used for loops, conditions, and other JS logic.

2️⃣ <%= ... %> → Prints & Escapes HTML
✅ Outputs the result of JavaScript expressions into the HTML.
✅ Escapes HTML to prevent XSS (Cross-Site Scripting).


3️⃣ <%- ... %> → Prints & Does NOT Escape HTML
✅ Outputs the result of JavaScript expressions into the HTML.
✅ DOES NOT escape HTML, meaning it renders raw HTML.
 */

