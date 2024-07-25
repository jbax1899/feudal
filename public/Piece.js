class Piece {
    static types = [
        'blank',
        'king',
        'blank',
        'blank',
        'blank',
        'blank',
        'blank',
        'blank',
        'blank',
        'blank'
    ];

    constructor(scene, type) {
        this.scene = scene;
        this.type = type !== undefined ? type : 0;
        this.key = 'piece_' + Piece.types[this.type];
    }

    create(x, y) {
        // Create the piece sprite and add it to the scene
        this.sprite = this.scene.add.sprite(x, y, this.key)
            .setOrigin(0)
            .setDisplaySize(this.scene.board.tileSize, this.scene.board.tileSize);
        return this.sprite;
    }
}

export default Piece;