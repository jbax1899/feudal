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
        this.players = [new Player(this.scene, 1), 
                        new Player(this.scene, 2),
                        new Player(this.scene, 3),
                        new Player(this.scene, 4),
                        new Player(this.scene, 5),
                        new Player(this.scene, 6)];
        this.isRotatingBoard = false;
        this.stages = [
            { number: 0, name: "cointoss" },
            { number: 1, name: "positioning" },
            { number: 2, name: "placement" },
            { number: 3, name: "play" },
            { number: 4, name: "gameover" }
        ];
        this.stage = this.stages[0];
        this.flipWinner;
    }

    create() {
        // Can rotate board on game setup
        this.scene.input.keyboard.on('keydown', (event) => {
            if (event.key === 'q') {
                if (this.stage.name === "positioning") {
                    this.turnBoard(1);
                }
            }
            else if (event.key === 'e') {
                if (this.stage.name === "positioning") {
                    this.turnBoard(0);
                }
            }
            else if (event.key === 'Enter') {
                this.advanceStage();
            }
        });

        // DEBUG - coinflip stage
        this.flipWinner = 0 //Math.random() < 0.5 ? 0 : 1;
        console.log("Flip winner: " + this.flipWinner);
    }

    update() {
        // Game logic update
    }

    advanceStage() {
        if (this.stage.number < this.stages.length) {
            this.stage = this.stages[this.stage.number + 1];
            console.log("Advancing to " + this.stage.name + " stage");
            this.scene.ui.addNotification("Advancing to " + this.stage.name + " stage");
        }

        if (this.stage.name === "positioning") {

        }

        if (this.stage.name === "placement") {
            // DEBUG - placement stage
            // Destroy board rotation icons
            this.scene.ui.destroyRotateIcons();
            // We're done rotating the board. Save the changes by updating board data, then re-drawing board
            // rotate board data
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
                // Rotate board data clockwise
                const matrix = this.scene.boardData.tiles;
                // Transpose the matrix
                const transposed = matrix[0].map((_, i) => matrix.map(row => row[i]));
                // Reverse each row
                this.scene.boardData.tiles = transposed.map(row => row.reverse());
            }
            // new board will replace the old after being completely initialized
            this.scene.board.boardContainer.destroy();
            this.scene.board = new Board(this.scene);
            this.scene.board.create();
            // Obscure enemy side
            this.scene.board.obscure();
        }

        if (this.stage.name === "play") {
            // Remove piece tray
            this.scene.ui.destroyPieceTray();
            // Unobscure enemy side
            this.scene.board.unobscure();
        }

        // Refresh UI
        this.scene.ui.updateUIPosition();
    }

    turnBoard(direction) {
        // Visually rotate the board container 90 degrees
        if (this.isRotatingBoard) {
            return; // Exit if a tween is in progress
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
    
        // Tween to rotate the container around its top-left corner
        this.scene.tweens.add({
            targets: container,
            angle: container.angle + Phaser.Math.RadToDeg(radian),
            duration: 750, // ms
            ease: 'Cubic.easeInOut',
            onUpdate: () => {
                this.scene.board.centerCamera();
            },
            onComplete: () => {
                this.isRotatingBoard = false;
            }
        });
    }
}

export default GameManager;