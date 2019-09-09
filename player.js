class Player {
    constructor(two){
        this.shape = two.makeCircle(0,0,Player.radius);
        this.posX = Player.posX;
        this.posY = two.height/2;

        this.shape.fill = Player.color;
        this.shape.noStroke();

        this.speedY = 0;
        this.dead = false;
    }

    jump(){
        this.speedY = 500;
    }
}

Player.radius = 20;
Player.color = '#FF8000';
Player.posX=100;