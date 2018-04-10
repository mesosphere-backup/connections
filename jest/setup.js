import EventSource from "@dschmidt/eventsourcemock";

Object.defineProperty(window, "EventSource", {
  value: EventSource
});
