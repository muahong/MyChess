import { Chess } from 'chess.js';

const PIECE_IMAGES = {
    'w': {
        'p': './public/assets/pieces/wp.svg',
        'n': './public/assets/pieces/wn.svg',
        'b': './public/assets/pieces/wb.svg',
        'r': './public/assets/pieces/wr.svg',
        'q': './public/assets/pieces/wq.svg',
        'k': './public/assets/pieces/wk.svg'
    },
    'b': {
        'p': './public/assets/pieces/bp.svg',
        'n': './public/assets/pieces/bn.svg',
        'b': './public/assets/pieces/bb.svg',
        'r': './public/assets/pieces/br.svg',
        'q': './public/assets/pieces/bq.svg',
        'k': './public/assets/pieces/bk.svg'
    }
};

export class ChessBoard {
    constructor(elementId, game, onMove) {
        this.boardEl = document.getElementById(elementId);
        this.game = game;
        this.onMove = onMove;
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.flipped = false;
    }

    setFlipped(value) {
        this.flipped = value;
    }

    render() {
        this.boardEl.innerHTML = '';
        const board = this.game.board(); // 8x8 array of null or objects

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                // When flipped, reverse both row and column indices
                const r = this.flipped ? 7 - i : i;
                const c = this.flipped ? 7 - j : j;

                const squareVal = board[r][c];
                const squareEl = document.createElement('div');
                const squareName = String.fromCharCode(97 + c) + (8 - r); // e.g. 'a8'

                const isDark = (r + c) % 2 === 1;
                squareEl.className = `square ${isDark ? 'dark' : 'light'}`;
                squareEl.dataset.square = squareName;

                // Highlight logic
                if (this.selectedSquare === squareName) {
                    squareEl.classList.add('selected');
                }

                // Possible moves highlight
                if (this.possibleMoves.some(m => m.to === squareName)) {
                    squareEl.classList.add('highlight');
                    // Allow click to move (for hybrid usage)
                    squareEl.onclick = (e) => {
                        e.stopPropagation(); // prevent misfire
                        this.handleMove(squareName);
                    };
                } else {
                    squareEl.onclick = (e) => {
                        e.stopPropagation();
                        this.handleClick(squareName);
                    };
                }

                // Drag Over / Drop for all squares
                squareEl.addEventListener('dragover', (e) => this.handleDragOver(e));
                squareEl.addEventListener('drop', (e) => this.handleDrop(e, squareName));

                // Render Piece
                if (squareVal) {
                    const pieceImg = document.createElement('div');
                    pieceImg.className = 'piece';
                    pieceImg.style.backgroundImage = `url(${PIECE_IMAGES[squareVal.color][squareVal.type]})`;

                    // Enable Drag only for current turn's pieces
                    if (squareVal.color === this.game.turn()) {
                        pieceImg.draggable = true;
                        pieceImg.classList.add('draggable');
                        pieceImg.addEventListener('dragstart', (e) => this.handleDragStart(e, squareName));
                    }

                    squareEl.appendChild(pieceImg);
                }

                // Check highlight
                if (squareVal && squareVal.type === 'k' && this.game.isCheck() && squareVal.color === this.game.turn()) {
                    squareEl.classList.add('check');
                }

                this.boardEl.appendChild(squareEl);
            }
        }
    }

    handleClick(square) {
        // If selecting own piece
        const piece = this.game.get(square);
        if (piece && piece.color === this.game.turn()) {
            if (this.selectedSquare === square) {
                this.deselect();
            } else {
                this.select(square);
            }
        } else {
            this.deselect();
        }
    }

    select(square) {
        this.selectedSquare = square;
        this.possibleMoves = this.game.moves({ square: square, verbose: true });
        this.render();
    }

    deselect() {
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.render();
    }

    handleMove(toSquare) {
        const fromSquare = this.selectedSquare;
        // logic moved to main mostly, but here we just pass up
        this.deselect();
        this.onMove(fromSquare, toSquare);
    }

    handleDragStart(e, square) {
        // e.dataTransfer.effectAllowed = 'move';
        // Store from square
        e.dataTransfer.setData('text/plain', square);

        // Optional: Select the square visually as if clicked
        // setTimeout(() => this.select(square), 0);

        // Custom drag image? Default is fine for now.
        // We can add a class to hide the original temporarily?
        // e.target.style.opacity = '0'; 
    }

    handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e, toSquare) {
        e.preventDefault();
        const fromSquare = e.dataTransfer.getData('text/plain');

        // Ensure we dropped on a different square and valid source
        if (fromSquare && fromSquare !== toSquare) {
            this.onMove(fromSquare, toSquare);
        }
    }
}
