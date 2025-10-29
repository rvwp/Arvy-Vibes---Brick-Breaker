// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const restartButton = document.getElementById('restart-button');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- Game State ---
let score = 0;
let playing = false;
let intervalId;

// --- Paddle Properties ---
const paddle = {
    height: 10,
    width: 75,
    x: (WIDTH - 75) / 2,
    y: HEIGHT - 10,
    dx: 0, // Delta X (movement speed)
    speed: 7,
    color: '#ffcc00' // Yellow
};

// --- Ball Properties ---
const ball = {
    radius: 5,
    x: WIDTH / 2,
    y: HEIGHT - 15,
    dx: 4, // Initial speed X
    dy: -4, // Initial speed Y (upwards)
    color: '#ff4500' // Orange-Red
};

// --- Brick Properties ---
const brick = {
    rowCount: 5,
    columnCount: 8,
    width: 50,
    height: 15,
    padding: 5,
    offsetTop: 30,
    offsetLeft: 25,
    colors: ['#ff00ff', '#00ffff', '#00ff00', '#ffcc00', '#00c8ff'] // Neon colors
};

let bricks = [];

// --- Initialization ---

function initBricks() {
    for (let c = 0; c < brick.columnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brick.rowCount; r++) {
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1, // 1 = visible, 0 = broken
                color: brick.colors[r] // Assign color based on row
            };
        }
    }
}

function resetGame() {
    score = 0;
    scoreDisplay.textContent = `SCORE: ${score}`;
    playing = false;

    // Reset paddle position
    paddle.x = (WIDTH - paddle.width) / 2;
    paddle.dx = 0;

    // Reset ball position and velocity
    ball.x = WIDTH / 2;
    ball.y = HEIGHT - 15;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1); // Random initial direction
    ball.dy = -4;

    initBricks();
    showMessage("Press LEFT/RIGHT or buttons to move, Space/Fire to start!");
    restartButton.style.display = 'none';

    if (intervalId) {
        clearInterval(intervalId);
    }
    draw(); // Draw the initial state
}

// --- Drawing Functions ---

function drawPaddle() {
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = (c * (brick.width + brick.padding)) + brick.offsetLeft;
                const brickY = (r * (brick.height + brick.padding)) + brick.offsetTop;

                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.fillStyle = bricks[c][r].color;
                ctx.fillRect(brickX, brickY, brick.width, brick.height);

                // Add a slight border for separation
                ctx.strokeStyle = '#0d0d0d';
                ctx.lineWidth = 1;
                ctx.strokeRect(brickX, brickY, brick.width, brick.height);
            }
        }
    }
}

// --- Physics and Collision Detection ---

function checkCollision() {
    // 1. Ball vs. Walls
    if (ball.x + ball.dx > WIDTH - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx; // Hit left/right wall
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy; // Hit top wall
    } else if (ball.y + ball.dy > HEIGHT - ball.radius) {
        // Hit bottom wall (Game Over)
        endGame("Game Over! Try again.");
        return;
    }

    // 2. Ball vs. Paddle
    if (
        ball.y + ball.radius > paddle.y && // Check if ball hits paddle's top edge
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
    ) {
        // Calculate where the ball hit the paddle (to change angle)
        const relativeIntersectX = (paddle.x + (paddle.width / 2)) - ball.x;
        const normalizedIntersectX = relativeIntersectX / (paddle.width / 2);

        // Maximum angle change is 60 degrees (0.52 radians)
        const bounceAngle = normalizedIntersectX * Math.PI / 3;

        ball.dx = -Math.sin(bounceAngle) * Math.abs(ball.dx);
        ball.dy = -Math.abs(ball.dy); // Ensure it always goes up

        // Move ball outside paddle to prevent sticking
        ball.y = paddle.y - ball.radius;
    }

    // 3. Ball vs. Bricks
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + brick.width &&
                    ball.y > b.y && ball.y < b.y + brick.height) {

                    // Bounce the ball vertically
                    ball.dy = -ball.dy;
                    b.status = 0; // Destroy the brick
                    score += 10;
                    scoreDisplay.textContent = `SCORE: ${score}`;

                    // Check for win condition
                    checkWin();
                    return; // Only hit one brick per frame
                }
            }
        }
    }
}

function checkWin() {
    let allBricksBroken = true;
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                allBricksBroken = false;
                break;
            }
        }
    }
    if (allBricksBroken) {
        endGame("You Win! All Bricks Crushed!");
    }
}

function update() {
    if (!playing) return;

    // Move the paddle
    paddle.x += paddle.dx;

    // Keep paddle within bounds
    if (paddle.x < 0) {
        paddle.x = 0;
    } else if (paddle.x + paddle.width > WIDTH) {
        paddle.x = WIDTH - paddle.width;
    }

    // Move the ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    checkCollision();
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBricks();
    drawBall();
    drawPaddle();
}

function gameLoop() {
    update();
    draw();
}

// --- Game Control ---

function startGame() {
    if (!playing) {
        playing = true;
        hideMessage();
        // Start the physics loop at 60 FPS
        intervalId = setInterval(gameLoop, 1000 / 60);
    }
}

function endGame(message) {
    playing = false;
    clearInterval(intervalId);
    showMessage(message, true);
}

function showMessage(text, isGameOver = false) {
    messageText.textContent = text;
    messageBox.style.display = 'block';
    restartButton.style.display = isGameOver ? 'block' : 'none';

    if (!isGameOver) {
        // Only hide the button if it's the initial "Press Space" message
        restartButton.style.display = 'none';
    } else {
        // Use the "RESTART" button to load a new game
        restartButton.onclick = resetGame;
    }
}

function hideMessage() {
    messageBox.style.display = 'none';
}

// --- Input Handling ---

let isMovingLeft = false;
let isMovingRight = false;

function handleMovement() {
    // Only update dx based on keys, letting update() handle bounds
    if (isMovingLeft) {
        paddle.dx = -paddle.speed;
    } else if (isMovingRight) {
        paddle.dx = paddle.speed;
    } else {
        paddle.dx = 0;
    }
}

// Desktop/Keyboard Input
document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        isMovingRight = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        isMovingLeft = true;
    } else if (e.key === ' ' && !playing) {
        startGame();
        e.preventDefault(); // Prevent page scroll
    }
    handleMovement();
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        isMovingRight = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        isMovingLeft = false;
    }
    handleMovement();
});

// Mobile/Touch Input
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

const handleTouchStart = (direction) => {
    if (!playing) {
        startGame();
        return;
    }
    if (direction === 'left') {
        isMovingLeft = true;
    } else if (direction === 'right') {
        isMovingRight = true;
    }
    handleMovement();
};

const handleTouchEnd = (direction) => {
    if (direction === 'left') {
        isMovingLeft = false;
    } else if (direction === 'right') {
        isMovingRight = false;
    }
    handleMovement();
};

// Add event listeners for touch/mouse down/up
[leftBtn, rightBtn].forEach(btn => {
    const direction = btn.id.includes('left') ? 'left' : 'right';

    // Start movement on press
    btn.addEventListener('touchstart', (e) => handleTouchStart(direction), { passive: true });
    btn.addEventListener('mousedown', (e) => handleTouchStart(direction));

    // Stop movement on release
    btn.addEventListener('touchend', (e) => handleTouchEnd(direction));
    btn.addEventListener('mouseup', (e) => handleTouchEnd(direction));
    btn.addEventListener('mouseleave', (e) => handleTouchEnd(direction));
});

// --- Initial Load ---
window.onload = resetGame;
