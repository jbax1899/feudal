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
        const boardWidth = boardData.width * this.tileSize;
        const boardHeight = boardData.height * this.tileSize;
        this.boardContainer.setSize(boardWidth, boardHeight);
        this.boardContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, boardWidth, boardHeight), Phaser.Geom.Rectangle.Contains);
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
                    const sprite = this.scene.add.sprite(col * this.tileSize, row * this.tileSize, tileKey)
                        .setOrigin(0)
                        .setDisplaySize(this.tileSize, this.tileSize);
                    this.boardContainer.add(sprite); // Add to container
                }
            }
        }
    }    
}

export default Board;