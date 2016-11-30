var app = require("express")();
var http = require("http").Server(app);
var mysql = require("mysql");

const port = 8080;
var SELECT_BETWEEN = "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN ? AND ?) AND (LonEW BETWEEN ? AND ?)";
// "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN -200.0 AND 0.0) AND (LonEW BETWEEN 1600 AND 1800)"

const min_lat = 0.0;
const max_lat = -10;
const min_long = 1600;
const max_long = 1610;

const pool = mysql.createPool({
   connectionLimit: 25,
   host: '45.55.77.74',
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

    // for(var lat = min_lat; lat >= max_lat; lat -= 0.5) {
    //   for(var lon = min_long; lon <= max_long; lon += 0.5) {
    //     //skip the first loop to prevent getting values between 0 and 0
    //       if(lat == min_lat && lon == min_long) {
    //         continue;
    //       }

          // pool.getConnection((err, connection) => {
          //   connection.query(SELECT_BETWEEN, [max_lat, min_lat, min_long, max_long], function(err, results) {
          //     if(err) {
          //           console.log("error: " + err);
          //         } else {
          //           var obj = {};
          //
          //           console.log("COUNT: " + results[0].rowCount);
          //           obj["data"] = results[0].rowCount;
          //
          //           delete results;
          //           returnArray.push(obj);
          //       }
          //     connection.release();
          //   });
          // });

          var query = "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN " + max_lat + " AND " + min_lat + ") AND (LonEW BETWEEN " + min_long + " AND " + max_long + ");";
          console.log(query);
          pool.getConnection((err, connection) => {
            connection.query(query, function(err, results) {
              if(err) {
                        console.log("error: " + err);
                      } else {
                        var obj = {};

                        console.log("COUNT: " + JSON.stringify(results));
                        obj["data"] = results[0].rowCount;

                        delete results;
                        returnArray.push(obj);
                    }
                  connection.release();
                });
          });


        //   connection.query(SELECT_BETWEEN, [lat - 0.5, lat, lon - 0.5, lon], function(err, results) {
        //     if(err) {
        //       console.log("error: " + err);
        //     } else {
        //       var obj = {};
        //       obj["data"] = results.length;
        //
        //       delete results;
        //       returnArray.push(obj);
        //   }
        // });
    //   }
    // }

    // while (returnArray.length == 40) {
    //   res.send(returnArray);
    // }

    res.send(returnArray);
});

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
