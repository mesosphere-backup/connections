import AbstractConnection from "./AbstractConnection";
import ConnectionEvent from "./ConnectionEvent";

/**
 * Server Sent Event Connections
 */
export default class SSEConnection extends AbstractConnection {
  /**
   * Initializes an Instance of SSEConnection
   * @constructor
   * @param {string} url – URL to connect to
   * @param {object} [options]
   * @param {boolean} [options.withCredentials=true] – used method
   * @param {array} [options.eventTypes] – eventTypes to listen to
   */
  constructor(url, options = {}) {
    super(url);

    const { withCredentials = false, eventTypes = [] } = options;

    /**
     * @property {string}
     * @protected
     * @name XHRConnection#withCredentials
     */
    Object.defineProperty(this, "withCredentials", { value: withCredentials });

    /**
     * @property {string}
     * @protected
     * @name XHRConnection#eventTypes
     */
    Object.defineProperty(this, "eventTypes", { value: eventTypes });
  }

  /**
   * Opens the connection to the configured URL
   */
  open() {
    if (this.state !== SSEConnection.INIT) {
      return;
    }

    this.source = new window.EventSource(this.url, {
      withCredentials: this.withCredentials
    });

    this.source.onopen = () => {
      this.state = SSEConnection.OPEN;
      this.emit(
        ConnectionEvent.OPEN,
        new ConnectionEvent(this, ConnectionEvent.OPEN)
      );
    };

    this.source.onmessage = response => {
      // only send the responses without a type
      if (response.event) {
        return;
      }
      this.emit(
        ConnectionEvent.DATA,
        new ConnectionEvent(this, ConnectionEvent.DATA, response)
      );
    };

    this.eventTypes.forEach(eventType => {
      this.source.addEventListener(eventType, response => {
        this.emit(
          ConnectionEvent.DATA,
          new ConnectionEvent(this, ConnectionEvent.DATA, response)
        );
      });
    });

    this.source.onerror = error => {
      this.state = SSEConnection.CLOSED;
      this.source.close();
      this.error = error;
      this.emit(
        ConnectionEvent.ERROR,
        new ConnectionEvent(this, ConnectionEvent.ERROR)
      );
    };
  }

  /**
   * Closes the connection
   */
  close() {
    this.state = SSEConnection.CLOSED;
    this.source.close();
    this.emit(
      ConnectionEvent.COMPLETE,
      new ConnectionEvent(this, ConnectionEvent.COMPLETE)
    );
  }
}
