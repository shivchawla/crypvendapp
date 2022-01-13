'use strict'

Error.stackTraceLimit = 50

// TODO: go through code and take out all evil throws
// require('./logging')

var Brain = require('../../lib/brain');
var Configuration = require('../../lib/configuration.js');

var config = Configuration.loadConfig();
var brain = new Brain(config);
 
async function serverStart() {
  console.log("Calling: Start Brain");
  await brain.run();
};

export default brain;
export { serverStart }; 
