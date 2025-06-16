// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let timerInterval; // Add timer variable

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

// Add end game button logic
const endBtn = document.getElementById("end-btn");
endBtn.addEventListener("click", resetGame);

// Difficulty mode settings
const MODES = {
  beginner: { badDropRatio: 0.1, dropInterval: 1000, dropSpeed: 4 },
  intermediate: { badDropRatio: 0.2, dropInterval: 700, dropSpeed: 2.8 },
  expert: { badDropRatio: 0.3, dropInterval: 500, dropSpeed: 1.8 }
};
let currentMode = 'beginner';

const modeSelect = document.getElementById('mode-select');
modeSelect.addEventListener('change', (e) => {
  currentMode = e.target.value;
});

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;

  // Show end button, hide start button
  endBtn.style.display = "inline-block";
  document.getElementById("start-btn").style.display = "none";

  // Reset and start timer
  let timeLeft = 30;
  document.getElementById("time").textContent = timeLeft;
  document.getElementById("score").textContent = 0; // Reset score on new game

  // Hide popup if visible
  const popup = document.getElementById("game-popup");
  if (popup) popup.style.display = "none";

  // Get mode settings
  const mode = MODES[currentMode] || MODES.beginner;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      clearInterval(dropMaker);
      gameRunning = false;
      endBtn.style.display = "none";
      // Remove all remaining drops
      document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
      showGameOverPopup();
    }
  }, 1000);

  // Create new drops at mode-specific interval
  dropMaker = setInterval(() => createDrop(mode), mode.dropInterval);
}

function resetGame() {
  // Reload the page to reset the game and return to the homepage
  window.location.reload();
}

function createDrop(mode = MODES.beginner) {
  // Randomly decide if this is a bad drop (mode-specific chance)
  const isBadDrop = Math.random() < mode.badDropRatio;

  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = isBadDrop ? "water-drop bad-drop" : "water-drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Use a water drop image as the drop, or bad drop image
  drop.style.background = "none";
  if (isBadDrop) {
    drop.style.backgroundImage = "url('img/baddrop.png')";
    drop.style.borderRadius = "0"; // Remove border radius for bad drop
  } else {
    drop.style.backgroundImage = "url('img/waterdrop.png')";
    drop.style.borderRadius = "0";
  }
  drop.style.backgroundSize = "contain";
  drop.style.backgroundRepeat = "no-repeat";
  drop.style.backgroundPosition = "center";

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for mode-specific duration
  drop.style.animationDuration = `${mode.dropSpeed}s`;

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);

  // Collision detection interval
  const collisionInterval = setInterval(() => {
    const dropRect = drop.getBoundingClientRect();
    const canRect = waterCan.getBoundingClientRect();

    // Check if bottom of drop touches or passes top of can and horizontal overlap
    const touchesTop =
      dropRect.bottom >= canRect.top &&
      dropRect.left < canRect.right &&
      dropRect.right > canRect.left;

    if (touchesTop) {
      // Increase or decrease score
      const scoreElem = document.getElementById("score");
      let score = parseInt(scoreElem.textContent);
      if (isBadDrop) {
        score = Math.max(0, score - 1); // Don't allow negative score
      } else {
        score = score + 1;
      }
      scoreElem.textContent = score;
      drop.remove();
      clearInterval(collisionInterval);
    } else if (!document.body.contains(drop)) {
      // Drop was removed by animation or otherwise
      clearInterval(collisionInterval);
    }
  }, 16); // ~60fps

  // Remove drops that reach the bottom (weren't caught)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drop
  });
}

// Water can movement logic
const gameContainer = document.getElementById("game-container");
const waterCan = document.getElementById("water-can");

// Helper to update water can position
function moveWaterCan(x) {
  const containerRect = gameContainer.getBoundingClientRect();
  const canWidth = waterCan.offsetWidth;
  // Shift range right by 30px
  const shift = 30;
  let relativeX = x - containerRect.left;
  let minLeft = shift;
  let maxLeft = gameContainer.offsetWidth - canWidth + shift;
  let newLeft = Math.max(minLeft, Math.min(relativeX - canWidth / 2 + shift, maxLeft));
  waterCan.style.left = `${newLeft}px`;
}

// Mouse movement
gameContainer.addEventListener("mousemove", (e) => {
  moveWaterCan(e.clientX);
});

// Touch movement
gameContainer.addEventListener("touchmove", (e) => {
  if (e.touches.length > 0) {
    moveWaterCan(e.touches[0].clientX);
  }
});

// Initialize can position at center on load
window.addEventListener("DOMContentLoaded", () => {
  const canWidth = waterCan.offsetWidth;
  const shift = 30;
  waterCan.style.left = `${(gameContainer.offsetWidth - canWidth) / 2 + shift}px`;
});

function showGameOverPopup() {
  let popup = document.getElementById("game-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "game-popup";
    popup.innerHTML = `
      <div class="popup-content">
        <h2>Game Over!</h2>
        <p>Your Score: <span id="final-score"></span></p>
        <button id="play-again-btn">Play Again</button>
      </div>
    `;
    document.body.appendChild(popup);
    document.getElementById("play-again-btn").addEventListener("click", () => {
      popup.style.display = "none";
      startGame();
    });
  }
  document.getElementById("final-score").textContent = document.getElementById("score").textContent;
  popup.style.display = "flex";

  endBtn.style.display = "none";
  document.getElementById("start-btn").style.display = "inline-block";

  launchConfetti(); // Show confetti when game ends
}

// Confetti effect
function launchConfetti() {
  // Remove any existing confetti
  const old = document.getElementById('confetti-canvas');
  if (old) old.remove();

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 10000;
  document.body.appendChild(canvas);

  // Set canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d');
  const confettiCount = 120;
  const confetti = [];

  // Generate confetti pieces
  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * confettiCount,
      color: randomConfettiColor(),
      tilt: Math.random() * 10 - 10,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      tiltAngle: 0
    });
  }

  let angle = 0;
  let tiltAngle = 0;
  let frame = 0;
  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    tiltAngle += 0.1;
    for (let i = 0; i < confettiCount; i++) {
      let c = confetti[i];
      c.tiltAngle += c.tiltAngleIncremental;
      c.y += (Math.cos(angle + c.d) + 3 + c.r / 2) / 2;
      c.x += Math.sin(angle);
      c.tilt = Math.sin(c.tiltAngle - (i % 3)) * 15;

      ctx.beginPath();
      ctx.lineWidth = c.r;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r / 3, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 5);
      ctx.stroke();
    }
    frame++;
    // Remove confetti after 2.5 seconds
    if (frame < 150) {
      requestAnimationFrame(drawConfetti);
    } else {
      canvas.remove();
    }
  }
  drawConfetti();

  function randomConfettiColor() {
    const colors = [
      "#FFC907", "#2E9DF7", "#8BD1CB", "#4FCB53",
      "#FF902A", "#F5402C", "#159A48", "#F16061"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
