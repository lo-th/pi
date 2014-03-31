/**
 * ammo.js and Worker for three.js 2014
 * @author LoTh / http://3dflashlo.wordpress.com/
 */

//---------------------------------------------------
//   OimoPhysics use international system units
//   0.1 to 10 meters max for dynamique body
//   size and position x100 for three.js
//---------------------------------------------------

'use strict';

// physics variable
var world;
var solver;
var collisionConfig;
var dispatcher;
var broadPhase;

var bodys=[];
var matrix = [];

var infos = [];

var fps=0, time, time_prev=0, fpsint = 0;
var dt = 1.0/60.0;
var isTimout = false;
var timer, delay, timerStep, timeStart=0;

var ToRad = Math.PI / 180;

self.onmessage = function (e) {
	var phase = e.data.tell;
	if(phase === "INIT"){
		importScripts(e.data.url);
		var solver = new Ammo.btSequentialImpulseConstraintSolver();
		var collisionConfig = new Ammo.btDefaultCollisionConfiguration();
		var dispatcher = new Ammo.btCollisionDispatcher(collisionConfig);
		var broadPhase = new Ammo.btDbvtBroadphase();
		world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadPhase, solver, collisionConfig);
		world.setGravity(new Ammo.btVector3(0, -100, 0));
		timerStep = dt * 1000;

		self.postMessage({tell:"START"});

		if(isTimout) update(); else timer = setInterval(update, timerStep);
	}
	if(phase === "ADD") ADD(e.data.obj);


}


//--------------------------------------------------
//   WORLD UPDATE
//--------------------------------------------------

var update = function(){

	timeStart = Date.now();
	world.stepSimulation(dt, 10);
	
	var i =  bodys.length;
	
    while (i--) {
        getMatrix(i);
    }

	worldInfo();
	self.postMessage({tell:"RUN", infos:infos, matrix:matrix });

}

var worldInfo = function(){

	time = Date.now();
    if (time - 1000 > time_prev) { time_prev = time; fpsint = fps; fps = 0; } fps++;
    infos[0] = fpsint;
    infos[1] = bodys.length;
}


//--------------------------------------------------
//   ADD SOMETING ON FLY
//--------------------------------------------------

var ADD = function(obj){
	var size = obj.size || [1,1,1];
	var pos = obj.pos || [0,0,0];
	var rot = obj.rot || [0,0,0];

	var shape;
	
	switch(obj.type){
		case 'ground':
		    shape = new Ammo.btBoxShape(new Ammo.btVector3(20, 0.5, 40));
		break;
		case 'box':
		    shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5));
		break;
	}

	var transform = new Ammo.btTransform();
	transform.setIdentity();
	// position
	transform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));
	//rotation
	var q = new Ammo.btQuaternion();
	q.setEulerZYX(rot[2]*ToRad,rot[1]*ToRad,rot[0]*ToRad);
	transform.setRotation(q);

	var mass = obj.mass || 0;
	var localInertia = new Ammo.btVector3(0, 0, 0);
	shape.calculateLocalInertia(mass, localInertia);
	var myMotionState = new Ammo.btDefaultMotionState(transform);
	var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);

	var body = new Ammo.btRigidBody(rbInfo);
	//body.activate();

	world.addRigidBody(body);
	bodys.push(body);
	matrix.push(new Float32Array(8));

}

var getMatrix = function(i){

	var m = matrix[i];
	m[0] = bodys[i].getActivationState();

	if(m[0]==2) return;

    var t = bodys[i].getWorldTransform();
    var r = t.getRotation();
    var p = t.getOrigin();

    m[1] = r.x();
    m[2] = r.y();
    m[3] = r.z();
    m[4] = r.w();

    m[5] = p.x();
    m[6] = p.y();
    m[7] = p.z();
    

}