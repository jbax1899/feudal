import Piece from './Piece.js';

class UI {
    constructor(scene) {
        this.scene = scene;
        this.colors = {
            lightteal: 0x66cccc,
            teal: 0x008080,
            darkteal: 0x004d4d,
        };
        this.uiContainer = null; // Container for all UI elements
        this.pieceTray = null; // Container for the piece tray
        this.availablePieces = {}; // Object to track available pieces
        this.pieceIcons = {}; // Object to store piece icons
        this.startingPieces = {
            'king': 1,
            'prince': 1,
            'duke': 1,
            'knight': 2,
            'sergeant': 2,
            'pikeman': 4,
            'squire': 1,
            'archer': 1,
            'castle_inner': 1
        };
        this.playerNumber = 1; // DEBUG, assuming 1
    }

    create() {
        // Create UI and group elements into the container
        this.createUI();

        // Add starting pieces
        for (const [pieceType, quantity] of Object.entries(this.startingPieces)) {
            this.addPiece(pieceType, quantity);
        }

        // Handle window resize events
        this.scene.scale.on('resize', (gameSize) => {
            this.createMenuButton();
            this.createPieceTray();
        });

        // Event listener for clicks anywhere on the screen
        this.scene.input.on('pointerdown', (pointer) => {
            if (this.dropdownContainer.visible)
                this.toggleDropdown();
        });
    }

    createUI() {
        // Create the UI container
        this.uiContainer = this.scene.add.container(0, 0);
        this.uiContainer.setDepth(1000); // Ensure the UI is above other elements
        this.createMenuButton();
        this.createPieceTray();
    }

    addPiece(pieceType, count) {
        if (!this.availablePieces[pieceType]) {
            this.availablePieces[pieceType] = 0;
        }
        this.availablePieces[pieceType] += count;
        this.createPieceTray(); // Update the piece tray to reflect changes
    }

    clearPieceTray() {
        // Remove existing piece icons and quantity texts from the piece tray
        if (this.pieceTray) {
            this.pieceTray.list.forEach(piece => {
                piece.destroy(); // Destroy the sprite or text
            });
            this.pieceTray.removeAll(true); // Remove all children from the pieceTray container
        }
    }      

    createPieceTray() {
        // If pieceTray already exists, clear it first
        if (this.pieceTray) {
            this.clearPieceTray(); // Clear existing pieces first
            this.pieceTray.destroy(); // Destroy the previous container to prevent memory leaks
        }
    
        // Create the piece tray container
        this.pieceTray = this.scene.add.container(0, 0);
    
        // Get the player's color based on playerNumber
        const playerColorHex = this.scene.gameManager.playerColors[this.playerNumber - 1].color; // Adjust for zero-indexing
        const playerColor = Phaser.Display.Color.HexStringToColor(playerColorHex).color; // Convert to Phaser color
    
        // Set piece height and width
        const pieceHeight = 100; 
        const pieceWidth = 100; 
        const spacing = pieceWidth / 3; // Spacing between pieces
        const padding = pieceWidth / 5; // Padding for the background
        const totalWidth = (pieceWidth + spacing) * Object.keys(this.startingPieces).length; // Total width of piece tray
        const backgroundHeight = pieceHeight + 2 * padding; // Adjust height to accommodate padding
    
        // Calculate starting position for the piece tray
        const startX = this.scene.cameras.main.width / 2 - (totalWidth / 2); // Center horizontally
        const startY = this.scene.cameras.main.height - pieceHeight; // Position at the bottom
    
        // Create the semi-transparent background
        const backgroundGraphics = this.scene.add.graphics();
        const backgroundAlpha = 0.5; // Adjust this for desired transparency
    
        // Adjust the position of the background rectangle for the sprite's origin and padding
        const backgroundX = startX - (pieceWidth / 2) - padding; // Offset to the left
        const backgroundY = startY - (pieceHeight / 2) - padding; // Offset upward
    
        // Draw a rectangle that will serve as the background
        backgroundGraphics.fillStyle(playerColor, backgroundAlpha); // Fill color with transparency
        backgroundGraphics.fillRect(backgroundX, backgroundY, totalWidth + 2 * padding, backgroundHeight); // Draw the rectangle at the adjusted position
        backgroundGraphics.setDepth(-1); // Ensure the background is behind other elements
    
        // Add the background graphics to the piece tray
        this.pieceTray.add(backgroundGraphics);
    
        // Add pieces to the piece tray
        Object.entries(this.startingPieces).forEach(([pieceType, quantity], index) => {
            const x = startX + index * (pieceWidth + spacing);
            const y = startY;
    
            // Create the piece sprite with the default texture
            const pieceIcon = this.scene.add.sprite(x, y, 'piece_' + pieceType).setOrigin(0.5, 0.5);
            pieceIcon.displayWidth = pieceWidth; // Set display size
            pieceIcon.displayHeight = pieceHeight;
    
            // Create a temporary Piece instance for recoloring
            const piece = new Piece(this.scene, 0, 0, pieceType, this.playerNumber);
            
            // Recolor the sprite
            piece.recolorSprite();
    
            // Set the recolored texture to the icon if the texture exists
            if (this.scene.textures.exists('recolored_piece_' + pieceType + '_' + this.playerNumber)) {
                pieceIcon.setTexture('recolored_piece_' + pieceType + '_' + this.playerNumber);
            } else {
                console.warn('Recolored texture does not exist:', 'recolored_piece_' + pieceType + '_' + this.playerNumber);
            }
    
            // Display the quantity above the icon
            const quantityText = this.scene.add.text(x + pieceWidth / 2 + pieceWidth / 5, y - pieceHeight / 2, quantity, { 
                fontSize: '32px', 
                fill: '#000', // black
                fontStyle: 'bold'
            }).setOrigin(1, 0); // Align to the top-right corner

            // Add to piece tray container
            this.pieceTray.add([pieceIcon, quantityText]); // Store both in piece tray

            // Clean up the non-UI piece instance
            piece.sprite.destroy(); // Destroy the temporary piece instance
        });
    
        // Add pieceTray to the UI container
        this.uiContainer.add(this.pieceTray);
    }    
    
    populatePieceTray(trayX, trayY, trayWidth, trayHeight) {
        const pieceSize = trayHeight * 0.8; // Size of each piece icon
        const padding = pieceSize * 0.2; // Padding between piece icons
        const startX = trayX + padding; // Starting X position
        const startY = trayY + (trayHeight - pieceSize) / 2; // Centered vertically

        let x = startX;
        let y = startY;

        for (const [pieceType, count] of Object.entries(this.availablePieces)) {
            // Create a piece icon
            const pieceIcon = this.scene.add.sprite(x, y, 'piece_' + pieceType)
                .setDisplaySize(pieceSize, pieceSize)
                .setInteractive({ draggable: true });
            
            // Store the piece icon for future reference
            this.pieceIcons[pieceType] = pieceIcon;

            // Display the count of available pieces
            const countText = this.scene.add.text(x - pieceSize / 2, y - pieceSize / 2, count, {
                fontSize: `${pieceSize * 0.4}px`,
                fill: '#fff'
            }).setOrigin(0, 0);

            // Add piece icon and count text to the tray
            this.pieceTray.add([pieceIcon, countText]);

            // Update the position for the next piece
            x += pieceSize + padding;
        }
    }

    updateUIPosition() {
        if (this.uiContainer) {
            const camera = this.scene.cameras.main;
    
            // Calculate the top-left corner of the viewport in world coordinates
            const viewportTopLeftX = camera.scrollX;
            const viewportTopLeftY = camera.scrollY;
    
            // Calculate the offset based on the zoom level
            const offsetX = (camera.width / 2) * (1 - 1 / camera.zoom);
            const offsetY = (camera.height / 2) * (1 - 1 / camera.zoom);
    
            // Set the UI container's position to match the viewport's top-left corner, adjusted by the offset
            this.uiContainer.setPosition(viewportTopLeftX + offsetX, viewportTopLeftY + offsetY);
    
            // Adjust scale to counteract the zoom effect
            this.uiContainer.setScale(1 / camera.zoom);
        }
    }
    
    createMenuButton() {
        // If the menu already exists, delete it
        if (this.menuButton) {
            this.menuButton.destroy();
            if (this.dropdownContainer) this.dropdownContainer.destroy();
        }
    
        // Calculate size and position based on screen dimensions
        const buttonSize = Math.min(this.scene.cameras.main.width, this.scene.cameras.main.height) * 0.05;
        const padding = buttonSize * 0.1;
        const buttonPositionX = this.scene.cameras.main.width - padding;
        const buttonPositionY = padding;
        const buttonSpacing = buttonSize * 0.5; // Increased space between buttons
    
        // Add the Menu Button
        this.menuButton = this.scene.add.sprite(buttonPositionX, buttonPositionY, 'menubutton')
            .setOrigin(1, 0)
            .setDisplaySize(buttonSize, buttonSize)
            .setInteractive();
    
        // Create a container for the dropdown
        this.dropdownContainer = this.scene.add.container(buttonPositionX - padding, buttonPositionY + buttonSize);
        this.dropdownContainer.setVisible(false);
    
        // Define text and background properties
        const textStyle = { 
            fill: '#fff', 
            fontSize: `${buttonSize * 0.4}px`,
            padding: { left: padding, right: padding, top: padding, bottom: padding } // Padding around the text
        };
        const borderPadding = padding; // Padding around the text and border
    
        // Function to create text with a filled border
        const createTextWithBorder = (x, y, text, onClickAction) => {
            // Create the text object
            const textObject = this.scene.add.text(x, y, text, textStyle)
                .setOrigin(1, 0.5)
                .setInteractive();
    
            // Calculate border dimensions
            const borderWidth = textObject.width + (borderPadding * 2);
            const borderHeight = textObject.height + (borderPadding * 2);
    
            // Create the rectangle border
            const border = this.scene.add.graphics()
                .fillStyle(this.colors.teal) // Default border color
                .fillRect(x - borderWidth + borderPadding, y - borderHeight / 2, borderWidth, borderHeight)
                .setDepth(-1) // Ensure the border is behind the text
                .setInteractive() // Make sure the border is interactive
                .on('pointerover', () => {
                    border.setFillStyle(this.colors.lightteal); // Change border to light teal on hover
                    textObject.setFill('#fff'); // Ensure text remains white
                })
                .on('pointerout', () => {
                    border.setFillStyle(this.colors.teal); // Change border back to teal
                    textObject.setFill('#fff'); // Ensure text remains white
                });
    
            // Add the rectangle and text to the dropdown container
            this.dropdownContainer.add([border, textObject]);
    
            // Set the click action
            textObject.on('pointerup', onClickAction);
    
            return textObject;
        };
    
        // Add buttons to the dropdown container with borders and actions
        this.dropdownButton1 = createTextWithBorder(0, 0, 'Settings', () => {
            console.log('Settings button clicked');
        });
        this.dropdownButton2 = createTextWithBorder(0, buttonSize * 0.4 + buttonSpacing, 'Exit to Menu', () => {
            this.scene.scene.switch('MainMenu');
            this.scene.scene.stop('GameScene');
        });
        this.dropdownButton3 = createTextWithBorder(0, buttonSize * 0.8 + buttonSpacing * 2, 'Visit Site', () => {
            window.open('https://github.com/jbax1899/feudal')
        });
    
        // Function to handle the dropdown animation
        this.toggleDropdown = () => {
            const targetY = buttonPositionY + buttonSize * 1.5; // Target position for showing the dropdown
    
            if (this.dropdownContainer.visible) {
                // Animate hiding
                this.scene.tweens.add({
                    targets: this.dropdownContainer,
                    y: buttonPositionY + buttonSize, // Reset y to original position
                    duration: 300,
                    ease: 'Power1',
                    onComplete: () => {
                        this.dropdownContainer.setVisible(false);
                    }
                });
            } else {
                // Show dropdown and animate
                this.dropdownContainer.setVisible(true);
                this.dropdownContainer.y = buttonPositionY + buttonSize;
    
                this.scene.tweens.add({
                    targets: this.dropdownContainer,
                    y: targetY, // Animate to new position
                    duration: 300,
                    ease: 'Power1',
                });
            }
        };
    
        // Set up the click event for the menu button
        this.menuButton.on('pointerup', () => {
            this.toggleDropdown();
        });

        // Add UI elements to the container
        this.uiContainer.add([this.menuButton, this.dropdownContainer]);
    }
}

export default UI;