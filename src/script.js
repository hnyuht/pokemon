/*  Base URL for PokeAPI  */
const BASEURL = "https://pokeapi.co/api/v2/pokemon?limit=151";

/* Track how many cards the player wants */
let cardCount = 40; // Default, matches your index.html selected option

// Grab the card-count dropdown
const cardCountSelector = document.getElementById("card-count");
if (cardCountSelector) {
    cardCountSelector.addEventListener("change", (e) => {
        cardCount = parseInt(e.target.value, 10);
        restartGame();
    });
}

/* Start Game */
const startGame = function() {
    housekeeping();
    fetch(BASEURL)
        .then(response => response.json())
        .then(pokedex => setPokemonArray(pokedex));
};

/* Set Gameboard with Unique Pairs - FIXED for better shuffle */
const setPokemonArray = async function(pokedexArray) {
    const pairCount = cardCount / 2;
    const usedIndexes = new Set();
    const selectedPokemon = [];

    while (selectedPokemon.length < pairCount) {
        let num = randomPokemonId();
        if (!usedIndexes.has(num)) {
            usedIndexes.add(num);
            selectedPokemon.push(pokedexArray.results[num]);
        }
    }

    const fullDeck = [...selectedPokemon, ...selectedPokemon];
    const shuffledDeck = shuffleGame(fullDeck);

    // Fetch all Pokémon details before rendering
    const detailedPokemon = await Promise.all(shuffledDeck.map(p =>
        fetch(p.url).then(res => res.json())
    ));

    renderFullDeck(detailedPokemon);
};

/* Render all cards at once after full shuffle and fetch */
const renderFullDeck = function(detailedPokemonArray) {
    gameBoard.innerHTML = ""; // Clear board
    detailedPokemonArray.forEach(pokemon => renderCards(pokemon));
};

/* Random number generator */
const randomPokemonId = () => Math.floor(Math.random() * 151);

/* Fisher-Yates shuffle */
const shuffleGame = function(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
};

/* Render a single card */
const gameBoard = document.querySelector(".gameBoard");
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
    cardHeader.innerText = pokedex.species.name;
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

/* Card Flip Logic */
const cardflip = function() {
    if (this.dataset.face === "down") {
        this.dataset.face = "up";
        this.firstChild.style.display = "block";
        this.lastChild.style.display = "none";
        this.classList.toggle("disabled");
        cardBecomesActive(this);
    }
};

let turns = 0;
let activeCards = [];

const cardBecomesActive = function(card) {
    activeCards.push(card);
    let length = activeCards.length;
    if (length === 1 && turns === 0) {
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

const disableBoard = () => gameBoard.classList.add("disabled");
const enableBoard = () => gameBoard.classList.remove("disabled");

const restartPokeball = document.querySelector(".restart");
const modalRestartBall = document.querySelector(".restart-modal");
const restartGame = function() {
    gameBoard.innerHTML = "";
    startGame();
};

const housekeeping = function() {
    clearInterval(clockTimer);
    clearInterval(scoreCounter);
    closeVictoryWindow();         
    turns = 0; 
    second = 0; 
    minute = 0; 
    hour = 0; 
    counter = 0;
    displayTimer();
    turncount.innerText = turns;
    scoreCount.innerHTML = 0;
    getHighScores();
};

const cards = document.getElementsByClassName("match");
const closeVictoryModal = document.querySelector(".close");
const victoryModal = document.querySelector(".victory");
const victoryMessage = document.querySelector(".victory-message");
let finalScore = 0;
let finalTime = 0;

const checkForWinCondition = function() {
    if (cards.length === cardCount) {
        clearInterval(clockTimer);
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

/* Gameplay UI */
const turncount = document.querySelector(".turnCount");
const gameTimer = document.querySelector(".gameTimer");
let second = 0, minute = 0, hour = 0;
const displayTimer = () => gameTimer.innerHTML = `${hour} hrs : ${minute} mins : ${second} secs`;
let clockTimer;
const startTimer = function() {
    clockTimer = setInterval(() => {
        displayTimer();
        second++;
        if (second === 60) {
            minute++;
            second = 0;
        }
        if (minute === 60) {
            hour++;
            minute = 0;
        }
    }, 1000);
};

/* Score Counter */
const scoreCount = document.querySelector(".scoreCount");
let counter = 0;
let pointsScored;
let scoreCounter;
const startCounter = function() {
    scoreCounter = setInterval(() => {
        counter++;
        pointsScored = 1000 - (turns * counter);
        scoreCount.innerHTML = pointsScored < 0 ? `0` : `${pointsScored}`;
    }, 1000);
};

/* High Scores API */
const HIGHSCOREURL = "http://localhost:3000/highscores/";
const highScoreList = document.querySelector(".highscore-list");
let highScores = [];

const scoreArrayMaker = function(highscoreArray) {
    highScoreList.innerHTML = "";
    highScores = highscoreArray.sort((a, b) => b.score - a.score).slice(0, 10);
    highScores.forEach(scoreLister);
};

const scoreLister = function(highscore) {
    const li = document.createElement("li");
    li.innerText = `${highscore.name} earned ₽${highscore.score} and took ${highscore.goes} turns!`;
    highScoreList.appendChild(li);
};

const hsName = document.querySelector(".submit-highscore-form input[name='name']");
const hsSubmit = document.querySelector(".submit-highscore-form");

const userSubmitHighScore = function() {
    highScores.push({name: hsName.value, goes: turns, score: parseInt(finalScore, 10)});
    fetch(HIGHSCOREURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            "name": hsName.value,
            "goes": turns,
            "score": parseInt(finalScore, 10),
        })
    }).catch(error => console.log(error.message));
};

const getHighScores = function() {
    fetch(HIGHSCOREURL)
        .then(response => response.json())
        .then(scoreArrayMaker)
        .catch(() => highScoreList.innerHTML = "Currently unavailable - please start the highscore server!");
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
        .then(scores => scores.forEach(score =>
            fetch(`${HIGHSCOREURL}${score.id}`, {method: "DELETE"})
        ));
};

const hsResetBtn = document.querySelector(".reset-scores");
hsResetBtn.addEventListener("click", resetHighscores);

/* Modal helpers */
const closeVictoryWindow = () => victoryModal.style.display = "none";
closeVictoryModal.addEventListener("click", closeVictoryWindow);
document.addEventListener("click", (e) => {
    if (e.target === victoryModal) closeVictoryWindow();
});

/* Card hover effects */
const liftUp = function() { this.style.transform = "translateY(-2px)"; };
const putDown = function() { this.style.transform = ""; };

/* Audio Mute/Unmute Logic */
document.addEventListener("DOMContentLoaded", () => {
    const bgmAudio = document.getElementById("bgm");
    const audioToggle = document.getElementById("audio-toggle");

    if (!bgmAudio || !audioToggle) return;

    // Start paused (muted false), wait for user interaction
    bgmAudio.pause();
    bgmAudio.muted = false;

    let audioPlaying = false;

    function toggleAudio() {
        if (!audioPlaying) {
            bgmAudio.play().catch(() => {});
            audioPlaying = true;
            audioToggle.textContent = "🔇 Unmute";
            audioToggle.setAttribute("aria-pressed", "true");
        } else {
            if (bgmAudio.muted) {
                bgmAudio.muted = false;
                audioToggle.textContent = "🔇 Unmute";
                audioToggle.setAttribute("aria-pressed", "true");
            } else {
                bgmAudio.muted = true;
                audioToggle.textContent = "🔊 Mute";
                audioToggle.setAttribute("aria-pressed", "false");
            }
        }
    }

    // On first user interaction anywhere, start audio if not playing
    function startAudioOnFirstInteraction() {
        if (!audioPlaying) {
            bgmAudio.play().catch(() => {});
            audioPlaying = true;
            audioToggle.textContent = "🔇 Unmute";
            audioToggle.setAttribute("aria-pressed", "true");
        }
        document.removeEventListener("click", startAudioOnFirstInteraction);
    }

    document.addEventListener("click", startAudioOnFirstInteraction);
    audioToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleAudio();
    });
});

/* Event Listeners */
modalRestartBall.addEventListener("click", restartGame);
restartPokeball.addEventListener("click", restartGame);
document.addEventListener("DOMContentLoaded", startGame);
