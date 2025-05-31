let startScreen;
let gameScreen;

function setup() {
  createCanvas(windowWidth, windowHeight);
  startScreen = new StartScreen();
  gameScreen = new GameScreen();
  startScreen.show();
}

function draw() {
  // The draw function will be used to update the game state
}

function keyPressed() {
  if (key === 'Enter') {
    startScreen.hide();
    gameScreen.show();
  }
}