const express = require('express');
const fs = require("fs");
const errorHandler = require('./middleware/error');
const app = express();
const asyncHandler = require('./middleware/async');
const xml2json = require('xml2json');
app.use(express.json());

app.get('/v1/area/locations', asyncHandler(async (req, res, next) => {
  const { day, type } = req.query;
  console.log('day', day);
  console.log('type', type);
  const xml_data = fs.readFileSync(__dirname + "/../data.xml", "utf8");
  const obj = xml2json.toJson(xml_data, { object: true });
  const { product: { forecast: { area } } } = obj;

  const results = area.reduce((acc, cur) => {
    let locationForecast = {};

    if (cur["forecast-period"] && Array.isArray(cur["forecast-period"])) {
      const periodObject = cur["forecast-period"].find(fp => fp["index"] == day); //intentional
      if(periodObject) {
        if(periodObject["text"]) {
          let forecast = null;
          if(Array.isArray(periodObject["text"])) {
            forecast= periodObject["text"].find(fc => fc["type"] === type);
            if (forecast["$t"]) {
              locationForecast[`${cur.description}`] = forecast["$t"];
            }
          } else {
            if(periodObject["text"]["type"] === type) {
              locationForecast[`${cur.description}`] = periodObject["text"]["$t"];
            }
          }
        }

      }
      
    }
    acc = {...acc, ...locationForecast };
    return acc;
  }, {})
  //console.log(result);
  res.status(200).json(results);
}));

app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(
  PORT,
  console.log(`Server running on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

