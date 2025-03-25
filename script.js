const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";

// Game Settings
const GAME_SETTINGS = {
    gravity: 0.5,
    speed: 5.2,
    birdSize: [51, 36],
    jumpImpulse: -8,
    birdXPosition: canvas.width / 10, // More descriptive name
    pipeWidth: 78,
    pipeGap: 270,
};

let gamePlaying = false;
let index = 0;
let bestScore = 0;
let flight;
let flyHeight;
let currentScore;
let pipes;
let startTime; // Store the game start time


// --- Local Storage Functions ---

function loadScores() {
    const scoresJSON = localStorage.getItem('flappyBirdScores');
    return scoresJSON ? JSON.parse(scoresJSON) : [];
}

function saveScores(scores) {
    localStorage.setItem('flappyBirdScores', JSON.stringify(scores));
}

function addScore(score, duration) {
    const scores = loadScores();
    const newScore = {
        score: score,
        timestamp: new Date().toISOString(), // Get current time in ISO 8601 format
        duration: duration
    };
    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score); // Sort scores in descending order
    saveScores(scores);
    // Update best score if necessary
    bestScore = Math.max(bestScore, score);
}

// --- API Interaction ---  <-- NEW FUNCTION
// --- API Interaction ---

async function sendScore(score, duration) {
    const scoreData = {
        score: score,
        timestamp: new Date().toISOString(),
        duration: duration,
    };

    try {
        // Change the URL to your PHP file
        const response = await fetch('save_score.php', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Score saved successfully:', data);

    } catch (error) {
        console.error('Error sending score:', error);
    }
}

// --- Helper Functions ---

const pipeLoc = () => (Math.random() * ((canvas.height - (GAME_SETTINGS.pipeGap + GAME_SETTINGS.pipeWidth)) - GAME_SETTINGS.pipeWidth)) + GAME_SETTINGS.pipeWidth;

function drawBackground() {
    const backgroundX = -(index * (GAME_SETTINGS.speed / 2)) % canvas.width;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height, backgroundX + canvas.width, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height, backgroundX, 0, canvas.width, canvas.height);
}

function drawPipe(pipe) {
    ctx.drawImage(img, 432, 588 - pipe[1], GAME_SETTINGS.pipeWidth, pipe[1], pipe[0], 0, GAME_SETTINGS.pipeWidth, pipe[1]);
    ctx.drawImage(img, 432 + GAME_SETTINGS.pipeWidth, 108, GAME_SETTINGS.pipeWidth, canvas.height - pipe[1] + GAME_SETTINGS.pipeGap, pipe[0], pipe[1] + GAME_SETTINGS.pipeGap, GAME_SETTINGS.pipeWidth, canvas.height - pipe[1] + GAME_SETTINGS.pipeGap);
}

function updatePipes() {
    pipes.forEach(pipe => {
        pipe[0] -= GAME_SETTINGS.speed;
    });

    // give 1 point & create new pipe
    if (pipes[0][0] <= -GAME_SETTINGS.pipeWidth) {
        currentScore++;
        bestScore = Math.max(bestScore, currentScore);
        pipes = [...pipes.slice(1), [pipes[pipes.length - 1][0] + GAME_SETTINGS.pipeGap + GAME_SETTINGS.pipeWidth, pipeLoc()]];
    }
}

function checkCollision() {
    for (const pipe of pipes) {
        if (
            pipe[0] <= GAME_SETTINGS.birdXPosition + GAME_SETTINGS.birdSize[0] &&
            pipe[0] + GAME_SETTINGS.pipeWidth >= GAME_SETTINGS.birdXPosition &&
            (pipe[1] > flyHeight || pipe[1] + GAME_SETTINGS.pipeGap < flyHeight + GAME_SETTINGS.birdSize[1])
        ) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function drawBird() {
    const frame = Math.floor((index % 9) / 3);
    const birdDrawX = gamePlaying ? GAME_SETTINGS.birdXPosition : (canvas.width / 2) - (GAME_SETTINGS.birdSize[0] / 2);
    ctx.drawImage(img, 432, frame * GAME_SETTINGS.birdSize[1], ...GAME_SETTINGS.birdSize, birdDrawX, flyHeight, ...GAME_SETTINGS.birdSize);

    if (gamePlaying) {
        flight += GAME_SETTINGS.gravity;
        flyHeight = Math.min(flyHeight + flight, canvas.height - GAME_SETTINGS.birdSize[1]);
    }
}

// --- Game Logic ---

const setup = () => {
    currentScore = 0;
    flight = GAME_SETTINGS.jumpImpulse;
    flyHeight = (canvas.height / 2) - (GAME_SETTINGS.birdSize[1] / 2);
    pipes = Array(3).fill().map((_, i) => [canvas.width + (i * (GAME_SETTINGS.pipeGap + GAME_SETTINGS.pipeWidth)), pipeLoc()]);
    // Load best score from local storage
    bestScore = loadScores().length > 0 ? loadScores()[0].score : 0;

};

const render = () => {
    index++;

    drawBackground();

    if (gamePlaying) {
        if (!startTime) {
            startTime = Date.now(); // Record start time only once
        }
        updatePipes();
        pipes.forEach(drawPipe);

        if (checkCollision()) {
            gamePlaying = false;
            const endTime = Date.now();
            const duration = Math.round((endTime - startTime) / 1000); // Duration in seconds
            // addScore(currentScore, duration);
            sendScore(currentScore, duration); // API call - REPLACES addScore()
            startTime = null; // Reset start time
            setup();
        }
        // Update current score display during gameplay
        document.getElementById('currentScore').textContent = `Current: ${currentScore}`;
    }

    drawBird();

    if (!gamePlaying) {
        flyHeight = (canvas.height / 2) - (GAME_SETTINGS.birdSize[1] / 2); // Reset fly height
        ctx.font = "bold 30px courier";
        ctx.fillText(`Best score: ${bestScore}`, 85, 245);
        ctx.fillText('Click to play', 90, 535);
        document.getElementById('bestScore').textContent = `Best: ${bestScore}`;
        document.getElementById('currentScore').textContent = `Current: ${currentScore}`; //Keep this for when game resets
    }

    window.requestAnimationFrame(render);
};

// --- Event Listeners ---

function startGame() {
    gamePlaying = true;
    startTime = null; // Reset start time
}

function jump() {
    flight = GAME_SETTINGS.jumpImpulse;
}
document.addEventListener('click', startGame);
window.addEventListener('keydown', jump); // Use addEventListener for consistency

// --- Initialization ---

setup();
img.onload = render;