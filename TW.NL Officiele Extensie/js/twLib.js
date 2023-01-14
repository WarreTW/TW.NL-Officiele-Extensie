/**** TribalWarsLibrary.js ****/
if (typeof window.twLib === 'undefined') {
  window.twLib = {
    queues: null,
    init: function() {
      if (this.queues === null) {
        this.queues = this.queueLib.createQueues(5);
      }
    },
    queueLib: {
      maxAttempts: 3,
      Item: function (action, arg, promise = null) {
        this.action = action;
        this.arguments = arg;
        this.promise = promise;
        this.attempts = 0;
      },
      Queue: function() {
        this.list = [];
        this.working = false;
        this.length = 0;

        this.doNext = function () {
          let item = this.dequeue();
          let self = this;

          if (item.action == 'openWindow') {
            window.open(...item.arguments).addEventListener('DOMContentLoaded', function() {
              self.start();
            });
          } else {
            $[item.action](...item.arguments).done(function () {
              item.promise.resolve.apply(null, arguments);
              self.start();
            }).fail(function () {
              item.attempts += 1;
              if (item.attempts < twLib.queueLib.maxAttempts) {
                self.enqueue(item, true);
              } else {
                item.promise.reject.apply(null, arguments);
              }

              self.start();
            });
          }
        };

        this.start = function () {
          if (this.length) {
            this.working = true;
            this.doNext();
          } else {
            this.working = false;
          }
        };

        this.dequeue = function () {
          this.length -= 1;
          return this.list.shift();
        };

        this.enqueue = function (item, front = false) {
          (front) ? this.list.unshift(item) : this.list.push(item);
          this.length += 1;

          if (!this.working) {
            this.start();
          }
        };
      },
      createQueues: function(amount) {
        let arr = [];

        for (let i = 0; i < amount; i++) {
          arr[i] = new twLib.queueLib.Queue();
        }

        return arr;
      },
      addItem: function(item) {
        let leastBusyQueue = twLib.queues.map(q => q.length).reduce((next, curr) => (curr < next) ? curr : next, 0);
        twLib.queues[leastBusyQueue].enqueue(item);
      },
      orchestrator: function(type, arg) {
        let promise = $.Deferred();
        let item = new twLib.queueLib.Item(type, arg, promise);

        twLib.queueLib.addItem(item);

        return promise;
      }
    },
    ajax: function() {
      return twLib.queueLib.orchestrator('ajax', arguments);
    },
    get: function() {
      return twLib.queueLib.orchestrator('get', arguments);
    },
    post: function() {
      return twLib.queueLib.orchestrator('post', arguments);
    },
    openWindow: function() {
      let item = new twLib.queueLib.Item('openWindow', arguments);

      twLib.queueLib.addItem(item);
    }
  };

  twLib.init();
}
