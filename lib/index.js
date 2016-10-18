'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.batchedSubscribe = batchedSubscribe;

function batchedSubscribe(batch) {
  if (typeof batch !== 'function') {
    throw new Error('Expected batch to be a function.');
  }

  var currentListeners = [];
  var nextListeners = currentListeners;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  function notifyListeners() {
    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]();
    }
  }

  function notifyListenersBatched() {
    for (var _len = arguments.length, dispatchArgs = Array(_len), _key = 0; _key < _len; _key++) {
      dispatchArgs[_key] = arguments[_key];
    }

    batch.apply(undefined, [notifyListeners].concat(dispatchArgs));
  }

  return function (next) {
    return function () {
      var store = next.apply(undefined, arguments);
      var subscribeImmediate = store.subscribe;

      function dispatch() {
        var res = store.dispatch.apply(store, arguments);
        notifyListenersBatched.apply(undefined, arguments);
        return res;
      }

      return _extends({}, store, {
        dispatch: dispatch,
        subscribe: subscribe,
        subscribeImmediate: subscribeImmediate
      });
    };
  };
}