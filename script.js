// Make an instance of two and place it on the page.
var elem = document.getElementById('draw-shapes');
var two = new Two({ width: 300, height: 500 }).appendTo(elem);

var learningRate = 2.0;
var gamma = 0.85;
var actionTimeLimit = 0.2;
var actionTimer= 0;
var explorationProbability = 0.2;

const JUMP = 1, DO_NOTHING=0;

function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }

    return array;
}

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

Q = zeros([two.width, pipeYDistance+ 2*maxPipeHeight, 2]);

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
var birdYPos = two.height/2;

var firstPipe = new PipePair(0);
var secondPipe = new PipePair(pipeXDistance);
bird.noStroke();

lastRenderTime = null;
dt=0.0;
dead = false;

function resetGame() {
    birdYPos= two.height/2;
    bird = two.makeCircle(0, 0, hitboxRadius);
    bird.fill = '#FF8000';
    speedY=0;
    firstPipe.reset();
    firstPipe.posX=0;
    secondPipe.reset();
    secondPipe.posX=pipeXDistance;
    two.play();
}

document.addEventListener('keyup', (e) => {
    if (e.code == "ArrowUp") {
        lastRenderTime = Date.now();

        //Rendering loop
        two.bind('update', function(frameCount) {
        var now = Date.now();
        dt = (now - lastRenderTime)/1000.0;
        actionTimer +=dt;
        lastRenderTime=now;

        //The pipe has passed the player, change focus to next pipe
        if (firstPipe.posX + pipeWidth/2 < birdXpos) {
            [firstPipe, secondPipe] = [secondPipe, firstPipe];
        }

        //reset pipe when it's 2 pixels outside of the screen. needed because obejcts can't be remove from scene.
        if(secondPipe.posX + pipeWidth + 2 < 0) {
            secondPipe.posX+=two.width*2;
            secondPipe.initialize();
        }

        var holePositionY = firstPipe.topPipeHeight + pipeYDistance/2;
        var birdPosYRelativeToHole = birdYPos - holePositionY;
        var QYIndex = Math.floor(birdPosYRelativeToHole + (pipeYDistance/2 + maxPipeHeight));

        var holePositionX = firstPipe.posX + pipeWidth/2;
        var birdPosXRelativeToHole = holePositionX - birdXpos;
        var QXIndex = Math.floor(birdPosXRelativeToHole);

        var actionValues = Q[QXIndex][QYIndex];
        var action;

        if (actionTimer > actionTimeLimit) {
            if(Math.random() < explorationProbability) {
                action = Math.round(Math.random());
            }
            else {
                //1: jump, //0: do nothing
                if(actionValues[1] > actionValues[0]) {
                    speedY=500;
                    action = JUMP;
                }
                else {
                    action = DO_NOTHING;
                }
            }
        }

        //update speed and position of objects
        speedY-= gravity*dt;
        birdYPos-=speedY*dt;
        birdYPos = Math.max(0,birdYPos); 
        firstPipe.posX-=speedX*dt;
        secondPipe.posX-=speedX*dt;

        var reward = 1;
        var dead = false;

        //Check for pipe collision
        if(firstPipe.checkColision(birdYPos) || secondPipe.checkColision(birdYPos) || birdYPos > two.height) {
            reward =-1000;
            dead = true;
        }

        if (actionTimer > actionTimeLimit) {
            birdPosYRelativeToHole = birdYPos - holePositionY;
            var QYIndexNewState = Math.floor(birdPosYRelativeToHole + (pipeYDistance/2 + maxPipeHeight));
    
            holePositionX = firstPipe.posX + pipeWidth/2;
            birdPosXRelativeToHole = holePositionX - birdXpos;
            var QXIndexNewState = Math.floor(birdPosXRelativeToHole);
    
            actionValues[action] = actionValues[action] + learningRate * (reward + gamma + Math.max(Q[QXIndexNewState][QYIndexNewState] - actionValues[action]));

            actionTimer=0;
        }
        
        if(dead) {
            two.clear();
            resetGame();
            return;
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