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

  Person.getFullNames = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const pipeline = [
      {
        $project: {
          _id: 0,
          gender: 1,
          fullName: {
            $concat: [
              { $toUpper: { $substrCP: ["$name.first", 0, 1] } },
              {
                $substrCP: [
                  "$name.first",
                  1,
                  { $subtract: [{ $strLenCP: "$name.first" }, 1] },
                ],
              },
              " ",
              { $toUpper: { $substrCP: ["$name.last", 0, 1] } },
              {
                $substrCP: [
                  "$name.last",
                  1,
                  { $subtract: [{ $strLenCP: "$name.last" }, 1] },
                ],
              },
            ],
          },
        },
      },
    ];
    const people = await collection.aggregate(pipeline);
    return people.toArray();
  };

  Person.remoteMethod("getFullNames", {
    returns: { arg: "data" },
    http: { path: "/full-names", verb: "get" },
  });

  Person.getCoordinates = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const pipeline = [
      {
        $project: {
          _id: 0,
          email: 1,
          location: {
            type: "Point",
            coordinates: [
              {
                $convert: {
                  input: "$location.coordinates.longitude",
                  to: "double",
                  onError: 0.0,
                  onNull: 0.0,
                },
              },
              {
                $convert: {
                  input: "$location.coordinates.latitude",
                  to: "double",
                  onError: 0.0,
                  onNull: 0.0,
                },
              },
            ],
          },
        },
      },
    ];
    const people = await collection.aggregate(pipeline);
    return people.toArray();
  };

  Person.remoteMethod("getCoordinates", {
    returns: { arg: "data" },
    http: { path: "/coordinates", verb: "get" },
  });

  Person.getBirthday = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const pipeline = [
      {
        $project: {
          birthdate: { $toDate: "$dob.date" },
          age: "$dob.age",
        },
      },
      {
        $group: {
          _id: { birthYear: { $isoWeekYear: "$birthdate" } },
          numPersons: { $sum: 1 },
        },
      },
      {
        $sort: { numPersons: -1 },
      },
    ];
    const people = await collection.aggregate(pipeline);
    return people.toArray();
  };

  Person.remoteMethod("getBirthday", {
    returns: { arg: "data" },
    http: { path: "/birthday", verb: "get" },
  });

  Person.getBucket = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const pipeline = [
      {
        $bucket: {
          groupBy: "$dob.age",
          boundaries: [18, 30, 40, 50, 60, 120],
          output: {
            numPersons: { $sum: 1 },
            averageAge: { $avg: "$dob.age" },
          },
        },
      },
    ];
    const people = await collection.aggregate(pipeline);
    return people.toArray();
  };

  Person.remoteMethod("getBucket", {
    returns: { arg: "data" },
    http: { path: "/bucket", verb: "get" },
  });

  Person.getBucketAuto = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const pipeline = [
      {
        $bucketAuto: {
          groupBy: "$dob.age",
          buckets: 5,
          output: {
            numPersons: { $sum: 1 },
            averageAge: { $avg: "$dob.age" },
          },
        },
      },
    ];
    const people = await collection.aggregate(pipeline);
    return people.toArray();
  };

  Person.remoteMethod("getBucketAuto", {
    returns: { arg: "data" },
    http: { path: "/bucket-auto", verb: "get" },
  });

  Person.getPaginated = async () => {
    const db = await dbConnect();
    const collection = db.collection("Person");
    const pipeline = [
      {
        $project: {
          _id: 0,
          name: { $concat: ["$name.first", " ", "$name.last"] },
          birthdate: { $toDate: "$dob.date" },
        },
      },
      { $sort: { birthdate: 1 } },
      { $skip: 10 },
      { $limit: 10 },
    ];
    const people = await collection.aggregate(pipeline);
    return people.toArray();
  };

  Person.remoteMethod("getPaginated", {
    returns: { arg: "data" },
    http: { path: "/paginated", verb: "get" },
  });
};
