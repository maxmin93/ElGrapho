const UUID = require('./UUID');
const WebGL = require('./WebGL');
const Profiler = require('./Profiler');
const ElGraphoCollection = require('./ElGraphoCollection');
const Controls = require('./components/Controls/Controls');
const Count = require('./components/Count/Count');
const Events = require('./Events');
const Concrete = require('concretejs');
const _ = require('lodash');
const Color = require('./Color');
const Theme = require('./Theme');
const Tooltip = require('./components/Tooltip/Tooltip');
const NumberFormatter = require('./formatters/NumberFormatter');
const VertexBridge = require('./VertexBridge');
const Enums = require('./Enums');
const BoxZoom = require('./components/BoxZoom/BoxZoom');
const Dom = require('./Dom');
const Loading = require('./components/Loading/Loading');
const Labels = require('./Labels');

const Tree = require('./layouts/Tree');
const Cluster = require('./layouts/Cluster');
const Chord = require('./layouts/Chord');
const ForceDirected = require('./layouts/ForceDirected');
const Hairball = require('./layouts/Hairball');
const RadialTree = require('./layouts/RadialTree');

const ZOOM_FACTOR = 2;
const START_SCALE = 1;

let ElGrapho = function(config) {
  let that = this;

  // if promise
  if (config.model.then !== undefined) {
    config.model.then(function(model) {
      config.model = model;
      that.init(config);
    }); 
  }
  // if regular old object
  else {
    this.init(config);
  }
};

ElGrapho.prototype = {
  init: function(config) {
    this.container = config.container || document.createElement('div');
    this.id = UUID.generate();
    this.dirty = true;
    this.hitDirty = true;
    this.hoverDirty = false;
    this.zoomX = START_SCALE;
    this.zoomY = START_SCALE;
    this.panX = 0;
    this.panY = 0;
    this.events = new Events();
    this.model = config.model;



    this.fitToViewport(false);

    this.width = config.width || 500;
    this.height = config.height || 500;
    this.steps = config.model.steps;
    this.nodeSize = config.nodeSize || 1; // 0 - 1
    this.edgeSize = config.edgeSize || 0.25; // 0 - 1
    this.focusedGroup = -1;
    this.tooltips = config.tooltips === undefined ? true : config.tooltips;
    this.fillContainer = config.fillContainer === undefined ? false : config.fillContainer;
    this.glowBlend = config.glowBlend === undefined ? 0 : config.glowBlend;
    this.nodeOutline = config.nodeOutline === undefined ? true : config.nodeOutline;
    this.animations = [];
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'el-grapho-wrapper';
    this.wrapper.style.width = this.width + 'px';
    this.wrapper.style.height = this.height + 'px';
    // clear container
    this.container.innerHTML = '';
    this.container.appendChild(this.wrapper);
    this.animations = config.animations === undefined ? true : config.animations;
    this.setInteractionMode(Enums.interactionMode.SELECT);
    this.setDarkMode(config.darkMode === undefined ? false : config.darkMode);
    this.panStart = null;
    this.idle = true;
    this.debug = config.debug === undefined ? false : config.debug;
    
    this.showArrows = config.arrows === undefined ? false : config.arrows;

    // default tooltip template
    this.tooltipTemplate = function(index, el) {
      el.innerHTML = ElGrapho.NumberFormatter.addCommas(index);
    };
    this.hoveredDataIndex = -1;
    this.selectedIndex = -1;

    // all Listeners we need to call remove for on cleanup
    this.allListeners = [];

    let viewport = this.viewport = new Concrete.Viewport({
      container: this.wrapper,
      width: this.width,
      height: this.height
    });

    let mainLayer = new Concrete.Layer({
      contextType: 'webgl'
    });

    let hoverLayer = this.hoverLayer = new Concrete.Layer({
      contextType: '2d'
    });

    let labelsLayer = this.labelsLayer = new Concrete.Layer({
      contextType: '2d'
    });

    viewport.add(mainLayer);
    viewport.add(hoverLayer);
    viewport.add(labelsLayer);


    this.webgl = new WebGL({
      layer: mainLayer
    });

    //webgl.initShaders();

    if (!ElGraphoCollection.initialized) {
      ElGraphoCollection.init();
    }



    // mainLayer.hit.canvas.style.display = 'inline-block';
    // mainLayer.hit.canvas.style.marginLeft = '10px';
    // this.wrapper.appendChild(mainLayer.hit.canvas);

    //this.model = config.model;

    //this.model = config.model;

    this.setHasLabels();

    let vertices = this.vertices = VertexBridge.modelToVertices(config.model, this.showArrows);
 
    this.webgl.initBuffers(vertices);
    

    this.initComponents();

    this.labels = new Labels();



    this.listen();

    ElGraphoCollection.graphs.push(this);
  },
  setSize: function(width, height) {
    this.width = width;
    this.height = height;
    this.wrapper.style.width = this.width + 'px';
    this.wrapper.style.height = this.height + 'px';
    this.viewport.setSize(width, height);
    this.dirty = true;
    this.hitDirty = true;
  },
  fitToViewport: function(maintainAspectRatio) {
    let nodes = this.model.nodes;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    nodes.forEach(function(node) {
      let nodeX = node.x;
      let nodeY = node.y;

      minX = Math.min(minX, nodeX);
      minY = Math.min(minY, nodeY);
      maxX = Math.max(maxX, nodeX);
      maxY = Math.max(maxY, nodeY);
    });

    // normalized width is 2 and height is 2.  Thus, to give a little padding,
    // using 1.9
    // ** modified by maxmin93 (2019-10-30)
    //    graph margin ratio : 1.9 ==> 1.6
    let diffX = maxX - minX;
    let diffY = maxY - minY;
    let xOffset = minX + diffX / 2;
    let yOffset = minY + diffY / 2;
    let xFactor = 1.6 / diffX;
    let yFactor = 1.6 / diffY;

    // we want to adjust the x and y equally to preserve ratio

    if (maintainAspectRatio) {
      let factor = Math.min(xFactor, yFactor);
      xFactor = factor;
      yFactor = factor;
    }

    nodes.forEach(function(node) {
      node.x = (node.x - xOffset) * xFactor;
      node.y = (node.y - yOffset) * yFactor;
    });
  },
  setHasLabels: function() {
    this.hasLabels = false;

    let nodes = this.model.nodes;
    for (let n=0; n<nodes.length; n++) {
      let label = nodes[n].label;
      if (label !== undefined && label !== null) {
        this.hasLabels = true;
        break;
      }
    }
  },
  initComponents: function() {
    let model = this.model;

    this.controls = new Controls({
      container: this.wrapper,
      graph: this
    });

    this.loading = new Loading({
      container: this.wrapper
    });

    if (this.debug) {
      this.count = new Count({
        container: this.wrapper
      });

      this.count.update(model.nodes.length, model.edges.length, model.steps);
    }
  },
  renderLabels: function(scale) {
    let that = this;
    let halfWidth = this.width/2;
    let halfHeight = this.height/2;

    // build labels view model
    this.labels.clear();
    let positions = this.vertices.points.positions;
    this.model.nodes.forEach(function(node, n) {
      let index = n * 2;
      if (node.label !== undefined && node.label !== null) {
        that.labels.addLabel(node.label, positions[index], positions[index+1]);
      }
    });
    
    // render
    let labelsScene = this.labelsLayer.scene;
    let labelsContext = labelsScene.context;

    labelsContext.save();

    labelsContext.translate(this.width/2, this.height/2);
    labelsContext.scale(scale, scale);
    labelsContext.textAlign = 'center'; 
    

    labelsContext.font = '12px Arial';

    if (this.darkMode) {
      labelsContext.fillStyle = '#eee';
      labelsContext.strokeStyle = 'black';
    }
    else {
      labelsContext.fillStyle = '#333';
      labelsContext.strokeStyle = 'white';      
    }

    labelsContext.lineWidth = 3;
    labelsContext.lineJoin = 'round';

    this.labels.labelsAdded.forEach(function(label) {
      let x = (label.x * halfWidth * that.zoomX + that.panX) / scale;
      let y = (label.y * -1 * halfHeight * that.zoomY - that.panY) / scale - 10;
      labelsContext.beginPath();
      labelsContext.strokeText(label.str, x, y);
      labelsContext.fillText(label.str, x, y);
    });


    labelsContext.restore();
  },
  // modified by maxmin93 (2019-11-05)
  // ** not working!
  selectNodes(arrIndex){
    let context = this.hoverLayer.scene.context;
    let scale = this.zoomX < 1 || this.zoomY < 1 ? Math.min(this.zoomX, this.zoomY) : 1;
    let halfWidth = this.width/2;
    let halfHeight = this.height/2;

    console.log('selectNodes', arrIndex, context, scale, halfWidth, halfHeight);
    for(let i=0; i<arrIndex.length; i++){
      let node = this.model.nodes[arrIndex[i]];
      let x = (node.x * halfWidth * this.zoomX + this.panX) / scale;
      let y = (node.y * -1 * halfHeight * this.zoomY - this.panY) / scale;

      context.save();
      if (this.darkMode) {
        context.strokeStyle = 'white';
      } else {
        context.strokeStyle = 'black';
      }
      context.lineWidth = 3;

      console.log('renderRing', node, x, y, this.darkMode);
      context.beginPath();
      context.arc(x, y, 8, 0, 2*Math.PI, false);
      context.stroke();
      context.restore();
    }
  },
  renderRings: function(scale) {
    let hoverIndex = this.hoveredDataIndex;
    let selectedIndex = this.selectedIndex;

    if (hoverIndex >= 0 || selectedIndex >= 0) {
      let halfWidth = this.width/2;
      let halfHeight = this.height/2;

      
      // render
      let scene = this.hoverLayer.scene;
      let context = scene.context;

      context.save();
      context.translate(this.width/2, this.height/2);
      context.scale(scale, scale);


      let node, x, y;

      // hover ring
      if (hoverIndex >= 0) {
        node = this.model.nodes[hoverIndex];
        x = (node.x * halfWidth * this.zoomX + this.panX) / scale;
        y = (node.y * -1 * halfHeight * this.zoomY - this.panY) / scale;

        context.save();
        if (this.darkMode) {
          //context.fillStyle = 'rgba(255, 255, 255, 0.4)';
          context.strokeStyle = 'white';
        }
        else {
          //context.fillStyle = 'rgba(255, 255, 255, 0.4)';
          context.strokeStyle = 'black';
        }

        context.lineWidth = 2;
        context.beginPath();
        context.arc(x, y, 8, 0, 2*Math.PI, false);
        context.stroke();
        context.restore();
      }

      // selected ring
      if (selectedIndex >= 0) {
        node = this.model.nodes[selectedIndex];
        x = (node.x * halfWidth * this.zoomX + this.panX) / scale;
        y = (node.y * -1 * halfHeight * this.zoomY - this.panY) / scale;

        context.save();
        if (this.darkMode) {
          context.strokeStyle = 'white';
        }
        else {
          context.strokeStyle = 'black';
        }

        context.lineWidth = 3;
        context.beginPath();
        context.arc(x, y, 8, 0, 2*Math.PI, false);
        context.stroke();
        context.restore();
      }

      context.restore();
    }    
  },
  setDarkMode(darkMode) {
    this.darkMode = darkMode;

    this.wrapper.classList.remove('el-grapho-dark-mode');
    if (darkMode) {
      this.wrapper.classList.add('el-grapho-dark-mode');
    }

    this.dirty = true;
  },
  getMousePosition(evt) {
    let boundingRect = this.wrapper.getBoundingClientRect();
    let x = evt.clientX - boundingRect.left;
    let y = evt.clientY - boundingRect.top;

    return {
      x: x,
      y: y
    };
  },
  addListener: function(o, on, fn) {
    this.allListeners[on] = this.allListeners[on] || [];
    this.allListeners[on].push({
      o: o,
      on: on,
      fn: fn
    });
    o.addEventListener(on, fn);
  },
  removeAllListeners: function() {
    const len = this.allListeners.length;
    for (let n=0; n<len; n++) {
      let l = this.allListeners[n];
      l.o.removeEventListener(l.on, l.fn);
    }
    this.allListeners = [];
  },
  listen: function() {
    let that = this;
    let viewport = this.viewport;

    this.on('zoom-in', function() {
      that.zoomIn();
    });

    this.on('zoom-out', function() {
      that.zoomOut();
    });

    this.on('reset', function() {
      that.reset();
    });

    this.on('select', function() {
      that.setInteractionMode(Enums.interactionMode.SELECT);
    });

    this.on('pan', function() {
      that.setInteractionMode(Enums.interactionMode.PAN);
    });

    this.on('box-zoom', function() {
      that.setInteractionMode(Enums.interactionMode.BOX_ZOOM);
    });

    this.on('step-up', function() {
      that.stepUp();
    });

    this.on('step-down', function() {
      that.stepDown();
    });

    // ** modified by maxmin93 (2019-10-30)
    this.on('crop', function(){
      that.setInteractionMode(Enums.interactionMode.CROP);
    });

    this.addListener(document, 'mousedown', function(evt) {
      if (Dom.closest(evt.target, '.el-grapho-controls')) {
        return;
      }

      // ** modified by maxmin93 (2019-10-30)
      if( (that.interactionMode === Enums.interactionMode.BOX_ZOOM)||(that.interactionMode === Enums.interactionMode.CROP) ){
        let mousePos = that.getMousePosition(evt);
        that.zoomBoxAnchor = {
          x: mousePos.x,
          y: mousePos.y
        };

        BoxZoom.create(evt.clientX, evt.clientY);
      }

    });

    this.addListener(viewport.container, 'mousedown', function(evt) {
      if (Dom.closest(evt.target, '.el-grapho-controls')) {
        return;
      }
      if (that.interactionMode === Enums.interactionMode.PAN) {
        let mousePos = that.getMousePosition(evt);
        that.panStart = mousePos;
        Tooltip.hide();
      }
    });

    this.addListener(document, 'mousemove', function(evt) {
      // ** modified by maxmin93 (2019-10-30)
      if( (that.interactionMode === Enums.interactionMode.BOX_ZOOM)||(that.interactionMode === Enums.interactionMode.CROP) ){
        BoxZoom.update(evt.clientX, evt.clientY);
      }
    });
    
    this.addListener(viewport.container, 'mousemove', _.throttle(function(evt) {
      let mousePos = that.getMousePosition(evt);
      let dataIndex = viewport.getIntersection(mousePos.x, mousePos.y);

      //console.log(mousePos.x, mousePos.y, dataIndex);

      if (that.interactionMode === Enums.interactionMode.PAN) {
        if (that.panStart) {
          let mouseDiff = {
            x: mousePos.x - that.panStart.x,
            y: mousePos.y - that.panStart.y
          };

          viewport.scene.canvas.style.marginLeft = mouseDiff.x + 'px';
          viewport.scene.canvas.style.marginTop = mouseDiff.y + 'px';

          
        }
      }

      // if panning or zoom boxing hide tooltip
      if (that.panStart || that.zoomBoxAnchor) {
        Tooltip.hide();
      }

      // we should not register mousemove events for nodes when we are hovering over controls
      if (Dom.closest(evt.target, '.el-grapho-controls')) {
        return;
      }

      // don't show tooltips if actively panning or zoom boxing
      if (!that.panStart && !that.zoomBoxAnchor) {
        if (dataIndex === -1) {
          Tooltip.hide();
        }
        else {
          if (that.tooltips) {
            Tooltip.render(dataIndex, evt.clientX, evt.clientY, that.tooltipTemplate);
          }
        }

        // change point state
        // ** modified by maxmin93 (2019-10-28)
        if (that.hoveredDataIndex > -1 && dataIndex !== that.hoveredDataIndex) {
          // if (that.hoveredDataIndex > -1) {
          //   that.vertices.points.focused[that.hoveredDataIndex] = 0;
          // }

          // that.vertices.points.focused[dataIndex] = 1;
          // that.webgl.initBuffers(that.vertices);
          // that.dirty = true;




//          if (that.hoveredDataIndex !== -1) {
            that.fire(Enums.events.NODE_MOUSEOUT, {
              dataIndex: that.hoveredDataIndex
            });
//          }

            // ** modified by maxmin93 (2019-10-28)
            // **NOTE : When nodes.length = 0, hoveredDataIndex is changed to 0
            //          This happen to error with drawing hover-ring
            //      ==> So, remove inside if-stmt and insert 'that.hoveredDataIndex > -1 &&' at outside if-stmt
            that.hoveredDataIndex = dataIndex;
            that.hoverDirty = true;
            //that.dirty = true;

//          if (that.hoveredDataIndex !== -1) {
            that.fire(Enums.events.NODE_MOUSEOVER, {
              dataIndex: that.hoveredDataIndex
            });
//          }
        }
      }    
    // need trailing false because we hide the tooltip on mouseleave.  without trailing false, the tooltip sometimes would render afterwards  
    }, 17, {trailing: false})); 


    this.addListener(document, 'mouseup', function(evt) {
      if (Dom.closest(evt.target, '.el-grapho-controls')) {
        return;
      }
      if (that.interactionMode === Enums.interactionMode.BOX_ZOOM) {
        if (!that.zoomBoxAnchor) {
          return;
        }

        let mousePos = that.getMousePosition(evt);
        let topLeftX, topLeftY;
        let width, height;
        let zoomX, zoomY;

        // direction: right down
        if (mousePos.x > that.zoomBoxAnchor.x && mousePos.y > that.zoomBoxAnchor.y) {
          width = mousePos.x - that.zoomBoxAnchor.x;
          height = mousePos.y - that.zoomBoxAnchor.y;
          topLeftX = that.zoomBoxAnchor.x;
          topLeftY = that.zoomBoxAnchor.y;
        }
        // direction: right up
        else if (mousePos.x > that.zoomBoxAnchor.x && mousePos.y <= that.zoomBoxAnchor.y) {
          width = mousePos.x - that.zoomBoxAnchor.x;
          height = that.zoomBoxAnchor.y - mousePos.y;
          topLeftX = that.zoomBoxAnchor.x;
          topLeftY = mousePos.y;
        }
        // direction: left up
        else if (mousePos.x <= that.zoomBoxAnchor.x && mousePos.y <= that.zoomBoxAnchor.y) {
          width = that.zoomBoxAnchor.x - mousePos.x;
          height =  that.zoomBoxAnchor.y - mousePos.y; 
          topLeftX = mousePos.x;
          topLeftY = mousePos.y; 
        }
        // direction: left down
        else if (mousePos.x <= that.zoomBoxAnchor.x && mousePos.y > that.zoomBoxAnchor.y) {
          width = that.zoomBoxAnchor.x - mousePos.x;
          height =  mousePos.y - that.zoomBoxAnchor.y; 
          topLeftX = mousePos.x;
          topLeftY = that.zoomBoxAnchor.y;   
        }

        ///////////////////////////////////
        // ** modified by maxmin93 (2019-10-30)
        // 비율에 맞는 zooming.
        // 현재 스크린 비율에 따라 boxselection을 조절하여 비율에 맞는 zooming이 되도록 하기(비율, width:height = x:y)
        // algorithm
        // 1. y를 고정하고 y에 대한 x의 비율의 값을 구함 => x'
        // 2. x를 고정하고 x에 대한 y의 비율의 값을 구함 => y'
        // 3. 만약 x가 x' 보다 작으면: x=x', topleftx 값을 조절
        // 4. 만약 x가 x' 보다 크면: y=y', toplefty 값을 조절
        //////////////////////////////////
        
        let screen_width = that.width;
        let screen_height = that.height;
        let fit_x = screen_width*height/screen_height;
        let fit_y = screen_height*width/screen_width;

        if ( width <= fit_x ) {
          topLeftX = topLeftX - ((fit_x-width)/2);
          width = fit_x;
        } else {
          topLeftY = topLeftY - ((fit_y-height)/2);
          height = fit_y;
        }

        //////////////////////////////////

        let viewportWidth = viewport.width;
        let viewportHeight = viewport.height;

        // if just clicking on a point...
        if (width < 2 || height < 2) {
          zoomX = ZOOM_FACTOR;
          zoomY = ZOOM_FACTOR;
          width = 0;
          height = 0;
          topLeftX = mousePos.x;
          topLeftY = mousePos.y;
        }
        else {
          zoomX = viewportWidth / width;
          zoomY = viewportHeight / height;
        }


        let viewportCenterX = viewportWidth/2;
        let viewportCenterY = viewportHeight/2;

        let boxCenterX = (topLeftX + width/2);
        let panX = (viewportCenterX - boxCenterX) * that.zoomX;
        let boxCenterY = (topLeftY + height/2);
        let panY = (boxCenterY - viewportCenterY) * that.zoomY;

        that.zoomToPoint(panX, panY, zoomX, zoomY);
        BoxZoom.destroy();
        that.zoomBoxAnchor = null;
      }
      // ** modified by maxmin93 (2019-10-30)
      // crop mode
      else if (that.interactionMode === Enums.interactionMode.CROP) {
        if (!that.zoomBoxAnchor) {    // previous mouse position 
          return;
        }

        let mousePos = that.getMousePosition(evt);
        let selectedNodes = that.selectByBox( that.zoomBoxAnchor, mousePos );
        let pan = { x: viewport.width/2, y: viewport.height/2 };

        BoxZoom.destroy();
        that.zoomBoxAnchor = null;

        if( selectedNodes.length > 0 ) {
          // like box selection
          that.fire(Enums.events.NODES_CROP, { nodes: selectedNodes, pan: pan });
        }
      }

    });
    this.addListener(viewport.container, 'mouseup', function(evt) {
      if (Dom.closest(evt.target, '.el-grapho-controls')) {
        return;
      }

      if (that.interactionMode === Enums.interactionMode.SELECT) {
        let mousePos = that.getMousePosition(evt);
        let dataIndex = viewport.getIntersection(mousePos.x, mousePos.y);

        if (dataIndex === -1) {
          that.deselectNode();
          that.deselectGroup();
          // ** modified by maxmin93 (2019-10-30)
          that.fire(Enums.events.IDLE, {pos: mousePos});          
        }
        else {
          that.selectNode(dataIndex);
          that.selectGroup(that.vertices.points.colors[dataIndex]);

          that.fire(Enums.events.NODE_CLICK, {
            dataIndex: dataIndex
          });  
        } 
      }

      if (that.interactionMode === Enums.interactionMode.PAN) {
        let mousePos = that.getMousePosition(evt);

        let mouseDiff = {
          x: mousePos.x - that.panStart.x,
          y: mousePos.y - that.panStart.y
        };

        // that.panX += mouseDiff.x / that.scale;
        // that.panY -= mouseDiff.y / that.scale;
        that.panX += mouseDiff.x;
        that.panY -= mouseDiff.y;

        that.panStart = null;

        viewport.scene.canvas.style.marginLeft = 0;
        viewport.scene.canvas.style.marginTop = 0;

        that.dirty = true;
        that.hitDirty = true;
        that.hoverDirty = true;
      }
    });

    this.addListener(viewport.container, 'mouseout', function() {
      Tooltip.hide();
    });
  },
  // stepUp: function() {
  //   console.log('step up');

  //   this.model.step++;
  //   //this.updateVertices();
  // },
  // stepDown: function() {
  //   console.log('step down');
  // },
  setInteractionMode: function(mode) {
    this.interactionMode = mode;

    for (let key in Enums.interactionMode) {
      this.wrapper.classList.remove('el-grapho-' + Enums.interactionMode[key] + '-interaction-mode');  
    }

    this.wrapper.classList.add('el-grapho-' + mode + '-interaction-mode');
  },
  zoomToPoint: function(panX, panY, zoomX, zoomY) {
    Tooltip.hide();
    if (this.animations) {
      this.animations = [];

      let that = this;
      this.animations.push({
        startVal: that.zoomX,
        endVal: that.zoomX * zoomX,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 300,
        prop: 'zoomX'
      });
      this.animations.push({
        startVal: that.zoomY,
        endVal: that.zoomY * zoomY,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 300,
        prop: 'zoomY'
      });
      this.animations.push({
        startVal: that.panX,
        endVal: (that.panX + panX / that.zoomX) * zoomX,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 300,
        prop: 'panX'
      });
      this.animations.push({
        startVal: that.panY,
        endVal: (that.panY + panY / that.zoomY) * zoomY,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 300,
        prop: 'panY'
      });
      this.dirty = true;
    }
    else {
      this.panX = (this.panX + panX / this.zoomX) * zoomX;
      this.panY = (this.panY + panY / this.zoomY) * zoomY;
      this.zoomX = this.zoomX * zoomX;
      this.zoomY = this.zoomY * zoomY;
      this.dirty = true;
      this.hitDirty = true;
    }
  },
  zoomIn: function() {
    Tooltip.hide();
    this.zoomToPoint(0, 0, ZOOM_FACTOR, ZOOM_FACTOR);
  },
  zoomOut: function() {
    Tooltip.hide();
    this.zoomToPoint(0, 0, 1/ZOOM_FACTOR, 1/ZOOM_FACTOR);
  },
  reset: function() {
    Tooltip.hide();
    if (this.animations) {
      this.animations = [];

      let that = this;
      this.animations.push({
        startVal: that.zoomX,
        endVal: START_SCALE,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 300,
        prop: 'zoomX'
      });
      this.animations.push({
        startVal: that.zoomY,
        endVal: START_SCALE,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 300,
        prop: 'zoomY'
      });

      this.animations.push({
        startVal: that.panX,
        endVal: 0,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 300,
        prop: 'panX'
      });

      this.animations.push({
        startVal: that.panY,
        endVal: 0,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 300,
        prop: 'panY'
      });

      this.dirty = true;
    }
    else {
      this.zoomX = START_SCALE;
      this.zoomY = START_SCALE;
      this.panX = 0;
      this.panY = 0;
      this.dirty = true;
      this.hitDirty = true;
    }
  },
  on: function(name, func) {
    this.events.on(name, func);
  },
  fire: function(name, evt) {
    this.events.fire(name, evt);
  },
  showLoading: function() {
    this.wrapper.classList.add('el-grapho-loading');
  },
  hideLoading: function() {
    this.wrapper.classList.remove('el-grapho-loading');
  },
  destroy: function() {
    // listeners
    this.removeAllListeners();
    
    // viewport
    this.viewport.destroy();

    // remove from collection
    ElGraphoCollection.remove(this);
  },
  selectGroup: function(group) {
    this.focusedGroup = group;
    this.dirty = true;
  },
  deselectGroup: function() {
    this.focusedGroup = -1;
    this.dirty = true;
  },
  selectNode: function(index) {
    this.selectedIndex = index;
    this.hoverDirty = true;
  },
  deselectNode: function() {
    this.selectedIndex = -1;
    this.hoverDirty = true;
  },

  ////////////////////////////////////////////////////
  
  // ** modified by maxmin93 (2019-11-15)
  // select model in boxSelection
  selectByBox: function(mouseDownPos, mouseUpPos) {
    // mouse area
    let start_x = (mouseDownPos.x<mouseUpPos.x) ? mouseDownPos.x : mouseUpPos.x;
    let start_y = (mouseDownPos.y<mouseUpPos.y) ? mouseDownPos.y : mouseUpPos.y;
    let end_x = (mouseDownPos.x<mouseUpPos.x) ? mouseUpPos.x : mouseDownPos.x;
    let end_y = (mouseDownPos.y<mouseUpPos.y) ? mouseUpPos.y : mouseDownPos.y;

    let screenArea = this.getScreenArea();
    let boxArea = this.getBoxArea(screenArea, {start_x, start_y, end_x, end_y});
    let scale = this.zoomX < 1 || this.zoomY < 1 ? Math.min(this.zoomX, this.zoomY) : 1;

    let selectedNodes = [];
    let nodes = this.model.nodes;
    for ( let i=0; i<nodes.length; i++ ) {
      let node_position = this.mapToScreenArea(nodes[i].x, nodes[i].y);
      // match each node position to boxArea
      if ( node_position.screen_x >= boxArea.start_x &&
           node_position.screen_x <= boxArea.end_x &&
           node_position.screen_y >= boxArea.start_y &&
           node_position.screen_y <= boxArea.end_y 
      ) {
        let x = (nodes[i].x * (this.width/2) * this.zoomX + this.panX) / scale;
        let y = (nodes[i].y * -1 * (this.height/2) * this.zoomY - this.panY) / scale;
        // console.log(`  - node[${i}]: (${nodes[i].x}, ${nodes[i].y}) => (${x}, ${y})`);
    
        // push to selected nodes
        let clone = _.cloneDeep(nodes[i]);
        clone._x = x; // node_position.screen_x;
        clone._y = y; // node_position.screen_y;
        if( !clone.hasOwnProperty('_index') ) clone._index = i;
        selectedNodes.push(clone);
      }
    }

    return selectedNodes;
  },
  getBoxArea(screenArea, mouseArea) {
    let unit_x = (screenArea.end_x - screenArea.start_x) / this.width;
    let unit_y = (screenArea.end_y - screenArea.start_y) / this.height;

    return {start_x: screenArea.start_x + (unit_x * Math.round(mouseArea.start_x)),
            start_y: screenArea.start_y + (unit_y * Math.round(mouseArea.start_y)),
            end_x: screenArea.start_x + (unit_x * Math.round(mouseArea.end_x)),
            end_y: screenArea.start_y + (unit_y * Math.round(mouseArea.end_y))};
  },
  mapToScreenArea: function(norm_x, norm_y) {
    let center_x = this.width / 2,
        center_y = this.height / 2;
    let screen_x = center_x + (center_x * norm_x),
        screen_y = center_y - (center_y * norm_y);
    return {screen_x: screen_x, screen_y: screen_y};
  },
  getScreenArea: function() {
    let screen_starting_x =  (this.panX==0) ? 0 : -(this.panX/this.zoomX);
    let screen_starting_y = (this.panY/this.zoomY);
    let screen_ending_x = this.width - (this.panX/this.zoomX);
    let screen_ending_y = this.height + (this.panY/this.zoomY);

    let center_x = (screen_starting_x + screen_ending_x) / 2;
    let center_y = (screen_starting_y + screen_ending_y) / 2;
    
    let offset_x = (center_x - screen_starting_x) / this.zoomX;
    let offset_y = (center_y - screen_starting_y) / this.zoomY;

    let start_x = center_x - offset_x;
    let start_y = center_y - offset_y;
    let end_x = center_x + offset_x;
    let end_y = center_y + offset_y;

    return {start_x: start_x, start_y: start_y, end_x: end_x, end_y: end_y};
  }  
};

// export modules
ElGrapho.Theme = Theme;
ElGrapho.Color = Color;
ElGrapho.Profiler = Profiler;
ElGrapho.NumberFormatter = NumberFormatter;
ElGrapho.layouts = {
  Tree: Tree,
  Cluster: Cluster,
  Chord: Chord,
  ForceDirected: ForceDirected,
  Hairball: Hairball,
  RadialTree: RadialTree
};

module.exports = ElGrapho;
