// === FLAPPY BIRD GAME SCRIPT ===

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let selectedBirdColor = "yellow";
const birdImgs = {
  blue: "assets/new1.png",
  green: "assets/new2.png",
  yellow: "assets/new3.png",
};


const themes = [
  ["assets/bgnew1.png", "assets/bgnew12.jpg", "assets/bgnew13.jpg"],
  ["assets/bgnew2.png", "assets/bgnew22.jpg", "assets/bgnew23.jpg"],
  ["assets/bgnew3.png", "assets/bgnew32.jpg", "assets/bgnew33.jpg"],
  ["assets/bgnew4.png", "assets/bgnew42.jpg", "assets/bgnew43.jpg"]
];

const pipeImg = new Image();
pipeImg.src = "assets/Tube.png";

let selectedTheme = 0;
let bgImages = [];
let bgIndex = 0;
let endlessMode = false;
let unlockedEndless = false;
let bird, pipes, score, isGameOver, speed, pipeGap, lastPipe;
let animationFrameId;
let birdImg = new Image();


// LOGIN
function handleLogin() {
  const name = document.getElementById("playerName").value.trim();
  if (!name) return;
  localStorage.setItem("playerName", name);
  unlockedEndless = localStorage.getItem("endlessUnlocked") === "true";

  document.getElementById("displayName").innerText = name;
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("menu").style.display = "block";
  document.getElementById("profileBadge").style.display = "block";
  document.getElementById("endlessPopup").style.display = "none";

  document.getElementById("endlessModeBtn").style.display = unlockedEndless ? "block" : "none";
}

// LOGOUT
function handleLogout() {
  cancelAnimationFrame(animationFrameId);
  document.getElementById("menu").style.display = "none";
  document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("gameOverScreen").style.display = "none";
  document.getElementById("endlessPopup").style.display = "none";

  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("playerName").value = "";
  document.getElementById("profileBadge").style.display = "none";

  //reset unlock
  score = 0;
  updateScoreDisplay(0);

  //reset unlock 
  unlockedEndless=false;
  localStorage.removeItem("endlessUnlocked");

  canvas.classList.remove("blur");
  bgMusic.pause();
}

// RESET
function resetGameState1() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Initialize bird properly
  bird = {
    x: canvas.width / 2 - 15,
    y: canvas.height / 2,
    velocity: 0,
    width: 60,  // Added explicit dimensions
    height: 60
  };
  pipes = [];
  score = 0;
  isGameOver = false;
  speed = endlessMode ? 4 : 2;
  pipeGap = endlessMode ? 110 : 150;
  bgIndex = 0;
  lastPipe = 0;
  updateScoreDisplay(score);
}

// LOAD
function loadThemeImages(themeIndex) {
  return Promise.all(
    themes[themeIndex].map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(`Failed to load image: ${src}`);
        img.src = src;
      });
    })
  );
}

function loadBirdImage(color) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(`Failed to load bird image: ${color}`);
    img.src = birdImgs[color];
  });
}

function handlePlay() {
  const selectedBgInput = document.querySelector('input[name="bg"]:checked');
  const selectedBirdInput = document.querySelector('input[name="bird"]:checked');

  if (!selectedBgInput || !selectedBirdInput) {
    alert("Please select both a background and a bird color before playing.");
    return;
  }

  selectedTheme = parseInt(selectedBgInput.value);
  selectedBirdColor = selectedBirdInput.value;
  localStorage.setItem("selectedBird", selectedBirdColor);

  startGame(selectedTheme);
}


// START NORMAL
function startGame(themeIndex) {
  selectedTheme = themeIndex;
  endlessMode = false;
  resetGameState1();

  Promise.all([
    loadThemeImages(selectedTheme),
    loadBirdImage(selectedBirdColor)
  ])
  .then(([images, loadedBird]) => {
    bgImages = images;
    birdImg = loadedBird;

    document.getElementById("menu").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    document.getElementById("gameOverScreen").style.display = "none";
    bgMusic.play();
    animationFrameId = requestAnimationFrame(gameLoop);
  })
  .catch(err => console.error("Error loading theme or bird image:", err));
}

// START ENDLESS
function startEndlessGame() {
  endlessMode = true;
  selectedTheme = 0;
  resetGameState1();

  Promise.all([
    loadThemeImages(selectedTheme),
    loadBirdImage(selectedBirdColor)
  ])
  .then(([images, loadedBird]) => {
    bgImages = images;
    birdImg = loadedBird;

    document.getElementById("menu").style.display = "none";
    document.getElementById("gameCanvas").style.display = "block";
    document.getElementById("gameOverScreen").style.display = "none";
    bgMusic.play();
    animationFrameId = requestAnimationFrame(gameLoop);
  })
  .catch(err => console.error("Error loading theme or bird image:", err));
}

// PIPES
function createPipe() {
  const top = Math.random() * (canvas.height - pipeGap - 100) + 50;
  pipes.push({ x: canvas.width, top });
}

// GAME OVER
function handleGameOver() {
  isGameOver = true;
  cancelAnimationFrame(animationFrameId);
  //if game over,ednless
  if (!endlessMode && !unlockedEndless && score >= 2) {
    unlockedEndless = true;
    document.getElementById("endlessModeBtn").style.display = "block";
    localStorage.setItem("endlessUnlocked", "true");
    showEndlessUnlockPopup();
    return; // Exit before showing normal game over
  }
  // Otherwise, show normal game over
  canvas.classList.add("blur");
  document.getElementById("gameOverScreen").style.display = "flex";
  document.getElementById("finalScore").textContent = score;
  showGameOver(score);
}

// POPUP
function showEndlessUnlockPopup() {
  // HIDDEN GAME OVER SCREEN (critical)
  document.getElementById("gameOverScreen").style.display = "none";
  // Freeze everything
  canvas.classList.add("blur");
  document.getElementById("endlessPopup").style.display = "flex";
  document.getElementById("endlessPopup").classList.add("show");
  //document.getElementById("endlessPopup").style.
  console.log("Popup should be visible now!");
}

function switchToEndlessMode() {
  isGameOver=false;
  // Reset visuals
  document.getElementById("endlessPopup").style.display = "none";
  canvas.classList.remove("blur");
  
  // START ENDLESS MODE
  startEndlessGame(); 
}

function keepPlayingNormal() {
  isGameOver = false;
  // Reset visuals
  document.getElementById("endlessPopup").style.display = "none";
  canvas.classList.remove("blur");
  
  // CONTINUE CURRENT GAME
  animationFrameId = requestAnimationFrame(gameLoop);
}

// UPDATE
function update() {
  if (isGameOver) return;
  bird.velocity += 0.2;
  bird.y += bird.velocity;

  for (let pipe of pipes) {
    pipe.x -= speed;

    if (!pipe.passed && pipe.x + 50 < bird.x) {
      score++;
      pipe.passed = true;
      updateScoreDisplay(score);
    }
    if (
      bird.x + 30 > pipe.x && bird.x < pipe.x + 50 &&
      (bird.y < pipe.top || bird.y + 45 > pipe.top + pipeGap)
    ) {
      handleGameOver();
      return;
    }

  }

  pipes = pipes.filter(p => p.x + 50 > 0);

  if (bird.y + 30 > canvas.height - 50 || bird.y < 0) {
    handleGameOver();
  }

  if (!endlessMode) {
    if (score >=6) {
      speed = 4;
      bgIndex = 2;
      pipeGap = 100
    }  else if (score >=3) {
      speed = 3;
      bgIndex = 1;
      pipeGap = 125
    } else {
      speed = 2;
      bgIndex = 0;
    }
  }

  if (endlessMode) {
    speed = 5;
    bgIndex = 2;
  }
}

// DRAW
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImages[bgIndex], 0, 0, canvas.width, canvas.height);

  for (let pipe of pipes) {
    ctx.drawImage(pipeImg, pipe.x, 0, 50, pipe.top);
    ctx.drawImage(pipeImg, pipe.x, pipe.top + pipeGap, 50, canvas.height - pipe.top - pipeGap);
  }

  ctx.drawImage(birdImg, bird.x, bird.y, 45, 45);
}

// SHOW GAME OVER
function showGameOver(score) {
  document.getElementById("finalScoreText").textContent = "Score: " + score;
  canvas.classList.add("blur");
  document.getElementById("gameOverScreen").style.display = "flex";
  document.getElementById("normalButtons").style.display = endlessMode ? "none" : "block";
  document.getElementById("endlessButtons").style.display = endlessMode ? "block" : "none";
  bgMusic.pause();
}

// RESTART / MENU
function restartGame() {
  document.getElementById("gameOverScreen").style.display = "none";
  canvas.classList.remove("blur");
  endlessMode ? startEndlessGame() : startGame(selectedTheme);
}

function goToMenu() {
  document.getElementById("gameOverScreen").style.display = "none";
  document.getElementById("menu").style.display = "block";
  document.getElementById("gameCanvas").style.display = "none";
  canvas.classList.remove("blur");
  bgMusic.pause();

  document.getElementById("endlessModeBtn").style.display = unlockedEndless ? "block" : "none";
}

// MUSIC
const bgMusic = new Audio("assets/music.mp3");
bgMusic.loop = true;

function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
    document.getElementById("music-toggle").textContent = "Pause Music";
  } else {
    bgMusic.pause();
    document.getElementById("music-toggle").textContent = "Play Music";
  }
}

// KEYBOARD
document.addEventListener("keydown", () => {
  if (!isGameOver) {
    bird.velocity = -6;
  }
});

// SCORE DISPLAY UPDATE
function updateScoreDisplay(score) {
  document.getElementById("finalScoreText").textContent = "Score: " + score;
  const badge = document.getElementById("displayScore");
  if (badge) badge.textContent = score;
}

// MAIN LOOP
function gameLoop(timestamp) {
  if (isGameOver) return; // Add this early return
  
  if (!lastPipe || timestamp - lastPipe > 1500) {
    createPipe();
    lastPipe = timestamp;
  }

  update();
  draw();

  if (!isGameOver) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}