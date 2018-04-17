var fileInput = document.getElementById('stl');
var fReader = new FileReader();

fileInput.onchange = function(e) {
    fReader.readAsArrayBuffer(this.files[0]);
}

fReader.onload = function (e) {
	var result = readSTL (e.target.result);
	var vertices = result[0],
		indices = result[1],
		normals = result[2];

	var center_x = (max_x + min_x)/2;
	var center_y = (max_y + min_y)/2;
	var center_z = (max_z + min_z)/2;

	// TODO: properly calculate normals

	console.log (normals);
	main (vertices, indices, normals, center_x, center_y, center_z);
}

var min_x = 10000000,
	max_x = -10000000,
	min_y  = 10000000,
	max_y = -10000000,
	min_z = 10000000,
	max_z = -10000000;

function readSTL (stl) {
	var vertices = [],
		indices = [],
		normals = [];

	var dv = new DataView (stl, 80); // ignore 80-byte header (assuming binary STL)

	// the second argument of DataView.get*something*32 is a boolean, isLittleEndian (stl files use little endian)
	var numTriangles = dv.getUint32 (0, true);
	console.log (numTriangles);

	var offset = 4; // byte offset

	for (var i = 0; i < numTriangles; i ++) {

		// get normal from first 3 32 bit floats
		// push normals 3 times b/c one normal per vertex is needed, and we create 3 vertices in one loop (see below).
		normals.push (
			dv.getFloat32(offset, true), 
			dv.getFloat32(offset+4, true),
			dv.getFloat32(offset+8, true));
		normals.push (
			dv.getFloat32(offset, true), 
			dv.getFloat32(offset+4, true),
			dv.getFloat32(offset+8, true));
		normals.push (
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

			if (vertX > max_x) {
				max_x = vertX;
			} else if (vertX < min_x) {
				min_x = vertX;
			}
		
			if (vertY > max_y) {
				max_y = vertY;
			} else if (vertY < min_y) {
				min_y = vertY;
			}

			if (vertZ > max_z) {
				max_z = vertZ;
			} else if (vertZ < min_z) {
				min_z = vertZ;
			}
			
			// Add to x, y, and z as a vertex to geometry
			vertices.push (vertX, vertY, vertZ);
			

			// finished getting x, y, and z, move past this vertex
			offset += 12;
		}

		indices.push (i*3, i*3+1, i*3+2);

		// move over 16-bit attribute byte count
		// TODO: read attribute byte count for color
		offset += 2;

	}

	console.log (offset);

	//normals = getAllNormals ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 , 15, 16, 17, 18], [0, 1, 2, 3, 4, 5]);
	//normals = getAllNormals (vertices, indices);

	return [vertices, indices, normals];
}

function getAllNormals (vertices, indices) {
	var groupedVertices = [];
	var normals = [];

	for (var i = 0; i < vertices.length - 2; i += 3) {
		groupedVertices.push ( [vertices[i], vertices[i+1], vertices[i+2]] );
	}

	for (var i = 0; i < indices.length; i += 3) {

		var v1 = new Vector (groupedVertices[i][0], groupedVertices[i][1], groupedVertices[i][2]);
		var v2 = new Vector (groupedVertices[i+1][0], groupedVertices[i+1][1], groupedVertices[i+1][2]);
		var v3 = new Vector (groupedVertices[i+2][0], groupedVertices[i+2][1], groupedVertices[i+2][2]);

		normals = normals.concat ( calculateNormal (v1, v2, v3) );

	}

	return normals;
}

// Calculate surface normals based on pseudo-code from the link below:
// https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal

function calculateNormal (v1, v2, v3) {
	var vecU = v2.subtract (v1);
	var vecV = v3.subtract (v1);

	var normx = (vecU.y * vecV.z) - (vecU.z * vecV.y),
		normy = (vecU.z * vecV.x) - (vecU.x * vecV.z),
		normz = (vecU.x * vecV.y) - (vecU.y * vecV.x);

	return [normx, normy, normz];
}