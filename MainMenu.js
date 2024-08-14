class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
        this.visibleMenu = 'Main';
        this.colors = {
            lightteal: 0x66cccc,
            teal: 0x008080,
            darkteal: 0x004d4d,
        }
    }

    preload() {
        this.load.setBaseURL('assets');
        this.load.image('menuBackground', 'img/menu-landscape.svg');
    }

    create() {
        // Create a graphics and text objects
        this.graphics = this.add.graphics();
        this.textObjects = [];

        // Handle window resize events
        this.scale.on('resize', (gameSize) => {
            this.changeMenu(this.visibleMenu);
        });
        
        // First draw
        this.changeMenu(this.visibleMenu);
    }

    drawBackground() {
        // Clear existing backgrounds
        if (this.whiteBackground) this.whiteBackground.destroy();
        if (this.stretchedBackground) this.stretchedBackground.destroy();
        if (this.background) this.background.destroy();
    
        // Add a white rectangle to cover the entire screen (letterboxes)
        this.whiteBackground = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff);
        this.whiteBackground.setOrigin(0, 0);
        this.whiteBackground.setDepth(-3);

        // Stretched (translucent) background
        this.stretchedBackground = this.add.image(0, 0, 'menuBackground').setOrigin(0, 0);
        this.stretchedBackground.setAlpha(0.4); // Set translucency
        this.stretchedBackground.setDisplaySize(this.scale.width, this.scale.height);
        this.stretchedBackground.setPosition(0, 0);
        this.stretchedBackground.setFlipX(true); // Flip around the vertical axis
        this.stretchedBackground.setDepth(-2);
    
        // Main background image (fit horizontally)
        this.background = this.add.image(0, 0, 'menuBackground').setOrigin(0, 0);
        // Set the background size to fit the width and keep its aspect ratio
        this.background.setDisplaySize(this.scale.width, (this.scale.width / this.background.width) * this.background.height);
        // Center the background horizontally
        this.background.setPosition(0, (this.scale.height - this.background.displayHeight) / 2);
        this.background.setDepth(-1);
    }     

    drawTitle() {
        const titleText = 'Feudal 2K';
        if (this.titleText) {
            this.titleText.setPosition(this.scale.width / 2, this.scale.height * 0.25);
        } else {
            this.titleText = this.add.text(this.scale.width / 2, this.scale.height * 0.25, titleText, {
                fontSize: '110px',
                fontFamily: 'GipsieroOwtLine',
                color: 'transparent', // No fill
                align: 'center',
                stroke: '#f5f5dc', // Cream color for outline
                strokeThickness: 2,
                letterSpacing: 20,
            }).setOrigin(0.5);
        }
    }

    changeMenu(menu) {
        // Clear previous graphics and text objects
        this.graphics.clear();
        this.textObjects.forEach(text => text.destroy());
        this.textObjects = [];

        // Clear existing buttons
        if (this.buttonsContainer) {
            this.buttonsContainer.destroy(true);
        }
        
        // Draw the background
        this.drawBackground();

        // Draw the title
        this.drawTitle();

        // Draw the proper menu based on state
        if (menu === 'Main') {
            this.drawMenuBox();
        } else if (menu === 'Help') {
            this.showHelp();
        }
    }

    drawMenuBox() {
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
            { label: 'Play Computer', onClick: () => { 
                this.scene.switch('GameScene');
                this.scene.stop('MainMenu');
            }},
            { label: 'Play Online' },
            { label: 'Help', onClick: () => this.changeMenu('Help')},
            { label: 'Settings' },
            { label: 'Visit Site', onClick: () => window.open('https://github.com/jbax1899/feudal')}
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
        this.graphics.fillStyle(this.colors.teal, 0.6); // Teal color with 60% opacity
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
                fontSize: '24px',
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
                buttonGraphic.fillStyle(this.colors.lightteal, 1); // Lighter teal color on hover
                buttonGraphic.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
            });

            buttonContainer.on('pointerout', () => {
                buttonGraphic.clear();
                buttonGraphic.fillStyle(this.colors.darkteal, 1); // Darker teal color when not hovered
                buttonGraphic.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
            });

            // Add click event listener
            if (button.onClick) {
                buttonContainer.on('pointerup', button.onClick);
            }

            // Add button to the container
            this.buttonsContainer.add(buttonContainer);
        });
    }

    showHelp() {
        // Define help box dimensions and padding
        const padding = 20;
        const boxWidth = 600;
        const boxHeight = 400;
    
        // Center position of the help box
        const x = this.scale.width / 2;
        const y = this.scale.height / 2;
    
        // Draw the semi-translucent teal rectangle
        this.graphics.fillStyle(0x008080, 0.6); // Teal color with 60% opacity
        this.graphics.fillRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, 20); // Rounded corners
    
        // Add help text
        const helpText = `Welcome to the game!\n\nHere are some instructions to help you get started:\n\n1. To move, use the arrow keys.\n2. To jump, press the spacebar.\n3. Have fun and enjoy the game!`;
        const helpTextObject = this.add.text(x, y, helpText, {
            fontSize: '24px',
            color: '#ffffff',
            align: 'left',
            fontFamily: 'Gipsiero OwtLine',
            wordWrap: { width: boxWidth - 2 * padding }
        }).setOrigin(0.5);
    
        // Store the text object to clear later if needed
        this.textObjects.push(helpTextObject);
    
        // Create a back button
        const buttonWidth = 150;
        const buttonHeight = 50;
        const buttonX = x;
        const buttonY = y + boxHeight / 2 - buttonHeight / 2 - 20; // Positioned below the help box
    
        // Add button background
        this.backButtonGraphic = this.add.graphics();
        this.backButtonGraphic.fillStyle(this.colors.teal, 1);
        this.backButtonGraphic.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
    
        // Add button text
        this.backButtonText = this.add.text(0, 0, 'Back', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Gipsiero OwtLine'
        }).setOrigin(0.5);
    
        // Create a container for the back button
        const backButtonContainer = this.add.container(buttonX, buttonY, [this.backButtonGraphic, this.backButtonText]);
        backButtonContainer.setSize(buttonWidth, buttonHeight); // Set size for interactive area
        backButtonContainer.setInteractive({ useHandCursor: true });
    
        // Add hover effects
        backButtonContainer.on('pointerover', () => {
            this.backButtonGraphic.clear();
            this.backButtonGraphic.fillStyle(this.colors.lightteal, 1); // Lighter color on hover
            this.backButtonGraphic.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        });
    
        backButtonContainer.on('pointerout', () => {
            this.backButtonGraphic.clear();
            this.backButtonGraphic.fillStyle(this.colors.darkteal, 1); // Darker color when not hovered
            this.backButtonGraphic.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        });
    
        // Add click event listener
        backButtonContainer.on('pointerup', () => {
            this.changeMenu('Main');
        });
    
        // Store the button to clear later if needed
        this.textObjects.push(backButtonContainer);
    }    
}

export default MainMenu;