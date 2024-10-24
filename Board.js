import Piece from './Piece.js';

class Board {
    constructor(scene) {
        this.scene = scene;
        this.boardContainer = null;
        this.tileSize = 64;
        this.numRows, this.numCols;
        this.pieces = [];
        this.pieceIdCounter = 0; // Global counter to assign unique IDs
        this.moveCircles = [];
        this.selectedPiece = null;
        this.selectedPlayer = this.scene.gameManager.mainPlayerNumber;
        this.castleRotation = 0;
        this.castleRotationLast = 0;
        this.obfuscation = null;
    }

    create() {
        this.boardContainer = this.scene.add.container();
        this.drawBoard();

        // Center camera
        this.scene.zoomMin = this.minZoom();
        this.centerCamera();

        // Define the interactive area
        const boardWidth = this.scene.boardData.tiles[0].length * this.tileSize;
        const boardHeight = this.scene.boardData.tiles.length * this.tileSize;
        this.boardContainer.setSize(boardWidth, boardHeight);
        this.boardContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, boardWidth, boardHeight), Phaser.Geom.Rectangle.Contains);
        
        // Key listeners
        this.pKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.rKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        // General keyup listener
        this.scene.input.keyboard.off('keyup'); // Remove old listener if it exists (when we re-create the board during setup)
        this.scene.input.keyboard.on('keyup', (event) => {
            const key = event.key; // Get the pressed key
            const keyNumber = parseInt(key); // Convert key to a number

            // DEBUG
            if (this.debug) {
                // Change piece type for creation
                if (!isNaN(keyNumber)) {
                    this.selectPiece(keyNumber);
                }

                // Change player for piece creation
                if (key === '=' || key === '-') {
                    let changed = false;
                    if (key === '=') {
                        if (this.selectedPlayer < this.scene.gameManager.playerColors.length - 1) {
                            this.selectedPlayer++;
                            changed = true;
                        }           
                    }
                    if (key === '-') {
                        if (this.selectedPlayer > 0) {
                            this.selectedPlayer--;
                            changed = true;
                        }
                    }
                    if (changed) {
                        this.scene.player.playerNumber = this.selectedPlayer; // Change player
                        this.scene.ui.addNotification("[DEBUG] Swapped to player " + this.selectedPlayer);
                        this.scene.ui.updateUIPosition(); // to update piece tray if its being drawn
                        console.log("Selected player: " + this.selectedPlayer);
                    } else {
                        this.scene.ui.addNotification("[DEBUG] Cannot swap to player: Invalid");
                        console.log("Cannot swap to player: Invalid");
                    }
                }

                if (key === 'r') {
                    this.scene.restartGame();
                } 

                // Change castle rotation for creation
                if (key === 'ArrowLeft') {
                    this.castleRotationLast = this.castleRotation;
                    if (this.castleRotation > 0) {
                        this.castleRotation--;
                    } else {
                        this.castleRotation = 3;
                    }
                    this.scene.ui.updateDragging();
                    console.log("Castle rotation: " + this.castleRotation);
                }
                if (key === 'ArrowRight') {
                    this.castleRotationLast = this.castleRotation;
                    if (this.castleRotation < 3) {
                        this.castleRotation++;
                    } else {
                        this.castleRotation = 0;
                    }
                    this.scene.ui.updateDragging();
                    console.log("Castle rotation: " + this.castleRotation);
                }
                if (key === ' ') {
                    // Center screen on board
                    this.centerCamera();
                }
            }
        });

        // Event listener for clicks. Was this.boardContainer, but only worked for top-left quarter of board?
        //
        //this.scene.input.off('pointerdown'); // Remove old listener if it exists (when we re-create the board during setup)
        //
        this.scene.input.on('pointerdown', (pointer) => {
            // Left-click
            if (pointer.leftButtonDown()) {
                // Convert view coordinates to world coordinates
                const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                
                // Convert world coordinates to board coordinates
                const {boardX, boardY} = this.screenToBoard(worldPoint.x, worldPoint.y);
                
                // DEBUG - piece creation on P+left click
                if (this.pKey.isDown) {
                    this.addPiece(boardX, boardY, this.pieceSelection, this.selectedPlayer, this.castleRotation);
                }
                if (this.rKey.isDown) {
                    this.removePiece(boardX, boardY);
                }
                
                //
                // Piece movement
                //
                // Check if a piece was selected, and that we're in the play stage
                if (this.selectedPiece !== null 
                    && this.scene.gameManager.stage.name === "play") {
                    // Check if the clicked position contains a move circle
                    if (this.isMoveCircle(boardX, boardY)) {
                        // Handle captures
                        this.removePiece(boardX, boardY); // ignores castles
                        // Move the selected piece to the clicked position
                        this.movePiece(this.scene.board.selectedPiece, boardX, boardY);
                    }
                }
            }
            // Right-click 
            if (pointer.rightButtonDown()) {
                // Deselect
                this.deselect();
            }
        });
    }

    destroy() {
        // Remove all pieces from the board
        this.pieces.forEach(piece => {
            if (piece.sprite) {
                piece.sprite.destroy(); // Destroy the sprite if it exists
            }
        });
    
        // Clear the pieces array
        this.pieces = [];
    
        // Optionally, clear any move circles if needed
        this.moveCircles.forEach(circle => {
            if (circle) {
                circle.destroy(); // Destroy move circles
            }
        });
        this.moveCircles = [];
    
        // Reset relevant properties
        this.selectedPiece = null;
        this.selectedPlayer = this.scene.player.playerNumber;
        this.castleRotation = 0;
        this.castleRotationLast = 0;
    
        // Clean up keyboard listeners
        this.scene.input.keyboard.off('keyup');
        this.scene.input.off('pointerdown');
    
        // Optionally reset the board container or other UI elements
        if (this.boardContainer) {
            this.boardContainer.destroy(); // Destroy the container if it exists
            this.boardContainer = null;
        }
        
        if (this.debug) {
            console.log("Board destroyed and resources cleaned up.");
        }
    }    

    drawBoard() {
        const tiles = {
            1: 'grass',
            2: 'hill',
            3: 'mountain'
        };
    
        const boardData = this.scene.boardData;
        this.numRows = boardData.tiles.length;
        this.numCols = boardData.tiles[0].length;
    
        for (let row = 0; row < this.numRows; row++) {
            for (let col = 0; col < this.numCols; col++) {
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
            }
        }

        // Add thick lines after the grid is drawn
        const thickLineGraphics = this.scene.add.graphics();
        thickLineGraphics.lineStyle(6, 0x000000);
        // Vertical line between columns 12 and 13
        thickLineGraphics.beginPath();
        thickLineGraphics.moveTo(12 * this.tileSize, 0);
        thickLineGraphics.lineTo(12 * this.tileSize, this.numRows * this.tileSize);
        thickLineGraphics.strokePath();
        // Horizontal line between rows 12 and 13
        thickLineGraphics.beginPath();
        thickLineGraphics.moveTo(0, 12 * this.tileSize);
        thickLineGraphics.lineTo(this.numCols * this.tileSize, 12 * this.tileSize);
        thickLineGraphics.strokePath();
        // Set depth of board container
        this.boardContainer.setDepth(-1);
        // Add to container
        this.boardContainer.add(thickLineGraphics);
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
            boardX < this.scene.boardData.tiles[0].length &&
            boardY >= 0 &&
            boardY < this.scene.boardData.tiles.length
        );
    }

    getTile(boardX, boardY) {
        // Check if coordinate is within the board
        if (this.isCoordinate(boardX, boardY)) {
            return this.scene.boardData.tiles[boardY][boardX];
        }
    }

    // Method to handle piece selection
    selectPiece(number) {
        this.pieceSelection = number;
        console.log(`Piece selection changed to: ${Piece.types[number]} (${number})`);
    }

    // Method to get the piece(s) at the specified board coordinates (2, if a piece is on a castle)
    getPieces(boardX, boardY) {
        const pieces = this.pieces.filter(piece => piece.pos.x === boardX && piece.pos.y === boardY);
        return pieces.length > 0 ? pieces : null;
    }

    // Lookup function to find a piece by its unique ID
    findPieceById(id) {
        return this.pieces.find(piece => piece.id === id) || null; // Return piece if found, else null
    }

    // Method to check if placement of a piece at a location on the board is legal
    isLegalPlacement(boardX, boardY, type) {
        // Validate type
        if (type < 0 || type >= Piece.types.length) {
            return `Invalid piece type: ${type}`;
        }
        // Ensure the coordinates are within the board bounds
        if (!this.isCoordinate(boardX, boardY)) {
            return `Cannot place piece - Invalid board coordinates: (${boardX}, ${boardY})`;
        }87
        // Cannot place on obscured enemy's side
        //if (this.obfuscation !== null
        //    && boardY < Math.ceil(this.scene.boardData.tiles[0].length / 2)) {
        //    return `Cannot place piece on enemy's side`;
        //}
        // Cannot place any piece on a mountain
        if (this.getTile(boardX, boardY) === 3) {
            return `Cannot place piece on mountain`;
        }
        // Cannot place mounted units on rough
        if (this.getTile(boardX, boardY) === 2 && Piece.moves[Piece.types.indexOf(type)].isMounted) {
            return `Cannot place mounted piece on rough terrain`;
        }
        // Ensure space is empty
        if (this.getPieces(boardX, boardY)) {
            return `Cannot place piece - Space is already occupied`;
        }

        //All checks passed, must be legal
        return null;
    }

    // Method to add a piece at the specified board coordinates
    addPiece(boardX, boardY, type, player, quiet) {
        // Check legality of placement
        const isLegal = this.isLegalPlacement(boardX, boardY, type);
        if (isLegal !== null) {
            if (quiet === false) {
                console.log(isLegal); // Sometimes we don't want this output, like during AI placement
            }
            return false;
        }

        // Convert board coordinates to screen coordinates
        const { x, y } = this.boardToScreen(boardX, boardY);

        // If placing an outer castle piece, place the adjacent inner castle piece based on rotation
        let outerCastlePiece;
        if (type === 'castleInner') {
            if (this.isLegalCastlePlacement(boardX, boardY, this.castleRotation, quiet)) {
                let outerCastleX = boardX;
                let outerCastleY = boardY;
                switch (this.castleRotation) {
                    case 0: // right
                        outerCastleX += 1;
                        break;
                    case 1: // down
                        outerCastleY += 1;
                        break;
                    case 2: // left
                        outerCastleX -= 1;
                        break;
                    case 3: // up
                        outerCastleY -= 1;
                        break;
                }

                // Convert the adjacent board coordinates to screen coordinates
                const { x: outerCastleScreenX, y: outerCastleScreenY } = this.boardToScreen(outerCastleX, outerCastleY);

                // Create and place the outer castle piece
                outerCastlePiece = new Piece(this.scene, outerCastleScreenX, outerCastleScreenY, Piece.types.indexOf('castleOuter'), player);
                outerCastlePiece.pos.x = outerCastleX;
                outerCastlePiece.pos.y = outerCastleY;
                this.pieces.push(outerCastlePiece);
                
                
            } else {
                // Castle cannot be placed here
                return false;
            }
        }

        // Create and place the main piece
        const piece = new Piece(this.scene, x, y, type, player);
        piece.pos.x = boardX;
        piece.pos.y = boardY;
        this.pieces.push(piece);
        if (this.debug) {
            console.log("Created " + Piece.types[piece.type] 
                + " piece at " + boardX + "," + boardY 
                + " for player " + this.selectedPlayer);
        }
        if (outerCastlePiece) {
            // castles can reference each other
            outerCastlePiece.connectingCastle = piece; 
            piece.connectingCastle = outerCastlePiece;

            // Rotate the inner castle piece to face the outer castle piece
            piece.rotate(this.castleRotation);
        }

        // If AI, and if during setup phase, make piece invisible (until reveal)
        if (piece.player.isAI) {
            piece.sprite.visible = false;
            if (outerCastlePiece) {
                outerCastlePiece.sprite.visible = false;
            }
        }

        return true;
    }

    // Method to check if placing a castle is legal
    isLegalCastlePlacement(innerX, innerY, rotation, quiet) {
        let outerX = innerX;
        let outerY = innerY;
        switch (rotation) {
            case 0: // right
                outerX += 1;
                break;
            case 1: // down
                outerY += 1;
                break;
            case 2: // left
                outerX -= 1;
                break;
            case 3: // up
                outerY -= 1;
                break;
            default:
                console.error(`Invalid castle rotation: ${rotation}`);
                return false;
        }

        // Check if the inner and outer spaces are valid and unoccupied
        if (!this.isCoordinate(innerX, innerY) || this.getPieces(innerX, innerY)) {
            if (quiet === false) { // Sometimes we don't want this output, like during AI placement
                console.error(`Cannot place inner castle - Space is already occupied or invalid: (${innerX}, ${innerY})`);
            }
            return false;
        }

        if (!this.isCoordinate(outerX, outerY) || this.getPieces(outerX, outerY)) {
            if (quiet === false) { // Sometimes we don't want this output, like during AI placement
                console.error(`Cannot place outer castle - Adjacent space is already occupied or invalid: (${outerX}, ${outerY})`);
            }
            return false;
        }

        return true;
    }

    // Method to remove a piece from the specified board coordinates (ignoring castles)
    removePiece(boardX, boardY) {
        const pieces = this.getPieces(boardX, boardY);
        let pieceToRemove = null;
    
        if (pieces) {
            for (const piece of pieces) {
                // Find the non-castle piece to remove
                if (piece.typeName !== 'castleInner' && piece.typeName !== 'castleOuter') {
                    pieceToRemove = piece;
                    break;
                }
            }
        }
    
        // No pieces to remove, exit
        if (!pieceToRemove) {
            return false;
        }
    
        // Ensure we are removing the correct piece
        const pieceIndex = this.pieces.indexOf(pieceToRemove);
        if (pieceIndex !== -1) {
            // Remove the piece sprite and remove it from the array
            this.pieces[pieceIndex].sprite.destroy();
            this.pieces.splice(pieceIndex, 1);
            if (this.debug) {
                console.log(`Removed piece from (${boardX}, ${boardY})`);
            }
            return true;
        } else {
            console.warn(`Tried to remove a piece not found in the pieces array`);
            return false;
        }
    }

    isLegalMove(boardX, boardY, piece) {
        // Check if the coordinates are within the board bounds
        if (!this.isCoordinate(boardX, boardY)) {
            return 0;
        }
    
        // Identify the castle piece we're on (if any)
        let castleAtPiece = null;
        const currentPieces = this.getPieces(piece.pos.x, piece.pos.y);
        for (const p of currentPieces) {
            if (p.typeName === 'castleInner' || p.typeName === 'castleOuter') {
                castleAtPiece = p;
                break; // Found the castle, exit loop early
            }
        }
    
        // Check rules for moving from an inner castle
        if (castleAtPiece?.typeName === 'castleInner') {
            const { connectingCastle } = castleAtPiece;
            if (boardX !== connectingCastle.pos.x || boardY !== connectingCastle.pos.y) {
                return 0; // Must move to the connecting castle
            }
        }
    
        // Identify other pieces at the target location
        const otherPieces = this.getPieces(boardX, boardY);
        let enemyPiece = null;
        let targetCastle = null;
    
        if (otherPieces) {
            for (const p of otherPieces) {
                if (p.typeName === 'castleInner' || p.typeName === 'castleOuter') {
                    targetCastle = p;
                } else {
                    enemyPiece = p; // Capture the enemy piece
                }
            }
        }
    
        // Handle checks for the enemy piece
        if (enemyPiece) {
            // Cannot capture own piece
            if (enemyPiece.playerNumber === piece.playerNumber) {
                return 0;
            }
    
            // Check if enemy piece is on an inner castle
            if (targetCastle?.typeName === 'castleInner') {
                const { connectingCastle } = targetCastle;
                if (piece.pos.x !== connectingCastle.pos.x || piece.pos.y !== connectingCastle.pos.y) {
                    return 0; // Can't capture unless on the connecting castle
                }
            }
    
            return 2; // Can capture the enemy piece
        }
    
        // Handle castle movement rules
        if (targetCastle) {
            if (targetCastle.typeName === 'castleInner') {
                // Special rule for archers: cannot move onto their own inner castle
                if (piece.typeName === 'archer' && targetCastle.playerNumber === piece.playerNumber) {
                    return 0; // Archers cannot move onto their own inner castle
                }

                // Moving onto an inner castle is allowed only from its connecting castle
                if (piece.pos.x === targetCastle.connectingCastle.pos.x && piece.pos.y === targetCastle.connectingCastle.pos.y) {
                    return 3; // Special move logic for moving to own castle
                }
                return 0; // Invalid move
            } else if (targetCastle.typeName === 'castleOuter') {
                return 3; // Special move onto outer castle
            }
        }
    
        // Check if the tile is impassable (mountain)
        if (this.getTile(boardX, boardY) === 3) {
            return 0;
        }
    
        // Check if mounted piece is moving onto rough terrain
        if (piece.isMounted && this.getTile(boardX, boardY) === 2) {
            return false; // Invalid move
        }
    
        return 1; // All checks passed, move is legal
    }    

    drawMoveCircle(boardX, boardY, enemy) {
        const x = boardX * this.tileSize + this.tileSize / 2;
        const y = boardY * this.tileSize + this.tileSize / 2;
    
        if (enemy) {
            // Draw red circle around enemy
            const graphics = this.scene.add.graphics();
            const thickness = 3;
            graphics.lineStyle(thickness, 0xff0000, 1); // Red color, 3 pixels thick, full opacity
            graphics.strokeCircle(x, y, (this.tileSize / 2) - thickness);
            graphics.setInteractive(new Phaser.Geom.Circle(x, y, (this.tileSize / 2) - thickness), Phaser.Geom.Circle.Contains);
            graphics.setDepth(10);
            graphics.boardX = boardX;
            graphics.boardY = boardY;
            this.moveCircles.push(graphics); // Store the graphics reference
        } else {
            // Draw small move circle
            const circle = this.scene.add.circle(x, y, this.tileSize / 7, 0x00ff00, 0.5); // Green circle with 50% alpha
            circle.setInteractive();
            circle.setDepth(10);
            circle.boardX = boardX;
            circle.boardY = boardY;
            this.moveCircles.push(circle); // Store the circle reference
        }
    }    

    // Check if the clicked coordinate has a move circle
    isMoveCircle(boardX, boardY) {
        return this.moveCircles.some(circle => circle.boardX === boardX && circle.boardY === boardY);
    }

    // Draws move circles
    showMoves(piece) {
        const { orthogonalRange, diagonalRange, typeName } = piece;
        const { boardX, boardY } = this.screenToBoard(piece.sprite.x, piece.sprite.y);

        const drawDirectionalMoves = (dx, dy, range) => {
            for (let i = 1; i <= range; i++) {
                const newX = boardX + i * dx;
                const newY = boardY + i * dy;
                const moveType = this.isLegalMove(newX, newY, piece);
                if (moveType === 1) {
                    this.drawMoveCircle(newX, newY, false); // Normal move
                } else if (moveType === 2) {
                    this.drawMoveCircle(newX, newY, true); // Enemy move
                    break;
                } else if (moveType === 3) {
                    this.drawMoveCircle(newX, newY, false); // Special move
                    break;
                } else {
                    break; // Illegal move
                }
            }
        };

        if (typeName === 'squire') {
            const knightMoves = [
                { dx: 1, dy: 2 }, { dx: 1, dy: -2 }, { dx: -1, dy: 2 }, { dx: -1, dy: -2 },
                { dx: 2, dy: 1 }, { dx: 2, dy: -1 }, { dx: -2, dy: 1 }, { dx: -2, dy: -1 }
            ];
            knightMoves.forEach(move => {
                const newX = boardX + move.dx;
                const newY = boardY + move.dy;
                const moveType = this.isLegalMove(newX, newY, piece);
                if (moveType === 1) {
                    this.drawMoveCircle(newX, newY, false); // Normal move
                } else if (moveType === 2) {
                    this.drawMoveCircle(newX, newY, true); // Enemy move
                } else if (moveType === 3) {
                    this.drawMoveCircle(newX, newY, false); // Special move
                }
            });
        } else {
            // Orthogonal moves
            drawDirectionalMoves(0, 1, orthogonalRange);  // Up
            drawDirectionalMoves(0, -1, orthogonalRange); // Down
            drawDirectionalMoves(1, 0, orthogonalRange);  // Right
            drawDirectionalMoves(-1, 0, orthogonalRange); // Left

            // Diagonal moves
            drawDirectionalMoves(1, 1, diagonalRange);    // Bottom-right
            drawDirectionalMoves(1, -1, diagonalRange);   // Top-right
            drawDirectionalMoves(-1, 1, diagonalRange);   // Bottom-left
            drawDirectionalMoves(-1, -1, diagonalRange);  // Top-left
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
        if (this.debug) {
            console.log(`Moved ${piece.typeName} piece to: ${targetX}, ${targetY}`);
        }
    }

    capturePiece(piece, boardX, boardY) {
        this.removePiece(boardX, boardY);
        this.movePiece(piece, boardX, boardY);
    }

    minZoom() {
        // Calculate the required zoom to fit the whole board
        const camera = this.scene.cameras.main;
        const cameraWidth = camera.width;
        const cameraHeight = camera.height;
        const boardSize = this.scene.boardData.tiles.length * this.tileSize;
        return Math.min(cameraWidth / boardSize, cameraHeight / boardSize) * 0.9;
    }

    centerCamera() {
        const camera = this.scene.cameras.main;
    
        // Get the rotation in radians
        const rotation = Phaser.Math.DegToRad(this.boardContainer.angle);
    
        // Calculate the container's center before rotation
        const boardSize = this.scene.boardData.tiles.length * this.tileSize;
        const centerX = this.boardContainer.x + boardSize / 2;
        const centerY = this.boardContainer.y + boardSize / 2;
    
        // Calculate the rotated center position
        const rotatedCenterX = centerX * Math.cos(rotation) - centerY * Math.sin(rotation);
        const rotatedCenterY = centerX * Math.sin(rotation) + centerY * Math.cos(rotation);
    
        // Center the camera on the rotated container center
        camera.centerOn(rotatedCenterX, rotatedCenterY);

        // Set the camera zoom if it's less than the required zoom
        const requiredZoom = this.minZoom();
        if (camera.zoom > requiredZoom) {
            camera.setZoom(requiredZoom); // add a little padding
        }

        // Re-draw background
        this.scene.drawBackground();

        // Update UI
        if (this.scene.ui) {
            this.scene.ui.updateUIPosition();
        }
    }

    obscure() {
        // Calculate the screen coordinates of the top-left and bottom-right corners
        const topLeft = this.boardToScreen(0, 0);                                        // Top-left corner (row 0, col 0)
        const bottomRight = this.boardToScreen(this.numRows, Math.floor(this.numCols / 2));    // Bottom-right corner for top half

        // Draw a semi-transparent gray rectangle over the top half of the board
        this.obfuscation = this.scene.add.graphics().fillStyle(0x808080, 0.7);
        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;
        this.obfuscation.fillRect(topLeft.x, topLeft.y, width, height);
        this.obfuscation.setDepth(100); // Depth higher than other elements
    }

    unobscure() {
        // Clear obfuscation / fog of war
        if (this.obfuscation !== null) {
            this.obfuscation.destroy();
            this.obfuscation = null;
        }

        // Reveal all units on the board
        Object.values(this.pieces).forEach(piece => {
            piece.sprite.visible = true; // Set each piece's sprite to visible
        });
    }
}

export default Board;