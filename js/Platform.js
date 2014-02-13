/**
* Nano platform prototype
* @author LoTh / http://3dflashlo.wordpress.com/
* @author base 2d version PurpleFloyd 
*/

var PLATFORM = { REVISION: '0.1' };

PLATFORM.ToRad = Math.PI / 180;
PLATFORM.FACTOR = 0.3;
PLATFORM.ZONE_X = 2000;
PLATFORM.ZONE_Y = 1000;
PLATFORM.ZONE_MID_X = 2000;
PLATFORM.ZONE_MID_Y = 1000;

PLATFORM.Gravity = 0;

//-----------------------------------------------------
//  GAME PROTOTYPE
//-----------------------------------------------------

PLATFORM.Game = function( scene, sceneback, showInfo, showScore ){
	this.stat = new PLATFORM.Stat( showInfo , showScore );

    this.scene = scene;
    this.sceneback = sceneback;

    this.level = null;

    this.hero = new PLATFORM.Hero();
    this.map = new PLATFORM.Map();
    this.enemy = new PLATFORM.Enemy();
    /*
    this.bulletEnemy = new PLATFORM.EnemyBullet();*/

    this.enemyInterval = 0;
    this.bossInterval = 30;
    this.powerupInterval = 10;

    this.enemyTimer = null;
    this.updateTimer = null;

    this.time = 0;

    this.onMouseDown = false;
    this.isMouseMove = false;
    this.isStartGame = false;
    this.banking=0;

    this.zoneGeo = new THREE.PlaneGeometry( 1, 1 );
    this.zoneMat = new THREE.MeshBasicMaterial( { color: 0x101316, side: THREE.BackSide } );
    this.oldy =0;
    this.zone = null;

    this.mouse = [0,0];

    this.enemyRun = false;
}

PLATFORM.Game.prototype = {
    constructor: PLATFORM.Game,

    init:function(){

        this.zone = new THREE.Mesh(this.zoneGeo, this.zoneMat);
        sceneback.add(this.zone);

        this.level = new THREE.Object3D();
        scene.add(this.level);
        this.level.rotation.z = 180*PLATFORM.ToRad;

        this.hero.parent = this;
        this.hero.init();

        this.enemy.parent = this;
        this.enemy.init();

        this.map.parent = this;
        this.map.init();
        this.map.load();

        

        /*this.enemy.parent = this;
        this.enemy.init();

        this.bulletEnemy.parent = this;
        this.bulletEnemy.init();*/

    },
    initLevel:function(){
        this.isStartGame = true;
    },
    mousePos:function( x, y ){
        this.mouse[0] = -x / PLATFORM.FACTOR;
        this.mouse[1] = - y / PLATFORM.FACTOR;
        //this.isMouseMove =true;

        //console.log(this.mouse[1], this.hero.position.y)

        
    },
    resize:function( x, y, f ){
        PLATFORM.FACTOR = f;
        PLATFORM.ZONE_X =  Math.round((x / PLATFORM.FACTOR)-(40/ PLATFORM.FACTOR));
        PLATFORM.ZONE_Y =  Math.round((y / PLATFORM.FACTOR)-(40/ PLATFORM.FACTOR));
        PLATFORM.ZONE_MID_X = Math.round(PLATFORM.ZONE_X * 0.5);
        PLATFORM.ZONE_MID_Y =  Math.round(PLATFORM.ZONE_Y * 0.5);
        this.zone.scale.x = (PLATFORM.ZONE_X)+(40/ SHOOTER.FACTOR);
        this.zone.scale.y = (PLATFORM.ZONE_Y)+(40/ SHOOTER.FACTOR);
    },
    update:function(){

        if(this.enemyRun) this.enemy.update();
        this.hero.update();

        if(this.onMouseDown){
            if(this.mouse[0]< 0 ){this.hero.moveLeft=true; this.hero.moveRight=false;}
            if(this.mouse[0]> 0 ){this.hero.moveRight=true; this.hero.moveLeft=false;}
            if(this.mouse[1]<this.hero.position.y - (PLATFORM.SIZE) ){ this.hero.jump=true; }
        }else{
            this.hero.moveRight=false;
            this.hero.moveLeft=false;
            this.hero.jump=false;
        }

        var i = this.map.coins.length;
        while(i--){
            this.map.coins[i].rotation.z += 2*PLATFORM.ToRad;
            if(PLATFORM.HitTest(this.map.coins[i], this.hero, 64)) this.map.removeCoin(i);

        }


        
        /*this.banking = this.ship.position.y - this.oldy;
        this.ship.rotation.x = this.banking * PLATFORM.ToRad;
        

        if(this.onMouseDown)this.bullet.shoot();
        this.bullet.update();

        if(this.isStartGame){
            this.enemyInterval++;
            if(this.enemyInterval === 60){
                this.enemyInterval = 0;
                this.enemy.add();
            }
            
            this.enemy.update();
            this.bulletEnemy.update();
        }

        this.oldy = this.ship.position.y;*/
    }

}

//-----------------------------------------------------
//  GAME STAT
//-----------------------------------------------------

PLATFORM.Stat = function( showInfo, showScore ){
	this.score = "";
    this.infos = "";
	this.point = 0;
	this.heroHealth = 0;
    this.life = 0;
	this.kills = 0;
	this.hits = 0;
	this.points = 0;
	this.misses = 0;
	this.shots = 0;
	this.gameComplete = 0;
    this.showInfo = showInfo;
    this.showScore = showScore;
}

PLATFORM.Stat.prototype = {
    constructor: PLATFORM.Stat,
    setStat:function( name, value ){
    	this[name] = value;
        this.update();
    },
    updateStat:function( name, value ){
        this[name] += value;
        this.update();
    },
    update:function(){
    	this.score = [
    	    "SCORE " + this.points + " ",
		    "HEALTH " + this.heroHealth + " ",
            "LIFE " + this.life
		].join("\n");
        this.infos = [
            "Kill " + this.kills + "<br>",
            "Shoot " + this.shots + "<br>",
            "Hit " + this.hits + "<br>",
            "Misse " + this.misses + "<br>"
        ].join("\n");
        this.showScore(this.score)
        this.showInfo(this.infos);
    }
}

//-----------------------------------------------------
//  PLAYER HERO
//-----------------------------------------------------

PLATFORM.Hero = function(){
    this.parent = null;
    this.maxHealth = 100;
    this.life = 3;
    this.health = 0;
    this.position = new THREE.Vector3( 0, 0, 0 );
    this.rotation = null;
    this.geo = null;
    this.mat = null;
    this.mesh = null;
    this.inDamage = false;

    this.start = new THREE.Vector3( 0, 0, 0 );
    this.force = new THREE.Vector3( 0, 0, 0 );
    this.scroll = new THREE.Vector3( 0, 0, 0 );
    this.direction = 1;

    this.maxSpeed = 9;

    this.moveLeft = false;
    this.moveRight = false;
    this.jump = false;

    this.jumpHold = 0;
    this.allowJump = 0;

}

PLATFORM.Hero.prototype = {
    constructor: PLATFORM.Hero,

    init:function(){
        this.health = this.maxHealth;
        this.parent.stat.setStat("heroHealth", this.health);
        this.parent.stat.setStat("life", this.life);
        this.geo = new THREE.CubeGeometry(60,120,60);
        this.mat = new THREE.MeshBasicMaterial( { color: 0xFF8000 } );

        this.mesh = new THREE.Mesh( this.geo, this.mat );
        this.parent.level.add(this.mesh);
        this.mesh.position.y = PLATFORM.ZONE_Y;
        this.position = this.mesh.position;
        this.rotation = this.mesh.rotation;
    },
    update:function(){
        if(this.inDamage){ this.inDamage= false; this.mat.color.setHex(0xFF8000); }

        this.allowJump = 0;
        var block = PLATFORM.SIZE; 
        var map =  this.parent.map.map;
        var mapWidth =  this.parent.map.mapWidth;

        var PLeft = Math.floor((this.position.x + 1) / block);
        var PTop = Math.floor(this.position.y / block);
        var PWidth = Math.floor((this.position.x - 1) / block) + 1;
        var PHeight = Math.floor(this.position.y / block) + 1;

        // Jumping
        if (this.jump && this.jumpHold == 0 && this.position.y > 0 && map[PLeft][PHeight] > 7 || this.jump && this.jumpHold == 0 && map[PWidth][PHeight] > 7 && this.position.y > 0 || this.allowJump == 1 && this.jump && this.jumpHold == 0)
            this.jumpHold = 1;
        if (this.jump && this.jumpHold > 0 && this.jumpHold < 5){
            this.force.y -= 6*4;
            this.jumpHold++;
        }
        if (!this.jump || this.jumpHold >= 5) this.jumpHold = 0;

        // Jump force
        if(this.force.y < -18*4) this.force.y = -18*4;
        if(this.force.y > 30*4) this.force.y = 30*4;
        // Moves left/right
        if(this.moveLeft){
            this.force.x--;
            this.direction = -1;
        }
        if(this.moveRight){
            this.force.x++;
            this.direction = 1;
        }
        // SLow
        if(!this.moveLeft && !this.moveRight){
            if(this.force.x > 0) this.force.x-=0.5;
            if(this.force.x < 0) this.force.x+=0.5
        }
        // Gravity
        this.force.y = this.force.y + 2 + PLATFORM.Gravity;
        // Limite Speed
        if(this.force.x > this.maxSpeed ) this.force.x = this.maxSpeed;
        if(this.force.x < -this.maxSpeed ) this.force.x = -this.maxSpeed;
        // move player Y
        this.position.y += this.force.y;

        this.parent.level.position.x = this.position.x;

        var PLeft = Math.floor((this.position.x + 1) / block);
        var PTop = Math.floor((this.position.y) / block);
        var PWidth = Math.floor((this.position.x - 1) / block) + 1;
        var PHeight = Math.floor((this.position.y) / block) + 1;

        if (PHeight >= 0 && this.position.y < PLATFORM.ZONE_Y) {
            // Y-Collision Detection
            if (map[PLeft][PTop] > 7 || map[PWidth][PTop] > 7) {
                this.position.y = (PTop + 1) * block;
                this.force.y = 0;
            }
            if (map[PLeft][PHeight] > 7 || map[PWidth][PHeight] > 7) {
                this.position.y = (PHeight - 1) * block;
                this.force.y = 0;
            }
        }

        // Move the player left/right
        this.position.x += this.force.x;
        if (this.position.x < 0) {
            this.position.x=0;
            this.force.x = 100;
        }
        if (this.position.x + block > mapWidth * block) {
            this.position.x = (mapWidth * block) - block;
            this.force.x = -100;
        }

        if (this.position.y > 0 && this.position.y < PLATFORM.ZONE_Y) {
            PLeft = Math.floor((this.position.x + 1) / block);
            PTop = Math.floor((this.position.y) / block);
            PWidth = Math.floor((this.position.x - 1) / block) + 1;
            PHeight = Math.floor((this.position.y) / block) + 1;

            // X-Collision Detection
            if (map[PLeft][Math.floor((this.position.y + 1) / block)] > 7) {
                this.position.x = (PLeft + 1) * block + 1;
                this.force.x = 0;
            }
            if (map[PWidth][Math.floor((this.position.y + 1) / block)] > 7) {
                this.position.x = (PLeft) * block - 2;
                this.force.x = 0;
            }

            // If the Player walks into an Exit
            /*var doEndLevel = 0;
            if (map[PLeft][Math.floor((py + 1) / 32)] == 2)
                doEndLevel = 3;
            if (map[PWidth][Math.floor((py + 1) / 32)] == 2)
                doEndLevel = 3;
            if (map[PLeft][Math.floor((py + 1) / 32)] == 4)
                doEndLevel = 5;
            if (map[PWidth][Math.floor((py + 1) / 32)] == 4)
                doEndLevel = 5;
            if (doEndLevel > 0)
            {
                specialGametickFunction = endLevelGametick;
                endLevelData = doEndLevel;
            }

            // If the Player walks into the Rocket Ship
            if ((map[PLeft][Math.floor((py + 1) / 32)] == 3 && (PLeft == ExitX || PWidth == ExitX)) ||
                (map[PWidth][Math.floor((py + 1) / 32)] == 3 && (PLeft == ExitX || PWidth == ExitX)))
            {
                endLevelData = 0;
                specialGametickFunction = rocketEndGametick;
            }*/
        }

        


    },
    takeDamage:function(n){
        this.health -= n;
        if( this.health <= 0 ){
            this.health = 0;
            this.kill();
        } else {
            this.mat.color.setHex(0xffffff);
            this.inDamage = true; 
            // smallExplosion
        }
        this.parent.stat.setStat("heroHealth", this.health);
    },
    kill:function(){
        this.life--;
        this.health = this.maxHealth;
        this.parent.stat.setStat("life", this.life);
        this.parent.stat.setStat("heroHealth", this.health);
    }
}
/*
//-----------------------------------------------------
//  PLAYER BULLET
//-----------------------------------------------------

PLATFORM.Bullet = function(){
    this.parent = null;
    this.bullets = null;
    this.speed = 60;
    this.hitZone = 50;
    this.geo = null;
    this.mat = null;
}

PLATFORM.Bullet.prototype = {
    constructor: PLATFORM.Bullet,

    init:function(){
        this.bullets = [];
        this.geo = new THREE.CubeGeometry(10,10,30);
        this.mat = new THREE.MeshBasicMaterial( { color: 0xFFFFFF } );
    },
    shoot:function(){
        var b =  new THREE.Mesh( this.geo, this.mat );
        var pos = this.parent.ship.position.clone();
        b.position.copy(pos.add(new THREE.Vector3(-60, 0, 0)));
        this.parent.scene.add(b);
        this.bullets[this.bullets.length] = b;
        this.parent.stat.updateStat("shots", 1);
    },
    update:function(){
        var b, e, j;
        var i = this.bullets.length;
        
        while(i--){
            b = this.bullets[i]
            b.position.x -= this.speed;
            j = this.parent.enemy.enemys.length;
            while(j--){
                e = this.parent.enemy.enemys[j];
                if (PLATFORM.HitTest( b , e, this.hitZone)) {
                    this.parent.enemy.takeDamage(j, 1);
                    this.kill(i);
                    return;
                }
            }
            if (b.position.x < -PLATFORM.ZONE_MID_X ) {
                this.kill(i);
                this.parent.stat.updateStat("misses", 1);
            }
        }
    },
    kill:function(n){
        this.parent.scene.remove(this.bullets[n]);
        this.bullets.splice(n, 1);
    }
}
*/
//-----------------------------------------------------
//  ENEMY
//-----------------------------------------------------

PLATFORM.Enemy = function(){
    this.parent = null;
    this.geo = null;
    this.mat = null;

    this.mat0 = null;
    this.mat1 = null;

    /*
    this.enemysHealth = null;
    this.enemysSpeed = null;
    this.enemysWobble = null;
    this.enemysShootCount = null;*/

    this.enemys = null;
    this.position = null;
    this.force = null;
    this.nEnemy = 0;

    this.EnemyGroups = 0;
    this.GroupCount = 0;

    this.eGroup = null;
    this.eGroupBelong = null;

    this.type = null;
    this.pos = null;

    this.dead = null;
    this.yforce= null;
    this.awake = null;

    this.shootEvery = 50;
}

PLATFORM.Enemy.prototype = {
    constructor: PLATFORM.Enemy,

    init:function(){
        this.geo = new THREE.CubeGeometry(100,128,100);
        this.mat = new THREE.MeshBasicMaterial( { color: 0x00FF00 } );
        this.mat0 = new THREE.MeshBasicMaterial( { color: 0x00FFCC } );
        this.mat1 = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );

        this.move = [4,8,0,0,0];

        this.eGroup = new Array(20);
        var i = this.eGroup.length;
        while(i--) this.eGroup[i] = new Array(10);

        this.eGroupBelong = [];


        this.type = [];
        this.pos = [];
        this.dead = [];
        this.yforce= [];
        this.awake = [];

        this.enemys = [];
        this.position = [];//new Array(100);
        this.force =[];// new Array(100);

        /*this.enemys = [];
        this.enemysHealth = [];
        this.enemysSpeed = [];
        this.enemysWobble = [];
        this.enemysShootCount = [];*/
    },
    populate:function(){
        //var i = this.nEnemy;
        //while( i-- ){
        for (var i=0; i< this.nEnemy; i++){
            
            switch (this.type[i]){
                case 0: case 1:
                this.position[i] = new THREE.Vector3( this.pos[i][0]*PLATFORM.SIZE, this.pos[i][1]*PLATFORM.SIZE, 0 );
                this.force[i] = new THREE.Vector3( ); 
                this.addEnemy( i , "mat"+this.type[i]);

                break; 

            }


        }

    },
    addEnemy:function(n, type){
        var m = new THREE.Mesh( this.geo, this[type] );
        this.parent.level.add(m);
        //.set(x*PLATFORM.SIZE, y*PLATFORM.SIZE, 0);
        //var n = this.enemys.length
        m.position =  this.position[n] ;
        this.enemys[n] = m;
       // this.position[n] = m.position;
        //this.force[n] = new THREE.Vector3( );
    },
    add:function(){
        /*var b =  new THREE.Mesh( this.geo, this.mat );
        b.position.copy(new THREE.Vector3(-PLATFORM.ZONE_MID_X, -PLATFORM.ZONE_MID_Y+ (Math.random() * PLATFORM.ZONE_Y), 0));
        this.parent.scene.add(b);
        var n = this.enemys.length;
        this.enemys[n] = b;
        this.enemysHealth[n] = 3;
        this.enemysShootCount[n] = 0;
        this.enemysSpeed[n] = Math.floor(Math.random() * 20 + 10);
        var wob = Math.floor((Math.random() * 20));
        if (wob < 10) this.enemysWobble[n] = wob;
        else this.enemysWobble[n] = 0;*/
    },
    update:function(){
        var block = PLATFORM.SIZE; 
        var map =  this.parent.map.map;
        var mapWidth =  this.parent.map.mapWidth;
        var positionHero = this.parent.hero.position; 
        var mapWidth =  this.parent.map.mapWidth;

        var i = this.nEnemy;
        while( i-- ){
            //this.enemys[i].position.x ++;

            

            switch (this.type[i]){
                case 0: case 1: 
                //if(i===1)console.log(this.position[i].x/block, mapWidth, positionLevel.x, PLATFORM.ZONE_MID_X);
                    if (this.awake[i] || (this.position[i].x > positionHero.x - PLATFORM.ZONE_MID_X  && this.position[i].x < positionHero.x + PLATFORM.ZONE_MID_X )){
                        this.awake[i] = 1;
                        this.force[i].y += 2 + PLATFORM.Gravity;
                        this.position[i].y += this.force[i].y;



                        if (positionHero.x < this.position[i].x) this.position[i].x -= this.move[this.type[i]];
                        else this.position[i].x += this.move[this.type[i]];
                        //if( !this.position[i]) return;
                        var ELeft = Math.floor(this.position[i].x / block);
                        var ETop = Math.floor(this.position[i].y / block);
                        // X-Collision Detection
                        if (map[ELeft + 1][ETop] > 7) this.position[i].x = ELeft * block;
                        if (map[ELeft][ETop] > 7) this.position[i].x = (ELeft + 1) * block;
                        // Y-Collision Detection
                        if (map[ELeft][ETop + 1] > 7 || map[ELeft + 1][ETop + 1] > 7) {
                            this.position[i].y = ETop * block;
                            this.force[i].y = 0;
                        }
                        if (map[ELeft][ETop] > 7) {
                            this.position[i].y = ETop * block;
                            this.force[i].y = 0;
                        }
                    }
                break; 
            }

        }
        /*var e;
        var i = this.enemys.length;
        while(i--){
            e = this.enemys[i];
            // increment shoot and shoot if maximum reach
            e.position.x += this.enemysSpeed[i];
            this.enemysShootCount[i] ++;
            if (this.enemysShootCount[i] === this.shootEvery) {
                this.parent.bulletEnemy.shoot(e, this.enemysSpeed[i]);
                this.enemysShootCount[i] = 0;
            }
            // move up and down
            if (this.enemysWobble[i] != 0) {
                if (this.enemysWobble[i] > 0 && e.position.y > PLATFORM.ZONE_MID_Y) this.enemysWobble[i] *= -1;
                else if (this.enemysWobble[i] < 0 && e.position.y < -PLATFORM.ZONE_MID_Y) this.enemysWobble[i] *= -1;
                e.position.y += this.enemysWobble[i];
                e.rotation.x += (this.enemysWobble[i] / 10)*PLATFORM.ToRad;
            }
            // kill enemy if out of screen
            if (e.position.x > PLATFORM.ZONE_MID_X) {
                this.kill(i);
            }
            // kill enemy if health to 0
            if (this.enemysHealth[i] == 0) {
                this.parent.stat.updateStat("kills", 1);
                this.parent.stat.updateStat("points", 100);
                this.kill(i);
            }
        }
     */
    },
    takeDamage:function( n, d ){
       // this.enemysHealth[n] -= d;
       // this.parent.stat.updateStat("hits", 1);
    },
    kill:function(n){
       /* this.parent.scene.remove(this.enemys[n]);
        this.enemys.splice(n, 1);
        this.enemysHealth.splice(n, 1);
        this.enemysSpeed.splice(n, 1);
        this.enemysWobble.splice(n, 1);
        this.enemysShootCount.splice(n, 1);*/
    }
}

//-----------------------------------------------------
//  ENEMY BULLET
//-----------------------------------------------------

PLATFORM.EnemyBullet = function( ){
    this.parent = parent;
    this.bullets = null;
    this.bulletsSpeed = null;
    this.speed = 30;
    this.hitZone = 50;
    this.geo = null;
    this.mat = null;
}
PLATFORM.EnemyBullet.prototype = {
    constructor: PLATFORM.EnemyBullet,

    init:function(){
        this.geo = new THREE.CubeGeometry(10,10,30);
        this.mat = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );
        this.bullets = [];
        this.bulletsSpeed = [];
    },
    shoot:function( e, eSpeed ){
        var b =  new THREE.Mesh( this.geo, this.mat );
        var pos = e.position.clone();
        b.position.copy(pos.add(new THREE.Vector3(50, 0, 0)));
        this.parent.scene.add(b);
        var n = this.bullets.length
        this.bullets[n] = b;
        this.bulletsSpeed[n] = this.speed+eSpeed;
    },
    update:function(){
        var b, e;
        var i = this.bullets.length;
        var hit;

        while(i--){
            b = this.bullets[i]
            b.position.x += this.bulletsSpeed[i];
           // if this bullet is hitting the player ship

           if (PLATFORM.HitTest( b , this.parent.ship, this.hitZone)) {
                // add damage to player ship
                this.parent.hero.takeDamage(10);
                // destroy bullet
                this.kill(i);
                return;
            }
            // destroy bullet if out of screen
            if (b.position.x > SHOOTER.ZONE_MID_X) {
                this.kill(i);
            }
        }
    },
    kill:function(n){
        this.parent.scene.remove(this.bullets[n]);
        this.bullets.splice(n, 1);
        this.bulletsSpeed.splice(n, 1);
    }

}

//-----------------------------------------------------
//  DISTANCE TEST
//-----------------------------------------------------

PLATFORM.HitTest = function( p1, p2, zone ){
    var x = p2.position.x-p1.position.x;
    var y = p2.position.y-p1.position.y;
    if( Math.sqrt(x*x + y*y) < zone) return true;
    else return false;
}

/*SHOOTER.Distance2d = function(p1, p2){
    var xd = p2.position.x-p1.position.x;
    var yd = p2.position.y-p1.position.y;
    return Math.sqrt(xd*xd + yd*yd);
}

SHOOTER.Distance3d = function(p1, p2){
    var xd = p2.position.x-p1.position.x;
    var yd = p2.position.y-p1.position.y;
    var zd = p2.position.z-p1.position.z;
    return Math.sqrt(xd*xd + yd*yd + zd*zd);
}*/


//-----------------------------------------------------
//  MAP
//-----------------------------------------------------
PLATFORM.Map = function(){
    this.parent = null;

    this.map = null;
    this.LookUp32 = null;

    this.mapWidth = 173;
    this.mapHeight = 10;

    this.currentMap = null;
    //this.coinCount = 0;
    this.exit = [];
    this.lastType = null;

    
    //coin
    this.coins = null;

    

    this.eGroup = null;
    this.eGroupBelong = [];

    this.blockgeo = new THREE.CubeGeometry(PLATFORM.SIZE,PLATFORM.SIZE,PLATFORM.SIZE*2);
    this.coingeo = new THREE.CylinderGeometry( PLATFORM.SIZE*0.5, PLATFORM.SIZE*0.5, PLATFORM.SIZE*0.1 );

    this.green = new THREE.MeshBasicMaterial( { color: 0x338833 } );
    this.red = new THREE.MeshBasicMaterial( { color: 0x883333 } );
    this.gray = new THREE.MeshBasicMaterial( { color: 0x888888 } );
    this.blue = new THREE.MeshBasicMaterial( { color: 0x333388 } );
    this.yellow = new THREE.MeshBasicMaterial( { color: 0xFFEE33 } );

}

PLATFORM.Map.prototype = {
    constructor: PLATFORM.Map,

    init:function(){
        this.LookUp32 = new Array(512);
        this.map = new Array(512);
        var i = this.map.length;
        while(i--){
            this.map[i] = new Array(16);
        }
        this.eGroup = new Array(20);
        i = this.eGroup.length;
        while(i--){
            this.eGroup[i] = new Array(10);
        }
        this.coins = [];
    },
    load:function(){
        var tile;
        var px, py, sx, sy, rx, ry;
        var nEnemy = 0;

        this.currentMap = PLATFORM.mapFile;
        console.log( this.currentMap.length , this.currentMap.length/10)
        for (var y = 0; y < this.mapHeight; y++){
            for (var x = 0; x < this.mapWidth; x++){
                tile = this.currentMap.charCodeAt(y * this.mapWidth + x);
                // standard blocks and coins
                this.map[x][y] = -1;
                if (tile >= 65 && tile <= 108){ // A -> l
                    this.map[x][y] = tile - 65;
                    if (this.map[x][y] > 26) // lower-case letters
                        this.map[x][y] -= 6;
                   // if (tile == 65) this.coinCount = this.coinCount + 1; // A
                    if (tile == 67 || tile == 68 || tile == 69){ // C D E;
                        this.exit = [x, y];
                    }
                }
                // don't know what these are!!
                else if (tile >= 109 && tile <= 111) this.map[x][y] = tile - 112;
                else{
                    // player start
                    if (tile == 49){
                        this.map[x][y] = -1;

                        px = x * PLATFORM.SIZE//32;
                        py = y * PLATFORM.SIZE//32;
                        sx = -px - 68 + PLATFORM.ZONE_X / 2;
                        sy = -py - 68 + PLATFORM.ZONE_Y / 4;
                        if (sx > 0) sx = 0;
                        if (sy > 0) sy = 0;

                        this.parent.hero.position.x = px;
                        this.parent.hero.position.y = py;
                        this.parent.hero.scroll.x = sx;
                        this.parent.hero.scroll.y = sy;
                    }

                    // enemies and platforms
                    if (tile >= 53 && tile <= 57){
                        this.map[x][y] = -1;
                        nEnemy++;
                        this.parent.enemy.pos[nEnemy] = [ x, y ];
                        this.parent.enemy.type[nEnemy] = tile - 53;
                        this.parent.enemy.dead[nEnemy] = 0;
                        this.parent.enemy.yforce[nEnemy] = 0;
                        this.parent.enemy.awake[nEnemy] = 0;

                        if (tile == 56) this.map[x][y] = 5;  // lift
                        // falling platform
                        if (this.parent.enemy.type[nEnemy] == 2){
                            if (!this.lastType == 55){
                                this.parent.enemy.EnemyGroups++;
                                this.parent.enemy.GroupCount = 0;
                            }
                            this.parent.enemy.GroupCount++;
                            this.parent.enemy.eGroup[this.parent.enemy.EnemyGroups][this.parent.enemy.GroupCount] = nEnemy;
                            this.parent.enemy.eGroupBelong[nEnemy] = this.parent.enemy.EnemyGroups;
                        }
                    }
                    this.parent.enemy.nEnemy = nEnemy;

                    this.lastType = tile;
                }

            }
        }



        console.log( nEnemy );


        this.construct();
        this.parent.enemy.populate();

        this.parent.enemyRun = true;


    },
    construct:function(){
         for (var x = 0; x < this.map.length; x++){
            for (var y = 0; y < this.map[x].length; y++){
                if(this.map[x][y] === 0) this.addCoin(x, y, "yellow");// I

                if(this.map[x][y] === 8) this.addBlock(x, y, "red");// I
                if(this.map[x][y] === 9) this.addBlock(x, y, "green");// J
                if(this.map[x][y] === 10) this.addBlock(x, y, "gray"); // K
                if(this.map[x][y] === 11) this.addBlock(x, y, "blue"); // L

            }
        }

        //
        this.parent.level.position.x = this.parent.hero.position.x;     
    }, 
    addBlock:function(x, y, type){
        var m = new THREE.Mesh( this.blockgeo, this[type] );
        this.parent.level.add(m);
        m.position.set(x*PLATFORM.SIZE, y*PLATFORM.SIZE, 0);
    },
    addCoin:function(x, y, type){
        var m = new THREE.Mesh( this.coingeo, this[type] );
        m.rotation.x = 90*PLATFORM.ToRad;
        this.parent.level.add(m);
        m.position.set(x*PLATFORM.SIZE, y*PLATFORM.SIZE, 0);
        this.coins[this.coins.length] = m;
    },
    removeCoin:function(n){
        this.parent.level.remove(this.coins[n]);
        this.coins.splice(n, 1);
        this.parent.stat.updateStat("points", 100);
    }

}

PLATFORM.SIZE = 128;
PLATFORM.mapFile =[
"                                                                                               KLLLK                                                                         ",
"                                                               AA                               KKK        A A A       5        5                                       L L L",
"                                                       AA                                        A        KKKKKKKKKIIIIIIIIIIIIIIIIIIIII                                LLLLL",
"                                                                                                 A       KLLLLLLLLLK                 ILI                                LLLLL",
"          A                                AA                IIIIII                                       KKKKKKKKK                  ILI                  A             LLLLL",
"                                       A        A   KKKKKKKK   II   KKKK                    KKKK   KKKK                           B  ILI                                LLLLL",
"          I                                 5          KK      II    KK                    KLLK     KLLK                        A   AILI             A   LLL   A        YLLLL",
" 1      JIIIJ  5         K  5  K     IIIIIIIIIIIIII    KK      II    KK KKKK              KLLLK     KLLLK            5  5        A A ILI                  5             ELLLL",
"JJJJJJJJIIIIIJJJJJJ   IIIIIIIIIIIIII       II          KK      II    KK  KK KKKK   KKKK  KLLLLK     KLLLLKKKKKK    KKKKKKKK    KKKKKKILI   LLLLLLLLL   LLLLLLL   LLLLLLLLLLLL",
"                                           II          KK      II    KK  KK  KK     KK   KLLLLK     KLLLLKLLLLL    LLLLLLLL    LLLLLLILI                                     "
].join("");

