var app = require("express")();
var http = require("http").Server(app);
var mysql = require("mysql");

const port = 8080;
var SELECT_BETWEEN = "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN ? AND ?) AND (LonEW BETWEEN ? AND ?)";
// "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN -200.0 AND 0.0) AND (LonEW BETWEEN 1600 AND 1800)"

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

 var returnArray = [];

app.get("/", function(req, res) {
  res.send("Hello, World!");
});

app.get("/health", function(req, res) {
  res.send("Sex, Drugs, Rock & Roll!");
});

/** Get ALL the data **/
app.get("/getData", function(req, res) {

  console.log("REQUEST RECIEVED!!");
  // var returnArray = [];

  for(var current_lat = min_lat; current_lat >= max_lat; current_lat -= 5) {
    for(var current_long = min_long; current_long <= max_long; current_long += 5) {

      var lat_back_step = current_lat + 5;
      var long_back_step = current_long - 5;
      var query = "SELECT COUNT(*) as rowCount FROM hurricane_data WHERE (LatNS BETWEEN " + current_lat + " AND " + lat_back_step + ") AND (LonEW BETWEEN " + long_back_step + " AND " + current_long + ");";
      console.log("BUILT QUERY: " + query);
      console.log("");
      pool.getConnection((err, connection) => {
        connection.query(query, function(err, results) {
          if(err) {
                    console.log("error: " + err);
                  } else {
                    var obj = {};

                    console.log("COUNT: " + JSON.stringify(results));
                    callback(results, res);
                }
              connection.release();
            });
      });

    }
  }

    // res.send(returnArray);
});

function callback(data, res) {
  var obj = {};
  obj["data"] = data[0].rowCount;
  returnArray.push(obj);
  delete results;

  if(returnArray.length == 1600) {
    sendArray(res);
  }
}

function sendArray(res) {
  res.send(returnArray);
}

/** Only get the data between these coords **/
app.get("/get/location/:minLat/:maxLat/:minLong/:maxLong", function(req, res) {
  console.log("REQUEST RECIEVED");

  var returnArray = [];

  connection.query(SELECT_BETWEEN, [req.params.minLat, req.params.maxLat, req.params.minLong, req.params.maxLong], function(err, results) {
    if(err) {
      console.log("error: " + err);
    } else {
        if(results.length > 0) {
          returnArray = results;
        }
    }
  });

  res.send(returnArray);
});

app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});
