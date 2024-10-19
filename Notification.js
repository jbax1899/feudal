class Notification {
    constructor(scene, text, color) {
        this.scene = scene;
        this.gameManager = this.scene.gameManager;

        this.camera = scene.cameras.main;
        this.container = this.scene.ui.notificationContainer;
        this.text = text;
        this.droptime = 750; // ms
        this.hovertime = 4000; // ms
        this.fadetime = 750; // ms
        this.width = this.camera.width * 0.8;
        this.height = 80;
        this.targetY = this.height;
        this.startY = -this.targetY * 2;

        // Create the container for the notification
        this.notificationContainer = scene.add.container(this.camera.centerX, this.startY);

        // If a color was supplied use that, otherwise use the current player's color
        if (color != undefined) {
            this.bgColor = color;
        } else {
            this.bgColor = scene.gameManager.playerColors[this.gameManager.mainPlayerNumber].color;
        }
        
        // Create the semi-transparent background rectangle
        this.background = scene.add.rectangle(0, 0, this.width, this.height, "0x" + this.bgColor, 0.9);
        this.background.setOrigin(0.5, 0.5); // Center the rectangle

        // Create the notification text
        this.textObject = scene.add.text(
            0, // Position will be set to center within the container
            0, 
            text,
            {
                fill: '#ffffff', // white text
                align: 'center',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5, 0.5);

        // Add background and text to the notification container
        this.notificationContainer.add(this.background);
        this.notificationContainer.add(this.textObject);
        this.container.add(this.notificationContainer);

        // Set position/size
        this.updatePos();

        // Start the notification animation
        this.animate();

        // Handle window resize events
        this.scene.scale.on('resize', (gameSize) => {
            this.updatePos();
        });
    }

    animate() {
        this.scene.tweens.add({
            targets: this.notificationContainer,
            y: this.targetY,
            duration: this.droptime,
            ease: 'Quint.easeOut',
            onComplete: () => {
                // Wait a bit, then fade out
                this.scene.time.addEvent({
                    delay: this.hovertime,
                    callback: () => {
                        this.scene.tweens.add({
                            targets: this.notificationContainer,
                            alpha: 0, // Fade out
                            duration: this.fadetime,
                            ease: 'Linear',
                            onComplete: () => {
                                this.destroy();
                            }
                        });
                    },
                    callbackScope: this,
                    loop: false
                });
            }
        });
    }

    update() {
        const notifications = this.scene.ui.notifications;
        const index = notifications.indexOf(this);
    
        // Check if this is not the bottom-most notification
        if (index < notifications.length - 1) {
            // Start with the notification directly above
            let aboveNotification = notifications[index + 1];

            // Check for overlap with the notification above
            while (this.isOverlapping(aboveNotification)) {
                // Only move down if the notification above is actually above this one
                if (notifications.indexOf(aboveNotification) > index) {
                    this.notificationContainer.y++;
                } else {
                    break; // Break the loop if the above notification is below this one
                }
            }
        }
    }

    isOverlapping(notification) {
        // Get the bounds of both notification containers
        const boundsA = this.notificationContainer.getBounds();
        const boundsB = notification.notificationContainer.getBounds();

        // Check for overlap using the bounds
        return (
            boundsA.y < boundsB.y + boundsB.height &&
            boundsA.y + boundsA.height > boundsB.y
        );
    }

    updatePos() {
        const camera = this.scene.cameras.main;

        // Update the x-position
        this.notificationContainer.x = camera.centerX;

        // Update word wrap width based on camera's width
        this.textObject.setStyle({
            fontSize: (this.height * 0.4).toString() + "px",
            wordWrap: { width: camera.width * 0.8 }
        });

        // Update the background width
        this.background.width = camera.width * 0.8;

        // Update bounds of the container
        this.bounds = this.notificationContainer.getBounds();
    }

    destroy() {
        const notifications = this.scene.ui.notifications;
        const index = notifications.indexOf(this);
        if (index !== -1) { notifications.splice(index, 1); } // Remove from the notification array
        this.notificationContainer.destroy();
    }
}

export default Notification;