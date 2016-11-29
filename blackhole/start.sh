#!/bin/sh

#Starting Main JS
pm2 start ./app.js --name "CS420-Server" --log-date-format "MM-DD-YYYY HH:mm:ss" --output "./logs/server.log" --error "./logs/error.log"
