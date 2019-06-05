var renderer	= new THREE.WebGLRenderer({
	// antialias	: true,
	alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.domElement.style.position = 'absolute'
renderer.domElement.style.top = '0px'
renderer.domElement.style.left = '0px'
document.body.appendChild( renderer.domElement );
var onRenderFcts= [];
// init scene and camera
var scene	= new THREE.Scene();

var camera = new THREE.Camera();
scene.add(camera);
////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////
var arToolkitSource = new THREEx.ArToolkitSource({
	sourceType : 'webcam',
})
arToolkitSource.init(function onReady(){
	onResize()
})

// handle resize
window.addEventListener('resize', function(){
	onResize()
});

function onResize(){
	arToolkitSource.onResize()	
	arToolkitSource.copySizeTo(renderer.domElement)	
	if( arToolkitContext.arController !== null ){
		arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)	
	}	
}
////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////

// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
	cameraParametersUrl: 'assets/camera_para.dat',
	detectionMode: 'mono',
	maxDetectionRate: 30,
	canvasWidth: 80*3,
	canvasHeight: 60*3,
})
// initialize it
arToolkitContext.init(function onCompleted(){
	// copy projection matrix to camera
	camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
})
// update artoolkit on every frame
onRenderFcts.push(function(){
	if( arToolkitSource.ready === false )	return
	arToolkitContext.update( arToolkitSource.domElement )
})


////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

// var markerRoot = new THREE.Group
// scene.add(markerRoot)
// var artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
// 	type : 'pattern',
// 	patternUrl : 'assets/speed-thin.patt'
// });

// build a smoothedControls
var smoothedRoot = new THREE.Group()
scene.add(smoothedRoot)
var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
	lerpPosition: 0.4,
	lerpQuaternion: 0.3,
	lerpScale: 1,
});

// build markerControls
function createMarker( name, scene, mesh, patternUrl ){
	var markerRoot = new THREE.Group();
	markerRoot.name = name;
	scene.add( markerRoot );
	var markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
		type : 'pattern',
		patternUrl : 'assets/' + patternUrl
	});
	markerRoot.add( mesh );

	onRenderFcts.push(function(){
		smoothedControls.update(markerRoot)
	});
}

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////
// var arWorldRoot = smoothedRoot
var geometry	= new THREE.CubeGeometry(1,1,1);
var material	= new THREE.MeshNormalMaterial({
	transparent : true,
	opacity: 0.5,
	side: THREE.DoubleSide
}); 
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= geometry.parameters.height/2
createMarker( 'speed', scene, mesh,  'speed.patt' );

var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
var material	= new THREE.MeshNormalMaterial(); 
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= 0.5
createMarker( 'experimentation', scene, mesh,  'experimentation.patt' );

var geometry	= new THREE.SphereGeometry( 1, 32, 32 );
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= 0.5;
createMarker( 'connection', scene, mesh, 'connection.patt' );

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////
var stats = new Stats();
document.body.appendChild( stats.dom );

// render the scene
onRenderFcts.push(function(){
	renderer.render( scene, camera );
	stats.update();
})
// run the rendering loop
var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
	// keep looping
	requestAnimationFrame( animate );
	// measure time
	lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
	var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
	lastTimeMsec	= nowMsec
	// call each update function
	onRenderFcts.forEach(function(onRenderFct){
		onRenderFct(deltaMsec/1000, nowMsec/1000)
	})
});
