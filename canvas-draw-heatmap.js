/**
 * 热力图绘图类，继承自CanvasDraw
 * Created by ayou on 2017/3/22.
 */

function object(o) {
  function F(){};
  F.prototype = o;
  return new F();
}

function inheritPrototype(subType, superType) {
  var prototype = object(superType.prototype);
  prototype.constructor = subType;
  subType.prototype = prototype;
}

function CanvasDrawHeatMap(config) {
  CanvasDraw.call(this, config);
  this.config.heatMapData = config.heatMapData;
  this.config.heatMapConf = config.heatMapConf || {};

  this.heatmapInstance = null;
  this.heatMapWrapper = null;
}

inheritPrototype(CanvasDrawHeatMap, CanvasDraw);

CanvasDrawHeatMap.prototype.changeOpacity = function(opacity) {
  this.heatmapInstance.configure({
    opacity: opacity
  });
}

CanvasDrawHeatMap.prototype.changeRange = function (min, max) {
  this.heatmapInstance.setDataMin(min);
  this.heatmapInstance.setDataMax(max);
  // this.heatmapInstance.repaint();
}

CanvasDrawHeatMap.prototype.heatMapInit = function(cb) {
  var me = this;
  this.init(function() {

    var obj = document.createElement("div");
    obj.style.position = 'absolute';
    obj.style.width = me.canvas.width + 'px';
    obj.style.height = me.canvas.height + 'px';
    obj.style.top = me.lt.y + 'px';
    obj.style.left = me.lt.x + 'px';
    obj.style.zIndex = 98;
    var objHeatWrapper = document.createElement("div");
    objHeatWrapper.style.width = '100%';
    objHeatWrapper.style.height = '100%';
    me.heatMapWrapper = objHeatWrapper;

    obj.appendChild(objHeatWrapper);
    me.wrapper.appendChild(obj);

    cb(me.imgW, me.imgH, me.canvas.width, me.canvas.height);
  });
}

CanvasDrawHeatMap.prototype.drawHeatMap = function (data) {
  var me = this;

  me.config.heatMapConf.container = me.heatMapWrapper;
  me.heatmapInstance = h337.create(me.config.heatMapConf);
  me.heatmapInstance.setData(data);
}
