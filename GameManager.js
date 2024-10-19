import Board from './Board.js';
import Player from './Player.js';

class GameManager {
    playerColors = [
        { color: 'D4F8F4', name: 'lightblue' },
        { color: '459E9C', name: 'blue' },
        { color: '194B52', name: 'teal' },
        { color: 'E1CEA4', name: 'lightbrown' },
        { color: 'A06B41', name: 'brown' },
        { color: '42281B', name: 'darkbrown' }
    ];

    constructor(scene, board) {
        this.scene = scene;
        this.board = board;

        this.debug = true;
        
        this.players = [
            new Player(this.scene, 0, true),
            // new Player(this.scene, 2),
            // new Player(this.scene, 3),
            // new Player(this.scene, 4),
            // new Player(this.scene, 5),
            new Player(this.scene, 1, false)
        ];
        this.mainPlayerNumber = this.players.length - 1; // debug
        this.mainPlayer = this.players[this.mainPlayerNumber];
        
        this.stages = [
            { number: 0, name: "cointoss" },
            { number: 1, name: "positioning" },
            { number: 2, name: "placement" },
            { number: 3, name: "play" },
            { number: 4, name: "gameover" }
        ];
        this.stage = this.stages[0];
        this.isRotatingBoard = false;
        this.flipWinner;
        this.turn = 0; // tracks turn count across all players
        this.playerTurn = 0; // tracks which player's turn it is
    }

    create() {
        this.scene.input.keyboard.on('keydown', (event) => {
            if (event.key === 'q') {
                if (this.stage.name === "positioning") {
                    this.turnBoard(1);
                }
            } else if (event.key === 'e') {
                if (this.stage.name === "positioning") {
                    this.turnBoard(0);
                }
            } else if (event.key === 'Enter') {
                this.advanceStage();
            }
        });

        this.flipWinner = 0; // DEBUG: Pre-determined winner for testing
        console.log("Flip winner: " + this.flipWinner);
    }

    destroy() {
        // Clean up players
        this.players.forEach(player => {
            if (player) {
                player.destroy();
            }
        });
        this.players = []; // Clear the players array
    
        // Destroy the board
        if (this.board) {
            this.board.destroy();
            this.board = null;
        }
    
        // Reset properties
        this.isRotatingBoard = false;
        this.flipWinner = null;
        this.turn = 0;
        this.playerTurn = 0;
        this.stage = null;
    
        // Clear input listeners
        this.scene.input.keyboard.off('keydown');
    
        console.log("GameManager destroyed and resources cleaned up.");
    }    

    update() {
        // Game logic update
    }

    advanceStage() {
        if (this.stage.number + 1 < this.stages.length) {
            this.stage = this.stages[this.stage.number + 1];
            console.log("Advancing to " + this.stage.name + " stage");
            this.scene.ui.addNotification("Advancing to " + this.stage.name + " stage");
        } else {
            console.warn("Cannot progress stage: Reached end");
            return;
        }

        if (this.stage.name === "positioning") {
            // Logic for positioning stage (if any)
        }

        if (this.stage.name === "placement") {
            // Destroy board rotation icons
            this.scene.ui.destroyRotateIcons();
            this.finalizeBoardRotation();

            // Loop through players for piece placement, one at a time
            this.placePiecesForPlayers();
        }

        if (this.stage.name === "play") {
            // Remove piece tray
            this.scene.ui.destroyPieceTray();
            
            // Unobscure enemy side
            this.scene.board.unobscure();
            console.log("Unobscured board.");

            // Create end turn button
            this.scene.ui.createEndTurn();
        }

        if (this.stage.name === "gameover") {
            this.scene.ui.addNotification("Game over!", "ff0000");
        }

        // Refresh UI
        this.scene.ui.updateUIPosition();
    }

    finalizeBoardRotation() {
        const angle = this.scene.board.boardContainer.angle;
        let rotations = 0;
        if (angle === 90 || angle === -270) {
            rotations = 1;
        } else if (angle === 180 || angle === -180) {
            rotations = 2;
        } else if (angle === -90 || angle === 270) {
            rotations = 3;
        }
        for (let r = 0; r < rotations; r++) {
            const matrix = this.scene.boardData.tiles;
            const transposed = matrix[0].map((_, i) => matrix.map(row => row[i]));
            this.scene.boardData.tiles = transposed.map(row => row.reverse());
        }
        this.scene.board.boardContainer.destroy();
        this.scene.board = new Board(this.scene);
        this.scene.board.create();
        this.scene.board.obscure();
    }

    placePiecesForPlayers() {
        this.playerTurn = this.flipWinner; // Start with the player who won the flip
        const placeNextPlayer = () => {
            if (this.turn >= this.players.length) {
                console.log("All players have placed their pieces.");
                this.advanceStage(); // Move to play stage
                return;
            }

            const currentPlayer = this.players[this.playerTurn];
            this.scene.ui.addNotification(
                `Player ${this.playerTurn + 1}'s turn to place pieces.`,
                this.playerToColorCode(this.playerTurn)
            );

            if (currentPlayer.isAI) {
                currentPlayer.placeUnits(); // AI places units automatically
                this.nextTurn();
                placeNextPlayer();
            } else {
                this.scene.ui.createPieceTray(currentPlayer, () => {
                    this.nextTurn();
                    placeNextPlayer();
                });
            }
        };

        placeNextPlayer(); // start looping through players
    }

    nextTurn() {
        this.turn++;
        this.playerTurn = (this.playerTurn + 1) % this.players.length;
    }

    turnBoard(direction) {
        if (this.isRotatingBoard) {
            return;
        }
    
        this.isRotatingBoard = true;
        let radian = 0;
        if (direction === 0) {
            radian = Phaser.Math.DegToRad(90);
        } else if (direction === 1) {
            radian = -Phaser.Math.DegToRad(90);
        } else {
            console.warn("Unknown direction to rotate board: " + direction);
            return;
        }
    
        const container = this.scene.board.boardContainer;
    
        this.scene.tweens.add({
            targets: container,
            angle: container.angle + Phaser.Math.RadToDeg(radian),
            duration: 750,
            ease: 'Cubic.easeInOut',
            onUpdate: () => {
                this.scene.board.centerCamera();
            },
            onComplete: () => {
                this.isRotatingBoard = false;
            }
        });
    }

    endTurn() {
        this.scene.ui.addNotification(
            "Player " + this.playerTurn + " has ended their turn",
            this.playerToColorCode(this.playerTurn)
        );

        this.turn++;
        if (this.turn % this.players.length == 0) {
            this.playerTurn = 0;
        } else {
            this.playerTurn++;
        }

        this.scene.ui.addNotification(
            "Player " + this.playerTurn + "'s turn",
            this.playerToColorCode(this.playerTurn)
        );
    }

    playerToColorCode(player) {
        return this.playerColors[player].color;
    }

    playerToColorName(player) {
        return this.playerColors[player].name;
    }
}

export default GameManager;