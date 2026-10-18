/* Renders a band of gripper rows off the main thread so scrolling stays smooth. */
importScripts("gripper.js");
self.onmessage = function (e) {
  var m = e.data;
  self.postMessage({ frame: m.frame, band: m.band, text: self.GripperASCII.render(m.cols, m.rows, m.angle, m.tilt, m.r0, m.r1) });
};
