// Super-chainable library for eagles
import eagle = require('eagle');

eagle.soar();

// Call directly
eagle('bald').fly();
// Invoke with new
// The type checker gets confused here. Clearly eagls is a named type,
// so it must refer to the interface. It partially gets things right
// but then messes up the argument type.
var eddie = new eagle(1000);
// Set properties
eagle.favorite = 'golden';