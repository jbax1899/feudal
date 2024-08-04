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
        this.trayScrollOffset = 0;
    }

    create() {
        // Create UI and group elements into the container
        this.createUI();

        // Add starting pieces
        for (const [pieceType, quantity] of Object.entries(this.startingPieces)) {
            this.addPiece(pieceType, quantity);
        }
        this.createPieceTray(); // Update the piece tray to reflect changes

        // Set up drag-and-drop functionality
        this.setupDragAndDrop();

        // Add mouse wheel scrolling for the piece tray
        this.addMouseWheelScrolling();

        // Handle window resize events
        this.scene.scale.on('resize', (gameSize) => {
            this.createMenuButton();
            //this.createPieceTray();
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
        //this.createPieceTray();
    }

    addPiece(pieceType, count) {
        if (!this.availablePieces[pieceType]) {
            this.availablePieces[pieceType] = 0;
        }
        this.availablePieces[pieceType] += count;
    }

    createPieceTray() {
        const pieceHeight = 100; 
        const pieceWidth = 100; 
        const spacing = pieceWidth / 3;
        const padding = pieceWidth / 5;
        const trayHeight = Math.round(pieceHeight + 2 * padding);
        const maxTrayWidth = Math.round(this.scene.cameras.main.width * 0.75);
        const adjustedWidth = Math.min((pieceWidth + spacing) * Object.keys(this.startingPieces).length, maxTrayWidth);
        const startX = Math.round((this.scene.cameras.main.width / 2) - (adjustedWidth / 2) + padding); // Center horizontally
        const startY = Math.round(this.scene.cameras.main.height - pieceHeight - (padding * 2)); // Position at the bottom

        // Piece tray
        if (this.pieceTray) {
            this.pieceTray.list.forEach(piece => {piece.destroy(); }); // Destroy the sprites and text
            this.pieceTray.removeAll(true).destroy(); // Remove all children from the pieceTray container
        }
        this.pieceTray = this.scene.add.container(startX, startY)
                        .setSize(adjustedWidth, trayHeight)
                        .setInteractive(new Phaser.Geom.Rectangle(0, 0, adjustedWidth, pieceHeight), Phaser.Geom.Rectangle.Contains);
        this.uiContainer.add(this.pieceTray);
    
        // Hide overflow with mask
        /*
        if (this.mask)
            this.mask.destroy();
        this.mask = this.scene.add.graphics()
                    .fillStyle(0xFF0000, 0.5) // Red color with 50% opacity for debugging
                    .fillRect(0, 0, adjustedWidth, trayHeight)
                    .setVisible(true)
                    .setPosition(startX, startY); // Align mask with pieceTray
        this.uiContainer.add(this.mask);
        this.pieceTray.setMask(this.mask.createGeometryMask());
        */
    
        // Draw a semi-transparent rectangle for tray background with the player's color
        const playerColorHex = this.scene.gameManager.playerColors[this.playerNumber - 1].color;
        const playerColor = Phaser.Display.Color.HexStringToColor(playerColorHex).color;
        const backgroundGraphics = this.scene.add.graphics();
        backgroundGraphics.fillStyle(playerColor, 0.5)
                          .fillRect(-padding, -padding, adjustedWidth, trayHeight)
                          .setDepth(-1)
                          .setInteractive(new Phaser.Geom.Rectangle(-padding, -padding, adjustedWidth, trayHeight), Phaser.Geom.Rectangle.Contains); // Set as interactive so we can't click through it
        this.pieceTray.add(backgroundGraphics);
    
        // Add pieces to the piece tray
        Object.entries(this.availablePieces).forEach(([pieceType, quantity], index) => {
            const x = (pieceWidth / 2) + index * (pieceWidth + spacing) + this.trayScrollOffset;
            const y = (pieceHeight / 2);
    
            // Create the piece sprite with the default texture
            const pieceIcon = this.scene.add.sprite(x, y, 'piece_' + pieceType)
                .setOrigin(0.5, 0.5)
                .setInteractive({ draggable: true });
            pieceIcon.displayWidth = pieceWidth; 
            pieceIcon.displayHeight = pieceHeight;
    
            // Recolor and set texture
            const piece = new Piece(this.scene, 0, 0, pieceType, this.playerNumber);
            piece.recolorSprite();
    
            if (this.scene.textures.exists('recolored_piece_' + pieceType + '_' + this.playerNumber)) {
                pieceIcon.setTexture('recolored_piece_' + pieceType + '_' + this.playerNumber);
            }
    
            // Display the quantity above the icon
            const quantityText = this.scene.add.text(x + pieceWidth / 2 + pieceWidth / 5, y - pieceHeight / 2, quantity, { 
                fontSize: '32px', 
                fill: '#000', 
                fontStyle: 'bold'
            }).setOrigin(1, 0);
    
            pieceIcon.setAlpha(quantity === 0 ? 0.5 : 1); // Set opacity based on availability
    
            // Add pieces to the piece tray
            this.pieceTray.add([pieceIcon, quantityText]); 
            piece.sprite.destroy(); 
        });
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

    setupDragAndDrop() {
        let draggedPiece;
        let originalPiece; // Variable to hold the reference to the original tray piece
        
        // Drag start event
        this.scene.input.on('dragstart', (pointer, gameObject) => {
            const pieceType = gameObject.texture.key.split('_')[2]; // Get piece type from texture key
    
            // Check if there are available pieces
            if (this.availablePieces[pieceType] > 0) {
                originalPiece = gameObject; // Store a reference to the original piece
                originalPiece.setAlpha(0.5); // Make the original piece semi-transparent
            
                // Create a copy of the piece for dragging
                draggedPiece = this.scene.add.sprite(pointer.x, pointer.y, originalPiece.texture.key)
                    .setOrigin(0.5, 0.5)
                    .setScale(0.25)
                    .setDepth(1000);
            } else {
                //console.warn(`No available pieces of type '${pieceType}' to drag.`);
            }
        });
        
        this.scene.input.on('drag', (pointer) => {
            if (draggedPiece) {
                // Get the global position of the pointer
                const globalPointer = pointer.positionToCamera(this.scene.cameras.main);
        
                // Update the position of the dragged piece
                draggedPiece.setPosition(globalPointer.x, globalPointer.y);
            }
        });        
        
        // Drag end event
        this.scene.input.on('dragend', (pointer) => {
            if (draggedPiece) {
                const pieceType = draggedPiece.texture.key.split('_')[2]; // Get piece type from texture key
                const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y); // Get world coordinates
                
                // Check if the piece is dropped on the board
                if (this.scene.board.boardContainer.getBounds().contains(worldPoint.x, worldPoint.y)) {
                    // Convert screen coordinates to board coordinates
                    const { boardX, boardY } = this.scene.board.screenToBoard(worldPoint.x, worldPoint.y);
                    const success = this.scene.board.addPiece(boardX, boardY, pieceType, this.playerNumber); // Use the pieceType instead
                    if (success) {
                        // Decrement available pieces on successful placement
                        if (this.availablePieces[pieceType] !== undefined) {
                            this.availablePieces[pieceType] -= 1;
                            this.createPieceTray();
                        } else {
                            console.warn(`Piece type '${pieceType}' is not defined in availablePieces.`);
                        }                        
                    } else {
                        originalPiece.setAlpha(1); 
                        //console.warn('Failed to add piece at:', boardX, boardY);
                    }
                }

                // Remove the dragged piece
                draggedPiece.destroy();
                draggedPiece = null; // Clear the reference
            }
        });
    }
    
    addMouseWheelScrolling() {
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            // Get the pointer's coordinates relative to the camera
            const camera = this.scene.cameras.main;
            const relativeX = pointer.x + camera.scrollX;
            const relativeY = pointer.y + camera.scrollY;
    
            // Check if the mouse is over the piece tray using relative coordinates
            if (this.pieceTray.getBounds().contains(relativeX, relativeY)) {
                // Adjust the tray's x position based on deltaY
                this.trayScrollOffset -= Math.round(deltaY * 0.5); // scroll speed
                this.createPieceTray();
            }
        });
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

            // Re-draw piece tray
            this.createPieceTray();
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