var fileInput = document.getElementById('stl');
var fReader = new FileReader();

fileInput.onchange = function(e) {
    fReader.readAsArrayBuffer(this.files[0]);
}

fReader.onload = function (e) {
	var geometry = readSTL (e.target.result);
	THREE.GeometryUtils.center(geometry);
	updateGeo (geometry);
}

function readSTL (stl) {
	var geometry = new THREE.Geometry ();

	var dv = new DataView (stl, 80); // ignore 80-byte header (assuming binary STL)

	// the second argument of DataView.get*something*32 is a boolean, isLittleEndian (stl files use little endian)
	var numTriangles = dv.getUint32 (0, true);
	console.log (numTriangles);

	var offset = 4; // byte offset

	for (var i = 0; i < numTriangles; i ++) {

		// get normal from first 3 32 bit floats
		var normal = THREE.Vector3 (
			dv.getFloat32(offset, true), 
			dv.getFloat32(offset+4, true),
			dv.getFloat32(offset+8, true));

		// move past normal vector
		offset += 12;

		if (offset+8 >= stl.byteLength) {
			break;
		}

		// get vertices' points (x, y, and z) 
		for (var j = 0; j < 3; j ++) {
			var vertX = dv.getFloat32(offset, true);
			var vertY = dv.getFloat32(offset+4, true);
			var vertZ = dv.getFloat32(offset+8, true);
		
			// Add to x, y, and z as a vertex to geometry
			geometry.vertices.push ( new THREE.Vector3(vertX, vertY, vertZ) );
			

			// finished getting x, y, and z, move past this vertex
			offset += 12;
		}

		// move over 16-bit attribute byte count
		// TODO: read attribute byte count for color
		offset += 2;

		geometry.faces.push ( new THREE.Face3 (i*3, i*3+1, i*3+2, normal) );
	}

	console.log (offset);

	return geometry;
}

