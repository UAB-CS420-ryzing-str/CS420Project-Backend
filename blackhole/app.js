var app = require("express")();
var http = require("http").Server(app);
var mysql = require("mysql");
var config = require('./config.json');

const port = 8080;
const min_lat = 0.0;
const max_lat = -200;
const min_long = 1600;
const max_long = 1800;
const pool = mysql.createPool(config.database);

 pool.on('connection', (connection)=>{
  console.log('Connection Made!');
 });

 var SELECT_BETWEEN = "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN ? AND ?) AND (LonEW BETWEEN ? AND ?)";
 var returnArray = [];

app.get("/", function(req, res) {
  res.send("Hello, World!");
});

app.get("/health", function(req, res) {
  res.send("Sex, Drugs, Rock & Roll!");
});

/** Only get the data between these coords **/
app.get("/get/location/minLat/:minLat/maxLat/:maxLat/minLong/:minLong/maxLong/:maxLong", function(req, res) {

  var minLat = req.params.minLat * 10;
  var maxLat = req.params.maxLat * 10;
  var minLong = req.params.minLong * 10;
  var maxLong = req.params.maxLong * 10;

  console.log("/get/location request recieved minLat:" + minLat + " maxLat:" + maxLat + " minLong:" + minLong + " maxLong:" + maxLong);

  var resultIndex = 0;
  var counterObj = { counter: 0 };
  for(var current_lat = maxLat - 5; current_lat >= minLat; current_lat -= 5) {
    for(var current_long = minLong + 5; current_long <= maxLong; current_long += 5) {
      var lat_back_step = current_lat + 5;
      var long_back_step = current_long - 5;

      var query = "SELECT LatNS, LonEW, YYYYMMDDHH FROM hurricane_data WHERE (LatNS BETWEEN " + current_lat + " AND " + lat_back_step + ") AND (LonEW BETWEEN " + long_back_step + " AND " + current_long + ");";
      queryDbForAllData(query, resultIndex, counterObj, res);
      resultIndex++;
    }
  }
});

function queryDbForAllData(query, resultIndex, counterObj, res) {
  pool.getConnection((err, connection) => {
    connection.query(query, function(err, results) {
      counterObj.counter++;
      console.log('Query Done: ' + counterObj.counter);
      if(err) {
        console.log("error: " + err);
      } else {
        var obj = {};
        obj["count"] = results.length;
        obj["data"] = results;
        obj["index"] = resultIndex;
        returnArray[resultIndex] = obj;
        delete results;

        if(counterObj.counter == 1600) {
          sendReturnArray(res);
        }
      }
    connection.release();
    });
  });
}

function sendReturnArray(res) {
  console.log("Sending response!");
  res.send(returnArray);
  //reset return array
  returnArray = [];
}

 var server = app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});

module.exports = server;
