class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    preload() {
        this.load.setBaseURL('assets');
        this.load.image('menuBackground', 'img/menu-landscape.svg');
    }

    create() {
        // Add a white rectangle that covers the entire screen (prevents black letterboxes)
        this.whiteBackground = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff)
            .setOrigin(0, 0)
            .setDepth(-1); // Make sure it's behind other elements
        
        // Stretched (translucent) background
        this.stretchedBackground = this.add.image(0, 0, 'menuBackground').setOrigin(0, 0);
        this.stretchedBackground.setAlpha(0.4); // Set translucency
        this.stretchedBackground.setDisplaySize(this.scale.width, this.scale.height); // Stretch to fill the screen
        this.stretchedBackground.setFlipX(true); //flip across vertical axis

        // Main background
        this.background = this.add.image(0, 0, 'menuBackground').setOrigin(0, 0);

        // Set the initial size
        this.resize(window.innerWidth, window.innerHeight);

        // Create a graphics and text objects
        this.graphics = this.add.graphics();
        this.textObjects = [];

        // Draw the initial menu box
        this.drawMenuBox();

        // Add the title
        this.updateTitle();

        // Handle window resize events
        this.scale.on('resize', (gameSize) => {
            this.resize(gameSize.width, gameSize.height);
        });
    }

    updateTitle() {
        const titleText = 'Feudal 2K';
        if (this.titleText) {
            this.titleText.setPosition(this.scale.width / 2, this.scale.height * 0.25);
        } else {
            this.titleText = this.add.text(this.scale.width / 2, this.scale.height * 0.25, titleText, {
                fontSize: '110px',
                fontFamily: 'GipsieroOwtLine',
                color: '#ffffff', // No fill
                align: 'center',
                stroke: '#f5f5dc', // Cream color for outline
                strokeThickness: 1,
                letterSpacing: 20,
            }).setOrigin(0.5);
        }
    }

    drawMenuBox() {
        if (this.graphics) {
            // Clear previous graphics and text objects
            this.graphics.clear();
            this.textObjects.forEach(text => text.destroy());
            this.textObjects = [];

            // Clear existing buttons
            if (this.buttonsContainer) {
                this.buttonsContainer.destroy(true);
            }
    
            // Define button dimensions and padding
            const minButtonWidth = 300;
            const maxButtonWidth = 600;
            const buttonHeight = 50;
            const buttonSpacing = 15; // Space between buttons
            const padding = 20; // Padding around the buttons
    
            // Define button dimensions as per min and max
            const buttonWidth = Phaser.Math.Clamp(200, minButtonWidth, maxButtonWidth);
    
            // Define buttons with their labels
            const buttons = [
                { label: 'Play Computer' },
                { label: 'Play Online' },
                { label: 'Help' },
                { label: 'Settings' },
                { label: 'Visit Site' }
            ];
    
            // Calculate total height needed for buttons and spacing
            const totalButtonHeight = buttonHeight * buttons.length + buttonSpacing * (buttons.length - 1);
    
            // Define menu box dimensions based on button size and padding
            const boxWidth = buttonWidth + 2 * padding;
            const boxHeight = totalButtonHeight + 2 * padding;
    
            // Min and max dimensions (percentage of screen size)
            const minWidth = 200;
            const maxWidth = 400;
            const minHeight = 300;
            const maxHeight = 600;
    
            // Adjust dimensions within min/max constraints
            const constrainedWidth = Phaser.Math.Clamp(boxWidth, minWidth, maxWidth);
            const constrainedHeight = Phaser.Math.Clamp(boxHeight, minHeight, maxHeight);
    
            // Center position of the menu box
            const x = this.scale.width / 2;
            const y = this.scale.height / 2;
    
            // Draw the semi-translucent teal rectangle
            this.graphics.fillStyle(0x008080, 0.6); // Teal color with 60% opacity
            this.graphics.fillRoundedRect(x - constrainedWidth / 2, y - constrainedHeight / 2, constrainedWidth, constrainedHeight, 20); // Rounded corners
    
            // Create a container for buttons
            this.buttonsContainer = this.add.container(x, y);
    
            // Calculate starting Y position for buttons
            // Adjusted to correctly position buttons with equal padding on top and bottom
            const startY = - (totalButtonHeight / 2) + padding;
    
            buttons.forEach((button, index) => {
                const buttonY = startY + index * (buttonHeight + buttonSpacing);
    
                // Create a new graphics object for each button
                const buttonGraphic = this.add.graphics();
                buttonGraphic.fillStyle(0x004d4d, 1); // Darker teal color
                buttonGraphic.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
    
                // Add button text
                const buttonText = this.add.text(0, 0, button.label, {
                    fontSize: '20px',
                    color: '#ffffff',
                    align: 'center',
                    fontFamily: 'Gipsiero OwtLine'
                }).setOrigin(0.5);
    
                // Create a container for the button
                const buttonContainer = this.add.container().add([buttonGraphic, buttonText]);
                buttonContainer.setSize(buttonWidth, buttonHeight); // Set size for interactive area
                buttonContainer.setPosition(0, buttonY);
                buttonContainer.setInteractive({ useHandCursor: true });
    
                // Add hover effects
                buttonContainer.on('pointerover', () => {
                    buttonGraphic.clear();
                    buttonGraphic.fillStyle(0x66cccc, 1); // Lighter teal color on hover
                    buttonGraphic.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
                });
    
                buttonContainer.on('pointerout', () => {
                    buttonGraphic.clear();
                    buttonGraphic.fillStyle(0x004d4d, 1); // Darker teal color when not hovered
                    buttonGraphic.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
                });
    
                // Add button to the container
                this.buttonsContainer.add(buttonContainer);
            });
        }
    }
            
    resize(width, height) {
        // Update white background
        this.whiteBackground.setSize(width, height);
        
        // Get the aspect ratio of the image
        const aspectRatio = this.background.width / this.background.height;

        // Calculate the new width and height while maintaining the aspect ratio
        let newWidth, newHeight;

        if (width / height > aspectRatio) {
            // Width is more constrained; adjust height
            newHeight = height;
            newWidth = height * aspectRatio;
        } else {
            // Height is more constrained; adjust width
            newWidth = width;
            newHeight = width / aspectRatio;
        }

        // Center the main background
        this.background.setDisplaySize(newWidth, newHeight);
        this.background.setPosition((width - newWidth) / 2, (height - newHeight) / 2);

        // Update the stretched background
        this.stretchedBackground.setDisplaySize(width, height);

        // Re-draw the title
        this.updateTitle();

        // Re-draw menu box
        this.drawMenuBox();
    }
}

export default MainMenu;