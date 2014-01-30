var SHOOTER = { REVISION: '0.1' };

SHOOTER.ToRad = Math.PI / 180;

//-----------------------------------------------------
//  GAME PROTOTYPE
//-----------------------------------------------------

SHOOTER.Game = function( showInfo, scene ){
	this.stat = new SHOOTER.Stat( showInfo );
    //this.showInfo = showInfo;

    this.viewLimit = new THREE.Vector3( 2000, 1000, 1000 );
    this.scene = scene;

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

    this.onShoot=false;
    this.isMouseMove=false;
    this.banking=0;
    






   // this.init();
}
SHOOTER.Game.prototype = {
    constructor: SHOOTER.Game,
    init:function(){

        this.viewLimit = new THREE.Vector3( 2000, 1000, 1000 );

        console.log(this.viewLimit.x)

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

        //this.enemyTimer = 
        this.enemyTimer = setTimeout(this.addEnemy(), 1000 * this.enemyInterval );//setTimeout


        this.updateTimer = setInterval(this.update(), 1000/60);

    },
    moveShip:function(x,y){
        this.ship.position.x = x;
        this.ship.position.y = y;
        this.isMouseMove =true;
    },
    update:function(){
        


        this.enemyInterval++;
        if(this.enemyInterval === 60){
            this.enemyInterval = 0;
            this.enemy.add();
        }
        if(this.onShoot)this.bullet.shoot();

        if (this.banking !== 0 && !this.isMouseMove) {
            if (this.banking > 0) this.banking--;
            else this.banking++;

            this.ship.rotation.x = this.banking*SHOOTER.ToRad;
        }

        //this.ship.update();
        this.enemy.update();
        this.bullet.update();
        this.bulletEnemy.update();

        this.isMouseMove = false;
    }

}

//-----------------------------------------------------
//  GAME STAT
//-----------------------------------------------------

SHOOTER.Stat = function( showInfo ){
	this.score = "";
	this.point = 0;
	this.shipHealth = 0;
	this.kills = 0;
	this.hits = 0;
	this.points = 0;
	this.misses = 0;
	this.shots = 0;
	this.gameComplete = 0;
    this.showInfo = showInfo;
}
SHOOTER.Stat.prototype = {
    constructor: SHOOTER.Stat,
    setStat:function(name, value){
    	this[name] = value;
        this.update();
    },
    updateStat:function(name, value){
        this[name] += value;
        this.update();
    },
    update:function(){
    	this.score = [
    	    "SCORE " + this.points + "<br>",
		    "HEALTH " + this.shipHealth + "<br>",
		    "Kill " + this.kills + "<br>",
		    "Shoot " + this.shots + "<br>",
		    "Hit " + this.hits + "<br>",
		    "Misse " + this.misses + "<br>"
		].join("\n");
        this.showInfo(this.score);
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
    this.geo = null;
    this.mat = null;
    this.mesh = null;
}

SHOOTER.Ship.prototype = {
    constructor: SHOOTER.Ship,
    init:function(){
        this.health = this.maxHealth;
        this.parent.stat.setStat("shipHealth", this.health);
        this.geo = new THREE.CubeGeometry(120,30,100);
        this.mat = new THREE.MeshBasicMaterial( { color: 0xFF8000 } );

        this.mesh = new THREE.Mesh( this.geo, this.mat );
        this.parent.scene.add(this.mesh);
        this.mesh.position.y = this.parent.viewLimit.y;
        this.position = this.mesh.position;
    },
    update:function(){
    },
    takeDamage:function(n){
        this.health -= n;
        if( this.health <= 0 ){
            this.health = 0;
            this.kill();
        } else {
            // smallExplosion
        }
        this.parent.stat.setStat("shipHealth", this.health);
    },
    kill:function(){
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

    this.init();
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
                if (this.proximity(b, e)) {
                    this.parent.enemy.takeDamage(j, 1);
                    this.kill(i);
                    return;
                }
            }
            if (b.position.x < -this.parent.viewLimit.x) {
                this.kill(i);
                this.parent.stat.updateStat("misses", 1);
            }
        }
    },
    proximity:function(A , B){
        var ax = ((A.position.x + this.parent.viewLimit.x) - (B.position.x + this.parent.viewLimit.x))// >> 0;
        var ay = (A.position.y - B.position.y) //>> 0;
        if ( ax < this.hitZone && ax > -this.hitZone && ay < this.hitZone && ay > -this.hitZone) return true;
        else return false;
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

    //this.init();
}
SHOOTER.Enemy.prototype = {
    constructor: SHOOTER.Enemy,
    init:function(){
        this.geo = new THREE.CubeGeometry(60,50,120);
        this.mat = new THREE.MeshBasicMaterial( { color: 0x00FF00 } );

        this.enemys = [];
        this.enemysHealth = [];
        this.enemysSpeed = [];
        this.enemysWobble = [];
        this.enemysShootCount = [];
    },
    add:function(){
        var b =  new THREE.Mesh( this.geo, this.mat );
        b.position.copy(new THREE.Vector3(-this.parent.viewLimit.x, (Math.random() * this.parent.viewLimit.y) + 600, this.parent.viewLimit.z));
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
                if (this.enemysWobble[i] > 0 && e.position.y > (this.parent.viewLimit.y + 600)) this.enemysWobble[i] *= -1;
                else if (this.enemysWobble[i] < 0 && e.position.y < 600) this.enemysWobble[i] *= -1;
                e.position.y += this.enemysWobble[i];
                e.rotation.x += (this.enemysWobble[i] / 10)*SHOOTER.ToRad;
            }
            // kill enemy if out of screen
            if (e.position.x > this.parent.viewLimit.x) {
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
    takeDamage:function(n , d){
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

    //this.init();
}
SHOOTER.EnemyBullet.prototype = {
    constructor: SHOOTER.EnemyBullet,

    init:function(){
        this.geo = new THREE.CubeGeometry(10,10,30);
        this.mat = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );
        this.bullets = [];
        this.bulletsSpeed = [];
    },
    shoot:function( e , eSpeed ){
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

        while(i--){
            b = this.bullets[i]
            b.position.x += this.bulletsSpeed[i];
           // if this bullet is hitting the player ship
            if (this.proximity(b, this.parent.ship)) {
                // add damage to player ship
                this.parent.ship.takeDamage(10);
                // destroy bullet
                this.kill(i);
                return;
            }
            // destroy bullet if out of screen
            if (b.position.x > this.parent.viewLimit.x) {
                this.kill(i);
            }
        }
    },
    proximity:function(A , B){
        var ax = ((A.position.x + this.parent.viewLimit.x) - (B.position.x + this.parent.viewLimit.x))// >> 0;
        var ay = (A.position.y - B.position.y) //>> 0;
        if ( ax < this.hitZone && ax > -this.hitZone && ay < this.hitZone && ay > -this.hitZone) return true;
        else return false;
    },
    kill:function(n){
        this.parent.scene.remove(this.bullets[n]);
        this.bullets.splice(n, 1);
        this.bulletsSpeed.splice(n, 1);
    }

}