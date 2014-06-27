define(["require", "exports"], function(require, exports) {
    var source = [
        "varying highp vec4 vColor;",
        "varying highp vec3 vLight;",
        "void main(void)",
        "{",
        "gl_FragColor = vec4(vColor.xyz * vLight, vColor.a);",
        "}"
    ].join('\n');
    
    return source;
});
