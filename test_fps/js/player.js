V3D.Player = function(){
	this.obj = new THREE.Object3D();
    this.velocity = new THREE.Vector3( 0, 0, 0 );
    this.rotation = new THREE.Vector3( 0, 0, 0 );
    this.newRotation = new THREE.Vector3( 0, 0, 0 );
    this.model = false;
    this.timeScale = 1;
    this.timeToStep = 0;
    this.isFrameStepping = false;
    this.animLength = 0;
    this.W = {R:0};
    this.isMove = false;

    //this.ease = new V.Ease();
    //this.isOnSolidGround = true;
    //this.gravity = -1;

};

V3D.Player.prototype = {
    constructor: V3D.Player,

    addModel:function(m, t){
        this.hero = m;//new THREE.SkinnedMesh(m.geometry,  new THREE.MeshBasicMaterial( {map:t, color:0xffffff, skinning:true } ), false );
        this.hero.material =new THREE.MeshBasicMaterial( {map:t, color:0xffffff, skinning:true } );
        // new THREE.Mesh( new THREE.BoxGeometry( 0.4, 1.8, 0.2), new THREE.MeshBasicMaterial( {color:0x00ff00 } ) );
        this.hero.position.y = 0.9; //-0.3+1.2;
        this.hero.scale.set(0.023,0.023,-0.023);

        this.animations = this.hero.animations;
        this.animLength = m.animations.length;
        var i = this.animLength;

        var name;
        while(i--){
             name = this.animations[i].name;
            if(name==='idle') this.W[name] = 1;
            else this.W[name] = 0;

            this.animations[i].weight = this.W[name];
            this.animations[i].play( 0, this.W[name] );
        }

        this.obj.add(this.hero);
        this.model = true;
    },
    loop:function(delta){
        if(this.model){
            THREE.AnimationHandler.update( delta );
        }
    },
    getPosition:function(){
    	return this.obj.position;
    },
    setPosition:function(x,y,z){
    	this.obj.position.set(x,y,z);
    },
    setRotation:function(y){
        //this.obj.rotation.y = y;
        this.rotation.y = y;
        if(this.isMove){
            this.newRotation.lerp(this.rotation, 0.25);
         this.obj.rotation.y = this.newRotation.y;
     }
        //this.obj.rotation.lerp(this.rotation, 0.5);
    },
    lerp:function(v,f){
    	this.obj.position.lerp(v,f);
    },
    WalkFront:function(){
        //var _this = this;
        if(this.model){
           //if(this.W.idle!==0) 
           this.timeScale=1;
        //   this.animations[ 'walk' ].timeScale=1;
            //this.ease.tween(this.W, 20,{ step_right:0, step_left:0, idle:0, walk:1, func:this.weight, params:[this], types:[] })
            this.tween = TweenLite.to(this.W, 1,{ step_right:0, step_left:0, idle:0, walk:1, delay:0, onUpdate:this.weight, onUpdateParams:[this] });
            this.isMove = true;
        }
    },
    WalkBack:function(){
        if(this.model){
           //if(this.W.idle!==0) 
           this.timeScale=-1;
            this.tween = TweenLite.to(this.W, 1,{ step_right:0, step_left:0, idle:0, walk:1, delay:0, onUpdate:this.weight, onUpdateParams:[this] });
            this.isMove = true;
        }
    },
    stepLeft:function(){
        if(this.model){
           //if(this.W.idle!==0)
            this.tween = TweenLite.to(this.W, 1,{ step_right:0, step_left:1, idle:0, walk:0, delay:0, onUpdate:this.weight, onUpdateParams:[this] });
            this.isMove = true;
        }
    },
    stepRight:function(){
        if(this.model){
          // if(this.W.idle!==0) 
            this.tween = TweenLite.to(this.W, 1,{ step_right:1, step_left:0, idle:0, walk:0, delay:0, onUpdate:this.weight, onUpdateParams:[this] });
            this.isMove = true;
        }
    },
    stopWalk:function(){
        if(this.model){
            if(this.W['walk']!==0 || this.W['step_right']!==0 || this.W['step_left']!==0) this.tween = TweenLite.to(this.W, 1,{ step_right:0, step_left:0, idle:1, walk:0, delay:0, onUpdate:this.weight, onComplete:this.stop, onUpdateParams:[this], onCompleteParams:[this]});
            this.isMove = false;
        }
    },
    stop:function(t){
    },

    weight:function(t){
        var i = t.animLength;
        var name;
        while(i--){
            name = t.animations[i].name;
            t.animations[i].weight = t.W[name];
            t.animations[i].timeScale = t.timeScale;
        }
      
    }


};