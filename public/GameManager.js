class GameManager {
    playerColors = [
        { color: 'FF0000', name: 'red' },
        { color: '0000FF', name: 'blue' },
        { color: '00FF00', name: 'green' },
        { color: 'FFFF00', name: 'yellow' }
    ];

    constructor(scene, board, ui) {
        this.scene = scene;
        this.board = board;
        this.ui = ui;
    }

    update() {
        // Game logic update
    }
}

export default GameManager;