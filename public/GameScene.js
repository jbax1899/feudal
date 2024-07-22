class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.colors = {
            lightteal: 0x66cccc,
            teal: 0x008080,
            darkteal: 0x004d4d,
        }
    }

    preload() {
        this.load.setBaseURL('assets');
        this.load.image('background', 'img/menu-landscape.svg');
        this.load.image('menubutton', 'img/menubutton.svg');
    }

    create() {
        // Create a graphics and text objects
        this.graphics = this.add.graphics();
        this.textObjects = [];

        // Handle window resize events
        this.scale.on('resize', (gameSize) => {
            this.drawBackground();
            this.createMenuButton();
        });
        
        // First draw
        this.drawBackground();
        // Menu button
        this.createMenuButton();
    }

    drawBackground() {
        // Clear existing backgrounds
        if (this.whiteBackground) this.whiteBackground.destroy();
        if (this.background) this.background.destroy();
    
        // Add a white rectangle to cover the entire screen
        this.whiteBackground = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff);
        this.whiteBackground.setOrigin(0, 0);
        this.whiteBackground.setDepth(-2);
    
        // Create a new background image
        this.background = this.add.image(0, 0, 'background').setOrigin(0.5, 0.5);
        this.background.setAlpha(0.4); // Set translucency
        this.background.setDepth(-1);
    
        // Get the original size of the background image
        const originalWidth = this.background.width;
        const originalHeight = this.background.height;
    
        // Calculate aspect ratios
        const aspectRatioImage = originalWidth / originalHeight;
        const aspectRatioScreen = this.scale.width / this.scale.height;
    
        let newWidth, newHeight;
    
        // Determine new width and height to maintain aspect ratio
        if (aspectRatioScreen > aspectRatioImage) {
            newWidth = this.scale.width;
            newHeight = newWidth / aspectRatioImage;
        } else {
            newHeight = this.scale.height;
            newWidth = newHeight * aspectRatioImage;
        }
    
        // Set the new size for the background image
        this.background.setDisplaySize(newWidth, newHeight);
    
        // Center the background image
        this.background.setPosition(this.scale.width / 2, this.scale.height / 2);
    }

    createMenuButton() {
        // If the menu already exists, delete it
        if (this.menuButton) {
            this.menuButton.destroy();
            this.dropdownContainer.destroy();
        }
    
        // Calculate size and position based on screen dimensions
        const buttonSize = Math.min(this.cameras.main.width, this.cameras.main.height) * 0.05;
        const padding = buttonSize * 0.1;
        const buttonPositionX = this.cameras.main.width - padding;
        const buttonPositionY = padding;
        const buttonSpacing = buttonSize * 0.5; // Increased space between buttons
    
        // Add the Menu Button
        this.menuButton = this.add.sprite(buttonPositionX, buttonPositionY, 'menubutton')
            .setOrigin(1, 0)
            .setDisplaySize(buttonSize, buttonSize)
            .setInteractive();
    
        // Create a container for the dropdown
        this.dropdownContainer = this.add.container(buttonPositionX - padding, buttonPositionY + buttonSize);
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
            const textObject = this.add.text(x, y, text, textStyle)
                .setOrigin(1, 0.5)
                .setInteractive();
    
            // Calculate border dimensions
            const borderWidth = textObject.width + (borderPadding * 2);
            const borderHeight = textObject.height + (borderPadding * 2);
    
            // Create the rectangle border
            const border = this.add.graphics()
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
            this.scene.switch('MainMenu');
        });
        this.dropdownButton3 = createTextWithBorder(0, buttonSize * 0.8 + buttonSpacing * 2, 'Visit Site', () => {
            window.open('https://github.com/jbax1899/feudal')
        });
    
        // Function to handle the dropdown animation
        this.toggleDropdown = () => {
            const targetY = buttonPositionY + buttonSize * 1.5; // Target position for showing the dropdown
    
            if (this.dropdownContainer.visible) {
                // Animate hiding
                this.tweens.add({
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
    
                this.tweens.add({
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
    }
    
}

export default GameScene;