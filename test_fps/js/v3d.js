
'use strict';
var V3D = {};
V3D.ToRad = Math.PI/180;

V3D.Base = function(){
	this.container = document.getElementById( 'container' );
	this.f = [0,0,0,0];
	this.key = [0,0,0,0,0,0,0];

	//this.cfg = { speed:0.5, maxSpeed:10, posY:10 };
	this.cfg = { speed:0.025, maxSpeed:0.25, G:0.4,  g:0, onGround:true, posY:0 };//1.2
    this.cam = { horizontal:90, vertical:90, distance:3, py:1.2 };
    this.mouse = { down:false, ox:0, oy:0, h:0, v:0, mx:0, my:0 };

    this.bullets = [];
    this.bulletMoves = [];


    this.srcImage = ['src/hero.jpg'];
    this.srcModel = ['src/base.sea', 'src/hero.sea'];

    this.imgs = [];
    this.textures = [];
    this.meshs = {};
	this.n = 0;

	this.delta = 0;


	// map2d
	

	//this.timer = setInterval(this.move, 1e3/60); 


	//this.initMiniMap2D();
	this.init();
	this.miniMap = new V3D.Minimap();
	this.loadImages();
};

V3D.Base.prototype = {
    constructor: V3D.Base,






    // ------ LOAD IMAGES

    loadImages:function(){
    	var _this = this;
    	var n = this.n;
    	this.imgs[n] = new Image();
    	this.imgs[n].onload = function(){ 
    		_this.n++; 
    		if(_this.n === _this.srcImage.length) _this.endLoadImages();
    		else _this.loadImages();
    	};
        this.imgs[n].src = this.srcImage[n];
    },
    endLoadImages:function(){
    	var i = this.imgs.length;
    	while(i--){
    		this.textures[i] = new THREE.Texture(this.imgs[i]);
    		this.textures[i].repeat.set( 1, -1 );
    		this.textures[i].wrapS = this.textures[i].wrapT = THREE.RepeatWrapping;
    		this.textures[i].needsUpdate = true;

    	}

    	/*var wallTexture =  THREE.ImageUtils.loadTexture( 'bigwall.png' );
	    
		//wallTexture.magFilter = THREE.NearestFilter;
	    //wallTexture.minFilter = THREE.LinearMipMapLinearFilter;

	    wallMaterial = new THREE.MeshBasicMaterial( { map: wallTexture } );*/

    	this.n = 0;
    	this.loadModels();
    },

    // ------ LOAD MODELS

    loadModels:function (){
    	var _this = this;
    	var n = this.n;
	    var loader = new THREE.SEA3D( true );
	    loader.onComplete = function( e ) {
	    	_this.n++;
	        var m;
	        var i = loader.meshes.length;
	        while(i--){
	            m = loader.meshes[i];
	            if(m.name !== 'hero' ) _this.scaleGeometry(m.geometry);

	            _this.meshs[m.name] = m;
	        }
	        if(_this.n === _this.srcModel.length) _this.endLoadModels();
    		else _this.loadModels();
	    }
	    loader.parser = THREE.SEA3D.DEFAULT;
	    loader.load( this.srcModel[n] );
	},
	scaleGeometry:function (g, s){
		var s = s || 1;
		var mtx = new THREE.Matrix4().makeScale(s, s, -s);
		g.applyMatrix(mtx);
		
		/*g.computeFaceNormals();
	    g.computeVertexNormals();
	    g.computeTangents();*/
	    g.computeBoundingBox();
		g.computeBoundingSphere();
	},
	endLoadModels:function(){
		var _this = this;
		this.mapHeigth =  this.customShader();//new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors, overdraw:true, shading: THREE.FlatShading } );
		//this.mapHeigth22 = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors, overdraw:true, shading: THREE.FlatShading , skinning:true, morphTargets:true } );
		//this.mapHeigth = new THREE.MeshBasicMaterial( {  map:this.miniMap.createHeightGradMaterial([[0,1],['black','white']]), overdraw:true, shading: THREE.FlatShading} );	
    			
		this.meshs['base'].material = this.mapHeigth.clone();
		this.scene.add(this.meshs['base']);
		var mt = this.customShader();
		var m = new THREE.Mesh( this.meshs['base'].geometry.clone(), mt);//this.mapHeigth.clone());
		this.miniMap.scene.add(m);

		
		//this.meshs['Box001'].material = this.mapHeigth22.clone();
		/*var bbmesh = new THREE.SkinnedMesh(this.meshs['Box001'].geometry, this.mapHeigth22, false );
        bbmesh.scale.set(0.5,0.5,-0.5);
		this.scene.add(bbmesh);
		bbmesh.setWeight("Box002", 1);*/
		//this.timer = setInterval(_this.move, 1e3/60); 

		this.player.addModel(this.meshs['hero'], this.textures[0]);
    },














    // ------- 3D SIDE

    init:function() {
    	this.clock = new THREE.Clock();

    	this.levelOrigin = new THREE.Vector3(0,0,0);
    	this.level = new THREE.Vector3(0,0,0);
    	this.ease = new THREE.Vector3();
    	this.easeRot = new THREE.Vector3();

    	this.vs = new THREE.Vector3( window.innerWidth, window.innerHeight, window.innerWidth/window.innerHeight );
    	this.scene = new THREE.Scene();
    	this.camera = new THREE.PerspectiveCamera( 55, this.vs.z, 0.1, 1000 );
    	this.scene.add( this.camera );
    	this.content = new THREE.Object3D();
    	this.scene.add(this.content);
    	this.bulletContent = new THREE.Object3D();
		this.scene.add(this.bulletContent);

		this.bulletMat = new THREE.MeshBasicMaterial({ color:0xFFFFFF });
		this.bulletGeo = new THREE.SphereGeometry(8,6,6);

		// marker
		var geometry = new THREE.CylinderGeometry( 0, 0.3, 1, 3 );
		geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 5, 0 ) );
		geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
		this.marker = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) );
		this.scene.add(this.marker);

		/*this.player = new THREE.Object3D();
		this.player.position.set(0,this.cfg.posY+0.5,0);
		this.scene.add(this.player);*/

		this.player = new V3D.Player();
		this.player.setPosition(0,this.cfg.posY+0.5,0);
		this.scene.add(this.player.obj);


		this.moveCamera();

    	this.projector = new THREE.Projector();
    	this.raycaster = new THREE.Raycaster();

    	this.renderer = new THREE.WebGLRenderer({ precision: "mediump", devicePixelRatio:1, antialias:false });
    	this.renderer.setClearColor( 0x040206, 1 );
    	this.renderer.setSize( this.vs.x, this.vs.y );
    	this.renderer.sortObjects = false;
    	this.renderer.sortElements = false;
    	this.container.appendChild( this.renderer.domElement );

    	var _this = this;
    	window.addEventListener( 'resize', function(e){ _this.resize(); }, false );

    	this.activeMouse();
    	this.bindKeys();
    },
    render:function(){
    	this.delta = this.clock.getDelta();
    	
    	this.move();
    	this.player.loop(this.delta);

    	this.renderer.render( this.scene, this.camera );

    	// fps update
    	this.f[2] = Date.now();
    	if (this.f[2]-1000>this.f[1]){ this.f[1]=this.f[2]; this.f[0]=this.f[3]; this.f[3]=0; } this.f[3]++;
    },
    resize:function(){
    	this.vs.set( window.innerWidth, window.innerHeight, window.innerWidth/window.innerHeight);
	    this.camera.aspect = this.vs.z;
	    this.camera.updateProjectionMatrix();
	    this.renderer.setSize(this.vs.x,this.vs.y);
	},




	//  PLAYER MOVE

	move:function() {
		//this.updateBullets();
		
		//acceleration and speed limite
		if (this.key[0]) this.ease.z = (this.ease.z > this.cfg.maxSpeed) ?  this.cfg.maxSpeed : this.ease.z+this.cfg.speed;
		if (this.key[1]) this.ease.z = (this.ease.z < -this.cfg.maxSpeed)? -this.cfg.maxSpeed : this.ease.z-this.cfg.speed;
		if (this.key[2]) this.ease.x = (this.ease.x > this.cfg.maxSpeed) ?  this.cfg.maxSpeed : this.ease.x+this.cfg.speed;
		if (this.key[3]) this.ease.x = (this.ease.x < -this.cfg.maxSpeed)? -this.cfg.maxSpeed : this.ease.x-this.cfg.speed;

		//deceleration
		if (!this.key[0] && !this.key[1]) {
			if (this.ease.z > this.cfg.speed) this.ease.z -= this.cfg.speed;
			else if (this.ease.z < -this.cfg.speed) this.ease.z += this.cfg.speed;
			else this.ease.z = 0;
		}
		if (!this.key[2] && !this.key[3]) {
			if (this.ease.x > this.cfg.speed) this.ease.x -= this.cfg.speed;
			else if (this.ease.x < -this.cfg.speed) this.ease.x += this.cfg.speed;
			else this.ease.x = 0;
		}

		// ease
		if(this.ease.z!==0 || this.ease.x!==0){
			if(this.ease.x<0)this.player.stepLeft();
			else if(this.ease.x>0)this.player.stepRight();

			if(this.ease.z>0)this.player.WalkFront();
			else if(this.ease.z<0)this.player.WalkBack();

		} else {
			this.player.stopWalk();
		}

		/*if(this.ease.z>0)this.player.startWalk();
		else this.player.stopWalk();

		if(this.ease.x>0)this.player.stepLeft();
		else if(this.ease.x<0)this.player.stepRight();
		else this.player.stopWalk();*/
		
		// stop if no move
		if (this.ease.x == 0 && this.ease.z == 0 && !this.mouse.down ) return;
		

		// find direction of player
		this.easeRot.y = this.cam.horizontal*V3D.ToRad;
		var rot = this.unwrapDegrees(Math.round(this.cam.horizontal));
		this.easeRot.x = Math.sin(this.easeRot.y) * this.ease.x + Math.cos(this.easeRot.y) * this.ease.z;
		this.easeRot.z = Math.cos(this.easeRot.y) * this.ease.x - Math.sin(this.easeRot.y) * this.ease.z;

		this.player.setRotation(-(this.cam.horizontal+90)*V3D.ToRad);

		this.level.x = this.levelOrigin.x-this.easeRot.x;
		this.level.z = this.levelOrigin.z+this.easeRot.z;

		// update 2d map
		this.miniMap.drawMap();

		// test pixel collision
		var nohitx = 0;
		var nohitz = 0;
		var lock = this.miniMap.lock;

		if(rot >= 45 && rot <= 135){
			if(this.level.z < this.levelOrigin.z) if(!lock[0] && !lock[4] && !lock[5]) nohitz = 1;
			if(this.level.z > this.levelOrigin.z) if(!lock[1] && !lock[6] && !lock[7]) nohitz = 1;
			if(this.level.x < this.levelOrigin.x) if(!lock[2] && !lock[4] && !lock[6]) nohitx = 1;
			if(this.level.x > this.levelOrigin.x) if(!lock[3] && !lock[5] && !lock[7]) nohitx = 1;
		} else if (rot <= -45 && rot >= -135){
			if(this.level.z > this.levelOrigin.z) if(!lock[0] && !lock[4] && !lock[5]) nohitz = 1;
			if(this.level.z < this.levelOrigin.z) if(!lock[1] && !lock[6] && !lock[7]) nohitz = 1;
			if(this.level.x > this.levelOrigin.x) if(!lock[2] && !lock[4] && !lock[6]) nohitx = 1;
			if(this.level.x < this.levelOrigin.x) if(!lock[3] && !lock[5] && !lock[7]) nohitx = 1;
		} else if (rot < 45 && rot > -45){
			if(this.level.z > this.levelOrigin.z) if(!lock[2] && !lock[4] && !lock[6]) nohitz = 1;
			if(this.level.z < this.levelOrigin.z) if(!lock[3] && !lock[5] && !lock[7]) nohitz = 1;
			if(this.level.x < this.levelOrigin.x) if(!lock[0] && !lock[4] && !lock[5]) nohitx = 1;
			if(this.level.x > this.levelOrigin.x) if(!lock[1] && !lock[6] && !lock[7]) nohitx = 1;
		} else {
			if(this.level.z < this.levelOrigin.z) if(!lock[2] && !lock[4] && !lock[6]) nohitz = 1;
			if(this.level.z > this.levelOrigin.z) if(!lock[3] && !lock[5] && !lock[7]) nohitz = 1;
			if(this.level.x > this.levelOrigin.x) if(!lock[0] && !lock[4] && !lock[5]) nohitx = 1;
			if(this.level.x < this.levelOrigin.x) if(!lock[1] && !lock[6] && !lock[7]) nohitx = 1;
		}
/*
		if(rot >= 45 && rot <= 135){
			if(this.level.z < this.levelOrigin.z) if(!lock.f && !lock.fl && !lock.fr) nohitz = true;
			if(this.level.z > this.levelOrigin.z) if(!lock.b && !lock.bl && !lock.br) nohitz = true;
			if(this.level.x < this.levelOrigin.x) if(!lock.l && !lock.fl && !lock.bl) nohitx = true;
			if(this.level.x > this.levelOrigin.x) if(!lock.r && !lock.fr && !lock.br) nohitx = true;
		} else if (rot <= -45 && rot >= -135){
			if(this.level.z > this.levelOrigin.z) if(!lock.f && !lock.fl && !lock.fr) nohitz = true;
			if(this.level.z < this.levelOrigin.z) if(!lock.b && !lock.bl && !lock.br) nohitz = true;
			if(this.level.x > this.levelOrigin.x) if(!lock.l && !lock.fl && !lock.bl) nohitx = true;
			if(this.level.x < this.levelOrigin.x) if(!lock.r && !lock.fr && !lock.br) nohitx = true;
		} else if (rot < 45 && rot > -45){
			if(this.level.z > this.levelOrigin.z) if(!lock.l && !lock.fl && !lock.bl) nohitz = true;
			if(this.level.z < this.levelOrigin.z) if(!lock.r && !lock.fr && !lock.br) nohitz = true;
			if(this.level.x < this.levelOrigin.x) if(!lock.f && !lock.fl && !lock.fr) nohitx = true;
			if(this.level.x > this.levelOrigin.x) if(!lock.b && !lock.bl && !lock.br) nohitx = true;
		} else {
			if(this.level.z < this.levelOrigin.z) if(!lock.l && !lock.fl && !lock.bl) nohitz = true;
			if(this.level.z > this.levelOrigin.z) if(!lock.r && !lock.fr && !lock.br) nohitz = true;
			if(this.level.x > this.levelOrigin.x) if(!lock.f && !lock.fl && !lock.fr) nohitx = true;
			if(this.level.x < this.levelOrigin.x) if(!lock.b && !lock.bl && !lock.br) nohitx = true;
		}
*/
		if(nohitx)this.levelOrigin.x = this.level.x;
		if(nohitz)this.levelOrigin.z = this.level.z;

		this.level.y = this.miniMap.posY + this.cfg.posY;//*10;

		this.levelOrigin.y = this.level.y;// + this.cfg.posY;

		// gravity
		if (this.cfg.onGround) this.cfg.g = 0;
        else this.cfg.g = this.cfg.G;
        this.ease.y += this.cfg.g * this.delta;

		// update 2d map
		this.miniMap.updatePosition(this.levelOrigin.x, -this.easeRot.y, this.levelOrigin.z);

	    //this.player.position.lerp(this.levelOrigin, 0.1);
	    this.player.lerp(this.levelOrigin, 0.5);
		//this.sky.position.copy(player.position);

		this.moveCamera();
	},

	moveCamera:function() {
	    //this.camera.position.copy(this.Orbit(this.player.position, this.cam.horizontal, this.cam.vertical, this.cam.distance));
	    //this.camera.lookAt(this.player.position);
	    var v = this.player.getPosition().clone();
	    //v.y += 0.9;
	    v.add(new THREE.Vector3(0, this.cam.py, 0));
	    this.camera.position.copy(this.Orbit(v, this.cam.horizontal, this.cam.vertical, this.cam.distance));
	    this.camera.lookAt(v);
	},






	// ------- RAYTEST & SHOOT

	rayTest:function(sh) {
		if ( this.content.children.length > 0 ) {
			var vector = new THREE.Vector3( this.mouse.mx, this.mouse.my, 1 );
			this.projector.unprojectVector( vector, this.camera );
			this.raycaster.set( this.camera.position, vector.sub( this.camera.position ).normalize() );
			var intersects = this.raycaster.intersectObjects( this.content.children );
			if ( intersects.length > 0 ) {
				this.marker.position.set( 0, 0, 0 );
				if(intersects[0].face) this.marker.lookAt(intersects[0].face.normal);
				this.marker.position.copy( intersects[0].point );
				
				if(sh)this.shoot();
		    }
		}
	},

	shoot:function (){
		var n = this.bullets.length;
		var bullet = new THREE.Mesh( this.bulletGeo, this.bulletMat );
		this.bulletContent.add(bullet);
		this.bullet.position.copy(this.player.position);
		
		this.bulletMoves[n] = this.marker.position.clone();
		this.bullets[n] = bullet;
	},

	updateBullets:function(){
		var i = this.bullets.length;
		while(i--){
			if(this.bullets[i].position.distanceTo(this.bulletMoves[i])<0.01 )setTimeout(this.destroyBullet, 1000, i);
			else this.bullets[i].position.lerp(this.bulletMoves[i], 0.1);
		}
	},

	destroyBullet:function(n){
		this.bulletContent.remove(bullets[n]);
		this.bullets.slice(n, 1);
		this.bulletMoves.slice(n,1);
	},





	// ------- MOUSE

	activeMouse:function(){
		var _this = this;
		var body = document.body;
		// disable context menu
        document.addEventListener("contextmenu", function(e){ e.preventDefault(); }, false);

	    if( body.addEventListener ){ 
	    	body.addEventListener( 'mousemove', function(e) {_this.onMouseMove(e)} , false );
		    body.addEventListener( 'mousedown', function(e) {_this.onMouseDown(e)}, false );
		    body.addEventListener( 'mouseup', function(e) {_this.onMouseUp(e)}, false );
		    body.addEventListener( 'mouseout', function(e) {_this.onMouseUp(e)}, false );
		    
		    body.addEventListener( 'touchstart', function(e) {_this.onMouseDown(e)}, false );
		    body.addEventListener( 'touchend', function(e) {_this.onMouseUp(e)}, false );
		    body.addEventListener( 'touchmove', function(e) {_this.onMouseMove(e)}, false );

	        body.addEventListener( 'mousewheel',  function(e) {_this.onMouseWheel(e)}, false ); //chrome
	        body.addEventListener( 'DOMMouseScroll',  function(e) {_this.onMouseWheel(e)}, false ); // firefox
	    }else if( body.attachEvent ){// ie
	    	body.attachEvent( 'onmousemove', function(e) {_this.onMouseMove(e)} , false );
		    body.attachEvent( 'onmousedown', function(e) {_this.onMouseDown(e)}, false );
		    body.attachEvent( 'onmouseup', function(e) {_this.onMouseUp(e)}, false );
		    body.attachEvent( 'onmouseout', function(e) {_this.onMouseUp(e)}, false );
		    
		    body.attachEvent( 'ontouchstart', function(e) {_this.onMouseDown(e)}, false );
		    body.attachEvent( 'ontouchend', function(e) {_this.onMouseUp(e)}, false );
		    body.attachEvent( 'ontouchmove', function(e) {_this.onMouseMove(e)}, false );

	        body.attachEvent("onmousewheel" , function(e) {_this.onMouseWheel(e)}); 
	    }
	},

	onMouseDown:function ( e ) {
		e.preventDefault();
		var px, py;
		if(e.touches){
			px = e.clientX || e.touches[ 0 ].pageX;
		    py = e.clientY || e.touches[ 0 ].pageY;
		} else {
			px = e.clientX;
		    py = e.clientY;
		}
		this.mouse.down = true;
		this.mouse.mx = ( px / this.vs.x ) * 2 - 1;
		this.mouse.my = - ( py / this.vs.y ) * 2 + 1;
		this.mouse.ox = px;
		this.mouse.oy = py;
		this.mouse.h = this.cam.horizontal;
		this.mouse.v = this.cam.vertical;

		//this.rayTest(true);
	},

	onMouseUp:function ( e ) {
		e.preventDefault();
		this.mouse.down = false;
		document.body.style.cursor = 'auto';
	},

	onMouseMove:function ( e ) {
		e.preventDefault();
		var px, py;
		if(e.touches){
			px = e.clientX || e.touches[ 0 ].pageX;
		    py = e.clientY || e.touches[ 0 ].pageY;
		} else {
			px = e.clientX;
		    py = e.clientY;
		}
		if(this.mouse.down){
			document.body.style.cursor = 'move';
			this.cam.horizontal =((px - this.mouse.ox)*0.3) + this.mouse.h;
			this.cam.vertical = (-(py - this.mouse.oy)*0.3) + this.mouse.v;
			//this.moveCamera();
		} else {
			this.mouse.mx = ( px / this.vs.x ) * 2 - 1;
		    this.mouse.my = - ( py / this.vs.y ) * 2 + 1;
			this.rayTest();
		}
	},
	onMouseWheel : function (e) { 
		e.preventDefault();   
	    /*var delta = 0;
	    if(e.wheelDelta){delta=e.wheelDelta*-1;}
	    else if(e.detail){delta=e.detail*20;}
	    this.cam.distance+=(delta/80);
	    if(this.cam.distance<1)this.cam.distance = 1;
	    if(this.cam.distance>150)this.cam.distance = 150;
	    this.moveCamera();*/
	},

	// ------- KEY

	bindKeys:function(){
		var _this = this;
		document.onkeydown = function(e) {
		    e = e || window.event;
			switch ( e.keyCode ) {
			    case 38: case 87: case 90: _this.key[0] = 1; break; // up, W, Z
				case 40: case 83:          _this.key[1] = 1; break; // down, S
				case 37: case 65: case 81: _this.key[2] = 1; break; // left, A, Q
				case 39: case 68:          _this.key[3] = 1; break; // right, D
				case 17: case 67:          _this.key[4] = 1; break; // ctrl, C
				case 69:                   _this.key[5] = 1; break; // E
				case 32:                   _this.key[6] = 1; break; // space
				case 16:                   _this.key[7] = 1; break; // shift
			}
		}
		document.onkeyup = function(e) {
		    e = e || window.event;
			switch( e.keyCode ) {
				case 38: case 87: case 90: _this.key[0] = 0; break; // up, W, Z
				case 40: case 83:          _this.key[1] = 0; break; // down, S
				case 37: case 65: case 81: _this.key[2] = 0; break; // left, A, Q
				case 39: case 68:          _this.key[3] = 0; break; // right, D
				case 17: case 67:          _this.key[4] = 0; break; // ctrl, C
				case 69:                   _this.key[5] = 0; break; // E
				case 32:                   _this.key[6] = 0; break; // space
				case 16:                   _this.key[7] = 0; break; // shift
			}
		}
	    self.focus();
	},






	// ------- MATH

	unwrapDegrees:function(r){
		r = r % 360;
		if (r > 180) r -= 360;
		if (r < -180) r += 360;
		return r;
	},

	Orbit:function(origine, horizontal, vertical, distance) {
		var p = new THREE.Vector3();
		var phi = vertical*V3D.ToRad;
		var theta = horizontal*V3D.ToRad;
		p.x = (distance * Math.sin(phi) * Math.cos(theta)) + origine.x;
		p.z = (distance * Math.sin(phi) * Math.sin(theta)) + origine.z;
		p.y = (distance * Math.cos(phi)) + origine.y;
		return p;
	},

	customShader:function(){
		var deepShader={
		    attributes:{},
		    uniforms:{ 
		    	deep: {type: 'f', value: 0.03904}
		    },
		    fs:[
		        'precision lowp float;',
		        'varying vec4 vc;',
		        'void main(void) { gl_FragColor = vc; }'
		    ].join("\n"),
		    vs:[
		        'uniform float deep;',
		        'varying float dy;',
		        'varying vec4 vc;',
		        'void main(void) {',
		            'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
		            'dy = position.y*deep;',
		            'vc = vec4(dy,dy,dy, 1.0);',
		        '}'
		    ].join("\n")
		};

		var material = new THREE.ShaderMaterial({
			uniforms: deepShader.uniforms,
			attributes: deepShader.attributes,
			vertexShader: deepShader.vs,
			fragmentShader: deepShader.fs
		});

		return material;

	}


};

