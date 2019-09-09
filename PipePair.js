class PipePair {
    constructor(posX, two) {
        this.posX=posX;
        this.initialize(two);
    }

    initialize(two) {
        this.height = Math.floor(Math.random() * (PipePair.maxPipeHeight - PipePair.minPipeHeight) + PipePair.minPipeHeight); 
        this.pipeBottom = two.makeRectangle(PipePair.Width/2, two.height - this.height/2, PipePair.Width, this.height); 
        this.topPipeHeight = two.height -this.height - PipePair.YDistance;
        this.pipeTop = two.makeRectangle(PipePair.Width/2, this.topPipeHeight/2, PipePair.Width, this.topPipeHeight);
        this.pipeBottom.fill = this.pipeTop.fill = PipePair.color;
        this.pipe = two.makeGroup(this.pipeBottom, this.pipeTop);
        this.holePositionY = this.topPipeHeight + PipePair.YDistance;
        this.holePositionX = this.posX + PipePair.Width;
    }

    checkColision(bird) {
        if(bird.posX + Player.radius > (this.posX) && bird.posX - Player.radius < (this.posX + PipePair.Width)
        && (bird.posY + Player.radius > (two.height - this.height) || bird.posY - Player.radius < (this.topPipeHeight)))
            return true;
        else
            return false;
    }

    reset() {
        this.pipeBottom.remove();
        this.pipeTop.remove();
        two.remove(this.pipe);
        this.initialize(two);
    }
}

PipePair.Width =70;
PipePair.XDistance = 300;
PipePair.YDistance = 150;
PipePair.minPipeHeight = 100;
PipePair.maxPipeHeight = two.height - PipePair.minPipeHeight - PipePair.YDistance;
PipePair.color = '#2CB01A';
PipePair.speedX = 100;