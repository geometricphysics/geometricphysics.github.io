var meter = Blade.UNIT_METER;
var kilogram = Blade.UNIT_KILOGRAM;
var second = Blade.UNIT_SECOND;

var speed = meter.div(second);

console.log("" + speed);

var e1 = new Blade.Euclidean2(0,1,0,0);
var e2 = new Blade.Euclidean2(0,0,1,0);

console.log("" + e1);

// We don't get type checking of the quantity as per TypeScript issue.
var i = new Blade.Measure<Blade.Euclidean2>(e1, meter);
var j = new Blade.Measure<Blade.Euclidean2>(e2, meter);

console.log("" + i.wedge(j))