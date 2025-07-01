const BASEURL = "https://pokeapi.co/api/v2/pokemon?limit=151";

const gameBoard = document.querySelector(".gameBoard");
const turncount = document.querySelector(".turnCount");
const gameTimer = document.querySelector(".gameTimer");
const scoreCount = document.querySelector(".scoreCount");
const triesCountDisplay = document.querySelector(".triesCount");
const victoryModal = document.querySelector(".victory");
const victoryMessage = document.querySelector(".victory-message");
const closeVictoryModal = document.querySelector(".close");
const restartPokeball = document.querySelector(".restart");
const modalRestartBall = document.querySelector(".restart-modal");

const timerInput = document.getElementById("timerInput");
const startButton = document.getElementById("startButton");

let turns = 0;
let activeCards = [];
let tries = 0;
const maxTries = 5;
let timerSeconds;
let countdownInterval;
let counter = 0;
let pointsScored;
let scoreCounter;

let finalScore = 0;
let finalTime = 0;

// Start Game now waits for start button, loads 20 pairs (40 cards)
const startGame = function() {
    housekeeping();
    fetch(BASEURL)
        .then(response => response.json())
        .then(pokedex => setPokemonArray(pokedex, 20));
};

// Set Gameboard size and array - dynamic pairs count
const setPokemonArray = function(pokedexArray, pairs = 8) {
    const pokemonArray = [];
    const usedIndexes = new Set();

    while (pokemonArray.length < pairs) {
        let num = randomPokemonId();
        if (!usedIndexes.has(num)) {
            usedIndexes.add(num);
            pokemonArray.push(pokedexArray.results[num]);
        }
    }

    const gameArray = [...pokemonArray, ...pokemonArray];
    fillGameBoard(gameArray);
};

let randomPokemonId = () => Math.floor(Math.random() * 151);

// Fisher-Yates Shuffle
const shuffleGame = function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
};

const fillGameBoard = function(gameArray) {
    let gameDeck = shuffleGame(shuffleGame(gameArray));
    gameDeck.forEach(pokemon => fillPokedex(pokemon));
};

const fillPokedex = (pokemon) => {
    let pokeURL = pokemon.url;
    fetch(pokeURL)
        .then(response => response.json())
        .then(pokemon => renderCards(pokemon));
};

const renderCards = function(pokedex) {
    const createCard = document.createElement("div");
    createCard.className = "card";
    createCard.dataset.face = "down";
    createCard.addEventListener("click", cardflip);
    createCard.addEventListener("click", checkForWinCondition);

    const createCardFront = document.createElement("div");
    createCardFront.className = "card-front";
    createCardFront.dataset.dexid = pokedex.id;
    createCardFront.style.display = "none";

    const cardImage = document.createElement("img");
    cardImage.className = "card-image";
    cardImage.src = pokedex.sprites.other["official-artwork"].front_default;
    createCardFront.appendChild(cardImage);

    const cardHeader = document.createElement("h2");
    cardHeader.innerText = `${pokedex.species.name}`;
    createCardFront.appendChild(cardHeader);

    const createCardBack = document.createElement("div");
    createCardBack.className = "card-back";
    createCardBack.style.display = "block";
    createCardBack.addEventListener("mouseover", liftUp);
    createCardBack.addEventListener("mouseout", putDown);

    const cardBackImg = document.createElement("img");
    cardBackImg.className = "card-back";
    cardBackImg.src = "assets/cardBack.png";
    createCardBack.appendChild(cardBackImg);

    createCard.appendChild(createCardFront);
    createCard.appendChild(createCardBack);

    gameBoard.appendChild(createCard);
};

const cardflip = function() {
    if (this.dataset.face === "down" && activeCards.length < 2 && !this.classList.contains("disabled")) {
        this.dataset.face = "up";
        this.firstChild.style.display = "block";
        this.lastChild.style.display = "none";
        this.classList.toggle("disabled");
        cardBecomesActive(this);
    }
};

const cardBecomesActive = function(card) {
    activeCards.push(card);
    let length = activeCards.length;

    if (length === 1 && turns === 0) {
        startCounter();
        startCountdownTimer(timerSeconds || parseInt(timerInput.value, 10));
    }

    if (length === 2) {
        turns++;
        turncount.innerText = turns;

        if (activeCards[0].firstChild.dataset.dexid === activeCards[1].firstChild.dataset.dexid) {
            disableBoard();
            activeCards.forEach(c => {
                c.style.backgroundImage = "radial-gradient(rgb(241, 241, 216), rgb(241, 245, 35))";
                c.classList.add("match");
            });
            setTimeout(() => {
                activeCards.forEach(c => (c.style.backgroundImage = ""));
                activeCards = [];
                enableBoard();
            }, 1200);
        } else {
            tries++;
            triesCountDisplay.innerText = maxTries - tries;
            if (tries >= maxTries) {
                endGameLoss();
                return;
            }
            disableBoard();
            setTimeout(() => {
                activeCards.forEach(cardReset);
                activeCards = [];
                enableBoard();
            }, 1200);
        }
    }
};

const cardReset = function(card) {
    card.dataset.face = "down";
    card.lastChild.style.display = "block";
    card.firstChild.style.display = "none";
    card.classList.toggle("disabled");
};

const disableBoard = function() {
    gameBoard.classList.add("disabled");
};

const enableBoard = function() {
    gameBoard.classList.remove("disabled");
};

const restartGame = function() {
    gameBoard.innerHTML = "";
    startGame();
};

const housekeeping = function() {
    clearInterval(countdownInterval);
    clearInterval(scoreCounter);
    closeVictoryWindow();
    turns = 0;
    tries = 0;
    counter = 0;
    turncount.innerText = turns;
    triesCountDisplay.innerText = maxTries;
    scoreCount.innerHTML = 0;
    getHighScores();
    gameTimer.innerText = "Set timer and press Start";
};

const checkForWinCondition = function() {
    const cards = document.getElementsByClassName("match");
    if (cards.length === 40) { // 20 pairs x 2
        clearInterval(countdownInterval);
        clearInterval(scoreCounter);
        finalTime = gameTimer.innerHTML;
        finalScore = scoreCount.innerHTML;
        setTimeout(() => {
            victoryMessage.innerHTML = `Congratulations! You took <strong>${turns}</strong> turns to match 'em all!<br/>
                                        It took you <strong>${finalTime}</strong>.<br/>
                                        You earned ₽<strong>${finalScore}</strong>!`;
            victoryModal.style.display = "block";
        }, 600);
    }
};

const endGameLoss = function() {
    disableBoard();
    clearInterval(countdownInterval);
    clearInterval(scoreCounter);
    victoryMessage.innerHTML = `<strong>Game Over!</strong> You ran out of tries or time. Better luck next time!`;
    victoryModal.style.display = "block";
};

const formatTime = function(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs} hrs : ${mins} mins : ${secs} secs`;
};

const startCountdownTimer = function(seconds) {
    timerSeconds = seconds;
    gameTimer.innerText = formatTime(timerSeconds);

    countdownInterval = setInterval(() => {
        timerSeconds--;
        gameTimer.innerText = formatTime(timerSeconds);

        if (timerSeconds <= 0) {
            clearInterval(countdownInterval);
            endGameLoss();
        }
    }, 1000);
};

const startCounter = function() {
    scoreCounter = setInterval(() => {
        counter++;
        pointsScored = 1000 - (turns * counter);
        if (pointsScored < 0) pointsScored = 0;
        scoreCount.innerHTML = pointsScored;
    }, 1000);
};

/* ************************************************************ */
/* To get High Scores to work run "json-server --watch db.json" */
/* ************************************************************ */

const highScoreList = document.querySelector(".highscore-list");
let highScores = [];

const scoreArrayMaker = function(highscoreArray) {
    highScoreList.innerHTML = "";
    let tempArray = highscoreArray.sort((a, b) => b.score - a.score);
    highScores = tempArray.slice(0, 10);
    highScores.forEach(scoreLister);
};

const scoreLister = function(highscore) {
    const li = document.createElement("li");
    li.innerText = `${highscore.name} earned ₽${highscore.score} and took a mere ${highscore.goes} turns to match 'em all!`;
    highScoreList.appendChild(li);
};

const HIGHSCOREURL = "http://localhost:3000/highscores/";
const hsName = document.querySelector(".submit-highscore-form input[name='name']");
const hsSubmit = document.querySelector(".submit-highscore-form");

const userSubmitHighScore = function() {
    highScores.push({ name: hsName.value, goes: turns, score: parseInt(finalScore, 10) });
    fetch(HIGHSCOREURL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: hsName.value, goes: turns, score: parseInt(finalScore, 10) })
    }).catch(error => console.log(error.message));
};

const getHighScores = function() {
    fetch(HIGHSCOREURL)
        .then(response => response.json())
        .then(highscores => scoreArrayMaker(highscores))
        .catch(() => (highScoreList.innerHTML = "Currently unavailable - please start the highscore server!"));
};

hsSubmit.addEventListener("submit", function(event) {
    event.preventDefault();
    userSubmitHighScore();
    scoreArrayMaker(highScores);
    closeVictoryWindow();
    event.target.reset();
});

const resetHighscores = () => {
    highScoreList.innerHTML = "";
    highScores = [];
    fetch(HIGHSCOREURL)
        .then(response => response.json())
        .then(scores => scores.forEach(score => fetch(`${HIGHSCOREURL}${score.id}`, { method: "DELETE" })));
};

const hsResetBtn = document.querySelector(".reset-scores");
hsResetBtn.addEventListener("click", resetHighscores);

const closeVictoryWindow = () => (victoryModal.style.display = "none");

closeVictoryModal.addEventListener("click", closeVictoryWindow);
document.addEventListener("click", e => {
    if (e.target === victoryModal) {
        closeVictoryWindow();
    }
});

const liftUp = function() {
    this.style.transform = "translateY(-2px)";
};
const putDown = function() {
    this.style.transform = "";
};

modalRestartBall.addEventListener("click", restartGame);
restartPokeball.addEventListener("click", restartGame);

// Start button listener
startButton.addEventListener("click", () => {
    if (timerInput.value < 10) {
        alert("Please set a timer of at least 10 seconds");
        return;
    }
    startGame();
    startCountdownTimer(parseInt(timerInput.value, 10));
});

document.addEventListener("DOMContentLoaded", () => {
    housekeeping();
});
