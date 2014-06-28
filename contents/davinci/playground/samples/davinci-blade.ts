console.log(blade.VERSION);

var meter = blade.UNIT_METER;
var kilogram = blade.UNIT_KILOGRAM;
var second = blade.UNIT_SECOND;

var speed = meter.div(second);

console.log("" + speed);

var e1 = new blade.Euclidean2(0,1,0,0);
var e2 = new blade.Euclidean2(0,0,1,0);

console.log("" + e1);

// We don't get type checking of the quantity as per TypeScript issue.
var i = new blade.Measure<blade.Euclidean2>(e1, meter);
var j = new blade.Measure<blade.Euclidean2>(e2, meter);

console.log("" + i.wedge(j))