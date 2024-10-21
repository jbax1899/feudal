class Player {
    constructor(scene, playerNumber, isAI) {
        this.scene = scene;
        this.board = this.scene.board;

        this.playerNumber = playerNumber;
        this.isAI = isAI;
        this.startingHand = {
            'king': 1,
            'prince': 1,
            'duke': 1,
            'knight': 2,
            'sergeant': 2,
            'pikeman': 4,
            'squire': 1,
            'archer': 1,
            'castleInner': 1
        };
        this.hand = JSON.parse(JSON.stringify(this.startingHand)); // Deep copy
    }

    destroy() {
    }

    /// [AI] Places units on the board during the setup phase
    placeUnits() {
        const pieceTypes = Object.keys(this.hand);
        const boardSide = this.playerNumber <= 3 ? 'top' : 'bottom';
        let steps = 0;
    
        // Loop through each type of piece in hand
        pieceTypes.forEach((piece) => {
            // Use a while loop to continue placing until we run out of pieces
            while (this.hand[piece] > 0) {
                let placed = false;
                let counter = 0;
    
                while (!placed) {
                    // Infinite loop prevention
                    counter++;
                    if (counter >= 1000) {
                        console.error("Infinite loop detected in AI unit placement (" + piece + ") after " + counter + " steps, stopping!");
                        break;
                    }
    
                    // Step 2: Select a random position on the board
                    let randomX = Math.floor(Math.random() * this.scene.board.numRows);
                    let randomY = (boardSide === 'top') ?
                        Math.floor(Math.random() * Math.ceil(this.scene.board.numCols / 2)) :
                        Math.floor(Math.random() * Math.floor(this.scene.board.numCols / 2)) + Math.ceil(this.scene.board.numCols / 2);
    
                    // Step 3: If the piece is a castle, determine orientation and location
                    if (piece === 'castleInner') {
                        const rotation = Math.floor(Math.random() * 4);
                        const nearMountain = this.isNearMountain(randomX, randomY);
    
                        if (nearMountain && this.scene.board.isLegalCastlePlacement(randomX, randomY, rotation)) {
                            if (this.scene.board.addPiece(randomX, randomY, piece, this.playerNumber, false)) {
                                this.scene.board.castleRotation = rotation;
                                placed = true;
                            }
                        }
                    } else {
                        // Step 4: For other pieces, check if the placement is legal
                        let legal = this.scene.board.isLegalPlacement(randomX, randomY, piece);
                        if (this.scene.gameManager.debug) {
                            console.log(`Trying ${piece} at ${randomX}, ${randomY}. Legal: ${legal}`);
                        }
                        if (legal === null) {
                            if (this.scene.board.addPiece(randomX, randomY, piece, this.playerNumber)) {
                                placed = true;
                            }
                        }
                    }

                    if (placed) {
                        this.hand[piece]--; // Successfully placed, decrease count
                        steps += counter; // Track steps used to place this piece
                        if (this.scene.gameManager.debug) {
                            console.log(`Placed ${piece}. New hand state: ${JSON.stringify(this.hand)}`);
                        }
                    }
                }
            }
        });
        console.log(`(${steps} steps)`);
    }

    // Placeholder for determining if the tile is near a mountain
    isNearMountain(x, y) {
        // Implement logic to check surrounding tiles for mountains
        const surroundingTiles = [
            [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
            [x - 1, y],               , [x + 1, y],
            [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]
        ];
        return surroundingTiles.some(([nx, ny]) => this.scene.board.getTile(nx, ny) === 3); //3 = mountain tile
    }
}

export default Player;