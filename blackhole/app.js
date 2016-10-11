var express = require("express");
const port = 8080;

var app = express();
var http = require("http").Server(app);


app.get("/", function(req, res) {
  res.send("Hello, World!");
});

app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});
