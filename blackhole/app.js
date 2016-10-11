const port = 8080;
var app = require("express")();
var http = require("http").Server(app);

//TODO: replace with real stuff.. 
app.get("/", function(req, res) {
  res.send("Hello, World!");
});

app.get("/health", function(req, res) {
  res.send("Sex, Drugs, Rock & Roll!");
});

app.listen(port, function() {
  console.log("Blackhole listening on port =" + port);
});
