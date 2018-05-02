import { sources } from "eventsourcemock";
import SSEConnection from "../SSEConnection";
import ConnectionEvent from "../ConnectionEvent";

const url = "https://mesosphere.com";

describe("Server Sent Event Connection", () => {
  let connection;
  beforeEach(() => {
    connection = new SSEConnection(url, { eventTypes: ["myType"] });
  });

  describe("#constructor", () => {
    it("fails without an url", () => {
      expect(() => {
        new SSEConnection();
      }).toThrowError();
    });
  });

  describe("#open", () => {
    it("opens a connection", () => {
      const onOpenEventMock = jest.fn();
      expect(connection.state).toBe(SSEConnection.INIT);
      connection.addListener(ConnectionEvent.OPEN, onOpenEventMock);

      connection.open();
      sources[url].emitOpen();

      expect(sources[url].readyState).toBe(1);
      expect(connection.state).toBe(SSEConnection.OPEN);
      expect(onOpenEventMock).toHaveBeenCalled();
    });

    it("uses the config options", () => {
      connection = new SSEConnection(url, {
        withCredentials: true
      });
      connection.open();

      expect(sources[url].withCredentials).toBe(true);
    });
  });

  describe("on message handling", () => {
    const msg = { data: "My message from the server" };
    it("emits DATA event on untyped message", () => {
      const onEventMock = jest.fn();
      connection.open();
      sources[url].emitOpen();
      connection.addListener(ConnectionEvent.DATA, onEventMock);

      sources[url].emitMessage(msg);

      expect(onEventMock).toHaveBeenCalled();
      expect(onEventMock.mock.calls[0][0].payload).toEqual(msg);
    });
    it("emits DATA event on known typed message", () => {
      const onEventMock = jest.fn();
      connection.open();
      sources[url].emitOpen();

      connection.addListener(ConnectionEvent.DATA, onEventMock);
      sources[url].emit("myType", msg);
      expect(onEventMock).toHaveBeenCalledTimes(1);
      expect(onEventMock.mock.calls[0][0].payload).toEqual(msg);
    });
    it("doesnt emit DATA event on unknown typed message", () => {
      const onEventMock = jest.fn();
      connection.open();
      sources[url].emitOpen();

      connection.addListener(ConnectionEvent.DATA, onEventMock);
      sources[url].emit("unknownType", msg);
      expect(onEventMock).not.toHaveBeenCalled();
    });
  });

  describe("on error", () => {
    beforeEach(() => {
      connection.open();
      sources[url].emitOpen();
    });

    it("invokes listener", () => {
      const onErrorEventMock = jest.fn();
      connection.addListener(ConnectionEvent.ERROR, onErrorEventMock);

      sources[url].emitError(new Error("Something went wrong"));

      expect(onErrorEventMock).toHaveBeenCalled();
    });

    it("sets state to closed", () => {
      sources[url].emitError(new Error("Something went wrong"));
      expect(connection.state).toBe(SSEConnection.CLOSED);
    });

    it("closes the connection", () => {
      sources[url].emitError(new Error("Something went wrong"));
      expect(sources[url].readyState).toBe(2);
    });

    it("provides access to the error", () => {
      const err = new Error("Something went wrong");
      sources[url].emitError(err);
      expect(connection.error).toBe(err);
    });
  });

  describe("#close", () => {
    beforeEach(() => {
      connection.open();
      sources[url].emitOpen();
    });

    it("closes the connection", () => {
      connection.close();
      expect(sources[url].readyState).toBe(2);
    });

    it("sets state to closed", () => {
      connection.close();
      expect(connection.state).toBe(SSEConnection.CLOSED);
    });

    it("emits a complete event", () => {
      const onCompleteEventMock = jest.fn();
      connection.addListener(ConnectionEvent.COMPLETE, onCompleteEventMock);
      connection.close();
      expect(onCompleteEventMock).toHaveBeenCalled();
    });
  });
});
