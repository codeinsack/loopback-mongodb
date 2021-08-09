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

  Pupil.getFirstExam = async () => {
    const db = await dbConnect();
    const collection = db.collection("Pupil");
    const pipeline = [
      {
        $project: { _id: 0, examScore: { $slice: ["$examScores", 1] } },
      },
    ];
    const pupils = await collection.aggregate(pipeline);
    return pupils.toArray();
  };

  Pupil.remoteMethod("getFirstExam", {
    returns: { arg: "data" },
    http: { path: "/first-exam", verb: "get" },
  });

  Pupil.getScoresNumber = async () => {
    const db = await dbConnect();
    const collection = db.collection("Pupil");
    const pipeline = [
      {
        $project: { _id: 0, name: 1, numScores: { $size: "$examScores" } },
      },
    ];
    const pupils = await collection.aggregate(pipeline);
    return pupils.toArray();
  };

  Pupil.remoteMethod("getScoresNumber", {
    returns: { arg: "data" },
    http: { path: "/scores-number", verb: "get" },
  });

  Pupil.getFilteredExamScores = async () => {
    const db = await dbConnect();
    const collection = db.collection("Pupil");
    const pipeline = [
      {
        $project: {
          _id: 0,
          name: 1,
          examScores: {
            $filter: {
              input: "$examScores",
              as: "sc",
              cond: { $gt: ["$$sc.score", 60] },
            },
          },
        },
      },
    ];
    const pupils = await collection.aggregate(pipeline);
    return pupils.toArray();
  };

  Pupil.remoteMethod("getFilteredExamScores", {
    returns: { arg: "data" },
    http: { path: "/filtered-exam-scores", verb: "get" },
  });
};
