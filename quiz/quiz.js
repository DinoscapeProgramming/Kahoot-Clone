const crypto = require('crypto');
const util = require('./util.js');
const Database = require('@replit/database');
const db = new Database();

function createGame(userId, { username, questions }) {
  return new Promise((resolve, reject) => {
    if (typeof userId !== "string") return resolve({ action: "createGame", err: "Invalid user id" });
    if (
      !Array.isArray(questions) || (questions.length < 1) || questions.some((question) => 
        (
          !Array.isArray(question)
        ) || (
          question.length !== 2
        ) || (
          typeof question[0] !== "string"
        ) || (
          !Array.isArray(question[1])
        ) || (
          question[1].length !== 4
        ) || (
          question[1].some((answer) =>
            (
              !Array.isArray(answer)
            ) || (
              answer.length !== 2
            ) || (
              typeof answer[0] !== "string"
            ) || (
              typeof answer[1] !== "boolean"
            )
          )
        )
      )
    ) return resolve({ action: "createGame", err: "Invalid questions" });
    db.get("games").then((games) => {
      var gameId = util.randomGameId(8);
      db.set("games", {
        ...games || {},
        ...{
          [gameId]: {
            creator: userId,
            started: false,
            users: [
              [
                userId,
                {
                  username,
                  answers: []
                }
              ]
            ],
            questions,
            currentQuestion: 0
          }
        }
      }).then(() => {
        return resolve({ action: "createGame", userId, username, questions, gameId });
      });
    });
  });
}

function deleteGame(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "deleteGame", err: "Invalid game id" });
      if (games[gameId].creator !== userId) return resolve({ action: "deleteGame", err: "Invalid user id" });
      db.set("games", Object.entries(games).filter((game) => game[0] !== gameId).reduce((args, game) => ({
        ...args,
        ...{
          [game[0]]: game[1]
        }
      }), {})).then(() => {
        return resolve({ action: "deleteGame", userId, gameId, users: games[gameId].users });
      });
    });
  });
}

function joinGame(userId, { gameId, username }) {
  return new Promise((resolve, reject) => {
    if (typeof userId !== "string") return resolve({ action: "createGame", err: "Invalid user id" });
    if (typeof username !== "string") return resolve({ action: "joinGame", err: "Invalid username" });
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ 
action: "joinGame", err: "Invalid game id" });
      if (games[gameId].started === true) return resolve({ action: "joinGame", err: "Game already started" });
      db.set("games", {
        ...games,
        ...{
          [gameId]: {
            ...games[gameId],
            ...{
              users: [
                ...new Set([
                  ...games[gameId].users,
                  ...[
                    [
                      userId,
                      {
                        username,
                        answers: []
                      }
                    ]
                  ]
                ])
              ]
            }
          }
        }
      }).then(() => {
        return resolve({ action: "joinGame", userId, gameId, username });
      });
    });
  });
}

function leaveGame(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "leaveGame", err: "Invalid game id" });
      if ((typeof userId !== "string") || (!games[gameId].users.some((user) => user[0] === userId))) return resolve({ action: "leaveGame", err: "Invalid user id" });
      ((games[gameId].creator !== userId) ? db.set("games", {
        ...games,
        ...{
          [gameId]: {
            ...games[gameId],
            ...{
              users: games[gameId].users.filter((user) => user[0] !== userId)
            }
          }
        }
      }) : deleteGame(userId, { gameId })).then(() => {
        return resolve({ action: "leaveGame", userId, gameId, ended: games[gameId].creator === userId });
      });
    });
  });
}

function startGame(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "startGame", err: "Invalid game id" });
      if (games[gameId].creator !== userId) return resolve({ action: "startGame", err: "Invalid user id" });
      db.set("games", {
        ...games,
        ...{
          [gameId]: {
            ...games[gameId],
            ...{
              started: true
            }
          }
        }
      }).then(() => {
        return resolve({ action: "startGame", userId, gameId, question: [games[gameId].questions[0][0], games[gameId].questions[0][1].map((answer) => answer[0])] });
      });
    });
  });
}

function answerQuestion(userId, { gameId, answer }) {
  return new Promise((resolve, reject) => {
    if (!["1", "2", "3", "4"].includes(answer)) return resolve({ action: "answerQuestion", err: "Invalid answer" });
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "answerQuestion", err: "Invalid game id" });
      if ((typeof userId !== "string") || (!games[gameId].users.some((user) => user[0] === userId))) return resolve({ action: "answerQuestion", err: "Invalid user id" });
      db.set("games", {
        ...games,
        ...{
          [gameId]: {
            ...games[gameId],
            ...{
              users: games[gameId].users.map((user) => 
                (
                  user[0] === userId
                ) ? [
                  user[0],
                  {
                    ...user[1],
                    ...{
                      answers: [
                        ...user[1].answers,
                        ...[
                          games[gameId].questions[games[gameId].currentQuestion][1][Number(answer) - 1][1] || false
                        ]
                      ]
                    }
                  }
                ] : user
              )
            }
          }
        }
      }).then(() => {
        return resolve({ action: "answerQuestion", userId, gameId, answer, answers: games[gameId].questions[games[gameId].currentQuestion][1].map((answer) => answer[1]) });
      });
    });
  });
}

function nextQuestion(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "nextQuestion", err: "Invalid game id" });
      if (games[gameId].creator !== userId) return resolve({ action: "nextQuestion", err: "Invalid user id" });
      (((games[gameId].currentQuestion + 1) !== (games[gameId].questions.length)) ? db.set("games", {
        ...games,
        ...{
          [gameId]: {
            ...games[gameId],
            ...{
              currentQuestion: games[gameId].currentQuestion + 1,
              users: games[gameId].users.map((user) => (
                user[1].length !== (games[gameId].currentQuestion + 1)
              ) ? [
                user[0],
                {
                  ...user[1],
                  ...{
                    answers: [
                      ...user[1].answers,
                      ...[
                        false
                      ]
                    ]
                  }
                }
              ] : user)
            }
          }
        }
      }) : deleteGame(userId, { gameId })).then(() => {
        return resolve({
          ...{
            action: "nextQuestion",
            userId,
            gameId,
            questionLength: games[gameId].questions.length.toString(),
            ended: (games[gameId].currentQuestion + 1) === (games[gameId].questions.length)
          },
          ...(games[gameId].currentQuestion + 1) === (games[gameId].questions.length) ? {
            leaderboard: games[gameId].users.map((user) => (
                user[1].answers.length !== (games[gameId].currentQuestion + 1)
              ) ? [
                user[0],
                {
                  ...user[1],
                  ...{
                    answers: [
                      ...user[1].answers,
                      ...[
                        false
                      ]
                    ]
                  }
                }
              ] : user).sort((firstUser, secondUser) => secondUser[1].answers.reduce((total, answer) => total + answer, 0) - firstUser[1].answers.reduce((total, answer) => total + answer, 0))
          } : {},
          ...(games[gameId].currentQuestion + 1) !== (games[gameId].questions.length) ? {
            question: [games[gameId].questions[games[gameId].currentQuestion + 1][0], games[gameId].questions[games[gameId].currentQuestion + 1][1].map((answer) => answer[0])]
          } : {}
        });
      });
    });
  });
}

function getGame(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "getGame", err: "Invalid game id" });
      if ((typeof userId !== "string") || (!games[gameId].users.some((user) => user[0] === userId))) return resolve({ action: "getGame", err: "Invalid user id" });
      return resolve({ action: "getGame", game: games[gameId] });
    });
  });
}

function getUsers(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "getUsers", err: "Invalid game id" });
      if ((typeof userId !== "string") || (!games[gameId].users.some((user) => user[0] === userId))) return resolve({ action: "getUsers", err: "Invalid user id" });
      return resolve({ action: "getUsers", users: games[gameId].users });
    });
  });
}

function getLeaderboard(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    getUsers(userId, { gameId }).then(({ err, users }) => {
      if (err) return resolve({ action: "getLeaderboard", err });
      return resolve({ action: "getLeaderboard", leaderboard: users.sort((firstUser, secondUser) => secondUser[1].answers.reduce((total, answer) => total + answer, 0) - firstUser[1].answers.reduce((total, answer) => total + answer, 0)) });
    });
  });
}

function getCurrentQuestion(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "getUsers", err: "Invalid game id" });
      if ((typeof userId !== "string") || (!games[gameId].users.some((user) => user[0] === userId))) return resolve({ action: "getUsers", err: "Invalid user id" });
      return resolve({
        action: "getCurrentQuestion",
        question: [
          games[gameId].questions[games[gameId].currentQuestion][0],
          games[gameId].questions[games[gameId].currentQuestion][1].map((answer) => answer[0])
        ]
      });
    });
  });
}

function isCreator(userId, { gameId }) {
  return new Promise((resolve, reject) => {
    db.get("games").then((games) => {
      if (!Object.keys(games || {}).includes(gameId)) return resolve({ action: "isCreator", err: "Invalid game id" });
      return resolve({ action: "isCreator", isCreator: (games[gameId].creator === userId) });
    });
  });
}

function publishQuiz({ name, image, questions }) {
  return new Promise((resolve, reject) => {
    if (typeof name !== "string") return resolve({ action: "publishQuiz", err: "Invalid name" });
    if (
      !Array.isArray(questions) || (questions.length < 1) || questions.some((question) => 
        (
          !Array.isArray(question)
        ) || (
          question.length !== 2
        ) || (
          typeof question[0] !== "string"
        ) || (
          !Array.isArray(question[1])
        ) || (
          question[1].length !== 4
        ) || (
          question[1].some((answer) =>
            (
              !Array.isArray(answer)
            ) || (
              answer.length !== 2
            ) || (
              typeof answer[0] !== "string"
            ) || (
              typeof answer[1] !== "boolean"
            )
          )
        )
      )
    ) return resolve({ action: "publishQuiz", err: "Invalid questions" });
    db.get("quizzes").then((quizzes) => {
      crypto.randomBytes(4, (err, quizId) => {
        if (err) return resolve({ action: "publishQuiz", err: err.message });
        db.set("quizzes", {
          ...quizzes,
          ...{
            [quizId.toString("hex")]: [
              name,
              {
                ...{
                  questions
                },
                ...(util.isURL(image)) ? {
                  image
                } : {}
              }
            ]
          }
        }).then(() => {
          return resolve({ ...{ action: "publishQuiz", name, questions, quizId: quizId.toString("hex") }, ...(image) ? { image } : {} });
        });
      });
    });
  });
}

module.exports = {
  db,
  createGame,
  deleteGame,
  joinGame,
  leaveGame,
  startGame,
  answerQuestion,
  nextQuestion,
  getGame,
  getUsers,
  getLeaderboard,
  getCurrentQuestion,
  isCreator,
  publishQuiz
}