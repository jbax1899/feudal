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

    constructor(scene, board, ui) {
        this.scene = scene;
        this.board = board;
        this.ui = ui;
        this.players = [new Player(this.scene, 1), 
                        new Player(this.scene, 2),
                        new Player(this.scene, 3),
                        new Player(this.scene, 4),
                        new Player(this.scene, 5),
                        new Player(this.scene, 6)];
        this.isRotatingBoard = false;
        this.gameStage = "";
    }

    create() {
        // Can rotate board on game setup
        this.scene.input.keyboard.on('keydown', (event) => {
            if (event.key === '[') {
                this.turnBoard(0);
            }
            else if (event.key === ']') {
                this.turnBoard(1);
            }
        });
    }

    update() {
        // Game logic update
    }

    turnBoard(direction) {
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

    notify(message) {

    }
}

export default GameManager;