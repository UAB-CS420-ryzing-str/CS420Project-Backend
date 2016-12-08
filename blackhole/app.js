const app = require("express")();
const http = require("http").Server(app);
const mysql = require("mysql");
const Promise = require("bluebird");
const multer = require('multer');
const fs = Promise.promisifyAll(require("fs"));
const config = require('./config.json');

const port = 8080;
const min_lat = 0.0;
const max_lat = -200;
const min_long = 1600;
const max_long = 1800;

const pool = mysql.createPool(config.database);
const upload = multer({
    dest: 'uploads/'
})

// var SELECT_BETWEEN = "SELECT COUNT(*) FROM hurricane_data WHERE (LatNS BETWEEN ? AND ?) AND (LonEW BETWEEN ? AND ?)";
let returnArray = [];

app.get("/datasets", (req, res) => {

  console.log("GET dataset request recieved");
  const query = "SELECT distinct dataset FROM cs420.hurricane_data";
  pool.getConnection((err, connection) => {
    connection.query(query, (err, results) => {
        if (err) {
            console.log("ERROR: " + err);
        }

        let returnArray = [];

        results.forEach((result)=>{
          returnArray.push(result.dataset);
        });

        res.send(returnArray);
    });
    connection.release();
  });
});

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.get("/health", (req, res) => {
    res.send("Sex, Drugs, Rock & Roll!");
});

/** Only get the data between these coords **/
app.get("/get/location/minLat/:minLat/maxLat/:maxLat/minLong/:minLong/maxLong/:maxLong/dataset/:dataSet", (req, res) => {

    console.log(req.params);

    const minLat = req.params.minLat * 10;
    const maxLat = req.params.maxLat * 10;
    const minLong = req.params.minLong * 10;
    const maxLong = req.params.maxLong * 10;
    const ds = req.params.dataSet;

    console.log("/get/location request recieved minLat:" + minLat + " maxLat:" + maxLat + " minLong:" + minLong + " maxLong:" + maxLong);

    var querys = [];
    var queryIndex = 0;
    for (var current_lat = maxLat - 5; current_lat >= minLat; current_lat -= 5) {
        for (var current_long = minLong + 5; current_long <= maxLong; current_long += 5) {
            const lat_back_step = current_lat + 5;
            const long_back_step = current_long - 5;

            const query = "SELECT LatNS, LonEW, YYYYMMDDHH FROM hurricane_data WHERE (LatNS BETWEEN " + current_lat + " AND " + lat_back_step + ") AND (LonEW BETWEEN " + long_back_step + " AND " + current_long + ") AND dataset = '" + ds + "';";
            querys.push(queryDbForAllData(query, queryIndex, res));
            queryIndex++;
        }
    }

    Promise.all(querys)
        .then((data) => {
            console.log(`Sending response Length:${data.length}!`);
            res.send(data);
        });
});

const queryDbForAllData = (query, queryIndex, res) => new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
        connection.query(query, (err, results) => {
            if (err) {
                console.error("error: " + err);
            } else {
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


app.post('/upload', upload.array('files'), (req, res) => {
    console.log('Upoading Data');

    for (var i = 0; i < req.files.length; i++) {
        console.log(req.files[i].path);
        getFileContents(req.files[i].path)
            .then(splitLines)
            .map(objectizeResults)
            .map((data)=>{
              insertIntoDB(data, req.body.dataset);
            }, {
                concurrency: 25
            })
            .then(console.log)
            .catch(console.log);
    }

    res.send('OK');
});

const server = app.listen(port, function() {
    console.log("Blackhole listening on port =" + port);
});

const getFileContents = (fileName) => new Promise((resolve, reject) => {
    resolve(fs.readFileSync(fileName, 'utf-8'));
});
const splitLines = (fileString) => new Promise((resolve, reject) => {
    let contentLines = fileString.split('\n').filter((value) => {
        if (value == '') {
            return false
        } else {
            return true
        }
    });

    resolve(contentLines);
});
const expandResults = (resultArray) => new Promise((resolve, reject) => {
    let results = [];
    for (let i = 0; i < resultArray.length; i++) {
        results = results.concat(resultArray[i]);
    }
    resolve(results);
});
const objectizeResults = (resultString) => new Promise((resolve, reject) => {
    const result = resultString.split(',').map((item) => item.trim());

    if (result[result.length - 1] == '\r') result.splice(result.length - 1, 1);

    const resultObject = {};
    resultObject.array = result;

    switch (result.length) {
        default:
            case 35:
            if (/^\d{1,3}$/.test(result[34])) {
                resultObject.SEAS4 = result[34];
            }
        case 34:
                if (/^\d{1,3}$/.test(result[33])) {
                    resultObject.SEAS3 = result[33];
                }
        case 33:
                if (/^\d{1,3}$/.test(result[32])) {
                    resultObject.SEAS2 = result[32];
                }
        case 32:
                if (/^\d{1,3}$/.test(result[31])) {
                    resultObject.SEAS1 = result[31];
                }
        case 31:
                if (/^AAA|NNS|NES|EES|SES|SSS|SWS|WWS|NWS|NNQ|NEQ|EEQ|SEQ|SSQ|SWQ|WWQ|NWQ$/.test(result[30])) {
                    resultObject.SEASCODE = result[30];
                }
        case 30:
                if (/^\d{1,2}$/.test(result[29])) {
                    resultObject.SEAS = result[29];
                }
        case 29:
                if (/^[DMSX]$/.test(result[28])) {
                    resultObject.DEPTH = result[28];
                }
        case 28:
                if (result[27] != '') {
                    resultObject.STORMNAME = result[27];
                }
        case 27:
                if (/^\d{1,3}$/.test(result[26])) {
                    resultObject.SPEED = result[26];
                }
        case 26:
                if (/^\d{1,3}$/.test(result[25])) {
                    resultObject.DIR = result[25];
                }
        case 25:
                if (/^[A-Z]{1,3}$/.test(result[24])) {
                    resultObject.INITIALS = result[24];
                }
        case 24:
                if (/^\d{1,3}$/.test(result[23])) {
                    resultObject.MAXSEAS = result[23];
                }
        case 23:
                if (/^[WABSPCEL]$/.test(result[22])) {
                    resultObject.SUBREGION = result[22];
                }
        case 22:
                if (/^\d{1,3}$/.test(result[21])) {
                    resultObject.EYE = result[21];
                }
        case 21:
                if (/^\d{1,3}$/.test(result[20])) {
                    resultObject.GUSTS = result[20];
                }
        case 20:
                if (/^\d{1,3}$/.test(result[19])) {
                    resultObject.MRD = result[19];
                }
        case 19:
                if (/^\d{1,4}$/.test(result[18])) {
                    resultObject.RRP = result[18];
                }
        case 18:
                if (/^\d{3,4}$/.test(result[17])) {
                    resultObject.RADP = result[17];
                }
        case 17:
                if (/^\d{1,4}$/.test(result[16])) {
                    resultObject.RAD4 = result[16];
                }
        case 16:
                if (/^\d{1,4}$/.test(result[15])) {
                    resultObject.RAD3 = result[15];
                }
        case 15:
                if (/^\d{1,4}$/.test(result[14])) {
                    resultObject.RAD2 = result[14];
                }
        case 14:
                if (/^\d{1,4}$/.test(result[13])) {
                    resultObject.RAD1 = result[13];
                }
        case 13:
                if (/^AAA|NNS|NES|EES|SES|SSS|SWS|WWS|NWS|NNQ|NEQ|EEQ|SEQ|SSQ|SWQ|WWQ|NWQ$/.test(result[12])) {
                    resultObject.WINDCODE = result[12];
                }
        case 12:
                if (/^\d{1,3}$/.test(result[11])) {
                    resultObject.RAD = result[11];
                }
        case 11:
                if (/^TD|TS|TY|ST|TC|HU|SD|SS|EX|IN|DS|LO|WV|ET|XX$/.test(result[10])) {
                    resultObject.TY = result[10];
                }
        case 10:
                if (/^\d{1,4}$/.test(result[9])) {
                    resultObject.MSLP = result[9];
                }
        case 9:
                if (/^\d{1,3}$/.test(result[8])) {
                    resultObject.VMAX = result[8];
                }
        case 8:
                if (/^\d{1,4}[WE]$/.test(result[7])) {
                    let lon = result[7].slice(0, -1);
                    if (result[6].slice(-1) == 'W') resultObject.LonEW = '-' + lon;
                    else resultObject.LonEW = lon;
                }
        case 7:
                if (/^\d{1,3}[NS]$/.test(result[6])) {
                    let lat = result[6].slice(0, -1);
                    if (result[6].slice(-1) == 'S') resultObject.LatNS = '-' + lat;
                    else resultObject.LatNS = lat;
                }
        case 6:
                if (/^-*\d{1,3}$/.test(result[5])) {
                    resultObject.TAU = result[5];
                }
        case 5:
                if (/^BEST|WRNG|CARQ$/.test(result[4])) {
                    resultObject.TECH = result[4];
                }
        case 4:
                if (/^\d{1,2}$/.test(result[3])) {
                    resultObject.TECHNUM = result[3];
                }
        case 3:
                if (/^\d{10}$/.test(result[2])) {
                    let timeStamp = `${result[2].substring(0,4)}-${result[2].substring(4,6)}-${result[2].substring(6,8)} ${result[2].substring(8,10)}:00:00`
                    resultObject.YYYYMMDDHH = timeStamp
                }
        case 2:
                if (/^\d{2}$/.test(result[1])) {
                    resultObject.CY = result[1];
                }
        case 1:
                if (/^[A-Z]{2}$/.test(result[0])) {
                    resultObject.BASIN = result[0];
                }
            resolve(resultObject);
            break;
    }

    //resolve(resultObject);

});
const insertIntoDB = (result) => new Promise((resolve, reject) => {
    let SQLString = 'INSERT INTO hurricane_data SET ';

    for (var dataType in result) {
        if (dataType != 'array') {
            SQLString += `${dataType} = '${result[dataType]}', `;
        }
    }



    SQLString = SQLString.slice(0, -2);

    SQLString += `dataset ='${req.body.dataset}'`;

    SQLString += ';';


    if (SQLString == 'INSERT INTO hurricane_data SE;') {
        reject('Fail');
    } else {
      resolve(SQLString);
        // pool.getConnection((err, connection)=> {
        //   connection.query(SQLString, (err, rows, fields)=>{
        //     if (err){
        //       console.log(err);
        //       reject(err)
        //     };
        //     connection.release();
        //     resolve('OK');
        //   });
        // });
    }
});
