/**
 * Created by ayou on 2017/3/20.
 * Draw polygons based on canvas.
 */

function CanvasDraw(config) {
  this.config = {
    id: config.id,
    canDraw: config.canDraw || false,
    max: config.max || Infinity, // 允许的多边形个数
    bgImg: config.bgImg,
    height: config.height,
    width: config.width,
    pointColor: config.pointColor || '#3c8dbc',
    pointSize: config.pointSize || 3,
    lineColor: config.lineColor || '#80b5b3',
    lineSize: config.lineSize || 1,
    textColor: config.textColor || '#333',
    polygonFillColor: config.polygonFillColor || 'rgba(255,255,255,0.4)',
    polygonPointlColor: config.polygonPointlColor || '#00c0ef',
    polygonPointlSize: config.polygonPointlSize || 2,
    polygonLineColor: config.polygonLineColor || '#eee',
    polygonLineSize: config.polygonLineSize || 1,
    polygonActiveFillColor: config.polygonFillColor || 'rgba(149,255,255,0.4)',
    polygonActiveLineColor: config.polygonFillColor || '#95FFFF',
    afterRightClick: config.afterRightClick
  }
  this.cxt = null;
  this.bgCxt = null;
  this.bgCanvas = null;
  this.canvas = null;
  this.wrapper = null;

  // 变化前的长和宽
  this.lastWidth = 0;
  this.lastHeight = 0;

  // 图像
  this.img = null;
  this.imgLoaded = false;
  this.imgW = 0;
  this.imgH = 0;

  // 未闭合的多边形的点
  this.points = [];

  // 此次绘画所画多边形
  this.polygons = [];

  // 画布初始时的多边形，不能更改
  this._polygons = [];
  if (config.polygons) {
    this._polygons = this.clonePolygons(config.polygons);
  }
}

// 克隆传递进来的多边形数据，防止修改到外面传递进来的数据
CanvasDraw.prototype.clonePolygons = function (polygons) {
  var len = polygons.length;
  var tmpPoints = [];
  var tmpPolygons = [];
  for (var i = 0; i < len; i++) {
    var pointNum = polygons[i].points.length;
    tmpPoints = [];
    for (var j = 0; j < pointNum; j++) {
      var tmpPoint = {};
      tmpPoint.x = polygons[i].points[j].x;
      tmpPoint.y = polygons[i].points[j].y;
      tmpPoints.push(tmpPoint);
    }
    tmpPolygons.push({text:polygons[i].text, active: polygons[i].active, points: tmpPoints});
  }
  return tmpPolygons;
}

CanvasDraw.prototype.createLayer = function(x, y, w, h, zIndex) {
  var canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.style.position = "absolute";
  canvas.style.top = y + 'px';
  canvas.style.left = x + 'px';
  canvas.style.zIndex = zIndex;
  return canvas;
}

CanvasDraw.prototype.resizeCanvas = function(canvas, x, y, w, h) {
  canvas.width = w;
  canvas.height = h;
  canvas.style.top = y + 'px';
  canvas.style.left = x + 'px';
}

CanvasDraw.prototype.resizeDraw = function() {
  function _resizePoint(point) {
    point.x *= (this.canvas.width / this.lastWidth);
    point.y *= (this.canvas.height / this.lastHeight);
  }

  var pointsNum = this.points.length;
  for (var i = 0; i < pointsNum; i++) {
    _resizePoint(this.polygons[i]);
  }

  var polygonsNum = this.polygons.length;
  for (var i = 0; i < polygonsNum; i++) {
    var pNum = this.polygons[i].length;
    for (var j = 0; j < pNum; j++) {
      _resizePoint(this.polygons[i][j]);
    }
  }

  var polygonsNum = this._polygons.length;
  for (var i = 0; i < polygonsNum; i++) {
    var pNum = this._polygons[i].length;
    for (var j = 0; j < pNum; j++) {
      _resizePoint(this._polygons[i][j]);
    }
  }
}

CanvasDraw.prototype.init = function (cb) {
  if (!this.wrapper) {
    var _wrapper = document.getElementById(this.config.id);
    _wrapper.style.position = 'relative';
    this.wrapper = _wrapper;
  }

  this.getDrawBgConf(cb);

  // 禁止浏览器右键
  this.addHandler(document.body, 'contextmenu', function(e) {
    e.returnValue = false;
  })
}

CanvasDraw.prototype.coordinateTransform = function (point) {
  var me = this;
  return {
    x: (parseFloat(point.x) * me.canvas.width),
    y: (parseFloat(point.y) * me.canvas.height)
  }
}

CanvasDraw.prototype.addPolygons = function(polygons) {
  var len = polygons.length;
  var tmpPoints = [];
  var tmpPolygons = [];
  for (var i = 0; i < len; i++) {
    var pointNum = polygons[i].points.length;
    tmpPoints = [];
    for (var j = 0; j < pointNum; j++) {
      var tmpPoint = {};
      tmpPoint.x = polygons[i].points[j].x;
      tmpPoint.y = polygons[i].points[j].y;
      var _p = this.coordinateTransform(tmpPoint);
      tmpPoints.push({
        x: _p.x,
        y: _p.y
      })
    }
    tmpPolygons.push({text:polygons[i].text, points: tmpPoints});
  }

  this._polygons = this._polygons.concat(tmpPolygons);
  this.reDraw();
}

CanvasDraw.prototype.initPolygons = function (polygons) {
  // 坐标转换，画图
  var len = polygons || this._polygons.length;
  for (var i = 0; i < len; i++) {
    var pointNum = this._polygons[i].points.length;
    for (var j = 0; j < pointNum; j++) {
      var _p = this.coordinateTransform(this._polygons[i].points[j]);
      this._polygons[i].points[j].x = _p.x;
      this._polygons[i].points[j].y = _p.y;
    }
    var params = [this._polygons[i].points, this._polygons[i].text];
    if (this._polygons[i].active) {
      params.push(this.config.polygonActiveLineColor);
      params.push(this.config.polygonActiveFillColor);
    }
    this.drawPolygon.apply(this, params);
  }
}

CanvasDraw.prototype.getDrawBgConf = function (cb) {
  var me = this;
  var image = new Image();
  image.src = this.config.bgImg;
  image.onload = function () {
    me.imgLoaded = true;
    me.img = image;
    me.imgW = image.width;
    me.imgH = image.height;

    var wScale = image.width / me.config.width;
    var hScale = image.height / me.config.height;
    var _scale = wScale < hScale ? hScale : wScale;

    var _width = image.width / _scale;
    var _height = image.height / _scale;

    var dx = 0, dy = 0;
    if (wScale < hScale) {
      dx = parseInt((me.config.width - _width) / 2);
    } else {
      dy = parseInt((me.config.height - _height) / 2);
    }

    if (!me.canvas) {
      me.canvas = me.createLayer(dx, dy, _width, _height, 99);
      me.bgCanvas = me.createLayer(dx, dy, _width, _height, 1);

      me.bgCxt = me.bgCanvas.getContext("2d");
      me.cxt = me.canvas.getContext("2d");

      me.wrapper.appendChild(me.canvas);
      me.wrapper.appendChild(me.bgCanvas);

      if (me.config.canDraw) {
        me.initEventListener();
      }

      me.bgCxt.drawImage(image, 0, 0, _width, _height);
      me.initPolygons();
    } else {
      me.resizeCanvas(me.canvas, dx, dy, _width, _height);
      me.resizeCanvas(me.bgCanvas, dx, dy, _width, _height);
    }

    if (typeof cb === 'function') {
      cb();
    }

    me.lastWidth = _width;
    me.lastHeight = _height;
  }
}

CanvasDraw.prototype.drawPoint = function (x, y, color, size) {
  var cxt = this.cxt;
  cxt.beginPath();
  cxt.fillStyle = color || this.config.pointColor;
  cxt.arc(x, y, size || this.config.pointSize, 0, 2*Math.PI);
  cxt.fill();
}

CanvasDraw.prototype.drawLine = function (x1, y1, x2, y2, color, size) {
  var cxt = this.cxt;
  cxt.beginPath();
  cxt.strokeStyle = color || this.config.lineColor;
  cxt.lineWidth = size || this.config.lineSize;
  cxt.moveTo(x1, y1);
  cxt.lineTo(x2, y2);
  cxt.stroke();
}

CanvasDraw.prototype.drawPolygon = function (points, text, lineColor, fillColor) {
  var len = points.length;
  if (len < 3) {
    console.log('点不够呀！');
    return;
  }

  var cxt = this.cxt;
  // for (var i = 0; i < len; i++) {
  //   // 点
  //   this.drawPoint(points[i].x, points[i].y);
  // }
  cxt.beginPath();
  cxt.strokeStyle = lineColor || this.config.polygonLineColor;
  cxt.fillStyle = fillColor || this.config.polygonFillColor;

  for (var i = 0; i < len; i++) {
    // 画线
    if (i === 0) {
      cxt.moveTo(points[i].x, points[i].y);
    } else {
      cxt.lineTo(points[i].x, points[i].y);
      cxt.stroke();
    }
  }
  cxt.lineTo(points[0].x, points[0].y);
  cxt.stroke();
  cxt.closePath();
  cxt.fill();

  // 文字
  if (!text) return;
  var cx = 0, cy = 0;
  for (var i = 0; i < len; i++) {
    cx += points[i].x;
    cy += points[i].y;
  }
  cx /= len;
  cy /= len;

  cxt.fillStyle = this.config.textColor;
  cxt.font = 'normal 12px Microsoft YaHei';
  cxt.textAlign = 'center';
  cxt.fillText(text, cx, cy);
}

CanvasDraw.prototype.reDraw = function(isReDrawBgImg) {
  var me = this;
  // 清空画布
  me.cxt.clearRect(0, 0, me.canvas.width, me.canvas.height);

  // 画背景
  if (isReDrawBgImg) {
    me.bgCxt.clearRect(0, 0, me.canvas.width, me.canvas.height);
    me.bgCxt.drawImage(me.img, 0, 0, me.canvas.width, me.canvas.height);
  }

  // 画点及线
  var pLen = me.points.length;
  if (pLen > 0) {
    for (var i = 0; i < me.points.length - 1; i++) {
      // 点
      me.drawPoint(me.points[i].x, me.points[i].y);
      // 线
      me.drawLine(me.points[i].x, me.points[i].y, me.points[i+1].x, me.points[i+1].y);
    }
    // 最后那个点
    me.drawPoint(me.points[pLen-1].x, me.points[pLen-1].y);
  }
  // 画多边形
  for (var i = 0; i < me._polygons.length; i++) {
    var params = [me._polygons[i].points, me._polygons[i].text];
    if (me._polygons[i].active) {
      params.push(me.config.polygonActiveLineColor);
      params.push(me.config.polygonActiveFillColor);
    }
    me.drawPolygon.apply(this, params);
  }

  for (var i = 0; i < me.polygons.length; i++) {
    me.drawPolygon(me.polygons[i]);
  }
}

CanvasDraw.prototype.isIn = function (x, y) {
  var me = this;
  if (0 < x &&
    me.canvas.width > x &&
    0 < y &&
    me.canvas.height > y) {
    return true;
  }
  return false;
}

CanvasDraw.prototype.initEventListener = function() {
  var me = this;
  me.addHandler(me.canvas, 'mousedown', function(e) {
    if (me.polygons.length === me.config.max) return;

    // 鼠标左键
    if (e.button === 0) {
      var x = e.offsetX;
      var y = e.offsetY;

      if (!me.isIn(x, y)) return;

      me.points.push({x: x, y: y});

      me.drawPoint(x, y);
    }

    // 鼠标右键
    if (e.button === 2) {
      if (me.points.length < 3) {
        return ;
      }
      me.polygons.push(me.points);
      me.points = [];
      me.reDraw();

      if (me.config.afterRightClick) {
        me.config.afterRightClick(me.getPolygonsData());
      }
    }

  });

  me.addHandler(me.canvas, 'mousemove', function(e) {
    if (me.polygons.length === me.config.max) return;

    if (me.points.length === 0) {
      return;
    }

    var x = e.offsetX;
    var y = e.offsetY;

    var lastX = me.points[me.points.length - 1].x;
    var lastY = me.points[me.points.length - 1].y;

    me.reDraw();
    me.drawLine(lastX, lastY, x, y);
  });

  me.addHandler(window, 'keyup', function(e) {
    if (e.keyCode === 27) {
      me.points.pop();
      me.reDraw();
    }
  })
}

CanvasDraw.prototype.addHandler = function (ele, type, handler) {
  if(ele.addEventListener){
    ele.addEventListener(type,handler,false);
  } else if (ele.attachEvent) {
    ele.attachEvent('on'+type,handler);
  } else {
    ele['on'+type] = handler;
  }
}

// 得到相对于画板归一化的坐标
CanvasDraw.prototype.getPolygonsData = function () {
  var _polygons = [];
  var len = this.polygons.length;
  for (var i = 0; i < len; i++) {
    var pN = this.polygons[i].length;
    _polygons[i] = [];
    for (var j = 0; j < pN; j++) {
      _polygons[i].push({
        x: this.polygons[i][j].x / this.canvas.width,
        y: this.polygons[i][j].y / this.canvas.height
      });
    }
  }
  return _polygons;
}

// 重置本次绘画
CanvasDraw.prototype.reset = function() {
  this.polygons = [];
  this.reDraw();
}

// 清空所有多边形
CanvasDraw.prototype.clean = function() {
  this.polygons = [];
  this._polygons = [];
  this.reDraw();
}

CanvasDraw.prototype.delete = function(cb) {
  if (!this.canvas) return;
  var _parentElement = this.canvas.parentNode;
  if(_parentElement){
    _parentElement.removeChild(this.canvas);
    _parentElement.removeChild(this.bgCanvas);
    cb();
  }
}

CanvasDraw.prototype.resize = function(width, height) {
  var me = this;

  me.config.width = width;
  me.config.height = height;

  me.init(function () {
    me.resizeDraw();
    me.reDraw(true);
  });
}
