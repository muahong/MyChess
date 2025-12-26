import { Chess } from 'chess.js';
import { ChessBoard } from './board.js';
import { getBestMove } from './ai.js';
import { analyzeMove } from './analysis.js';

const game = new Chess();
const statusEl = document.getElementById('game-status');
const moveListEl = document.getElementById('move-list');
const capturedWhiteEl = document.getElementById('captured-white');
const capturedBlackEl = document.getElementById('captured-black');

// Analysis Elements
const analysisPanel = document.getElementById('analysis-panel');
const analysisGradeEl = document.getElementById('analysis-grade');
const analysisDetailEl = document.getElementById('analysis-detail');
const analysisSuggestionEl = document.getElementById('analysis-suggestion');
const analyzeBtn = document.getElementById('analyze-btn');

let lastPlayerMove = null;
let playerColor = 'w'; // 'w' for White, 'b' for Black

const board = new ChessBoard('board', game, onUserMove);

const promotionModal = document.getElementById('promotion-modal');
let pendingPromotion = null;

// Player Color Selector
const playerColorEl = document.getElementById('player-color');
if (playerColorEl) {
    playerColorEl.addEventListener('change', () => {
        playerColor = playerColorEl.value;
        startNewGame();
    });
}

// Initialize Promotion Listeners
document.querySelectorAll('.promotion-option').forEach(option => {
    option.addEventListener('click', () => {
        const piece = option.dataset.piece; // q, r, b, n
        finishPromotion(piece);
    });
});

function onUserMove(from, to) {
    // Only allow moves for the player's color
    if (game.turn() !== playerColor) return;

    // Check if this move needs promotion
    const moves = game.moves({ verbose: true });
    const isPromotion = moves.some(m => m.from === from && m.to === to && m.promotion);

    if (isPromotion) {
        // Show modal
        pendingPromotion = { from, to };
        promotionModal.classList.remove('hidden');
        return;
    }

    // Normal move
    attemptMove(from, to);
}

function finishPromotion(promotionPiece) {
    if (!pendingPromotion) return;

    promotionModal.classList.add('hidden');
    attemptMove(pendingPromotion.from, pendingPromotion.to, promotionPiece);
    pendingPromotion = null;
}

function attemptMove(from, to, promotion = undefined) {
    // Attempt move
    try {
        const move = game.move({ from, to, promotion: promotion || 'q' });

        if (move === null) return; // Illegal move

        lastPlayerMove = move; // Store for manual analysis
        board.render();
        updateStatus();

        // Auto-Hide analysis on new move
        if (analysisPanel) analysisPanel.classList.add('hidden');

        // AI Turn
        if (!game.isGameOver()) {
            setTimeout(makeAIMove, 250);
        }
    } catch (e) {
        console.log('Invalid move', e);
    }
}

async function runAnalysis(moveObj) {
    if (!moveObj || !analysisPanel) return;

    // Show preparing...
    analysisPanel.classList.remove('hidden');
    analysisGradeEl.textContent = 'Analyzing...';
    analysisGradeEl.className = 'analysis-grade';
    analysisDetailEl.textContent = '';
    analysisSuggestionEl.textContent = '';

    // Run analysis
    const result = await analyzeMove(game, moveObj, 2);

    // Update UI
    analysisGradeEl.textContent = result.grade;

    if (result.grade === 'Best Move') analysisGradeEl.classList.add('grade-best');
    else if (result.grade === 'Alternative') analysisGradeEl.classList.add('grade-inaccuracy');

    analysisSuggestionEl.textContent = result.suggestion !== 'None' ? `Engine preferred: ${result.suggestion}` : '';
}

if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
        if (lastPlayerMove) {
            runAnalysis(lastPlayerMove);
        } else {
            alert('Make a move first!');
        }
    });
}

const difficultyEl = document.getElementById('difficulty');

function makeAIMove() {
    statusEl.textContent = 'AI is thinking...';
    // Use timeout to allow UI to render first
    setTimeout(() => {
        const depth = parseInt(difficultyEl.value, 10);
        const bestMove = getBestMove(game, depth);
        if (bestMove) {
            game.move(bestMove);
            board.render();
            updateStatus();
        }
    }, 10);
}

function updateStatus() {
    let status = '';

    if (game.isCheckmate()) {
        status = `Game over, ${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate!`;
    } else if (game.isDraw()) {
        status = 'Game over, drawn position';
    } else {
        status = `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
        if (game.inCheck()) {
            status += ', ' + (game.turn() === 'w' ? 'White' : 'Black') + ' is in check';
        }
    }

    statusEl.textContent = status;
    updateMoveHistory();
    updateCapturedPieces();
}

function updateMoveHistory() {
    moveListEl.innerHTML = '';
    const history = game.history();
    history.forEach((move, i) => {
        const div = document.createElement('div');
        div.className = 'move-entry';
        // Prefix number only for White's moves (even indices)
        div.textContent = (i % 2 === 0) ? `${Math.floor(i / 2) + 1}. ${move}` : move;
        moveListEl.appendChild(div);
    });
    moveListEl.scrollTop = moveListEl.scrollHeight;
}

function updateCapturedPieces() {
    // Basic captured logic - skip for now
}

function startNewGame() {
    game.reset();
    lastPlayerMove = null;
    if (analysisPanel) analysisPanel.classList.add('hidden');

    // Flip board based on player color
    board.setFlipped(playerColor === 'b');
    board.render();
    updateStatus();

    // If player is Black, AI (White) moves first
    if (playerColor === 'b') {
        setTimeout(makeAIMove, 300);
    }
}

document.getElementById('reset-btn').addEventListener('click', () => {
    // Read current player color selection
    if (playerColorEl) {
        playerColor = playerColorEl.value;
    }
    startNewGame();
});

document.getElementById('undo-btn').addEventListener('click', () => {
    // Undo both moves (player + AI)
    if (game.history().length >= 2) {
        game.undo();
        game.undo();
    } else if (game.history().length === 1) {
        game.undo();
    }

    lastPlayerMove = null;
    if (analysisPanel) analysisPanel.classList.add('hidden');
    board.render();
    updateStatus();
});

// Initial Render
board.render();
updateStatus();

