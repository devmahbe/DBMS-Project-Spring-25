
var express1 = require('express');
var app = express1();
var con = require('./connection');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');




app.get('/registerAJAX',function (req,res){
    res.sendFile(__dirname+'/registerAJAX.html');
});

app.post('/registerAJAX',function (req,res){
    var name = req.body.name; // we used body-parser for this reason
    var email = req.body.email;
    var age = req.body.age;
    var Class=req.body.class;

    con.connect(function(err){
        console.log(err);
        var sql = "INSERT INTO student_info(name, email, age,`class`) VALUES ?";
        var values=[
            [name,email,age,Class]
             ];
        con.query(sql, [values], function(err, result){
            if (err) {
                console.error("Error inserting data:", err);
                res.status(500).send("Error inserting data into the database.");
            } else {
                console.log("Data inserted:", result);
                res.send("Data inserted successfully");
            }
        })
    });

});
app.get('/studentsData',function (req,res){
    con.connect(function(err){
        if(err) console.log(err);

        var sql = "SELECT  * from student_info";
        con.query(sql, function(err, result){
            if (err) {
                console.error("Error showing data:", err);

            }
            res.render(__dirname+"/studentsData",{students: result});

        });
    });
});

app.get('/delete_student',function(req,res){
  con.connect(function (error){
      if(error) console.log(error);
      var id= req.query.id;
      var sql = "DELETE FROM student_info where student_id=?";

      con.query(sql, [id], function (err, result) {
          if (err) {
              console.error("Error deleting data:", err);
              return res.status(500).send("Error deleting data from the database.");
          }

          if (result.affectedRows === 0) {
              return res.status(404).send("Student not found.");
          }

          console.log("Deleted student with ID:", id);
          res.send("Student Record deleted successfully");
      });
  });

});
//UPdate student
app.get('/update_studentAJAX',function(req,res){
  con.connect(function (error){
      if(error) console.log(error);
      const id = req.query.id;
      const sql = "SELECT * FROM student_info WHERE student_id=?";
      con.query(sql, [id], function (err, result) {
         if (err) {console.log(err)}
         res.render(__dirname+"/updateStudentAJAX",{updatestudent: result});
         // Here {updateStudent: result } is key value pair
         // the updateStudent is a variable that we will sent to our ejs file
         // the updateStudent hold the result of our GET request
         // SO on the ejs file now we will populate the
         // page with the data that we got from the database

     })
  });
});

app.post('/update_studentAJAX',function (req,res){
    con.connect(function (error){
        if(error) console.log(error);
        var name= req.body.name;
        var email= req.body.email;
        var age= req.body.age;
        var Class=req.body.class;
        var id= req.body.student_id; // in ejs file we named the varibale as id not student_id
        var sql = "UPDATE student_info set name=? , email=? ,age=? , class=? WHERE student_id=?";




        con.query(sql, [name,email,age,Class,id], function (err, result) {
              if(err) console.log(err);
              res.send('Student record Updated successfully');
        });
    });
});


app.get('/searching',function(req,res){
    let { criteria, query } = req.query;

    //here criteria will hold the value of the selected parameter
    //from our searchStudent page like name , email or class
    //the query will be the input we type in the input box


    //if no query is provided, return empty results
    if (!query) {
        return res.redirect('/searhcing');
    }

    //to prevent SQL injection by using parameterized query
    let sql = `SELECT * FROM student_info WHERE ?? LIKE ?`;
    let searchValue = `%${query}%`;

    con.query(sql, [criteria, searchValue], function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send("Database Error");
        }
        res.render(__dirname+"/searching", { students: result });
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