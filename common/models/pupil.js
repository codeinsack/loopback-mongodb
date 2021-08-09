"use strict";

const app = require("../../server/server");

const dbConnect = () =>
  new Promise((resolve, reject) => {
    const model = app.models.Pupil;
    model.getDataSource().connector.connect((err, db) => {
      if (err) return reject(err);
      resolve(db);
    });
  });

module.exports = function (Pupil) {
  Pupil.getHobbiesGroupedByAge = async () => {
    const db = await dbConnect();
    const collection = db.collection("Pupil");
    const pipeline = [
      { $unwind: "$hobbies" },
      {
        $group: { _id: { age: "$age" }, allHobbies: { $addToSet: "$hobbies" } },
      },
    ];
    const pupils = await collection.aggregate(pipeline);
    return pupils.toArray();
  };

  Pupil.remoteMethod("getHobbiesGroupedByAge", {
    returns: { arg: "data" },
    http: { path: "/grouped-by-age", verb: "get" },
  });
};
