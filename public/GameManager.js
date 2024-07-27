class GameManager {
    playerColors = [
        { color: 'D4F8F4', name: 'lightblue' },
        { color: '459E9C', name: 'blue' },
        { color: '194B52', name: 'teal' },
        { color: 'E1CEA4', name: 'lightbrown' },
        { color: 'A06B41', name: 'brown' },
        { color: '42281B', name: 'darkbrown' }
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