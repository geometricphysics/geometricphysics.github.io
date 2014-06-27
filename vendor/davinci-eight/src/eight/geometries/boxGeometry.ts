import geometry = require('eight/core/geometry');
import vectorE3 = require('eight/math/e3ga/vectorE3');

var vertexList: any[] =
    [
        // front face
        vectorE3(-0.5, -0.5, +0.5),
        vectorE3(+0.5, -0.5, +0.5),
        vectorE3(+0.5, +0.5, +0.5),
        vectorE3(-0.5, +0.5, +0.5),

        // rear face
        vectorE3(-0.5, -0.5, -0.5),
        vectorE3(+0.5, -0.5, -0.5),
        vectorE3(+0.5, +0.5, -0.5),
        vectorE3(-0.5, +0.5, -0.5)
    ];

var triangles =
    [
        // front
        [0, 1, 2],
        [0, 2, 3],
        // rear
        [4, 7, 5],
        [5, 7, 6],
        // left
        [0, 7, 4],
        [0, 3, 7],
        // right
        [1, 5, 2],
        [2, 5, 6],
        // top
        [2, 7, 3],
        [2, 6, 7],
        // bottom
        [0, 5, 1],
        [0, 4, 5]
    ];

var boxGeometry = function(spec?) {

    var base = geometry(spec);
    
    var api = {
        triangles: triangles,
        vertices: [],
        normals: [],
        colors: []
    };

    for (var t = 0; t < triangles.length; t++) {
        var triangle = triangles[t];

        // Normals will be the same for each vertex of a triangle.
        var v0 = vertexList[triangle[0]];
        var v1 = vertexList[triangle[1]];
        var v2 = vertexList[triangle[2]];

        var perp = v1.sub(v0).cross(v2.sub(v0));
        var normal = perp.div(perp.norm());

        for (var j = 0; j < 3; j++) {
            api.vertices.push(vertexList[triangle[j]].x);
            api.vertices.push(vertexList[triangle[j]].y);
            api.vertices.push(vertexList[triangle[j]].z);

            api.normals.push(normal.x);
            api.normals.push(normal.y);
            api.normals.push(normal.z);

            api.colors.push(0.0);
            api.colors.push(0.0);
            api.colors.push(1.0);
        }
    }
    return api;
};

export = boxGeometry;
