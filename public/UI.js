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
        const camera = this.scene.cameras.main;
        const pieceHeight = 100; 
        const pieceWidth = 100; 
        const spacing = Math.round(pieceWidth / 3);
        const padding = Math.round(pieceWidth / 5);
        const trayHeight = Math.round(pieceHeight + 2 * padding);
        const maxTrayWidth = Math.round(camera.width * 0.75);
        const adjustedWidth = Math.min((pieceWidth + spacing) * Object.keys(this.startingPieces).length, maxTrayWidth);
        const startX = Math.round((camera.width / 2) - (adjustedWidth / 2)); // Center horizontally
        const startY = Math.round(camera.height - pieceHeight - (padding * 3)); // Position at the bottom

        // Draw a semi-transparent rectangle for tray background with the player's color
        const playerColorHex = this.scene.gameManager.playerColors[this.playerNumber - 1].color;
        const playerColor = Phaser.Display.Color.HexStringToColor(playerColorHex).color;
        this.trayRectangle = new Phaser.Geom.Rectangle(0, 0, adjustedWidth, trayHeight);
        const backgroundGraphics = this.scene.add.graphics()
                                .fillStyle(playerColor, 0.5)
                                .fillRect(0, 0, adjustedWidth, trayHeight)
                                .setDepth(-1)
                                .setInteractive(this.trayRectangle, Phaser.Geom.Rectangle.Contains); // Set as interactive so we can't click through it
        // Piece tray container
        if (this.pieceTray) {
            this.pieceTray.list.forEach(piece => {piece.destroy(); }); // Destroy the sprites and text
            this.pieceTray.removeAll(true).destroy(); // Remove all children from the pieceTray container
        }
        this.pieceTray = this.scene.add.container(startX, startY)
                        .setSize(adjustedWidth, trayHeight)
                        .setInteractive(this.trayRectangle, Phaser.Geom.Rectangle.Contains)
                        .add(backgroundGraphics);
        this.uiContainer.add(this.pieceTray);

        // Hide overflow with mask
        if (this.mask) {
            this.mask.destroy();
        }
        const maskWidth = Math.round(adjustedWidth / camera.zoom);
        const maskHeight = Math.round(trayHeight / camera.zoom);
        const globalPos = this.cameraToGlobal(startX, startY);
        this.mask = this.scene.add.graphics()
                    //.fillStyle(0xFF0000, 0.5) // Red color with 50% opacity for debugging
                    .fillRect(0, 0, maskWidth, maskHeight)
                    .setVisible(true)
                    .setPosition(globalPos.x, globalPos.y)
        this.pieceTray.setMask(this.mask.createGeometryMask());
        this.trayBounds = new Phaser.Geom.Rectangle(this.mask.x, this.mask.y, maskWidth, maskHeight); // interactible tray bounds, global pos/size

        // Add pieces to the piece tray
        const maxScrollOffset = (adjustedWidth - padding - (pieceWidth + spacing)) - ((Object.keys(this.availablePieces).length - 1) * (pieceWidth + spacing));
        this.trayScrollOffset = Math.min(Math.max(this.trayScrollOffset, maxScrollOffset), 0);
        Object.entries(this.availablePieces).forEach(([pieceType, quantity], index) => {
            const x = Math.round((pieceWidth / 2) + index * (pieceWidth + spacing) + padding + this.trayScrollOffset);
            const y = Math.round((pieceHeight / 2) + padding);
            
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
            const quantityText = this.scene.add.text(
                Math.round(x + pieceWidth / 2 + pieceWidth / 5), 
                Math.round(y - pieceHeight / 2), 
                quantity, 
                { 
                    fontSize: '32px', 
                    fill: '#000', 
                    fontStyle: 'bold'
                }
            ).setOrigin(1, 0);
    
            pieceIcon.setAlpha(quantity === 0 ? 0.5 : 1); // Set opacity based on availability
    
            // Add pieces to the piece tray
            this.pieceTray.add([pieceIcon, quantityText]); 
            piece.sprite.destroy(); 
        });
    }

    setupDragAndDrop() {
        let originalPiece; // Variable to hold the reference to the original tray piece
        let startPos; // view coordinates where we started dragging
        
        // Drag start event
        this.scene.input.on('dragstart', (pointer, gameObject) => {
            const pieceType = gameObject.texture.key.split('_')[2]; // Get piece type from texture key
    
            // Check if there are available pieces
            if (this.availablePieces[pieceType] > 0) {
                originalPiece = gameObject; // Store a reference to the original piece
                startPos = { x: pointer.x, y: pointer.y };
                originalPiece.setAlpha(0.5); // Make the original piece semi-transparent
            
                // Create a copy of the piece for dragging
                const globalPointer = pointer.positionToCamera(this.scene.cameras.main);
                this.draggedPiece = this.scene.add.sprite(globalPointer.x, globalPointer.y, originalPiece.texture.key)
                    .setOrigin(0.5, 0.5)
                    .setScale(originalPiece.scale / this.scene.cameras.main.zoom)
                    .setDepth(1000);
            }
        });
        
        this.scene.input.on('drag', (pointer) => {
            if (this.draggedPiece) {
                // Dragged piece gets smaller as it gets further away from the tray, until it meets tileSize
                // Calculate the Y distance from the original piece
                const yDistance = Math.abs(pointer.y - startPos.y);
        
                // Calculate the scale based on the Y distance
                const fixedDistance = originalPiece.width / 3;
                const minScale = this.scene.board.tileSize / originalPiece.width;
                const maxScale = originalPiece.scale / this.scene.cameras.main.zoom;
                let scale;
                if (pointer.y > startPos.y) {
                    scale = originalPiece.scale;
                }
                else if (yDistance < fixedDistance) {
                    scale = maxScale - (maxScale - minScale) * (yDistance / fixedDistance);
                } else {
                    scale = minScale;
                }
                this.draggedPiece.setScale(scale);

                // Update the position of the dragged piece
                const globalPointer = pointer.positionToCamera(this.scene.cameras.main);
                this.draggedPiece.setPosition(globalPointer.x, globalPointer.y);
            }
        });
        
        // Drag end event
        this.scene.input.on('dragend', (pointer) => {
            if (this.draggedPiece) {
                const pieceType = this.draggedPiece.texture.key.split('_')[2]; // Get piece type from texture key
                const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y); // Get world coordinates
                
                // Check if the piece is dropped on the board
                if (this.scene.board.boardContainer.getBounds().contains(worldPoint.x, worldPoint.y)
                && !this.trayBounds.contains(worldPoint.x, worldPoint.y)
                ) {
                    // Convert screen coordinates to board coordinates
                    const { boardX, boardY } = this.scene.board.screenToBoard(worldPoint.x, worldPoint.y);
                    if (this.scene.board.addPiece(boardX, boardY, pieceType, this.playerNumber)) {
                        // Decrement available pieces on successful placement
                        this.availablePieces[pieceType] -= 1;
                        this.createPieceTray();
                    } else {
                        originalPiece.setAlpha(1); 
                    }
                } else {
                    originalPiece.setAlpha(1);
                }

                // Remove the dragged piece
                this.stopDraggingPiece();
            }
        });   
    }

    stopDraggingPiece() {
        if (this.draggedPiece) {
            this.draggedPiece.destroy();
            this.draggedPiece = null;
        }
    }

    cameraToGlobal(viewX, viewY) {
        // Calculate global coordinates considering zoom and scroll
        const camera = this.scene.cameras.main;
        const globalX = (viewX - camera.width / 2) / camera.zoom + camera.scrollX + camera.width / 2;
        const globalY = (viewY - camera.height / 2) / camera.zoom + camera.scrollY + camera.height / 2;
    
        return { x: globalX, y: globalY };
    }

    globalToCamera(globalX, globalY) {
        // Calculate view coordinates considering zoom and scroll
        const camera = this.scene.cameras.main;
        const viewX = (globalX - camera.scrollX - camera.width / 2) * camera.zoom + camera.width / 2;
        const viewY = (globalY - camera.scrollY - camera.height / 2) * camera.zoom + camera.height / 2;
    
        return { x: viewX, y: viewY };
    }

    updateUIPosition() {
        if (this.uiContainer) {
            // Get the top-left corner of the viewport in world coordinates
            const topLeft = this.cameraToGlobal(0, 0);
    
            // Set the UI container's position to match the viewport's top-left corner
            this.uiContainer.setPosition(topLeft.x, topLeft.y);
    
            // Adjust scale to counteract the zoom effect
            this.uiContainer.setScale(1 / this.scene.cameras.main.zoom);
    
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