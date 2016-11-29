const port = 8080;
const SELECT_ALL = "SELECT * FROM cs420 WHERE LATNS BETWEEN ?AND ? LONGEW BETWEEN ? AND ?";
var app = require("express")();
var http = require("http").Server(app);
var mysql = require("mysql");

const max_lat = -200;
const max_long = 1800;
const min_lat = 0.0;
const min_long = 1600;

var returnArray = [];

const pool = mysql.createPool({
   connectionLimit: 25,
   host: 'localhost',
   user: 'node',
   password: 'nodePassword',
   database: 'cs420'
 });

app.get("/", function(req, res) {
  res.send("Hello, World!");
});

app.get("/health", function(req, res) {
  res.send("Sex, Drugs, Rock & Roll!");
});

app.get("/getData", function(req, res) {

  console.log("REQUEST RECIEVED!!");

  pool.getConnection((err, connection) => {

    for(var lat = min_lat; lat >= max_lat; lat -= 0.5) {
        //console.log("current loop @ : " + lat )
      for(var lon = min_long; lon <= max_long; lon += 0.5) {
          if(lat == min_lat && lon == min_long) {
            continue;
          }

          connection.query(SELECT_ALL, [lat - 0.5, lat, lon - 0.5, lon], function(err, results) {
            if(err) {
              console.log("error: " + err);
            } else {
              var obj = {};
              obj["data"] = results.length;

              returnArray.push(obj);
              connection.release();
          }
        });
      }
    }
  });

  console.log("DONE!");
});

app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});
