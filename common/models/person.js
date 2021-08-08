"use strict";

const app = require("../../server/server");

const dbConnect = () =>
  new Promise((resolve, reject) => {
    const model = app.models.Person;
    model.getDataSource().connector.connect((err, db) => {
      if (err) return reject(err);
      resolve(db);
    });
  });

// const people = await collection.find();
// const person = await Person.findOne();

module.exports = function (Person) {
  Person.getFemale = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const female = await collection.aggregate([
      { $match: { gender: "female" } },
    ]);
    return female.toArray();
  };

  Person.remoteMethod("getFemale", {
    returns: { arg: "data" },
    http: { path: "/female", verb: "get" },
  });
};
