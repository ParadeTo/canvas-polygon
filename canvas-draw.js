/**
 * Created by ayou on 2017/3/20.
 */

function CanvasDraw(config) {
  this.config = {
    id: config.id,
    bgImg: config.bgImg,
    height: config.height,
    width: config.width,
    pointColor: config.pointColor || '#3c8dbc',
    pointSize: config.pointSize || 3,
    lineColor: config.lineColor || '#80b5b3',
    lineSize: config.lineSize || 1,
    textColor: config.textColor || '#333',
    polygonFillColor: config.polygonFillColor || 'rgba(90,214,244,0.8)',
    polygonPointlColor: config.polygonPointlColor || '#00c0ef',
    polygonPointlSize: config.polygonPointlSize || 2,
    polygonLineColor: config.polygonLineColor || '#5ad6f4',
    polygonLineSize: config.polygonLineSize || 1,
    polygonActiveFillColor: config.polygonFillColor || 'rgba(97,255,105,0.8)',
    polygonActiveLineColor: config.polygonFillColor || '#61ff69',
  }
  this.cxt = null;
  this.canvas = null;

  // 图像在canvas中的边界
  this.bound = {
    w: 0,
    h: 0,
    lt: {
      x: 0,
      y: 0
    },
    rb: {
      x: 0,
      y: 0
    }
  }

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
  this._polygons = config.polygons || [];
}

CanvasDraw.prototype.init = function () {
  var canvasDiv = document.getElementById(this.config.id);

  this.canvas = document.createElement("canvas");
  this.cxt = this.canvas.getContext("2d");
  this.canvas.width = this.config.width;
  this.canvas.height = this.config.height;

  canvasDiv.appendChild(this.canvas);

  this.getDrawBgConf();
  this.initEventListener();

  // 禁止浏览器右键
  this.addHandler(document.body, 'contextmenu', function(e) {
    e.returnValue = false;
  })
}

CanvasDraw.prototype.initPolygons = function () {
  // 坐标转换，画图
  var len = this._polygons.length;
  for (var i = 0; i < len; i++) {
    var pointNum = this._polygons[i].points.length;
    for (var j = 0; j < pointNum; j++) {
      this._polygons[i].points[j].x = this.bound.lt.x + (this._polygons[i].points[j].x * this.bound.w);
      this._polygons[i].points[j].y = this.bound.lt.y + (this._polygons[i].points[j].y * this.bound.h);
    }
    var params = [this._polygons[i].points, this._polygons[i].text];
    if (this._polygons[i].active) {
      params.push(this.config.polygonActiveLineColor);
      params.push(this.config.polygonActiveFillColor);
    }
    this.drawPolygon.apply(this, params);
  }
}

CanvasDraw.prototype.getDrawBgConf = function () {
  var me = this;
  var image = new Image();
  image.src = this.config.bgImg;
  image.onload = function () {
    me.imgLoaded = true;
    me.img = image;
    me.imgW = image.width;
    me.imgH = image.height;

    var wScale = image.width / me.canvas.width;
    var hScale = image.height / me.canvas.height;
    var _scale = wScale < hScale ? hScale : wScale;

    var _width = image.width / _scale;
    var _height = image.height / _scale;

    var dx = 0, dy = 0;
    if (wScale < hScale) {
      dx = parseInt((me.canvas.width - _width) / 2);
    } else {
      dy = parseInt((me.canvas.height - _height) / 2);
    }

    me.bound.lt.x = dx;
    me.bound.lt.y = dy;
    me.bound.w = _width;
    me.bound.h = _height;
    me.bound.rb.x = dx + _width;
    me.bound.rb.y = dy + _height;

    me.cxt.drawImage(image, dx, dy, _width, _height);
    me.initPolygons();
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
  cxt.font = 'normal 14px Microsoft YaHei';
  cxt.textAlign = 'center';
  cxt.fillText(text, cx, cy);
}

CanvasDraw.prototype.reDraw = function() {
  var me = this;
  // 清空画布
  me.cxt.clearRect(0, 0, me.canvas.width, me.canvas.height);
  // 画背景
  me.cxt.drawImage(me.img, me.bound.lt.x, me.bound.lt.y, me.bound.w, me.bound.h);
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
  if (me.bound.lt.x < x &&
      me.bound.rb.x > x &&
      me.bound.lt.y < y &&
      me.bound.rb.y > y) {
    return true;
  }
  return false;
}

CanvasDraw.prototype.initEventListener = function() {
  var me = this;
  me.addHandler(me.canvas, 'mousedown', function(e) {
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
    }

  });

  me.addHandler(me.canvas, 'mousemove', function(e) {
    me.reDraw();

    if (me.points.length === 0) {
      return;
    }

    var x = e.offsetX;
    var y = e.offsetY;

    var lastX = me.points[me.points.length - 1].x;
    var lastY = me.points[me.points.length - 1].y;

    me.drawLine(lastX, lastY, x, y);
  });

  me.addHandler(window, 'keyup', function(e) {
    if (e.keyCode === 27) {
      me.points.pop();
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

CanvasDraw.prototype.getPolygonsData = function () {
  var _polygons = [];
  var len = this.polygons.length;
  console.log(this.bound);
  for (var i = 0; i < len; i++) {
    var pN = this.polygons[i].length;
    _polygons[i] = [];
    for (var j = 0; j < pN; j++) {
      console.log(this.polygons[i][j]);
      _polygons[i].push({
        x: (this.polygons[i][j].x - this.bound.lt.x) / this.bound.w,
        y: (this.polygons[i][j].y - this.bound.lt.y) / this.bound.h
      });
    }
  }
  return _polygons;
}

CanvasDraw.prototype.clean = function() {
  this.polygons = [];
  this.reDraw();
}
