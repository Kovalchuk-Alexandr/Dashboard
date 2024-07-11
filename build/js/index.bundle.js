/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/lib/anime.es.js":
/*!********************************!*\
  !*** ./src/js/lib/anime.es.js ***!
  \********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/*
 * anime.js v3.2.2
 * (c) 2023 Julian Garnier
 * Released under the MIT license
 * animejs.com
 */

// Defaults

var defaultInstanceSettings = {
  update: null,
  begin: null,
  loopBegin: null,
  changeBegin: null,
  change: null,
  changeComplete: null,
  loopComplete: null,
  complete: null,
  loop: 1,
  direction: 'normal',
  autoplay: true,
  timelineOffset: 0
};

var defaultTweenSettings = {
  duration: 1000,
  delay: 0,
  endDelay: 0,
  easing: 'easeOutElastic(1, .5)',
  round: 0
};

var validTransforms = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];

// Caching

var cache = {
  CSS: {},
  springs: {}
};

// Utils

function minMax(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

function applyArguments(func, args) {
  return func.apply(null, args);
}

var is = {
  arr: function (a) { return Array.isArray(a); },
  obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
  pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
  svg: function (a) { return a instanceof SVGElement; },
  inp: function (a) { return a instanceof HTMLInputElement; },
  dom: function (a) { return a.nodeType || is.svg(a); },
  str: function (a) { return typeof a === 'string'; },
  fnc: function (a) { return typeof a === 'function'; },
  und: function (a) { return typeof a === 'undefined'; },
  nil: function (a) { return is.und(a) || a === null; },
  hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
  rgb: function (a) { return /^rgb/.test(a); },
  hsl: function (a) { return /^hsl/.test(a); },
  col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
  key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; },
};

// Easings

function parseEasingParameters(string) {
  var match = /\(([^)]+)\)/.exec(string);
  return match ? match[1].split(',').map(function (p) { return parseFloat(p); }) : [];
}

// Spring solver inspired by Webkit Copyright © 2016 Apple Inc. All rights reserved. https://webkit.org/demos/spring/spring.js

function spring(string, duration) {

  var params = parseEasingParameters(string);
  var mass = minMax(is.und(params[0]) ? 1 : params[0], .1, 100);
  var stiffness = minMax(is.und(params[1]) ? 100 : params[1], .1, 100);
  var damping = minMax(is.und(params[2]) ? 10 : params[2], .1, 100);
  var velocity =  minMax(is.und(params[3]) ? 0 : params[3], .1, 100);
  var w0 = Math.sqrt(stiffness / mass);
  var zeta = damping / (2 * Math.sqrt(stiffness * mass));
  var wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  var a = 1;
  var b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

  function solver(t) {
    var progress = duration ? (duration * t) / 1000 : t;
    if (zeta < 1) {
      progress = Math.exp(-progress * zeta * w0) * (a * Math.cos(wd * progress) + b * Math.sin(wd * progress));
    } else {
      progress = (a + b * progress) * Math.exp(-progress * w0);
    }
    if (t === 0 || t === 1) { return t; }
    return 1 - progress;
  }

  function getDuration() {
    var cached = cache.springs[string];
    if (cached) { return cached; }
    var frame = 1/6;
    var elapsed = 0;
    var rest = 0;
    while(true) {
      elapsed += frame;
      if (solver(elapsed) === 1) {
        rest++;
        if (rest >= 16) { break; }
      } else {
        rest = 0;
      }
    }
    var duration = elapsed * frame * 1000;
    cache.springs[string] = duration;
    return duration;
  }

  return duration ? solver : getDuration;

}

// Basic steps easing implementation https://developer.mozilla.org/fr/docs/Web/CSS/transition-timing-function

function steps(steps) {
  if ( steps === void 0 ) steps = 10;

  return function (t) { return Math.ceil((minMax(t, 0.000001, 1)) * steps) * (1 / steps); };
}

// BezierEasing https://github.com/gre/bezier-easing

var bezier = (function () {

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 }
  function C(aA1)      { return 3.0 * aA1 }

  function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT }
  function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) }

  function binarySubdivide(aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) { aB = currentT; } else { aA = currentT; }
    } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
    return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (var i = 0; i < 4; ++i) {
      var currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) { return aGuessT; }
      var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  function bezier(mX1, mY1, mX2, mY2) {

    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) { return; }
    var sampleValues = new Float32Array(kSplineTableSize);

    if (mX1 !== mY1 || mX2 !== mY2) {
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX(aX) {

      var intervalStart = 0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }

      --currentSample;

      var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;
      var initialSlope = getSlope(guessForT, mX1, mX2);

      if (initialSlope >= 0.001) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }

    }

    return function (x) {
      if (mX1 === mY1 && mX2 === mY2) { return x; }
      if (x === 0 || x === 1) { return x; }
      return calcBezier(getTForX(x), mY1, mY2);
    }

  }

  return bezier;

})();

var penner = (function () {

  // Based on jQuery UI's implemenation of easing equations from Robert Penner (http://www.robertpenner.com/easing)

  var eases = { linear: function () { return function (t) { return t; }; } };

  var functionEasings = {
    Sine: function () { return function (t) { return 1 - Math.cos(t * Math.PI / 2); }; },
    Expo: function () { return function (t) { return t ? Math.pow(2, 10 * t - 10) : 0; }; },
    Circ: function () { return function (t) { return 1 - Math.sqrt(1 - t * t); }; },
    Back: function () { return function (t) { return t * t * (3 * t - 2); }; },
    Bounce: function () { return function (t) {
      var pow2, b = 4;
      while (t < (( pow2 = Math.pow(2, --b)) - 1) / 11) {}
      return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow(( pow2 * 3 - 2 ) / 22 - t, 2)
    }; },
    Elastic: function (amplitude, period) {
      if ( amplitude === void 0 ) amplitude = 1;
      if ( period === void 0 ) period = .5;

      var a = minMax(amplitude, 1, 10);
      var p = minMax(period, .1, 2);
      return function (t) {
        return (t === 0 || t === 1) ? t : 
          -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
      }
    }
  };

  var baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint'];

  baseEasings.forEach(function (name, i) {
    functionEasings[name] = function () { return function (t) { return Math.pow(t, i + 2); }; };
  });

  Object.keys(functionEasings).forEach(function (name) {
    var easeIn = functionEasings[name];
    eases['easeIn' + name] = easeIn;
    eases['easeOut' + name] = function (a, b) { return function (t) { return 1 - easeIn(a, b)(1 - t); }; };
    eases['easeInOut' + name] = function (a, b) { return function (t) { return t < 0.5 ? easeIn(a, b)(t * 2) / 2 : 
      1 - easeIn(a, b)(t * -2 + 2) / 2; }; };
    eases['easeOutIn' + name] = function (a, b) { return function (t) { return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 : 
      (easeIn(a, b)(t * 2 - 1) + 1) / 2; }; };
  });

  return eases;

})();

function parseEasings(easing, duration) {
  if (is.fnc(easing)) { return easing; }
  var name = easing.split('(')[0];
  var ease = penner[name];
  var args = parseEasingParameters(easing);
  switch (name) {
    case 'spring' : return spring(easing, duration);
    case 'cubicBezier' : return applyArguments(bezier, args);
    case 'steps' : return applyArguments(steps, args);
    default : return applyArguments(ease, args);
  }
}

// Strings

function selectString(str) {
  try {
    var nodes = document.querySelectorAll(str);
    return nodes;
  } catch(e) {
    return;
  }
}

// Arrays

function filterArray(arr, callback) {
  var len = arr.length;
  var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
  var result = [];
  for (var i = 0; i < len; i++) {
    if (i in arr) {
      var val = arr[i];
      if (callback.call(thisArg, val, i, arr)) {
        result.push(val);
      }
    }
  }
  return result;
}

function flattenArray(arr) {
  return arr.reduce(function (a, b) { return a.concat(is.arr(b) ? flattenArray(b) : b); }, []);
}

function toArray(o) {
  if (is.arr(o)) { return o; }
  if (is.str(o)) { o = selectString(o) || o; }
  if (o instanceof NodeList || o instanceof HTMLCollection) { return [].slice.call(o); }
  return [o];
}

function arrayContains(arr, val) {
  return arr.some(function (a) { return a === val; });
}

// Objects

function cloneObject(o) {
  var clone = {};
  for (var p in o) { clone[p] = o[p]; }
  return clone;
}

function replaceObjectProps(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o1) { o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p]; }
  return o;
}

function mergeObjects(o1, o2) {
  var o = cloneObject(o1);
  for (var p in o2) { o[p] = is.und(o1[p]) ? o2[p] : o1[p]; }
  return o;
}

// Colors

function rgbToRgba(rgbValue) {
  var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
  return rgb ? ("rgba(" + (rgb[1]) + ",1)") : rgbValue;
}

function hexToRgba(hexValue) {
  var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  var hex = hexValue.replace(rgx, function (m, r, g, b) { return r + r + g + g + b + b; } );
  var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  var r = parseInt(rgb[1], 16);
  var g = parseInt(rgb[2], 16);
  var b = parseInt(rgb[3], 16);
  return ("rgba(" + r + "," + g + "," + b + ",1)");
}

function hslToRgba(hslValue) {
  var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
  var h = parseInt(hsl[1], 10) / 360;
  var s = parseInt(hsl[2], 10) / 100;
  var l = parseInt(hsl[3], 10) / 100;
  var a = hsl[4] || 1;
  function hue2rgb(p, q, t) {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1/6) { return p + (q - p) * 6 * t; }
    if (t < 1/2) { return q; }
    if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
    return p;
  }
  var r, g, b;
  if (s == 0) {
    r = g = b = l;
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return ("rgba(" + (r * 255) + "," + (g * 255) + "," + (b * 255) + "," + a + ")");
}

function colorToRgb(val) {
  if (is.rgb(val)) { return rgbToRgba(val); }
  if (is.hex(val)) { return hexToRgba(val); }
  if (is.hsl(val)) { return hslToRgba(val); }
}

// Units

function getUnit(val) {
  var split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
  if (split) { return split[1]; }
}

function getTransformUnit(propName) {
  if (stringContains(propName, 'translate') || propName === 'perspective') { return 'px'; }
  if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) { return 'deg'; }
}

// Values

function getFunctionValue(val, animatable) {
  if (!is.fnc(val)) { return val; }
  return val(animatable.target, animatable.id, animatable.total);
}

function getAttribute(el, prop) {
  return el.getAttribute(prop);
}

function convertPxToUnit(el, value, unit) {
  var valueUnit = getUnit(value);
  if (arrayContains([unit, 'deg', 'rad', 'turn'], valueUnit)) { return value; }
  var cached = cache.CSS[value + unit];
  if (!is.und(cached)) { return cached; }
  var baseline = 100;
  var tempEl = document.createElement(el.tagName);
  var parentEl = (el.parentNode && (el.parentNode !== document)) ? el.parentNode : document.body;
  parentEl.appendChild(tempEl);
  tempEl.style.position = 'absolute';
  tempEl.style.width = baseline + unit;
  var factor = baseline / tempEl.offsetWidth;
  parentEl.removeChild(tempEl);
  var convertedUnit = factor * parseFloat(value);
  cache.CSS[value + unit] = convertedUnit;
  return convertedUnit;
}

function getCSSValue(el, prop, unit) {
  if (prop in el.style) {
    var uppercasePropName = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    var value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || '0';
    return unit ? convertPxToUnit(el, value, unit) : value;
  }
}

function getAnimationType(el, prop) {
  if (is.dom(el) && !is.inp(el) && (!is.nil(getAttribute(el, prop)) || (is.svg(el) && el[prop]))) { return 'attribute'; }
  if (is.dom(el) && arrayContains(validTransforms, prop)) { return 'transform'; }
  if (is.dom(el) && (prop !== 'transform' && getCSSValue(el, prop))) { return 'css'; }
  if (el[prop] != null) { return 'object'; }
}

function getElementTransforms(el) {
  if (!is.dom(el)) { return; }
  var str = el.style.transform || '';
  var reg  = /(\w+)\(([^)]*)\)/g;
  var transforms = new Map();
  var m; while (m = reg.exec(str)) { transforms.set(m[1], m[2]); }
  return transforms;
}

function getTransformValue(el, propName, animatable, unit) {
  var defaultVal = stringContains(propName, 'scale') ? 1 : 0 + getTransformUnit(propName);
  var value = getElementTransforms(el).get(propName) || defaultVal;
  if (animatable) {
    animatable.transforms.list.set(propName, value);
    animatable.transforms['last'] = propName;
  }
  return unit ? convertPxToUnit(el, value, unit) : value;
}

function getOriginalTargetValue(target, propName, unit, animatable) {
  switch (getAnimationType(target, propName)) {
    case 'transform': return getTransformValue(target, propName, animatable, unit);
    case 'css': return getCSSValue(target, propName, unit);
    case 'attribute': return getAttribute(target, propName);
    default: return target[propName] || 0;
  }
}

function getRelativeValue(to, from) {
  var operator = /^(\*=|\+=|-=)/.exec(to);
  if (!operator) { return to; }
  var u = getUnit(to) || 0;
  var x = parseFloat(from);
  var y = parseFloat(to.replace(operator[0], ''));
  switch (operator[0][0]) {
    case '+': return x + y + u;
    case '-': return x - y + u;
    case '*': return x * y + u;
  }
}

function validateValue(val, unit) {
  if (is.col(val)) { return colorToRgb(val); }
  if (/\s/g.test(val)) { return val; }
  var originalUnit = getUnit(val);
  var unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;
  if (unit) { return unitLess + unit; }
  return unitLess;
}

// getTotalLength() equivalent for circle, rect, polyline, polygon and line shapes
// adapted from https://gist.github.com/SebLambla/3e0550c496c236709744

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function getCircleLength(el) {
  return Math.PI * 2 * getAttribute(el, 'r');
}

function getRectLength(el) {
  return (getAttribute(el, 'width') * 2) + (getAttribute(el, 'height') * 2);
}

function getLineLength(el) {
  return getDistance(
    {x: getAttribute(el, 'x1'), y: getAttribute(el, 'y1')}, 
    {x: getAttribute(el, 'x2'), y: getAttribute(el, 'y2')}
  );
}

function getPolylineLength(el) {
  var points = el.points;
  var totalLength = 0;
  var previousPos;
  for (var i = 0 ; i < points.numberOfItems; i++) {
    var currentPos = points.getItem(i);
    if (i > 0) { totalLength += getDistance(previousPos, currentPos); }
    previousPos = currentPos;
  }
  return totalLength;
}

function getPolygonLength(el) {
  var points = el.points;
  return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
}

// Path animation

function getTotalLength(el) {
  if (el.getTotalLength) { return el.getTotalLength(); }
  switch(el.tagName.toLowerCase()) {
    case 'circle': return getCircleLength(el);
    case 'rect': return getRectLength(el);
    case 'line': return getLineLength(el);
    case 'polyline': return getPolylineLength(el);
    case 'polygon': return getPolygonLength(el);
  }
}

function setDashoffset(el) {
  var pathLength = getTotalLength(el);
  el.setAttribute('stroke-dasharray', pathLength);
  return pathLength;
}

// Motion path

function getParentSvgEl(el) {
  var parentEl = el.parentNode;
  while (is.svg(parentEl)) {
    if (!is.svg(parentEl.parentNode)) { break; }
    parentEl = parentEl.parentNode;
  }
  return parentEl;
}

function getParentSvg(pathEl, svgData) {
  var svg = svgData || {};
  var parentSvgEl = svg.el || getParentSvgEl(pathEl);
  var rect = parentSvgEl.getBoundingClientRect();
  var viewBoxAttr = getAttribute(parentSvgEl, 'viewBox');
  var width = rect.width;
  var height = rect.height;
  var viewBox = svg.viewBox || (viewBoxAttr ? viewBoxAttr.split(' ') : [0, 0, width, height]);
  return {
    el: parentSvgEl,
    viewBox: viewBox,
    x: viewBox[0] / 1,
    y: viewBox[1] / 1,
    w: width,
    h: height,
    vW: viewBox[2],
    vH: viewBox[3]
  }
}

function getPath(path, percent) {
  var pathEl = is.str(path) ? selectString(path)[0] : path;
  var p = percent || 100;
  return function(property) {
    return {
      property: property,
      el: pathEl,
      svg: getParentSvg(pathEl),
      totalLength: getTotalLength(pathEl) * (p / 100)
    }
  }
}

function getPathProgress(path, progress, isPathTargetInsideSVG) {
  function point(offset) {
    if ( offset === void 0 ) offset = 0;

    var l = progress + offset >= 1 ? progress + offset : 0;
    return path.el.getPointAtLength(l);
  }
  var svg = getParentSvg(path.el, path.svg);
  var p = point();
  var p0 = point(-1);
  var p1 = point(+1);
  var scaleX = isPathTargetInsideSVG ? 1 : svg.w / svg.vW;
  var scaleY = isPathTargetInsideSVG ? 1 : svg.h / svg.vH;
  switch (path.property) {
    case 'x': return (p.x - svg.x) * scaleX;
    case 'y': return (p.y - svg.y) * scaleY;
    case 'angle': return Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
  }
}

// Decompose value

function decomposeValue(val, unit) {
  // const rgx = /-?\d*\.?\d+/g; // handles basic numbers
  // const rgx = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var rgx = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g; // handles exponents notation
  var value = validateValue((is.pth(val) ? val.totalLength : val), unit) + '';
  return {
    original: value,
    numbers: value.match(rgx) ? value.match(rgx).map(Number) : [0],
    strings: (is.str(val) || unit) ? value.split(rgx) : []
  }
}

// Animatables

function parseTargets(targets) {
  var targetsArray = targets ? (flattenArray(is.arr(targets) ? targets.map(toArray) : toArray(targets))) : [];
  return filterArray(targetsArray, function (item, pos, self) { return self.indexOf(item) === pos; });
}

function getAnimatables(targets) {
  var parsed = parseTargets(targets);
  return parsed.map(function (t, i) {
    return {target: t, id: i, total: parsed.length, transforms: { list: getElementTransforms(t) } };
  });
}

// Properties

function normalizePropertyTweens(prop, tweenSettings) {
  var settings = cloneObject(tweenSettings);
  // Override duration if easing is a spring
  if (/^spring/.test(settings.easing)) { settings.duration = spring(settings.easing); }
  if (is.arr(prop)) {
    var l = prop.length;
    var isFromTo = (l === 2 && !is.obj(prop[0]));
    if (!isFromTo) {
      // Duration divided by the number of tweens
      if (!is.fnc(tweenSettings.duration)) { settings.duration = tweenSettings.duration / l; }
    } else {
      // Transform [from, to] values shorthand to a valid tween value
      prop = {value: prop};
    }
  }
  var propArray = is.arr(prop) ? prop : [prop];
  return propArray.map(function (v, i) {
    var obj = (is.obj(v) && !is.pth(v)) ? v : {value: v};
    // Default delay value should only be applied to the first tween
    if (is.und(obj.delay)) { obj.delay = !i ? tweenSettings.delay : 0; }
    // Default endDelay value should only be applied to the last tween
    if (is.und(obj.endDelay)) { obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0; }
    return obj;
  }).map(function (k) { return mergeObjects(k, settings); });
}


function flattenKeyframes(keyframes) {
  var propertyNames = filterArray(flattenArray(keyframes.map(function (key) { return Object.keys(key); })), function (p) { return is.key(p); })
  .reduce(function (a,b) { if (a.indexOf(b) < 0) { a.push(b); } return a; }, []);
  var properties = {};
  var loop = function ( i ) {
    var propName = propertyNames[i];
    properties[propName] = keyframes.map(function (key) {
      var newKey = {};
      for (var p in key) {
        if (is.key(p)) {
          if (p == propName) { newKey.value = key[p]; }
        } else {
          newKey[p] = key[p];
        }
      }
      return newKey;
    });
  };

  for (var i = 0; i < propertyNames.length; i++) loop( i );
  return properties;
}

function getProperties(tweenSettings, params) {
  var properties = [];
  var keyframes = params.keyframes;
  if (keyframes) { params = mergeObjects(flattenKeyframes(keyframes), params); }
  for (var p in params) {
    if (is.key(p)) {
      properties.push({
        name: p,
        tweens: normalizePropertyTweens(params[p], tweenSettings)
      });
    }
  }
  return properties;
}

// Tweens

function normalizeTweenValues(tween, animatable) {
  var t = {};
  for (var p in tween) {
    var value = getFunctionValue(tween[p], animatable);
    if (is.arr(value)) {
      value = value.map(function (v) { return getFunctionValue(v, animatable); });
      if (value.length === 1) { value = value[0]; }
    }
    t[p] = value;
  }
  t.duration = parseFloat(t.duration);
  t.delay = parseFloat(t.delay);
  return t;
}

function normalizeTweens(prop, animatable) {
  var previousTween;
  return prop.tweens.map(function (t) {
    var tween = normalizeTweenValues(t, animatable);
    var tweenValue = tween.value;
    var to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
    var toUnit = getUnit(to);
    var originalValue = getOriginalTargetValue(animatable.target, prop.name, toUnit, animatable);
    var previousValue = previousTween ? previousTween.to.original : originalValue;
    var from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
    var fromUnit = getUnit(from) || getUnit(originalValue);
    var unit = toUnit || fromUnit;
    if (is.und(to)) { to = previousValue; }
    tween.from = decomposeValue(from, unit);
    tween.to = decomposeValue(getRelativeValue(to, from), unit);
    tween.start = previousTween ? previousTween.end : 0;
    tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
    tween.easing = parseEasings(tween.easing, tween.duration);
    tween.isPath = is.pth(tweenValue);
    tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
    tween.isColor = is.col(tween.from.original);
    if (tween.isColor) { tween.round = 1; }
    previousTween = tween;
    return tween;
  });
}

// Tween progress

var setProgressValue = {
  css: function (t, p, v) { return t.style[p] = v; },
  attribute: function (t, p, v) { return t.setAttribute(p, v); },
  object: function (t, p, v) { return t[p] = v; },
  transform: function (t, p, v, transforms, manual) {
    transforms.list.set(p, v);
    if (p === transforms.last || manual) {
      var str = '';
      transforms.list.forEach(function (value, prop) { str += prop + "(" + value + ") "; });
      t.style.transform = str;
    }
  }
};

// Set Value helper

function setTargetsValue(targets, properties) {
  var animatables = getAnimatables(targets);
  animatables.forEach(function (animatable) {
    for (var property in properties) {
      var value = getFunctionValue(properties[property], animatable);
      var target = animatable.target;
      var valueUnit = getUnit(value);
      var originalValue = getOriginalTargetValue(target, property, valueUnit, animatable);
      var unit = valueUnit || getUnit(originalValue);
      var to = getRelativeValue(validateValue(value, unit), originalValue);
      var animType = getAnimationType(target, property);
      setProgressValue[animType](target, property, to, animatable.transforms, true);
    }
  });
}

// Animations

function createAnimation(animatable, prop) {
  var animType = getAnimationType(animatable.target, prop.name);
  if (animType) {
    var tweens = normalizeTweens(prop, animatable);
    var lastTween = tweens[tweens.length - 1];
    return {
      type: animType,
      property: prop.name,
      animatable: animatable,
      tweens: tweens,
      duration: lastTween.end,
      delay: tweens[0].delay,
      endDelay: lastTween.endDelay
    }
  }
}

function getAnimations(animatables, properties) {
  return filterArray(flattenArray(animatables.map(function (animatable) {
    return properties.map(function (prop) {
      return createAnimation(animatable, prop);
    });
  })), function (a) { return !is.und(a); });
}

// Create Instance

function getInstanceTimings(animations, tweenSettings) {
  var animLength = animations.length;
  var getTlOffset = function (anim) { return anim.timelineOffset ? anim.timelineOffset : 0; };
  var timings = {};
  timings.duration = animLength ? Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration; })) : tweenSettings.duration;
  timings.delay = animLength ? Math.min.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.delay; })) : tweenSettings.delay;
  timings.endDelay = animLength ? timings.duration - Math.max.apply(Math, animations.map(function (anim) { return getTlOffset(anim) + anim.duration - anim.endDelay; })) : tweenSettings.endDelay;
  return timings;
}

var instanceID = 0;

function createNewInstance(params) {
  var instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
  var tweenSettings = replaceObjectProps(defaultTweenSettings, params);
  var properties = getProperties(tweenSettings, params);
  var animatables = getAnimatables(params.targets);
  var animations = getAnimations(animatables, properties);
  var timings = getInstanceTimings(animations, tweenSettings);
  var id = instanceID;
  instanceID++;
  return mergeObjects(instanceSettings, {
    id: id,
    children: [],
    animatables: animatables,
    animations: animations,
    duration: timings.duration,
    delay: timings.delay,
    endDelay: timings.endDelay
  });
}

// Core

var activeInstances = [];

var engine = (function () {
  var raf;

  function play() {
    if (!raf && (!isDocumentHidden() || !anime.suspendWhenDocumentHidden) && activeInstances.length > 0) {
      raf = requestAnimationFrame(step);
    }
  }
  function step(t) {
    // memo on algorithm issue:
    // dangerous iteration over mutable `activeInstances`
    // (that collection may be updated from within callbacks of `tick`-ed animation instances)
    var activeInstancesLength = activeInstances.length;
    var i = 0;
    while (i < activeInstancesLength) {
      var activeInstance = activeInstances[i];
      if (!activeInstance.paused) {
        activeInstance.tick(t);
        i++;
      } else {
        activeInstances.splice(i, 1);
        activeInstancesLength--;
      }
    }
    raf = i > 0 ? requestAnimationFrame(step) : undefined;
  }

  function handleVisibilityChange() {
    if (!anime.suspendWhenDocumentHidden) { return; }

    if (isDocumentHidden()) {
      // suspend ticks
      raf = cancelAnimationFrame(raf);
    } else { // is back to active tab
      // first adjust animations to consider the time that ticks were suspended
      activeInstances.forEach(
        function (instance) { return instance ._onDocumentVisibility(); }
      );
      engine();
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return play;
})();

function isDocumentHidden() {
  return !!document && document.hidden;
}

// Public Instance

function anime(params) {
  if ( params === void 0 ) params = {};


  var startTime = 0, lastTime = 0, now = 0;
  var children, childrenLength = 0;
  var resolve = null;

  function makePromise(instance) {
    var promise = window.Promise && new Promise(function (_resolve) { return resolve = _resolve; });
    instance.finished = promise;
    return promise;
  }

  var instance = createNewInstance(params);
  var promise = makePromise(instance);

  function toggleInstanceDirection() {
    var direction = instance.direction;
    if (direction !== 'alternate') {
      instance.direction = direction !== 'normal' ? 'normal' : 'reverse';
    }
    instance.reversed = !instance.reversed;
    children.forEach(function (child) { return child.reversed = instance.reversed; });
  }

  function adjustTime(time) {
    return instance.reversed ? instance.duration - time : time;
  }

  function resetTime() {
    startTime = 0;
    lastTime = adjustTime(instance.currentTime) * (1 / anime.speed);
  }

  function seekChild(time, child) {
    if (child) { child.seek(time - child.timelineOffset); }
  }

  function syncInstanceChildren(time) {
    if (!instance.reversePlayback) {
      for (var i = 0; i < childrenLength; i++) { seekChild(time, children[i]); }
    } else {
      for (var i$1 = childrenLength; i$1--;) { seekChild(time, children[i$1]); }
    }
  }

  function setAnimationsProgress(insTime) {
    var i = 0;
    var animations = instance.animations;
    var animationsLength = animations.length;
    while (i < animationsLength) {
      var anim = animations[i];
      var animatable = anim.animatable;
      var tweens = anim.tweens;
      var tweenLength = tweens.length - 1;
      var tween = tweens[tweenLength];
      // Only check for keyframes if there is more than one tween
      if (tweenLength) { tween = filterArray(tweens, function (t) { return (insTime < t.end); })[0] || tween; }
      var elapsed = minMax(insTime - tween.start - tween.delay, 0, tween.duration) / tween.duration;
      var eased = isNaN(elapsed) ? 1 : tween.easing(elapsed);
      var strings = tween.to.strings;
      var round = tween.round;
      var numbers = [];
      var toNumbersLength = tween.to.numbers.length;
      var progress = (void 0);
      for (var n = 0; n < toNumbersLength; n++) {
        var value = (void 0);
        var toNumber = tween.to.numbers[n];
        var fromNumber = tween.from.numbers[n] || 0;
        if (!tween.isPath) {
          value = fromNumber + (eased * (toNumber - fromNumber));
        } else {
          value = getPathProgress(tween.value, eased * toNumber, tween.isPathTargetInsideSVG);
        }
        if (round) {
          if (!(tween.isColor && n > 2)) {
            value = Math.round(value * round) / round;
          }
        }
        numbers.push(value);
      }
      // Manual Array.reduce for better performances
      var stringsLength = strings.length;
      if (!stringsLength) {
        progress = numbers[0];
      } else {
        progress = strings[0];
        for (var s = 0; s < stringsLength; s++) {
          var a = strings[s];
          var b = strings[s + 1];
          var n$1 = numbers[s];
          if (!isNaN(n$1)) {
            if (!b) {
              progress += n$1 + ' ';
            } else {
              progress += n$1 + b;
            }
          }
        }
      }
      setProgressValue[anim.type](animatable.target, anim.property, progress, animatable.transforms);
      anim.currentValue = progress;
      i++;
    }
  }

  function setCallback(cb) {
    if (instance[cb] && !instance.passThrough) { instance[cb](instance); }
  }

  function countIteration() {
    if (instance.remaining && instance.remaining !== true) {
      instance.remaining--;
    }
  }

  function setInstanceProgress(engineTime) {
    var insDuration = instance.duration;
    var insDelay = instance.delay;
    var insEndDelay = insDuration - instance.endDelay;
    var insTime = adjustTime(engineTime);
    instance.progress = minMax((insTime / insDuration) * 100, 0, 100);
    instance.reversePlayback = insTime < instance.currentTime;
    if (children) { syncInstanceChildren(insTime); }
    if (!instance.began && instance.currentTime > 0) {
      instance.began = true;
      setCallback('begin');
    }
    if (!instance.loopBegan && instance.currentTime > 0) {
      instance.loopBegan = true;
      setCallback('loopBegin');
    }
    if (insTime <= insDelay && instance.currentTime !== 0) {
      setAnimationsProgress(0);
    }
    if ((insTime >= insEndDelay && instance.currentTime !== insDuration) || !insDuration) {
      setAnimationsProgress(insDuration);
    }
    if (insTime > insDelay && insTime < insEndDelay) {
      if (!instance.changeBegan) {
        instance.changeBegan = true;
        instance.changeCompleted = false;
        setCallback('changeBegin');
      }
      setCallback('change');
      setAnimationsProgress(insTime);
    } else {
      if (instance.changeBegan) {
        instance.changeCompleted = true;
        instance.changeBegan = false;
        setCallback('changeComplete');
      }
    }
    instance.currentTime = minMax(insTime, 0, insDuration);
    if (instance.began) { setCallback('update'); }
    if (engineTime >= insDuration) {
      lastTime = 0;
      countIteration();
      if (!instance.remaining) {
        instance.paused = true;
        if (!instance.completed) {
          instance.completed = true;
          setCallback('loopComplete');
          setCallback('complete');
          if (!instance.passThrough && 'Promise' in window) {
            resolve();
            promise = makePromise(instance);
          }
        }
      } else {
        startTime = now;
        setCallback('loopComplete');
        instance.loopBegan = false;
        if (instance.direction === 'alternate') {
          toggleInstanceDirection();
        }
      }
    }
  }

  instance.reset = function() {
    var direction = instance.direction;
    instance.passThrough = false;
    instance.currentTime = 0;
    instance.progress = 0;
    instance.paused = true;
    instance.began = false;
    instance.loopBegan = false;
    instance.changeBegan = false;
    instance.completed = false;
    instance.changeCompleted = false;
    instance.reversePlayback = false;
    instance.reversed = direction === 'reverse';
    instance.remaining = instance.loop;
    children = instance.children;
    childrenLength = children.length;
    for (var i = childrenLength; i--;) { instance.children[i].reset(); }
    if (instance.reversed && instance.loop !== true || (direction === 'alternate' && instance.loop === 1)) { instance.remaining++; }
    setAnimationsProgress(instance.reversed ? instance.duration : 0);
  };

  // internal method (for engine) to adjust animation timings before restoring engine ticks (rAF)
  instance._onDocumentVisibility = resetTime;

  // Set Value helper

  instance.set = function(targets, properties) {
    setTargetsValue(targets, properties);
    return instance;
  };

  instance.tick = function(t) {
    now = t;
    if (!startTime) { startTime = now; }
    setInstanceProgress((now + (lastTime - startTime)) * anime.speed);
  };

  instance.seek = function(time) {
    setInstanceProgress(adjustTime(time));
  };

  instance.pause = function() {
    instance.paused = true;
    resetTime();
  };

  instance.play = function() {
    if (!instance.paused) { return; }
    if (instance.completed) { instance.reset(); }
    instance.paused = false;
    activeInstances.push(instance);
    resetTime();
    engine();
  };

  instance.reverse = function() {
    toggleInstanceDirection();
    instance.completed = instance.reversed ? false : true;
    resetTime();
  };

  instance.restart = function() {
    instance.reset();
    instance.play();
  };

  instance.remove = function(targets) {
    var targetsArray = parseTargets(targets);
    removeTargetsFromInstance(targetsArray, instance);
  };

  instance.reset();

  if (instance.autoplay) { instance.play(); }

  return instance;

}

// Remove targets from animation

function removeTargetsFromAnimations(targetsArray, animations) {
  for (var a = animations.length; a--;) {
    if (arrayContains(targetsArray, animations[a].animatable.target)) {
      animations.splice(a, 1);
    }
  }
}

function removeTargetsFromInstance(targetsArray, instance) {
  var animations = instance.animations;
  var children = instance.children;
  removeTargetsFromAnimations(targetsArray, animations);
  for (var c = children.length; c--;) {
    var child = children[c];
    var childAnimations = child.animations;
    removeTargetsFromAnimations(targetsArray, childAnimations);
    if (!childAnimations.length && !child.children.length) { children.splice(c, 1); }
  }
  if (!animations.length && !children.length) { instance.pause(); }
}

function removeTargetsFromActiveInstances(targets) {
  var targetsArray = parseTargets(targets);
  for (var i = activeInstances.length; i--;) {
    var instance = activeInstances[i];
    removeTargetsFromInstance(targetsArray, instance);
  }
}

// Stagger helpers

function stagger(val, params) {
  if ( params === void 0 ) params = {};

  var direction = params.direction || 'normal';
  var easing = params.easing ? parseEasings(params.easing) : null;
  var grid = params.grid;
  var axis = params.axis;
  var fromIndex = params.from || 0;
  var fromFirst = fromIndex === 'first';
  var fromCenter = fromIndex === 'center';
  var fromLast = fromIndex === 'last';
  var isRange = is.arr(val);
  var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
  var val2 = isRange ? parseFloat(val[1]) : 0;
  var unit = getUnit(isRange ? val[1] : val) || 0;
  var start = params.start || 0 + (isRange ? val1 : 0);
  var values = [];
  var maxValue = 0;
  return function (el, i, t) {
    if (fromFirst) { fromIndex = 0; }
    if (fromCenter) { fromIndex = (t - 1) / 2; }
    if (fromLast) { fromIndex = t - 1; }
    if (!values.length) {
      for (var index = 0; index < t; index++) {
        if (!grid) {
          values.push(Math.abs(fromIndex - index));
        } else {
          var fromX = !fromCenter ? fromIndex%grid[0] : (grid[0]-1)/2;
          var fromY = !fromCenter ? Math.floor(fromIndex/grid[0]) : (grid[1]-1)/2;
          var toX = index%grid[0];
          var toY = Math.floor(index/grid[0]);
          var distanceX = fromX - toX;
          var distanceY = fromY - toY;
          var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
          if (axis === 'x') { value = -distanceX; }
          if (axis === 'y') { value = -distanceY; }
          values.push(value);
        }
        maxValue = Math.max.apply(Math, values);
      }
      if (easing) { values = values.map(function (val) { return easing(val / maxValue) * maxValue; }); }
      if (direction === 'reverse') { values = values.map(function (val) { return axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val); }); }
    }
    var spacing = isRange ? (val2 - val1) / maxValue : val1;
    return start + (spacing * (Math.round(values[i] * 100) / 100)) + unit;
  }
}

// Timeline

function timeline(params) {
  if ( params === void 0 ) params = {};

  var tl = anime(params);
  tl.duration = 0;
  tl.add = function(instanceParams, timelineOffset) {
    var tlIndex = activeInstances.indexOf(tl);
    var children = tl.children;
    if (tlIndex > -1) { activeInstances.splice(tlIndex, 1); }
    function passThrough(ins) { ins.passThrough = true; }
    for (var i = 0; i < children.length; i++) { passThrough(children[i]); }
    var insParams = mergeObjects(instanceParams, replaceObjectProps(defaultTweenSettings, params));
    insParams.targets = insParams.targets || params.targets;
    var tlDuration = tl.duration;
    insParams.autoplay = false;
    insParams.direction = tl.direction;
    insParams.timelineOffset = is.und(timelineOffset) ? tlDuration : getRelativeValue(timelineOffset, tlDuration);
    passThrough(tl);
    tl.seek(insParams.timelineOffset);
    var ins = anime(insParams);
    passThrough(ins);
    children.push(ins);
    var timings = getInstanceTimings(children, params);
    tl.delay = timings.delay;
    tl.endDelay = timings.endDelay;
    tl.duration = timings.duration;
    tl.seek(0);
    tl.reset();
    if (tl.autoplay) { tl.play(); }
    return tl;
  };
  return tl;
}

anime.version = '3.2.2';
anime.speed = 1;
// TODO:#review: naming, documentation
anime.suspendWhenDocumentHidden = true;
anime.running = activeInstances;
anime.remove = removeTargetsFromActiveInstances;
anime.get = getOriginalTargetValue;
anime.set = setTargetsValue;
anime.convertPx = convertPxToUnit;
anime.path = getPath;
anime.setDashoffset = setDashoffset;
anime.stagger = stagger;
anime.timeline = timeline;
anime.easing = parseEasings;
anime.penner = penner;
anime.random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };

/* harmony default export */ __webpack_exports__["default"] = (anime);


/***/ }),

/***/ "./src/js/modules/animate-in-out.js":
/*!******************************************!*\
  !*** ./src/js/modules/animate-in-out.js ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   animateIn: function() { return /* binding */ animateIn; },
/* harmony export */   animateOut: function() { return /* binding */ animateOut; }
/* harmony export */ });
/* harmony import */ var _lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./../lib/anime.es.js */ "./src/js/lib/anime.es.js");


// =============  Функция скрытия записей  ===========================================================
const product = document.querySelector(".customers__table-wrapper");
function animateOut() {
    return new Promise((resolve, reject) => {
        const items = document.querySelectorAll(".items");

        items.forEach((item, index) => {
            if (index % 2 == 0) {
                item.classList.add("hide-to-right");
            } else {
                item.classList.add("hide-to-left");
            }
        });

        var hideToRight = document.querySelectorAll(".hide-to-right");
        var hideToLeft = document.querySelectorAll(".hide-to-left");

        (0,_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__["default"])({
            targets: hideToRight,
            translateX: "100%",
            delay: _lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__["default"].stagger(100, { easing: "easeOutQuad" }),
            duration: 3000,
            // update: function(anim) {
            //     progressLogEl.value =
            //         "progress : " + Math.round(anim.progress) + "%";
            //     beginLogEl.value = "began : " + anim.began;
            //     completeLogEl.value = "completed : " + anim.completed;
            // },
            // begin: function(anim) {
            //     beginLogEl.value = "began : " + anim.began;
            // },
            // complete: function(anim) {
            //     completeLogEl.value = "completed : " + anim.completed;
            // },
        });

        (0,_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__["default"])({
            targets: hideToLeft,
            translateX: "-100%",
            // easing: "easeInOutQuad",
            duration: 3000,
            delay: _lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__["default"].stagger(100, { easing: "easeOutQuad" }),
        });
        // }
        product.style.opacity = 0;

        resolve();
    });
}
// =============  Функция появления записей  ===========================================================
function animateIn() {
    return new Promise((resolve, reject) => {
        const items = document.querySelectorAll(".items");

        product.style.opacity = 1;

        var hideToRight = document.querySelectorAll(".hide-to-right");
        var hideToLeft = document.querySelectorAll(".hide-to-left");

        (0,_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__["default"])({
            targets: hideToRight,
            // opacity: [0, 1],
            translateX: ["100%", 0],
            delay: _lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__["default"].stagger(100, { easing: "easeOutQuad" }),
            duration: 3500,
        });

        (0,_lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__["default"])({
            targets: hideToLeft,
            // opacity: [0, 1],
            translateX: ["-100%", 0],
            // easing: "easeInOutQuad",
            duration: 3500,
            delay: _lib_anime_es_js__WEBPACK_IMPORTED_MODULE_0__["default"].stagger(100, { easing: "easeOutQuad" }),
        });
        resolve();
    });
}

// ====================  Тестовый вариант  ======================================
function animateOutPromice() {
    return new Promise((resolve, reject) => {
        const items = document.querySelectorAll(".items");

        console.log("items");
        console.log(items);
        console.log("-------------");

        async function animate({ duration, draw, timing }) {
            return new Promise((resolve) => {
                let start = performance.now();

                requestAnimationFrame(function animate(time) {
                    let timeFraction = (time - start) / duration;
                    if (timeFraction > 1) timeFraction = 1;

                    let progress = timing(timeFraction);

                    console.log("progress in animate: " + progress);

                    draw(progress);

                    if (timeFraction < 1) {
                        requestAnimationFrame(animate);
                    }
                });
                resolve();
            });
            await animate();
        }

        async function goAnimate() {
            await animate({
                duration: 3000,
                // timing: bounceEaseInOut,
                timing: circEaseInOut,
                draw: function(progress) {
                    // const items = document.querySelectorAll(".items");
                    console.log("items");
                    console.log(items);
                    console.log("-------------");

                    items.forEach((item, index) => {
                        // console.log("Index: " + index);
                        // console.log("Item: ");
                        // console.log(item);
                        console.log("progress in animateOut: " + progress);

                        if (index % 2 == 0) {
                            console.log("index%2 == 0");
                            item.style.left = progress * 100 + "%";
                        } else {
                            console.log("index%2 != 0");
                            item.style.left = -(progress * 100) + "%";
                        }
                        item.style.opacity = progress;
                        console.log("left: " + item.style.left);
                        console.log("opacity: " + item.style.opacity);
                    });
                },
            });
        }

        goAnimate();

        resolve();
    });
}

// Устанавливаем начальные значения за пределами таблицы и opacity: 0
function setOutOfRange() {
    const items = document.querySelectorAll(".items");

    items.forEach((item, index) => {
        if (index % 2 == 0) {
            item.classList.add("hide-to-right");
        } else {
            item.classList.add("hide-to-left");
        }
        item.style.opacity = 0;
    });
}

// ==========================================================================
function makeEaseInOut(timing) {
    return function(timeFraction) {
        if (timeFraction < 0.5) return timing(2 * timeFraction) / 2;
        else return (2 - timing(2 * (1 - timeFraction))) / 2;
    };
}

// ====================  Функции расчета времени  ================================

// ----------  Отскоки  ------------------
function bounce(timeFraction) {
    for (let a = 0, b = 1; 1; a += b, b /= 2) {
        if (timeFraction >= (7 - 4 * a) / 11) {
            return (
                -Math.pow((11 - 6 * a - 11 * timeFraction) / 4, 2) +
                Math.pow(b, 2)
            );
        }
    }
}

let bounceEaseInOut = makeEaseInOut(bounce);

// ----------  Дуга  -------------------
function circ(timeFraction) {
    return 1 - Math.sin(Math.acos(timeFraction));
}

let circEaseInOut = makeEaseInOut(circ);

// brick.onclick = function() {
//     animate({
//         duration: 3000,
//         timing: bounceEaseInOut,
//         draw: function(progress) {
//             brick.style.left = progress * 500 + "px";
//         },
//     });
// };

// function animate({ duration, draw, timing }) {
//     return new Promise((resolve) => {
//         let start = performance.now();

//         requestAnimationFrame(function animate(time) {
//             let timeFraction = (time - start) / duration;
//             if (timeFraction > 1) timeFraction = 1;

//             let progress = timing(timeFraction);

//             console.log('progress in animate: ' + progress);

//             draw(progress);

//             if (timeFraction < 1) {
//                 requestAnimationFrame(animate);
//             }
//         });
//         resolve();
//     });




/***/ }),

/***/ "./src/js/modules/btn-status.js":
/*!**************************************!*\
  !*** ./src/js/modules/btn-status.js ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
function btnStatus() {
    return new Promise((resolve, reject) => {
        const btns = document.querySelectorAll(".status-btn");

        btns.forEach(function(btn) {
            // В зависимости от статуса устанавливаем класс 'active'
            if (btn.innerText.toLowerCase() == "active") {
                btn.classList.add("status-btn--active");
            } else if (btn.innerText.toLowerCase() == "inactive") {
                btn.classList.remove("status-btn--active");
            }

            btn.addEventListener("click", function() {
                const isActive = btn.classList.toggle("status-btn--active");

                if (isActive) {
                    btn.innerText = "Active";
                } else {
                    btn.innerText = "Inactive";
                }
            });
        });
        resolve();
    });
}

/* harmony default export */ __webpack_exports__["default"] = (btnStatus);

/***/ }),

/***/ "./src/js/modules/customers.js":
/*!*************************************!*\
  !*** ./src/js/modules/customers.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _data_customers_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./../../data/customers.json */ "./src/data/customers.json");
/* harmony import */ var _btn_status_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./btn-status.js */ "./src/js/modules/btn-status.js");
/* harmony import */ var _animate_in_out_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./animate-in-out.js */ "./src/js/modules/animate-in-out.js");




function customers() {
    
    // Количество выводимых записей на странице
    let lengthPages = 8;
    // Первая загрузка страницы
    let firstRun = true;

    const numPages = Math.ceil( _data_customers_json__WEBPACK_IMPORTED_MODULE_0__.length / lengthPages); // Количество страниц
    let arrayPages = [];        // Массив всех страниц
    let arrayPagesToShow = [];  // Массив фрагмента (4) страниц в пагинации
    let arrayPagesLast = []; // Массив последних (4) страниц в пагинации
    let isLastPagesRange = false; // Последний массив страниц

    // Начальный и конечный индекс выборки значений
    let startIndexOfRange;
    let endIndexOfRange;

    // Начальный и конечный индекс выборки страниц
    let startIndexOfRangePages;
    let endIndexOfRangePages;

    // Массив со страницами
    for (let i = 0; i < numPages; i++) {
        arrayPages[i] = i + 1;
    }

    // Последние 4 страницы
    if (arrayPages.length > 5) {
        arrayPagesLast = arrayPages.slice(
            arrayPages.length - 4,
            arrayPages.length
        );
    }
    
    // Инициализация текущей страницы и ее индекса
    let currentPageIndex = 0;
    let currentPage = arrayPages[currentPageIndex];
    let customersToShow;

    // Фрагмент страниц для вывода в пагинации
    if (numPages <= 4) {
        arrayPagesToShow = arrayPages;
        console.log("arrayPagesToShow: " + arrayPagesToShow);
        console.log("currentPageIndex: " + currentPageIndex);

        if (currentPageIndex == 0) {
            startIndexOfRangePages = 0;
        }

        endIndexOfRangePages = arrayPagesToShow.length - 1;
    } else {
        if (currentPageIndex == 0) {
            startIndexOfRangePages = 0;
        }

        endIndexOfRangePages = startIndexOfRangePages + 4;

        arrayPagesToShow = arrayPages.slice(
            startIndexOfRangePages,
            endIndexOfRangePages
        );
    }

    // Элементы статистики: "показано 1 до 8 эл-тов из "
    const startItem = document.querySelector(".start-item");
    const endItem = document.querySelector(".end-item");
    const totalItems = document.querySelector(".total-items");

    // Node диапазона кнопок пагинации
    const btnPrev = document.querySelector(".btn-prev");
    const btnNext = document.querySelector(".btn-next");
    const btnPage = document.querySelector(".btn-pg");
    
    const product = document.querySelector(".customers__table-wrapper");

    // Начальный вывод страницы
    goInit();
    renderBtnRange();

    // Отслеживаем клик по странице в pagination range
    listenBtnClick();

    // ...запуск события на элементе!
    //   let event = new Event("click", {bubbles: true}); // (2)
    //   btnPages.dispatchEvent(event);

    // ==========   Обработчик нажатия кнопки  'btn-prev'  =================
    // const btnPrev = document.querySelector('.btn-prev');
    btnPrev.addEventListener("click", function() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            currentPage = arrayPages[currentPageIndex];

            // Если новый счетчик меньше левой границы диапазона вывода, меняем диапазон
            if (currentPageIndex < startIndexOfRangePages) {
                startIndexOfRangePages = currentPageIndex;
                endIndexOfRangePages = startIndexOfRangePages + 4;
                arrayPagesToShow = arrayPages.slice(
                    startIndexOfRangePages,
                    endIndexOfRangePages
                );

                renderBtnRange();
            }
        }

        // Установка активной страницы в блоке 'btn-range'
        // Установка/снятие атрибуа "disabled"
        // Обновляем данные на странице
        goInit();
    });

    // ==========   Обработчик нажатия кнопки  'btn-next'  =================
    btnNext.addEventListener("click", function() {
        if (currentPageIndex < arrayPages.length) {
            currentPageIndex++;
            currentPage = arrayPages[currentPageIndex];

            // Если новый счетчик больше правой границы диапазона вывода, меняем диапазон
            if (currentPageIndex >= endIndexOfRangePages) {
                endIndexOfRangePages = currentPageIndex + 1;
                startIndexOfRangePages = endIndexOfRangePages - 4;
                arrayPagesToShow = arrayPages.slice(
                    startIndexOfRangePages,
                    endIndexOfRangePages
                );
                renderBtnRange();
            }
        }
        // Установка активной страницы в блоке 'btn-range'
        // Установка/снятие атрибуа "disabled"
        // Обновляем данные на странице
        goInit();
    });

    // ==========   Обработчик нажатия кнопки  'btn-pg'  =================
    btnPage.addEventListener("click", function() {
        // делаем шаг на 40 страниц, если доступно
        if (Number(currentPage) + 40 < arrayPages.length) {
            currentPage = Number(currentPage) + 40;
            currentPageIndex = arrayPages.indexOf(currentPage);

            endIndexOfRangePages = currentPageIndex + 1;
            startIndexOfRangePages = endIndexOfRangePages - 4;

            isLastPagesRange = false;
        } else {
            currentPageIndex = arrayPages.length - 1;
            currentPage = arrayPages[arrayPages.length - 1];

            endIndexOfRangePages = currentPageIndex + 1;
            startIndexOfRangePages = endIndexOfRangePages - 4;

            isLastPagesRange = true;
        }

        arrayPagesToShow = arrayPages.slice(
            startIndexOfRangePages,
            endIndexOfRangePages
        );

        renderBtnRange();

        // Установка активной страницы в блоке 'btn-range'
        // Установка/снятие атрибуа "disabled"
        // Обновляем данные на странице
        goInit();
    });

    // ==========   Инициализация   ===========================================================
    function listenBtnClick() {
        const btnRange = document.querySelectorAll(".btn-range");

        btnRange.forEach(function(el) {
            el.addEventListener("click", function(e) {
                currentPage = Number(e.target.innerText);
                currentPageIndex = arrayPages.indexOf(Number(currentPage));

                goInit();
            });
        });
    }

    // ==========   Инициализация   ===========================================================
    function goInit() {
        // Установка активной страницы в блоке 'btn-range'
        setActiveButtonRange(currentPage);

        // Установка/снятие атрибуа "disabled"
        checkDisabled();

        // Обновляем данные на странице
        renderPage();
    }

    // ==========   Установка атрибуа "disabled"   ============================================
    function checkDisabled() {
        // Если достигли левой границы, делаем кнопку btnPrev - "disabled"
        if (currentPageIndex > 0) {
            btnPrev.removeAttribute("disabled");
        } else if (currentPageIndex == 0) {
            btnPrev.setAttribute("disabled", "");
        }

        // Если достигли правой границы, делаем кнопку btnNext - "disabled"
        if (currentPageIndex < arrayPages.length - 1) {
            btnNext.removeAttribute("disabled");
        } else if (currentPageIndex == arrayPages.length - 1) {
            btnNext.setAttribute("disabled", "");
        }

        checkInLastRange();
        // Если меньше 40 страниц, делаем кнопку btnPage - "disabled"
        // let maxRange = arrayPages.length < 40 || isLastPagesRange;

        if (arrayPages.length < 40 || isLastPagesRange) {
            btnPage.setAttribute("disabled", "");
        } else {
            btnPage.removeAttribute("disabled");
        }
    }

    // ==========   Установка активной страницы в блоке 'btn-range'   =========================
    setActiveButtonRange(currentPage);

    // ==========   Функция проверки, попадаем ли в список последних страниц   ================
    function checkInLastRange() {
        if (arrayPagesLast.indexOf(Number(currentPage)) != -1) {
            isLastPagesRange = true;
        } else {
            isLastPagesRange = false;
        }
    }

    // ==========   Функция установки активной страницы в блоке 'btn-range'   =================
    function setActiveButtonRange(currentPage) {
        const btnPages = document.querySelectorAll(".btn-range > .btn-pag");

        btnPages.forEach(function(btn) {
            // В зависимости от статуса устанавливаем класс 'active'
            if (btn.innerText == currentPage) {
                btn.classList.add("btn-pag--active");
            } else {
                btn.classList.remove("btn-pag--active");
            }
        });
    }

    // == Функция усановки начального и конечного индекса выводимых элементов данной страницы ==
    function getIndexRange(currentPage) {
        if (currentPage == 1) {
            startIndexOfRange = 0;
            endIndexOfRange = lengthPages - 1;
        } else {
            startIndexOfRange = (currentPage - 1) * lengthPages;
            endIndexOfRange = startIndexOfRange + lengthPages - 1;

            if (endIndexOfRange > _data_customers_json__WEBPACK_IMPORTED_MODULE_0__.length - 1) {
                endIndexOfRange = _data_customers_json__WEBPACK_IMPORTED_MODULE_0__.length - 1;
            }
        }
    }

    // ==========   Вывод диапазона страниц   =============================
    function renderBtnRange() {
        const btnRange = document.querySelector(".btn-range");
        btnRange.innerHTML = "";

        const maxPages = arrayPagesToShow.length < 4 ? arrayPages.length : 4;
        // console.log("max pages: " + maxPages);
        let text = "";

        arrayPagesToShow.forEach((page, i) => {
            text = `<button class="btn-pag">${page}</button>`;

            btnRange.innerHTML += text;
        });
    }

    // ==========   Вывод продуктов в цикле из каталога   =============================
    // const product = document.querySelector(".customers__table-wrapper");
    function showItems() {
        return new Promise((resolve) => {
            // Временно скраваем блок, для анимации появления
            // product.classList.add('none');

            product.innerHTML = "";
            let text = "";
            let textToShow = "";
            let classHide = "";

            customersToShow.forEach(function(item, index) {
                if (index % 2 == 0) {
                    classHide = "hide-to-right";
                } else {
                    classHide = "hide-to-left";
                }

                text = `
                <ul class="items ${classHide}">
                    <li class="item-name">${item.name}</li>
                    <li class="item-company">${item.company}</li>    
                    <li class="item-phone">${item.phone}</li>
                    <li class="item-email">${item.email}</li>
                    <li class="item-country">${item.country}</li>
                    <li class="item-status">
                        <button class="status-btn">${item.status}</button>
                    </li>
                </ul>
            `;
                textToShow += text;
            });

            if (firstRun) {
                product.style.opacity = 1;
                product.innerHTML = textToShow;
            } else {
                product.innerHTML = textToShow;
                // Устанавливаем начальные значения за пределами таблицы и opacity: 0
                //  setOutOfRange();
            }
            resolve();
        });
    }

    // ==============  Асинхронная функция паузы  =============================================
    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function pause() {
        // Анимация исчезания строк
        await (0,_animate_in_out_js__WEBPACK_IMPORTED_MODULE_2__.animateOut)();
        //  console.log("after Animate Out");
        //  console.log("Taking a break...");
        await sleep(1000);
        //  console.log("One second later");
        await showItems();
        //  console.log("after Show Items");
        //  console.log("Taking a break 0.3...");
        await sleep(100);
        //  console.log("later 2");
        await (0,_animate_in_out_js__WEBPACK_IMPORTED_MODULE_2__.animateIn)();
        //  console.log("after Animate In");
        await (0,_btn_status_js__WEBPACK_IMPORTED_MODULE_1__["default"])();
        //  console.log("after btnStatus");
        await sleep(2500);
        await setScrollAuto();
    }

    // Функция рендеринга/инициализации страницы
    function renderPage() {
        // Определяем начальный и конечный индекс элементов данной страницы
        getIndexRange(currentPage);

        // Выборка элементов текущей страницы для рендеринга
        customersToShow = _data_customers_json__WEBPACK_IMPORTED_MODULE_0__.slice(
            startIndexOfRange,
            endIndexOfRange + 1
        );

        // Элементы статистики: "показано 1 до 8 эл-тов из "
        startItem.textContent = startIndexOfRange + 1;
        endItem.textContent = endIndexOfRange + 1;
        totalItems.textContent = _data_customers_json__WEBPACK_IMPORTED_MODULE_0__.length;

        if (firstRun) {
            // Выводим данные
            showItems();
            (0,_btn_status_js__WEBPACK_IMPORTED_MODULE_1__["default"])();

            firstRun = false;
        } else {
            //  Убираем скролл на время анимации
            const custTable = document.querySelector(".customers__table");
            custTable.style.overflow = "hidden";
            // Анимация исчезания/появления строк
            pause();
        }
    }

    // Восстанавливаем скролл в конце анимации
    function setScrollAuto() {
        return new Promise((resolve, reject) => {
            const custTable = document.querySelector(".customers__table");
            custTable.style.overflow = "auto";
            resolve();
        });
    }
    
}

/* harmony default export */ __webpack_exports__["default"] = (customers);

/***/ }),

/***/ "./src/js/modules/menu-active.js":
/*!***************************************!*\
  !*** ./src/js/modules/menu-active.js ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
function menuActive() {
    const items = document.querySelectorAll(".nav__item");
    const customers = document.querySelector(".customers");

    items.forEach(function(item) {

        item.addEventListener("click", function() {
            // console.log("item: ");
            // console.log(item);
            // console.log("-----------------");

            // Убираем статус 'active' у всех элеменов меню
            items.forEach(function (item) {
                item.classList.remove("active");
            });

            item.classList.add("active");

            if (item.classList.contains("nav__item-customers")) {
                customers.classList.add('customers--active');
            } else {
                customers.classList.remove("customers--active");
            }
        });
    });
}

/* harmony default export */ __webpack_exports__["default"] = (menuActive);

/***/ }),

/***/ "./src/data/customers.json":
/*!*********************************!*\
  !*** ./src/data/customers.json ***!
  \*********************************/
/***/ (function(module) {

module.exports = JSON.parse('[{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"01","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"02","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"03","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"04","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"},{"id":"05","name":"Jerome Bell","company":"Google","phone":"(629) 555-0129","email":"jerome@google.com","country":"Réunion","status":"Active"},{"id":"06","name":"Kathryn Murphy","company":"Microsoft","phone":"(406) 555-0120","email":"kathryn@microsoft.com","country":"Curaçao","status":"Active"},{"id":"07","name":"Jacob Jones","company":"Yahoo","phone":"(208) 555-0112","email":"jacob@yahoo.com","country":"Brazil","status":"Active"},{"id":"08","name":"Kristin Watson","company":"Facebook","phone":"(704) 555-0127","email":"kristin@facebook.com","country":"Åland Islands","status":"Inactive"},{"id":"09","name":"Jane Cooper","company":"Microsoft","phone":"(225) 555-0118","email":"jane@microsoft.com","country":"United States","status":"Active"},{"id":"10","name":"Floyd Miles","company":"Yahoo","phone":"(225) 555-0100","email":"floyd@yahoo.com","country":"Kiribati","status":"Inactive"},{"id":"11","name":"Ronald Richards","company":"Adobe","phone":"(302) 555-0107","email":"ronald@adobe.com","country":"Israel","status":"Inactive"},{"id":"12","name":"Marvin McKinney","company":"Tesla","phone":"(252) 555-0126","email":"marvin@tesla.com","country":"Iran","status":"Active"}]');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
!function() {
/*!*************************!*\
  !*** ./src/js/index.js ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _modules_menu_active_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./modules/menu-active.js */ "./src/js/modules/menu-active.js");
/* harmony import */ var _modules_customers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./modules/customers.js */ "./src/js/modules/customers.js");

(0,_modules_menu_active_js__WEBPACK_IMPORTED_MODULE_0__["default"])();


(0,_modules_customers_js__WEBPACK_IMPORTED_MODULE_1__["default"])();


// Мобильная навигация
const navBtn = document.querySelector(".mobile-nav-btn");
const nav = document.querySelector(".mobile-nav");
const menuIcon = document.querySelector(".nav-icon");

const fade = document.querySelector(".mobile-nav-fade");

navBtn.onclick = toggleMobile;
fade.onclick = toggleMobile;

function toggleMobile() {
    nav.classList.toggle("mobile-nav--open");
    menuIcon.classList.toggle("nav-icon--active");
    document.body.classList.toggle("no-scroll");
    fade.classList.toggle("mobile-nav-fade--open");
}

// Мобильная навигация
// import mobileNav from './modules/mobile-nav.js';
// mobileNav();

}();
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUMsY0FBYyxHQUFHO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7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Ly8vLi9zcmMvanMvbGliL2FuaW1lLmVzLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9tb2R1bGVzL2FuaW1hdGUtaW4tb3V0LmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9tb2R1bGVzL2J0bi1zdGF0dXMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL21vZHVsZXMvY3VzdG9tZXJzLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9tb2R1bGVzL21lbnUtYWN0aXZlLmpzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovLy8uL3NyYy9qcy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogYW5pbWUuanMgdjMuMi4yXG4gKiAoYykgMjAyMyBKdWxpYW4gR2FybmllclxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBhbmltZWpzLmNvbVxuICovXG5cbi8vIERlZmF1bHRzXG5cbnZhciBkZWZhdWx0SW5zdGFuY2VTZXR0aW5ncyA9IHtcbiAgdXBkYXRlOiBudWxsLFxuICBiZWdpbjogbnVsbCxcbiAgbG9vcEJlZ2luOiBudWxsLFxuICBjaGFuZ2VCZWdpbjogbnVsbCxcbiAgY2hhbmdlOiBudWxsLFxuICBjaGFuZ2VDb21wbGV0ZTogbnVsbCxcbiAgbG9vcENvbXBsZXRlOiBudWxsLFxuICBjb21wbGV0ZTogbnVsbCxcbiAgbG9vcDogMSxcbiAgZGlyZWN0aW9uOiAnbm9ybWFsJyxcbiAgYXV0b3BsYXk6IHRydWUsXG4gIHRpbWVsaW5lT2Zmc2V0OiAwXG59O1xuXG52YXIgZGVmYXVsdFR3ZWVuU2V0dGluZ3MgPSB7XG4gIGR1cmF0aW9uOiAxMDAwLFxuICBkZWxheTogMCxcbiAgZW5kRGVsYXk6IDAsXG4gIGVhc2luZzogJ2Vhc2VPdXRFbGFzdGljKDEsIC41KScsXG4gIHJvdW5kOiAwXG59O1xuXG52YXIgdmFsaWRUcmFuc2Zvcm1zID0gWyd0cmFuc2xhdGVYJywgJ3RyYW5zbGF0ZVknLCAndHJhbnNsYXRlWicsICdyb3RhdGUnLCAncm90YXRlWCcsICdyb3RhdGVZJywgJ3JvdGF0ZVonLCAnc2NhbGUnLCAnc2NhbGVYJywgJ3NjYWxlWScsICdzY2FsZVonLCAnc2tldycsICdza2V3WCcsICdza2V3WScsICdwZXJzcGVjdGl2ZScsICdtYXRyaXgnLCAnbWF0cml4M2QnXTtcblxuLy8gQ2FjaGluZ1xuXG52YXIgY2FjaGUgPSB7XG4gIENTUzoge30sXG4gIHNwcmluZ3M6IHt9XG59O1xuXG4vLyBVdGlsc1xuXG5mdW5jdGlvbiBtaW5NYXgodmFsLCBtaW4sIG1heCkge1xuICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgodmFsLCBtaW4pLCBtYXgpO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdDb250YWlucyhzdHIsIHRleHQpIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKHRleHQpID4gLTE7XG59XG5cbmZ1bmN0aW9uIGFwcGx5QXJndW1lbnRzKGZ1bmMsIGFyZ3MpIHtcbiAgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7XG59XG5cbnZhciBpcyA9IHtcbiAgYXJyOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gQXJyYXkuaXNBcnJheShhKTsgfSxcbiAgb2JqOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gc3RyaW5nQ29udGFpbnMoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpLCAnT2JqZWN0Jyk7IH0sXG4gIHB0aDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGlzLm9iaihhKSAmJiBhLmhhc093blByb3BlcnR5KCd0b3RhbExlbmd0aCcpOyB9LFxuICBzdmc6IGZ1bmN0aW9uIChhKSB7IHJldHVybiBhIGluc3RhbmNlb2YgU1ZHRWxlbWVudDsgfSxcbiAgaW5wOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gYSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQ7IH0sXG4gIGRvbTogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGEubm9kZVR5cGUgfHwgaXMuc3ZnKGEpOyB9LFxuICBzdHI6IGZ1bmN0aW9uIChhKSB7IHJldHVybiB0eXBlb2YgYSA9PT0gJ3N0cmluZyc7IH0sXG4gIGZuYzogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIHR5cGVvZiBhID09PSAnZnVuY3Rpb24nOyB9LFxuICB1bmQ6IGZ1bmN0aW9uIChhKSB7IHJldHVybiB0eXBlb2YgYSA9PT0gJ3VuZGVmaW5lZCc7IH0sXG4gIG5pbDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGlzLnVuZChhKSB8fCBhID09PSBudWxsOyB9LFxuICBoZXg6IGZ1bmN0aW9uIChhKSB7IHJldHVybiAvKF4jWzAtOUEtRl17Nn0kKXwoXiNbMC05QS1GXXszfSQpL2kudGVzdChhKTsgfSxcbiAgcmdiOiBmdW5jdGlvbiAoYSkgeyByZXR1cm4gL15yZ2IvLnRlc3QoYSk7IH0sXG4gIGhzbDogZnVuY3Rpb24gKGEpIHsgcmV0dXJuIC9eaHNsLy50ZXN0KGEpOyB9LFxuICBjb2w6IGZ1bmN0aW9uIChhKSB7IHJldHVybiAoaXMuaGV4KGEpIHx8IGlzLnJnYihhKSB8fCBpcy5oc2woYSkpOyB9LFxuICBrZXk6IGZ1bmN0aW9uIChhKSB7IHJldHVybiAhZGVmYXVsdEluc3RhbmNlU2V0dGluZ3MuaGFzT3duUHJvcGVydHkoYSkgJiYgIWRlZmF1bHRUd2VlblNldHRpbmdzLmhhc093blByb3BlcnR5KGEpICYmIGEgIT09ICd0YXJnZXRzJyAmJiBhICE9PSAna2V5ZnJhbWVzJzsgfSxcbn07XG5cbi8vIEVhc2luZ3NcblxuZnVuY3Rpb24gcGFyc2VFYXNpbmdQYXJhbWV0ZXJzKHN0cmluZykge1xuICB2YXIgbWF0Y2ggPSAvXFwoKFteKV0rKVxcKS8uZXhlYyhzdHJpbmcpO1xuICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXS5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAocCkgeyByZXR1cm4gcGFyc2VGbG9hdChwKTsgfSkgOiBbXTtcbn1cblxuLy8gU3ByaW5nIHNvbHZlciBpbnNwaXJlZCBieSBXZWJraXQgQ29weXJpZ2h0IMKpIDIwMTYgQXBwbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBodHRwczovL3dlYmtpdC5vcmcvZGVtb3Mvc3ByaW5nL3NwcmluZy5qc1xuXG5mdW5jdGlvbiBzcHJpbmcoc3RyaW5nLCBkdXJhdGlvbikge1xuXG4gIHZhciBwYXJhbXMgPSBwYXJzZUVhc2luZ1BhcmFtZXRlcnMoc3RyaW5nKTtcbiAgdmFyIG1hc3MgPSBtaW5NYXgoaXMudW5kKHBhcmFtc1swXSkgPyAxIDogcGFyYW1zWzBdLCAuMSwgMTAwKTtcbiAgdmFyIHN0aWZmbmVzcyA9IG1pbk1heChpcy51bmQocGFyYW1zWzFdKSA/IDEwMCA6IHBhcmFtc1sxXSwgLjEsIDEwMCk7XG4gIHZhciBkYW1waW5nID0gbWluTWF4KGlzLnVuZChwYXJhbXNbMl0pID8gMTAgOiBwYXJhbXNbMl0sIC4xLCAxMDApO1xuICB2YXIgdmVsb2NpdHkgPSAgbWluTWF4KGlzLnVuZChwYXJhbXNbM10pID8gMCA6IHBhcmFtc1szXSwgLjEsIDEwMCk7XG4gIHZhciB3MCA9IE1hdGguc3FydChzdGlmZm5lc3MgLyBtYXNzKTtcbiAgdmFyIHpldGEgPSBkYW1waW5nIC8gKDIgKiBNYXRoLnNxcnQoc3RpZmZuZXNzICogbWFzcykpO1xuICB2YXIgd2QgPSB6ZXRhIDwgMSA/IHcwICogTWF0aC5zcXJ0KDEgLSB6ZXRhICogemV0YSkgOiAwO1xuICB2YXIgYSA9IDE7XG4gIHZhciBiID0gemV0YSA8IDEgPyAoemV0YSAqIHcwICsgLXZlbG9jaXR5KSAvIHdkIDogLXZlbG9jaXR5ICsgdzA7XG5cbiAgZnVuY3Rpb24gc29sdmVyKHQpIHtcbiAgICB2YXIgcHJvZ3Jlc3MgPSBkdXJhdGlvbiA/IChkdXJhdGlvbiAqIHQpIC8gMTAwMCA6IHQ7XG4gICAgaWYgKHpldGEgPCAxKSB7XG4gICAgICBwcm9ncmVzcyA9IE1hdGguZXhwKC1wcm9ncmVzcyAqIHpldGEgKiB3MCkgKiAoYSAqIE1hdGguY29zKHdkICogcHJvZ3Jlc3MpICsgYiAqIE1hdGguc2luKHdkICogcHJvZ3Jlc3MpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3Jlc3MgPSAoYSArIGIgKiBwcm9ncmVzcykgKiBNYXRoLmV4cCgtcHJvZ3Jlc3MgKiB3MCk7XG4gICAgfVxuICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHsgcmV0dXJuIHQ7IH1cbiAgICByZXR1cm4gMSAtIHByb2dyZXNzO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RHVyYXRpb24oKSB7XG4gICAgdmFyIGNhY2hlZCA9IGNhY2hlLnNwcmluZ3Nbc3RyaW5nXTtcbiAgICBpZiAoY2FjaGVkKSB7IHJldHVybiBjYWNoZWQ7IH1cbiAgICB2YXIgZnJhbWUgPSAxLzY7XG4gICAgdmFyIGVsYXBzZWQgPSAwO1xuICAgIHZhciByZXN0ID0gMDtcbiAgICB3aGlsZSh0cnVlKSB7XG4gICAgICBlbGFwc2VkICs9IGZyYW1lO1xuICAgICAgaWYgKHNvbHZlcihlbGFwc2VkKSA9PT0gMSkge1xuICAgICAgICByZXN0Kys7XG4gICAgICAgIGlmIChyZXN0ID49IDE2KSB7IGJyZWFrOyB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN0ID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGR1cmF0aW9uID0gZWxhcHNlZCAqIGZyYW1lICogMTAwMDtcbiAgICBjYWNoZS5zcHJpbmdzW3N0cmluZ10gPSBkdXJhdGlvbjtcbiAgICByZXR1cm4gZHVyYXRpb247XG4gIH1cblxuICByZXR1cm4gZHVyYXRpb24gPyBzb2x2ZXIgOiBnZXREdXJhdGlvbjtcblxufVxuXG4vLyBCYXNpYyBzdGVwcyBlYXNpbmcgaW1wbGVtZW50YXRpb24gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZnIvZG9jcy9XZWIvQ1NTL3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uXG5cbmZ1bmN0aW9uIHN0ZXBzKHN0ZXBzKSB7XG4gIGlmICggc3RlcHMgPT09IHZvaWQgMCApIHN0ZXBzID0gMTA7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiBNYXRoLmNlaWwoKG1pbk1heCh0LCAwLjAwMDAwMSwgMSkpICogc3RlcHMpICogKDEgLyBzdGVwcyk7IH07XG59XG5cbi8vIEJlemllckVhc2luZyBodHRwczovL2dpdGh1Yi5jb20vZ3JlL2Jlemllci1lYXNpbmdcblxudmFyIGJlemllciA9IChmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGtTcGxpbmVUYWJsZVNpemUgPSAxMTtcbiAgdmFyIGtTYW1wbGVTdGVwU2l6ZSA9IDEuMCAvIChrU3BsaW5lVGFibGVTaXplIC0gMS4wKTtcblxuICBmdW5jdGlvbiBBKGFBMSwgYUEyKSB7IHJldHVybiAxLjAgLSAzLjAgKiBhQTIgKyAzLjAgKiBhQTEgfVxuICBmdW5jdGlvbiBCKGFBMSwgYUEyKSB7IHJldHVybiAzLjAgKiBhQTIgLSA2LjAgKiBhQTEgfVxuICBmdW5jdGlvbiBDKGFBMSkgICAgICB7IHJldHVybiAzLjAgKiBhQTEgfVxuXG4gIGZ1bmN0aW9uIGNhbGNCZXppZXIoYVQsIGFBMSwgYUEyKSB7IHJldHVybiAoKEEoYUExLCBhQTIpICogYVQgKyBCKGFBMSwgYUEyKSkgKiBhVCArIEMoYUExKSkgKiBhVCB9XG4gIGZ1bmN0aW9uIGdldFNsb3BlKGFULCBhQTEsIGFBMikgeyByZXR1cm4gMy4wICogQShhQTEsIGFBMikgKiBhVCAqIGFUICsgMi4wICogQihhQTEsIGFBMikgKiBhVCArIEMoYUExKSB9XG5cbiAgZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlKGFYLCBhQSwgYUIsIG1YMSwgbVgyKSB7XG4gICAgdmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XG4gICAgZG8ge1xuICAgICAgY3VycmVudFQgPSBhQSArIChhQiAtIGFBKSAvIDIuMDtcbiAgICAgIGN1cnJlbnRYID0gY2FsY0JlemllcihjdXJyZW50VCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICBpZiAoY3VycmVudFggPiAwLjApIHsgYUIgPSBjdXJyZW50VDsgfSBlbHNlIHsgYUEgPSBjdXJyZW50VDsgfVxuICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IDAuMDAwMDAwMSAmJiArK2kgPCAxMCk7XG4gICAgcmV0dXJuIGN1cnJlbnRUO1xuICB9XG5cbiAgZnVuY3Rpb24gbmV3dG9uUmFwaHNvbkl0ZXJhdGUoYVgsIGFHdWVzc1QsIG1YMSwgbVgyKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcbiAgICAgIHZhciBjdXJyZW50U2xvcGUgPSBnZXRTbG9wZShhR3Vlc3NULCBtWDEsIG1YMik7XG4gICAgICBpZiAoY3VycmVudFNsb3BlID09PSAwLjApIHsgcmV0dXJuIGFHdWVzc1Q7IH1cbiAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICBhR3Vlc3NUIC09IGN1cnJlbnRYIC8gY3VycmVudFNsb3BlO1xuICAgIH1cbiAgICByZXR1cm4gYUd1ZXNzVDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJlemllcihtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcblxuICAgIGlmICghKDAgPD0gbVgxICYmIG1YMSA8PSAxICYmIDAgPD0gbVgyICYmIG1YMiA8PSAxKSkgeyByZXR1cm47IH1cbiAgICB2YXIgc2FtcGxlVmFsdWVzID0gbmV3IEZsb2F0MzJBcnJheShrU3BsaW5lVGFibGVTaXplKTtcblxuICAgIGlmIChtWDEgIT09IG1ZMSB8fCBtWDIgIT09IG1ZMikge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrU3BsaW5lVGFibGVTaXplOyArK2kpIHtcbiAgICAgICAgc2FtcGxlVmFsdWVzW2ldID0gY2FsY0JlemllcihpICoga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0VEZvclgoYVgpIHtcblxuICAgICAgdmFyIGludGVydmFsU3RhcnQgPSAwO1xuICAgICAgdmFyIGN1cnJlbnRTYW1wbGUgPSAxO1xuICAgICAgdmFyIGxhc3RTYW1wbGUgPSBrU3BsaW5lVGFibGVTaXplIC0gMTtcblxuICAgICAgZm9yICg7IGN1cnJlbnRTYW1wbGUgIT09IGxhc3RTYW1wbGUgJiYgc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyArK2N1cnJlbnRTYW1wbGUpIHtcbiAgICAgICAgaW50ZXJ2YWxTdGFydCArPSBrU2FtcGxlU3RlcFNpemU7XG4gICAgICB9XG5cbiAgICAgIC0tY3VycmVudFNhbXBsZTtcblxuICAgICAgdmFyIGRpc3QgPSAoYVggLSBzYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pIC8gKHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlICsgMV0gLSBzYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pO1xuICAgICAgdmFyIGd1ZXNzRm9yVCA9IGludGVydmFsU3RhcnQgKyBkaXN0ICoga1NhbXBsZVN0ZXBTaXplO1xuICAgICAgdmFyIGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xuXG4gICAgICBpZiAoaW5pdGlhbFNsb3BlID49IDAuMDAxKSB7XG4gICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JULCBtWDEsIG1YMik7XG4gICAgICB9IGVsc2UgaWYgKGluaXRpYWxTbG9wZSA9PT0gMC4wKSB7XG4gICAgICAgIHJldHVybiBndWVzc0ZvclQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gYmluYXJ5U3ViZGl2aWRlKGFYLCBpbnRlcnZhbFN0YXJ0LCBpbnRlcnZhbFN0YXJ0ICsga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHgpIHtcbiAgICAgIGlmIChtWDEgPT09IG1ZMSAmJiBtWDIgPT09IG1ZMikgeyByZXR1cm4geDsgfVxuICAgICAgaWYgKHggPT09IDAgfHwgeCA9PT0gMSkgeyByZXR1cm4geDsgfVxuICAgICAgcmV0dXJuIGNhbGNCZXppZXIoZ2V0VEZvclgoeCksIG1ZMSwgbVkyKTtcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBiZXppZXI7XG5cbn0pKCk7XG5cbnZhciBwZW5uZXIgPSAoZnVuY3Rpb24gKCkge1xuXG4gIC8vIEJhc2VkIG9uIGpRdWVyeSBVSSdzIGltcGxlbWVuYXRpb24gb2YgZWFzaW5nIGVxdWF0aW9ucyBmcm9tIFJvYmVydCBQZW5uZXIgKGh0dHA6Ly93d3cucm9iZXJ0cGVubmVyLmNvbS9lYXNpbmcpXG5cbiAgdmFyIGVhc2VzID0geyBsaW5lYXI6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiB0OyB9OyB9IH07XG5cbiAgdmFyIGZ1bmN0aW9uRWFzaW5ncyA9IHtcbiAgICBTaW5lOiBmdW5jdGlvbiAoKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gMSAtIE1hdGguY29zKHQgKiBNYXRoLlBJIC8gMik7IH07IH0sXG4gICAgRXhwbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQgPyBNYXRoLnBvdygyLCAxMCAqIHQgLSAxMCkgOiAwOyB9OyB9LFxuICAgIENpcmM6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiAxIC0gTWF0aC5zcXJ0KDEgLSB0ICogdCk7IH07IH0sXG4gICAgQmFjazogZnVuY3Rpb24gKCkgeyByZXR1cm4gZnVuY3Rpb24gKHQpIHsgcmV0dXJuIHQgKiB0ICogKDMgKiB0IC0gMik7IH07IH0sXG4gICAgQm91bmNlOiBmdW5jdGlvbiAoKSB7IHJldHVybiBmdW5jdGlvbiAodCkge1xuICAgICAgdmFyIHBvdzIsIGIgPSA0O1xuICAgICAgd2hpbGUgKHQgPCAoKCBwb3cyID0gTWF0aC5wb3coMiwgLS1iKSkgLSAxKSAvIDExKSB7fVxuICAgICAgcmV0dXJuIDEgLyBNYXRoLnBvdyg0LCAzIC0gYikgLSA3LjU2MjUgKiBNYXRoLnBvdygoIHBvdzIgKiAzIC0gMiApIC8gMjIgLSB0LCAyKVxuICAgIH07IH0sXG4gICAgRWxhc3RpYzogZnVuY3Rpb24gKGFtcGxpdHVkZSwgcGVyaW9kKSB7XG4gICAgICBpZiAoIGFtcGxpdHVkZSA9PT0gdm9pZCAwICkgYW1wbGl0dWRlID0gMTtcbiAgICAgIGlmICggcGVyaW9kID09PSB2b2lkIDAgKSBwZXJpb2QgPSAuNTtcblxuICAgICAgdmFyIGEgPSBtaW5NYXgoYW1wbGl0dWRlLCAxLCAxMCk7XG4gICAgICB2YXIgcCA9IG1pbk1heChwZXJpb2QsIC4xLCAyKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xuICAgICAgICByZXR1cm4gKHQgPT09IDAgfHwgdCA9PT0gMSkgPyB0IDogXG4gICAgICAgICAgLWEgKiBNYXRoLnBvdygyLCAxMCAqICh0IC0gMSkpICogTWF0aC5zaW4oKCgodCAtIDEpIC0gKHAgLyAoTWF0aC5QSSAqIDIpICogTWF0aC5hc2luKDEgLyBhKSkpICogKE1hdGguUEkgKiAyKSkgLyBwKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIGJhc2VFYXNpbmdzID0gWydRdWFkJywgJ0N1YmljJywgJ1F1YXJ0JywgJ1F1aW50J107XG5cbiAgYmFzZUVhc2luZ3MuZm9yRWFjaChmdW5jdGlvbiAobmFtZSwgaSkge1xuICAgIGZ1bmN0aW9uRWFzaW5nc1tuYW1lXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiBNYXRoLnBvdyh0LCBpICsgMik7IH07IH07XG4gIH0pO1xuXG4gIE9iamVjdC5rZXlzKGZ1bmN0aW9uRWFzaW5ncykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBlYXNlSW4gPSBmdW5jdGlvbkVhc2luZ3NbbmFtZV07XG4gICAgZWFzZXNbJ2Vhc2VJbicgKyBuYW1lXSA9IGVhc2VJbjtcbiAgICBlYXNlc1snZWFzZU91dCcgKyBuYW1lXSA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gMSAtIGVhc2VJbihhLCBiKSgxIC0gdCk7IH07IH07XG4gICAgZWFzZXNbJ2Vhc2VJbk91dCcgKyBuYW1lXSA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBmdW5jdGlvbiAodCkgeyByZXR1cm4gdCA8IDAuNSA/IGVhc2VJbihhLCBiKSh0ICogMikgLyAyIDogXG4gICAgICAxIC0gZWFzZUluKGEsIGIpKHQgKiAtMiArIDIpIC8gMjsgfTsgfTtcbiAgICBlYXNlc1snZWFzZU91dEluJyArIG5hbWVdID0gZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGZ1bmN0aW9uICh0KSB7IHJldHVybiB0IDwgMC41ID8gKDEgLSBlYXNlSW4oYSwgYikoMSAtIHQgKiAyKSkgLyAyIDogXG4gICAgICAoZWFzZUluKGEsIGIpKHQgKiAyIC0gMSkgKyAxKSAvIDI7IH07IH07XG4gIH0pO1xuXG4gIHJldHVybiBlYXNlcztcblxufSkoKTtcblxuZnVuY3Rpb24gcGFyc2VFYXNpbmdzKGVhc2luZywgZHVyYXRpb24pIHtcbiAgaWYgKGlzLmZuYyhlYXNpbmcpKSB7IHJldHVybiBlYXNpbmc7IH1cbiAgdmFyIG5hbWUgPSBlYXNpbmcuc3BsaXQoJygnKVswXTtcbiAgdmFyIGVhc2UgPSBwZW5uZXJbbmFtZV07XG4gIHZhciBhcmdzID0gcGFyc2VFYXNpbmdQYXJhbWV0ZXJzKGVhc2luZyk7XG4gIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgJ3NwcmluZycgOiByZXR1cm4gc3ByaW5nKGVhc2luZywgZHVyYXRpb24pO1xuICAgIGNhc2UgJ2N1YmljQmV6aWVyJyA6IHJldHVybiBhcHBseUFyZ3VtZW50cyhiZXppZXIsIGFyZ3MpO1xuICAgIGNhc2UgJ3N0ZXBzJyA6IHJldHVybiBhcHBseUFyZ3VtZW50cyhzdGVwcywgYXJncyk7XG4gICAgZGVmYXVsdCA6IHJldHVybiBhcHBseUFyZ3VtZW50cyhlYXNlLCBhcmdzKTtcbiAgfVxufVxuXG4vLyBTdHJpbmdzXG5cbmZ1bmN0aW9uIHNlbGVjdFN0cmluZyhzdHIpIHtcbiAgdHJ5IHtcbiAgICB2YXIgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHN0cik7XG4gICAgcmV0dXJuIG5vZGVzO1xuICB9IGNhdGNoKGUpIHtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGZpbHRlckFycmF5KGFyciwgY2FsbGJhY2spIHtcbiAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gIHZhciB0aGlzQXJnID0gYXJndW1lbnRzLmxlbmd0aCA+PSAyID8gYXJndW1lbnRzWzFdIDogdm9pZCAwO1xuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoaSBpbiBhcnIpIHtcbiAgICAgIHZhciB2YWwgPSBhcnJbaV07XG4gICAgICBpZiAoY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWwsIGksIGFycikpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godmFsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbkFycmF5KGFycikge1xuICByZXR1cm4gYXJyLnJlZHVjZShmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5jb25jYXQoaXMuYXJyKGIpID8gZmxhdHRlbkFycmF5KGIpIDogYik7IH0sIFtdKTtcbn1cblxuZnVuY3Rpb24gdG9BcnJheShvKSB7XG4gIGlmIChpcy5hcnIobykpIHsgcmV0dXJuIG87IH1cbiAgaWYgKGlzLnN0cihvKSkgeyBvID0gc2VsZWN0U3RyaW5nKG8pIHx8IG87IH1cbiAgaWYgKG8gaW5zdGFuY2VvZiBOb2RlTGlzdCB8fCBvIGluc3RhbmNlb2YgSFRNTENvbGxlY3Rpb24pIHsgcmV0dXJuIFtdLnNsaWNlLmNhbGwobyk7IH1cbiAgcmV0dXJuIFtvXTtcbn1cblxuZnVuY3Rpb24gYXJyYXlDb250YWlucyhhcnIsIHZhbCkge1xuICByZXR1cm4gYXJyLnNvbWUoZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGEgPT09IHZhbDsgfSk7XG59XG5cbi8vIE9iamVjdHNcblxuZnVuY3Rpb24gY2xvbmVPYmplY3Qobykge1xuICB2YXIgY2xvbmUgPSB7fTtcbiAgZm9yICh2YXIgcCBpbiBvKSB7IGNsb25lW3BdID0gb1twXTsgfVxuICByZXR1cm4gY2xvbmU7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VPYmplY3RQcm9wcyhvMSwgbzIpIHtcbiAgdmFyIG8gPSBjbG9uZU9iamVjdChvMSk7XG4gIGZvciAodmFyIHAgaW4gbzEpIHsgb1twXSA9IG8yLmhhc093blByb3BlcnR5KHApID8gbzJbcF0gOiBvMVtwXTsgfVxuICByZXR1cm4gbztcbn1cblxuZnVuY3Rpb24gbWVyZ2VPYmplY3RzKG8xLCBvMikge1xuICB2YXIgbyA9IGNsb25lT2JqZWN0KG8xKTtcbiAgZm9yICh2YXIgcCBpbiBvMikgeyBvW3BdID0gaXMudW5kKG8xW3BdKSA/IG8yW3BdIDogbzFbcF07IH1cbiAgcmV0dXJuIG87XG59XG5cbi8vIENvbG9yc1xuXG5mdW5jdGlvbiByZ2JUb1JnYmEocmdiVmFsdWUpIHtcbiAgdmFyIHJnYiA9IC9yZ2JcXCgoXFxkKyxcXHMqW1xcZF0rLFxccypbXFxkXSspXFwpL2cuZXhlYyhyZ2JWYWx1ZSk7XG4gIHJldHVybiByZ2IgPyAoXCJyZ2JhKFwiICsgKHJnYlsxXSkgKyBcIiwxKVwiKSA6IHJnYlZhbHVlO1xufVxuXG5mdW5jdGlvbiBoZXhUb1JnYmEoaGV4VmFsdWUpIHtcbiAgdmFyIHJneCA9IC9eIz8oW2EtZlxcZF0pKFthLWZcXGRdKShbYS1mXFxkXSkkL2k7XG4gIHZhciBoZXggPSBoZXhWYWx1ZS5yZXBsYWNlKHJneCwgZnVuY3Rpb24gKG0sIHIsIGcsIGIpIHsgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYjsgfSApO1xuICB2YXIgcmdiID0gL14jPyhbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KSQvaS5leGVjKGhleCk7XG4gIHZhciByID0gcGFyc2VJbnQocmdiWzFdLCAxNik7XG4gIHZhciBnID0gcGFyc2VJbnQocmdiWzJdLCAxNik7XG4gIHZhciBiID0gcGFyc2VJbnQocmdiWzNdLCAxNik7XG4gIHJldHVybiAoXCJyZ2JhKFwiICsgciArIFwiLFwiICsgZyArIFwiLFwiICsgYiArIFwiLDEpXCIpO1xufVxuXG5mdW5jdGlvbiBoc2xUb1JnYmEoaHNsVmFsdWUpIHtcbiAgdmFyIGhzbCA9IC9oc2xcXCgoXFxkKyksXFxzKihbXFxkLl0rKSUsXFxzKihbXFxkLl0rKSVcXCkvZy5leGVjKGhzbFZhbHVlKSB8fCAvaHNsYVxcKChcXGQrKSxcXHMqKFtcXGQuXSspJSxcXHMqKFtcXGQuXSspJSxcXHMqKFtcXGQuXSspXFwpL2cuZXhlYyhoc2xWYWx1ZSk7XG4gIHZhciBoID0gcGFyc2VJbnQoaHNsWzFdLCAxMCkgLyAzNjA7XG4gIHZhciBzID0gcGFyc2VJbnQoaHNsWzJdLCAxMCkgLyAxMDA7XG4gIHZhciBsID0gcGFyc2VJbnQoaHNsWzNdLCAxMCkgLyAxMDA7XG4gIHZhciBhID0gaHNsWzRdIHx8IDE7XG4gIGZ1bmN0aW9uIGh1ZTJyZ2IocCwgcSwgdCkge1xuICAgIGlmICh0IDwgMCkgeyB0ICs9IDE7IH1cbiAgICBpZiAodCA+IDEpIHsgdCAtPSAxOyB9XG4gICAgaWYgKHQgPCAxLzYpIHsgcmV0dXJuIHAgKyAocSAtIHApICogNiAqIHQ7IH1cbiAgICBpZiAodCA8IDEvMikgeyByZXR1cm4gcTsgfVxuICAgIGlmICh0IDwgMi8zKSB7IHJldHVybiBwICsgKHEgLSBwKSAqICgyLzMgLSB0KSAqIDY7IH1cbiAgICByZXR1cm4gcDtcbiAgfVxuICB2YXIgciwgZywgYjtcbiAgaWYgKHMgPT0gMCkge1xuICAgIHIgPSBnID0gYiA9IGw7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHEgPSBsIDwgMC41ID8gbCAqICgxICsgcykgOiBsICsgcyAtIGwgKiBzO1xuICAgIHZhciBwID0gMiAqIGwgLSBxO1xuICAgIHIgPSBodWUycmdiKHAsIHEsIGggKyAxLzMpO1xuICAgIGcgPSBodWUycmdiKHAsIHEsIGgpO1xuICAgIGIgPSBodWUycmdiKHAsIHEsIGggLSAxLzMpO1xuICB9XG4gIHJldHVybiAoXCJyZ2JhKFwiICsgKHIgKiAyNTUpICsgXCIsXCIgKyAoZyAqIDI1NSkgKyBcIixcIiArIChiICogMjU1KSArIFwiLFwiICsgYSArIFwiKVwiKTtcbn1cblxuZnVuY3Rpb24gY29sb3JUb1JnYih2YWwpIHtcbiAgaWYgKGlzLnJnYih2YWwpKSB7IHJldHVybiByZ2JUb1JnYmEodmFsKTsgfVxuICBpZiAoaXMuaGV4KHZhbCkpIHsgcmV0dXJuIGhleFRvUmdiYSh2YWwpOyB9XG4gIGlmIChpcy5oc2wodmFsKSkgeyByZXR1cm4gaHNsVG9SZ2JhKHZhbCk7IH1cbn1cblxuLy8gVW5pdHNcblxuZnVuY3Rpb24gZ2V0VW5pdCh2YWwpIHtcbiAgdmFyIHNwbGl0ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KCV8cHh8cHR8ZW18cmVtfGlufGNtfG1tfGV4fGNofHBjfHZ3fHZofHZtaW58dm1heHxkZWd8cmFkfHR1cm4pPyQvLmV4ZWModmFsKTtcbiAgaWYgKHNwbGl0KSB7IHJldHVybiBzcGxpdFsxXTsgfVxufVxuXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1Vbml0KHByb3BOYW1lKSB7XG4gIGlmIChzdHJpbmdDb250YWlucyhwcm9wTmFtZSwgJ3RyYW5zbGF0ZScpIHx8IHByb3BOYW1lID09PSAncGVyc3BlY3RpdmUnKSB7IHJldHVybiAncHgnOyB9XG4gIGlmIChzdHJpbmdDb250YWlucyhwcm9wTmFtZSwgJ3JvdGF0ZScpIHx8IHN0cmluZ0NvbnRhaW5zKHByb3BOYW1lLCAnc2tldycpKSB7IHJldHVybiAnZGVnJzsgfVxufVxuXG4vLyBWYWx1ZXNcblxuZnVuY3Rpb24gZ2V0RnVuY3Rpb25WYWx1ZSh2YWwsIGFuaW1hdGFibGUpIHtcbiAgaWYgKCFpcy5mbmModmFsKSkgeyByZXR1cm4gdmFsOyB9XG4gIHJldHVybiB2YWwoYW5pbWF0YWJsZS50YXJnZXQsIGFuaW1hdGFibGUuaWQsIGFuaW1hdGFibGUudG90YWwpO1xufVxuXG5mdW5jdGlvbiBnZXRBdHRyaWJ1dGUoZWwsIHByb3ApIHtcbiAgcmV0dXJuIGVsLmdldEF0dHJpYnV0ZShwcm9wKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFB4VG9Vbml0KGVsLCB2YWx1ZSwgdW5pdCkge1xuICB2YXIgdmFsdWVVbml0ID0gZ2V0VW5pdCh2YWx1ZSk7XG4gIGlmIChhcnJheUNvbnRhaW5zKFt1bml0LCAnZGVnJywgJ3JhZCcsICd0dXJuJ10sIHZhbHVlVW5pdCkpIHsgcmV0dXJuIHZhbHVlOyB9XG4gIHZhciBjYWNoZWQgPSBjYWNoZS5DU1NbdmFsdWUgKyB1bml0XTtcbiAgaWYgKCFpcy51bmQoY2FjaGVkKSkgeyByZXR1cm4gY2FjaGVkOyB9XG4gIHZhciBiYXNlbGluZSA9IDEwMDtcbiAgdmFyIHRlbXBFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWwudGFnTmFtZSk7XG4gIHZhciBwYXJlbnRFbCA9IChlbC5wYXJlbnROb2RlICYmIChlbC5wYXJlbnROb2RlICE9PSBkb2N1bWVudCkpID8gZWwucGFyZW50Tm9kZSA6IGRvY3VtZW50LmJvZHk7XG4gIHBhcmVudEVsLmFwcGVuZENoaWxkKHRlbXBFbCk7XG4gIHRlbXBFbC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIHRlbXBFbC5zdHlsZS53aWR0aCA9IGJhc2VsaW5lICsgdW5pdDtcbiAgdmFyIGZhY3RvciA9IGJhc2VsaW5lIC8gdGVtcEVsLm9mZnNldFdpZHRoO1xuICBwYXJlbnRFbC5yZW1vdmVDaGlsZCh0ZW1wRWwpO1xuICB2YXIgY29udmVydGVkVW5pdCA9IGZhY3RvciAqIHBhcnNlRmxvYXQodmFsdWUpO1xuICBjYWNoZS5DU1NbdmFsdWUgKyB1bml0XSA9IGNvbnZlcnRlZFVuaXQ7XG4gIHJldHVybiBjb252ZXJ0ZWRVbml0O1xufVxuXG5mdW5jdGlvbiBnZXRDU1NWYWx1ZShlbCwgcHJvcCwgdW5pdCkge1xuICBpZiAocHJvcCBpbiBlbC5zdHlsZSkge1xuICAgIHZhciB1cHBlcmNhc2VQcm9wTmFtZSA9IHByb3AucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgdmFsdWUgPSBlbC5zdHlsZVtwcm9wXSB8fCBnZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKHVwcGVyY2FzZVByb3BOYW1lKSB8fCAnMCc7XG4gICAgcmV0dXJuIHVuaXQgPyBjb252ZXJ0UHhUb1VuaXQoZWwsIHZhbHVlLCB1bml0KSA6IHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEFuaW1hdGlvblR5cGUoZWwsIHByb3ApIHtcbiAgaWYgKGlzLmRvbShlbCkgJiYgIWlzLmlucChlbCkgJiYgKCFpcy5uaWwoZ2V0QXR0cmlidXRlKGVsLCBwcm9wKSkgfHwgKGlzLnN2ZyhlbCkgJiYgZWxbcHJvcF0pKSkgeyByZXR1cm4gJ2F0dHJpYnV0ZSc7IH1cbiAgaWYgKGlzLmRvbShlbCkgJiYgYXJyYXlDb250YWlucyh2YWxpZFRyYW5zZm9ybXMsIHByb3ApKSB7IHJldHVybiAndHJhbnNmb3JtJzsgfVxuICBpZiAoaXMuZG9tKGVsKSAmJiAocHJvcCAhPT0gJ3RyYW5zZm9ybScgJiYgZ2V0Q1NTVmFsdWUoZWwsIHByb3ApKSkgeyByZXR1cm4gJ2Nzcyc7IH1cbiAgaWYgKGVsW3Byb3BdICE9IG51bGwpIHsgcmV0dXJuICdvYmplY3QnOyB9XG59XG5cbmZ1bmN0aW9uIGdldEVsZW1lbnRUcmFuc2Zvcm1zKGVsKSB7XG4gIGlmICghaXMuZG9tKGVsKSkgeyByZXR1cm47IH1cbiAgdmFyIHN0ciA9IGVsLnN0eWxlLnRyYW5zZm9ybSB8fCAnJztcbiAgdmFyIHJlZyAgPSAvKFxcdyspXFwoKFteKV0qKVxcKS9nO1xuICB2YXIgdHJhbnNmb3JtcyA9IG5ldyBNYXAoKTtcbiAgdmFyIG07IHdoaWxlIChtID0gcmVnLmV4ZWMoc3RyKSkgeyB0cmFuc2Zvcm1zLnNldChtWzFdLCBtWzJdKTsgfVxuICByZXR1cm4gdHJhbnNmb3Jtcztcbn1cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtVmFsdWUoZWwsIHByb3BOYW1lLCBhbmltYXRhYmxlLCB1bml0KSB7XG4gIHZhciBkZWZhdWx0VmFsID0gc3RyaW5nQ29udGFpbnMocHJvcE5hbWUsICdzY2FsZScpID8gMSA6IDAgKyBnZXRUcmFuc2Zvcm1Vbml0KHByb3BOYW1lKTtcbiAgdmFyIHZhbHVlID0gZ2V0RWxlbWVudFRyYW5zZm9ybXMoZWwpLmdldChwcm9wTmFtZSkgfHwgZGVmYXVsdFZhbDtcbiAgaWYgKGFuaW1hdGFibGUpIHtcbiAgICBhbmltYXRhYmxlLnRyYW5zZm9ybXMubGlzdC5zZXQocHJvcE5hbWUsIHZhbHVlKTtcbiAgICBhbmltYXRhYmxlLnRyYW5zZm9ybXNbJ2xhc3QnXSA9IHByb3BOYW1lO1xuICB9XG4gIHJldHVybiB1bml0ID8gY29udmVydFB4VG9Vbml0KGVsLCB2YWx1ZSwgdW5pdCkgOiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZ2luYWxUYXJnZXRWYWx1ZSh0YXJnZXQsIHByb3BOYW1lLCB1bml0LCBhbmltYXRhYmxlKSB7XG4gIHN3aXRjaCAoZ2V0QW5pbWF0aW9uVHlwZSh0YXJnZXQsIHByb3BOYW1lKSkge1xuICAgIGNhc2UgJ3RyYW5zZm9ybSc6IHJldHVybiBnZXRUcmFuc2Zvcm1WYWx1ZSh0YXJnZXQsIHByb3BOYW1lLCBhbmltYXRhYmxlLCB1bml0KTtcbiAgICBjYXNlICdjc3MnOiByZXR1cm4gZ2V0Q1NTVmFsdWUodGFyZ2V0LCBwcm9wTmFtZSwgdW5pdCk7XG4gICAgY2FzZSAnYXR0cmlidXRlJzogcmV0dXJuIGdldEF0dHJpYnV0ZSh0YXJnZXQsIHByb3BOYW1lKTtcbiAgICBkZWZhdWx0OiByZXR1cm4gdGFyZ2V0W3Byb3BOYW1lXSB8fCAwO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlbGF0aXZlVmFsdWUodG8sIGZyb20pIHtcbiAgdmFyIG9wZXJhdG9yID0gL14oXFwqPXxcXCs9fC09KS8uZXhlYyh0byk7XG4gIGlmICghb3BlcmF0b3IpIHsgcmV0dXJuIHRvOyB9XG4gIHZhciB1ID0gZ2V0VW5pdCh0bykgfHwgMDtcbiAgdmFyIHggPSBwYXJzZUZsb2F0KGZyb20pO1xuICB2YXIgeSA9IHBhcnNlRmxvYXQodG8ucmVwbGFjZShvcGVyYXRvclswXSwgJycpKTtcbiAgc3dpdGNoIChvcGVyYXRvclswXVswXSkge1xuICAgIGNhc2UgJysnOiByZXR1cm4geCArIHkgKyB1O1xuICAgIGNhc2UgJy0nOiByZXR1cm4geCAtIHkgKyB1O1xuICAgIGNhc2UgJyonOiByZXR1cm4geCAqIHkgKyB1O1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlVmFsdWUodmFsLCB1bml0KSB7XG4gIGlmIChpcy5jb2wodmFsKSkgeyByZXR1cm4gY29sb3JUb1JnYih2YWwpOyB9XG4gIGlmICgvXFxzL2cudGVzdCh2YWwpKSB7IHJldHVybiB2YWw7IH1cbiAgdmFyIG9yaWdpbmFsVW5pdCA9IGdldFVuaXQodmFsKTtcbiAgdmFyIHVuaXRMZXNzID0gb3JpZ2luYWxVbml0ID8gdmFsLnN1YnN0cigwLCB2YWwubGVuZ3RoIC0gb3JpZ2luYWxVbml0Lmxlbmd0aCkgOiB2YWw7XG4gIGlmICh1bml0KSB7IHJldHVybiB1bml0TGVzcyArIHVuaXQ7IH1cbiAgcmV0dXJuIHVuaXRMZXNzO1xufVxuXG4vLyBnZXRUb3RhbExlbmd0aCgpIGVxdWl2YWxlbnQgZm9yIGNpcmNsZSwgcmVjdCwgcG9seWxpbmUsIHBvbHlnb24gYW5kIGxpbmUgc2hhcGVzXG4vLyBhZGFwdGVkIGZyb20gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vU2ViTGFtYmxhLzNlMDU1MGM0OTZjMjM2NzA5NzQ0XG5cbmZ1bmN0aW9uIGdldERpc3RhbmNlKHAxLCBwMikge1xuICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHAyLnggLSBwMS54LCAyKSArIE1hdGgucG93KHAyLnkgLSBwMS55LCAyKSk7XG59XG5cbmZ1bmN0aW9uIGdldENpcmNsZUxlbmd0aChlbCkge1xuICByZXR1cm4gTWF0aC5QSSAqIDIgKiBnZXRBdHRyaWJ1dGUoZWwsICdyJyk7XG59XG5cbmZ1bmN0aW9uIGdldFJlY3RMZW5ndGgoZWwpIHtcbiAgcmV0dXJuIChnZXRBdHRyaWJ1dGUoZWwsICd3aWR0aCcpICogMikgKyAoZ2V0QXR0cmlidXRlKGVsLCAnaGVpZ2h0JykgKiAyKTtcbn1cblxuZnVuY3Rpb24gZ2V0TGluZUxlbmd0aChlbCkge1xuICByZXR1cm4gZ2V0RGlzdGFuY2UoXG4gICAge3g6IGdldEF0dHJpYnV0ZShlbCwgJ3gxJyksIHk6IGdldEF0dHJpYnV0ZShlbCwgJ3kxJyl9LCBcbiAgICB7eDogZ2V0QXR0cmlidXRlKGVsLCAneDInKSwgeTogZ2V0QXR0cmlidXRlKGVsLCAneTInKX1cbiAgKTtcbn1cblxuZnVuY3Rpb24gZ2V0UG9seWxpbmVMZW5ndGgoZWwpIHtcbiAgdmFyIHBvaW50cyA9IGVsLnBvaW50cztcbiAgdmFyIHRvdGFsTGVuZ3RoID0gMDtcbiAgdmFyIHByZXZpb3VzUG9zO1xuICBmb3IgKHZhciBpID0gMCA7IGkgPCBwb2ludHMubnVtYmVyT2ZJdGVtczsgaSsrKSB7XG4gICAgdmFyIGN1cnJlbnRQb3MgPSBwb2ludHMuZ2V0SXRlbShpKTtcbiAgICBpZiAoaSA+IDApIHsgdG90YWxMZW5ndGggKz0gZ2V0RGlzdGFuY2UocHJldmlvdXNQb3MsIGN1cnJlbnRQb3MpOyB9XG4gICAgcHJldmlvdXNQb3MgPSBjdXJyZW50UG9zO1xuICB9XG4gIHJldHVybiB0b3RhbExlbmd0aDtcbn1cblxuZnVuY3Rpb24gZ2V0UG9seWdvbkxlbmd0aChlbCkge1xuICB2YXIgcG9pbnRzID0gZWwucG9pbnRzO1xuICByZXR1cm4gZ2V0UG9seWxpbmVMZW5ndGgoZWwpICsgZ2V0RGlzdGFuY2UocG9pbnRzLmdldEl0ZW0ocG9pbnRzLm51bWJlck9mSXRlbXMgLSAxKSwgcG9pbnRzLmdldEl0ZW0oMCkpO1xufVxuXG4vLyBQYXRoIGFuaW1hdGlvblxuXG5mdW5jdGlvbiBnZXRUb3RhbExlbmd0aChlbCkge1xuICBpZiAoZWwuZ2V0VG90YWxMZW5ndGgpIHsgcmV0dXJuIGVsLmdldFRvdGFsTGVuZ3RoKCk7IH1cbiAgc3dpdGNoKGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2NpcmNsZSc6IHJldHVybiBnZXRDaXJjbGVMZW5ndGgoZWwpO1xuICAgIGNhc2UgJ3JlY3QnOiByZXR1cm4gZ2V0UmVjdExlbmd0aChlbCk7XG4gICAgY2FzZSAnbGluZSc6IHJldHVybiBnZXRMaW5lTGVuZ3RoKGVsKTtcbiAgICBjYXNlICdwb2x5bGluZSc6IHJldHVybiBnZXRQb2x5bGluZUxlbmd0aChlbCk7XG4gICAgY2FzZSAncG9seWdvbic6IHJldHVybiBnZXRQb2x5Z29uTGVuZ3RoKGVsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXREYXNob2Zmc2V0KGVsKSB7XG4gIHZhciBwYXRoTGVuZ3RoID0gZ2V0VG90YWxMZW5ndGgoZWwpO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZS1kYXNoYXJyYXknLCBwYXRoTGVuZ3RoKTtcbiAgcmV0dXJuIHBhdGhMZW5ndGg7XG59XG5cbi8vIE1vdGlvbiBwYXRoXG5cbmZ1bmN0aW9uIGdldFBhcmVudFN2Z0VsKGVsKSB7XG4gIHZhciBwYXJlbnRFbCA9IGVsLnBhcmVudE5vZGU7XG4gIHdoaWxlIChpcy5zdmcocGFyZW50RWwpKSB7XG4gICAgaWYgKCFpcy5zdmcocGFyZW50RWwucGFyZW50Tm9kZSkpIHsgYnJlYWs7IH1cbiAgICBwYXJlbnRFbCA9IHBhcmVudEVsLnBhcmVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIHBhcmVudEVsO1xufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnRTdmcocGF0aEVsLCBzdmdEYXRhKSB7XG4gIHZhciBzdmcgPSBzdmdEYXRhIHx8IHt9O1xuICB2YXIgcGFyZW50U3ZnRWwgPSBzdmcuZWwgfHwgZ2V0UGFyZW50U3ZnRWwocGF0aEVsKTtcbiAgdmFyIHJlY3QgPSBwYXJlbnRTdmdFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgdmFyIHZpZXdCb3hBdHRyID0gZ2V0QXR0cmlidXRlKHBhcmVudFN2Z0VsLCAndmlld0JveCcpO1xuICB2YXIgd2lkdGggPSByZWN0LndpZHRoO1xuICB2YXIgaGVpZ2h0ID0gcmVjdC5oZWlnaHQ7XG4gIHZhciB2aWV3Qm94ID0gc3ZnLnZpZXdCb3ggfHwgKHZpZXdCb3hBdHRyID8gdmlld0JveEF0dHIuc3BsaXQoJyAnKSA6IFswLCAwLCB3aWR0aCwgaGVpZ2h0XSk7XG4gIHJldHVybiB7XG4gICAgZWw6IHBhcmVudFN2Z0VsLFxuICAgIHZpZXdCb3g6IHZpZXdCb3gsXG4gICAgeDogdmlld0JveFswXSAvIDEsXG4gICAgeTogdmlld0JveFsxXSAvIDEsXG4gICAgdzogd2lkdGgsXG4gICAgaDogaGVpZ2h0LFxuICAgIHZXOiB2aWV3Qm94WzJdLFxuICAgIHZIOiB2aWV3Qm94WzNdXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGF0aChwYXRoLCBwZXJjZW50KSB7XG4gIHZhciBwYXRoRWwgPSBpcy5zdHIocGF0aCkgPyBzZWxlY3RTdHJpbmcocGF0aClbMF0gOiBwYXRoO1xuICB2YXIgcCA9IHBlcmNlbnQgfHwgMTAwO1xuICByZXR1cm4gZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvcGVydHk6IHByb3BlcnR5LFxuICAgICAgZWw6IHBhdGhFbCxcbiAgICAgIHN2ZzogZ2V0UGFyZW50U3ZnKHBhdGhFbCksXG4gICAgICB0b3RhbExlbmd0aDogZ2V0VG90YWxMZW5ndGgocGF0aEVsKSAqIChwIC8gMTAwKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXRoUHJvZ3Jlc3MocGF0aCwgcHJvZ3Jlc3MsIGlzUGF0aFRhcmdldEluc2lkZVNWRykge1xuICBmdW5jdGlvbiBwb2ludChvZmZzZXQpIHtcbiAgICBpZiAoIG9mZnNldCA9PT0gdm9pZCAwICkgb2Zmc2V0ID0gMDtcblxuICAgIHZhciBsID0gcHJvZ3Jlc3MgKyBvZmZzZXQgPj0gMSA/IHByb2dyZXNzICsgb2Zmc2V0IDogMDtcbiAgICByZXR1cm4gcGF0aC5lbC5nZXRQb2ludEF0TGVuZ3RoKGwpO1xuICB9XG4gIHZhciBzdmcgPSBnZXRQYXJlbnRTdmcocGF0aC5lbCwgcGF0aC5zdmcpO1xuICB2YXIgcCA9IHBvaW50KCk7XG4gIHZhciBwMCA9IHBvaW50KC0xKTtcbiAgdmFyIHAxID0gcG9pbnQoKzEpO1xuICB2YXIgc2NhbGVYID0gaXNQYXRoVGFyZ2V0SW5zaWRlU1ZHID8gMSA6IHN2Zy53IC8gc3ZnLnZXO1xuICB2YXIgc2NhbGVZID0gaXNQYXRoVGFyZ2V0SW5zaWRlU1ZHID8gMSA6IHN2Zy5oIC8gc3ZnLnZIO1xuICBzd2l0Y2ggKHBhdGgucHJvcGVydHkpIHtcbiAgICBjYXNlICd4JzogcmV0dXJuIChwLnggLSBzdmcueCkgKiBzY2FsZVg7XG4gICAgY2FzZSAneSc6IHJldHVybiAocC55IC0gc3ZnLnkpICogc2NhbGVZO1xuICAgIGNhc2UgJ2FuZ2xlJzogcmV0dXJuIE1hdGguYXRhbjIocDEueSAtIHAwLnksIHAxLnggLSBwMC54KSAqIDE4MCAvIE1hdGguUEk7XG4gIH1cbn1cblxuLy8gRGVjb21wb3NlIHZhbHVlXG5cbmZ1bmN0aW9uIGRlY29tcG9zZVZhbHVlKHZhbCwgdW5pdCkge1xuICAvLyBjb25zdCByZ3ggPSAvLT9cXGQqXFwuP1xcZCsvZzsgLy8gaGFuZGxlcyBiYXNpYyBudW1iZXJzXG4gIC8vIGNvbnN0IHJneCA9IC9bKy1dP1xcZCsoPzpcXC5cXGQrKT8oPzpbZUVdWystXT9cXGQrKT8vZzsgLy8gaGFuZGxlcyBleHBvbmVudHMgbm90YXRpb25cbiAgdmFyIHJneCA9IC9bKy1dP1xcZCpcXC4/XFxkKyg/OlxcLlxcZCspPyg/OltlRV1bKy1dP1xcZCspPy9nOyAvLyBoYW5kbGVzIGV4cG9uZW50cyBub3RhdGlvblxuICB2YXIgdmFsdWUgPSB2YWxpZGF0ZVZhbHVlKChpcy5wdGgodmFsKSA/IHZhbC50b3RhbExlbmd0aCA6IHZhbCksIHVuaXQpICsgJyc7XG4gIHJldHVybiB7XG4gICAgb3JpZ2luYWw6IHZhbHVlLFxuICAgIG51bWJlcnM6IHZhbHVlLm1hdGNoKHJneCkgPyB2YWx1ZS5tYXRjaChyZ3gpLm1hcChOdW1iZXIpIDogWzBdLFxuICAgIHN0cmluZ3M6IChpcy5zdHIodmFsKSB8fCB1bml0KSA/IHZhbHVlLnNwbGl0KHJneCkgOiBbXVxuICB9XG59XG5cbi8vIEFuaW1hdGFibGVzXG5cbmZ1bmN0aW9uIHBhcnNlVGFyZ2V0cyh0YXJnZXRzKSB7XG4gIHZhciB0YXJnZXRzQXJyYXkgPSB0YXJnZXRzID8gKGZsYXR0ZW5BcnJheShpcy5hcnIodGFyZ2V0cykgPyB0YXJnZXRzLm1hcCh0b0FycmF5KSA6IHRvQXJyYXkodGFyZ2V0cykpKSA6IFtdO1xuICByZXR1cm4gZmlsdGVyQXJyYXkodGFyZ2V0c0FycmF5LCBmdW5jdGlvbiAoaXRlbSwgcG9zLCBzZWxmKSB7IHJldHVybiBzZWxmLmluZGV4T2YoaXRlbSkgPT09IHBvczsgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEFuaW1hdGFibGVzKHRhcmdldHMpIHtcbiAgdmFyIHBhcnNlZCA9IHBhcnNlVGFyZ2V0cyh0YXJnZXRzKTtcbiAgcmV0dXJuIHBhcnNlZC5tYXAoZnVuY3Rpb24gKHQsIGkpIHtcbiAgICByZXR1cm4ge3RhcmdldDogdCwgaWQ6IGksIHRvdGFsOiBwYXJzZWQubGVuZ3RoLCB0cmFuc2Zvcm1zOiB7IGxpc3Q6IGdldEVsZW1lbnRUcmFuc2Zvcm1zKHQpIH0gfTtcbiAgfSk7XG59XG5cbi8vIFByb3BlcnRpZXNcblxuZnVuY3Rpb24gbm9ybWFsaXplUHJvcGVydHlUd2VlbnMocHJvcCwgdHdlZW5TZXR0aW5ncykge1xuICB2YXIgc2V0dGluZ3MgPSBjbG9uZU9iamVjdCh0d2VlblNldHRpbmdzKTtcbiAgLy8gT3ZlcnJpZGUgZHVyYXRpb24gaWYgZWFzaW5nIGlzIGEgc3ByaW5nXG4gIGlmICgvXnNwcmluZy8udGVzdChzZXR0aW5ncy5lYXNpbmcpKSB7IHNldHRpbmdzLmR1cmF0aW9uID0gc3ByaW5nKHNldHRpbmdzLmVhc2luZyk7IH1cbiAgaWYgKGlzLmFycihwcm9wKSkge1xuICAgIHZhciBsID0gcHJvcC5sZW5ndGg7XG4gICAgdmFyIGlzRnJvbVRvID0gKGwgPT09IDIgJiYgIWlzLm9iaihwcm9wWzBdKSk7XG4gICAgaWYgKCFpc0Zyb21Ubykge1xuICAgICAgLy8gRHVyYXRpb24gZGl2aWRlZCBieSB0aGUgbnVtYmVyIG9mIHR3ZWVuc1xuICAgICAgaWYgKCFpcy5mbmModHdlZW5TZXR0aW5ncy5kdXJhdGlvbikpIHsgc2V0dGluZ3MuZHVyYXRpb24gPSB0d2VlblNldHRpbmdzLmR1cmF0aW9uIC8gbDsgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUcmFuc2Zvcm0gW2Zyb20sIHRvXSB2YWx1ZXMgc2hvcnRoYW5kIHRvIGEgdmFsaWQgdHdlZW4gdmFsdWVcbiAgICAgIHByb3AgPSB7dmFsdWU6IHByb3B9O1xuICAgIH1cbiAgfVxuICB2YXIgcHJvcEFycmF5ID0gaXMuYXJyKHByb3ApID8gcHJvcCA6IFtwcm9wXTtcbiAgcmV0dXJuIHByb3BBcnJheS5tYXAoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICB2YXIgb2JqID0gKGlzLm9iaih2KSAmJiAhaXMucHRoKHYpKSA/IHYgOiB7dmFsdWU6IHZ9O1xuICAgIC8vIERlZmF1bHQgZGVsYXkgdmFsdWUgc2hvdWxkIG9ubHkgYmUgYXBwbGllZCB0byB0aGUgZmlyc3QgdHdlZW5cbiAgICBpZiAoaXMudW5kKG9iai5kZWxheSkpIHsgb2JqLmRlbGF5ID0gIWkgPyB0d2VlblNldHRpbmdzLmRlbGF5IDogMDsgfVxuICAgIC8vIERlZmF1bHQgZW5kRGVsYXkgdmFsdWUgc2hvdWxkIG9ubHkgYmUgYXBwbGllZCB0byB0aGUgbGFzdCB0d2VlblxuICAgIGlmIChpcy51bmQob2JqLmVuZERlbGF5KSkgeyBvYmouZW5kRGVsYXkgPSBpID09PSBwcm9wQXJyYXkubGVuZ3RoIC0gMSA/IHR3ZWVuU2V0dGluZ3MuZW5kRGVsYXkgOiAwOyB9XG4gICAgcmV0dXJuIG9iajtcbiAgfSkubWFwKGZ1bmN0aW9uIChrKSB7IHJldHVybiBtZXJnZU9iamVjdHMoaywgc2V0dGluZ3MpOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBmbGF0dGVuS2V5ZnJhbWVzKGtleWZyYW1lcykge1xuICB2YXIgcHJvcGVydHlOYW1lcyA9IGZpbHRlckFycmF5KGZsYXR0ZW5BcnJheShrZXlmcmFtZXMubWFwKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIE9iamVjdC5rZXlzKGtleSk7IH0pKSwgZnVuY3Rpb24gKHApIHsgcmV0dXJuIGlzLmtleShwKTsgfSlcbiAgLnJlZHVjZShmdW5jdGlvbiAoYSxiKSB7IGlmIChhLmluZGV4T2YoYikgPCAwKSB7IGEucHVzaChiKTsgfSByZXR1cm4gYTsgfSwgW10pO1xuICB2YXIgcHJvcGVydGllcyA9IHt9O1xuICB2YXIgbG9vcCA9IGZ1bmN0aW9uICggaSApIHtcbiAgICB2YXIgcHJvcE5hbWUgPSBwcm9wZXJ0eU5hbWVzW2ldO1xuICAgIHByb3BlcnRpZXNbcHJvcE5hbWVdID0ga2V5ZnJhbWVzLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICB2YXIgbmV3S2V5ID0ge307XG4gICAgICBmb3IgKHZhciBwIGluIGtleSkge1xuICAgICAgICBpZiAoaXMua2V5KHApKSB7XG4gICAgICAgICAgaWYgKHAgPT0gcHJvcE5hbWUpIHsgbmV3S2V5LnZhbHVlID0ga2V5W3BdOyB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3S2V5W3BdID0ga2V5W3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3S2V5O1xuICAgIH0pO1xuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcGVydHlOYW1lcy5sZW5ndGg7IGkrKykgbG9vcCggaSApO1xuICByZXR1cm4gcHJvcGVydGllcztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcGVydGllcyh0d2VlblNldHRpbmdzLCBwYXJhbXMpIHtcbiAgdmFyIHByb3BlcnRpZXMgPSBbXTtcbiAgdmFyIGtleWZyYW1lcyA9IHBhcmFtcy5rZXlmcmFtZXM7XG4gIGlmIChrZXlmcmFtZXMpIHsgcGFyYW1zID0gbWVyZ2VPYmplY3RzKGZsYXR0ZW5LZXlmcmFtZXMoa2V5ZnJhbWVzKSwgcGFyYW1zKTsgfVxuICBmb3IgKHZhciBwIGluIHBhcmFtcykge1xuICAgIGlmIChpcy5rZXkocCkpIHtcbiAgICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IHAsXG4gICAgICAgIHR3ZWVuczogbm9ybWFsaXplUHJvcGVydHlUd2VlbnMocGFyYW1zW3BdLCB0d2VlblNldHRpbmdzKVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wZXJ0aWVzO1xufVxuXG4vLyBUd2VlbnNcblxuZnVuY3Rpb24gbm9ybWFsaXplVHdlZW5WYWx1ZXModHdlZW4sIGFuaW1hdGFibGUpIHtcbiAgdmFyIHQgPSB7fTtcbiAgZm9yICh2YXIgcCBpbiB0d2Vlbikge1xuICAgIHZhciB2YWx1ZSA9IGdldEZ1bmN0aW9uVmFsdWUodHdlZW5bcF0sIGFuaW1hdGFibGUpO1xuICAgIGlmIChpcy5hcnIodmFsdWUpKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gZ2V0RnVuY3Rpb25WYWx1ZSh2LCBhbmltYXRhYmxlKTsgfSk7XG4gICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAxKSB7IHZhbHVlID0gdmFsdWVbMF07IH1cbiAgICB9XG4gICAgdFtwXSA9IHZhbHVlO1xuICB9XG4gIHQuZHVyYXRpb24gPSBwYXJzZUZsb2F0KHQuZHVyYXRpb24pO1xuICB0LmRlbGF5ID0gcGFyc2VGbG9hdCh0LmRlbGF5KTtcbiAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVR3ZWVucyhwcm9wLCBhbmltYXRhYmxlKSB7XG4gIHZhciBwcmV2aW91c1R3ZWVuO1xuICByZXR1cm4gcHJvcC50d2VlbnMubWFwKGZ1bmN0aW9uICh0KSB7XG4gICAgdmFyIHR3ZWVuID0gbm9ybWFsaXplVHdlZW5WYWx1ZXModCwgYW5pbWF0YWJsZSk7XG4gICAgdmFyIHR3ZWVuVmFsdWUgPSB0d2Vlbi52YWx1ZTtcbiAgICB2YXIgdG8gPSBpcy5hcnIodHdlZW5WYWx1ZSkgPyB0d2VlblZhbHVlWzFdIDogdHdlZW5WYWx1ZTtcbiAgICB2YXIgdG9Vbml0ID0gZ2V0VW5pdCh0byk7XG4gICAgdmFyIG9yaWdpbmFsVmFsdWUgPSBnZXRPcmlnaW5hbFRhcmdldFZhbHVlKGFuaW1hdGFibGUudGFyZ2V0LCBwcm9wLm5hbWUsIHRvVW5pdCwgYW5pbWF0YWJsZSk7XG4gICAgdmFyIHByZXZpb3VzVmFsdWUgPSBwcmV2aW91c1R3ZWVuID8gcHJldmlvdXNUd2Vlbi50by5vcmlnaW5hbCA6IG9yaWdpbmFsVmFsdWU7XG4gICAgdmFyIGZyb20gPSBpcy5hcnIodHdlZW5WYWx1ZSkgPyB0d2VlblZhbHVlWzBdIDogcHJldmlvdXNWYWx1ZTtcbiAgICB2YXIgZnJvbVVuaXQgPSBnZXRVbml0KGZyb20pIHx8IGdldFVuaXQob3JpZ2luYWxWYWx1ZSk7XG4gICAgdmFyIHVuaXQgPSB0b1VuaXQgfHwgZnJvbVVuaXQ7XG4gICAgaWYgKGlzLnVuZCh0bykpIHsgdG8gPSBwcmV2aW91c1ZhbHVlOyB9XG4gICAgdHdlZW4uZnJvbSA9IGRlY29tcG9zZVZhbHVlKGZyb20sIHVuaXQpO1xuICAgIHR3ZWVuLnRvID0gZGVjb21wb3NlVmFsdWUoZ2V0UmVsYXRpdmVWYWx1ZSh0bywgZnJvbSksIHVuaXQpO1xuICAgIHR3ZWVuLnN0YXJ0ID0gcHJldmlvdXNUd2VlbiA/IHByZXZpb3VzVHdlZW4uZW5kIDogMDtcbiAgICB0d2Vlbi5lbmQgPSB0d2Vlbi5zdGFydCArIHR3ZWVuLmRlbGF5ICsgdHdlZW4uZHVyYXRpb24gKyB0d2Vlbi5lbmREZWxheTtcbiAgICB0d2Vlbi5lYXNpbmcgPSBwYXJzZUVhc2luZ3ModHdlZW4uZWFzaW5nLCB0d2Vlbi5kdXJhdGlvbik7XG4gICAgdHdlZW4uaXNQYXRoID0gaXMucHRoKHR3ZWVuVmFsdWUpO1xuICAgIHR3ZWVuLmlzUGF0aFRhcmdldEluc2lkZVNWRyA9IHR3ZWVuLmlzUGF0aCAmJiBpcy5zdmcoYW5pbWF0YWJsZS50YXJnZXQpO1xuICAgIHR3ZWVuLmlzQ29sb3IgPSBpcy5jb2wodHdlZW4uZnJvbS5vcmlnaW5hbCk7XG4gICAgaWYgKHR3ZWVuLmlzQ29sb3IpIHsgdHdlZW4ucm91bmQgPSAxOyB9XG4gICAgcHJldmlvdXNUd2VlbiA9IHR3ZWVuO1xuICAgIHJldHVybiB0d2VlbjtcbiAgfSk7XG59XG5cbi8vIFR3ZWVuIHByb2dyZXNzXG5cbnZhciBzZXRQcm9ncmVzc1ZhbHVlID0ge1xuICBjc3M6IGZ1bmN0aW9uICh0LCBwLCB2KSB7IHJldHVybiB0LnN0eWxlW3BdID0gdjsgfSxcbiAgYXR0cmlidXRlOiBmdW5jdGlvbiAodCwgcCwgdikgeyByZXR1cm4gdC5zZXRBdHRyaWJ1dGUocCwgdik7IH0sXG4gIG9iamVjdDogZnVuY3Rpb24gKHQsIHAsIHYpIHsgcmV0dXJuIHRbcF0gPSB2OyB9LFxuICB0cmFuc2Zvcm06IGZ1bmN0aW9uICh0LCBwLCB2LCB0cmFuc2Zvcm1zLCBtYW51YWwpIHtcbiAgICB0cmFuc2Zvcm1zLmxpc3Quc2V0KHAsIHYpO1xuICAgIGlmIChwID09PSB0cmFuc2Zvcm1zLmxhc3QgfHwgbWFudWFsKSB7XG4gICAgICB2YXIgc3RyID0gJyc7XG4gICAgICB0cmFuc2Zvcm1zLmxpc3QuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIHByb3ApIHsgc3RyICs9IHByb3AgKyBcIihcIiArIHZhbHVlICsgXCIpIFwiOyB9KTtcbiAgICAgIHQuc3R5bGUudHJhbnNmb3JtID0gc3RyO1xuICAgIH1cbiAgfVxufTtcblxuLy8gU2V0IFZhbHVlIGhlbHBlclxuXG5mdW5jdGlvbiBzZXRUYXJnZXRzVmFsdWUodGFyZ2V0cywgcHJvcGVydGllcykge1xuICB2YXIgYW5pbWF0YWJsZXMgPSBnZXRBbmltYXRhYmxlcyh0YXJnZXRzKTtcbiAgYW5pbWF0YWJsZXMuZm9yRWFjaChmdW5jdGlvbiAoYW5pbWF0YWJsZSkge1xuICAgIGZvciAodmFyIHByb3BlcnR5IGluIHByb3BlcnRpZXMpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGdldEZ1bmN0aW9uVmFsdWUocHJvcGVydGllc1twcm9wZXJ0eV0sIGFuaW1hdGFibGUpO1xuICAgICAgdmFyIHRhcmdldCA9IGFuaW1hdGFibGUudGFyZ2V0O1xuICAgICAgdmFyIHZhbHVlVW5pdCA9IGdldFVuaXQodmFsdWUpO1xuICAgICAgdmFyIG9yaWdpbmFsVmFsdWUgPSBnZXRPcmlnaW5hbFRhcmdldFZhbHVlKHRhcmdldCwgcHJvcGVydHksIHZhbHVlVW5pdCwgYW5pbWF0YWJsZSk7XG4gICAgICB2YXIgdW5pdCA9IHZhbHVlVW5pdCB8fCBnZXRVbml0KG9yaWdpbmFsVmFsdWUpO1xuICAgICAgdmFyIHRvID0gZ2V0UmVsYXRpdmVWYWx1ZSh2YWxpZGF0ZVZhbHVlKHZhbHVlLCB1bml0KSwgb3JpZ2luYWxWYWx1ZSk7XG4gICAgICB2YXIgYW5pbVR5cGUgPSBnZXRBbmltYXRpb25UeXBlKHRhcmdldCwgcHJvcGVydHkpO1xuICAgICAgc2V0UHJvZ3Jlc3NWYWx1ZVthbmltVHlwZV0odGFyZ2V0LCBwcm9wZXJ0eSwgdG8sIGFuaW1hdGFibGUudHJhbnNmb3JtcywgdHJ1ZSk7XG4gICAgfVxuICB9KTtcbn1cblxuLy8gQW5pbWF0aW9uc1xuXG5mdW5jdGlvbiBjcmVhdGVBbmltYXRpb24oYW5pbWF0YWJsZSwgcHJvcCkge1xuICB2YXIgYW5pbVR5cGUgPSBnZXRBbmltYXRpb25UeXBlKGFuaW1hdGFibGUudGFyZ2V0LCBwcm9wLm5hbWUpO1xuICBpZiAoYW5pbVR5cGUpIHtcbiAgICB2YXIgdHdlZW5zID0gbm9ybWFsaXplVHdlZW5zKHByb3AsIGFuaW1hdGFibGUpO1xuICAgIHZhciBsYXN0VHdlZW4gPSB0d2VlbnNbdHdlZW5zLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBhbmltVHlwZSxcbiAgICAgIHByb3BlcnR5OiBwcm9wLm5hbWUsXG4gICAgICBhbmltYXRhYmxlOiBhbmltYXRhYmxlLFxuICAgICAgdHdlZW5zOiB0d2VlbnMsXG4gICAgICBkdXJhdGlvbjogbGFzdFR3ZWVuLmVuZCxcbiAgICAgIGRlbGF5OiB0d2VlbnNbMF0uZGVsYXksXG4gICAgICBlbmREZWxheTogbGFzdFR3ZWVuLmVuZERlbGF5XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEFuaW1hdGlvbnMoYW5pbWF0YWJsZXMsIHByb3BlcnRpZXMpIHtcbiAgcmV0dXJuIGZpbHRlckFycmF5KGZsYXR0ZW5BcnJheShhbmltYXRhYmxlcy5tYXAoZnVuY3Rpb24gKGFuaW1hdGFibGUpIHtcbiAgICByZXR1cm4gcHJvcGVydGllcy5tYXAoZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHJldHVybiBjcmVhdGVBbmltYXRpb24oYW5pbWF0YWJsZSwgcHJvcCk7XG4gICAgfSk7XG4gIH0pKSwgZnVuY3Rpb24gKGEpIHsgcmV0dXJuICFpcy51bmQoYSk7IH0pO1xufVxuXG4vLyBDcmVhdGUgSW5zdGFuY2VcblxuZnVuY3Rpb24gZ2V0SW5zdGFuY2VUaW1pbmdzKGFuaW1hdGlvbnMsIHR3ZWVuU2V0dGluZ3MpIHtcbiAgdmFyIGFuaW1MZW5ndGggPSBhbmltYXRpb25zLmxlbmd0aDtcbiAgdmFyIGdldFRsT2Zmc2V0ID0gZnVuY3Rpb24gKGFuaW0pIHsgcmV0dXJuIGFuaW0udGltZWxpbmVPZmZzZXQgPyBhbmltLnRpbWVsaW5lT2Zmc2V0IDogMDsgfTtcbiAgdmFyIHRpbWluZ3MgPSB7fTtcbiAgdGltaW5ncy5kdXJhdGlvbiA9IGFuaW1MZW5ndGggPyBNYXRoLm1heC5hcHBseShNYXRoLCBhbmltYXRpb25zLm1hcChmdW5jdGlvbiAoYW5pbSkgeyByZXR1cm4gZ2V0VGxPZmZzZXQoYW5pbSkgKyBhbmltLmR1cmF0aW9uOyB9KSkgOiB0d2VlblNldHRpbmdzLmR1cmF0aW9uO1xuICB0aW1pbmdzLmRlbGF5ID0gYW5pbUxlbmd0aCA/IE1hdGgubWluLmFwcGx5KE1hdGgsIGFuaW1hdGlvbnMubWFwKGZ1bmN0aW9uIChhbmltKSB7IHJldHVybiBnZXRUbE9mZnNldChhbmltKSArIGFuaW0uZGVsYXk7IH0pKSA6IHR3ZWVuU2V0dGluZ3MuZGVsYXk7XG4gIHRpbWluZ3MuZW5kRGVsYXkgPSBhbmltTGVuZ3RoID8gdGltaW5ncy5kdXJhdGlvbiAtIE1hdGgubWF4LmFwcGx5KE1hdGgsIGFuaW1hdGlvbnMubWFwKGZ1bmN0aW9uIChhbmltKSB7IHJldHVybiBnZXRUbE9mZnNldChhbmltKSArIGFuaW0uZHVyYXRpb24gLSBhbmltLmVuZERlbGF5OyB9KSkgOiB0d2VlblNldHRpbmdzLmVuZERlbGF5O1xuICByZXR1cm4gdGltaW5ncztcbn1cblxudmFyIGluc3RhbmNlSUQgPSAwO1xuXG5mdW5jdGlvbiBjcmVhdGVOZXdJbnN0YW5jZShwYXJhbXMpIHtcbiAgdmFyIGluc3RhbmNlU2V0dGluZ3MgPSByZXBsYWNlT2JqZWN0UHJvcHMoZGVmYXVsdEluc3RhbmNlU2V0dGluZ3MsIHBhcmFtcyk7XG4gIHZhciB0d2VlblNldHRpbmdzID0gcmVwbGFjZU9iamVjdFByb3BzKGRlZmF1bHRUd2VlblNldHRpbmdzLCBwYXJhbXMpO1xuICB2YXIgcHJvcGVydGllcyA9IGdldFByb3BlcnRpZXModHdlZW5TZXR0aW5ncywgcGFyYW1zKTtcbiAgdmFyIGFuaW1hdGFibGVzID0gZ2V0QW5pbWF0YWJsZXMocGFyYW1zLnRhcmdldHMpO1xuICB2YXIgYW5pbWF0aW9ucyA9IGdldEFuaW1hdGlvbnMoYW5pbWF0YWJsZXMsIHByb3BlcnRpZXMpO1xuICB2YXIgdGltaW5ncyA9IGdldEluc3RhbmNlVGltaW5ncyhhbmltYXRpb25zLCB0d2VlblNldHRpbmdzKTtcbiAgdmFyIGlkID0gaW5zdGFuY2VJRDtcbiAgaW5zdGFuY2VJRCsrO1xuICByZXR1cm4gbWVyZ2VPYmplY3RzKGluc3RhbmNlU2V0dGluZ3MsIHtcbiAgICBpZDogaWQsXG4gICAgY2hpbGRyZW46IFtdLFxuICAgIGFuaW1hdGFibGVzOiBhbmltYXRhYmxlcyxcbiAgICBhbmltYXRpb25zOiBhbmltYXRpb25zLFxuICAgIGR1cmF0aW9uOiB0aW1pbmdzLmR1cmF0aW9uLFxuICAgIGRlbGF5OiB0aW1pbmdzLmRlbGF5LFxuICAgIGVuZERlbGF5OiB0aW1pbmdzLmVuZERlbGF5XG4gIH0pO1xufVxuXG4vLyBDb3JlXG5cbnZhciBhY3RpdmVJbnN0YW5jZXMgPSBbXTtcblxudmFyIGVuZ2luZSA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciByYWY7XG5cbiAgZnVuY3Rpb24gcGxheSgpIHtcbiAgICBpZiAoIXJhZiAmJiAoIWlzRG9jdW1lbnRIaWRkZW4oKSB8fCAhYW5pbWUuc3VzcGVuZFdoZW5Eb2N1bWVudEhpZGRlbikgJiYgYWN0aXZlSW5zdGFuY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJhZiA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShzdGVwKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gc3RlcCh0KSB7XG4gICAgLy8gbWVtbyBvbiBhbGdvcml0aG0gaXNzdWU6XG4gICAgLy8gZGFuZ2Vyb3VzIGl0ZXJhdGlvbiBvdmVyIG11dGFibGUgYGFjdGl2ZUluc3RhbmNlc2BcbiAgICAvLyAodGhhdCBjb2xsZWN0aW9uIG1heSBiZSB1cGRhdGVkIGZyb20gd2l0aGluIGNhbGxiYWNrcyBvZiBgdGlja2AtZWQgYW5pbWF0aW9uIGluc3RhbmNlcylcbiAgICB2YXIgYWN0aXZlSW5zdGFuY2VzTGVuZ3RoID0gYWN0aXZlSW5zdGFuY2VzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBhY3RpdmVJbnN0YW5jZXNMZW5ndGgpIHtcbiAgICAgIHZhciBhY3RpdmVJbnN0YW5jZSA9IGFjdGl2ZUluc3RhbmNlc1tpXTtcbiAgICAgIGlmICghYWN0aXZlSW5zdGFuY2UucGF1c2VkKSB7XG4gICAgICAgIGFjdGl2ZUluc3RhbmNlLnRpY2sodCk7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGl2ZUluc3RhbmNlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGFjdGl2ZUluc3RhbmNlc0xlbmd0aC0tO1xuICAgICAgfVxuICAgIH1cbiAgICByYWYgPSBpID4gMCA/IHJlcXVlc3RBbmltYXRpb25GcmFtZShzdGVwKSA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UoKSB7XG4gICAgaWYgKCFhbmltZS5zdXNwZW5kV2hlbkRvY3VtZW50SGlkZGVuKSB7IHJldHVybjsgfVxuXG4gICAgaWYgKGlzRG9jdW1lbnRIaWRkZW4oKSkge1xuICAgICAgLy8gc3VzcGVuZCB0aWNrc1xuICAgICAgcmFmID0gY2FuY2VsQW5pbWF0aW9uRnJhbWUocmFmKTtcbiAgICB9IGVsc2UgeyAvLyBpcyBiYWNrIHRvIGFjdGl2ZSB0YWJcbiAgICAgIC8vIGZpcnN0IGFkanVzdCBhbmltYXRpb25zIHRvIGNvbnNpZGVyIHRoZSB0aW1lIHRoYXQgdGlja3Mgd2VyZSBzdXNwZW5kZWRcbiAgICAgIGFjdGl2ZUluc3RhbmNlcy5mb3JFYWNoKFxuICAgICAgICBmdW5jdGlvbiAoaW5zdGFuY2UpIHsgcmV0dXJuIGluc3RhbmNlIC5fb25Eb2N1bWVudFZpc2liaWxpdHkoKTsgfVxuICAgICAgKTtcbiAgICAgIGVuZ2luZSgpO1xuICAgIH1cbiAgfVxuICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBoYW5kbGVWaXNpYmlsaXR5Q2hhbmdlKTtcbiAgfVxuXG4gIHJldHVybiBwbGF5O1xufSkoKTtcblxuZnVuY3Rpb24gaXNEb2N1bWVudEhpZGRlbigpIHtcbiAgcmV0dXJuICEhZG9jdW1lbnQgJiYgZG9jdW1lbnQuaGlkZGVuO1xufVxuXG4vLyBQdWJsaWMgSW5zdGFuY2VcblxuZnVuY3Rpb24gYW5pbWUocGFyYW1zKSB7XG4gIGlmICggcGFyYW1zID09PSB2b2lkIDAgKSBwYXJhbXMgPSB7fTtcblxuXG4gIHZhciBzdGFydFRpbWUgPSAwLCBsYXN0VGltZSA9IDAsIG5vdyA9IDA7XG4gIHZhciBjaGlsZHJlbiwgY2hpbGRyZW5MZW5ndGggPSAwO1xuICB2YXIgcmVzb2x2ZSA9IG51bGw7XG5cbiAgZnVuY3Rpb24gbWFrZVByb21pc2UoaW5zdGFuY2UpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHdpbmRvdy5Qcm9taXNlICYmIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChfcmVzb2x2ZSkgeyByZXR1cm4gcmVzb2x2ZSA9IF9yZXNvbHZlOyB9KTtcbiAgICBpbnN0YW5jZS5maW5pc2hlZCA9IHByb21pc2U7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICB2YXIgaW5zdGFuY2UgPSBjcmVhdGVOZXdJbnN0YW5jZShwYXJhbXMpO1xuICB2YXIgcHJvbWlzZSA9IG1ha2VQcm9taXNlKGluc3RhbmNlKTtcblxuICBmdW5jdGlvbiB0b2dnbGVJbnN0YW5jZURpcmVjdGlvbigpIHtcbiAgICB2YXIgZGlyZWN0aW9uID0gaW5zdGFuY2UuZGlyZWN0aW9uO1xuICAgIGlmIChkaXJlY3Rpb24gIT09ICdhbHRlcm5hdGUnKSB7XG4gICAgICBpbnN0YW5jZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb24gIT09ICdub3JtYWwnID8gJ25vcm1hbCcgOiAncmV2ZXJzZSc7XG4gICAgfVxuICAgIGluc3RhbmNlLnJldmVyc2VkID0gIWluc3RhbmNlLnJldmVyc2VkO1xuICAgIGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7IHJldHVybiBjaGlsZC5yZXZlcnNlZCA9IGluc3RhbmNlLnJldmVyc2VkOyB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkanVzdFRpbWUodGltZSkge1xuICAgIHJldHVybiBpbnN0YW5jZS5yZXZlcnNlZCA/IGluc3RhbmNlLmR1cmF0aW9uIC0gdGltZSA6IHRpbWU7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldFRpbWUoKSB7XG4gICAgc3RhcnRUaW1lID0gMDtcbiAgICBsYXN0VGltZSA9IGFkanVzdFRpbWUoaW5zdGFuY2UuY3VycmVudFRpbWUpICogKDEgLyBhbmltZS5zcGVlZCk7XG4gIH1cblxuICBmdW5jdGlvbiBzZWVrQ2hpbGQodGltZSwgY2hpbGQpIHtcbiAgICBpZiAoY2hpbGQpIHsgY2hpbGQuc2Vlayh0aW1lIC0gY2hpbGQudGltZWxpbmVPZmZzZXQpOyB9XG4gIH1cblxuICBmdW5jdGlvbiBzeW5jSW5zdGFuY2VDaGlsZHJlbih0aW1lKSB7XG4gICAgaWYgKCFpbnN0YW5jZS5yZXZlcnNlUGxheWJhY2spIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW5MZW5ndGg7IGkrKykgeyBzZWVrQ2hpbGQodGltZSwgY2hpbGRyZW5baV0pOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkkMSA9IGNoaWxkcmVuTGVuZ3RoOyBpJDEtLTspIHsgc2Vla0NoaWxkKHRpbWUsIGNoaWxkcmVuW2kkMV0pOyB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0QW5pbWF0aW9uc1Byb2dyZXNzKGluc1RpbWUpIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGFuaW1hdGlvbnMgPSBpbnN0YW5jZS5hbmltYXRpb25zO1xuICAgIHZhciBhbmltYXRpb25zTGVuZ3RoID0gYW5pbWF0aW9ucy5sZW5ndGg7XG4gICAgd2hpbGUgKGkgPCBhbmltYXRpb25zTGVuZ3RoKSB7XG4gICAgICB2YXIgYW5pbSA9IGFuaW1hdGlvbnNbaV07XG4gICAgICB2YXIgYW5pbWF0YWJsZSA9IGFuaW0uYW5pbWF0YWJsZTtcbiAgICAgIHZhciB0d2VlbnMgPSBhbmltLnR3ZWVucztcbiAgICAgIHZhciB0d2Vlbkxlbmd0aCA9IHR3ZWVucy5sZW5ndGggLSAxO1xuICAgICAgdmFyIHR3ZWVuID0gdHdlZW5zW3R3ZWVuTGVuZ3RoXTtcbiAgICAgIC8vIE9ubHkgY2hlY2sgZm9yIGtleWZyYW1lcyBpZiB0aGVyZSBpcyBtb3JlIHRoYW4gb25lIHR3ZWVuXG4gICAgICBpZiAodHdlZW5MZW5ndGgpIHsgdHdlZW4gPSBmaWx0ZXJBcnJheSh0d2VlbnMsIGZ1bmN0aW9uICh0KSB7IHJldHVybiAoaW5zVGltZSA8IHQuZW5kKTsgfSlbMF0gfHwgdHdlZW47IH1cbiAgICAgIHZhciBlbGFwc2VkID0gbWluTWF4KGluc1RpbWUgLSB0d2Vlbi5zdGFydCAtIHR3ZWVuLmRlbGF5LCAwLCB0d2Vlbi5kdXJhdGlvbikgLyB0d2Vlbi5kdXJhdGlvbjtcbiAgICAgIHZhciBlYXNlZCA9IGlzTmFOKGVsYXBzZWQpID8gMSA6IHR3ZWVuLmVhc2luZyhlbGFwc2VkKTtcbiAgICAgIHZhciBzdHJpbmdzID0gdHdlZW4udG8uc3RyaW5ncztcbiAgICAgIHZhciByb3VuZCA9IHR3ZWVuLnJvdW5kO1xuICAgICAgdmFyIG51bWJlcnMgPSBbXTtcbiAgICAgIHZhciB0b051bWJlcnNMZW5ndGggPSB0d2Vlbi50by5udW1iZXJzLmxlbmd0aDtcbiAgICAgIHZhciBwcm9ncmVzcyA9ICh2b2lkIDApO1xuICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCB0b051bWJlcnNMZW5ndGg7IG4rKykge1xuICAgICAgICB2YXIgdmFsdWUgPSAodm9pZCAwKTtcbiAgICAgICAgdmFyIHRvTnVtYmVyID0gdHdlZW4udG8ubnVtYmVyc1tuXTtcbiAgICAgICAgdmFyIGZyb21OdW1iZXIgPSB0d2Vlbi5mcm9tLm51bWJlcnNbbl0gfHwgMDtcbiAgICAgICAgaWYgKCF0d2Vlbi5pc1BhdGgpIHtcbiAgICAgICAgICB2YWx1ZSA9IGZyb21OdW1iZXIgKyAoZWFzZWQgKiAodG9OdW1iZXIgLSBmcm9tTnVtYmVyKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSBnZXRQYXRoUHJvZ3Jlc3ModHdlZW4udmFsdWUsIGVhc2VkICogdG9OdW1iZXIsIHR3ZWVuLmlzUGF0aFRhcmdldEluc2lkZVNWRyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJvdW5kKSB7XG4gICAgICAgICAgaWYgKCEodHdlZW4uaXNDb2xvciAmJiBuID4gMikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAqIHJvdW5kKSAvIHJvdW5kO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBudW1iZXJzLnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgICAgLy8gTWFudWFsIEFycmF5LnJlZHVjZSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlc1xuICAgICAgdmFyIHN0cmluZ3NMZW5ndGggPSBzdHJpbmdzLmxlbmd0aDtcbiAgICAgIGlmICghc3RyaW5nc0xlbmd0aCkge1xuICAgICAgICBwcm9ncmVzcyA9IG51bWJlcnNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9ncmVzcyA9IHN0cmluZ3NbMF07XG4gICAgICAgIGZvciAodmFyIHMgPSAwOyBzIDwgc3RyaW5nc0xlbmd0aDsgcysrKSB7XG4gICAgICAgICAgdmFyIGEgPSBzdHJpbmdzW3NdO1xuICAgICAgICAgIHZhciBiID0gc3RyaW5nc1tzICsgMV07XG4gICAgICAgICAgdmFyIG4kMSA9IG51bWJlcnNbc107XG4gICAgICAgICAgaWYgKCFpc05hTihuJDEpKSB7XG4gICAgICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICAgICAgcHJvZ3Jlc3MgKz0gbiQxICsgJyAnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcHJvZ3Jlc3MgKz0gbiQxICsgYjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNldFByb2dyZXNzVmFsdWVbYW5pbS50eXBlXShhbmltYXRhYmxlLnRhcmdldCwgYW5pbS5wcm9wZXJ0eSwgcHJvZ3Jlc3MsIGFuaW1hdGFibGUudHJhbnNmb3Jtcyk7XG4gICAgICBhbmltLmN1cnJlbnRWYWx1ZSA9IHByb2dyZXNzO1xuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldENhbGxiYWNrKGNiKSB7XG4gICAgaWYgKGluc3RhbmNlW2NiXSAmJiAhaW5zdGFuY2UucGFzc1Rocm91Z2gpIHsgaW5zdGFuY2VbY2JdKGluc3RhbmNlKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gY291bnRJdGVyYXRpb24oKSB7XG4gICAgaWYgKGluc3RhbmNlLnJlbWFpbmluZyAmJiBpbnN0YW5jZS5yZW1haW5pbmcgIT09IHRydWUpIHtcbiAgICAgIGluc3RhbmNlLnJlbWFpbmluZy0tO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEluc3RhbmNlUHJvZ3Jlc3MoZW5naW5lVGltZSkge1xuICAgIHZhciBpbnNEdXJhdGlvbiA9IGluc3RhbmNlLmR1cmF0aW9uO1xuICAgIHZhciBpbnNEZWxheSA9IGluc3RhbmNlLmRlbGF5O1xuICAgIHZhciBpbnNFbmREZWxheSA9IGluc0R1cmF0aW9uIC0gaW5zdGFuY2UuZW5kRGVsYXk7XG4gICAgdmFyIGluc1RpbWUgPSBhZGp1c3RUaW1lKGVuZ2luZVRpbWUpO1xuICAgIGluc3RhbmNlLnByb2dyZXNzID0gbWluTWF4KChpbnNUaW1lIC8gaW5zRHVyYXRpb24pICogMTAwLCAwLCAxMDApO1xuICAgIGluc3RhbmNlLnJldmVyc2VQbGF5YmFjayA9IGluc1RpbWUgPCBpbnN0YW5jZS5jdXJyZW50VGltZTtcbiAgICBpZiAoY2hpbGRyZW4pIHsgc3luY0luc3RhbmNlQ2hpbGRyZW4oaW5zVGltZSk7IH1cbiAgICBpZiAoIWluc3RhbmNlLmJlZ2FuICYmIGluc3RhbmNlLmN1cnJlbnRUaW1lID4gMCkge1xuICAgICAgaW5zdGFuY2UuYmVnYW4gPSB0cnVlO1xuICAgICAgc2V0Q2FsbGJhY2soJ2JlZ2luJyk7XG4gICAgfVxuICAgIGlmICghaW5zdGFuY2UubG9vcEJlZ2FuICYmIGluc3RhbmNlLmN1cnJlbnRUaW1lID4gMCkge1xuICAgICAgaW5zdGFuY2UubG9vcEJlZ2FuID0gdHJ1ZTtcbiAgICAgIHNldENhbGxiYWNrKCdsb29wQmVnaW4nKTtcbiAgICB9XG4gICAgaWYgKGluc1RpbWUgPD0gaW5zRGVsYXkgJiYgaW5zdGFuY2UuY3VycmVudFRpbWUgIT09IDApIHtcbiAgICAgIHNldEFuaW1hdGlvbnNQcm9ncmVzcygwKTtcbiAgICB9XG4gICAgaWYgKChpbnNUaW1lID49IGluc0VuZERlbGF5ICYmIGluc3RhbmNlLmN1cnJlbnRUaW1lICE9PSBpbnNEdXJhdGlvbikgfHwgIWluc0R1cmF0aW9uKSB7XG4gICAgICBzZXRBbmltYXRpb25zUHJvZ3Jlc3MoaW5zRHVyYXRpb24pO1xuICAgIH1cbiAgICBpZiAoaW5zVGltZSA+IGluc0RlbGF5ICYmIGluc1RpbWUgPCBpbnNFbmREZWxheSkge1xuICAgICAgaWYgKCFpbnN0YW5jZS5jaGFuZ2VCZWdhbikge1xuICAgICAgICBpbnN0YW5jZS5jaGFuZ2VCZWdhbiA9IHRydWU7XG4gICAgICAgIGluc3RhbmNlLmNoYW5nZUNvbXBsZXRlZCA9IGZhbHNlO1xuICAgICAgICBzZXRDYWxsYmFjaygnY2hhbmdlQmVnaW4nKTtcbiAgICAgIH1cbiAgICAgIHNldENhbGxiYWNrKCdjaGFuZ2UnKTtcbiAgICAgIHNldEFuaW1hdGlvbnNQcm9ncmVzcyhpbnNUaW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGluc3RhbmNlLmNoYW5nZUJlZ2FuKSB7XG4gICAgICAgIGluc3RhbmNlLmNoYW5nZUNvbXBsZXRlZCA9IHRydWU7XG4gICAgICAgIGluc3RhbmNlLmNoYW5nZUJlZ2FuID0gZmFsc2U7XG4gICAgICAgIHNldENhbGxiYWNrKCdjaGFuZ2VDb21wbGV0ZScpO1xuICAgICAgfVxuICAgIH1cbiAgICBpbnN0YW5jZS5jdXJyZW50VGltZSA9IG1pbk1heChpbnNUaW1lLCAwLCBpbnNEdXJhdGlvbik7XG4gICAgaWYgKGluc3RhbmNlLmJlZ2FuKSB7IHNldENhbGxiYWNrKCd1cGRhdGUnKTsgfVxuICAgIGlmIChlbmdpbmVUaW1lID49IGluc0R1cmF0aW9uKSB7XG4gICAgICBsYXN0VGltZSA9IDA7XG4gICAgICBjb3VudEl0ZXJhdGlvbigpO1xuICAgICAgaWYgKCFpbnN0YW5jZS5yZW1haW5pbmcpIHtcbiAgICAgICAgaW5zdGFuY2UucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgaWYgKCFpbnN0YW5jZS5jb21wbGV0ZWQpIHtcbiAgICAgICAgICBpbnN0YW5jZS5jb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgIHNldENhbGxiYWNrKCdsb29wQ29tcGxldGUnKTtcbiAgICAgICAgICBzZXRDYWxsYmFjaygnY29tcGxldGUnKTtcbiAgICAgICAgICBpZiAoIWluc3RhbmNlLnBhc3NUaHJvdWdoICYmICdQcm9taXNlJyBpbiB3aW5kb3cpIHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIHByb21pc2UgPSBtYWtlUHJvbWlzZShpbnN0YW5jZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydFRpbWUgPSBub3c7XG4gICAgICAgIHNldENhbGxiYWNrKCdsb29wQ29tcGxldGUnKTtcbiAgICAgICAgaW5zdGFuY2UubG9vcEJlZ2FuID0gZmFsc2U7XG4gICAgICAgIGlmIChpbnN0YW5jZS5kaXJlY3Rpb24gPT09ICdhbHRlcm5hdGUnKSB7XG4gICAgICAgICAgdG9nZ2xlSW5zdGFuY2VEaXJlY3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGluc3RhbmNlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGluc3RhbmNlLmRpcmVjdGlvbjtcbiAgICBpbnN0YW5jZS5wYXNzVGhyb3VnaCA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmN1cnJlbnRUaW1lID0gMDtcbiAgICBpbnN0YW5jZS5wcm9ncmVzcyA9IDA7XG4gICAgaW5zdGFuY2UucGF1c2VkID0gdHJ1ZTtcbiAgICBpbnN0YW5jZS5iZWdhbiA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmxvb3BCZWdhbiA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmNoYW5nZUJlZ2FuID0gZmFsc2U7XG4gICAgaW5zdGFuY2UuY29tcGxldGVkID0gZmFsc2U7XG4gICAgaW5zdGFuY2UuY2hhbmdlQ29tcGxldGVkID0gZmFsc2U7XG4gICAgaW5zdGFuY2UucmV2ZXJzZVBsYXliYWNrID0gZmFsc2U7XG4gICAgaW5zdGFuY2UucmV2ZXJzZWQgPSBkaXJlY3Rpb24gPT09ICdyZXZlcnNlJztcbiAgICBpbnN0YW5jZS5yZW1haW5pbmcgPSBpbnN0YW5jZS5sb29wO1xuICAgIGNoaWxkcmVuID0gaW5zdGFuY2UuY2hpbGRyZW47XG4gICAgY2hpbGRyZW5MZW5ndGggPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IGNoaWxkcmVuTGVuZ3RoOyBpLS07KSB7IGluc3RhbmNlLmNoaWxkcmVuW2ldLnJlc2V0KCk7IH1cbiAgICBpZiAoaW5zdGFuY2UucmV2ZXJzZWQgJiYgaW5zdGFuY2UubG9vcCAhPT0gdHJ1ZSB8fCAoZGlyZWN0aW9uID09PSAnYWx0ZXJuYXRlJyAmJiBpbnN0YW5jZS5sb29wID09PSAxKSkgeyBpbnN0YW5jZS5yZW1haW5pbmcrKzsgfVxuICAgIHNldEFuaW1hdGlvbnNQcm9ncmVzcyhpbnN0YW5jZS5yZXZlcnNlZCA/IGluc3RhbmNlLmR1cmF0aW9uIDogMCk7XG4gIH07XG5cbiAgLy8gaW50ZXJuYWwgbWV0aG9kIChmb3IgZW5naW5lKSB0byBhZGp1c3QgYW5pbWF0aW9uIHRpbWluZ3MgYmVmb3JlIHJlc3RvcmluZyBlbmdpbmUgdGlja3MgKHJBRilcbiAgaW5zdGFuY2UuX29uRG9jdW1lbnRWaXNpYmlsaXR5ID0gcmVzZXRUaW1lO1xuXG4gIC8vIFNldCBWYWx1ZSBoZWxwZXJcblxuICBpbnN0YW5jZS5zZXQgPSBmdW5jdGlvbih0YXJnZXRzLCBwcm9wZXJ0aWVzKSB7XG4gICAgc2V0VGFyZ2V0c1ZhbHVlKHRhcmdldHMsIHByb3BlcnRpZXMpO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfTtcblxuICBpbnN0YW5jZS50aWNrID0gZnVuY3Rpb24odCkge1xuICAgIG5vdyA9IHQ7XG4gICAgaWYgKCFzdGFydFRpbWUpIHsgc3RhcnRUaW1lID0gbm93OyB9XG4gICAgc2V0SW5zdGFuY2VQcm9ncmVzcygobm93ICsgKGxhc3RUaW1lIC0gc3RhcnRUaW1lKSkgKiBhbmltZS5zcGVlZCk7XG4gIH07XG5cbiAgaW5zdGFuY2Uuc2VlayA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICBzZXRJbnN0YW5jZVByb2dyZXNzKGFkanVzdFRpbWUodGltZSkpO1xuICB9O1xuXG4gIGluc3RhbmNlLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgaW5zdGFuY2UucGF1c2VkID0gdHJ1ZTtcbiAgICByZXNldFRpbWUoKTtcbiAgfTtcblxuICBpbnN0YW5jZS5wbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFpbnN0YW5jZS5wYXVzZWQpIHsgcmV0dXJuOyB9XG4gICAgaWYgKGluc3RhbmNlLmNvbXBsZXRlZCkgeyBpbnN0YW5jZS5yZXNldCgpOyB9XG4gICAgaW5zdGFuY2UucGF1c2VkID0gZmFsc2U7XG4gICAgYWN0aXZlSW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpO1xuICAgIHJlc2V0VGltZSgpO1xuICAgIGVuZ2luZSgpO1xuICB9O1xuXG4gIGluc3RhbmNlLnJldmVyc2UgPSBmdW5jdGlvbigpIHtcbiAgICB0b2dnbGVJbnN0YW5jZURpcmVjdGlvbigpO1xuICAgIGluc3RhbmNlLmNvbXBsZXRlZCA9IGluc3RhbmNlLnJldmVyc2VkID8gZmFsc2UgOiB0cnVlO1xuICAgIHJlc2V0VGltZSgpO1xuICB9O1xuXG4gIGluc3RhbmNlLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICBpbnN0YW5jZS5yZXNldCgpO1xuICAgIGluc3RhbmNlLnBsYXkoKTtcbiAgfTtcblxuICBpbnN0YW5jZS5yZW1vdmUgPSBmdW5jdGlvbih0YXJnZXRzKSB7XG4gICAgdmFyIHRhcmdldHNBcnJheSA9IHBhcnNlVGFyZ2V0cyh0YXJnZXRzKTtcbiAgICByZW1vdmVUYXJnZXRzRnJvbUluc3RhbmNlKHRhcmdldHNBcnJheSwgaW5zdGFuY2UpO1xuICB9O1xuXG4gIGluc3RhbmNlLnJlc2V0KCk7XG5cbiAgaWYgKGluc3RhbmNlLmF1dG9wbGF5KSB7IGluc3RhbmNlLnBsYXkoKTsgfVxuXG4gIHJldHVybiBpbnN0YW5jZTtcblxufVxuXG4vLyBSZW1vdmUgdGFyZ2V0cyBmcm9tIGFuaW1hdGlvblxuXG5mdW5jdGlvbiByZW1vdmVUYXJnZXRzRnJvbUFuaW1hdGlvbnModGFyZ2V0c0FycmF5LCBhbmltYXRpb25zKSB7XG4gIGZvciAodmFyIGEgPSBhbmltYXRpb25zLmxlbmd0aDsgYS0tOykge1xuICAgIGlmIChhcnJheUNvbnRhaW5zKHRhcmdldHNBcnJheSwgYW5pbWF0aW9uc1thXS5hbmltYXRhYmxlLnRhcmdldCkpIHtcbiAgICAgIGFuaW1hdGlvbnMuc3BsaWNlKGEsIDEpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVUYXJnZXRzRnJvbUluc3RhbmNlKHRhcmdldHNBcnJheSwgaW5zdGFuY2UpIHtcbiAgdmFyIGFuaW1hdGlvbnMgPSBpbnN0YW5jZS5hbmltYXRpb25zO1xuICB2YXIgY2hpbGRyZW4gPSBpbnN0YW5jZS5jaGlsZHJlbjtcbiAgcmVtb3ZlVGFyZ2V0c0Zyb21BbmltYXRpb25zKHRhcmdldHNBcnJheSwgYW5pbWF0aW9ucyk7XG4gIGZvciAodmFyIGMgPSBjaGlsZHJlbi5sZW5ndGg7IGMtLTspIHtcbiAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltjXTtcbiAgICB2YXIgY2hpbGRBbmltYXRpb25zID0gY2hpbGQuYW5pbWF0aW9ucztcbiAgICByZW1vdmVUYXJnZXRzRnJvbUFuaW1hdGlvbnModGFyZ2V0c0FycmF5LCBjaGlsZEFuaW1hdGlvbnMpO1xuICAgIGlmICghY2hpbGRBbmltYXRpb25zLmxlbmd0aCAmJiAhY2hpbGQuY2hpbGRyZW4ubGVuZ3RoKSB7IGNoaWxkcmVuLnNwbGljZShjLCAxKTsgfVxuICB9XG4gIGlmICghYW5pbWF0aW9ucy5sZW5ndGggJiYgIWNoaWxkcmVuLmxlbmd0aCkgeyBpbnN0YW5jZS5wYXVzZSgpOyB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVRhcmdldHNGcm9tQWN0aXZlSW5zdGFuY2VzKHRhcmdldHMpIHtcbiAgdmFyIHRhcmdldHNBcnJheSA9IHBhcnNlVGFyZ2V0cyh0YXJnZXRzKTtcbiAgZm9yICh2YXIgaSA9IGFjdGl2ZUluc3RhbmNlcy5sZW5ndGg7IGktLTspIHtcbiAgICB2YXIgaW5zdGFuY2UgPSBhY3RpdmVJbnN0YW5jZXNbaV07XG4gICAgcmVtb3ZlVGFyZ2V0c0Zyb21JbnN0YW5jZSh0YXJnZXRzQXJyYXksIGluc3RhbmNlKTtcbiAgfVxufVxuXG4vLyBTdGFnZ2VyIGhlbHBlcnNcblxuZnVuY3Rpb24gc3RhZ2dlcih2YWwsIHBhcmFtcykge1xuICBpZiAoIHBhcmFtcyA9PT0gdm9pZCAwICkgcGFyYW1zID0ge307XG5cbiAgdmFyIGRpcmVjdGlvbiA9IHBhcmFtcy5kaXJlY3Rpb24gfHwgJ25vcm1hbCc7XG4gIHZhciBlYXNpbmcgPSBwYXJhbXMuZWFzaW5nID8gcGFyc2VFYXNpbmdzKHBhcmFtcy5lYXNpbmcpIDogbnVsbDtcbiAgdmFyIGdyaWQgPSBwYXJhbXMuZ3JpZDtcbiAgdmFyIGF4aXMgPSBwYXJhbXMuYXhpcztcbiAgdmFyIGZyb21JbmRleCA9IHBhcmFtcy5mcm9tIHx8IDA7XG4gIHZhciBmcm9tRmlyc3QgPSBmcm9tSW5kZXggPT09ICdmaXJzdCc7XG4gIHZhciBmcm9tQ2VudGVyID0gZnJvbUluZGV4ID09PSAnY2VudGVyJztcbiAgdmFyIGZyb21MYXN0ID0gZnJvbUluZGV4ID09PSAnbGFzdCc7XG4gIHZhciBpc1JhbmdlID0gaXMuYXJyKHZhbCk7XG4gIHZhciB2YWwxID0gaXNSYW5nZSA/IHBhcnNlRmxvYXQodmFsWzBdKSA6IHBhcnNlRmxvYXQodmFsKTtcbiAgdmFyIHZhbDIgPSBpc1JhbmdlID8gcGFyc2VGbG9hdCh2YWxbMV0pIDogMDtcbiAgdmFyIHVuaXQgPSBnZXRVbml0KGlzUmFuZ2UgPyB2YWxbMV0gOiB2YWwpIHx8IDA7XG4gIHZhciBzdGFydCA9IHBhcmFtcy5zdGFydCB8fCAwICsgKGlzUmFuZ2UgPyB2YWwxIDogMCk7XG4gIHZhciB2YWx1ZXMgPSBbXTtcbiAgdmFyIG1heFZhbHVlID0gMDtcbiAgcmV0dXJuIGZ1bmN0aW9uIChlbCwgaSwgdCkge1xuICAgIGlmIChmcm9tRmlyc3QpIHsgZnJvbUluZGV4ID0gMDsgfVxuICAgIGlmIChmcm9tQ2VudGVyKSB7IGZyb21JbmRleCA9ICh0IC0gMSkgLyAyOyB9XG4gICAgaWYgKGZyb21MYXN0KSB7IGZyb21JbmRleCA9IHQgLSAxOyB9XG4gICAgaWYgKCF2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdDsgaW5kZXgrKykge1xuICAgICAgICBpZiAoIWdyaWQpIHtcbiAgICAgICAgICB2YWx1ZXMucHVzaChNYXRoLmFicyhmcm9tSW5kZXggLSBpbmRleCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBmcm9tWCA9ICFmcm9tQ2VudGVyID8gZnJvbUluZGV4JWdyaWRbMF0gOiAoZ3JpZFswXS0xKS8yO1xuICAgICAgICAgIHZhciBmcm9tWSA9ICFmcm9tQ2VudGVyID8gTWF0aC5mbG9vcihmcm9tSW5kZXgvZ3JpZFswXSkgOiAoZ3JpZFsxXS0xKS8yO1xuICAgICAgICAgIHZhciB0b1ggPSBpbmRleCVncmlkWzBdO1xuICAgICAgICAgIHZhciB0b1kgPSBNYXRoLmZsb29yKGluZGV4L2dyaWRbMF0pO1xuICAgICAgICAgIHZhciBkaXN0YW5jZVggPSBmcm9tWCAtIHRvWDtcbiAgICAgICAgICB2YXIgZGlzdGFuY2VZID0gZnJvbVkgLSB0b1k7XG4gICAgICAgICAgdmFyIHZhbHVlID0gTWF0aC5zcXJ0KGRpc3RhbmNlWCAqIGRpc3RhbmNlWCArIGRpc3RhbmNlWSAqIGRpc3RhbmNlWSk7XG4gICAgICAgICAgaWYgKGF4aXMgPT09ICd4JykgeyB2YWx1ZSA9IC1kaXN0YW5jZVg7IH1cbiAgICAgICAgICBpZiAoYXhpcyA9PT0gJ3knKSB7IHZhbHVlID0gLWRpc3RhbmNlWTsgfVxuICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBtYXhWYWx1ZSA9IE1hdGgubWF4LmFwcGx5KE1hdGgsIHZhbHVlcyk7XG4gICAgICB9XG4gICAgICBpZiAoZWFzaW5nKSB7IHZhbHVlcyA9IHZhbHVlcy5tYXAoZnVuY3Rpb24gKHZhbCkgeyByZXR1cm4gZWFzaW5nKHZhbCAvIG1heFZhbHVlKSAqIG1heFZhbHVlOyB9KTsgfVxuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3JldmVyc2UnKSB7IHZhbHVlcyA9IHZhbHVlcy5tYXAoZnVuY3Rpb24gKHZhbCkgeyByZXR1cm4gYXhpcyA/ICh2YWwgPCAwKSA/IHZhbCAqIC0xIDogLXZhbCA6IE1hdGguYWJzKG1heFZhbHVlIC0gdmFsKTsgfSk7IH1cbiAgICB9XG4gICAgdmFyIHNwYWNpbmcgPSBpc1JhbmdlID8gKHZhbDIgLSB2YWwxKSAvIG1heFZhbHVlIDogdmFsMTtcbiAgICByZXR1cm4gc3RhcnQgKyAoc3BhY2luZyAqIChNYXRoLnJvdW5kKHZhbHVlc1tpXSAqIDEwMCkgLyAxMDApKSArIHVuaXQ7XG4gIH1cbn1cblxuLy8gVGltZWxpbmVcblxuZnVuY3Rpb24gdGltZWxpbmUocGFyYW1zKSB7XG4gIGlmICggcGFyYW1zID09PSB2b2lkIDAgKSBwYXJhbXMgPSB7fTtcblxuICB2YXIgdGwgPSBhbmltZShwYXJhbXMpO1xuICB0bC5kdXJhdGlvbiA9IDA7XG4gIHRsLmFkZCA9IGZ1bmN0aW9uKGluc3RhbmNlUGFyYW1zLCB0aW1lbGluZU9mZnNldCkge1xuICAgIHZhciB0bEluZGV4ID0gYWN0aXZlSW5zdGFuY2VzLmluZGV4T2YodGwpO1xuICAgIHZhciBjaGlsZHJlbiA9IHRsLmNoaWxkcmVuO1xuICAgIGlmICh0bEluZGV4ID4gLTEpIHsgYWN0aXZlSW5zdGFuY2VzLnNwbGljZSh0bEluZGV4LCAxKTsgfVxuICAgIGZ1bmN0aW9uIHBhc3NUaHJvdWdoKGlucykgeyBpbnMucGFzc1Rocm91Z2ggPSB0cnVlOyB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykgeyBwYXNzVGhyb3VnaChjaGlsZHJlbltpXSk7IH1cbiAgICB2YXIgaW5zUGFyYW1zID0gbWVyZ2VPYmplY3RzKGluc3RhbmNlUGFyYW1zLCByZXBsYWNlT2JqZWN0UHJvcHMoZGVmYXVsdFR3ZWVuU2V0dGluZ3MsIHBhcmFtcykpO1xuICAgIGluc1BhcmFtcy50YXJnZXRzID0gaW5zUGFyYW1zLnRhcmdldHMgfHwgcGFyYW1zLnRhcmdldHM7XG4gICAgdmFyIHRsRHVyYXRpb24gPSB0bC5kdXJhdGlvbjtcbiAgICBpbnNQYXJhbXMuYXV0b3BsYXkgPSBmYWxzZTtcbiAgICBpbnNQYXJhbXMuZGlyZWN0aW9uID0gdGwuZGlyZWN0aW9uO1xuICAgIGluc1BhcmFtcy50aW1lbGluZU9mZnNldCA9IGlzLnVuZCh0aW1lbGluZU9mZnNldCkgPyB0bER1cmF0aW9uIDogZ2V0UmVsYXRpdmVWYWx1ZSh0aW1lbGluZU9mZnNldCwgdGxEdXJhdGlvbik7XG4gICAgcGFzc1Rocm91Z2godGwpO1xuICAgIHRsLnNlZWsoaW5zUGFyYW1zLnRpbWVsaW5lT2Zmc2V0KTtcbiAgICB2YXIgaW5zID0gYW5pbWUoaW5zUGFyYW1zKTtcbiAgICBwYXNzVGhyb3VnaChpbnMpO1xuICAgIGNoaWxkcmVuLnB1c2goaW5zKTtcbiAgICB2YXIgdGltaW5ncyA9IGdldEluc3RhbmNlVGltaW5ncyhjaGlsZHJlbiwgcGFyYW1zKTtcbiAgICB0bC5kZWxheSA9IHRpbWluZ3MuZGVsYXk7XG4gICAgdGwuZW5kRGVsYXkgPSB0aW1pbmdzLmVuZERlbGF5O1xuICAgIHRsLmR1cmF0aW9uID0gdGltaW5ncy5kdXJhdGlvbjtcbiAgICB0bC5zZWVrKDApO1xuICAgIHRsLnJlc2V0KCk7XG4gICAgaWYgKHRsLmF1dG9wbGF5KSB7IHRsLnBsYXkoKTsgfVxuICAgIHJldHVybiB0bDtcbiAgfTtcbiAgcmV0dXJuIHRsO1xufVxuXG5hbmltZS52ZXJzaW9uID0gJzMuMi4yJztcbmFuaW1lLnNwZWVkID0gMTtcbi8vIFRPRE86I3JldmlldzogbmFtaW5nLCBkb2N1bWVudGF0aW9uXG5hbmltZS5zdXNwZW5kV2hlbkRvY3VtZW50SGlkZGVuID0gdHJ1ZTtcbmFuaW1lLnJ1bm5pbmcgPSBhY3RpdmVJbnN0YW5jZXM7XG5hbmltZS5yZW1vdmUgPSByZW1vdmVUYXJnZXRzRnJvbUFjdGl2ZUluc3RhbmNlcztcbmFuaW1lLmdldCA9IGdldE9yaWdpbmFsVGFyZ2V0VmFsdWU7XG5hbmltZS5zZXQgPSBzZXRUYXJnZXRzVmFsdWU7XG5hbmltZS5jb252ZXJ0UHggPSBjb252ZXJ0UHhUb1VuaXQ7XG5hbmltZS5wYXRoID0gZ2V0UGF0aDtcbmFuaW1lLnNldERhc2hvZmZzZXQgPSBzZXREYXNob2Zmc2V0O1xuYW5pbWUuc3RhZ2dlciA9IHN0YWdnZXI7XG5hbmltZS50aW1lbGluZSA9IHRpbWVsaW5lO1xuYW5pbWUuZWFzaW5nID0gcGFyc2VFYXNpbmdzO1xuYW5pbWUucGVubmVyID0gcGVubmVyO1xuYW5pbWUucmFuZG9tID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7IHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluOyB9O1xuXG5leHBvcnQgZGVmYXVsdCBhbmltZTtcbiIsImltcG9ydCBhbmltZSBmcm9tIFwiLi8uLi9saWIvYW5pbWUuZXMuanNcIjtcclxuXHJcbi8vID09PT09PT09PT09PT0gINCk0YPQvdC60YbQuNGPINGB0LrRgNGL0YLQuNGPINC30LDQv9C40YHQtdC5ICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5jb25zdCBwcm9kdWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5jdXN0b21lcnNfX3RhYmxlLXdyYXBwZXJcIik7XHJcbmZ1bmN0aW9uIGFuaW1hdGVPdXQoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5pdGVtc1wiKTtcclxuXHJcbiAgICAgICAgaXRlbXMuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICUgMiA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoXCJoaWRlLXRvLXJpZ2h0XCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKFwiaGlkZS10by1sZWZ0XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBoaWRlVG9SaWdodCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuaGlkZS10by1yaWdodFwiKTtcclxuICAgICAgICB2YXIgaGlkZVRvTGVmdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuaGlkZS10by1sZWZ0XCIpO1xyXG5cclxuICAgICAgICBhbmltZSh7XHJcbiAgICAgICAgICAgIHRhcmdldHM6IGhpZGVUb1JpZ2h0LFxyXG4gICAgICAgICAgICB0cmFuc2xhdGVYOiBcIjEwMCVcIixcclxuICAgICAgICAgICAgZGVsYXk6IGFuaW1lLnN0YWdnZXIoMTAwLCB7IGVhc2luZzogXCJlYXNlT3V0UXVhZFwiIH0pLFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogMzAwMCxcclxuICAgICAgICAgICAgLy8gdXBkYXRlOiBmdW5jdGlvbihhbmltKSB7XHJcbiAgICAgICAgICAgIC8vICAgICBwcm9ncmVzc0xvZ0VsLnZhbHVlID1cclxuICAgICAgICAgICAgLy8gICAgICAgICBcInByb2dyZXNzIDogXCIgKyBNYXRoLnJvdW5kKGFuaW0ucHJvZ3Jlc3MpICsgXCIlXCI7XHJcbiAgICAgICAgICAgIC8vICAgICBiZWdpbkxvZ0VsLnZhbHVlID0gXCJiZWdhbiA6IFwiICsgYW5pbS5iZWdhbjtcclxuICAgICAgICAgICAgLy8gICAgIGNvbXBsZXRlTG9nRWwudmFsdWUgPSBcImNvbXBsZXRlZCA6IFwiICsgYW5pbS5jb21wbGV0ZWQ7XHJcbiAgICAgICAgICAgIC8vIH0sXHJcbiAgICAgICAgICAgIC8vIGJlZ2luOiBmdW5jdGlvbihhbmltKSB7XHJcbiAgICAgICAgICAgIC8vICAgICBiZWdpbkxvZ0VsLnZhbHVlID0gXCJiZWdhbiA6IFwiICsgYW5pbS5iZWdhbjtcclxuICAgICAgICAgICAgLy8gfSxcclxuICAgICAgICAgICAgLy8gY29tcGxldGU6IGZ1bmN0aW9uKGFuaW0pIHtcclxuICAgICAgICAgICAgLy8gICAgIGNvbXBsZXRlTG9nRWwudmFsdWUgPSBcImNvbXBsZXRlZCA6IFwiICsgYW5pbS5jb21wbGV0ZWQ7XHJcbiAgICAgICAgICAgIC8vIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGFuaW1lKHtcclxuICAgICAgICAgICAgdGFyZ2V0czogaGlkZVRvTGVmdCxcclxuICAgICAgICAgICAgdHJhbnNsYXRlWDogXCItMTAwJVwiLFxyXG4gICAgICAgICAgICAvLyBlYXNpbmc6IFwiZWFzZUluT3V0UXVhZFwiLFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogMzAwMCxcclxuICAgICAgICAgICAgZGVsYXk6IGFuaW1lLnN0YWdnZXIoMTAwLCB7IGVhc2luZzogXCJlYXNlT3V0UXVhZFwiIH0pLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICBwcm9kdWN0LnN0eWxlLm9wYWNpdHkgPSAwO1xyXG5cclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICB9KTtcclxufVxyXG4vLyA9PT09PT09PT09PT09ICDQpNGD0L3QutGG0LjRjyDQv9C+0Y/QstC70LXQvdC40Y8g0LfQsNC/0LjRgdC10LkgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbmZ1bmN0aW9uIGFuaW1hdGVJbigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgaXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLml0ZW1zXCIpO1xyXG5cclxuICAgICAgICBwcm9kdWN0LnN0eWxlLm9wYWNpdHkgPSAxO1xyXG5cclxuICAgICAgICB2YXIgaGlkZVRvUmlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmhpZGUtdG8tcmlnaHRcIik7XHJcbiAgICAgICAgdmFyIGhpZGVUb0xlZnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmhpZGUtdG8tbGVmdFwiKTtcclxuXHJcbiAgICAgICAgYW5pbWUoe1xyXG4gICAgICAgICAgICB0YXJnZXRzOiBoaWRlVG9SaWdodCxcclxuICAgICAgICAgICAgLy8gb3BhY2l0eTogWzAsIDFdLFxyXG4gICAgICAgICAgICB0cmFuc2xhdGVYOiBbXCIxMDAlXCIsIDBdLFxyXG4gICAgICAgICAgICBkZWxheTogYW5pbWUuc3RhZ2dlcigxMDAsIHsgZWFzaW5nOiBcImVhc2VPdXRRdWFkXCIgfSksXHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAzNTAwLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhbmltZSh7XHJcbiAgICAgICAgICAgIHRhcmdldHM6IGhpZGVUb0xlZnQsXHJcbiAgICAgICAgICAgIC8vIG9wYWNpdHk6IFswLCAxXSxcclxuICAgICAgICAgICAgdHJhbnNsYXRlWDogW1wiLTEwMCVcIiwgMF0sXHJcbiAgICAgICAgICAgIC8vIGVhc2luZzogXCJlYXNlSW5PdXRRdWFkXCIsXHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAzNTAwLFxyXG4gICAgICAgICAgICBkZWxheTogYW5pbWUuc3RhZ2dlcigxMDAsIHsgZWFzaW5nOiBcImVhc2VPdXRRdWFkXCIgfSksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vID09PT09PT09PT09PT09PT09PT09ICDQotC10YHRgtC+0LLRi9C5INCy0LDRgNC40LDQvdGCICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5mdW5jdGlvbiBhbmltYXRlT3V0UHJvbWljZSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgaXRlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLml0ZW1zXCIpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhcIml0ZW1zXCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS1cIik7XHJcblxyXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIGFuaW1hdGUoeyBkdXJhdGlvbiwgZHJhdywgdGltaW5nIH0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gYW5pbWF0ZSh0aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRpbWVGcmFjdGlvbiA9ICh0aW1lIC0gc3RhcnQpIC8gZHVyYXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpbWVGcmFjdGlvbiA+IDEpIHRpbWVGcmFjdGlvbiA9IDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHRpbWluZyh0aW1lRnJhY3Rpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInByb2dyZXNzIGluIGFuaW1hdGU6IFwiICsgcHJvZ3Jlc3MpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkcmF3KHByb2dyZXNzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpbWVGcmFjdGlvbiA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYXdhaXQgYW5pbWF0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gZ29BbmltYXRlKCkge1xyXG4gICAgICAgICAgICBhd2FpdCBhbmltYXRlKHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAwLFxyXG4gICAgICAgICAgICAgICAgLy8gdGltaW5nOiBib3VuY2VFYXNlSW5PdXQsXHJcbiAgICAgICAgICAgICAgICB0aW1pbmc6IGNpcmNFYXNlSW5PdXQsXHJcbiAgICAgICAgICAgICAgICBkcmF3OiBmdW5jdGlvbihwcm9ncmVzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0IGl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5pdGVtc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIml0ZW1zXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS1cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiSW5kZXg6IFwiICsgaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkl0ZW06IFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicHJvZ3Jlc3MgaW4gYW5pbWF0ZU91dDogXCIgKyBwcm9ncmVzcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggJSAyID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaW5kZXglMiA9PSAwXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zdHlsZS5sZWZ0ID0gcHJvZ3Jlc3MgKiAxMDAgKyBcIiVcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaW5kZXglMiAhPSAwXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zdHlsZS5sZWZ0ID0gLShwcm9ncmVzcyAqIDEwMCkgKyBcIiVcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnN0eWxlLm9wYWNpdHkgPSBwcm9ncmVzcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJsZWZ0OiBcIiArIGl0ZW0uc3R5bGUubGVmdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwib3BhY2l0eTogXCIgKyBpdGVtLnN0eWxlLm9wYWNpdHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnb0FuaW1hdGUoKTtcclxuXHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vINCj0YHRgtCw0L3QsNCy0LvQuNCy0LDQtdC8INC90LDRh9Cw0LvRjNC90YvQtSDQt9C90LDRh9C10L3QuNGPINC30LAg0L/RgNC10LTQtdC70LDQvNC4INGC0LDQsdC70LjRhtGLINC4IG9wYWNpdHk6IDBcclxuZnVuY3Rpb24gc2V0T3V0T2ZSYW5nZSgpIHtcclxuICAgIGNvbnN0IGl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5pdGVtc1wiKTtcclxuXHJcbiAgICBpdGVtcy5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xyXG4gICAgICAgIGlmIChpbmRleCAlIDIgPT0gMCkge1xyXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoXCJoaWRlLXRvLXJpZ2h0XCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZChcImhpZGUtdG8tbGVmdFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaXRlbS5zdHlsZS5vcGFjaXR5ID0gMDtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5mdW5jdGlvbiBtYWtlRWFzZUluT3V0KHRpbWluZykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHRpbWVGcmFjdGlvbikge1xyXG4gICAgICAgIGlmICh0aW1lRnJhY3Rpb24gPCAwLjUpIHJldHVybiB0aW1pbmcoMiAqIHRpbWVGcmFjdGlvbikgLyAyO1xyXG4gICAgICAgIGVsc2UgcmV0dXJuICgyIC0gdGltaW5nKDIgKiAoMSAtIHRpbWVGcmFjdGlvbikpKSAvIDI7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyA9PT09PT09PT09PT09PT09PT09PSAg0KTRg9C90LrRhtC40Lgg0YDQsNGB0YfQtdGC0LAg0LLRgNC10LzQtdC90LggID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4vLyAtLS0tLS0tLS0tICDQntGC0YHQutC+0LrQuCAgLS0tLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIGJvdW5jZSh0aW1lRnJhY3Rpb24pIHtcclxuICAgIGZvciAobGV0IGEgPSAwLCBiID0gMTsgMTsgYSArPSBiLCBiIC89IDIpIHtcclxuICAgICAgICBpZiAodGltZUZyYWN0aW9uID49ICg3IC0gNCAqIGEpIC8gMTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIC1NYXRoLnBvdygoMTEgLSA2ICogYSAtIDExICogdGltZUZyYWN0aW9uKSAvIDQsIDIpICtcclxuICAgICAgICAgICAgICAgIE1hdGgucG93KGIsIDIpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5sZXQgYm91bmNlRWFzZUluT3V0ID0gbWFrZUVhc2VJbk91dChib3VuY2UpO1xyXG5cclxuLy8gLS0tLS0tLS0tLSAg0JTRg9Cz0LAgIC0tLS0tLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gY2lyYyh0aW1lRnJhY3Rpb24pIHtcclxuICAgIHJldHVybiAxIC0gTWF0aC5zaW4oTWF0aC5hY29zKHRpbWVGcmFjdGlvbikpO1xyXG59XHJcblxyXG5sZXQgY2lyY0Vhc2VJbk91dCA9IG1ha2VFYXNlSW5PdXQoY2lyYyk7XHJcblxyXG4vLyBicmljay5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbi8vICAgICBhbmltYXRlKHtcclxuLy8gICAgICAgICBkdXJhdGlvbjogMzAwMCxcclxuLy8gICAgICAgICB0aW1pbmc6IGJvdW5jZUVhc2VJbk91dCxcclxuLy8gICAgICAgICBkcmF3OiBmdW5jdGlvbihwcm9ncmVzcykge1xyXG4vLyAgICAgICAgICAgICBicmljay5zdHlsZS5sZWZ0ID0gcHJvZ3Jlc3MgKiA1MDAgKyBcInB4XCI7XHJcbi8vICAgICAgICAgfSxcclxuLy8gICAgIH0pO1xyXG4vLyB9O1xyXG5cclxuLy8gZnVuY3Rpb24gYW5pbWF0ZSh7IGR1cmF0aW9uLCBkcmF3LCB0aW1pbmcgfSkge1xyXG4vLyAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbi8vICAgICAgICAgbGV0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4vLyAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiBhbmltYXRlKHRpbWUpIHtcclxuLy8gICAgICAgICAgICAgbGV0IHRpbWVGcmFjdGlvbiA9ICh0aW1lIC0gc3RhcnQpIC8gZHVyYXRpb247XHJcbi8vICAgICAgICAgICAgIGlmICh0aW1lRnJhY3Rpb24gPiAxKSB0aW1lRnJhY3Rpb24gPSAxO1xyXG5cclxuLy8gICAgICAgICAgICAgbGV0IHByb2dyZXNzID0gdGltaW5nKHRpbWVGcmFjdGlvbik7XHJcblxyXG4vLyAgICAgICAgICAgICBjb25zb2xlLmxvZygncHJvZ3Jlc3MgaW4gYW5pbWF0ZTogJyArIHByb2dyZXNzKTtcclxuXHJcbi8vICAgICAgICAgICAgIGRyYXcocHJvZ3Jlc3MpO1xyXG5cclxuLy8gICAgICAgICAgICAgaWYgKHRpbWVGcmFjdGlvbiA8IDEpIHtcclxuLy8gICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcclxuLy8gICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgIHJlc29sdmUoKTtcclxuLy8gICAgIH0pO1xyXG5cclxuZXhwb3J0IHsgYW5pbWF0ZU91dCwgYW5pbWF0ZUluIH07XHJcbiIsImZ1bmN0aW9uIGJ0blN0YXR1cygpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgYnRucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuc3RhdHVzLWJ0blwiKTtcclxuXHJcbiAgICAgICAgYnRucy5mb3JFYWNoKGZ1bmN0aW9uKGJ0bikge1xyXG4gICAgICAgICAgICAvLyDQkiDQt9Cw0LLQuNGB0LjQvNC+0YHRgtC4INC+0YIg0YHRgtCw0YLRg9GB0LAg0YPRgdGC0LDQvdCw0LLQu9C40LLQsNC10Lwg0LrQu9Cw0YHRgSAnYWN0aXZlJ1xyXG4gICAgICAgICAgICBpZiAoYnRuLmlubmVyVGV4dC50b0xvd2VyQ2FzZSgpID09IFwiYWN0aXZlXCIpIHtcclxuICAgICAgICAgICAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKFwic3RhdHVzLWJ0bi0tYWN0aXZlXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGJ0bi5pbm5lclRleHQudG9Mb3dlckNhc2UoKSA9PSBcImluYWN0aXZlXCIpIHtcclxuICAgICAgICAgICAgICAgIGJ0bi5jbGFzc0xpc3QucmVtb3ZlKFwic3RhdHVzLWJ0bi0tYWN0aXZlXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBidG4uY2xhc3NMaXN0LnRvZ2dsZShcInN0YXR1cy1idG4tLWFjdGl2ZVwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNBY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBidG4uaW5uZXJUZXh0ID0gXCJBY3RpdmVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnRuLmlubmVyVGV4dCA9IFwiSW5hY3RpdmVcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGJ0blN0YXR1czsiLCJpbXBvcnQganNvbkN1c3RvbWVycyBmcm9tICcuLy4uLy4uL2RhdGEvY3VzdG9tZXJzLmpzb24nO1xyXG5pbXBvcnQgYnRuU3RhdHVzIGZyb20gXCIuL2J0bi1zdGF0dXMuanNcIjtcclxuaW1wb3J0IHsgYW5pbWF0ZU91dCwgYW5pbWF0ZUluIH0gZnJvbSBcIi4vYW5pbWF0ZS1pbi1vdXQuanNcIjtcclxuXHJcbmZ1bmN0aW9uIGN1c3RvbWVycygpIHtcclxuICAgIFxyXG4gICAgLy8g0JrQvtC70LjRh9C10YHRgtCy0L4g0LLRi9Cy0L7QtNC40LzRi9GFINC30LDQv9C40YHQtdC5INC90LAg0YHRgtGA0LDQvdC40YbQtVxyXG4gICAgbGV0IGxlbmd0aFBhZ2VzID0gODtcclxuICAgIC8vINCf0LXRgNCy0LDRjyDQt9Cw0LPRgNGD0LfQutCwINGB0YLRgNCw0L3QuNGG0YtcclxuICAgIGxldCBmaXJzdFJ1biA9IHRydWU7XHJcblxyXG4gICAgY29uc3QgbnVtUGFnZXMgPSBNYXRoLmNlaWwoIGpzb25DdXN0b21lcnMubGVuZ3RoIC8gbGVuZ3RoUGFnZXMpOyAvLyDQmtC+0LvQuNGH0LXRgdGC0LLQviDRgdGC0YDQsNC90LjRhlxyXG4gICAgbGV0IGFycmF5UGFnZXMgPSBbXTsgICAgICAgIC8vINCc0LDRgdGB0LjQsiDQstGB0LXRhSDRgdGC0YDQsNC90LjRhlxyXG4gICAgbGV0IGFycmF5UGFnZXNUb1Nob3cgPSBbXTsgIC8vINCc0LDRgdGB0LjQsiDRhNGA0LDQs9C80LXQvdGC0LAgKDQpINGB0YLRgNCw0L3QuNGGINCyINC/0LDQs9C40L3QsNGG0LjQuFxyXG4gICAgbGV0IGFycmF5UGFnZXNMYXN0ID0gW107IC8vINCc0LDRgdGB0LjQsiDQv9C+0YHQu9C10LTQvdC40YUgKDQpINGB0YLRgNCw0L3QuNGGINCyINC/0LDQs9C40L3QsNGG0LjQuFxyXG4gICAgbGV0IGlzTGFzdFBhZ2VzUmFuZ2UgPSBmYWxzZTsgLy8g0J/QvtGB0LvQtdC00L3QuNC5INC80LDRgdGB0LjQsiDRgdGC0YDQsNC90LjRhlxyXG5cclxuICAgIC8vINCd0LDRh9Cw0LvRjNC90YvQuSDQuCDQutC+0L3QtdGH0L3Ri9C5INC40L3QtNC10LrRgSDQstGL0LHQvtGA0LrQuCDQt9C90LDRh9C10L3QuNC5XHJcbiAgICBsZXQgc3RhcnRJbmRleE9mUmFuZ2U7XHJcbiAgICBsZXQgZW5kSW5kZXhPZlJhbmdlO1xyXG5cclxuICAgIC8vINCd0LDRh9Cw0LvRjNC90YvQuSDQuCDQutC+0L3QtdGH0L3Ri9C5INC40L3QtNC10LrRgSDQstGL0LHQvtGA0LrQuCDRgdGC0YDQsNC90LjRhlxyXG4gICAgbGV0IHN0YXJ0SW5kZXhPZlJhbmdlUGFnZXM7XHJcbiAgICBsZXQgZW5kSW5kZXhPZlJhbmdlUGFnZXM7XHJcblxyXG4gICAgLy8g0JzQsNGB0YHQuNCyINGB0L4g0YHRgtGA0LDQvdC40YbQsNC80LhcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUGFnZXM7IGkrKykge1xyXG4gICAgICAgIGFycmF5UGFnZXNbaV0gPSBpICsgMTtcclxuICAgIH1cclxuXHJcbiAgICAvLyDQn9C+0YHQu9C10LTQvdC40LUgNCDRgdGC0YDQsNC90LjRhtGLXHJcbiAgICBpZiAoYXJyYXlQYWdlcy5sZW5ndGggPiA1KSB7XHJcbiAgICAgICAgYXJyYXlQYWdlc0xhc3QgPSBhcnJheVBhZ2VzLnNsaWNlKFxyXG4gICAgICAgICAgICBhcnJheVBhZ2VzLmxlbmd0aCAtIDQsXHJcbiAgICAgICAgICAgIGFycmF5UGFnZXMubGVuZ3RoXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8g0JjQvdC40YbQuNCw0LvQuNC30LDRhtC40Y8g0YLQtdC60YPRidC10Lkg0YHRgtGA0LDQvdC40YbRiyDQuCDQtdC1INC40L3QtNC10LrRgdCwXHJcbiAgICBsZXQgY3VycmVudFBhZ2VJbmRleCA9IDA7XHJcbiAgICBsZXQgY3VycmVudFBhZ2UgPSBhcnJheVBhZ2VzW2N1cnJlbnRQYWdlSW5kZXhdO1xyXG4gICAgbGV0IGN1c3RvbWVyc1RvU2hvdztcclxuXHJcbiAgICAvLyDQpNGA0LDQs9C80LXQvdGCINGB0YLRgNCw0L3QuNGGINC00LvRjyDQstGL0LLQvtC00LAg0LIg0L/QsNCz0LjQvdCw0YbQuNC4XHJcbiAgICBpZiAobnVtUGFnZXMgPD0gNCkge1xyXG4gICAgICAgIGFycmF5UGFnZXNUb1Nob3cgPSBhcnJheVBhZ2VzO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiYXJyYXlQYWdlc1RvU2hvdzogXCIgKyBhcnJheVBhZ2VzVG9TaG93KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImN1cnJlbnRQYWdlSW5kZXg6IFwiICsgY3VycmVudFBhZ2VJbmRleCk7XHJcblxyXG4gICAgICAgIGlmIChjdXJyZW50UGFnZUluZGV4ID09IDApIHtcclxuICAgICAgICAgICAgc3RhcnRJbmRleE9mUmFuZ2VQYWdlcyA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbmRJbmRleE9mUmFuZ2VQYWdlcyA9IGFycmF5UGFnZXNUb1Nob3cubGVuZ3RoIC0gMTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlSW5kZXggPT0gMCkge1xyXG4gICAgICAgICAgICBzdGFydEluZGV4T2ZSYW5nZVBhZ2VzID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVuZEluZGV4T2ZSYW5nZVBhZ2VzID0gc3RhcnRJbmRleE9mUmFuZ2VQYWdlcyArIDQ7XHJcblxyXG4gICAgICAgIGFycmF5UGFnZXNUb1Nob3cgPSBhcnJheVBhZ2VzLnNsaWNlKFxyXG4gICAgICAgICAgICBzdGFydEluZGV4T2ZSYW5nZVBhZ2VzLFxyXG4gICAgICAgICAgICBlbmRJbmRleE9mUmFuZ2VQYWdlc1xyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8g0K3Qu9C10LzQtdC90YLRiyDRgdGC0LDRgtC40YHRgtC40LrQuDogXCLQv9C+0LrQsNC30LDQvdC+IDEg0LTQviA4INGN0Lst0YLQvtCyINC40LcgXCJcclxuICAgIGNvbnN0IHN0YXJ0SXRlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuc3RhcnQtaXRlbVwiKTtcclxuICAgIGNvbnN0IGVuZEl0ZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmVuZC1pdGVtXCIpO1xyXG4gICAgY29uc3QgdG90YWxJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIudG90YWwtaXRlbXNcIik7XHJcblxyXG4gICAgLy8gTm9kZSDQtNC40LDQv9Cw0LfQvtC90LAg0LrQvdC+0L/QvtC6INC/0LDQs9C40L3QsNGG0LjQuFxyXG4gICAgY29uc3QgYnRuUHJldiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYnRuLXByZXZcIik7XHJcbiAgICBjb25zdCBidG5OZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5idG4tbmV4dFwiKTtcclxuICAgIGNvbnN0IGJ0blBhZ2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmJ0bi1wZ1wiKTtcclxuICAgIFxyXG4gICAgY29uc3QgcHJvZHVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuY3VzdG9tZXJzX190YWJsZS13cmFwcGVyXCIpO1xyXG5cclxuICAgIC8vINCd0LDRh9Cw0LvRjNC90YvQuSDQstGL0LLQvtC0INGB0YLRgNCw0L3QuNGG0YtcclxuICAgIGdvSW5pdCgpO1xyXG4gICAgcmVuZGVyQnRuUmFuZ2UoKTtcclxuXHJcbiAgICAvLyDQntGC0YHQu9C10LbQuNCy0LDQtdC8INC60LvQuNC6INC/0L4g0YHRgtGA0LDQvdC40YbQtSDQsiBwYWdpbmF0aW9uIHJhbmdlXHJcbiAgICBsaXN0ZW5CdG5DbGljaygpO1xyXG5cclxuICAgIC8vIC4uLtC30LDQv9GD0YHQuiDRgdC+0LHRi9GC0LjRjyDQvdCwINGN0LvQtdC80LXQvdGC0LUhXHJcbiAgICAvLyAgIGxldCBldmVudCA9IG5ldyBFdmVudChcImNsaWNrXCIsIHtidWJibGVzOiB0cnVlfSk7IC8vICgyKVxyXG4gICAgLy8gICBidG5QYWdlcy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09ICAg0J7QsdGA0LDQsdC+0YLRh9C40Log0L3QsNC20LDRgtC40Y8g0LrQvdC+0L/QutC4ICAnYnRuLXByZXYnICA9PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gY29uc3QgYnRuUHJldiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tcHJldicpO1xyXG4gICAgYnRuUHJldi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlSW5kZXggPiAwKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlSW5kZXgtLTtcclxuICAgICAgICAgICAgY3VycmVudFBhZ2UgPSBhcnJheVBhZ2VzW2N1cnJlbnRQYWdlSW5kZXhdO1xyXG5cclxuICAgICAgICAgICAgLy8g0JXRgdC70Lgg0L3QvtCy0YvQuSDRgdGH0LXRgtGH0LjQuiDQvNC10L3RjNGI0LUg0LvQtdCy0L7QuSDQs9GA0LDQvdC40YbRiyDQtNC40LDQv9Cw0LfQvtC90LAg0LLRi9Cy0L7QtNCwLCDQvNC10L3Rj9C10Lwg0LTQuNCw0L/QsNC30L7QvVxyXG4gICAgICAgICAgICBpZiAoY3VycmVudFBhZ2VJbmRleCA8IHN0YXJ0SW5kZXhPZlJhbmdlUGFnZXMpIHtcclxuICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXhPZlJhbmdlUGFnZXMgPSBjdXJyZW50UGFnZUluZGV4O1xyXG4gICAgICAgICAgICAgICAgZW5kSW5kZXhPZlJhbmdlUGFnZXMgPSBzdGFydEluZGV4T2ZSYW5nZVBhZ2VzICsgNDtcclxuICAgICAgICAgICAgICAgIGFycmF5UGFnZXNUb1Nob3cgPSBhcnJheVBhZ2VzLnNsaWNlKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXhPZlJhbmdlUGFnZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgZW5kSW5kZXhPZlJhbmdlUGFnZXNcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVuZGVyQnRuUmFuZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g0KPRgdGC0LDQvdC+0LLQutCwINCw0LrRgtC40LLQvdC+0Lkg0YHRgtGA0LDQvdC40YbRiyDQsiDQsdC70L7QutC1ICdidG4tcmFuZ2UnXHJcbiAgICAgICAgLy8g0KPRgdGC0LDQvdC+0LLQutCwL9GB0L3Rj9GC0LjQtSDQsNGC0YDQuNCx0YPQsCBcImRpc2FibGVkXCJcclxuICAgICAgICAvLyDQntCx0L3QvtCy0LvRj9C10Lwg0LTQsNC90L3Ri9C1INC90LAg0YHRgtGA0LDQvdC40YbQtVxyXG4gICAgICAgIGdvSW5pdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PSAgINCe0LHRgNCw0LHQvtGC0YfQuNC6INC90LDQttCw0YLQuNGPINC60L3QvtC/0LrQuCAgJ2J0bi1uZXh0JyAgPT09PT09PT09PT09PT09PT1cclxuICAgIGJ0bk5leHQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChjdXJyZW50UGFnZUluZGV4IDwgYXJyYXlQYWdlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY3VycmVudFBhZ2VJbmRleCsrO1xyXG4gICAgICAgICAgICBjdXJyZW50UGFnZSA9IGFycmF5UGFnZXNbY3VycmVudFBhZ2VJbmRleF07XHJcblxyXG4gICAgICAgICAgICAvLyDQldGB0LvQuCDQvdC+0LLRi9C5INGB0YfQtdGC0YfQuNC6INCx0L7Qu9GM0YjQtSDQv9GA0LDQstC+0Lkg0LPRgNCw0L3QuNGG0Ysg0LTQuNCw0L/QsNC30L7QvdCwINCy0YvQstC+0LTQsCwg0LzQtdC90Y/QtdC8INC00LjQsNC/0LDQt9C+0L1cclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRQYWdlSW5kZXggPj0gZW5kSW5kZXhPZlJhbmdlUGFnZXMpIHtcclxuICAgICAgICAgICAgICAgIGVuZEluZGV4T2ZSYW5nZVBhZ2VzID0gY3VycmVudFBhZ2VJbmRleCArIDE7XHJcbiAgICAgICAgICAgICAgICBzdGFydEluZGV4T2ZSYW5nZVBhZ2VzID0gZW5kSW5kZXhPZlJhbmdlUGFnZXMgLSA0O1xyXG4gICAgICAgICAgICAgICAgYXJyYXlQYWdlc1RvU2hvdyA9IGFycmF5UGFnZXMuc2xpY2UoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRJbmRleE9mUmFuZ2VQYWdlcyxcclxuICAgICAgICAgICAgICAgICAgICBlbmRJbmRleE9mUmFuZ2VQYWdlc1xyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHJlbmRlckJ0blJhbmdlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g0KPRgdGC0LDQvdC+0LLQutCwINCw0LrRgtC40LLQvdC+0Lkg0YHRgtGA0LDQvdC40YbRiyDQsiDQsdC70L7QutC1ICdidG4tcmFuZ2UnXHJcbiAgICAgICAgLy8g0KPRgdGC0LDQvdC+0LLQutCwL9GB0L3Rj9GC0LjQtSDQsNGC0YDQuNCx0YPQsCBcImRpc2FibGVkXCJcclxuICAgICAgICAvLyDQntCx0L3QvtCy0LvRj9C10Lwg0LTQsNC90L3Ri9C1INC90LAg0YHRgtGA0LDQvdC40YbQtVxyXG4gICAgICAgIGdvSW5pdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PSAgINCe0LHRgNCw0LHQvtGC0YfQuNC6INC90LDQttCw0YLQuNGPINC60L3QvtC/0LrQuCAgJ2J0bi1wZycgID09PT09PT09PT09PT09PT09XHJcbiAgICBidG5QYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyDQtNC10LvQsNC10Lwg0YjQsNCzINC90LAgNDAg0YHRgtGA0LDQvdC40YYsINC10YHQu9C4INC00L7RgdGC0YPQv9C90L5cclxuICAgICAgICBpZiAoTnVtYmVyKGN1cnJlbnRQYWdlKSArIDQwIDwgYXJyYXlQYWdlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY3VycmVudFBhZ2UgPSBOdW1iZXIoY3VycmVudFBhZ2UpICsgNDA7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYWdlSW5kZXggPSBhcnJheVBhZ2VzLmluZGV4T2YoY3VycmVudFBhZ2UpO1xyXG5cclxuICAgICAgICAgICAgZW5kSW5kZXhPZlJhbmdlUGFnZXMgPSBjdXJyZW50UGFnZUluZGV4ICsgMTtcclxuICAgICAgICAgICAgc3RhcnRJbmRleE9mUmFuZ2VQYWdlcyA9IGVuZEluZGV4T2ZSYW5nZVBhZ2VzIC0gNDtcclxuXHJcbiAgICAgICAgICAgIGlzTGFzdFBhZ2VzUmFuZ2UgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdXJyZW50UGFnZUluZGV4ID0gYXJyYXlQYWdlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICBjdXJyZW50UGFnZSA9IGFycmF5UGFnZXNbYXJyYXlQYWdlcy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgICAgICAgIGVuZEluZGV4T2ZSYW5nZVBhZ2VzID0gY3VycmVudFBhZ2VJbmRleCArIDE7XHJcbiAgICAgICAgICAgIHN0YXJ0SW5kZXhPZlJhbmdlUGFnZXMgPSBlbmRJbmRleE9mUmFuZ2VQYWdlcyAtIDQ7XHJcblxyXG4gICAgICAgICAgICBpc0xhc3RQYWdlc1JhbmdlID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFycmF5UGFnZXNUb1Nob3cgPSBhcnJheVBhZ2VzLnNsaWNlKFxyXG4gICAgICAgICAgICBzdGFydEluZGV4T2ZSYW5nZVBhZ2VzLFxyXG4gICAgICAgICAgICBlbmRJbmRleE9mUmFuZ2VQYWdlc1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJlbmRlckJ0blJhbmdlKCk7XHJcblxyXG4gICAgICAgIC8vINCj0YHRgtCw0L3QvtCy0LrQsCDQsNC60YLQuNCy0L3QvtC5INGB0YLRgNCw0L3QuNGG0Ysg0LIg0LHQu9C+0LrQtSAnYnRuLXJhbmdlJ1xyXG4gICAgICAgIC8vINCj0YHRgtCw0L3QvtCy0LrQsC/RgdC90Y/RgtC40LUg0LDRgtGA0LjQsdGD0LAgXCJkaXNhYmxlZFwiXHJcbiAgICAgICAgLy8g0J7QsdC90L7QstC70Y/QtdC8INC00LDQvdC90YvQtSDQvdCwINGB0YLRgNCw0L3QuNGG0LVcclxuICAgICAgICBnb0luaXQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT0gICDQmNC90LjRhtC40LDQu9C40LfQsNGG0LjRjyAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBmdW5jdGlvbiBsaXN0ZW5CdG5DbGljaygpIHtcclxuICAgICAgICBjb25zdCBidG5SYW5nZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuYnRuLXJhbmdlXCIpO1xyXG5cclxuICAgICAgICBidG5SYW5nZS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XHJcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZSA9IE51bWJlcihlLnRhcmdldC5pbm5lclRleHQpO1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2VJbmRleCA9IGFycmF5UGFnZXMuaW5kZXhPZihOdW1iZXIoY3VycmVudFBhZ2UpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBnb0luaXQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gPT09PT09PT09PSAgINCY0L3QuNGG0LjQsNC70LjQt9Cw0YbQuNGPICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGZ1bmN0aW9uIGdvSW5pdCgpIHtcclxuICAgICAgICAvLyDQo9GB0YLQsNC90L7QstC60LAg0LDQutGC0LjQstC90L7QuSDRgdGC0YDQsNC90LjRhtGLINCyINCx0LvQvtC60LUgJ2J0bi1yYW5nZSdcclxuICAgICAgICBzZXRBY3RpdmVCdXR0b25SYW5nZShjdXJyZW50UGFnZSk7XHJcblxyXG4gICAgICAgIC8vINCj0YHRgtCw0L3QvtCy0LrQsC/RgdC90Y/RgtC40LUg0LDRgtGA0LjQsdGD0LAgXCJkaXNhYmxlZFwiXHJcbiAgICAgICAgY2hlY2tEaXNhYmxlZCgpO1xyXG5cclxuICAgICAgICAvLyDQntCx0L3QvtCy0LvRj9C10Lwg0LTQsNC90L3Ri9C1INC90LAg0YHRgtGA0LDQvdC40YbQtVxyXG4gICAgICAgIHJlbmRlclBhZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyA9PT09PT09PT09ICAg0KPRgdGC0LDQvdC+0LLQutCwINCw0YLRgNC40LHRg9CwIFwiZGlzYWJsZWRcIiAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBmdW5jdGlvbiBjaGVja0Rpc2FibGVkKCkge1xyXG4gICAgICAgIC8vINCV0YHQu9C4INC00L7RgdGC0LjQs9C70Lgg0LvQtdCy0L7QuSDQs9GA0LDQvdC40YbRiywg0LTQtdC70LDQtdC8INC60L3QvtC/0LrRgyBidG5QcmV2IC0gXCJkaXNhYmxlZFwiXHJcbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlSW5kZXggPiAwKSB7XHJcbiAgICAgICAgICAgIGJ0blByZXYucmVtb3ZlQXR0cmlidXRlKFwiZGlzYWJsZWRcIik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50UGFnZUluZGV4ID09IDApIHtcclxuICAgICAgICAgICAgYnRuUHJldi5zZXRBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiLCBcIlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vINCV0YHQu9C4INC00L7RgdGC0LjQs9C70Lgg0L/RgNCw0LLQvtC5INCz0YDQsNC90LjRhtGLLCDQtNC10LvQsNC10Lwg0LrQvdC+0L/QutGDIGJ0bk5leHQgLSBcImRpc2FibGVkXCJcclxuICAgICAgICBpZiAoY3VycmVudFBhZ2VJbmRleCA8IGFycmF5UGFnZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICBidG5OZXh0LnJlbW92ZUF0dHJpYnV0ZShcImRpc2FibGVkXCIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3VycmVudFBhZ2VJbmRleCA9PSBhcnJheVBhZ2VzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgYnRuTmV4dC5zZXRBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiLCBcIlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoZWNrSW5MYXN0UmFuZ2UoKTtcclxuICAgICAgICAvLyDQldGB0LvQuCDQvNC10L3RjNGI0LUgNDAg0YHRgtGA0LDQvdC40YYsINC00LXQu9Cw0LXQvCDQutC90L7Qv9C60YMgYnRuUGFnZSAtIFwiZGlzYWJsZWRcIlxyXG4gICAgICAgIC8vIGxldCBtYXhSYW5nZSA9IGFycmF5UGFnZXMubGVuZ3RoIDwgNDAgfHwgaXNMYXN0UGFnZXNSYW5nZTtcclxuXHJcbiAgICAgICAgaWYgKGFycmF5UGFnZXMubGVuZ3RoIDwgNDAgfHwgaXNMYXN0UGFnZXNSYW5nZSkge1xyXG4gICAgICAgICAgICBidG5QYWdlLnNldEF0dHJpYnV0ZShcImRpc2FibGVkXCIsIFwiXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJ0blBhZ2UucmVtb3ZlQXR0cmlidXRlKFwiZGlzYWJsZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vID09PT09PT09PT0gICDQo9GB0YLQsNC90L7QstC60LAg0LDQutGC0LjQstC90L7QuSDRgdGC0YDQsNC90LjRhtGLINCyINCx0LvQvtC60LUgJ2J0bi1yYW5nZScgICA9PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBzZXRBY3RpdmVCdXR0b25SYW5nZShjdXJyZW50UGFnZSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PSAgINCk0YPQvdC60YbQuNGPINC/0YDQvtCy0LXRgNC60LgsINC/0L7Qv9Cw0LTQsNC10Lwg0LvQuCDQsiDRgdC/0LjRgdC+0Log0L/QvtGB0LvQtdC00L3QuNGFINGB0YLRgNCw0L3QuNGGICAgPT09PT09PT09PT09PT09PVxyXG4gICAgZnVuY3Rpb24gY2hlY2tJbkxhc3RSYW5nZSgpIHtcclxuICAgICAgICBpZiAoYXJyYXlQYWdlc0xhc3QuaW5kZXhPZihOdW1iZXIoY3VycmVudFBhZ2UpKSAhPSAtMSkge1xyXG4gICAgICAgICAgICBpc0xhc3RQYWdlc1JhbmdlID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpc0xhc3RQYWdlc1JhbmdlID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vID09PT09PT09PT0gICDQpNGD0L3QutGG0LjRjyDRg9GB0YLQsNC90L7QstC60Lgg0LDQutGC0LjQstC90L7QuSDRgdGC0YDQsNC90LjRhtGLINCyINCx0LvQvtC60LUgJ2J0bi1yYW5nZScgICA9PT09PT09PT09PT09PT09PVxyXG4gICAgZnVuY3Rpb24gc2V0QWN0aXZlQnV0dG9uUmFuZ2UoY3VycmVudFBhZ2UpIHtcclxuICAgICAgICBjb25zdCBidG5QYWdlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuYnRuLXJhbmdlID4gLmJ0bi1wYWdcIik7XHJcblxyXG4gICAgICAgIGJ0blBhZ2VzLmZvckVhY2goZnVuY3Rpb24oYnRuKSB7XHJcbiAgICAgICAgICAgIC8vINCSINC30LDQstC40YHQuNC80L7RgdGC0Lgg0L7RgiDRgdGC0LDRgtGD0YHQsCDRg9GB0YLQsNC90LDQstC70LjQstCw0LXQvCDQutC70LDRgdGBICdhY3RpdmUnXHJcbiAgICAgICAgICAgIGlmIChidG4uaW5uZXJUZXh0ID09IGN1cnJlbnRQYWdlKSB7XHJcbiAgICAgICAgICAgICAgICBidG4uY2xhc3NMaXN0LmFkZChcImJ0bi1wYWctLWFjdGl2ZVwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJ0bi5jbGFzc0xpc3QucmVtb3ZlKFwiYnRuLXBhZy0tYWN0aXZlXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gPT0g0KTRg9C90LrRhtC40Y8g0YPRgdCw0L3QvtCy0LrQuCDQvdCw0YfQsNC70YzQvdC+0LPQviDQuCDQutC+0L3QtdGH0L3QvtCz0L4g0LjQvdC00LXQutGB0LAg0LLRi9Cy0L7QtNC40LzRi9GFINGN0LvQtdC80LXQvdGC0L7QsiDQtNCw0L3QvdC+0Lkg0YHRgtGA0LDQvdC40YbRiyA9PVxyXG4gICAgZnVuY3Rpb24gZ2V0SW5kZXhSYW5nZShjdXJyZW50UGFnZSkge1xyXG4gICAgICAgIGlmIChjdXJyZW50UGFnZSA9PSAxKSB7XHJcbiAgICAgICAgICAgIHN0YXJ0SW5kZXhPZlJhbmdlID0gMDtcclxuICAgICAgICAgICAgZW5kSW5kZXhPZlJhbmdlID0gbGVuZ3RoUGFnZXMgLSAxO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN0YXJ0SW5kZXhPZlJhbmdlID0gKGN1cnJlbnRQYWdlIC0gMSkgKiBsZW5ndGhQYWdlcztcclxuICAgICAgICAgICAgZW5kSW5kZXhPZlJhbmdlID0gc3RhcnRJbmRleE9mUmFuZ2UgKyBsZW5ndGhQYWdlcyAtIDE7XHJcblxyXG4gICAgICAgICAgICBpZiAoZW5kSW5kZXhPZlJhbmdlID4ganNvbkN1c3RvbWVycy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICBlbmRJbmRleE9mUmFuZ2UgPSBqc29uQ3VzdG9tZXJzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gPT09PT09PT09PSAgINCS0YvQstC+0LQg0LTQuNCw0L/QsNC30L7QvdCwINGB0YLRgNCw0L3QuNGGICAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGZ1bmN0aW9uIHJlbmRlckJ0blJhbmdlKCkge1xyXG4gICAgICAgIGNvbnN0IGJ0blJhbmdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5idG4tcmFuZ2VcIik7XHJcbiAgICAgICAgYnRuUmFuZ2UuaW5uZXJIVE1MID0gXCJcIjtcclxuXHJcbiAgICAgICAgY29uc3QgbWF4UGFnZXMgPSBhcnJheVBhZ2VzVG9TaG93Lmxlbmd0aCA8IDQgPyBhcnJheVBhZ2VzLmxlbmd0aCA6IDQ7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJtYXggcGFnZXM6IFwiICsgbWF4UGFnZXMpO1xyXG4gICAgICAgIGxldCB0ZXh0ID0gXCJcIjtcclxuXHJcbiAgICAgICAgYXJyYXlQYWdlc1RvU2hvdy5mb3JFYWNoKChwYWdlLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIHRleHQgPSBgPGJ1dHRvbiBjbGFzcz1cImJ0bi1wYWdcIj4ke3BhZ2V9PC9idXR0b24+YDtcclxuXHJcbiAgICAgICAgICAgIGJ0blJhbmdlLmlubmVySFRNTCArPSB0ZXh0O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vID09PT09PT09PT0gICDQktGL0LLQvtC0INC/0YDQvtC00YPQutGC0L7QsiDQsiDRhtC40LrQu9C1INC40Lcg0LrQsNGC0LDQu9C+0LPQsCAgID09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBjb25zdCBwcm9kdWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5jdXN0b21lcnNfX3RhYmxlLXdyYXBwZXJcIik7XHJcbiAgICBmdW5jdGlvbiBzaG93SXRlbXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vINCS0YDQtdC80LXQvdC90L4g0YHQutGA0LDQstCw0LXQvCDQsdC70L7Quiwg0LTQu9GPINCw0L3QuNC80LDRhtC40Lgg0L/QvtGP0LLQu9C10L3QuNGPXHJcbiAgICAgICAgICAgIC8vIHByb2R1Y3QuY2xhc3NMaXN0LmFkZCgnbm9uZScpO1xyXG5cclxuICAgICAgICAgICAgcHJvZHVjdC5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgICAgICAgICBsZXQgdGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgIGxldCB0ZXh0VG9TaG93ID0gXCJcIjtcclxuICAgICAgICAgICAgbGV0IGNsYXNzSGlkZSA9IFwiXCI7XHJcblxyXG4gICAgICAgICAgICBjdXN0b21lcnNUb1Nob3cuZm9yRWFjaChmdW5jdGlvbihpdGVtLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICUgMiA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NIaWRlID0gXCJoaWRlLXRvLXJpZ2h0XCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzSGlkZSA9IFwiaGlkZS10by1sZWZ0XCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGV4dCA9IGBcclxuICAgICAgICAgICAgICAgIDx1bCBjbGFzcz1cIml0ZW1zICR7Y2xhc3NIaWRlfVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cIml0ZW0tbmFtZVwiPiR7aXRlbS5uYW1lfTwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwiaXRlbS1jb21wYW55XCI+JHtpdGVtLmNvbXBhbnl9PC9saT4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwiaXRlbS1waG9uZVwiPiR7aXRlbS5waG9uZX08L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cIml0ZW0tZW1haWxcIj4ke2l0ZW0uZW1haWx9PC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJpdGVtLWNvdW50cnlcIj4ke2l0ZW0uY291bnRyeX08L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzcz1cIml0ZW0tc3RhdHVzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJzdGF0dXMtYnRuXCI+JHtpdGVtLnN0YXR1c308L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxyXG4gICAgICAgICAgICAgICAgPC91bD5cclxuICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgICAgIHRleHRUb1Nob3cgKz0gdGV4dDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlyc3RSdW4pIHtcclxuICAgICAgICAgICAgICAgIHByb2R1Y3Quc3R5bGUub3BhY2l0eSA9IDE7XHJcbiAgICAgICAgICAgICAgICBwcm9kdWN0LmlubmVySFRNTCA9IHRleHRUb1Nob3c7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwcm9kdWN0LmlubmVySFRNTCA9IHRleHRUb1Nob3c7XHJcbiAgICAgICAgICAgICAgICAvLyDQo9GB0YLQsNC90LDQstC70LjQstCw0LXQvCDQvdCw0YfQsNC70YzQvdGL0LUg0LfQvdCw0YfQtdC90LjRjyDQt9CwINC/0YDQtdC00LXQu9Cw0LzQuCDRgtCw0LHQu9C40YbRiyDQuCBvcGFjaXR5OiAwXHJcbiAgICAgICAgICAgICAgICAvLyAgc2V0T3V0T2ZSYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PSAg0JDRgdC40L3RhdGA0L7QvdC90LDRjyDRhNGD0L3QutGG0LjRjyDQv9Cw0YPQt9GLICA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGZ1bmN0aW9uIHNsZWVwKG1zKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gcGF1c2UoKSB7XHJcbiAgICAgICAgLy8g0JDQvdC40LzQsNGG0LjRjyDQuNGB0YfQtdC30LDQvdC40Y8g0YHRgtGA0L7QulxyXG4gICAgICAgIGF3YWl0IGFuaW1hdGVPdXQoKTtcclxuICAgICAgICAvLyAgY29uc29sZS5sb2coXCJhZnRlciBBbmltYXRlIE91dFwiKTtcclxuICAgICAgICAvLyAgY29uc29sZS5sb2coXCJUYWtpbmcgYSBicmVhay4uLlwiKTtcclxuICAgICAgICBhd2FpdCBzbGVlcCgxMDAwKTtcclxuICAgICAgICAvLyAgY29uc29sZS5sb2coXCJPbmUgc2Vjb25kIGxhdGVyXCIpO1xyXG4gICAgICAgIGF3YWl0IHNob3dJdGVtcygpO1xyXG4gICAgICAgIC8vICBjb25zb2xlLmxvZyhcImFmdGVyIFNob3cgSXRlbXNcIik7XHJcbiAgICAgICAgLy8gIGNvbnNvbGUubG9nKFwiVGFraW5nIGEgYnJlYWsgMC4zLi4uXCIpO1xyXG4gICAgICAgIGF3YWl0IHNsZWVwKDEwMCk7XHJcbiAgICAgICAgLy8gIGNvbnNvbGUubG9nKFwibGF0ZXIgMlwiKTtcclxuICAgICAgICBhd2FpdCBhbmltYXRlSW4oKTtcclxuICAgICAgICAvLyAgY29uc29sZS5sb2coXCJhZnRlciBBbmltYXRlIEluXCIpO1xyXG4gICAgICAgIGF3YWl0IGJ0blN0YXR1cygpO1xyXG4gICAgICAgIC8vICBjb25zb2xlLmxvZyhcImFmdGVyIGJ0blN0YXR1c1wiKTtcclxuICAgICAgICBhd2FpdCBzbGVlcCgyNTAwKTtcclxuICAgICAgICBhd2FpdCBzZXRTY3JvbGxBdXRvKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8g0KTRg9C90LrRhtC40Y8g0YDQtdC90LTQtdGA0LjQvdCz0LAv0LjQvdC40YbQuNCw0LvQuNC30LDRhtC40Lgg0YHRgtGA0LDQvdC40YbRi1xyXG4gICAgZnVuY3Rpb24gcmVuZGVyUGFnZSgpIHtcclxuICAgICAgICAvLyDQntC/0YDQtdC00LXQu9GP0LXQvCDQvdCw0YfQsNC70YzQvdGL0Lkg0Lgg0LrQvtC90LXRh9C90YvQuSDQuNC90LTQtdC60YEg0Y3Qu9C10LzQtdC90YLQvtCyINC00LDQvdC90L7QuSDRgdGC0YDQsNC90LjRhtGLXHJcbiAgICAgICAgZ2V0SW5kZXhSYW5nZShjdXJyZW50UGFnZSk7XHJcblxyXG4gICAgICAgIC8vINCS0YvQsdC+0YDQutCwINGN0LvQtdC80LXQvdGC0L7QsiDRgtC10LrRg9GJ0LXQuSDRgdGC0YDQsNC90LjRhtGLINC00LvRjyDRgNC10L3QtNC10YDQuNC90LPQsFxyXG4gICAgICAgIGN1c3RvbWVyc1RvU2hvdyA9IGpzb25DdXN0b21lcnMuc2xpY2UoXHJcbiAgICAgICAgICAgIHN0YXJ0SW5kZXhPZlJhbmdlLFxyXG4gICAgICAgICAgICBlbmRJbmRleE9mUmFuZ2UgKyAxXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8g0K3Qu9C10LzQtdC90YLRiyDRgdGC0LDRgtC40YHRgtC40LrQuDogXCLQv9C+0LrQsNC30LDQvdC+IDEg0LTQviA4INGN0Lst0YLQvtCyINC40LcgXCJcclxuICAgICAgICBzdGFydEl0ZW0udGV4dENvbnRlbnQgPSBzdGFydEluZGV4T2ZSYW5nZSArIDE7XHJcbiAgICAgICAgZW5kSXRlbS50ZXh0Q29udGVudCA9IGVuZEluZGV4T2ZSYW5nZSArIDE7XHJcbiAgICAgICAgdG90YWxJdGVtcy50ZXh0Q29udGVudCA9IGpzb25DdXN0b21lcnMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoZmlyc3RSdW4pIHtcclxuICAgICAgICAgICAgLy8g0JLRi9Cy0L7QtNC40Lwg0LTQsNC90L3Ri9C1XHJcbiAgICAgICAgICAgIHNob3dJdGVtcygpO1xyXG4gICAgICAgICAgICBidG5TdGF0dXMoKTtcclxuXHJcbiAgICAgICAgICAgIGZpcnN0UnVuID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gINCj0LHQuNGA0LDQtdC8INGB0LrRgNC+0LvQuyDQvdCwINCy0YDQtdC80Y8g0LDQvdC40LzQsNGG0LjQuFxyXG4gICAgICAgICAgICBjb25zdCBjdXN0VGFibGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmN1c3RvbWVyc19fdGFibGVcIik7XHJcbiAgICAgICAgICAgIGN1c3RUYWJsZS5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XHJcbiAgICAgICAgICAgIC8vINCQ0L3QuNC80LDRhtC40Y8g0LjRgdGH0LXQt9Cw0L3QuNGPL9C/0L7Rj9Cy0LvQtdC90LjRjyDRgdGC0YDQvtC6XHJcbiAgICAgICAgICAgIHBhdXNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vINCS0L7RgdGB0YLQsNC90LDQstC70LjQstCw0LXQvCDRgdC60YDQvtC70Lsg0LIg0LrQvtC90YbQtSDQsNC90LjQvNCw0YbQuNC4XHJcbiAgICBmdW5jdGlvbiBzZXRTY3JvbGxBdXRvKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1c3RUYWJsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuY3VzdG9tZXJzX190YWJsZVwiKTtcclxuICAgICAgICAgICAgY3VzdFRhYmxlLnN0eWxlLm92ZXJmbG93ID0gXCJhdXRvXCI7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjdXN0b21lcnM7IiwiZnVuY3Rpb24gbWVudUFjdGl2ZSgpIHtcclxuICAgIGNvbnN0IGl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5uYXZfX2l0ZW1cIik7XHJcbiAgICBjb25zdCBjdXN0b21lcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmN1c3RvbWVyc1wiKTtcclxuXHJcbiAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHJcbiAgICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaXRlbTogXCIpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhpdGVtKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLVwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vINCj0LHQuNGA0LDQtdC8INGB0YLQsNGC0YPRgSAnYWN0aXZlJyDRgyDQstGB0LXRhSDRjdC70LXQvNC10L3QvtCyINC80LXQvdGOXHJcbiAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0uY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XHJcblxyXG4gICAgICAgICAgICBpZiAoaXRlbS5jbGFzc0xpc3QuY29udGFpbnMoXCJuYXZfX2l0ZW0tY3VzdG9tZXJzXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjdXN0b21lcnMuY2xhc3NMaXN0LmFkZCgnY3VzdG9tZXJzLS1hY3RpdmUnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGN1c3RvbWVycy5jbGFzc0xpc3QucmVtb3ZlKFwiY3VzdG9tZXJzLS1hY3RpdmVcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBtZW51QWN0aXZlOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBkZWZpbml0aW9uKSB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iaiwgcHJvcCkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7IH0iLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBtZW51QWN0aXZlIGZyb20gXCIuL21vZHVsZXMvbWVudS1hY3RpdmUuanNcIjtcbm1lbnVBY3RpdmUoKTtcblxuaW1wb3J0IGN1c3RvbWVycyBmcm9tIFwiLi9tb2R1bGVzL2N1c3RvbWVycy5qc1wiO1xuY3VzdG9tZXJzKCk7XG5cblxuLy8g0JzQvtCx0LjQu9GM0L3QsNGPINC90LDQstC40LPQsNGG0LjRj1xuY29uc3QgbmF2QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5tb2JpbGUtbmF2LWJ0blwiKTtcbmNvbnN0IG5hdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIubW9iaWxlLW5hdlwiKTtcbmNvbnN0IG1lbnVJY29uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5uYXYtaWNvblwiKTtcblxuY29uc3QgZmFkZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIubW9iaWxlLW5hdi1mYWRlXCIpO1xuXG5uYXZCdG4ub25jbGljayA9IHRvZ2dsZU1vYmlsZTtcbmZhZGUub25jbGljayA9IHRvZ2dsZU1vYmlsZTtcblxuZnVuY3Rpb24gdG9nZ2xlTW9iaWxlKCkge1xuICAgIG5hdi5jbGFzc0xpc3QudG9nZ2xlKFwibW9iaWxlLW5hdi0tb3BlblwiKTtcbiAgICBtZW51SWNvbi5jbGFzc0xpc3QudG9nZ2xlKFwibmF2LWljb24tLWFjdGl2ZVwiKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJuby1zY3JvbGxcIik7XG4gICAgZmFkZS5jbGFzc0xpc3QudG9nZ2xlKFwibW9iaWxlLW5hdi1mYWRlLS1vcGVuXCIpO1xufVxuXG4vLyDQnNC+0LHQuNC70YzQvdCw0Y8g0L3QsNCy0LjQs9Cw0YbQuNGPXG4vLyBpbXBvcnQgbW9iaWxlTmF2IGZyb20gJy4vbW9kdWxlcy9tb2JpbGUtbmF2LmpzJztcbi8vIG1vYmlsZU5hdigpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9