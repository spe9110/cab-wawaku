import NodeCache from "node-cache";

// stdTTL - the standard ttl as number in seconds for every generated cache element. 
// checkperiod - The period in seconds, as a number, used for the automatic delete check interval.
const cache = new NodeCache({
  stdTTL: 100, // default TTL: 100 seconds
  checkperiod: 120, // check expired keys every 2 minutes
});

export default cache;
