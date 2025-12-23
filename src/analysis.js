
// analysis.js
import { getBestMove } from './ai.js';
import { Chess } from 'chess.js';

// Re-implement evaluation helper or expose it from ai.js? 
// Ideally we reuse ai.js evaluation. But ai.js 'evaluateBoard' is internal.
// Let's modify ai.js to export evaluateBoard or just use getBestMove's internal scoring.
// actually getBestMove evaluates.
// We need to:
// 1. Get score of PLAYER'S move (by making it and evaluating)
// 2. Get score of BEST move (by finding it)
// 3. Compare.

// Note: ai.js 'evaluateBoard' is simple static eval. Minimax gives deeper eval.
// To get a "score" for the player's move, we should run minimax on the resulting position (depth 1 or 2).

// Let's modify ai.js to export `getClickScore` or similar? 
// Or just replicate basic evaluation here if we want simple feedback.
// Better: Add an `evaluateMove(game, move)` to ai.js.

// For now, let's just use a simplified heuristic here or try to import from ai.js if we exported it?
// We didn't export evaluateBoard. 

// Let's assume we update ai.js to export `evaluatePosition(game)` which returns the static score.

// Actually calculating "Best Move" is expensive. We can just call getBestMove(game, depth=2) to get the best move.
// Then how do we score the PLAYER's move?
// We check if PlayerMove === BestMove. -> "Best Move".
// If not, we have to evaluate HOW bad it is.
// We can run `getBestMove` on the position AFTER player move (to see how good opponent's reply is).
// Score = -(Opponent' Best Response Score).

export async function analyzeMove(game, playerMove, depth = 2) {
    const movesUndone = [];

    // Backtrack until we find the player's move
    let found = false;
    // We generally only need to go back 1 or 2 moves (Player or Player+AI)
    // But let's allow a few more just in case of race conditions or complex states
    for (let i = 0; i < 5; i++) {
        const undid = game.undo();
        if (!undid) break;
        movesUndone.push(undid);

        // Strict comparison to ensure we found the exact move object's equivalent
        if (undid.san === playerMove.san &&
            undid.color === playerMove.color &&
            undid.from === playerMove.from &&
            undid.to === playerMove.to) {
            found = true;
            break;
        }
    }

    if (!found) {
        // Restore and fail gracefully
        while (movesUndone.length > 0) game.move(movesUndone.pop());
        return { grade: 'Error', suggestion: 'Move not found in history' };
    }

    // Now we are at the state BEFORE the player's move.
    // Calculate the best move for this position.
    const bestMoveObj = getBestMove(game, 2);

    let grade = 'Good';
    let suggestion = bestMoveObj ? bestMoveObj.san : '';

    const actualMoveSan = playerMove.san;

    if (bestMoveObj && bestMoveObj.san === actualMoveSan) {
        grade = 'Best Move';
        suggestion = 'You found the best move!';
    } else {
        grade = 'Alternative';
    }

    // Restore Game State
    // We interpret movesUndone in reverse order (LIFO)
    // The last pushed was playerMove.
    // We already identified it.
    // So we iterate backwards.

    // movesUndone = [AI_Move, Player_Move] (if AI moved)
    // popped: Player_Move (the one we found)
    // So we loop over the REST.

    // Wait, movesUndone has the move objects.
    // We need to re-apply them.
    // Since we popped Player_Move from the game state, we need to re-apply IT first.
    // Then the AI move.

    // The array has [AI_Move, Player_Move] ( pushed in that order? No. )
    // undo() returns Last Move.
    // 1. Undo AI -> movesUndone.push(AI) -> [AI]
    // 2. Undo Player -> movesUndone.push(Player) -> [AI, Player]

    // To Restore:
    // 1. Move Player
    // 2. Move AI

    // So we iterate movesUndone from END to START.
    for (let i = movesUndone.length - 1; i >= 0; i--) {
        game.move(movesUndone[i]);
    }

    return {
        grade,
        suggestion: bestMoveObj ? bestMoveObj.san : 'None'
    };
}
