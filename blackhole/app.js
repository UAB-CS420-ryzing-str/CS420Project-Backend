const app = require("express")();
const http = require("http").Server(app);
const mysql = require("mysql");
const Promise = require("bluebird");
const config = require('./config.json');

const port = 8080;
const min_lat = 0.0;
const max_lat = -200;
const min_long = 1600;
const max_long = 1800;
const pool = mysql.createPool(config.database);

// var SELECT_BETWEEN = "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN ? AND ?) AND (LonEW BETWEEN ? AND ?)";
let returnArray = [];

app.get("/", (req, res)=>{
  res.send("Hello, World!");
});

app.get("/health", (req, res)=>{
  res.send("Sex, Drugs, Rock & Roll!");
});

/** Only get the data between these coords **/
app.get("/get/location/minLat/:minLat/maxLat/:maxLat/minLong/:minLong/maxLong/:maxLong", (req, res)=>{

  console.log(req.params);

  const minLat = req.params.minLat * 10;
  const maxLat = req.params.maxLat * 10;
  const minLong = req.params.minLong * 10;
  const maxLong = req.params.maxLong * 10;

  console.log("/get/location request recieved minLat:" + minLat + " maxLat:" + maxLat + " minLong:" + minLong + " maxLong:" + maxLong);

  var querys = [];
  var queryIndex = 0;
  for(var current_lat = maxLat - 5; current_lat >= minLat; current_lat -= 5) {
    for(var current_long = minLong + 5; current_long <= maxLong; current_long += 5) {
      const lat_back_step = current_lat + 5;
      const long_back_step = current_long - 5;

      const query = "SELECT LatNS, LonEW, YYYYMMDDHH FROM hurricane_data WHERE (LatNS BETWEEN " + current_lat + " AND " + lat_back_step + ") AND (LonEW BETWEEN " + long_back_step + " AND " + current_long + ");";
      querys.push(queryDbForAllData(query, queryIndex, res));
      queryIndex++;
    }
  }

  Promise.all(querys)
    .then((data)=>{
      console.log(`Sending response Length:${data.length}!`);
      res.send(data);
    });
});

const queryDbForAllData = (query, queryIndex, res) => new Promise((resolve, reject)=> {
  pool.getConnection((err, connection) => {
    connection.query(query, (err, results)=> {
      if(err){ console.error("error: " + err);}
      else {
        var obj = {};
        obj["count"] = results.length;
        obj["data"] = results;
        obj["index"] = queryIndex;
        delete results;

        resolve(obj);
      }
      connection.release();
    });
  });
});

const server = app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});
