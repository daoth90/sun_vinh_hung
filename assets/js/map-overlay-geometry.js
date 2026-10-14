((root) => {
  const radius = 6378137;
  const radians = Math.PI / 180;

  function project({ lat, lng }) {
    return { x: radius * lng * radians, y: -radius * Math.log(Math.tan(Math.PI / 4 + lat * radians / 2)) };
  }

  function unproject({ x, y }) {
    return { lat: (2 * Math.atan(Math.exp(-y / radius)) - Math.PI / 2) / radians, lng: x / radius / radians };
  }

  function dimensions(width, height) {
    if (![width, height].every(value => Number.isFinite(value) && value > 0)) {
      throw new Error('Invalid page dimensions');
    }
  }

  function pageCorners({ center, widthMeters, rotationDegrees }, width, height) {
    dimensions(width, height);
    if (!center || !Number.isFinite(center.lat) || Math.abs(center.lat) > 85 ||
        !Number.isFinite(center.lng) || Math.abs(center.lng) > 180 ||
        !Number.isFinite(widthMeters) || widthMeters <= 0 || !Number.isFinite(rotationDegrees)) {
      throw new Error('Invalid map alignment');
    }
    const origin = project(center);
    // Ground meters differ from Mercator meters by the cosine of latitude.
    const scale = widthMeters / width / Math.cos(center.lat * radians);
    const cos = Math.cos(rotationDegrees * radians);
    const sin = Math.sin(rotationDegrees * radians);
    return [[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => {
      const dx = (x - width / 2) * scale;
      const dy = (y - height / 2) * scale;
      return unproject({ x: origin.x + dx * cos - dy * sin, y: origin.y + dx * sin + dy * cos });
    });
  }

  function pageMatrix([nw, ne, sw], width, height) {
    dimensions(width, height);
    return [(ne.x - nw.x) / width, (ne.y - nw.y) / width,
      (sw.x - nw.x) / height, (sw.y - nw.y) / height, nw.x, nw.y];
  }

  const api = { project, unproject, pageCorners, pageMatrix };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MAP_OVERLAY_GEOMETRY = api;
})(globalThis);
