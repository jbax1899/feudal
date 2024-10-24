class Piece {
    static types = [
        'blank',
        'king',
        'prince',
        'duke',
        'knight',
        'sergeant',
        'pikeman',
        'squire',
        'archer',
        'castleInner',
        'castleOuter',
        'castleBoth',
    ];
    static moves = [
        { orthogonalRange: 0, diagonalRange: 0, isMounted: false},      // blank
        { orthogonalRange: 2, diagonalRange: 2, isMounted: false},      // king
        { orthogonalRange: 999, diagonalRange: 999, isMounted: true},   // prince
        { orthogonalRange: 999, diagonalRange: 999, isMounted: true},   // duke
        { orthogonalRange: 999, diagonalRange: 999, isMounted: true},   // knight
        { orthogonalRange: 1, diagonalRange: 12, isMounted: false},     // sergeant
        { orthogonalRange: 12, diagonalRange: 1, isMounted: false},     // pikeman
        { orthogonalRange: 0, diagonalRange: 0, isMounted: false},      // squire (moves like chess kight)
        { orthogonalRange: 3, diagonalRange: 3, isMounted: false},      // archer
        { orthogonalRange: 0, diagonalRange: 0, isMounted: false},      // inner castle (does not move)
        { orthogonalRange: 0, diagonalRange: 0, isMounted: false},      // outer castle (does not move)
        { orthogonalRange: 0, diagonalRange: 0, isMounted: false},      // castle (does not move)
    ];

    constructor(scene, x, y, type, player) {
        this.scene = scene;
        this.board = this.scene.board;
        this.gameManager = scene.gameManager;
        
        this.player = scene.gameManager.players[player];
        this.playerNumber = this.player.playerNumber;
        this.id = this.gameManager.pieceIdCounter++; // Assign a unique ID and increment
        this.pos = {x, y};
        // Determine the type index from either a string or number
        if (typeof type === 'string') {
            this.type = Piece.types.indexOf(type);
            if (this.type === -1) {
                console.warn(`Invalid piece type: ${type}. Defaulting to 'blank'.`);
                this.type = 0; // Default to 'blank' if type is invalid
            }
        } else {
            this.type = Number.isInteger(type) && type >= 0 && type < Piece.types.length ? type : 0; // Ensure type is a valid index
        }
        this.typeName = Piece.types[this.type];
        this.key = 'piece_' + this.typeName;
        this.orthogonalRange = Piece.moves[this.type].orthogonalRange;
        this.diagonalRange = Piece.moves[this.type].diagonalRange;
        this.isMounted = Piece.moves[this.type].isMounted;
        this.connectingCastle = null;
        
        // Create the piece sprite and add it to the scene
        this.sprite = this.scene.add.sprite(x, y, this.key)
            .setOrigin(0)
            .setDisplaySize(this.scene.board.tileSize, this.scene.board.tileSize);

        // Recolor the sprite based on the player number
        this.recolorSprite();

        // Set depth
        // Castle must appear below other pieces
        if (this.typeName === 'castleInner' || this.typeName === 'castleOuter') {
            this.sprite.setDepth(0);
        } else {
            this.sprite.setDepth(1);
        }
        
        // Make the piece sprite interactive
        this.sprite.setInteractive();
        this.sprite.on('pointerdown', () => {
            const priorSelected = this.scene.board.selectedPiece;
            // If any piece is selected already, deselect it
            if (this.scene.board.selectedPiece !== null) {
                if (this.scene.board.debug) {
                    console.log(`${Piece.types[this.scene.board.selectedPiece.type]} piece deselected (p` + priorSelected.playerNumber + ')');
                }
                this.scene.board.deselect();
            }
            // Select this piece
            if (this.scene.board.debug) {
                console.log(`Selected piece: ` + this.typeName + ", " 
                            + this.pos.x + "x" + this.pos.y + ", player " + this.playerNumber);
            }
            //
            // Piece Movement
            //
            //If we're in the play stage, AND its our turn
            if (this.scene.gameManager.stage.name === "play"
                && this.scene.gameManager.playerTurn === this.playerNumber) {
                // Select this piece, if it wasn't already
                // Cannot select castle pieces
                if (priorSelected !== this 
                    && this.typeName !== 'castleInner' && this.typeName !== 'castleOuter') {
                    this.scene.board.selectedPiece = this;
                    this.scene.board.showMoves(this);
                    if (this.scene.board.debug) {
                        console.log(`${Piece.types[this.type]} piece selected (p` + this.playerNumber + ')');
                    }
                }
            }
        });
    }

    recolorSprite() {
        const colorData = this.scene.gameManager.playerColors[this.playerNumber];
        if (!colorData) {
            console.warn('Invalid player number:', this.playerNumber);
            return;
        }

        const colorHex = colorData.color;
        const color = parseInt(colorHex, 16); // Convert hex color to integer

        // Generate a unique texture key based on player number
        const textureKey = 'recolored_' + this.key + '_' + this.playerNumber;

        // Check if the texture already exists
        if (this.scene.textures.exists(textureKey)) {
            this.sprite.setTexture(textureKey);
            return; // Exit if texture already exists
        }

        // Get the current texture and create a new canvas
        const texture = this.sprite.texture;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Set canvas size to texture size
        canvas.width = texture.getSourceImage().width;
        canvas.height = texture.getSourceImage().height;

        // Draw the texture onto the canvas
        context.drawImage(texture.getSourceImage(), 0, 0);

        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Loop through each pixel and change blue pixels
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 255) { // Pure blue
                data[i] = (color >> 16) & 0xff;     // Red
                data[i + 1] = (color >> 8) & 0xff; // Green
                data[i + 2] = color & 0xff;         // Blue
            }
        }

        // Put modified image data back to canvas
        context.putImageData(imageData, 0, 0);

        // Create a new texture from the canvas
        const newTexture = this.scene.textures.createCanvas(textureKey, canvas.width, canvas.height);
        newTexture.context.drawImage(canvas, 0, 0);
        newTexture.refresh();
        
        // Set the sprite's texture to the new texture
        this.sprite.setTexture(textureKey);
    }

    rotate(rotation) {
        // Set the origin to the center of the sprite for proper rotation
        this.sprite.setOrigin(0.5, 0.5);

        // Set the rotation angle based on the input
        switch (rotation) {
            case 0: // facing right
                this.rotation = Phaser.Math.DegToRad(270);
                break;
            case 1: // facing down
                this.rotation = Phaser.Math.DegToRad(0);
                break;
            case 2: // facing left
                this.rotation = Phaser.Math.DegToRad(90);
                break;
            case 3: // facing up
                this.rotation = Phaser.Math.DegToRad(180);
                break;
            default:
                console.error(`Invalid castle rotation: ${rotation}`);
                return; // Exit if invalid
        }

        // Apply the rotation to the sprite
        this.sprite.setRotation(this.rotation);

        // Adjust position to ensure the sprite's center is aligned with the tile
        const tileSize = this.scene.board.tileSize; // Assuming you have a tileSize property
        const halfWidth = tileSize / 2;
        const halfHeight = tileSize / 2;

        // Use this.pos.x and this.pos.y for the correct positioning
        this.sprite.setPosition(this.sprite.x + halfWidth, this.sprite.y + halfHeight);
    }
}

export default Piece;