// Make an instance of two and place it on the page.
var elem = document.getElementById('draw-shapes');
var two = new Two({ width: 300, height: 500 }).appendTo(elem);
debug=false;

var learningRate = 0.3;
var gamma = 0.7;
var actionTimeLimit = 0.6;
var actionTimer= actionTimeLimit;
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
var pipeYDistance = 250;

var gravity = 1500;
var speedX = 100;
var speedY = 0;
var birdXpos= 100;
var hitboxRadius = 20;
var minPipeHeight = 100;
var maxPipeHeight = two.height - minPipeHeight - pipeYDistance;
var QsampleRateY = 5, QsampleRateX = 20;
var QXDimension = Math.floor(two.width/QsampleRateX);
var QYDimension = Math.floor((pipeYDistance+ 2*maxPipeHeight)/QsampleRateY);

Q = zeros([QXDimension, QYDimension, 2]);

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
var QYIndex, QXIndex, action, reward;
var firstAction = true;
var dead =false;

function resetGame() {
    birdYPos= two.height/2;
    bird = two.makeCircle(0, 0, hitboxRadius);
    bird.fill = '#FF8000';
    speedY=0;
    reward=0;
    dt=0;
    actionTimer=actionTimeLimit;
    firstAction =true;
    dead=false;
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
        if (firstPipe.posX + pipeWidth < birdXpos-hitboxRadius) {
            if (!dead)
                reward+=200;
            [firstPipe, secondPipe] = [secondPipe, firstPipe];
        }

        if (actionTimer >= actionTimeLimit || dead) {

            if(!dead) {
                reward+=1;
            }

            var holePositionY = firstPipe.topPipeHeight + pipeYDistance/2;
            var birdPosYRelativeToHole = birdYPos - holePositionY;
            var holePositionX = firstPipe.posX + pipeWidth/2;
            var birdPosXRelativeToHole = holePositionX - birdXpos;

            if(!firstAction) {
                var QYIndexNewState = Math.round((birdPosYRelativeToHole + (pipeYDistance/2 + maxPipeHeight))/QsampleRateY);
                QYIndexNewState = Math.min(QYDimension-1, Math.max(0, QYIndexNewState));
        
                var QXIndexNewState = Math.round(birdPosXRelativeToHole/QsampleRateX);
                QXIndexNewState = Math.min(QXDimension-1, Math.max(0, QXIndexNewState));

                if(debug) {
                    if(dead) {
                        var actionString = action == JUMP ? "jump" : "nothing";
                        console.log("death by " + actionString + " from: " + QXIndex + ", " + QYIndex, Q[QXIndex][QYIndex][action] + learningRate * (reward + gamma + Math.max(Q[QXIndexNewState][QYIndexNewState][DO_NOTHING], Q[QXIndexNewState][QYIndexNewState][JUMP]) - Q[QXIndex][QYIndex][action]));
                    }
                }

                Q[QXIndex][QYIndex][action] = Q[QXIndex][QYIndex][action] + learningRate * (reward + gamma + Math.max(Q[QXIndexNewState][QYIndexNewState][DO_NOTHING], Q[QXIndexNewState][QYIndexNewState][JUMP]) - Q[QXIndex][QYIndex][action]);
            }
            firstAction = false;
            
            QYIndex = Math.round((birdPosYRelativeToHole + (pipeYDistance/2 + maxPipeHeight))/QsampleRateY);
            QYIndex = Math.min(QYDimension-1, Math.max(0, QYIndex));

            QXIndex = Math.round(birdPosXRelativeToHole/QsampleRateX);
            QXIndex = Math.min(QXDimension-1, Math.max(0, QXIndex));

            var actionValues = Q[QXIndex][QYIndex];

            if(Math.random() < explorationProbability || actionValues[JUMP] == actionValues[DO_NOTHING]) {
                action = Math.round(Math.random());
                if(action == JUMP) {
                    speedY = 500;
                    actionTimer = 0;
                }
            }
            else {
                if(actionValues[JUMP] > actionValues[DO_NOTHING]) {
                    speedY=500;
                    action = JUMP;
                    actionTimer = 0;
                }
                else {
                    action = DO_NOTHING;
                }
            }
            reward =0;
        }

        if(dead) {
            two.clear();
            resetGame();
            return;
        }

        //update speed and position of objects
        speedY-= gravity*dt;
        birdYPos-=speedY*dt;
        birdYPos = Math.max(0,birdYPos); 
        firstPipe.posX-=speedX*dt;
        secondPipe.posX-=speedX*dt;

        //Check for collision
        if(firstPipe.checkColision(birdYPos) || secondPipe.checkColision(birdYPos)) {
            reward -=1000;
            dead = true;
        }
        else if(birdYPos > two.height) {
            reward -=200;
            dead=true;
        }

        //reset pipe when it's 2 pixels outside of the screen. needed because obejcts can't be remove from scene.
        if(secondPipe.posX + pipeWidth + 2 < 0) {
            secondPipe.posX+=two.width*2;
            secondPipe.initialize();
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