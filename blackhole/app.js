var app = require("express")();
var http = require("http").Server(app);
var mysql = require("mysql");

const port = 8080;
const min_lat = 0.0;
const max_lat = -200;
const min_long = 1600;
const max_long = 1800;
const pool = mysql.createPool({
   connectionLimit: 25,
   host: '45.55.77.74',
   user: 'node',
   password: 'nodePassword',
   database: 'cs420'
 });

 var SELECT_BETWEEN = "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN ? AND ?) AND (LonEW BETWEEN ? AND ?)";
 var returnArray = [];

app.get("/", function(req, res) {
  res.send("Hello, World!");
});

app.get("/health", function(req, res) {
  res.send("Sex, Drugs, Rock & Roll!");
});

/** Get ALL the data **/
app.get("/get/data/count", function(req, res) {

  console.log("/get/data/count request recieved...");

  for(var current_lat = min_lat; current_lat >= max_lat; current_lat -= 5) {
    for(var current_long = min_long; current_long <= max_long; current_long += 5) {
      var lat_back_step = current_lat + 5;
      var long_back_step = current_long - 5;

      var query = "SELECT COUNT(*) as rowCount FROM hurricane_data WHERE (LatNS BETWEEN " + current_lat + " AND " + lat_back_step + ") AND (LonEW BETWEEN " + long_back_step + " AND " + current_long + ");";
      queryDbForAllData(query, res);
    }
  }
});

function queryDbForAllData(query, res) {
  pool.getConnection((err, connection) => {
    connection.query(query, function(err, results) {
      if(err) {
        console.log("error: " + err);
      } else {

        var obj = {};
        obj["data"] = results[0].rowCount;
        returnArray.push(obj);
        delete results;
        if(returnArray.length == 1600) {
          sendResponse(res);
        }
      }
    connection.release();
    });
  });
}

function sendResponse(res) {
  console.log("Sending response!");
  res.send(returnArray);
}

/** Only get the data between these coords **/
app.get("/get/location/minLat/:minLat/maxLat/:maxLat/minLong/:minLong/maxLong/:maxLong", function(req, res) {

  var minLat = req.params.minLat;
  var maxLat = req.params.maxLat;
  var minLong = req.params.minLong;
  var maxLong = req.params.maxLong;

  console.log("/get/location request recieved minLat:" + minLat + " maxLat:" + maxLat + " minLong:" + minLong + " maxLong:" + maxLong);

  var query = "SELECT LatNS, LonEW, YYYYMMDDHH FROM hurricane_data WHERE (LatNS BETWEEN " + minLat + " AND " + maxLat + ") AND (LonEW BETWEEN " + minLong + " AND " + maxLong + " ) ORDER BY LatNS, LonEW, YYYYMMDDHH;";
  queryDBForLocationData(query, res);
});

function queryDBForLocationData(query, res) {
  pool.getConnection((err, connection) => {
    connection.query(query, function(err, results) {
      if(err) {
        console.log("error: " + err);
      } else {
          if(results.length === 0) {
            console.log("No results. returning empty array");
            res.send([]);
          } else {
            res.send(results);
          }
      }
    connection.release();
    });
  });
}

app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});
