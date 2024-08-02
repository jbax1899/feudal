import Board from './Board.js';
import UI from './UI.js';
import GameManager from './GameManager.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.colors = {
            lightteal: 0x66cccc,
            teal: 0x008080,
            darkteal: 0x004d4d,
        };
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }

    preload() {
        this.load.setBaseURL('assets');
        // Background
        this.load.image('background', 'img/menu-landscape.svg');
        // UI
        this.load.image('menubutton', 'img/menubutton.svg');
        // Pieces
        this.load.image('piece_blank', 'img/piece_blank.png');
        this.load.image('piece_king', 'img/piece_king.png');
        this.load.image('piece_prince', 'img/piece_prince.png');
        this.load.image('piece_duke', 'img/piece_duke.png');
        this.load.image('piece_knight', 'img/piece_knight.png');
        this.load.image('piece_sergeant', 'img/piece_sergeant.png');
        this.load.image('piece_pikeman', 'img/piece_pikeman.png');
        this.load.image('piece_squire', 'img/piece_squire.png');
        this.load.image('piece_archer', 'img/piece_archer.png');
        this.load.image('piece_castle_inner', 'img/piece_castle_inner.png');
        this.load.image('piece_castle_outer', 'img/piece_castle_outer.png');
        // Board
        this.load.json('boardData', 'boardData.json');
        this.load.image('grass', 'img/grass.png');
        this.load.image('hill', 'img/hill.png');
        this.load.image('mountain', 'img/mountain.png');
        // Finished loading assets
        this.load.on('complete', () => {
            // Draw background
            this.drawBackground();

            // Start drawing UI
            this.ui = new UI(this);
            this.ui.create();

            // Create board
            this.board = new Board(this);
            this.board.create();

            // Game manager
            this.gameManager = new GameManager(this, this.board, this.ui);
            this.gameManager.create();
        });
    }

    create() {
        // Setup input for panning and zooming
        this.setupInput();

        // Handle window resize events
        this.scale.on('resize', (gameSize) => {
            this.drawBackground();
            this.ui.updateUIPosition();
        });
    }

    update() {
        this.gameManager.update();
    }

    drawBackground() {
        // Clear existing background
        if (this.background) this.background.destroy();
    
        // Get the camera dimensions and zoom factor
        const camera = this.cameras.main;
        const zoom = camera.zoom;

        // Create a new background image
        this.background = this.add.image(0, 0, 'background').setOrigin(0.5, 0.5);
        this.background.setAlpha(0.4); // Set translucency
        this.background.setDepth(-2);
    
        // Get the original size of the background image
        const originalWidth = this.background.width;
        const originalHeight = this.background.height;
    
        // Calculate aspect ratios
        const aspectRatioImage = originalWidth / originalHeight;
        const aspectRatioCamera = camera.width / camera.height;
    
        let newWidth, newHeight;
    
        // Determine new width and height to maintain aspect ratio
        if (aspectRatioCamera > aspectRatioImage) {
            newWidth = camera.width / zoom;
            newHeight = newWidth / aspectRatioImage;
        } else {
            newHeight = camera.height / zoom;
            newWidth = newHeight * aspectRatioImage;
        }
    
        // Set the new size
        this.background.setDisplaySize(newWidth, newHeight);
    
        // Center
        this.background.setPosition(camera.scrollX + camera.width / 2, camera.scrollY + camera.height / 2);
    }    

    updateBackgroundPosition() {
        if (this.background) {
            this.background.setPosition(
                this.cameras.main.scrollX + this.scale.width / 2,
                this.cameras.main.scrollY + this.scale.height / 2
            );
        }
        if (this.whiteBackground) {
            this.whiteBackground.setPosition(
                this.cameras.main.scrollX,
                this.cameras.main.scrollY
            );
        }
    }

    setupInput() {
        // Event listeners for panning (dragging)
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.isDragging = true;
                this.startX = pointer.x;
                this.startY = pointer.y;
                this.input.setDefaultCursor('grab'); // Change cursor to closed hand
            }
        });
    
        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const dx = pointer.x - this.startX;
                const dy = pointer.y - this.startY;
    
                // Move the camera
                this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
                this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
    
                // Re-draw background
                this.updateBackgroundPosition();
    
                // Move the UI
                this.ui.updateUIPosition();
    
                // Update start position
                this.startX = pointer.x;
                this.startY = pointer.y;
            }
        });
    
        this.input.on('pointerup', () => {
            this.isDragging = false;
            this.input.setDefaultCursor('auto'); // Revert cursor to default
        });
    
        this.input.on('pointerupoutside', () => {
            this.isDragging = false;
            this.input.setDefaultCursor('auto'); // Revert cursor to default
        });
    
        // Event listener for zooming
        window.addEventListener('wheel', (event) => {
            let zoomFactor = 0.1;
            if (event.deltaY < 0) {
                this.cameras.main.zoom += zoomFactor;
            } else {
                this.cameras.main.zoom -= zoomFactor;
            }
            this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.5, 2); // Zoom limits
            this.drawBackground();
            this.ui.updateUIPosition();
        });
    
        // Variables to store the state of keys
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }
    
    update(time, delta) {
        // Continuously check key states and move the camera
        // We do this instead of event listeners to eliminate the continous press delay
        const moveSpeed = 0.7 * delta;
    
        if (this.keys.up.isDown) {
            this.cameras.main.scrollY -= moveSpeed / this.cameras.main.zoom;
        }
    
        if (this.keys.left.isDown) {
            this.cameras.main.scrollX -= moveSpeed / this.cameras.main.zoom;
        }
    
        if (this.keys.down.isDown) {
            this.cameras.main.scrollY += moveSpeed / this.cameras.main.zoom;
        }
    
        if (this.keys.right.isDown) {
            this.cameras.main.scrollX += moveSpeed / this.cameras.main.zoom;
        }
    
        // Re-draw background and update UI if any movement happened
        if (this.keys.up.isDown || this.keys.left.isDown || this.keys.down.isDown || this.keys.right.isDown) {
            this.updateBackgroundPosition();
            this.ui.updateUIPosition();
        }
    }    
}

export default GameScene;