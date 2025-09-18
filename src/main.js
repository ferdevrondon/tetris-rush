import "./style.css";

// Initialize the canvas and context
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

const BLOCK_SIZE = 25;
const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 40;

let score = 0;
// Set the canvas size based on the block size and board dimensions
canvas.width = BLOCK_SIZE * BOARD_WIDTH;
canvas.height = BLOCK_SIZE * BOARD_HEIGHT;

// Scale the context to match the block size
context.scale(BLOCK_SIZE, BLOCK_SIZE);
const board = createBoard(BOARD_WIDTH, BOARD_HEIGHT);

function createBoard(width, height) {
  return Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));
}

const PIECE_COLORS = [
  { main: "#FFD700", light: "#FFFF66", dark: "#B8860B" }, // Dorado
  { main: "#FF6B6B", light: "#FF9999", dark: "#CC5555" }, // Rojo
  { main: "#4ECDC4", light: "#7FDDDD", dark: "#3EA99C" }, // Turquesa
  { main: "#45B7D1", light: "#66CCFF", dark: "#3690B0" }, // Azul
  { main: "#8dca92", light: "#B8E6D2", dark: "#7AB896" }, // Verde
  { main: "#ff9a6b", light: "#f0c5a9", dark: "#cc8355 " }, // Amarillo
  { main: "#aca0dd", light: "#c5b8e6", dark: "#906ebb" }, // Púrpura
];

const piece = {
  position: { x: 5, y: 5 },
  shape: [
    [1, 1],
    [1, 1],
  ],
  colorIndex: 0,
};

const PIECES = [
  [
    [1, 1],
    [1, 1],
  ], // Square
  [
    [1, 0, 0],
    [1, 1, 1],
  ], // L-shape
  [
    [0, 0, 1],
    [1, 1, 1],
  ], // Reverse L-shape
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // S-shape
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // Z-shape
  [
    [0, 1, 0],
    [1, 1, 1],
  ], // T-shape
  [[1, 1, 1, 1]], // Line
];

let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > 1000) {
    piece.position.y++;
    if (collisionDetected()) {
      piece.position.y--;
      solidifyPiece();
      clearLines();
    }
    dropCounter = 0;
  }

  draw();
  window.requestAnimationFrame(update);
   document.querySelector("span").textContent = `Score: ${score}`;
}

function draw3DBlock(x, y, colorSet, withShadow = false) {
  const { main, light, dark } = colorSet;


  if (withShadow) {
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.4)";
    context.shadowBlur = 3;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    context.fillStyle = main;
    context.fillRect(x, y, 1, 1);
    context.restore();
  }

  // main block
  context.fillStyle = main;
  context.fillRect(x, y, 1, 1);

  // top border (light)
  context.fillStyle = light;
  context.fillRect(x, y, 1, 0.15);
  context.fillRect(x, y, 0.15, 1);

  // right border (shadow)
  context.fillStyle = dark;
  context.fillRect(x, y + 0.85, 1, 0.15);
  context.fillRect(x + 0.85, y, 0.15, 1);

  // Inner shadow for 3D effect
  context.fillStyle = dark;
  context.fillRect(x + 0.85, y + 0.85, 0.15, 0.15);
}

function draw() {

  const gradient = context.createLinearGradient(0, 0, 0, BOARD_HEIGHT);

  gradient.addColorStop(0, "#6e9bb2");
  gradient.addColorStop(0.5, "#7bacc4");
  gradient.addColorStop(1, "#9acce4");

  context.fillStyle = gradient;

   context.fill();
  context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);


  board.forEach((row, y) => {
    row.forEach((block, x) => {
      if (block !== 0) {
        const colorIndex = (block - 1) % PIECE_COLORS.length;
        draw3DBlock(x, y, PIECE_COLORS[colorIndex]);
      }
    });
  });


  piece.shape.forEach((row, y) => {
    row.forEach((block, x) => {
      if (block === 1) {
        const pieceX = piece.position.x + x;
        const pieceY = piece.position.y + y;
        draw3DBlock(pieceX, pieceY, PIECE_COLORS[piece.colorIndex], true);
      }
    });
  });


  drawPieceShadow();
}


function drawPieceShadow() {
  let shadowY = piece.position.y;

  //find the lowest position where the piece can fall without collision
  while (!collisionDetectedAt(piece.position.x, shadowY + 1)) {
    shadowY++;
  }

  // draw the shadow only if it is below the current piece position
  if (shadowY > piece.position.y) {
    piece.shape.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block === 1) {
          const shadowX = piece.position.x + x;
          const currentShadowY = shadowY + y;

          context.save();
          context.globalAlpha = 0.3;
          context.fillStyle = PIECE_COLORS[piece.colorIndex].main;
          context.fillRect(shadowX + 0.1, currentShadowY + 0.1, 0.8, 0.8);
          context.restore();
        }
      });
    });
  }
}

// Function to check if a collision is detected at a specific position
function collisionDetectedAt(x, y) {
  return piece.shape.find((row, dy) => {
    return row.find((block, dx) => {
      return block !== 0 && board[y + dy]?.[x + dx] !== 0;
    });
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    piece.position.x--;
    if (collisionDetected()) {
      piece.position.x++;
    }
  }
  if (event.key === "ArrowRight") {
    piece.position.x++;
    if (collisionDetected()) {
      piece.position.x--;
    }
  }
  if (event.key === "ArrowDown") {
    piece.position.y++;
    if (collisionDetected()) {
      piece.position.y--;
      solidifyPiece();
      clearLines();
    }
  }

  if (event.key === "ArrowUp") {
    const rotatedShape = piece.shape[0].map((_, index) =>
      piece.shape.map((row) => row[index]).reverse()
    );
    const originalShape = piece.shape;
    piece.shape = rotatedShape;
    if (collisionDetected()) {
      piece.shape = originalShape;
    }
  }
});

function collisionDetected() {
  return piece.shape.find((row, y) => {
    return row.find((block, x) => {
      return (
        block !== 0 && board[piece.position.y + y]?.[piece.position.x + x] !== 0
      );
    });
  });
}

function solidifyPiece() {
  piece.shape.forEach((row, y) => {
    row.forEach((block, x) => {
      if (block !== 0) {
        // save index of the piece color
        board[piece.position.y + y][piece.position.x + x] =
          piece.colorIndex + 1;
      }
    });
  });

  // Reset the piece position after solidifying
  piece.position = {
    x: Math.floor(BOARD_WIDTH / 2) - 1,
    y: 0,
  };

  // Get random piece and color
  const randomIndex = Math.floor(Math.random() * PIECES.length);
  piece.shape = PIECES[randomIndex];
  piece.colorIndex = randomIndex;


  if (collisionDetected()) {
    alert("¡Game Over!");
    board.forEach((row) => row.fill(0));
    piece.position = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
  }
}

function clearLines() {
  const linesToClear = [];
  board.forEach((row, y) => {
    if (row.every((block) => block !== 0)) {
      linesToClear.push(y);
      score += 10; 
     
    }
  });
  linesToClear.forEach((line) => {
    board.splice(line, 1);
    board.unshift(new Array(BOARD_WIDTH).fill(0));
  });
}



document.addEventListener("click", () => {
  update();
  document.querySelector("section").remove();

  const audio = new window.Audio("./tetris.mp3");
  audio.volume = 0.3;
  audio.play();
});

//pendant
// add more styles to the canvas
canvas.style.border = "13px solid #2e154aab";
// add score display
