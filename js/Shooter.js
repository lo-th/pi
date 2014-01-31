/**
* Nano shooter prototype
* @author LoTh / http://3dflashlo.wordpress.com/
*/

var SHOOTER = { REVISION: '0.1' };

SHOOTER.ToRad = Math.PI / 180;
SHOOTER.FACTOR = 0.3;
SHOOTER.ZONE_X = 2000;
SHOOTER.ZONE_Y = 1000;
SHOOTER.ZONE_MID_X = 2000;
SHOOTER.ZONE_MID_Y = 1000;

//-----------------------------------------------------
//  GAME PROTOTYPE
//-----------------------------------------------------

SHOOTER.Game = function( scene, sceneback, showInfo, showScore ){
	this.stat = new SHOOTER.Stat( showInfo , showScore );

    this.scene = scene;
    this.sceneback = sceneback;

    this.ship = new SHOOTER.Ship();
    this.bullet = new SHOOTER.Bullet();
    this.enemy = new SHOOTER.Enemy();
    this.bulletEnemy = new SHOOTER.EnemyBullet();

    this.enemyInterval = 0;
    this.bossInterval = 30;
    this.powerupInterval = 10;

    this.enemyTimer = null;
    this.updateTimer = null;

    this.time = 0;

    this.onMouseDown = false;
    this.onMouseMove = false;
    this.isStartGame = false;
    this.banking=0;

    this.zoneGeo = new THREE.PlaneGeometry( 1, 1 );
    this.zoneMat = new THREE.MeshBasicMaterial( { color: 0x111111, side: THREE.BackSide } );
    this.oldy = 0;
    this.zone = null;

    this.mouse = [0,0];
}

SHOOTER.Game.prototype = {
    constructor: SHOOTER.Game,

    init:function(){

        this.zone = new THREE.Mesh(this.zoneGeo, this.zoneMat);
        sceneback.add(this.zone);

        this.ship.parent = this;
        this.ship.init();

        this.bullet.parent = this;
        this.bullet.init();

        this.enemy.parent = this;
        this.enemy.init();

        this.bulletEnemy.parent = this;
        this.bulletEnemy.init();

    },
    initLevel:function(){
        this.isStartGame = true;
    },
    mousePos:function( x, y ){
        this.mouse[0] = x / SHOOTER.FACTOR;
        this.mouse[1] = y / SHOOTER.FACTOR;
    },
    resize:function( x, y, f ){
        SHOOTER.FACTOR = f;
        SHOOTER.ZONE_X =  Math.floor((x / SHOOTER.FACTOR)-(40/ SHOOTER.FACTOR));
        SHOOTER.ZONE_Y =  Math.floor((y / SHOOTER.FACTOR)-(40/ SHOOTER.FACTOR));
        SHOOTER.ZONE_MID_X = Math.floor(SHOOTER.ZONE_X * 0.5);
        SHOOTER.ZONE_MID_Y =  Math.floor(SHOOTER.ZONE_Y * 0.5);
        this.zone.scale.x = (SHOOTER.ZONE_X)//+(40/ SHOOTER.FACTOR);
        this.zone.scale.y = (SHOOTER.ZONE_Y)//+(40/ SHOOTER.FACTOR);
    },
    update:function(){

        this.banking = this.ship.position.y - this.oldy;
        this.ship.rotation.x = this.banking * SHOOTER.ToRad;
        if(this.onMouseMove){
            this.ship.position.x = this.mouse[0];
            this.ship.position.y = this.mouse[1];
        }
        if(this.onMouseDown) this.bullet.shoot();

        this.ship.update();
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

        this.oldy = this.ship.position.y;
    }

}

//-----------------------------------------------------
//  GAME STAT
//-----------------------------------------------------

SHOOTER.Stat = function( showInfo, showScore ){
	this.score = "";
    this.infos = "";
	this.point = 0;
	this.shipHealth = 0;
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

SHOOTER.Stat.prototype = {
    constructor: SHOOTER.Stat,

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
		    "HEALTH " + this.shipHealth + " ",
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
//  PLAYER SHIP
//-----------------------------------------------------

SHOOTER.Ship = function(){
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
}

SHOOTER.Ship.prototype = {
    constructor: SHOOTER.Ship,

    init:function(){
        this.health = this.maxHealth;
        this.parent.stat.setStat("shipHealth", this.health);
        this.parent.stat.setStat("life", this.life);
        this.geo = new THREE.CubeGeometry(120,30,100);
        this.mat = new THREE.MeshBasicMaterial( { color: 0xe74c3c } );

        this.mesh = new THREE.Mesh( this.geo, this.mat );
        this.parent.scene.add(this.mesh);
        this.mesh.position.y = SHOOTER.ZONE_Y;
        this.position = this.mesh.position;
        this.rotation = this.mesh.rotation;
    },
    update:function(){
        if(this.inDamage){this.inDamage= false; this.mat.color.setHex(0xe74c3c);}
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
        this.parent.stat.setStat("shipHealth", this.health);
    },
    kill:function(){
        this.life--;
        this.health = this.maxHealth;
        this.parent.stat.setStat("life", this.life);
        this.parent.stat.setStat("shipHealth", this.health);
    }
}

//-----------------------------------------------------
//  PLAYER BULLET
//-----------------------------------------------------

SHOOTER.Bullet = function(){
    this.parent = null;
    this.bullets = null;
    this.speed = 60;
    this.hitZone = 50;
    this.geo = null;
    this.mat = null;
}

SHOOTER.Bullet.prototype = {
    constructor: SHOOTER.Bullet,

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
                if (SHOOTER.HitTest( b , e, this.hitZone)) {
                    this.parent.enemy.takeDamage(j, 1);
                    this.kill(i);
                    return;
                }
            }
            if (b.position.x < -SHOOTER.ZONE_MID_X ) {
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

//-----------------------------------------------------
//  ENEMY SHIP
//-----------------------------------------------------

SHOOTER.Enemy = function(){
    this.parent = null;
    this.geo = null;
    this.mat = null;
    this.enemys = null;
    this.enemysHealth = null;
    this.enemysSpeed = null;
    this.enemysWobble = null;
    this.enemysShootCount = null;
    this.shootEvery = 50;
}

SHOOTER.Enemy.prototype = {
    constructor: SHOOTER.Enemy,

    init:function(){
        this.geo = new THREE.CubeGeometry(60,50,120);
        this.mat = new THREE.MeshBasicMaterial( { color:0x3498db } ); ////0x52be7f

        this.enemys = [];
        this.enemysHealth = [];
        this.enemysSpeed = [];
        this.enemysWobble = [];
        this.enemysShootCount = [];
    },
    add:function(){
        var b =  new THREE.Mesh( this.geo, this.mat );
        b.position.copy(new THREE.Vector3(-SHOOTER.ZONE_MID_X, -SHOOTER.ZONE_MID_Y+ (Math.random() * SHOOTER.ZONE_Y), 0));
        this.parent.scene.add(b);
        var n = this.enemys.length;
        this.enemys[n] = b;
        this.enemysHealth[n] = 3;
        this.enemysShootCount[n] = 0;
        this.enemysSpeed[n] = Math.floor(Math.random() * 20 + 10);
        var wob = Math.floor((Math.random() * 20));
        if (wob < 10) this.enemysWobble[n] = wob;
        else this.enemysWobble[n] = 0;
    },
    update:function(){
        var e;
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
                if (this.enemysWobble[i] > 0 && e.position.y > SHOOTER.ZONE_MID_Y) this.enemysWobble[i] *= -1;
                else if (this.enemysWobble[i] < 0 && e.position.y < -SHOOTER.ZONE_MID_Y) this.enemysWobble[i] *= -1;
                e.position.y += this.enemysWobble[i];
                e.rotation.x += (this.enemysWobble[i] / 10)*SHOOTER.ToRad;
            }
            // kill enemy if out of screen
            if (e.position.x > SHOOTER.ZONE_MID_X) {
                this.kill(i);
            }
            // kill enemy if health to 0
            if (this.enemysHealth[i] == 0) {
                this.parent.stat.updateStat("kills", 1);
                this.parent.stat.updateStat("points", 100);
                this.kill(i);
            }
        }

    },
    takeDamage:function( n, d ){
        this.enemysHealth[n] -= d;
        this.parent.stat.updateStat("hits", 1);
    },
    kill:function(n){
        this.parent.scene.remove(this.enemys[n]);
        this.enemys.splice(n, 1);
        this.enemysHealth.splice(n, 1);
        this.enemysSpeed.splice(n, 1);
        this.enemysWobble.splice(n, 1);
        this.enemysShootCount.splice(n, 1);
    }
}

//-----------------------------------------------------
//  ENEMY BULLET
//-----------------------------------------------------

SHOOTER.EnemyBullet = function( ){
    this.parent = parent;
    this.bullets = null;
    this.bulletsSpeed = null;
    this.speed = 30;
    this.hitZone = 50;
    this.geo = null;
    this.mat = null;
}

SHOOTER.EnemyBullet.prototype = {
    constructor: SHOOTER.EnemyBullet,

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

           if (SHOOTER.HitTest( b , this.parent.ship, this.hitZone)) {
                // add damage to player ship
                this.parent.ship.takeDamage(10);
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

SHOOTER.HitTest = function( p1, p2, zone ){
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