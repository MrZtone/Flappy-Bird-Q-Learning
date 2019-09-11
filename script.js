debug=false;

const JUMP = 1, DO_NOTHING=0;
var numOfRuns = 0;
var score = 0;

var learningRate = 0.9;
var gamma = 0.8;
var actionTimeLimit = 0.2;
var actionTimer= actionTimeLimit;
var explorationProbability = 0.3;

var gravity = 1500;
var QsampleRateY = 10, QsampleRateX = 10;
var QXDimension = Math.floor(two.width/QsampleRateX);
var QYDimension = Math.floor((PipePair.YDistance+ 2*PipePair.maxPipeHeight)/QsampleRateY);

var bird = new Player(two);
var firstPipe = new PipePair(PipePair.XDistance, two);
var secondPipe = new PipePair(2*PipePair.XDistance, two);
var text = two.makeText(score, two.width*0.9, two.height*0.05, {size: "48px"});

Q = zeros([QXDimension, QYDimension, 2]);

lastRenderTime = null;
dt=0.0;
var QYIndex, QXIndex, action, reward;
var firstAction = true;

function resetGame() {
    bird = new Player(two)
    reward=0;
    dt=0;
    score =0;
    actionTimer=actionTimeLimit;
    firstAction =true;
    firstPipe.reset(two);
    firstPipe.setPosition(PipePair.XDistance);
    secondPipe.reset(two);
    secondPipe.setPosition(2*(PipePair.XDistance));
    two.remove(text);
    text = two.makeText(score, 0, 0, {size: "48px"});
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
        if (firstPipe.holePositionX < bird.posX-Player.radius) {
            if (!bird.dead)
                reward+=200;

            score++;
            text.value =score;
            [firstPipe, secondPipe] = [secondPipe, firstPipe];
        }

        if (actionTimer >= actionTimeLimit || bird.dead) {

            if(!bird.dead) {
                reward+=1;
            }

            var birdPosXRelativeToHole = firstPipe.holePositionX - bird.posX;
            var birdPosYRelativeToHole = bird.posY - firstPipe.holePositionY;

            var QXIndexNewState = Math.round(birdPosXRelativeToHole/QsampleRateX);
            QXIndexNewState = Math.min(QXDimension-1, Math.max(0, QXIndexNewState));
            var QYIndexNewState = Math.round((birdPosYRelativeToHole + (PipePair.YDistance/2 + PipePair.maxPipeHeight))/QsampleRateY);
            QYIndexNewState = Math.min(QYDimension-1, Math.max(0, QYIndexNewState));

            if(!firstAction) {
                Q[QXIndex][QYIndex][action] = Q[QXIndex][QYIndex][action] + learningRate * (reward + gamma * Math.max(Q[QXIndexNewState][QYIndexNewState][DO_NOTHING], Q[QXIndexNewState][QYIndexNewState][JUMP]) - Q[QXIndex][QYIndex][action]);
            }
            
            QYIndex = QYIndexNewState;
            QXIndex = QXIndexNewState;

            var actionValues = Q[QXIndex][QYIndex];

            if(Math.random() < explorationProbability || actionValues[JUMP] == actionValues[DO_NOTHING]) {
                action = Math.round(Math.random());
                if(action == JUMP) {
                    bird.jump();
                    actionTimer = 0;
                }
            }
            else {
                if(actionValues[JUMP] > actionValues[DO_NOTHING]) {
                    bird.jump();
                    action = JUMP;
                    actionTimer = 0;
                }
                else {
                    action = DO_NOTHING;
                }
            }
            reward =0;
            firstAction = false;
        }

        if(bird.dead) {
            two.clear();
            resetGame();
            numOfRuns++;
            if(numOfRuns%25 == 0)
                explorationProbability *= 0.9;

            return;
        }
        
        //update speed and position of objects
        bird.speedY-= gravity*dt;
        bird.posY = Math.max(0,bird.posY - bird.speedY*dt);
        firstPipe.move(dt);
        secondPipe.move(dt);

        //Check for collision
        if(firstPipe.checkCollision(bird) || secondPipe.checkCollision(bird) || bird.posY + Player.radius > two.height) {
            reward -=1000;
            bird.dead = true;
        }

        //reset pipe when it's 2 pixels outside of the screen. needed because obejcts can't be remove from scene.
        if(secondPipe.holePositionX + 4 < 0) {
            secondPipe.setPosition(secondPipe.posX + (2*(PipePair.XDistance) + PipePair.Width));
            secondPipe.initialize(two);
        }

        //draw objects
        firstPipe.pipe.translation.set(firstPipe.posX, 0);
        secondPipe.pipe.translation.set(secondPipe.posX, 0);
        bird.shape.translation.set(bird.posX,bird.posY)
        text.translation.set(two.width*0.9, two.height*0.05);
        }).play();
    }
  });