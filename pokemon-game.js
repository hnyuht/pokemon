/* ================= BASE CONFIG ================= */
const BASEURL = "https://pokeapi.co/api/v2/pokemon?limit=151";
const HIGHSCOREURL = "http://localhost:3000/highscores/";

const gameBoard = document.querySelector(".gameBoard");
const victoryModal = document.querySelector(".victory");
const victoryMessage = document.querySelector(".victory-message");
const closeVictoryModal = document.querySelector(".close");

const restartPokeball = document.querySelector(".restart");
const modalRestartBall = document.querySelector(".restart-modal");

const difficultySelect = document.getElementById('difficulty');
const timerInput = document.getElementById('timer');
const startButton = document.getElementById('startButton');

const wrongCountDisplay = document.getElementById('wrongCount');
const turncount = document.querySelector(".turnCount");
const gameTimer = document.querySelector(".gameTimer");
const scoreCount = document.querySelector(".scoreCount");
const highScoreList = document.querySelector(".highscore-list");
const hsName = document.querySelector(".submit-highscore-form input[name='name']");
const hsSubmit = document.querySelector(".submit-highscore-form");
const hsResetBtn = document.querySelector(".reset-scores");

/* ================= GAME STATE ================= */
let timeLimit = 120;
let countdown;
let clockTimer;
let scoreCounter;
let second = 0, minute = 0, hour = 0;
let turns = 0;
let counter = 0;
let pointsScored;
let activeCards = [];
let wrongGuesses = 0;
let maxWrongGuesses = 5;
let finalScore = 0;
let finalTime = 0;
let highScores = [];

/* ================= START GAME BUTTON ================= */
startButton.addEventListener('click', () => {
  const numCards = parseInt(difficultySelect.value, 10);
  timeLimit = parseInt(timerInput.value, 10);
  maxWrongGuesses = 5;
  wrongGuesses = 0;
  wrongCountDisplay.innerText = `Wrong Guesses: ${wrongGuesses}/${maxWrongGuesses}`;
  startGame(numCards);
});

/* ================= START GAME ================= */
const startGame = function(numCards = 16) {
  housekeeping();
  fetch(BASEURL)
    .then(response => response.json())
    .then(pokedex => setPokemonArray(pokedex, numCards / 2));
};

const setPokemonArray = function(pokedexArray, numPairs) {
  const usedIds = new Set();
  const pokemonArray = [];

  while (pokemonArray.length < numPairs) {
    let num = randomPokemonId();
    if (!usedIds.has(num)) {
      usedIds.add(num);
      pokemonArray.push(pokedexArray.results[num]);
    }
  }

  const gameArray = [...pokemonArray, ...pokemonArray];
  fillGameBoard(gameArray);
};

let randomPokemonId = () => Math.floor(Math.random() * 151);

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
  fetch(pokemon.url)    
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
  cardImage.src = pokedex.sprites.other[`official-artwork`].front_default;        
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

/* ================= CARD LOGIC ================= */
const cardflip = function() {
  if (this.dataset.face === "down") {
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
  
  if (length === 1 && turns === 0){
    startCounter();
    startTimer();
  }    

  if (length === 2) {
    turns++;
    turncount.innerText = turns;

    if (activeCards[0].firstChild.dataset.dexid === activeCards[1].firstChild.dataset.dexid) {
      disableBoard();
      activeCards.forEach(card => {
        card.style.backgroundImage = "radial-gradient(rgb(241, 241, 216), rgb(241, 245, 35))";
        card.classList.add("match");
      });
      setTimeout(() => {
        activeCards.forEach(card => card.style.backgroundImage = "");
        activeCards = [];
        enableBoard();
      }, 1200);
    } else {
      wrongGuesses++;
      wrongCountDisplay.innerText = `Wrong Guesses: ${wrongGuesses}/${maxWrongGuesses}`;
      if (wrongGuesses >= maxWrongGuesses) {
        setTimeout(() => gameOver("Too many wrong guesses!"), 500);
        return;
      }

      disableBoard();
      setTimeout(() => {
        activeCards.forEach(card => cardReset(card));
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

/* ================= GAME OVER ================= */
const gameOver = function(message) {
  clearInterval(clockTimer);
  clearInterval(countdown);
  clearInterval(scoreCounter);
  victoryMessage.innerHTML = `
    <strong>Game Over!</strong> ${message}<br/>
    You took ${turns} turns.<br/>
    You earned ₽${scoreCount.innerHTML}.
  `;
  victoryModal.style.display = "block";
};

/* ================= CHECK WIN ================= */
const checkForWinCondition = function() {
  if (document.getElementsByClassName("match").length === gameBoard.children.length) {
    clearInterval(clockTimer);
    clearInterval(countdown);
    clearInterval(scoreCounter);
    finalTime = gameTimer.innerHTML;
    finalScore = scoreCount.innerHTML;
    setTimeout(() => {
      victoryMessage.innerHTML = `
        Congratulations! You took <strong>${turns}</strong> turns to match 'em all!<br/>
        It took you <strong>${finalTime}</strong>.<br/>
        You earned ₽<strong>${finalScore}</strong>!`;
      victoryModal.style.display = "block";
    }, 600);
  }
};

/* ================= HOUSEKEEPING ================= */
const housekeeping = function(){
  clearInterval(clockTimer);
  clearInterval(countdown);
  clearInterval(scoreCounter);
  closeVictoryWindow();         
  turns = 0;
  wrongGuesses = 0;
  second = 0; 
  minute = 0; 
  hour = 0;
  counter = 0;
  displayTimer();
  wrongCountDisplay.innerText = `Wrong Guesses: ${wrongGuesses}/${maxWrongGuesses}`;
  turncount.innerText = turns;
  scoreCount.innerHTML = 0;
  gameBoard.innerHTML = "";
  getHighScores();
};

/* ================= TIMER ================= */
const displayTimer = () => gameTimer.innerHTML = `Time Left: ${timeLimit} secs`;

const startTimer = function(){
  displayTimer();
  countdown = setInterval(() => {
    timeLimit--;
    displayTimer();
    if(timeLimit <= 0){
      clearInterval(countdown);
      gameOver("Time's up!");
    }
  }, 1000);
};

/* ================= SCORE COUNTER ================= */
const startCounter = function(){
  scoreCounter = setInterval(() => {
    counter++;
    pointsScored = 1000 - (turns * counter);
    scoreCount.innerHTML = pointsScored < 0 ? `0` : `${pointsScored}`;
  }, 1000);
};

/* ================= HIGH SCORES ================= */
const scoreArrayMaker = function(highscoreArray) { 
  highScoreList.innerHTML = "";
  let tempArray = highscoreArray.sort((a, b) => b.score - a.score);
  highScores = tempArray.slice(0, 10);
  highScores.forEach(scoreLister);
};

const scoreLister = function(highscore){
  const li = document.createElement("li");
  li.innerText = `${highscore.name} earned ₽${highscore.score} and took ${highscore.goes} turns!`;
  highScoreList.appendChild(li);
};

const userSubmitHighScore = function(){
  highScores.push({name: hsName.value, goes: turns, score: parseInt(finalScore, 10)});
  fetch(HIGHSCOREURL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      "name": hsName.value,
      "goes": turns,
      "score": parseInt(finalScore, 10)
    })
  }).catch(error => console.log(error.message));
};

const getHighScores = function(){
  fetch(HIGHSCOREURL)
    .then(response => response.json())
    .then(highscores => scoreArrayMaker(highscores))
    .catch(() => highScoreList.innerHTML = "Highscores unavailable - start your JSON server!");
};

hsSubmit.addEventListener("submit", function(event){
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
    .then(scores => scores.forEach(score => fetch(`${HIGHSCOREURL}${score.id}`, {method: "DELETE"})));
};

hsResetBtn.addEventListener("click", resetHighscores);

/* ================= UI HELPERS ================= */
const closeVictoryWindow = () => victoryModal.style.display = "none";
closeVictoryModal.addEventListener("click", closeVictoryWindow);
document.addEventListener("click", (e) => {
  if (e.target === victoryModal) closeVictoryWindow();
});

const liftUp = function() { this.style.transform = "translateY(-2px)"; };
const putDown = function() { this.style.transform = ""; };

modalRestartBall.addEventListener("click", housekeeping);
restartPokeball.addEventListener("click", housekeeping);

/* ================= INITIAL DISPLAY ================= */
document.addEventListener("DOMContentLoaded", () => {
  wrongCountDisplay.innerText = `Wrong Guesses: 0/${maxWrongGuesses}`;
});
