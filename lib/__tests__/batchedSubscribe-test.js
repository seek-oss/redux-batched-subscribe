'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _ = require('../');

var _expect = require('expect');

var _expect2 = _interopRequireDefault(_expect);

function createStoreShape() {
  return {
    dispatch: _expect2['default'].createSpy(),
    subscribe: _expect2['default'].createSpy()
  };
}

function createBatchedStore() {
  var batch = arguments.length <= 0 || arguments[0] === undefined ? function (cb) {
    return cb();
  } : arguments[0];

  var baseStore = createStoreShape();
  var createStore = function createStore() {
    return baseStore;
  };
  var batchedStore = _.batchedSubscribe(batch)(createStore)();
  batchedStore.base = baseStore;

  return batchedStore;
}

describe('batchedSubscribe()', function () {
  it('it calls batch function on dispatch passing through given args.', function () {
    var batchSpy = _expect2['default'].createSpy();
    var store = createBatchedStore(batchSpy);

    store.dispatch({ type: 'foo' });

    _expect2['default'](batchSpy.calls.length).toEqual(1);
    _expect2['default'](batchSpy.calls[0].arguments[1]).toEqual({ type: 'foo' });
  });

  it('batch callback executes listeners', function () {
    var subscribeCallbackSpy = _expect2['default'].createSpy();
    var store = createBatchedStore();

    store.subscribe(subscribeCallbackSpy);
    store.dispatch({ type: 'foo' });

    _expect2['default'](store.base.subscribe.calls.length).toEqual(0);
    _expect2['default'](subscribeCallbackSpy.calls.length).toEqual(1);
  });

  it('it exposes base subscribe as subscribeImmediate', function () {
    var store = createBatchedStore();
    store.subscribeImmediate();

    _expect2['default'](store.base.subscribe.calls.length).toEqual(1);
  });

  it('unsubscribes batch callbacks', function () {
    var subscribeCallbackSpy = _expect2['default'].createSpy();
    var store = createBatchedStore();
    var unsubscribe = store.subscribe(subscribeCallbackSpy);

    unsubscribe();

    store.dispatch({ type: 'foo' });

    _expect2['default'](subscribeCallbackSpy.calls.length).toEqual(0);
  });

  it('should support removing a subscription within a subscription', function () {
    var store = createBatchedStore();

    var listenerA = _expect2['default'].createSpy();
    var listenerB = _expect2['default'].createSpy();
    var listenerC = _expect2['default'].createSpy();

    store.subscribe(listenerA);
    var unSubB = store.subscribe(function () {
      listenerB();
      unSubB();
    });
    store.subscribe(listenerC);

    store.dispatch({});
    store.dispatch({});

    _expect2['default'](listenerA.calls.length).toEqual(2);
    _expect2['default'](listenerB.calls.length).toEqual(1);
    _expect2['default'](listenerC.calls.length).toEqual(2);
  });

  it('only removes listener once when unsubscribe is called', function () {
    var store = createBatchedStore();
    var listenerA = _expect2['default'].createSpy(function () {});
    var listenerB = _expect2['default'].createSpy(function () {});

    var unsubscribeA = store.subscribe(listenerA);
    store.subscribe(listenerB);

    unsubscribeA();
    unsubscribeA();

    store.dispatch({ type: 'foo' });
    _expect2['default'](listenerA.calls.length).toBe(0);
    _expect2['default'](listenerB.calls.length).toBe(1);
  });

  it('delays unsubscribe until the end of current dispatch', function () {
    var store = createBatchedStore();

    var unsubscribeHandles = [];
    var doUnsubscribeAll = function doUnsubscribeAll() {
      return unsubscribeHandles.forEach(function (unsubscribe) {
        return unsubscribe();
      });
    };

    var listener1 = _expect2['default'].createSpy(function () {});
    var listener2 = _expect2['default'].createSpy(function () {});
    var listener3 = _expect2['default'].createSpy(function () {});

    unsubscribeHandles.push(store.subscribe(function () {
      return listener1();
    }));
    unsubscribeHandles.push(store.subscribe(function () {
      listener2();
      doUnsubscribeAll();
    }));

    unsubscribeHandles.push(store.subscribe(function () {
      return listener3();
    }));

    store.dispatch({ type: 'foo' });
    _expect2['default'](listener1.calls.length).toBe(1);
    _expect2['default'](listener2.calls.length).toBe(1);
    _expect2['default'](listener3.calls.length).toBe(1);

    store.dispatch({ type: 'foo' });
    _expect2['default'](listener1.calls.length).toBe(1);
    _expect2['default'](listener2.calls.length).toBe(1);
    _expect2['default'](listener3.calls.length).toBe(1);
  });

  it('delays subscribe until the end of current dispatch', function () {
    var store = createBatchedStore();

    var listener1 = _expect2['default'].createSpy(function () {});
    var listener2 = _expect2['default'].createSpy(function () {});
    var listener3 = _expect2['default'].createSpy(function () {});

    var listener3Added = false;
    var maybeAddThirdListener = function maybeAddThirdListener() {
      if (!listener3Added) {
        listener3Added = true;
        store.subscribe(function () {
          return listener3();
        });
      }
    };

    store.subscribe(function () {
      return listener1();
    });
    store.subscribe(function () {
      listener2();
      maybeAddThirdListener();
    });

    store.dispatch({ type: 'foo' });
    _expect2['default'](listener1.calls.length).toBe(1);
    _expect2['default'](listener2.calls.length).toBe(1);
    _expect2['default'](listener3.calls.length).toBe(0);

    store.dispatch({ type: 'foo' });
    _expect2['default'](listener1.calls.length).toBe(2);
    _expect2['default'](listener2.calls.length).toBe(2);
    _expect2['default'](listener3.calls.length).toBe(1);
  });

  it('uses the last snapshot of subscribers during nested dispatch', function () {
    var store = createBatchedStore();

    var listener1 = _expect2['default'].createSpy(function () {});
    var listener2 = _expect2['default'].createSpy(function () {});
    var listener3 = _expect2['default'].createSpy(function () {});
    var listener4 = _expect2['default'].createSpy(function () {});

    var unsubscribe4 = undefined;
    var unsubscribe1 = store.subscribe(function () {
      listener1();
      _expect2['default'](listener1.calls.length).toBe(1);
      _expect2['default'](listener2.calls.length).toBe(0);
      _expect2['default'](listener3.calls.length).toBe(0);
      _expect2['default'](listener4.calls.length).toBe(0);

      unsubscribe1();
      unsubscribe4 = store.subscribe(listener4);
      store.dispatch({ type: 'foo' });

      _expect2['default'](listener1.calls.length).toBe(1);
      _expect2['default'](listener2.calls.length).toBe(1);
      _expect2['default'](listener3.calls.length).toBe(1);
      _expect2['default'](listener4.calls.length).toBe(1);
    });

    store.subscribe(listener2);
    store.subscribe(listener3);

    store.dispatch({ type: 'foo' });
    _expect2['default'](listener1.calls.length).toBe(1);
    _expect2['default'](listener2.calls.length).toBe(2);
    _expect2['default'](listener3.calls.length).toBe(2);
    _expect2['default'](listener4.calls.length).toBe(1);

    unsubscribe4();
    store.dispatch({ type: 'foo' });
    _expect2['default'](listener1.calls.length).toBe(1);
    _expect2['default'](listener2.calls.length).toBe(3);
    _expect2['default'](listener3.calls.length).toBe(3);
    _expect2['default'](listener4.calls.length).toBe(1);
  });

  it('should throw for invalid batch callback', function () {
    _expect2['default'](function () {
      _.batchedSubscribe(null);
    }).toThrow(Error);

    _expect2['default'](function () {
      _.batchedSubscribe(undefined);
    }).toThrow(Error);

    _expect2['default'](function () {
      _.batchedSubscribe('foo');
    }).toThrow(Error);
  });

  it('throws if listener is not a function', function () {
    var store = createBatchedStore();

    _expect2['default'](function () {
      return store.subscribe();
    }).toThrow();

    _expect2['default'](function () {
      return store.subscribe('');
    }).toThrow();

    _expect2['default'](function () {
      return store.subscribe(null);
    }).toThrow();

    _expect2['default'](function () {
      return store.subscribe(undefined);
    }).toThrow();
  });
});