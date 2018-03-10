// Vector class used to calculate normals
function Vector (x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
}

Vector.prototype.subtract = function(vec) {
	return new Vector (this.x - vec.x, this.y - vec.y, this.z - vec.z);
};