import Board from './Board.js';
import Player from './Player.js';
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
        this.ui = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }

    preload() {
        this.load.setBaseURL('assets');
        this.load.image('background', 'img/menu-landscape.svg');
        this.ui = new UI(this);
        this.ui.preload();
        this.board = new Board(this);
        this.board.preload();
    }

    create() {
        this.players = [new Player(this, 1), new Player(this, 2)];
        this.gameManager = new GameManager(this, this.board, this.players, this.ui);

        // Create graphics and text objects
        this.graphics = this.add.graphics();
        this.textObjects = [];

        // Start drawing UI
        this.ui.create();

        // Draw background
        this.drawBackground();

        // Draw board
        this.board.create();

        // Setup input for panning and zooming
        this.setupInput();

        // Handle window resize events
        this.scale.on('resize', (gameSize) => {
            this.drawBackground();
        });
    }

    update() {
        this.gameManager.update();
        //this.updateBackgroundPosition();
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
        this.background.setDepth(-1);
    
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
            this.isDragging = true;
            this.startX = pointer.x;
            this.startY = pointer.y;
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
        });

        this.input.on('pointerupoutside', () => {
            this.isDragging = false;
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
    }
}

export default GameScene;