"use strict";

const app = require("../../server/server");

// $geoNear requires a 2d or 2dsphere index
// db.CoordinatedPerson.createIndex({location: "2dsphere"})

const dbConnect = () =>
  new Promise((resolve, reject) => {
    const model = app.models.CoordinatedPerson;
    model.getDataSource().connector.connect((err, db) => {
      if (err) return reject(err);
      resolve(db);
    });
  });

module.exports = function (CoordinatedPerson) {
  CoordinatedPerson.getCoordinatesNearPoint = async () => {
    const db = await dbConnect();
    const collection = db.collection("CoordinatedPerson");
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [-51.5, -55.6666],
          },
          maxDistance: 100000,
          $limit: 10,
          distanceField: "distance",
        },
      },
    ];
    const people = await collection.aggregate(pipeline);
    return people.toArray();
  };

  CoordinatedPerson.remoteMethod("getCoordinatesNearPoint", {
    returns: { arg: "data" },
    http: { path: "/coordinates-near-point", verb: "get" },
  });
};
