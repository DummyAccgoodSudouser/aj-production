// ---------- DOT-MATRIX HOLOGRAPHIC GLOBE ----------
// Renders a rotating, dotted wireframe Earth (continents made of dots)
// on a <canvas>, no external images/textures required.

(function () {
  const canvas = document.getElementById('earthCanvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const SIZE = canvas.width; // logical square size (560)
  canvas.width = SIZE * DPR;
  canvas.height = SIZE * DPR;
  ctx.scale(DPR, DPR);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const radius = SIZE / 2 - 6;

  // ---- simplified world landmasses, as [lon, lat] polygons (low-poly) ----
  const LAND = [
    // Africa
    [[-9,36],[10,37],[20,33],[32,31],[43,12],[51,12],[45,2],[40,-1],[35,-20],
     [26,-33],[20,-34],[15,-27],[12,-18],[9,4],[2,6],[-4,5],[-11,7],[-17,15],[-9,36]],
    // Europe mainland
    [[-9,43],[3,43],[9,44],[13,38],[15,41],[15,45],[20,42],[28,45],[30,55],
     [40,50],[38,60],[30,60],[24,66],[11,58],[8,55],[5,51],[2,51],[-5,48],[-9,43]],
    // Britain & Ireland
    [[-8,51],[-6,52],[-6,55],[-5,58],[-3,58],[-1,54],[-2,51],[-5,50],[-8,51]],
    // Scandinavia
    [[5,58],[11,58],[19,63],[24,66],[29,69],[20,71],[12,66],[5,62],[5,58]],
    // Arabian Peninsula
    [[35,29],[42,30],[48,30],[58,22],[52,15],[44,13],[35,29]],
    // Central / North Asia + Siberia
    [[28,55],[40,50],[45,40],[55,45],[60,50],[70,55],[85,52],[95,55],[110,55],
     [130,60],[140,60],[140,73],[110,73],[80,73],[60,70],[45,66],[30,60],[28,55]],
    // India
    [[68,24],[72,22],[78,8],[82,12],[88,22],[86,26],[78,30],[70,30],[68,24]],
    // China / SE Asia
    [[95,29],[100,40],[122,40],[122,30],[112,22],[105,10],[98,16],[92,25],[95,29]],
    // Japan (tiny)
    [[130,32],[133,34],[140,38],[142,43],[138,40],[132,35],[130,32]],
    // North America
    [[-165,65],[-150,70],[-125,70],[-95,70],[-80,58],[-75,45],[-70,42],
     [-80,25],[-97,18],[-105,20],[-115,30],[-124,40],[-125,49],[-140,60],[-165,65]],
    // Greenland
    [[-55,60],[-45,60],[-25,70],[-40,83],[-60,75],[-55,60]],
    // South America
    [[-80,10],[-60,10],[-50,0],[-35,-6],[-38,-13],[-40,-23],[-48,-25],
     [-57,-35],[-67,-45],[-72,-18],[-80,-5],[-80,10]],
    // Australia
    [[113,-22],[122,-18],[132,-12],[142,-11],[145,-17],[153,-28],[150,-35],
     [138,-38],[130,-32],[115,-35],[113,-22]],
  ];

  function pointInPolygon(lon, lat, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function isLand(lon, lat) {
    for (let p = 0; p < LAND.length; p++) {
      if (pointInPolygon(lon, lat, LAND[p])) return true;
    }
    return false;
  }

  // ---- precompute a fixed lon/lat dot grid, tagged land vs ocean ----
  const STEP = 3.6; // degrees between dots (land) — denser, matches reference
  const OCEAN_STEP = 6;
  const landPoints = [];
  const oceanPoints = [];

  for (let lat = -88; lat <= 88; lat += STEP) {
    // shrink longitude step near poles so dots don't bunch up
    const rowStep = STEP / Math.max(0.18, Math.cos(lat * Math.PI / 180));
    for (let lon = -180; lon < 180; lon += rowStep) {
      if (isLand(lon, lat)) landPoints.push([lon, lat]);
    }
  }
  for (let lat = -85; lat <= 85; lat += OCEAN_STEP) {
    const rowStep = OCEAN_STEP / Math.max(0.2, Math.cos(lat * Math.PI / 180));
    for (let lon = -180; lon < 180; lon += rowStep) {
      if (!isLand(lon, lat)) oceanPoints.push([lon, lat]);
    }
  }

  let rotation = -20; // starting longitude offset, framed like the reference (Europe/Africa facing)
  const tilt = 18 * Math.PI / 180; // slight axial tilt for depth

  function project(lon, lat, rotDeg) {
    const phi = lat * Math.PI / 180;
    const theta = (lon + rotDeg) * Math.PI / 180;
    let x = Math.cos(phi) * Math.sin(theta);
    let y = Math.sin(phi);
    let z = Math.cos(phi) * Math.cos(theta);
    // apply slight tilt around X axis
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
    const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    return { x, y: y2, z: z2 };
  }

  function drawPoints(points, rotDeg, isLandSet) {
    for (let i = 0; i < points.length; i++) {
      const [lon, lat] = points[i];
      const p = project(lon, lat, rotDeg);
      if (p.z <= 0.02) continue; // back of sphere, skip
      const sx = cx + p.x * radius;
      const sy = cy - p.y * radius;
      const shade = Math.pow(p.z, 1.3); // limb darkening
      const size = isLandSet ? (1.15 + shade * 1.15) : (0.7 + shade * 0.7);
      const alpha = isLandSet ? (0.25 + shade * 0.7) : (0.08 + shade * 0.28);
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      if (isLandSet) {
        ctx.fillStyle = `rgba(120,255,205,${alpha.toFixed(3)})`;
      } else {
        ctx.fillStyle = `rgba(70,180,190,${alpha.toFixed(3)})`;
      }
      ctx.fill();
    }
  }

  function drawSphereBase(rotDeg) {
    // subtle inner sphere shading so the dots read as a solid globe
    const grad = ctx.createRadialGradient(
      cx - radius * 0.35, cy - radius * 0.35, radius * 0.1,
      cx, cy, radius * 1.05
    );
    grad.addColorStop(0, 'rgba(20,60,55,0.55)');
    grad.addColorStop(0.7, 'rgba(6,16,18,0.75)');
    grad.addColorStop(1, 'rgba(3,8,10,0.9)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  let lastT = 0;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(t) {
    if (!lastT) lastT = t;
    const dt = t - lastT;
    lastT = t;
    if (!reduceMotion) rotation += dt * 0.006; // slow steady spin

    ctx.clearRect(0, 0, SIZE, SIZE);
    drawSphereBase(rotation);
    drawPoints(oceanPoints, rotation, false);
    drawPoints(landPoints, rotation, true);

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
  if (reduceMotion) {
    // draw a single static frame
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawSphereBase(rotation);
    drawPoints(oceanPoints, rotation, false);
    drawPoints(landPoints, rotation, true);
  }
})();
