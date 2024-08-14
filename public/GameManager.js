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
    }

    create() {
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
        //rotate board 90 degrees
        //0=clockwise, 1=counterclockwise
        //only done during game setup

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

        // Calculate the container's center point
        const container = this.scene.board.boardContainer;
        const containerCenterX = container.x + container.width / 2;
        const containerCenterY = container.y + container.height / 2;

        // Set the origin to the center (we do this manually by repositioning)
        container.setPosition(containerCenterX, containerCenterY);

        // Tween to rotate the container around its center
        this.scene.tweens.add({
            targets: container,
            angle: Phaser.Math.RadToDeg(container.rotation) + Phaser.Math.RadToDeg(radian),
            duration: 1000, // Duration of the tween in milliseconds
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.isRotatingBoard = false; // Reset the flag when the tween is complete
            }
        });
    }
}

export default GameManager;