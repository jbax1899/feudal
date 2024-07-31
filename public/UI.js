class UI {
    constructor(scene) {
        this.scene = scene;
        this.colors = {
            lightteal: 0x66cccc,
            teal: 0x008080,
            darkteal: 0x004d4d,
        };
        this.uiContainer = null; // Container for all UI elements
    }

    create() {
        // Create UI and group elements into the container
        this.createUI();

        // Handle window resize events
        this.scene.scale.on('resize', (gameSize) => {
            this.createMenuButton();
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