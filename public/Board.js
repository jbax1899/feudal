import Piece from './Piece.js';

class Board {
    constructor(scene) {
        this.scene = scene;
        this.boardContainer = null;
        this.tileSize = 64;
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
        // General keydown listener
        this.scene.input.keyboard.on('keydown', (event) => {
            const key = event.key; // Get the pressed key
            const keyNumber = parseInt(key); // Convert key to a number

            if (!isNaN(keyNumber)) {
                this.selectPiece(keyNumber);
            }
        });

        // Event listener for clicks
        // Was this.boardContainer, but only worked for top-left quarter of board?
        this.scene.input.on('pointerdown', (pointer) => {
            // Convert screen coordinates to world coordinates
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            
            // Convert world coordinates to board coordinates
            const {boardX, boardY} = this.screenToBoard(worldPoint.x, worldPoint.y);
            //console.log(`Clicked on board coordinates: (${boardX}, ${boardY})`);
            
            // DEBUG - piece creation on P+left click
            if (this.pKey.isDown) {
                this.createPiece(boardX, boardY);
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

    // Method to create a piece at the specified board coordinates
    createPiece(boardX, boardY, type) {
        // Ensure the coordinates are within the board bounds
        if (!this.isCoordinate(boardX, boardY)) {
            console.error(`Cannot place piece due to invalid board coordinates: (${boardX}, ${boardY})`);
            return;
        }

        // Convert board coordinates to screen coordinates
        const { x, y } = this.boardToScreen(boardX, boardY);

        // Create and add the piece sprite
        const piece = new Piece(this.scene, this.pieceSelection);
        const pieceSprite = piece.create(x, y); // Create the sprite and get it
        this.boardContainer.add(pieceSprite); // Add to board container

        console.log("Created " + Piece.types[piece.type] + " piece at " + boardX + "," + boardY);
    }

    // Method to handle piece selection
    selectPiece(number) {
        this.pieceSelection = number;
        console.log(`Piece selection changed to: ${Piece.types[number]} (${number})`);
    }
}

export default Board;