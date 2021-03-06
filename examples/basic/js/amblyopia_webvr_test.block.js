window.Tetris = window.Tetris || {};

Tetris.Utils = {};

Tetris.Utils.cloneVector = function (v) {
    return {x:v.x, y:v.y, z:v.z};
};

Tetris.Utils.roundVector = function(v) {
    v.x = Math.round(v.x);
    v.y = Math.round(v.y);
    v.z = Math.round(v.z);
};

Tetris.Block = {};

Tetris.Block.shapes = [
    // BKL square
	[
        {x:0, y:0, z:0},
        {x:0, y:1, z:0},
        {x:1, y:0, z:0},
        {x:1, y:1, z:0}
    ],
	
	// BKL "L"
	[
        {x:0, y:0, z:0},
        {x:1, y:0, z:0},
        {x:1, y:1, z:0},
        {x:1, y:2, z:0}
    ]	
	,

	// BKL I
    [
        {x:0, y:0, z:0},
        {x:0, y:1, z:0},
        {x:0, y:2, z:0},
    ]
	,

	// BKL T
    [
        {x:0, y:0, z:0},
        {x:0, y:1, z:0},
        {x:0, y:2, z:0},
        {x:1, y:1, z:0}
    ]
	, 
	//BKL zigzag
	/*
    [
        {x:0, y:0, z:0},
        {x:0, y:1, z:0},
        {x:1, y:1, z:0},
        {x:1, y:2, z:0}
    ]
	*/
];

Tetris.Block.position = {};

Tetris.Block.generate = function () {
    var geometry, tmpGeometry, i;
// BKL 
	var material2 = new THREE.MeshBasicMaterial();
    
	CurrentBlockOpacity = 0.05;
    CurrentBlockWireFrame = true;
	
	if (level === 0 ) {
	var type = Math.floor(Math.random() * (Tetris.Block.shapes.length));
	}
	else {
	var type = Math.floor(Math.random() * (0));
	}
    this.blockType = type;

    Tetris.Block.shape = [];
    for (i = 0; i < Tetris.Block.shapes[type].length; i++) {
        Tetris.Block.shape[i] = Tetris.Utils.cloneVector(Tetris.Block.shapes[type][i]);
    }
// Changed to THREE.BoxGeometry
    geometry = new THREE.BoxGeometry(Tetris.blockSize, Tetris.blockSize, Tetris.blockSize);
    for (i = 1; i < Tetris.Block.shape.length; i++) {
// THREE.BoxGeometry - added material2		
        tmpGeometry = new THREE.Mesh(new THREE.BoxGeometry(Tetris.blockSize, Tetris.blockSize, Tetris.blockSize), material2);
        tmpGeometry.position.x = Tetris.blockSize * Tetris.Block.shape[i].x;
        tmpGeometry.position.y = Tetris.blockSize * Tetris.Block.shape[i].y;
        THREE.GeometryUtils.merge(geometry, tmpGeometry);

    }
    Tetris.Block.mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, [
        new THREE.MeshPhongMaterial({color:0x2194ce, shading:THREE.FlatShading, wireframe:false, transparent: true, opacity: CurrentBlockOpacity}),
        new THREE.MeshPhongMaterial({color:0xff0000, transparent:true, opacity: CurrentBlockOpacity})
    ]);
	
	
    // initial position
    Tetris.Block.position = {x:Math.floor(Tetris.boundingBoxConfig.splitX / 2) - 1, y:(Math.floor(Tetris.boundingBoxConfig.splitY / 2) - 1), z:8};

    if (Tetris.Board.testCollision(true) === Tetris.Board.COLLISION.GROUND) {
        Tetris.gameOver = true;
        Tetris.pointsDOM.innerHTML = "GAME OVER";
        Tetris.sounds["gameover"].play();
        Cufon.replace('#points');
    }

    Tetris.Block.mesh.position.x = (Tetris.Block.position.x - Tetris.boundingBoxConfig.splitX / 2) * Tetris.blockSize / 2;
    Tetris.Block.mesh.position.y = (Tetris.Block.position.y - Tetris.boundingBoxConfig.splitY / 2) * Tetris.blockSize / 2;
    Tetris.Block.mesh.position.z = (Tetris.Block.position.z - Tetris.boundingBoxConfig.splitZ / 2) * Tetris.blockSize + Tetris.blockSize / 2;
    Tetris.Block.mesh.rotation = {x:0, y:0, z:0};
    Tetris.Block.mesh.overdraw = true;
	Tetris.Block.mesh.layers.set(VR_layers);
	Tetris.Block.mesh.children["0"].layers.set(VR_layers);
	Tetris.Block.mesh.children["1"].layers.set(VR_layers);
    Tetris.scene.add(Tetris.Block.mesh);
	Tetris.Block.move(0, -1, 0);
	Tetris.Block.move(0, -1, 0);
};


Tetris.Block.rotate = function (x, y, z) {
    Tetris.Block.mesh.rotation.x += x * Math.PI / 180;
    Tetris.Block.mesh.rotation.y += y * Math.PI / 180;
    Tetris.Block.mesh.rotation.z += z * Math.PI / 180;

    var rotationMatrix = new THREE.Matrix4();
 // BKL  rotationMatrix.setRotationFromEuler(Tetris.Block.mesh.rotation);
	rotationMatrix.tetris_setRotationFromEuler(Tetris.Block.mesh.rotation);

    for (var i = 0; i < Tetris.Block.shape.length; i++) {
        Tetris.Block.shape[i] = rotationMatrix.multiplyVector3(
            Tetris.Utils.cloneVector(Tetris.Block.shapes[this.blockType][i])
        );
        Tetris.Utils.roundVector(Tetris.Block.shape[i]);
    }

    if (Tetris.Board.testCollision(false) === Tetris.Board.COLLISION.WALL) {
        Tetris.Block.rotate(-x, -y, -z); // laziness FTW
		Tetris.sounds["collision"].play();
    }

};

Tetris.Block.move = function (x, y, z) {
    Tetris.Block.mesh.position.x += x * Tetris.blockSize;
    Tetris.Block.position.x += x;

    Tetris.Block.mesh.position.y += y * Tetris.blockSize;
    Tetris.Block.position.y += y;

    Tetris.Block.mesh.position.z += z * Tetris.blockSize;
    Tetris.Block.position.z += z;

    var collision = Tetris.Board.testCollision((z != 0));

    if (collision === Tetris.Board.COLLISION.WALL) {
        Tetris.Block.move(-x, -y, 0); // laziness FTW
    }
    if (collision === Tetris.Board.COLLISION.GROUND) {
        Tetris.Block.hitBottom();
        Tetris.sounds["collision"].play();
		Tetris.Board.checkCompleted();		
    } else {
		Tetris.sounds["move"].play();
	}
};

// BKL added this function for better game play
Tetris.Block.moveto = function (x, y, z) {
    Tetris.Block.mesh.position.x += x * Tetris.blockSize;
    Tetris.Block.position.x += x;

    Tetris.Block.mesh.position.y += y * Tetris.blockSize;
    Tetris.Block.position.y += y;

	var collision = Tetris.Board.testCollision((z != 0));
	
	while (collision !== Tetris.Board.COLLISION.GROUND) {
	    Tetris.Block.mesh.position.z += z * Tetris.blockSize;
		Tetris.Block.position.z += z;

		if (collision === Tetris.Board.COLLISION.WALL) {
			Tetris.Block.move(-x, -y, 0); // laziness FTW
			break;
		}
		collision = Tetris.Board.testCollision((z != 0));
	}
			if (collision === Tetris.Board.COLLISION.GROUND) {
				Tetris.Block.hitBottom();
				Tetris.sounds["collision"].play();
				Tetris.Board.checkCompleted();		
			} else {
				Tetris.sounds["move"].play();
			}
};

/**
 * call when hits the floor and should be transformed to static blocks
 */
Tetris.Block.petrify = function () {
    var shape = Tetris.Block.shape;
    for (var i = 0; i < shape.length; i++) {
        Tetris.addStaticBlock(Tetris.Block.position.x + shape[i].x, Tetris.Block.position.y + shape[i].y, Tetris.Block.position.z + shape[i].z);
        Tetris.Board.fields[Tetris.Block.position.x + shape[i].x][Tetris.Block.position.y + shape[i].y][Tetris.Block.position.z + shape[i].z] = Tetris.Board.FIELD.PETRIFIED;
    }
};

Tetris.Block.hitBottom = function () {
    Tetris.Block.petrify();
	// BKL changed to 
 //   Tetris.scene.removeObject(Tetris.Block.mesh);
	Tetris.scene.remove(Tetris.Block.mesh);
    Tetris.Block.generate();
};


