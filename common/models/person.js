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
    const pipeline = [{ $match: { gender: "female" } }];
    const female = await collection.aggregate(pipeline);
    return female.toArray();
  };

  Person.remoteMethod("getFemale", {
    returns: { arg: "data" },
    http: { path: "/female", verb: "get" },
  });
};

module.exports = function (Person) {
  Person.getGroupedByState = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const pipeline = [
      { $match: { gender: "female" } },
      {
        $group: {
          _id: { state: "$location.state" },
          totalPersons: { $sum: 1 },
        },
      },
      { $sort: { totalPersons: -1 } },
    ];
    const female = await collection.aggregate(pipeline);
    return female.toArray();
  };

  Person.remoteMethod("getGroupedByState", {
    returns: { arg: "data" },
    http: { path: "/grouped-by-state", verb: "get" },
  });
};

module.exports = function (Person) {
  Person.getFullNames = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const pipeline = [
      {
        $project: {
          _id: 0,
          gender: 1,
          fullName: { $concat: ["Hello", "World!!"] },
        },
      },
    ];
    const female = await collection.aggregate(pipeline);
    return female.toArray();
  };

  Person.remoteMethod("getFullNames", {
    returns: { arg: "data" },
    http: { path: "/full-names", verb: "get" },
  });
};
