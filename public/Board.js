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
        const boardData = this.scene.cache.json.get('boardData');
        this.boardContainer = this.scene.add.container();
        this.drawBoard(boardData);

        // Define the interactive area
        const boardWidth = boardData.tiles[0].length * this.tileSize;
        const boardHeight = boardData.tiles.length * this.tileSize;
        this.boardContainer.setSize(boardWidth, boardHeight);
        this.boardContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, boardWidth, boardHeight), Phaser.Geom.Rectangle.Contains);
        console.log('Board container size:', boardWidth, boardHeight);
        
        // Event listener for clicks
        this.boardContainer.on('pointerdown', (pointer) => {
            const { x, y } = pointer;
            console.log(`Clicked on board coordinates: (${x}, ${y})`);
            const { boardX, boardY } = this.screenToBoard(x, y);
            console.log(`Clicked on board coordinates: (${boardX}, ${boardY})`);
        });
    }

    drawBoard(boardData) {
        const tiles = {
            1: 'grass',
            2: 'hill',
            3: 'mountain'
        };
    
        const numRows = boardData.tiles.length;
        const numCols = boardData.tiles[0].length;
    
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const tileType = boardData.tiles[row][col];
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
            }
        }
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
        const x = boardX * this.tileSize + this.boardContainer.x;
        const y = boardY * this.tileSize + this.boardContainer.y;
        return { x, y };
    }
}

export default Board;