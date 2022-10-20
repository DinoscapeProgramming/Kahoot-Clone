const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const ejs = require('ejs');
const quiz = require('./quiz/quiz.js');
const shortcuts = require('npx-shortcut-creator');

quiz.db.delete("games").then(() => {
  shortcuts.createShortcut("games", () => {
    const path = require('path');
    const quiz = require(path.join(process.cwd(), 'quiz/quiz.js'));
    quiz.db.get("games").then((games) => {
      console.log(games);
    });
  }).then(() => {
    shortcuts.createShortcut("quizzes", () => {
      const path = require('path');
      const quiz = require(path.join(process.cwd(), 'quiz/quiz.js'));
      quiz.db.get("quizzes").then((quizzes) => {
        console.log(quizzes);
      });
    });
  });
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use("/pages", express.static("pages"));
app.use("/public", express.static("public"));
app.use("/quizzes", express.static("quizzes"));
app.set("view engine", "ejs");
app.set("views", __dirname);

io.on('connection', (socket, name) => {
  socket.on("createGame", (options) => {
    quiz.createGame(socket.id, options).then((result) => {
      if (!result.err) {
        socket.emit("createGame", result);
      }
    });
  });
  socket.on("deleteGame", (options) => {
    quiz.deleteGame(socket.id, options).then((result) => {
      if (!result.err) {
        result.users.forEach((user) => {
          io.of("/").sockets.get(user[0]).emit("deleteGame", result);
        });
      }
    });
  });
  socket.on("joinGame", (options) => {
    quiz.joinGame(socket.id, options).then((result) => {
      if (!result.err) {
        quiz.getUsers(socket.id, { gameId: result.gameId }).then(({ err, users }) => {
          users.forEach((user) => {
            io.of("/").sockets.get(user[0]).emit("joinGame", {
              ...result,
              ...{ users }
            });
          });
        });
      }
    });
  });
  socket.on("leaveGame", (options) => {
    quiz.getUsers(socket.id, { gameId: options?.gameId }).then(({ users }) => {
      quiz.leaveGame(socket.id, options).then((result) => {
        if (!result.err) {
          users.forEach((user) => {
            io.of("/").sockets.get(user[0]).emit("leaveGame", result);
          });
        };
      });
    });
  });
  socket.on("deleteUser", (options) => {
    quiz.isCreator(socket.id, options).then(({ isCreator }) => {
      if (isCreator) {
        quiz.getUsers(socket.id, { gameId: options?.gameId }).then(({ users }) => {
          quiz.leaveGame(options.userId, options).then((result) => {
            if (!result.err) {
              users.filter((user) => user[0] !== socket.id).forEach((user) => {
                io.of("/").sockets.get(user[0]).emit("leaveGame", result);
              });
            }
          });
        });
      }
    });
  });
  socket.on("startGame", (options) => {
    quiz.startGame(socket.id, options).then((result) => {
      if (!result.err) {
        quiz.getUsers(socket.id, { gameId: result.gameId }).then(({ users }) => {
          users.forEach((user) => {
            io.of("/").sockets.get(user[0]).emit("startGame", result);
          });
        });
      }
    });
  });
  socket.on("answerQuestion", (options) => {
    quiz.answerQuestion(socket.id, options).then((result) => {
      if (!result.err) {
        socket.emit("answerQuestion", result);
      }
    });
  });
  socket.on("nextQuestion", (options) => {
    quiz.getUsers(socket.id, { gameId: options?.gameId }).then(({ users }) => {
      quiz.nextQuestion(socket.id, options).then((result) => {
        if (!result.err) {
          users.forEach((user) => {
            io.of("/").sockets.get(user[0]).emit("nextQuestion", result);
          });
        }
      });
    });
  });
  socket.on("publishQuiz", (options) => {
    quiz.publishQuiz(options).then((result) => {
      if (!result.err) {
        io.emit("publishQuiz", result);
      }
    });
  });
  socket.on("disconnect", () => {
    quiz.db.get("games").then((games) => {
      Object.entries(games || {}).filter((game) => game[1].users.some((user) => user[0] === socket.id)).forEach((game) => {
        quiz.getUsers(socket.id, { gameId: game[0] }).then(({ users }) => {
          quiz.leaveGame(socket.id, { gameId: game[0] }).then((result) => {
            if (!result.err) {
              users.filter((user) => user[0] !== socket.id).forEach((user) => {
                io.of("/").sockets.get(user[0]).emit("leaveGame", result);
              });
            }
          });
        });
      });
    });
  });
});

app.all('/', async (req, res) => {
  quiz.db.get("quizzes").then((quizzes) => {
    res.render("pages/home/index.ejs", { quizzes: JSON.stringify(quizzes || {}) });
  });
});

const listen = http.listen(3000, () => {
  console.log("Server is ready on port", listen.address().port);
});