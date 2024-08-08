import Player from './Player.js';

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
        this.players = [new Player(this.scene, 1), 
                        new Player(this.scene, 2),
                        new Player(this.scene, 3),
                        new Player(this.scene, 4),
                        new Player(this.scene, 5),
                        new Player(this.scene, 6)];
    }

    create() {

    }

    update() {
        // Game logic update
    }
}

export default GameManager;