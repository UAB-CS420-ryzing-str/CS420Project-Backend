var app = require("express")();
var http = require("http").Server(app);
var mysql = require("mysql");

const port = 8080;
const SELECT_BETWEEN = "SELECT * FROM cs420 WHERE LATNS BETWEEN ? AND ? LONGEW BETWEEN ? AND ?";

const min_lat = 0.0;
const max_lat = -200;
const min_long = 1600;
const max_long = 1800;

const connection = mysql.createConnection({
   host: 'cs457.andrewpe.com',
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

/** Get ALL the data **/
app.get("/getData", function(req, res) {

  console.log("REQUEST RECIEVED!!");
  var returnArray = [];

  connection.connect();
    for(var lat = min_lat; lat >= max_lat; lat -= 0.5) {
      for(var lon = min_long; lon <= max_long; lon += 0.5) {
        //skip the first loop to prevent getting values between 0 and 0
          if(lat == min_lat && lon == min_long) {
            continue;
          }

          connection.query(SELECT_BETWEEN, [lat - 0.5, lat, lon - 0.5, lon], function(err, results) {
            if(err) {
              console.log("error: " + err);
            } else {
              var obj = {};
              obj["data"] = results.length;

              delete results;
              returnArray.push(obj);
          }
        });
      }
    }

    connection.end();
    res.send(returnArray);
});

/** Only get the data between these coords **/
app.get("/get/location/:minLat/:maxLat/:minLong/:maxLong", function(req, res) {
  console.log("REQUEST RECIEVED");

  var returnArray = [];

  connection.connect();
  connection.query(SELECT_BETWEEN, [req.params.minLat, req.params.maxLat, req.params.minLong, req.params.maxLong], function(err, results) {
    if(err) {
      console.log("error: " + err);
    } else {
        if(results.length > 0) {
          returnArray = results;
        }
    }
  });
  connection.end();

  res.send(returnArray);
});

app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});
