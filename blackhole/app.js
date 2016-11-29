const port = 8080;
const SELECT_ALL = "SELECT * FROM cs420";
var app = require("express")();
var http = require("http").Server(app);
var max_lat = 0.0;
var max_long = 0.0;
var min_lat = 0.0;
var min_long = 0.0;

const pool = mysql.createPool({
   connectionLimit: 25,
   host: 'localhost',
   user: 'node'
   password: 'nodePassword'
   database: 'cs420'
 });

app.get("/", function(req, res) {
  res.send("Hello, World!");
});

app.get("/health", function(req, res) {
  res.send("Sex, Drugs, Rock & Roll!");
});

app.get("/getData", function(req, res) {
  pool.getConnection((err, connection) => {
    connection.query(SELECT_ALL, (err, rows, fields) =>{

      if(err) {
        console.log("fuck: " + err);
      }



      connection.release();

    });
  });
});

app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});
