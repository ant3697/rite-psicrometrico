/**
 * Coordinate mapping and exact saturation line intersection helpers
 * for FlyCarpet Carrier and Mollier psychrometric diagrams.
 */

// Exact 100% saturation curve points extracted from FlyCarpetCarrierDiagram.tsx
export const CARRIER_SAT_PTS: [number, number][] = [
  [67.8, 561.1],
  [70.3, 560.6],
  [72.8, 560.0],
  [75.3, 559.5],
  [77.8, 558.9],
  [80.3, 558.4],
  [82.8, 557.8],
  [85.3, 557.3],
  [87.8, 556.7],
  [90.3, 556.1],
  [92.8, 555.5],
  [95.3, 554.9],
  [97.8, 554.3],
  [100.3, 553.6],
  [102.8, 553.0],
  [105.2, 552.3],
  [107.7, 551.7],
  [110.2, 551.0],
  [112.7, 550.3],
  [115.2, 549.6],
  [117.7, 548.9],
  [120.2, 548.2],
  [122.7, 547.5],
  [125.2, 546.8],
  [127.7, 546.0],
  [130.1, 545.2],
  [132.6, 544.5],
  [135.1, 543.7],
  [137.6, 542.9],
  [140.1, 542.1],
  [142.6, 541.2],
  [145.1, 540.4],
  [147.6, 539.6],
  [150.0, 538.7],
  [152.5, 537.8],
  [155.0, 536.9],
  [157.5, 536.0],
  [160.0, 535.1],
  [162.5, 534.2],
  [164.9, 533.2],
  [167.4, 532.3],
  [169.9, 531.3],
  [172.4, 530.3],
  [174.9, 529.3],
  [177.3, 528.3],
  [179.8, 527.2],
  [182.3, 526.2],
  [184.8, 525.1],
  [187.2, 524.0],
  [189.7, 522.9],
  [192.2, 521.8],
  [194.7, 520.8],
  [197.2, 519.8],
  [199.7, 518.7],
  [202.1, 517.7],
  [204.6, 516.6],
  [207.1, 515.6],
  [209.6, 514.5],
  [212.1, 513.4],
  [214.5, 512.3],
  [217.0, 511.1],
  [219.5, 510.0],
  [222.0, 508.8],
  [224.5, 507.7],
  [226.9, 506.5],
  [229.4, 505.3],
  [231.9, 504.1],
  [234.4, 502.8],
  [236.9, 501.6],
  [239.3, 500.3],
  [241.8, 499.0],
  [244.3, 497.7],
  [246.8, 496.4],
  [249.3, 495.1],
  [251.7, 493.7],
  [254.2, 492.4],
  [256.7, 491.0],
  [259.2, 489.6],
  [261.6, 488.2],
  [264.1, 486.7],
  [266.6, 485.3],
  [269.1, 483.8],
  [271.5, 482.3],
  [274.0, 480.8],
  [276.5, 479.3],
  [279.0, 477.7],
  [281.4, 476.2],
  [283.9, 474.6],
  [286.4, 473.0],
  [288.9, 471.4],
  [291.3, 469.7],
  [293.8, 468.0],
  [296.3, 466.4],
  [298.7, 464.7],
  [301.2, 462.9],
  [303.7, 461.2],
  [306.2, 459.4],
  [308.6, 457.6],
  [311.1, 455.8],
  [313.6, 454.0],
  [316.0, 452.1],
  [318.5, 450.2],
  [321.0, 448.3],
  [323.5, 446.4],
  [325.9, 444.4],
  [328.4, 442.5],
  [330.9, 440.5],
  [333.3, 438.4],
  [335.8, 436.4],
  [338.3, 434.3],
  [340.7, 432.2],
  [343.2, 430.1],
  [345.7, 427.9],
  [348.1, 425.8],
  [350.6, 423.6],
  [353.1, 421.3],
  [355.5, 419.1],
  [358.0, 416.8],
  [360.5, 414.5],
  [363.0, 412.2],
  [365.4, 409.8],
  [367.9, 407.4],
  [370.4, 405.0],
  [372.8, 402.5],
  [375.3, 400.1],
  [377.8, 397.6],
  [380.2, 395.0],
  [382.7, 392.5],
  [385.2, 389.9],
  [387.6, 387.2],
  [390.1, 384.6],
  [392.6, 381.9],
  [395.0, 379.2],
  [397.5, 376.4],
  [400.0, 373.6],
  [402.4, 370.8],
  [404.9, 368.0],
  [407.4, 365.1],
  [409.8, 362.2],
  [412.3, 359.2],
  [414.8, 356.2],
  [417.2, 353.2],
  [419.7, 350.2],
  [422.2, 347.1],
  [424.6, 343.9],
  [427.1, 340.8],
  [429.6, 337.6],
  [432.0, 334.3],
  [434.5, 331.1],
  [437.0, 327.8],
  [439.5, 324.4],
  [441.9, 321.0],
  [444.4, 317.6],
  [446.9, 314.1],
  [449.3, 310.6],
  [451.8, 307.1],
  [454.3, 303.5],
  [456.7, 299.9],
  [459.2, 296.2],
  [461.7, 292.5],
  [464.2, 288.7],
  [466.6, 284.9],
  [469.1, 281.1],
  [471.6, 277.2],
  [474.1, 273.3],
  [476.5, 269.3],
  [479.0, 265.3],
  [481.5, 261.2],
  [484.0, 257.1],
  [486.4, 253.0],
  [488.9, 248.8],
  [491.4, 244.5],
  [493.9, 240.2],
  [496.3, 235.9],
  [498.8, 231.5],
  [501.3, 227.0],
  [503.8, 222.6],
  [506.3, 218.0],
  [508.8, 213.4],
  [511.2, 208.8],
  [513.7, 204.1],
  [516.2, 199.3],
  [518.7, 194.5],
  [521.2, 189.7],
  [523.7, 184.8],
  [526.2, 179.8],
  [528.6, 174.8],
  [531.1, 169.7],
  [533.6, 164.6],
  [536.1, 159.4],
  [538.6, 154.1],
  [541.1, 148.8],
  [543.6, 143.4],
  [546.1, 138.0],
  [548.6, 132.5],
  [551.1, 127.0],
  [553.6, 121.4],
  [556.1, 115.7],
  [558.6, 110.0],
  [561.1, 104.2],
  [563.6, 98.3],
  [566.1, 92.4],
  [568.6, 86.4],
  [571.1, 80.3],
  [573.6, 74.2],
  [576.1, 68.0],
  [578.7, 61.8],
  [581.2, 55.4],
  [583.3, 50.0],
];

// Exact saturation curve points extracted from FlyCarpetMollierDiagram.tsx
export const MOLLIER_SAT_PTS: [number, number][] = [
  [110.7, 591.6],
  [111.4, 589.8],
  [112.2, 588.0],
  [112.9, 586.2],
  [113.7, 584.5],
  [114.5, 582.7],
  [115.3, 580.9],
  [116.1, 579.1],
  [116.9, 577.4],
  [117.7, 575.6],
  [118.6, 573.8],
  [119.4, 572.1],
  [120.3, 570.3],
  [121.2, 568.5],
  [122.1, 566.7],
  [123.0, 565.0],
  [123.9, 563.2],
  [124.9, 561.4],
  [125.8, 559.7],
  [126.8, 557.9],
  [127.8, 556.1],
  [128.8, 554.4],
  [129.8, 552.6],
  [130.9, 550.8],
  [131.9, 549.1],
  [133.0, 547.3],
  [134.1, 545.5],
  [135.2, 543.8],
  [136.3, 542.0],
  [137.5, 540.2],
  [138.6, 538.5],
  [139.8, 536.7],
  [141.0, 534.9],
  [142.2, 533.2],
  [143.4, 531.4],
  [144.7, 529.6],
  [146.0, 527.9],
  [147.3, 526.1],
  [148.6, 524.3],
  [149.9, 522.6],
  [151.3, 520.8],
  [152.6, 519.1],
  [154.0, 517.3],
  [155.4, 515.5],
  [156.9, 513.8],
  [158.3, 512.0],
  [159.8, 510.3],
  [161.3, 508.5],
  [162.9, 506.7],
  [164.4, 505.0],
  [166.0, 503.2],
  [167.4, 501.5],
  [168.8, 499.7],
  [170.3, 497.9],
  [171.8, 496.2],
  [173.3, 494.4],
  [174.8, 492.6],
  [176.3, 490.9],
  [177.8, 489.1],
  [179.4, 487.4],
  [181.0, 485.6],
  [182.6, 483.8],
  [184.2, 482.1],
  [185.9, 480.3],
  [187.5, 478.5],
  [189.2, 476.8],
  [191.0, 475.0],
  [192.7, 473.3],
  [194.4, 471.5],
  [196.2, 469.7],
  [198.0, 468.0],
  [199.9, 466.2],
  [201.7, 464.5],
  [203.6, 462.7],
  [205.5, 460.9],
  [207.4, 459.2],
  [209.3, 457.4],
  [211.3, 455.7],
  [213.3, 453.9],
  [215.3, 452.2],
  [217.4, 450.4],
  [219.4, 448.6],
  [221.5, 446.9],
  [223.7, 445.1],
  [225.8, 443.4],
  [228.0, 441.6],
  [230.2, 439.8],
  [232.4, 438.1],
  [234.7, 436.3],
  [237.0, 434.6],
  [239.3, 432.8],
  [241.6, 431.1],
  [244.0, 429.3],
  [246.4, 427.6],
  [248.8, 425.8],
  [251.3, 424.0],
  [253.8, 422.3],
  [256.3, 420.5],
  [258.9, 418.8],
  [261.5, 417.0],
  [264.1, 415.3],
  [266.7, 413.5],
  [269.4, 411.8],
  [272.1, 410.0],
  [274.9, 408.3],
  [277.6, 406.5],
  [280.5, 404.7],
  [283.3, 403.0],
  [286.2, 401.2],
  [289.1, 399.5],
  [292.1, 397.7],
  [295.0, 396.0],
  [298.1, 394.2],
  [301.1, 392.5],
  [304.2, 390.7],
  [307.4, 389.0],
  [310.5, 387.2],
  [313.7, 385.5],
  [317.0, 383.7],
  [320.3, 382.0],
  [323.6, 380.2],
  [327.0, 378.5],
  [330.4, 376.7],
  [333.8, 375.0],
  [337.3, 373.2],
  [340.8, 371.4],
  [344.4, 369.7],
  [348.0, 367.9],
  [351.7, 366.2],
  [355.4, 364.4],
  [359.1, 362.7],
  [362.9, 360.9],
  [366.7, 359.2],
  [370.6, 357.4],
  [374.5, 355.7],
  [378.5, 353.9],
  [382.5, 352.2],
  [386.5, 350.4],
  [390.7, 348.7],
  [394.8, 346.9],
  [399.0, 345.2],
  [403.3, 343.4],
  [407.6, 341.7],
  [411.9, 339.9],
  [416.3, 338.2],
  [420.8, 336.4],
  [425.3, 334.6],
  [429.8, 332.9],
  [434.4, 331.1],
  [439.1, 329.4],
  [443.8, 327.6],
  [448.6, 325.9],
  [453.4, 324.1],
  [458.3, 322.4],
  [463.2, 320.6],
  [468.2, 318.9],
  [473.2, 317.1],
  [478.3, 315.4],
  [483.5, 313.6],
  [488.7, 311.8],
  [494.0, 310.1],
  [499.4, 308.3],
  [504.8, 306.6],
  [510.2, 304.8],
  [515.7, 303.1],
  [521.3, 301.3],
  [527.0, 299.5],
  [532.7, 297.8],
  [538.5, 296.0],
  [544.3, 294.3],
  [550.2, 292.5],
  [556.2, 290.8],
  [562.3, 289.0],
  [568.4, 287.2],
  [574.6, 285.5],
  [580.8, 283.7],
  [587.1, 281.9],
  [593.5, 280.2],
  [600.0, 278.4],
  [606.5, 276.7],
  [613.2, 274.9],
  [619.8, 273.1],
  [626.6, 271.4],
  [633.4, 269.6],
  [640.4, 267.8],
  [647.3, 266.1],
  [654.4, 264.3],
  [661.6, 262.5],
  [668.8, 260.8],
  [676.1, 259.0],
  [683.5, 257.2],
  [690.9, 255.5],
  [698.5, 253.7],
  [706.1, 251.9],
  [713.9, 250.1],
  [721.7, 248.4],
  [729.6, 246.6],
  [737.5, 244.8],
  [745.6, 243.0],
  [753.8, 241.3],
  [762.0, 239.5],
  [770.3, 237.7],
  [778.8, 235.9],
  [787.3, 234.1],
  [795.9, 232.3],
  [804.6, 230.6],
  [813.4, 228.8],
  [822.4, 227.0],
  [830.0, 225.5],
];

// Invertible exact temperature at saturation point in Carrier diagram
function getCarrierSatTempAtPoint(x: number, y: number): number {
  const w = ((590.0 - y) / 540.0) * 0.030;
  const k = 22.77777777777778 * w;
  return (x - 196.5 + 50.0 * k) / (12.65 + k);
}

const CARRIER_SAT_TEMPS: number[] = CARRIER_SAT_PTS.map(([x, y]) => getCarrierSatTempAtPoint(x, y));

/**
 * Maps (Tdb, w) to screen pixel coordinates on the Carrier chart.
 * Accounts for the official Carrier/ASHRAE slanted dry-bulb isotherms.
 */
export function coordToPixelCarrier(tdb: number, w: number): [number, number] {
  const y = 590.0 - (w / 0.030) * 540.0;
  const xBase = 70.0 + ((tdb - (-10.0)) / 60.0) * 759.0;
  // Carrier dry-bulb lines slope slightly left as moisture w increases
  const px = xBase - (50.0 - tdb) * 22.77777777777778 * w;
  return [px, y];
}

/**
 * Inverse mapping: SVG (X, Y) -> (Tdb, w) on the Carrier chart.
 */
export function pixelToCoordCarrier(x: number, y: number): [number, number] {
  const w = Math.max(0, ((590.0 - y) / 540.0) * 0.030);
  const k = 22.77777777777778 * w;
  const tdb = (x - 196.5 + 50.0 * k) / (12.65 + k);
  return [tdb, w];
}

/**
 * Returns the exact [X, Y] point on the Carrier 100% saturation curve (green line)
 * corresponding to a given moisture ratio w (or dew point temperature).
 * The resulting point is guaranteed to sit 100% on the drawn saturation curve.
 */
export function getCarrierDewPointOnSaturation(w: number): [number, number] {
  const targetY = 590.0 - (w / 0.030) * 540.0;
  
  // Boundary clamps
  if (targetY >= CARRIER_SAT_PTS[0][1]) {
    return [CARRIER_SAT_PTS[0][0], CARRIER_SAT_PTS[0][1]];
  }
  if (targetY <= CARRIER_SAT_PTS[CARRIER_SAT_PTS.length - 1][1]) {
    return [CARRIER_SAT_PTS[CARRIER_SAT_PTS.length - 1][0], CARRIER_SAT_PTS[CARRIER_SAT_PTS.length - 1][1]];
  }

  // Linear interpolation along the exact polyline segments
  for (let i = 0; i < CARRIER_SAT_PTS.length - 1; i++) {
    const [x1, y1] = CARRIER_SAT_PTS[i];
    const [x2, y2] = CARRIER_SAT_PTS[i + 1];
    if ((y1 >= targetY && targetY >= y2) || (y2 >= targetY && targetY >= y1)) {
      const r = (targetY - y1) / (y2 - y1);
      const interX = x1 + r * (x2 - x1);
      return [interX, targetY];
    }
  }

  return [CARRIER_SAT_PTS[CARRIER_SAT_PTS.length - 1][0], targetY];
}

/**
 * Returns the exact [X, Y] point on the Carrier 100% saturation curve (green line)
 * corresponding to a given wet-bulb temperature Twb (°C).
 * The resulting point is guaranteed to sit 100% on the drawn saturation curve.
 */
export function getCarrierWetBulbPointOnSaturation(twb: number): [number, number] {
  if (twb <= CARRIER_SAT_TEMPS[0]) {
    return [CARRIER_SAT_PTS[0][0], CARRIER_SAT_PTS[0][1]];
  }
  if (twb >= CARRIER_SAT_TEMPS[CARRIER_SAT_TEMPS.length - 1]) {
    return [
      CARRIER_SAT_PTS[CARRIER_SAT_PTS.length - 1][0],
      CARRIER_SAT_PTS[CARRIER_SAT_PTS.length - 1][1],
    ];
  }

  for (let i = 0; i < CARRIER_SAT_PTS.length - 1; i++) {
    const t1 = CARRIER_SAT_TEMPS[i];
    const t2 = CARRIER_SAT_TEMPS[i + 1];
    if ((t1 <= twb && twb <= t2) || (t2 <= twb && twb <= t1)) {
      const r = (twb - t1) / (t2 - t1);
      const x = CARRIER_SAT_PTS[i][0] + r * (CARRIER_SAT_PTS[i + 1][0] - CARRIER_SAT_PTS[i][0]);
      const y = CARRIER_SAT_PTS[i][1] + r * (CARRIER_SAT_PTS[i + 1][1] - CARRIER_SAT_PTS[i][1]);
      return [x, y];
    }
  }

  return [CARRIER_SAT_PTS[CARRIER_SAT_PTS.length - 1][0], CARRIER_SAT_PTS[CARRIER_SAT_PTS.length - 1][1]];
}

/**
 * Returns the exact [X, Y] point on the Mollier saturation curve corresponding to moisture w.
 */
export function getMollierDewPointOnSaturation(w: number): [number, number] {
  const targetX = 70.0 + (w / 0.030) * 759.0;
  
  if (targetX <= MOLLIER_SAT_PTS[0][0]) {
    return [MOLLIER_SAT_PTS[0][0], MOLLIER_SAT_PTS[0][1]];
  }
  if (targetX >= MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][0]) {
    return [
      MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][0],
      MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][1],
    ];
  }

  for (let i = 0; i < MOLLIER_SAT_PTS.length - 1; i++) {
    const [x1, y1] = MOLLIER_SAT_PTS[i];
    const [x2, y2] = MOLLIER_SAT_PTS[i + 1];
    if (x1 <= targetX && targetX <= x2) {
      const r = (targetX - x1) / (x2 - x1);
      const interY = y1 + r * (y2 - y1);
      return [targetX, interY];
    }
  }

  return [targetX, MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][1]];
}

/**
 * Returns the exact [X, Y] point on the Mollier saturation curve corresponding to Twb.
 */
export function getMollierWetBulbPointOnSaturation(twb: number): [number, number] {
  // In Mollier: py maps to temperature Tdb/Twb via: py = 590 - ((T - (-10))/60)*539
  const getTemp = (py: number) => ((590.0 - py) / 539.0) * 60.0 - 10.0;
  const t0 = getTemp(MOLLIER_SAT_PTS[0][1]);
  const tLast = getTemp(MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][1]);

  if (twb <= t0) {
    return [MOLLIER_SAT_PTS[0][0], MOLLIER_SAT_PTS[0][1]];
  }
  if (twb >= tLast) {
    return [
      MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][0],
      MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][1],
    ];
  }

  for (let i = 0; i < MOLLIER_SAT_PTS.length - 1; i++) {
    const t1 = getTemp(MOLLIER_SAT_PTS[i][1]);
    const t2 = getTemp(MOLLIER_SAT_PTS[i + 1][1]);
    if ((t1 <= twb && twb <= t2) || (t2 <= twb && twb <= t1)) {
      const r = (twb - t1) / (t2 - t1);
      const x = MOLLIER_SAT_PTS[i][0] + r * (MOLLIER_SAT_PTS[i + 1][0] - MOLLIER_SAT_PTS[i][0]);
      const y = MOLLIER_SAT_PTS[i][1] + r * (MOLLIER_SAT_PTS[i + 1][1] - MOLLIER_SAT_PTS[i][1]);
      return [x, y];
    }
  }

  return [MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][0], MOLLIER_SAT_PTS[MOLLIER_SAT_PTS.length - 1][1]];
}

/**
 * Returns the [X, Y] point on the Carrier outer enthalpy scale ruler (upper-left green scale)
 * corresponding to a given specific enthalpy h (kJ/kg).
 */
export function getCarrierEnthalpyScalePoint(h: number): [number, number] {
  if (h <= 100.0) {
    const x = 64.5 + h * 4.12;
    const y = 517.1 - h * 4.672;
    return [x, y];
  } else {
    const x = Math.min(829.0, 476.5 + (h - 100.0) * 12.575);
    const y = 50.0;
    return [x, y];
  }
}

