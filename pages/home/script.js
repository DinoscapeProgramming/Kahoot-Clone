const socket = io();

document.getElementById("joinGameButton").addEventListener("click", () => {
  if (!document.getElementById("joinGameInput").dataset.hasOwnProperty("gameId")) {
    document.getElementById("joinGameInput").dataset.gameId = document.getElementById("joinGameInput").value;
    document.getElementById("joinGameInput").placeholder = "Username";
    document.getElementById("joinGameInput").value = "";
    document.getElementById("joinGameButton").innerText = "Join Game";
  } else {
    socket.emit("joinGame", { gameId: document.getElementById("joinGameInput").dataset.gameId, username: document.getElementById("joinGameInput").value });
  }
});

Array.from(document.getElementById("quizContainer").children).forEach((quiz) => {
  quiz.children[3].addEventListener("click", () => {
    document.getElementById("createGameInput").dataset.questions = quiz.dataset.questions;
    document.getElementById("createGameInput").value = "";
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("quizEditor").style.display = "none";
    document.getElementById("createGameInput").style.display = "block";
    document.getElementById("createGameButton").style.display = "block";
    document.getElementById("createGameButton").innerText = "Create Game";
    document.getElementById("createGameInput").placeholder = "Username";
    document.getElementById("createGameType").style.display = "none";
    document.getElementById("publishQuizButton").style.display = "none";
    document.getElementById("createGameInput").style.marginTop = "";
    document.getElementById("rawJSON").style.display = "none";
  });
});

document.getElementById("createGameButton").addEventListener("click", () => {
  if ((document.getElementById("createGameButton").innerText === "Create Game")) { 
    socket.emit("createGame", {
      username: document.getElementById("createGameInput").value,
      questions: JSON.parse(document.getElementById("createGameInput").dataset.questions) || []
    });
  } else if (document.getElementById("createGameType").value === "url") {
    try {
      new URL(document.getElementById("createGameInput").value);
    } catch {
      return;
    }
    fetch(document.getElementById("createGameInput").value)
    .then((res) => {
      if (res.headers.get("content-type") && (res.headers.get("content-type").indexOf("application/json") !== -1)) {
        return res.json();
      } else {
        return res.text().then((result) => {
          try {
            JSON.parse(result)
          } catch {
            return;
          }
          return JSON.parse(result);
        });
      }
    })
    .then((result) => {
      if (result) {
        document.getElementById("createGameInput").dataset.questions = JSON.stringify(result);
        document.getElementById("createGameInput").value = "";
        document.getElementById("quizContainer").style.display = "none";
        document.getElementById("quizEditor").style.display = "none";
        document.getElementById("createGameInput").style.display = "block";
        document.getElementById("createGameButton").style.display = "block";
        document.getElementById("createGameButton").innerText = "Create Game";
        document.getElementById("createGameInput").placeholder = "Username";
        document.getElementById("createGameType").style.display = "none";
        document.getElementById("publishQuizButton").style.display = "none";
        document.getElementById("rawJSON").style.display = "none";
        document.getElementById("createGameInput").style.marginTop = "";
      }
    });
  } else if (document.getElementById("createGameType").value === "editor") {
    document.getElementById("createGameInput").dataset.questions = JSON.stringify(Array.from(document.getElementById("questions").children).map((question) => [
      question.children[0].value,
      Array.from(question.children[1].children[0].children).filter((_, index) => index !== 0).map((answer) => [
        answer.children[0].children[0].value,
        (answer.children[1].children[0].value === "true") ? true : ((answer.children[1].children[0].value === "false") ? false : null)
      ])
    ]));
    document.getElementById("createGameInput").value = "";
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("quizEditor").style.display = "none";
    document.getElementById("createGameInput").style.display = "block";
    document.getElementById("createGameButton").style.display = "block";
    document.getElementById("createGameButton").innerText = "Create Game";
    document.getElementById("createGameInput").placeholder = "Username";
    document.getElementById("createGameType").style.display = "none";
    document.getElementById("publishQuizButton").style.display = "none";
    document.getElementById("rawJSON").style.display = "none";
    document.getElementById("createGameInput").style.marginTop = "";
  } else if (document.getElementById("createGameType").value === "rawJSON") {
    try {
      JSON.parse(document.getElementById("rawJSONField").value);
    } catch {
      return;
    }
    document.getElementById("createGameInput").dataset.questions = document.getElementById("rawJSONField").value;
    document.getElementById("createGameInput").value = "";
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("quizEditor").style.display = "none";
    document.getElementById("createGameInput").style.display = "block";
    document.getElementById("createGameButton").style.display = "block";
    document.getElementById("createGameButton").innerText = "Create Game";
    document.getElementById("createGameInput").placeholder = "Username";
    document.getElementById("createGameType").style.display = "none";
    document.getElementById("publishQuizButton").style.display = "none";
    document.getElementById("rawJSON").style.display = "none";
    document.getElementById("createGameInput").style.marginTop = "";
  }
});

document.getElementById("startGameButton").addEventListener("click", () => {
  socket.emit("startGame", {
    gameId: document.getElementById("gameId").innerText
  });
});

document.getElementById("leaveGameButton").addEventListener("click", () => {
  socket.emit("leaveGame", {
    gameId: document.getElementById("gameId").innerText
  });
});

socket.on("joinGame", (options) => {
  if (document.getElementById("joinGameContainer").style.display === "flex") {
    document.getElementById("joinGameContainer").style.display = "none";
    document.getElementById("createGameContainer").style.display = "none";
    document.getElementById("questionContainer").style.display = "none";
    document.getElementById("leaderboardContainer").style.display = "none";
    document.getElementById("gameContainer").style.display = "flex";
    document.getElementById("gameId").innerText = options.gameId;
    document.getElementById("users").innerHTML = "";
    options.users.forEach(([userId, { username }]) => {
      var userContainer = document.createElement("div");
      userContainer.className = "userContainer";
      userContainer.dataset.userId = userId;
      var text = document.createElement("h4");
      text.innerText = username;
      text.style.margin = "5px";
      text.style.display = "inline-block";
      if (document.getElementById("gameContainer").dataset.hasOwnProperty("creator")) {
        text.addEventListener("mouseover", () => {
          text.style.textDecoration = 'line-through';
          text.style.cursor = 'pointer';
        });
        text.addEventListener("mouseout", () => {
          text.style.removeProperty('text-decoration');
          text.style.removeProperty('cursor');
        });
        text.addEventListener("click", () => {
          socket.emit("deleteUser", { gameId: document.getElementById("gameId").innerText, userId: text.parentElement.dataset.userId });
        });
      }
      userContainer.appendChild(text);
      document.getElementById("users").appendChild(userContainer);
    });
  } else {
    var userContainer = document.createElement("div");
    userContainer.className = "userContainer";
    userContainer.dataset.userId = options.userId;
    var text = document.createElement("h4");
    text.innerText = options.username;
    text.style.margin = "5px";
    text.style.display = "inline-block";
    if (document.getElementById("gameContainer").dataset.hasOwnProperty("creator")) {
      text.addEventListener("mouseover", () => {
        text.style.textDecoration = 'line-through';
        text.style.cursor = 'pointer';
      });
      text.addEventListener("mouseout", () => {
        text.style.removeProperty('text-decoration');
        text.style.removeProperty('cursor');
      });
      text.addEventListener("click", () => {
        socket.emit("deleteUser", { gameId: document.getElementById("gameId").innerText, userId: text.parentElement.dataset.userId });
      });
    }
    userContainer.appendChild(text);
    document.getElementById("users").appendChild(userContainer);
  }
});

socket.on("createGame", ({ gameId, userId, username }) => {
  document.getElementById("joinGameContainer").style.display = "none";
  document.getElementById("createGameContainer").style.display = "none";
  document.getElementById("questionContainer").style.display = "none";
  document.getElementById("leaderboardContainer").style.display = "none";
  document.getElementById("gameContainer").style.display = "flex";
  document.getElementById("gameContainer").dataset.creator = "";
  document.getElementById("gameId").innerText = gameId;
  document.getElementById("startGameButton").style.display = "block";
  document.getElementById("users").innerHTML = "";
  var userContainer = document.createElement("div");
  userContainer.className = "userContainer";
  userContainer.dataset.userId = userId;
  var text = document.createElement("h4");
  text.innerText = username;
  text.style.margin = "5px";
  text.style.display = "inline-block";
  text.addEventListener("mouseover", () => {
    text.style.textDecoration = 'line-through';
    text.style.cursor = 'pointer';
  });
  text.addEventListener("mouseout", () => {
    text.style.removeProperty('text-decoration');
    text.style.removeProperty('cursor');
  });
  text.addEventListener("click", () => {
    socket.emit("deleteUser", { gameId: document.getElementById("gameId").innerText, userId: text.parentElement.dataset.userId });
  });
  userContainer.appendChild(text);
  document.getElementById("users").appendChild(userContainer);
});

socket.on("startGame", ({ question }) => {
  document.getElementById("joinGameContainer").style.display = "none";
  document.getElementById("createGameContainer").style.display = "none";
  document.getElementById("gameContainer").style.display = "none";
  document.getElementById("leaderboardContainer").style.display = "none";
  document.getElementById("questionContainer").style.display = "block";
  document.getElementById("question").innerText = question[0];
  if (document.getElementById("gameContainer").dataset.hasOwnProperty("creator")) {
    document.getElementById("nextQuestionButton").style.display = "block";
  }
  question[1].forEach((answer, index) => {
    document.getElementById("answers").children[index].removeAttribute("style");
    document.getElementById("answers").children[index].children[0].innerText = answer;
  });
});

socket.on("leaveGame", ({ userId, ended }) => {
  if ((socket.id !== userId) && (!ended)) {
    document.getElementById("users").removeChild(Array.from(document.getElementById("users").children).find((user) => user.dataset.userId === userId));
  } else {
    document.getElementById("questionContainer").style.display = "none";
    document.getElementById("gameContainer").style.display = "none";
    document.getElementById("leaderboardContainer").style.display = "none";
    document.getElementById("joinGameContainer").style.display = "flex";
    document.getElementById("createGameContainer").style.display = "flex";
    document.getElementById("quizContainer").style.display = "block";
    document.getElementById("createGameInput").style.display = "none";
    document.getElementById("joinGameInput").value = "";
    document.getElementById("createGameInput").value = "";
    document.getElementById("createGameButton").innerText = "Continue";
    document.getElementById("createGameButton").style.display = "none";
    document.getElementById("createGameInput").placeholder = "URL";
    document.getElementById("questions").innerHTML = "";
    document.getElementById("createGameType").style.display = "block";
    document.getElementById("createGameType").value = "library";
    document.getElementById("createGameInput").style.marginTop = "10px";
  }
});

Array.from(document.getElementById("answers").children).forEach((answer, index) => {
  answer.addEventListener("click", () => {
    if (!answer.style.backgroundColor) {
      socket.emit("answerQuestion", { gameId: document.getElementById("gameId").innerText, answer: (index + 1).toString() });
    }
  });
});

document.getElementById("nextQuestionButton").addEventListener("click", () => {
  socket.emit("nextQuestion", { gameId: document.getElementById("gameId").innerText });
});

socket.on("nextQuestion", ({ question, ended, leaderboard, questionLength }) => {
  if (!ended) {
    document.getElementById("question").innerText = question[0];
    question[1].forEach((answer, index) => {
      document.getElementById("answers").children[index].removeAttribute("style");
      document.getElementById("answers").children[index].children[0].innerText = answer;
    });
  } else {
    document.getElementById("joinGameContainer").style.display = "none";
    document.getElementById("createGameContainer").style.display = "none";
    document.getElementById("questionContainer").style.display = "none";
    document.getElementById("gameContainer").style.display = "none";
    document.getElementById("leaderboardContainer").style.display = "flex";
    document.getElementById("leaderboardTable").innerHTML = `
    <tr>
      <th>Rank</th>
      <th>Username</th>
      <th>Answers</th>
    </tr>`;
    leaderboard.forEach((user, index) => {
      var row = document.createElement("tr");
      var rank = document.createElement("td");
      rank.innerText = (index + 1).toString();
      var username = document.createElement("td");
      username.innerText = user[1].username;
      var answers = document.createElement("td");
      answers.innerText = user[1].answers.reduce((total, answer) => total + answer, 0).toString() + "/" + questionLength;
      row.appendChild(rank);
      row.appendChild(username);
      row.appendChild(answers);
      document.getElementById("leaderboardTable").appendChild(row);
    });
  }
});

document.getElementById("homeButton").addEventListener("click", () => {
  document.getElementById("questionContainer").style.display = "none";
  document.getElementById("gameContainer").style.display = "none";
  document.getElementById("leaderboardContainer").style.display = "none";
  document.getElementById("joinGameContainer").style.display = "flex";
  document.getElementById("createGameContainer").style.display = "flex";
  document.getElementById("quizContainer").style.display = "block";
  document.getElementById("createGameInput").style.display = "none";
  document.getElementById("joinGameInput").value = "";
  document.getElementById("createGameInput").value = "";
  document.getElementById("createGameButton").innerText = "Continue";
  document.getElementById("createGameButton").style.display = "none";
  document.getElementById("createGameInput").placeholder = "URL";
  document.getElementById("questions").innerHTML = "";
  document.getElementById("createGameType").style.display = "block";
  document.getElementById("createGameType").value = "library";
  document.getElementById("createGameInput").style.marginTop = "10px";
});

socket.on("answerQuestion", ({ answer, answers }) => {
  answers.forEach((answerCorrect, index) => {
    if (index !== (Number(answer) - 1)) {
      document.getElementById("answers").children[index].style.opacity = "0.4";
    }
    document.getElementById("answers").children[index].style.backgroundColor = (answerCorrect) ? "#28cc28" : "#ff0000";
  });
});

document.getElementById("createGameType").addEventListener("change", ({ target: { value } }) => {
  if (value === "library") {
    document.getElementById("createGameInput").style.display = "none";
    document.getElementById("createGameButton").style.display = "none";
    document.getElementById("quizEditor").style.display = "none";
    document.getElementById("quizContainer").style.display = "block";
    document.getElementById("publishQuizButton").style.display = "none";
    document.getElementById("rawJSON").style.display = "none";
  } else if (value === "url") {
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("quizEditor").style.display = "none";
    document.getElementById("createGameInput").style.display = "block";
    document.getElementById("createGameButton").style.display = "block";
    document.getElementById("createGameInput").value = "";
    document.getElementById("publishQuizButton").style.display = "none";
    document.getElementById("rawJSON").style.display = "none";
  } else if (value === "editor") {
    document.getElementById("createGameInput").style.display = "none";
    document.getElementById("createGameButton").style.display = "none";
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("quizEditor").style.display = "flex";
    document.getElementById("publishQuizButton").style.display = "block";
    document.getElementById("createGameButton").style.display = "block";
    document.getElementById("rawJSON").style.display = "none";
    document.getElementById("questions").innerHTML = "";
  } else if (value === "rawJSON") {
    document.getElementById("quizContainer").style.display = "none";
    document.getElementById("quizEditor").style.display = "none";
    document.getElementById("createGameInput").style.display = "none";
    document.getElementById("rawJSON").style.display = "flex";
    document.getElementById("rawJSONField").value = "";
    document.getElementById("createGameButton").style.display = "block";
    document.getElementById("createGameInput").value = "";
    document.getElementById("publishQuizButton").style.display = "none";
  }
});

document.getElementById("addQuestionButton").addEventListener("click", () => {
  var questionBox = document.createElement("div");
  questionBox.className = "questionBox";
  var questionInput = document.createElement("input");
  questionInput.className = "questionInput";
  questionInput.placeholder = "Question";
  var answerTable = document.createElement("table");
  answerTable.style.margin = "0 15px 15px";
  answerTable.innerHTML = `
  <tr>
    <th>Answer</th>
    <th>Correct</th>
  </tr>
  <tr>
    <td>
      <input placeholder="Answer" class="answerInput">
    </td>
    <td>
      <select name="correctAnswer" class="correctAnswer" id="correctAnswer">
        <option value="true">Right</option>
        <option value="false">Wrong</option>
      </select>
    </td>
  </tr>
  <tr>
    <td>
      <input placeholder="Answer" class="answerInput">
    </td>
    <td>
      <select name="correctAnswer" class="correctAnswer" id="correctAnswer">
        <option value="true">Right</option>
        <option value="false">Wrong</option>
      </select>
    </td>
  </tr>
  <tr>
    <td>
      <input placeholder="Answer" class="answerInput">
    </td>
    <td>
      <select name="correctAnswer" class="correctAnswer" id="correctAnswer">
        <option value="true">Right</option>
        <option value="false">Wrong</option>
      </select>
    </td>
  </tr>
  <tr>
    <td>
      <input placeholder="Answer" class="answerInput">
    </td>
    <td>
      <select name="correctAnswer" class="correctAnswer" id="correctAnswer">
        <option value="true">Right</option>
        <option value="false">Wrong</option>
      </select>
    </td>
  </tr>
  `;
  var removeQuestionButton = document.createElement("button");
  removeQuestionButton.className = "removeQuestionButton";
  removeQuestionButton.id = "removeQuestionButton";
  removeQuestionButton.innerText = "Remove";
  removeQuestionButton.addEventListener("click", () => {
    document.getElementById("questions").removeChild(questionBox);
  });
  questionBox.appendChild(questionInput);
  questionBox.appendChild(answerTable);
  questionBox.appendChild(removeQuestionButton);
  document.getElementById("questions").appendChild(questionBox);
});

document.getElementById("publishQuizButton").addEventListener("click", () => {
  document.getElementById("publishQuizPopupName").value = "";
  document.getElementById("publishQuizPopupFile").value = "";
  document.getElementById("publishQuizPopup").style.display = "block";
});

document.getElementById("publishQuizPopupButton").addEventListener("click", () => {
  if (document.getElementById("publishQuizPopupName").value) {
    if (document.getElementById("publishQuizPopupFile").files?.length > 0) {
      var fileReader = new FileReader();
      fileReader.addEventListener("load", () => {
        socket.emit("publishQuiz", {
          name: document.getElementById("publishQuizPopupName").value,
          image: fileReader.result,
          questions: Array.from(document.getElementById("questions").children).map((question) => [
            question.children[0].value,
            Array.from(question.children[1].children[0].children).filter((_, index) => index !== 0).map((answer) => [
              answer.children[0].children[0].value,
              (answer.children[1].children[0].value === "true") ? true : ((answer.children[1].children[0].value === "false") ? false : null)
            ])
          ])
        });
        document.getElementById("publishQuizPopup").style.display = "none";
      });
      fileReader.readAsDataURL(document.getElementById("publishQuizPopupFile").files?.[0]);
    } else {
      socket.emit("publishQuiz", {
        name: document.getElementById("publishQuizPopupName").value,
        questions: Array.from(document.getElementById("questions").children).map((question) => [
          question.children[0].value,
          Array.from(question.children[1].children[0].children).filter((_, index) => index !== 0).map((answer) => [
            answer.children[0].children[0].value,
            (answer.children[1].children[0].value === "true") ? true : ((answer.children[1].children[0].value === "false") ? false : null)
          ])
        ])
      });
      document.getElementById("publishQuizPopup").style.display = "none";
    }
  }
});

window.addEventListener("click", ({ target }) => {
  if (target === document.getElementById("publishQuizPopup")) {
    document.getElementById("publishQuizPopup").style.display = "none";
  }
});

socket.on("publishQuiz", ({ quizId, name, image, questions }) => {
  var quiz = document.createElement("div");
  quiz.className = "quiz";
  quiz.dataset.id = quizId;
  quiz.dataset.questions = JSON.stringify(questions);
  var nameHeader = document.createElement("h3");
  nameHeader.innerText = name;
  var img = document.createElement("img");
  img.src = image || '/public/placeholder.webp';
  img.style.width = "200px";
  img.style.margin = "0 15px 15px";
  img.style.borderRadius = "4px";
  var useButton = document.createElement("button");
  useButton.className = "useQuizButton";
  useButton.innerText = "Use";
  quiz.appendChild(nameHeader);
  quiz.appendChild(img);
  quiz.appendChild(document.createElement("br"));
  quiz.appendChild(useButton);
  document.getElementById("quizContainer").appendChild(quiz);
});
