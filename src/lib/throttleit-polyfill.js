/**
 * Polyfill for throttleit CommonJS module compatibility with ESM
 * throttleit uses module.exports but needs to work with ES6 import syntax
 * 
 * [INPUT]: Uses throttleit CommonJS module
 * [OUTPUT]: Exports throttle function with both named and default exports
 * [POS]: Compatibility layer for CommonJS modules in ESM environment
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// Re-implement throttle function directly to avoid CommonJS/ESM conversion issues
// This matches the throttleit implementation exactly
function throttle(function_, wait) {
  if (typeof function_ !== 'function') {
    throw new TypeError(`Expected the first argument to be a \`function\`, got \`${typeof function_}\`.`);
  }

  let timeoutId;
  let lastCallTime = 0;

  return function throttled(...arguments_) {
    clearTimeout(timeoutId);

    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    const delayForNextCall = wait - timeSinceLastCall;

    if (delayForNextCall <= 0) {
      lastCallTime = now;
      function_.apply(this, arguments_);
    } else {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        function_.apply(this, arguments_);
      }, delayForNextCall);
    }
  };
}

// Export as both named and default for ESM compatibility
export { throttle };
export default throttle;
