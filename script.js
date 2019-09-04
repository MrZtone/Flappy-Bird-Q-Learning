// Make an instance of two and place it on the page.
var elem = document.getElementById('draw-shapes');
var two = new Two({ width: 300, height: 500 }).appendTo(elem);

var pipeWidth =70;
var pipeXDistance = 300;
var pipeYDistance = 200;

var gravity = 1500;
var speedX = 100;
var speedY = 0;
var birdXpos= 100;
var hitboxRadius = 20;
var minPipeHeight = 100;
var maxPipeHeight = two.height - minPipeHeight - pipeYDistance;
class PipePair {
    constructor(posX) {
        this.initialize();
        this.posX=posX;
    }

    initialize() {
        this.height = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight); 
        this.pipeBottom = two.makeRectangle(pipeWidth/2, two.height - this.height/2, pipeWidth, this.height); 
        this.topPipeHeight = two.height -this.height - pipeYDistance;
        this.pipeTop = two.makeRectangle(pipeWidth/2, this.topPipeHeight/2, pipeWidth, this.topPipeHeight);
        this.pipeBottom.fill = this.pipeTop.fill = '#2CB01A';
        this.pipe = two.makeGroup(this.pipeBottom, this.pipeTop);
    }

    checkColision(birdYpos) {
        if(birdXpos + hitboxRadius > (this.posX) && birdXpos - hitboxRadius < (this.posX + pipeWidth)
        && (birdYpos + hitboxRadius > (two.height - this.height) || birdYPos - hitboxRadius < (this.topPipeHeight)))
            return true;
        else
            return false;
    }

    reset() {
        this.pipeBottom.remove();
        this.pipeTop.remove();
        two.remove(this.pipe);
        this.initialize();
    }
}

var bird = two.makeCircle(0, 0, hitboxRadius);
bird.fill = '#FF8000';
var birdYPos = 0;

var firstPipe = new PipePair(0);
var secondPipe = new PipePair(pipeXDistance);
bird.noStroke();

lastRenderTime = null;
dt=0.0;
dead = false;

document.addEventListener('keyup', (e) => {
    if (e.code == "ArrowUp") {
        lastRenderTime = Date.now();

        //Rendering loop
        two.bind('update', function(frameCount) {
        var now = Date.now();
        dt = (now - lastRenderTime)/1000.0;
        lastRenderTime=now;

        //update speed and position of objects
        speedY-= gravity*dt;
        birdYPos-=speedY*dt; 
        firstPipe.posX-=speedX*dt;
        secondPipe.posX-=speedX*dt;

        //Check for pipe collision
        if(firstPipe.checkColision(birdYPos) || secondPipe.checkColision(birdYPos)) {
            two.unbind('update', null);
        }

        //reset pipe when it's 2 pixels outside of the screen. needed because obejcts can't be remove from scene.
        if(firstPipe.posX + pipeWidth + 2 < 0) {
            firstPipe.posX+=two.width*2;
            firstPipe.initialize();
            [firstPipe, secondPipe] = [secondPipe, firstPipe];
        }

        //draw objects
        firstPipe.pipe.translation.set(firstPipe.posX, 0);
        secondPipe.pipe.translation.set(secondPipe.posX, 0);
        bird.translation.set(birdXpos,birdYPos)
        }).play();
    }
    if (e.code == "Space") {
        speedY= 500;
    }
  });