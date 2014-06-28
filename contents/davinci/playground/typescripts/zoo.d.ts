/**
 * This (internal) module provides the usage:
 *
 * zoo.open()
 */

// This example only works if we use the declare keyword on the internal module.
declare module zoo {
  function open(): void;
}

/**
 * This (external) module provides the usage:
 *
 * import x = require('zoo');
 */
declare module "zoo" {
    export = zoo;
}
