import Piece from './Piece.js';

class Board {
    constructor(scene) {
        this.scene = scene;
        this.boardContainer = null;
        this.boardDate = null;
        this.tileSize = 64;
        this.pieces = [];
        this.moveCircles = [];
        this.selectedPiece = null;
        this.selectedPlayer = 1;
    }

    preload() {
        this.scene.load.setBaseURL('assets');
        this.scene.load.json('boardData', 'boardData.json');
        this.scene.load.image('grass', 'img/grass.png');
        this.scene.load.image('hill', 'img/hill.png');
        this.scene.load.image('mountain', 'img/mountain.png');
    }

    create() {
        this.boardContainer = this.scene.add.container();
        this.boardData = this.scene.cache.json.get('boardData');
        this.drawBoard();

        // Define the interactive area
        const boardWidth = this.boardData.tiles[0].length * this.tileSize;
        const boardHeight = this.boardData.tiles.length * this.tileSize;
        this.boardContainer.setSize(boardWidth, boardHeight);
        this.boardContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, boardWidth, boardHeight), Phaser.Geom.Rectangle.Contains);
        
        // Key listeners
        this.pKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.rKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        // General keydown listener
        this.scene.input.keyboard.on('keydown', (event) => {
            const key = event.key; // Get the pressed key
            const keyNumber = parseInt(key); // Convert key to a number

            if (!isNaN(keyNumber)) {
                this.selectPiece(keyNumber);
            }

            // DEBUG - change player for piece creation
            if (key === '=') {
                if (this.selectedPlayer < 4) {
                    this.selectedPlayer++;
                }
                console.log("Selected player: " + this.selectedPlayer);
            }
            if (key === '-') {
                if (this.selectedPlayer > 1) {
                    this.selectedPlayer--;
                }
                console.log("Selected player: " + this.selectedPlayer);
            }
        });

        // Event listener for clicks
        // Was this.boardContainer, but only worked for top-left quarter of board?
        this.scene.input.on('pointerdown', (pointer) => {
            // Convert view coordinates to world coordinates
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            
            // Convert world coordinates to board coordinates
            const {boardX, boardY} = this.screenToBoard(worldPoint.x, worldPoint.y);
            
            // Check if a piece is selected, and the clicked position contains a move circle
            if (this.selectedPiece != null && this.isMoveCircle(boardX, boardY)) {
                // Move the selected piece to the clicked position
                this.movePiece(this.scene.board.selectedPiece, boardX, boardY);
                this.deselect();
            }
            
            // DEBUG - piece creation on P+left click
            if (this.pKey.isDown) {
                this.addPiece(boardX, boardY, this.pieceSelection);
            }
            if (this.rKey.isDown) {
                this.removePiece(boardX, boardY);
            }
        });
    }

    drawBoard() {
        const tiles = {
            1: 'grass',
            2: 'hill',
            3: 'mountain'
        };
    
        const numRows = this.boardData.tiles.length;
        const numCols = this.boardData.tiles[0].length;
    
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const tileType = this.boardData.tiles[row][col];
                const tileKey = tiles[tileType];
                if (tileKey) {
                    // sprite
                    const sprite = this.scene.add.sprite(col * this.tileSize, row * this.tileSize, tileKey)
                        .setOrigin(0)
                        .setDisplaySize(this.tileSize, this.tileSize);
                    this.boardContainer.add(sprite); // Add to container

                    // outline
                    const outline = this.scene.add.graphics();
                    outline.lineStyle(2, 0x000000);
                    outline.strokeRect(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize);
                    this.boardContainer.add(outline); // Add to container
                }
            }
        }

        // Add thick lines after the grid is drawn
        const thickLineGraphics = this.scene.add.graphics();
        thickLineGraphics.lineStyle(6, 0x000000);
        // Vertical line between columns 12 and 13
        thickLineGraphics.beginPath();
        thickLineGraphics.moveTo(12 * this.tileSize, 0);
        thickLineGraphics.lineTo(12 * this.tileSize, numRows * this.tileSize);
        thickLineGraphics.strokePath();
        // Horizontal line between rows 12 and 13
        thickLineGraphics.beginPath();
        thickLineGraphics.moveTo(0, 12 * this.tileSize);
        thickLineGraphics.lineTo(numCols * this.tileSize, 12 * this.tileSize);
        thickLineGraphics.strokePath();
        // Add to container
        this.boardContainer.add(thickLineGraphics);

        // Set depth of board container
        this.boardContainer.setDepth(-1);
    }

    // Method to convert screen coordinates to board coordinates
    screenToBoard(screenX, screenY) {
        const x = screenX - this.boardContainer.x;
        const y = screenY - this.boardContainer.y;
        const boardX = Math.floor(x / this.tileSize);
        const boardY = Math.floor(y / this.tileSize);
        return { boardX, boardY };
    }

    // Method to convert board coordinates to screen coordinates
    boardToScreen(boardX, boardY) {
        const x = boardX * this.tileSize;
        const y = boardY * this.tileSize;
        return { x, y };
    }

    // Method to check if board coordinates are within the board bounds
    isCoordinate(boardX, boardY) {
        return (
            boardX >= 0 &&
            boardX < this.boardData.tiles[0].length &&
            boardY >= 0 &&
            boardY < this.boardData.tiles.length
        );
    }

    getTile(boardX, boardY) {
        // Check if coordinate is within the board
        if (boardX < 0 || boardX >= this.boardWidth || boardY < 0 || boardY >= this.boardHeight) {
            return 0;
        }
        return this.boardData.tiles[boardY][boardX];
    }

    // Method to handle piece selection
    selectPiece(number) {
        this.pieceSelection = number;
        console.log(`Piece selection changed to: ${Piece.types[number]} (${number})`);
    }

    // Method to get the piece at the specified board coordinates
    getPiece(boardX, boardY) {
        return this.pieces.find(piece => piece.pos.x === boardX && piece.pos.y === boardY) || null;
    }

    // Method to add a piece at the specified board coordinates
    addPiece(boardX, boardY, type) {
        // Ensure the coordinates are within the board bounds
        if (!this.isCoordinate(boardX, boardY)) {
            console.error(`Cannot place piece - Invalid board coordinates: (${boardX}, ${boardY})`);
            return false;
        }
        if (this.getPiece(boardX, boardY)) {
            console.error(`Cannot place piece - Space is already occupied: (${boardX}, ${boardY})`);
            return false; // Space is already occupied
        }

        // Convert board coordinates to screen coordinates
        const { x, y } = this.boardToScreen(boardX, boardY);

        // Create and place the piece
        const piece = new Piece(this.scene, x, y, type, this.selectedPlayer);
        piece.pos.x = boardX;
        piece.pos.y = boardY;
        this.pieces.push(piece);
        console.log("Created " + Piece.types[piece.type] 
                    + " piece at " + boardX + "," + boardY 
                    + " for player " + this.selectedPlayer);
        return true;
    }

    // Method to remove a piece from the specified board coordinates
    removePiece(boardX, boardY) {
        const pieceIndex = this.pieces.findIndex(piece => piece.pos.x === boardX && piece.pos.y === boardY);
        if (pieceIndex === -1) {
            console.error(`No piece found at (${boardX}, ${boardY})`);
            return false; // No piece found at the specified location
        }

        // Remove the piece sprite and remove it from the array
        this.pieces[pieceIndex].sprite.destroy();
        this.pieces.splice(pieceIndex, 1);
        console.log(`Removed piece from (${boardX}, ${boardY})`);
        return true; // Successfully removed the piece
    }

    isLegalMove(boardX, boardY) {
        // Check if the coordinates are within the board bounds
        if (boardX < 0 || boardX >= this.boardWidth || boardY < 0 || boardY >= this.boardHeight) {
            return false;
        }
    
        // Check if the space is occupied by another piece
        if (this.getPiece(boardX, boardY)) {
            console.log("cannot, piece in the way")
            return false;
        }

        // Check if the space is a mountain (impassible)
        if (this.getTile(boardX, boardY) == 3) {
            return false;
        }

        return true; // All checks passed, is a legal move
    }

    drawMoveCircle(boardX, boardY) {
        const x = boardX * this.tileSize + this.tileSize / 2;
        const y = boardY * this.tileSize + this.tileSize / 2;
        const circle = this.scene.add.circle(x, y, this.tileSize / 4, 0x00ff00, 0.5); // Green circle with 50% alpha
        circle.boardX = boardX;
        circle.boardY = boardY;
        this.boardContainer.add(circle); // Add the circle to the board container
        this.moveCircles.push(circle); // Store the circle reference
    }

    // Check if the clicked coordinate is a move circle
    isMoveCircle(boardX, boardY) {
        return this.moveCircles.some(circle => circle.boardX === boardX && circle.boardY === boardY);
    }

    showMoves(piece) {
        const orthogonalRange = piece.orthogonalRange;
        const diagonalRange = piece.diagonalRange;
        const { boardX, boardY } = this.screenToBoard(piece.sprite.x, piece.sprite.y);
    
        // Draw orthogonal moves
        // Up
        for (let i = 1; i <= orthogonalRange; i++) {
            if (this.isLegalMove(boardX, boardY + i)) {
                this.drawMoveCircle(boardX, boardY + i); // Up
            } else break;
        }
        
        // Down
        for (let i = 1; i <= orthogonalRange; i++) {
            if (this.isLegalMove(boardX, boardY - i)) {
                this.drawMoveCircle(boardX, boardY - i); // Down
            } else break;
        }
        
        // Right
        for (let i = 1; i <= orthogonalRange; i++) {
            if (this.isLegalMove(boardX + i, boardY)) {
                this.drawMoveCircle(boardX + i, boardY); // Right
            } else break;
        }
        
        // Left
        for (let i = 1; i <= orthogonalRange; i++) {
            if (this.isLegalMove(boardX - i, boardY)) {
                this.drawMoveCircle(boardX - i, boardY); // Left
            } else break;
        }
    
        // Draw diagonal moves
        // Bottom-right
        for (let i = 1; i <= diagonalRange; i++) {
            if (this.isLegalMove(boardX + i, boardY + i)) {
                this.drawMoveCircle(boardX + i, boardY + i); // Bottom-right
            } else break;
        }
        
        // Top-right
        for (let i = 1; i <= diagonalRange; i++) {
            if (this.isLegalMove(boardX + i, boardY - i)) {
                this.drawMoveCircle(boardX + i, boardY - i); // Top-right
            } else break;
        }
        
        // Bottom-left
        for (let i = 1; i <= diagonalRange; i++) {
            if (this.isLegalMove(boardX - i, boardY + i)) {
                this.drawMoveCircle(boardX - i, boardY + i); // Bottom-left
            } else break;
        }
        
        // Top-left
        for (let i = 1; i <= diagonalRange; i++) {
            if (this.isLegalMove(boardX - i, boardY - i)) {
                this.drawMoveCircle(boardX - i, boardY - i); // Top-left
            } else break;
        }
    }    

    hideMoves() {
        this.moveCircles.forEach(circle => circle.destroy()); // Remove each circle from the scene
        this.moveCircles = []; // Clear the array
    }

    deselect() {
        this.hideMoves();
        this.selectedPiece = null;
    }

    movePiece(piece, targetX, targetY) {
        const { x, y } = this.boardToScreen(targetX, targetY);
        piece.sprite.x = x;
        piece.sprite.y = y;
        piece.pos.x = targetX;
        piece.pos.y = targetY;
        this.deselect();
        console.log(`Moved ${piece.typeName} piece to: ${targetX}, ${targetY}`);
    }
}

export default Board;