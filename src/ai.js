// Piece values (Standard)
const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// PESTO Tables (Middle Game version simplified)
// Source: https://www.chessprogramming.org/PeSTO's_Evaluation_Function
// Defined from White's perspective, A1..H8.
// We need to map our board (rank 0=8, rank 7=1) to these if they are standard.
// But easier to just define them visually 0..63 where 0 is a8.
// Let's use standard tables flipped for Black.

const FLIP = [
    56, 57, 58, 59, 60, 61, 62, 63,
    48, 49, 50, 51, 52, 53, 54, 55,
    40, 41, 42, 43, 44, 45, 46, 47,
    32, 33, 34, 35, 36, 37, 38, 39,
    24, 25, 26, 27, 28, 29, 30, 31, // Corrected flip logic for index
    16, 17, 18, 19, 20, 21, 22, 23,
    8, 9, 10, 11, 12, 13, 14, 15,
    0, 1, 2, 3, 4, 5, 6, 7
];

// Simplified PST (Piece-Square Tables)
// High values in center for knights/pawns. 
// Rooks on open files (handled by logic vs table usually, but table helps position).

const PAWN_PST = [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0
];

const KNIGHT_PST = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
];

const BISHOP_PST = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
];

const ROOK_PST = [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0
];

const QUEEN_PST = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20
];

const KING_PST = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20
];

// Map piece type to table
const PST = {
    p: PAWN_PST,
    n: KNIGHT_PST,
    b: BISHOP_PST,
    r: ROOK_PST,
    q: QUEEN_PST,
    k: KING_PST
};

function evaluateBoard(game) {
    let totalEvaluation = 0;
    const board = game.board();

    // Iterate simplified, board is 8x8
    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            const piece = board[rank][file];
            if (piece) {
                const value = PIECE_VALUES[piece.type];
                const squareIndex = rank * 8 + file;

                let positionValue = 0;
                if (piece.color === 'w') {
                    // White uses table as is (assuming table is 0=a8 -- wait, standard tables are usually 0=a1 but my arrays above are visual.
                    // My arrays: Check Pawn Table row 1 (index 8-15) -> 50s. This corresponds to Rank 7 (White Pawns Start).
                    // Wait, White Pawns start at Rank 6 (index 48-55) in 0-indexed a8-h1 array?
                    // Let's trace:
                    // chess.js board(): [0][0] is a8. [7][0] is a1.
                    // White pawns start at row 6 (2nd from bottom).
                    // My Pawn table row 1 has 50s. Row 6 has 5,10...
                    // So my table is actually from BLACK's perspective? 
                    // Or I just copied a table that assumes 0=a1?

                    // Let's standardise: 
                    // Index 0 = a8.
                    // White Pawns are at indices 48..55. They advance to 0.
                    // If White Pawn is at index 8 (Rank 7), it's close to promotion. It should have HIGH value.
                    // My table[8] is 50. This is good.
                    // So my table is oriented for WHITE moving UP (to index 0).
                    // So for White, we use the table as is.

                    positionValue = PST[piece.type][squareIndex];
                    totalEvaluation += (value + positionValue);
                } else {
                    // Black
                    // Black Pawns start at row 1 (indices 8..15). They go DOWN to row 7.
                    // We need to mirror the table. 
                    // Equivalent of "White piece at mirrored square".
                    // Rank 0 <-> Rank 7.
                    // square 0 (a8) <-> square 56 (a1).
                    // We can use a mirror map.
                    const mirrorIndex = squareIndex ^ 56; // Fast vertical flip for 8x8? No, 56 is only row flip if xor works?
                    // Row 0 (0-7) <-> Row 7 (56-63). 0^56 = 56. 7^56 = 63. Correct.

                    positionValue = PST[piece.type][mirrorIndex];
                    totalEvaluation -= (value + positionValue);
                }
            }
        }
    }
    return totalEvaluation;
}

// Move Ordering: Score moves to improve alpha-beta pruning
function scoreMove(move) {
    let score = 0;
    // Captures (MVV-LVA: Most Valuable Victim - Least Valuable Aggressor logic simplified)
    if (move.captured) {
        score += 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
    }
    if (move.promotion) {
        score += 900;
    }
    // Killer moves / History heuristic could go here
    return score;
}

export function getBestMove(game, depth = 3) {
    if (game.isGameOver()) return null;

    let bestMove = null;
    const isMaximizing = game.turn() === 'w'; // White maximizes

    const moves = game.moves({ verbose: true });

    // Sort moves for Alpha-Beta pruning efficiency
    moves.sort((a, b) => scoreMove(b) - scoreMove(a));

    let alpha = -Infinity;
    let beta = Infinity;
    let bestValue = isMaximizing ? -Infinity : Infinity;

    for (const move of moves) {
        game.move(move);
        const value = minimax(game, depth - 1, alpha, beta, !isMaximizing);
        game.undo();

        if (isMaximizing) {
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
            alpha = Math.max(alpha, bestValue);
        } else {
            if (value < bestValue) {
                bestValue = value;
                bestMove = move;
            }
            beta = Math.min(beta, bestValue);
        }
        if (beta <= alpha) break;
    }
    return bestMove || moves[0];
}

function minimax(game, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
        // Quiescence Search at leaf nodes
        return quiescence(game, alpha, beta, isMaximizing);
    }
    if (game.isGameOver()) {
        if (game.isCheckmate()) return isMaximizing ? -100000 : 100000; // Mated
        return 0; // Draw
    }

    const moves = game.moves({ verbose: true });

    // Sort moves for Alpha-Beta pruning efficiency (still prioritizes captures)
    moves.sort((a, b) => scoreMove(b) - scoreMove(a));

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evalVal = minimax(game, depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, evalVal);
            alpha = Math.max(alpha, evalVal);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evalVal = minimax(game, depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, evalVal);
            beta = Math.min(beta, evalVal);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Quiescence Search to avoid horizon effect
function quiescence(game, alpha, beta, isMaximizing) {
    const standPat = evaluateBoard(game);

    if (isMaximizing) {
        if (standPat >= beta) return beta;
        if (alpha < standPat) alpha = standPat;
    } else {
        if (standPat <= alpha) return alpha;
        if (beta > standPat) beta = standPat;
    }

    // Only look at captures
    const moves = game.moves({ verbose: true }).filter(m => m.captured);
    moves.sort((a, b) => scoreMove(b) - scoreMove(a));

    for (const move of moves) {
        game.move(move);
        const score = quiescence(game, alpha, beta, !isMaximizing);
        game.undo();

        if (isMaximizing) {
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        } else {
            if (score <= alpha) return alpha;
            if (score < beta) beta = score;
        }
    }
    return isMaximizing ? alpha : beta;
}
