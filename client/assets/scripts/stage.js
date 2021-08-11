const placeHolderText = "Double click here to edit";
const shortPlaceHolderText = "Double click";
const TEXT_GROUP_CRATOR = "TEXT_GROUP_CRATOR";
const TEXT_GROUP_ASTEROID = "TEXT_GROUP_ASTEROID";
const TEXT_GROUP_FLAME = "TEXT_GROUP_FLAME";
const TEXT_GROUP_TRANSRECT = "TEXT_GROUP_TRANSPARENT_RECT";
const FLAG_OBJECT = "FLAG_OBJECT";
const BADGE_OBJECT = "BADGE_OBJECT";
const AVATAR_OBJECT = "AVATAR_OBJECT";
const TEMPLATE_IMAGE = "TEMPLATE_IMAGE";
const TEMPLATE_SVG = "TEMPLATE_SVG";
const FONT_FAMILY = "Akzidenz Grotesque";
const FONT_FAMILY_DYNAMIC = "Montserrat";
const IMAGE_OBJECTS = [FLAG_OBJECT, BADGE_OBJECT, AVATAR_OBJECT];

let flagPositions = [];
for (let k = 0; k < 2; k++) {
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      let position = {
        left: 9939 + j * 54,
        top: 1564 + i * 50,
      };
      flagPositions.push(position);
    }
  }
}
const CLONERS_POSITIONS = {
  asteroid: [{ left: 5873, top: 3522 }],
  flame: [{ left: 6016, top: 3541 }],
  flag: flagPositions,
};
delete flagPositions;

class Stage {
  constructor(parentDivId) {
    this.parentDivId = parentDivId;
    this.parentDiv = document.getElementById(this.parentDivId);
    this.nodes = {};
    this.loading = true;
    this.actionHistory = [];
    this.selectedObjects = [];
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;
    this.beforeStates = {};
    this.textBoxObjInEdit = null;
  }
  loadFonts(callback) {
    // let font = new FontFaceObserver(FONT_FAMILY);
    let font_dynamic = new FontFaceObserver(FONT_FAMILY_DYNAMIC);
    Promise.all([
      // font.load(),
      font_dynamic.load(),
    ]).then(() => {
      callback && callback();
    });
  }
  initStage() {
    window.his = this.actionHistory;
    const _that = this;
    this.draggingOnClick = 0;
    // create a wrapper around native canvas element (with id="stage")
    let canvas = new fabric.Canvas(this.parentDivId, {
      allowTouchScrolling: true,
      preserveObjectStacking: true,
      // skipOffscreen: true,
      // renderOnAddRemove: false,
    });
    window.c = canvas;
    // fabric.Object.prototype.objectCaching = false;
    canvas.hoverCursor = "pointer";
    canvas.backgroundColor = "white";

    // set Dimensions of the stage
    canvas.setDimensions({
      width: document.getElementById("container").offsetWidth,
      height: document.getElementById("container").offsetHeight,
    });

    canvas.on("text:editing:exited", function (e) {
      _that.addToHistory(e);
    });

    // setup zooming
    canvas.on("mouse:wheel", function (opt) {
      var delta = opt.e.deltaY;
      var zoom = canvas.getZoom();
      if (
        navigator.userAgent.indexOf("Firefox") > -1 &&
        navigator.platform.indexOf("Win") > -1
      ) {
        zoom *= 0.9 ** delta;
      } else {
        zoom *= 0.999 ** delta;
      }

      if (zoom > 10) zoom = 10;
      if (zoom < 0.08) zoom = 0.08;
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      _that.setActiveSelectionOnZoom();
    });

    canvas.on("text:changed", function (e) {
      // console.log(e);
      let activeObject = canvas.getActiveObject();
      if (activeObject.itemType == "TEXT_GROUP_TRANSPARENT_RECT") {
        activeObject.height = activeObject.groupObj.height;
      }
    });

    canvas.on("selection:created", function (opt) {
      // _that.saveBeforeState(opt);
      opt.target.set({
        lockScalingX: true,
        lockScalingY: true,
        lockSkewingX: true,
        lockSkewingY: true,
        lockRotation: true,
        lockScalingFlip: true,
      });
      // setTimeout(() => _that.lockSelections(), 200);
      console.log("********selection:created");
      window.requestAnimationFrame(_that.lockSelections.bind(_that));
      window.canvas = canvas;
      let activeObject = canvas.getActiveObject();
      if (activeObject.itemType == "TEXT_GROUP_TRANSPARENT_RECT") {
        activeObject.height = activeObject.groupObj.height;
      }
      return true;
    });
    canvas.on("selection:updated", function (opt) {
      // console.log("selection updated");
      // _that.saveBeforeState(opt);
      // setTimeout(() => _that.lockSelections(), 200);
      console.log("********selection:updated");
      window.requestAnimationFrame(_that.lockSelections.bind(_that));
      return true;
    });
    canvas.on("selection:cleared", function (opt) {
      // console.log("selection cleared");

      // setTimeout(() => _that.lockSelections(), 200);
      console.log("********selection:cleared");
      window.requestAnimationFrame(_that.lockSelections.bind(_that));
      return true;
    });

    // setup panning
    canvas.on("mouse:down", (opt) => {
      var evt = opt.e;
      if (_that.pressingSpace) {
        _that.isDragging = true;
        canvas.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
        _that.draggingOnClick = 1;
      }
      this.mousedown = true;
    });
    canvas.on("mouse:move", function (opt) {
      var evt = opt.e;
      _that.mouseOffsetX = evt.offsetX;
      _that.mouseOffsetY = evt.offsetY;
      if (_that.draggingOnClick > -1) {
        if (_that.pressingSpace) {
          if (!this.isDragging) {
            this.isDragging = true;
            canvas.selection = false;
            this.lastPosX = evt.clientX;
            this.lastPosY = evt.clientY;
          } else if (this.isDragging) {
            var vpt = this.viewportTransform;
            vpt[4] += evt.clientX - this.lastPosX;
            vpt[5] += evt.clientY - this.lastPosY;
            this.requestRenderAll();
            this.lastPosX = evt.clientX;
            this.lastPosY = evt.clientY;
          }
          _that.canvas.setZoom(_that.canvas.getZoom());
        } else {
          this.isDragging = false;
          canvas.selection = true;
        }
      }
    });

    canvas.on("mouse:up", function (opt) {
      // on mouse up we want to recalculate new interaction
      // for all objects, so we call setViewportTransform
      this.mouseDown = false;
      if (this.isDragging) {
        _that.draggingOnClick = -1;
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        canvas.selection = true;
      }
    });

    canvas.on("object:added", function (e) {
      e.target.itemId = Math.floor(Math.random() * 20) * Date.now();
    });

    canvas.on("object:moved", async function (opt) {
      _that.addToHistory(opt);
      let activeObjects = _that.canvas.getActiveObjects();
      let actions = [];
      for (let item of activeObjects) {
        console.log("&&&&& Moved : ", item);
        if (item.textBoxObj) {
          if (item.textBoxObj.isClone) {
            //Clone New to existing position
            let cloned = await _that.createNode({
              index: uuidv4(),
              type: item.textBoxObj.itemType,
              text: placeHolderText,
              position: {
                left: item.textBoxObj.originOptions.left,
                top: item.textBoxObj.originOptions.top,
              },
              mode: (item.textBoxObj.mode + 1) % 3,
              isClone: true,
            });
            console.log("&&&&& Cloned from moved : ", cloned);
            actions.push(cloned);

            // Make Normal
            item.textBoxObj.originOptions.left = item.textBoxObj.groupObj.left;
            item.textBoxObj.originOptions.top = item.textBoxObj.groupObj.top;
            _that.bindTextGroupEditing(
              item.textBoxObj,
              item.textBoxObj.originOptions,
              true
            );
            item.textBoxObj.isClone = false;
          }
          actions.push({
            ...item.textBoxObj,
            selectable: false,
          });
          _that.canvas.requestRenderAll();
        } else if (item.itemType) {
          if (item.isClone) {
            //Clone New to existing position
            let cloned = await _that.createNode({
              index: uuidv4(),
              type: item.itemType,
              position: {
                left: item.originOptions.left,
                top: item.originOptions.top,
              },
              mode: item.mode,
              isClone: true,
            });
            actions.push(cloned);

            // Make Normal
            item.originOptions.left = item.left;
            item.originOptions.top = item.top;
            item.isClone = false;
          }
          actions.push({
            ...item,
            selectable: false,
          });
          _that.canvas.requestRenderAll();
        }
      }
      if (actions.length) {
        dispatchUpdating(_that, actions);
      }
    });

    this.canvas = canvas;
  }

  setActiveSelectionOnZoom() {
    let object = this.canvas.getActiveObject();
    if (object && object.type == "activeSelection") {
      let objects = object.getObjects();
      this.canvas.discardActiveObject().renderAll();
      let selection = new fabric.ActiveSelection(objects, {
        canvas: this.canvas,
      });
      this.canvas.setActiveObject(selection).requestRenderAll();
    }
  }
  loadFromJSON(json, callback) {
    let backgroundImage = Object.assign({}, json.backgroundImage);
    delete json.backgroundImage;
    this.canvas.loadFromJSON(json, () => {
      fabric.util.enlivenObjects([backgroundImage], (objects) => {
        let background = objects[0];
        this.canvas.setBackgroundImage(
          background,
          this.canvas.requestRenderAll.bind(this.canvas)
        );
        background.getObjects().forEach(function (o) {
          o.objectCaching = false;
        });
        background.objectCaching = false;
        this.canvas.renderAll();
        callback && callback();
      });
    });
  }
  lockSelections() {
    let actions = [];
    console.log("this.selectedObjects: ", this.selectedObjects);
    for (let item of this.selectedObjects) {
      actions.push({
        ...item,
        selectable: true,
      });
    }
    this.selectedObjects = [];
    let activeObjects = this.canvas.getActiveObjects();
    let shouldExcludeObjects = false;
    let objectsToReActivate = [];
    console.log("********lockSelections******", activeObjects);
    let count = 0;
    for (let item of activeObjects) {
      if (item.layerType) {
        count++;
        if (count >= 2) {
          location.reload();
          return;
        }
      }
    }
    for (let item of activeObjects) {
      let object = item.textBoxObj ? item.textBoxObj : item;
      const isInClonerPosition = this.isInClonerPosition({
        type: object.itemType,
        position: {
          left: object.groupObj
            ? object.groupObj.group
              ? object.groupObj.left +
                object.groupObj.group.left +
                object.groupObj.group.width / 2
              : object.groupObj.left
            : object.group
            ? object.left + object.group.left + object.group.width / 2
            : object.left,
          top: object.groupObj
            ? object.groupObj.group
              ? object.groupObj.top +
                object.groupObj.group.top +
                object.groupObj.group.height / 2
              : object.groupObj.top
            : object.group
            ? object.top + object.group.top + object.group.height / 2
            : object.top,
        },
      });
      console.log("isInClonerPosition: ", isInClonerPosition);
      if (activeObjects.length > 1 && (object.isClone || isInClonerPosition)) {
        shouldExcludeObjects = true;
      }
      let duplicatedItem = actions.find(
        (group) => group.index === object.index
      );
      if (activeObjects.length === 1 && object.isClone) {
        console.log("********lockSelections******", object.editing);
        if (!duplicatedItem) {
          console.log("========Creating======");
          this.creatCloner(object);
        }
      }
      if (duplicatedItem) {
        if (
          !(object.isClone || isInClonerPosition) &&
          (!this.textBoxObjInEdit ||
            (this.textBoxObjInEdit &&
              this.textBoxObjInEdit.index === duplicatedItem.index))
        ) {
          duplicatedItem.selectable = false;
        }
      } else {
        let obj = {
          ...object,
          selectable: false,
        };

        if (!(object.isClone || isInClonerPosition) || !shouldExcludeObjects) {
          actions.push(obj);
        }
      }

      if (!(object.isClone || isInClonerPosition) || !shouldExcludeObjects) {
        this.selectedObjects.push(object);
        objectsToReActivate = objectsToReActivate.concat(item);
      }
    }

    if (shouldExcludeObjects) {
      console.log("****shouldExcludeObjects*************");
      this.canvas.discardActiveObject().renderAll();
      let selection = new fabric.ActiveSelection(objectsToReActivate, {
        canvas: this.canvas,
      });
      this.canvas.setActiveObject(selection).requestRenderAll();
    }

    if (actions.length) {
      dispatchUpdating(this, actions);
    }
  }

  leaveAllSelected() {
    let actions = [];
    for (let item of this.selectedObjects) {
      actions.push({
        ...item,
        selectable: true,
      });
    }
    this.selectedObjects = [];

    if (actions.length) {
      dispatchUpdating(this, actions);
    }
  }

  fitResponsiveCanvas() {
    this.canvas.setWidth(document.getElementById("container").offsetWidth);
    this.canvas.setHeight(document.getElementById("container").offsetHeight);
  }

  async addImage(url, options) {
    const _that = this;
    return new Promise(function (resolve, reject) {
      fabric.Image.fromURL(url, function (img) {
        var imageObj = img.set(
          _.omit(
            {
              ...options,
              scaleX: options.width / img.width,
              scaleY: options.height / img.height,
            },
            ["width", "height"]
          )
        );
        _that.canvas.add(imageObj);
        resolve(imageObj);
      });
    });
  }

  async addSvg(options, url) {
    const _that = this;
    return new Promise(function (resolve, reject) {
      fabric.loadSVGFromURL(url, function (objects, opts) {
        // console.log(opts);
        Object.assign(opts, options);
        var obj = fabric.util.groupSVGElements(objects, {
          ...opts,
          objectCaching: false,
        });
        obj.itemType = "TEMPLATE_SVG";
        _that.canvas.add(obj);
        obj.getObjects().forEach(function (o) {
          o.objectCaching = false;
        });
        _that.canvas.renderAll();
        resolve();
      });
    });
  }

  async addBackgroundImage(url) {
    const _that = this;
    return new Promise(function (resolve, reject) {
      fabric.loadSVGFromURL(url, function (objects, options) {
        // console.log(options);
        var obj = fabric.util.groupSVGElements(objects, {
          ...options,
          objectCaching: false,
        });
        _that.canvas.setBackgroundImage(
          obj,
          _that.canvas.requestRenderAll.bind(_that.canvas)
        );
        obj.getObjects().forEach(function (o) {
          o.objectCaching = false;
        });
        _that.canvas.renderAll();
        resolve();
      });
      // fabric.Image.fromURL(url, function (myImg) {
      //   // add background image
      //   _that.canvas.setBackgroundImage(
      //     myImg,
      //     _that.canvas.requestRenderAll.bind(_that.canvas)
      //   );
      //   resolve();
      // });
    });
  }

  addClickableRect(url, options) {
    const rectObj = new fabric.Rect({
      ...options,
      fill: "rgba(0,0,0,0)",
    });
    this.canvas.add(rectObj);

    rectObj.on("mouseup", function () {
      window.open(url, "_blank");
    });

    return rectObj;
  }

  addTextBox(text, options) {
    const textBoxObj = new fabric.Textbox(text, options);
    this.canvas.add(textBoxObj);
    const _that = this;
    textBoxObj.short = options.short;
    const clearText = function (textObj) {
      // textBoxObj.selectAll();
      textObj.editing = true;
      textObj.backObj.editing = true;
      _that.textBoxObjInEdit = textObj;
      if (textObj.text.length) {
        if (
          textObj.text === placeHolderText ||
          textObj.text === shortPlaceHolderText
        ) {
          textObj.fromPlaceHolder = true;
          textObj.text = "";
          textObj.groupObj.remove(textObj);
          textObj.exitEditing();
          // _that.canvas.remove(textObj.groupObj);
          _that.canvas.setActiveObject(textObj);
          textObj.enterEditing();
        } else {
          // textObj.groupObj.remove(textObj);
          textObj.setSelectionStart(textObj.text.length);
          textObj.setSelectionEnd(textObj.text.length);
        }
      }
      _that.canvas.bringToFront(textObj.backObj);
      _that.canvas.bringToFront(textObj);
      _that.canvas.requestRenderAll();
    };

    textBoxObj.on("editing:entered", function (e) {
      // console.log("clear");
      clearText(textBoxObj);
    });
    textBoxObj.on("editing:exited", function (e) {
      if (!textBoxObj.text.length && !textBoxObj.fromPlaceHolder) {
        textBoxObj.text = textBoxObj.short
          ? shortPlaceHolderText
          : placeHolderText;
      }
      textBoxObj.fromPlaceHolder = false;
      textBoxObj.editing = false;
      textBoxObj.backObj.editing = true;
      _that.textBoxObjInEdit = null;
    });

    return textBoxObj;
  }

  async addImageObj(
    index,
    type,
    options,
    mode = 0,
    isClone = false,
    selectable = true
  ) {
    let imageUrl;
    let currentOptions = {
      ...options,
      width: 140,
      height: 140,
      hasControls: false,
    };
    if (type === FLAG_OBJECT) {
      if (mode === 0) imageUrl = "/assets/images/Flag-1.png";
      if (mode === 1) imageUrl = "/assets/images/Flag-2.png";
      if (mode === 2) imageUrl = "/assets/images/Flag-3.png";
      currentOptions.width = 32;
      currentOptions.height = 42;
    }
    if (type === BADGE_OBJECT) {
      imageUrl = "/assets/images/Badge.png";
      currentOptions.width = 145;
      currentOptions.height = 145;
    }
    if (type === AVATAR_OBJECT) {
      currentOptions.width = 23;
      currentOptions.height = 7;
      if (mode === 0) {
        imageUrl = "/assets/images/avatar/00-nose.png";
        currentOptions.width = 16;
        currentOptions.height = 9;
      }
      if (mode === 1) {
        imageUrl = "/assets/images/avatar/01-happy-eyebrow-left.png";
      }
      if (mode === 2) {
        imageUrl = "/assets/images/avatar/01-happy-eyebrow-right.png";
      }
      if (mode === 3) {
        imageUrl = "/assets/images/avatar/01-happy-eye-left.png";
        currentOptions.width = 18;
        currentOptions.height = 10;
      }
      if (mode === 4) {
        imageUrl = "/assets/images/avatar/01-happy-eye-right.png";
        currentOptions.width = 17;
        currentOptions.height = 10;
      }
      if (mode === 5) {
        imageUrl = "/assets/images/avatar/01-happy-mouth.png";
        currentOptions.width = 26;
        currentOptions.height = 14;
      }
      if (mode === 6)
        imageUrl = "/assets/images/avatar/02-surprised-eyebrow-left.png";
      if (mode === 7)
        imageUrl = "/assets/images/avatar/02-surprised-eyebrow-right.png";
      if (mode === 8) {
        imageUrl = "/assets/images/avatar/02-surprised-eye-left.png";
        currentOptions.width = 18;
        currentOptions.height = 10;
      }
      if (mode === 9) {
        imageUrl = "/assets/images/avatar/02-surprised-eye-right.png";
        currentOptions.width = 17;
        currentOptions.height = 10;
      }
      if (mode === 10) {
        imageUrl = "/assets/images/avatar/02-surprised-mouth.png";
        currentOptions.width = 26;
        currentOptions.height = 14;
      }
      if (mode === 11)
        imageUrl = "/assets/images/avatar/03-confused-eyebrow-left.png";
      if (mode === 12)
        imageUrl = "/assets/images/avatar/03-confused-eyebrow-right.png";
      if (mode === 13) {
        imageUrl = "/assets/images/avatar/03-confused-eye-left.png";
        currentOptions.width = 18;
        currentOptions.height = 10;
      }
      if (mode === 14) {
        imageUrl = "/assets/images/avatar/03-confused-eye-right.png";
        currentOptions.width = 17;
        currentOptions.height = 10;
      }
      if (mode === 15) {
        imageUrl = "/assets/images/avatar/03-confused-mouth.png";
        currentOptions.width = 22;
        currentOptions.height = 10;
      }
      if (mode === 16) {
        imageUrl = "/assets/images/avatar/04-indifferent-eyebrow-left.png";
        currentOptions.height = 6;
      }
      if (mode === 17)
        imageUrl = "/assets/images/avatar/04-indifferent-eyebrow-right.png";
      if (mode === 18) {
        imageUrl = "/assets/images/avatar/04-indifferent-eye-left.png";
        currentOptions.width = 18;
        currentOptions.height = 9;
      }
      if (mode === 19) {
        imageUrl = "/assets/images/avatar/04-indifferent-eye-right.png";
        currentOptions.width = 17;
        currentOptions.height = 10;
      }
      if (mode === 20) {
        imageUrl = "/assets/images/avatar/04-indifferent-mouth.png";
        currentOptions.width = 26;
        currentOptions.height = 8;
      }
      if (mode === 21)
        imageUrl = "/assets/images/avatar/05-angry-eyebrow-left.png";
      if (mode === 22)
        imageUrl = "/assets/images/avatar/05-angry-eyebrow-right.png";
      if (mode === 23) {
        imageUrl = "/assets/images/avatar/05-angry-eye-left.png";
        currentOptions.width = 18;
        currentOptions.height = 10;
      }
      if (mode === 24) {
        imageUrl = "/assets/images/avatar/05-angry-eye-right.png";
        currentOptions.width = 17;
        currentOptions.height = 10;
      }
      if (mode === 25) {
        imageUrl = "/assets/images/avatar/05-angry-mouth.png";
        currentOptions.width = 26;
        currentOptions.height = 14;
      }
      if (mode === 26)
        imageUrl = "/assets/images/avatar/06-sad-eyebrow-left.png";
      if (mode === 27)
        imageUrl = "/assets/images/avatar/06-sad-eyebrow-right.png";
      if (mode === 28) {
        imageUrl = "/assets/images/avatar/06-sad-eye-left.png";
        currentOptions.width = 18;
        currentOptions.height = 10;
      }
      if (mode === 29) {
        imageUrl = "/assets/images/avatar/06-sad-eye-right.png";
        currentOptions.width = 17;
        currentOptions.height = 10;
      }
      if (mode === 30) {
        imageUrl = "/assets/images/avatar/06-sad-mouth.png";
        currentOptions.width = 26;
        currentOptions.height = 7;
      }
    }

    const imageObj = await this.addImage(imageUrl, {
      ...currentOptions,
    });

    imageObj.isClone = isClone;
    imageObj.originOptions = currentOptions;
    imageObj.mode = mode;
    imageObj.set({
      selectable: selectable,
      hoverCursor: selectable ? "pointer" : "default",
    });

    imageObj.index = index;
    imageObj.itemType = type;
    this.nodes[index] = imageObj;
    return imageObj;
  }

  async addTemplateImage(options, url) {
    const imageObj = await this.addImage(url, options);

    imageObj.isClone = false;
    imageObj.originOptions = options;
    imageObj.mode = 0;
    imageObj.set({
      selectable: false,
      hoverCursor: false ? "pointer" : "default",
      itemType: TEMPLATE_IMAGE,
    });
  }

  async addAvatarStacks(index, options) {
    let i = 0;
    for (let i = 0; i < 6; i++) {
      let faceLeft = options.left + (i % 2) * 105;
      let faceTop = options.top + Math.floor(i / 2) * 90;
      for (let j = 0; j < 6; j++) {
        let posLeft = faceLeft;
        let posTop = faceTop;
        if (j == 0) posTop += 2;
        if (j == 1) (posLeft += 36), (posTop += 2);
        if (j == 2) (posLeft += 4), (posTop += 12);
        if (j == 3) (posLeft += 37), (posTop += 12);
        if (j == 4) {
          (posLeft += 16), (posTop += 35);
          if (i === 2) posLeft += 10;
          if (i === 3) posLeft += 6;
        }
        if (j == 5) (posLeft += 21), (posTop += 25);
        await this.addImageObj(
          parseInt(index++),
          AVATAR_OBJECT,
          {
            left: posLeft,
            top: posTop,
          },
          j === 5 ? 0 : i * 5 + j + 1,
          false
        );
      }
    }
  }

  async addTextBoxWithImage(
    index,
    text,
    type,
    options,
    mode = 0,
    isClone = false,
    selectable = true
  ) {
    let imageUrl;
    let currentOptions = {
      ...options,
      fontSize: 17,
      fill: "white",
      width: 140,
      height: 140,
      textAlign: "center",
      hasControls: false,
    };
    if (type === TEXT_GROUP_CRATOR) {
      imageUrl = "/assets/images/crater.png";
      currentOptions.width = 70;
      currentOptions.height = 70;
      currentOptions.fontSize = 10;
    } else if (type === TEXT_GROUP_ASTEROID) {
      if (mode === 0) imageUrl = "/assets/images/Asteroid-1.png";
      if (mode === 1) imageUrl = "/assets/images/Asteroid-2.png";
      if (mode === 2) imageUrl = "/assets/images/Asteroid-3.png";
      currentOptions.fill = "black";
    } else if (type === TEXT_GROUP_FLAME) {
      if (mode === 0) imageUrl = "/assets/images/Flame-1.png";
      if (mode === 1) imageUrl = "/assets/images/Flame-2.png";
      if (mode === 2) imageUrl = "/assets/images/Flame-3.png";
      currentOptions.width = 110;
      currentOptions.height = 110;
      currentOptions.fontSize = 17;
    }

    const _that = this;

    const imageObj = await this.addImage(imageUrl, {
      ...currentOptions,
      left: 0,
      top: 0,
      lockMovementX: true,
      lockMovementY: true,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    this.canvas.add(imageObj);

    const textBoxObj = this.addTextBox(text, {
      ...currentOptions,
      left: 0,
      top: 0,
      width: currentOptions.width - currentOptions.width / 5,
      originX: "center",
      originY: "center",
      lockMovementX: true,
      lockMovementY: true,
      selectable: false,
      breakWords: true,
      fontFamily: FONT_FAMILY_DYNAMIC,
    });

    this.canvas.add(textBoxObj);

    const overlayObj = new fabric.Rect({
      ...currentOptions,
      top: 0,
      left: 0,
      originX: "center",
      originY: "center",
      fill: "rgba(169,169,169, 0.4)",
      selectable: false,
      hoverCursor: "default",
      stroke: "rgb(128,0,0)",
      strokeWidth: 1,
      visible: !selectable,
    });
    this.canvas.add(overlayObj);
    imageObj.layerType = "Image";
    textBoxObj.backObj = imageObj;
    textBoxObj.backObj.imageUrl = imageUrl;
    textBoxObj.overlayObj = overlayObj;
    textBoxObj.isClone = isClone;
    textBoxObj.set({
      selectable: selectable,
      hoverCursor: selectable ? "pointer" : "default",
    });
    textBoxObj.backObj.set({
      selectable: selectable,
      hoverCursor: selectable ? "pointer" : "default",
    });
    textBoxObj.originOptions = currentOptions;
    textBoxObj.mode = mode;

    //group all the objects
    textBoxObj.grouping = function () {
      if (!textBoxObj.groupObj) {
        const groupObj = new fabric.Group(
          [textBoxObj.backObj, textBoxObj, textBoxObj.overlayObj],
          currentOptions
        );
        _that.canvas.add(groupObj);
        textBoxObj.groupObj = groupObj;
        groupObj.textBoxObj = textBoxObj;
      } else {
        if (textBoxObj.text.length) {
          textBoxObj.groupObj.addWithUpdate(textBoxObj);
          _that.canvas.bringToFront(textBoxObj.groupObj);
          textBoxObj.groupObj.bringToFront();
        }
      }

      textBoxObj.groupObj.set({
        selectable: selectable,
        hoverCursor: selectable ? "pointer" : "default",
      });
      // if (!isClone) {
      _that.bindTextGroupEditing(textBoxObj, currentOptions, true);
      // }
    };
    textBoxObj.grouping();

    textBoxObj.index = index;
    textBoxObj.itemType = type;
    this.nodes[index] = textBoxObj;
    textBoxObj.on("editing:exited", function () {
      textBoxObj.grouping();

      if (textBoxObj.text.length) {
        dispatchUpdating(_that, [
          {
            ...textBoxObj,
            selectable: false,
          },
        ]);
      }
    });
    return textBoxObj;
  }

  async addTextBoxWithTransparentRect(index, text, options, selectable = true) {
    let currentOptions = options;
    const _that = this;

    const rectObj = new fabric.Rect({
      ...options,
      top: 0,
      left: 0,
      fill: "rgba(0,0,0,0)",
      selectable: false,
    });
    this.canvas.add(rectObj);

    const textBoxObj = this.addTextBox(text, {
      ...options,
      left: 0,
      top: 0,
      width: options.width,
      height: options.height / 2,
      selectable: false,
      breakWords: true,
      fontFamily: FONT_FAMILY_DYNAMIC,
    });

    this.canvas.add(textBoxObj);

    const overlayObj = new fabric.Rect({
      ...currentOptions,
      top: 0,
      left: 0,
      fill: "rgba(169,169,169, 0.4)",
      selectable: false,
      hoverCursor: "default",
      stroke: "rgb(128,0,0)",
      strokeWidth: 1,
      visible: !selectable,
    });
    this.canvas.add(overlayObj);

    textBoxObj.backObj = rectObj;
    textBoxObj.isClone = false;
    textBoxObj.originOptions = options;
    textBoxObj.overlayObj = overlayObj;
    textBoxObj.set({
      selectable: selectable,
      hoverCursor: selectable ? "pointer" : "default",
    });

    textBoxObj.grouping = function () {
      if (!textBoxObj.groupObj) {
        const groupObj = new fabric.Group(
          [textBoxObj.backObj, textBoxObj, textBoxObj.overlayObj],
          currentOptions
        );
        _that.canvas.add(groupObj);
        textBoxObj.groupObj = groupObj;
        groupObj.textBoxObj = textBoxObj;
      } else {
        if (textBoxObj.text.length) {
          textBoxObj.groupObj.addWithUpdate(textBoxObj);
          _that.canvas.bringToFront(textBoxObj.groupObj);
          textBoxObj.groupObj.bringToFront();
        }
      }
      textBoxObj.groupObj.set("selectable", false);
      _that.bindTextGroupEditing(textBoxObj, currentOptions, false);
    };
    textBoxObj.grouping();

    textBoxObj.index = index;
    textBoxObj.itemType = TEXT_GROUP_TRANSRECT;
    this.nodes[index] = textBoxObj;

    textBoxObj.on("editing:exited", function () {
      textBoxObj.grouping();

      if (textBoxObj.text.length) {
        dispatchUpdating(_that, [
          {
            ...textBoxObj,
            selectable: false,
          },
        ]);
      }
    });
    return textBoxObj;
  }

  async addStack(index, left, top, width = 757, height = 592) {
    // Add Stack Image
    const imageUrl = "/assets/images/stack.png";
    const imageObj = await this.addImage(imageUrl, {
      left: left,
      top: top,
      width: width,
      height: height,
      selectable: false,
      hoverCursor: "default",
    });

    this.canvas.add(imageObj);

    // Add clickable links
    this.addClickableRect("https://www.facebook.com", {
      left: left + (width / 757.0) * 38,
      top: top + (height / 592.0) * 36,
      width: (width / 757.0) * 180,
      height: (height / 757.0) * 25,
      selectable: false,
    });

    // Add text box
    this.addTextBoxWithTransparentRect(index + 0, placeHolderText, {
      left: left + (width / 757.0) * 37 + 9,
      top: top + (height / 592.0) * 170 + 12,
      width: (width / 757.0) * 300,
      height: (height / 592.0) * 120,
      fontSize: (height / 592.0) * 20,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
    });

    this.addTextBoxWithTransparentRect(index + 1, placeHolderText, {
      left: left + (width / 757.0) * 387 + 9,
      top: top + (height / 592.0) * 400 + 12,
      width: (width / 757.0) * 300,
      height: (height / 592.0) * 120,
      fontSize: (height / 592.0) * 20,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
    });

    // Add text box with image
    this.addTextBoxWithImage(index + 2, placeHolderText, TEXT_GROUP_CRATOR, {
      left: left + (width / 757.0) * 489,
      top: top + (height / 592.0) * 119,
    });
  }

  on(name, callback) {
    this.parentDiv.addEventListener(name, callback);
  }

  saveBeforeState(e) {
    let target = e.target;
    if (
      target &&
      (target.type == "textbox" || target.textBoxObj.type == "textbox")
    ) {
      target = target.textBoxObj.type == "textbox" ? target.textBoxObj : target;
      this.beforeStates = {
        text: target.text,
      };
    }
  }

  getObjectsStates(objects) {
    let states = [];
    objects.forEach((item) => {
      let state = {};
      if (item.type == "textbox") {
        state.text = item.text;
      } else {
        state.left = item.left;
        state.top = item.top;
      }
      state.index = this.canvas.getObjects().indexOf(item);
      states.push(state);
    });

    return states;
  }

  addToHistory(opt) {
    let target = opt.target;
    let index = this.canvas.getObjects().indexOf(target);
    let type = target.type;
    let id = target.itemId;
    if (opt.action == "drag") {
      let oldState = {
        left: opt.transform.original.left,
        top: opt.transform.original.top,
      };
      let newState = {
        left: target.left,
        top: target.top,
      };
      if (type == "activeSelection") {
        let oStates = [];
        let nStates = [];
        let objects = target.getObjects();
        objects.forEach((object) => {
          let oState = {
            object: object,
            left: oldState.left + target.getScaledWidth() / 2 + object.left,
            top: oldState.top + target.getScaledHeight() / 2 + object.top,
          };
          let nState = {
            object: object,
            left: newState.left + target.getScaledWidth() / 2 + object.left,
            top: newState.top + target.getScaledHeight() / 2 + object.top,
          };
          oStates.push(oState);
          nStates.push(nState);
        });
        oldState = oStates;
        newState = nStates;
      }
      let history = {
        object: target,
        action: opt.action,
        oldState: oldState,
        newState: newState,
        type: type,
        index: index,
        id: id,
      };
      this.actionHistory.push(history);
    } else if (
      target &&
      opt.target.type == "textbox" &&
      Object.keys(this.beforeStates).length
    ) {
      let newState = {
        text: target.text,
      };
      let history = {
        action: "text-changed",
        oldState: this.beforeStates,
        newState: newState,
        type: type,
        index: index,
        id: id,
      };
      this.actionHistory.push(history);
      this.beforeStates = {};
    }
  }

  bindTextGroupEditing(textBoxObj, options, isMovable) {
    const _that = this;

    function editTextBox() {
      textBoxObj.groupObj._restoreObjectsState();
      if (isMovable) {
        options.left = textBoxObj.groupObj.left;
        options.top = textBoxObj.groupObj.top;
      }

      // _that.canvas.remove(textBoxObj.groupObj);
      textBoxObj.groupObj.remove(textBoxObj);

      _that.canvas.setActiveObject(textBoxObj);
      textBoxObj.enterEditing();
    }

    textBoxObj.groupObj.on("mousedblclick", function (e) {
      // console.log(
      //   "GroupObj DoubleClicked!",
      //   textBoxObj.editable,
      //   textBoxObj.selectable
      // );
      if (textBoxObj.editable && textBoxObj.selectable !== false) {
        _that.saveBeforeState(e);
        editTextBox();
        textBoxObj.enableEditOnNextClick = true;
        setTimeout(function () {
          textBoxObj.enableEditOnNextClick = false;
        }, 500);
      }
    });
    textBoxObj.groupObj.on("mousedown", function () {
      if (textBoxObj.enableEditOnNextClick) {
        editTextBox();
      }
    });
    textBoxObj.backObj.on("mousedblclick", function () {
      // console.log(
      //   "BackObj DoubleClicked!",
      //   textBoxObj.editable,
      //   textBoxObj.selectable
      // );
      if (textBoxObj.editable && textBoxObj.selectable !== false) {
        editTextBox();
        textBoxObj.enableEditOnNextClick = true;
        setTimeout(function () {
          textBoxObj.enableEditOnNextClick = false;
        }, 500);
      }
    });
    textBoxObj.backObj.on("mousedown", function () {
      if (textBoxObj.enableEditOnNextClick) {
        editTextBox();
      }
    });
  }

  async createNode(detail) {
    console.log("Creating Node: ", detail.index);
    let object;
    if (
      detail.type === TEXT_GROUP_CRATOR ||
      detail.type === TEXT_GROUP_FLAME ||
      detail.type === TEXT_GROUP_ASTEROID
    ) {
      object = await this.addTextBoxWithImage(
        detail.index,
        detail.text,
        detail.type,
        {
          left: detail.position.left,
          top: detail.position.top,
          visible: detail.visible !== false,
        },
        detail.mode,
        detail.isClone && this.isInClonerPosition(detail),
        detail.selectable
      );
    } else {
      object = await this.addImageObj(
        detail.index,
        detail.type,
        {
          left: detail.position.left,
          top: detail.position.top,
          visible: detail.visible !== false,
        },
        detail.mode,
        detail.isClone && this.isInClonerPosition(detail),
        detail.selectable
      );
    }
    return object;
  }

  async updateObj(detail) {
    console.log("```````Updating", detail.index);
    let node = this.nodes[detail.index];
    // console.log(detail.visible,detail.index, node);
    if (node) {
      // Position
      if (node.groupObj) {
        node.groupObj.left = detail.position.left;
        node.groupObj.top = detail.position.top;
      } else {
        node.left = detail.position.left;
        node.top = detail.position.top;
      }

      // Text
      if (node.groupObj && node !== this.textBoxObjInEdit)
        node.text = detail.text;

      // Selectable

      node.set({
        selectable: detail.selectable !== false,
        hoverCursor: detail.selectable !== false ? "pointer" : "default",
      });
      if (node.itemType !== TEXT_GROUP_TRANSRECT) {
        if (node.groupObj) {
          node.groupObj.set({
            selectable: detail.selectable !== false,
            hoverCursor: detail.selectable !== false ? "pointer" : "default",
          });
        }
        if (node.backObj)
          node.backObj.set({
            selectable: detail.selectable !== false,
            hoverCursor: detail.selectable !== false ? "pointer" : "default",
          });
      } else {
        if (node.groupObj)
          node.groupObj.set({
            hoverCursor: detail.selectable !== false ? "pointer" : "default",
          });
      }
      if (node.overlayObj)
        node.overlayObj.visible = detail.selectable === false;

      let visibility = true;
      if (IMAGE_OBJECTS.includes(node.itemType)) {
        if (detail.selectable === false) {
          node.strokeWidth = 10;
          node.stroke = "red";
          node.backgroundColor = "#fff";
          node.opacity = 0.6;
          if (detail.isClone || this.isInClonerPosition(detail)) {
            node.visible = false;
            node.evented = false;
            // this.creatCloner(node);
            visibility = false;
          } else {
            node.visible = true;
            node.evented = true;
          }
        } else {
          node.strokeWidth = 4;
          node.stroke = null;
          node.backgroundColor = null;
          node.opacity = 1;
        }
      }
      console.log("----", node);
      // isClone
      if (node.isClone !== detail.isClone) {
        node.isClone = detail.isClone;
        if (node.groupObj)
          this.bindTextGroupEditing(node, node.originOptions, true);
      }

      if (node.overlayObj) {
        if (
          detail.selectable == false &&
          (detail.isClone || this.isInClonerPosition(detail))
        ) {
          node.group.evented = false;
          node.group.visible = false;
          node.visible = false;
          node.backObj.visible = false;
          node.overlayObj.visible = false;
          // this.creatCloner(node, false);
          visibility = false;
        } else {
          node.group.evented = true;
          node.group.visible = true;
          node.visible = true;
          node.backObj.visible = true;
          if (typeof detail.selectable != "undefined") {
            node.overlayObj.visible = !detail.selectable;
          } else {
            node.overlayObj.visible = false;
          }
        }
      }

      // Visibility
      if (visibility) {
        node.visible = detail.visible !== false;
        if (node.groupObj) node.groupObj.visible = detail.visible !== false;
        if (node.backObj) node.backObj.visible = detail.visible !== false;
      }

      // mode
      node.mode = detail.mode;

      // node.set("editable", detail.selectable !== false);
      // Set Dirty
      if (node.groupObj) {
        node.groupObj.dirty = true;
        node.groupObj.setCoords();
      }
      node.dirty = true;
      node.setCoords();
    } else {
      console.log("@@@Other Browser Creating New Node: ", detail);
      await this.createNode(detail);
    }
    this.keepTopEditing();
  }

  keepTopEditing() {
    let activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.backObj) {
        this.canvas.bringToFront(activeObject.backObj);
      }
      this.canvas.bringToFront(activeObject);
    }
    if (this.textBoxObjInEdit) {
      if (this.textBoxObjInEdit.backObj) {
        this.canvas.bringToFront(this.textBoxObjInEdit.groupObj);
        this.textBoxObjInEdit.groupObj.bringToFront();
      }
      this.textBoxObjInEdit.dirty = true;
    }
  }

  isInClonerPosition(detail) {
    let position = {};
    position.left = detail.position.left;
    position.top = detail.position.top;
    let toReturn = false;
    let clonerPosition = null;
    if (detail.type == TEXT_GROUP_ASTEROID) {
      clonerPosition = CLONERS_POSITIONS.asteroid.concat(
        CLONERS_POSITIONS.flame
      );
    } else if (detail.type == TEXT_GROUP_FLAME) {
      clonerPosition = CLONERS_POSITIONS.flame.concat(
        CLONERS_POSITIONS.asteroid
      );
    } else if (detail.type == FLAG_OBJECT) {
      clonerPosition = CLONERS_POSITIONS.flag;
    } else {
      return false;
    }
    console.log(detail);
    console.log(position);
    clonerPosition.forEach((pos) => {
      if (
        Math.abs(position.left - pos.left) <= 15 &&
        Math.abs(position.top - pos.top) <= 15
      ) {
        toReturn = true;
      }
    });
    console.log("isInClonerPosition: ", toReturn);
    return toReturn;
  }

  async creatCloner(node) {
    let detail = node.toJSON([
      "itemType",
      "originOptions",
      "selectable",
      "index",
      "mode",
    ]);
    // node.isClone = false;
    let actions = [];
    const isInClonerPosition = this.isInClonerPosition({
      type: detail.itemId,
      position: {
        left: detail.originOptions.left,
        top: detail.originOptions.top,
      },
    });
    let nodeObject = await this.createNode({
      index: uuidv4(),
      type: detail.itemType,
      text: placeHolderText,
      position: {
        left: detail.originOptions.left,
        top: detail.originOptions.top,
      },
      mode: (detail.mode + 1) % 3,
      isClone: isInClonerPosition,
    });
    if (nodeObject) {
      actions.push(nodeObject);
      dispatchUpdating(this, actions);

      this.keepTopEditing();
      this.canvas.requestRenderAll();
    }
  }
}
