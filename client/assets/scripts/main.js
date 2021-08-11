const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const server_url = "https://miro-poster.herokuapp.com";

let asteroid_mode = 0;
let flame_mode = 0;

async function init(stage, callback) {
  stage.initStage();

  let local_json = localStorage.getItem("local_json");

  if (local_json && false) {
    local_json = JSON.parse(local_json);
    stage.loadFromJSON(local_json, () => {
      bindEvents(stage, callback);
    });
  } else {
    stage.loadFonts(() => {
      // console.log("font loaded");
      freshLoad(stage, () => {
        bindEvents(stage, callback);
      });
    });
  }
}

async function bindEvents(stage, callback) {
  $(document).on("keypress", function (event) {
    var zoom = stage.canvas.getZoom();
    if (event.target.type !== "textarea") {
      // - key
      if (event.key === "-") {
        zoom /= 1.25;
        if (zoom < 0.08) zoom = 0.08;
        stage.canvas.zoomToPoint(
          { x: stage.mouseOffsetX, y: stage.mouseOffsetY },
          zoom
        );
        stage.setActiveSelectionOnZoom();
      }
      // + or = key
      if (event.key === "+" || event.key === "=") {
        zoom *= 1.25;
        if (zoom > 10) zoom = 10;
        stage.canvas.zoomToPoint(
          { x: stage.mouseOffsetX, y: stage.mouseOffsetY },
          zoom
        );
        stage.setActiveSelectionOnZoom();
      }
    }
  });
  $(document).on("keydown", function (event) {
    if (event.target.type !== "textarea") {
      // Delete Key
      if (event.keyCode === 46 || event.keyCode === 8) {
        event.preventDefault();
        let activeObjects = stage.canvas.getActiveObjects();
        stage.canvas.discardActiveObject();
        let actions = [];
        // console.log("--------");
        // console.log(activeObjects);
        for (let item of activeObjects) {
          if (item.textBoxObj && !item.textBoxObj.isClone) {
            var objectsInGroup = item.getObjects();
            objectsInGroup.forEach(function (object) {
              object.visible = false;
            });
            item.visible = false;
            actions.push(item.textBoxObj);
          } else if (item.itemType === FLAG_OBJECT && !item.isClone) {
            item.visible = false;
            actions.push(item);
          }
        }
        stage.actionHistory.push(actions);
        dispatchUpdating(stage, actions);
        stage.canvas.requestRenderAll();
      }
      // Ctrl + Z
      if (
        event.keyCode === 90 &&
        (event.ctrlKey || event.metaKey) &&
        stage.actionHistory.length
      ) {
        let lastAction = stage.actionHistory[stage.actionHistory.length - 1];
        if (typeof lastAction.action == "undefined") {
          for (let textBoxObj of lastAction) {
            textBoxObj.visible = true;
            if (textBoxObj.groupObj) textBoxObj.groupObj.visible = true;
            if (textBoxObj.backObj) textBoxObj.backObj.visible = true;
          }
          stage.actionHistory.pop();
          stage.canvas.requestRenderAll();

          dispatchUpdating(stage, lastAction);
        } else {
          let activeObjects = [];
          if (lastAction.action == "drag") {
            let oldState = lastAction.oldState;
            if (lastAction.type == "activeSelection") {
              stage.canvas.discardActiveObject().renderAll();
              let states = lastAction.oldState;
              let objects = [];
              states.forEach(function (state) {
                state.object.left = state.left;
                state.object.top = state.top;
                state.object.setCoords();
                objects.push(state.object);
              });
              activeObjects = objects;
            } else {
              let object = lastAction.object;
              object.left = oldState.left;
              object.top = oldState.top;
              object.setCoords();
              activeObjects.push(object);
              stage.canvas.discardActiveObject();
            }
            stage.actionHistory.pop();
            stage.canvas.renderAll();
          } else if (lastAction.action == "text-changed") {
            let oldState = lastAction.oldState;
            let object = stage.canvas.item(lastAction.index);
            stage.canvas.getObjects().forEach(function (obj) {
              if (obj.itemId == lastAction.id) {
                object = obj;
              }
            });
            object.text = oldState.text == "" ? placeHolderText : oldState.text;
            object.dirty = true;
            object.group.dirty = true;
            object.setCoords();
            stage.actionHistory.pop();
            stage.canvas.renderAll();
            activeObjects.push(object.group);
          }

          dispatchUndo(activeObjects, stage);
        }
      }
      // spacebar key
      if (event.keyCode === 32) {
        if (!stage.pressingSpace) {
          // console.log("space keydown");
          stage.canvas.defaultCursor = "grab";
          stage.canvas.getObjects().forEach(function (obj) {
            obj.evented = false;
          });
          stage.canvas.renderAll();
        }
        stage.pressingSpace = true;
      }
    }
  });
  $(document).on("keyup", function (event) {
    if (event.target.type !== "textarea") {
      // spacebar key
      if (event.keyCode === 32) {
        stage.pressingSpace = false;
        stage.draggingOnClick = 0;
        // console.log("space keyup");
        stage.canvas.defaultCursor = "default";
        stage.canvas.getObjects().forEach(function (obj) {
          obj.evented = true;
        });
      }
    }
  });

  window.onresize = () => {
    stage.fitResponsiveCanvas();
  };
  window.onblur = () => {
    stage.pressingSpace = false;
  };
  window.addEventListener("beforeunload", function (e) {
    // e.preventDefault();
    stage.leaveAllSelected();
    // e.returnValue = "";
  });

  callback && callback();
}

async function dispatchUndo(objects, stage) {
  let actions = [];
  for (let item of objects) {
    if (item.textBoxObj) {
      if (item.textBoxObj.isClone) {
        //Clone New to existing position
        let node = await stage.createNode({
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
        actions.push(node);

        // Make Normal
        item.textBoxObj.originOptions.left = item.textBoxObj.groupObj.left;
        item.textBoxObj.originOptions.top = item.textBoxObj.groupObj.top;
        stage.bindTextGroupEditing(
          item.textBoxObj,
          item.textBoxObj.originOptions,
          true
        );
        item.textBoxObj.isClone = false;
      }
      actions.push({
        ...item.textBoxObj,
      });
    } else if (item.itemType) {
      if (item.isClone) {
        //Clone New to existing position
        let node = await stage.createNode({
          index: uuidv4(),
          type: item.itemType,
          position: {
            left: item.originOptions.left,
            top: item.originOptions.top,
          },
          mode: item.mode,
          isClone: true,
        });
        actions.push(node);

        // Make Normal
        item.originOptions.left = item.left;
        item.originOptions.top = item.top;
        item.isClone = false;
      }
      actions.push({
        ...item,
      });
    }
  }
  if (actions.length) {
    dispatchUpdating(stage, actions);
  }
}

async function freshLoad(stage, callback) {
  let promises = [];
  let index = 0;

  // Add main image to canvas
  stage.addBackgroundImage("/assets/images/Background-V5-min.svg");

  // Add template Images
  promises.push(
    stage.addTemplateImage(
      {
        left: 1207.5,
        top: 2178.5,
        width: 1578,
        height: 867.25,
      },
      "/assets/images/1-min.png"
    )
  );

  promises.push(
    stage.addTemplateImage(
      {
        left: 8913.575923120652,
        top: 1473.457782774808,
        width: 740,
        height: 755.5,
      },
      "/assets/images/mars-min.png"
    )
  );

  promises.push(
    stage.addTemplateImage(
      {
        left: 6909.81721334082,
        top: 3253.7861888011194,
        width: 487.25,
        height: 326.25,
      },
      "/assets/images/rocket-min.png"
    )
  );
  promises.push(
    stage.addTemplateImage(
      {
        left: 5714.320711262808,
        top: 3525.1770782978333,
        width: 1130.5,
        height: 1130.75,
      },
      "/assets/images/planet-min.png"
    )
  );

  promises.push(
    stage.addTemplateImage(
      {
        left: 3174,
        top: 3038,
        width: 1888,
        height: 1919,
      },
      "/assets/images/3-min.png"
    )
  );

  promises.push(
    stage.addTemplateImage(
      {
        left: 8416,
        top: 4432,
        width: 2109,
        height: 1219,
      },
      "/assets/images/5-min.png"
    )
  );

  promises.push(
    stage.addTemplateImage(
      {
        left: 10808,
        top: 2777,
        width: 326.25,
        height: 452,
      },
      "/assets/images/6-min.png"
    )
  );

  promises.push(
    stage.addTemplateImage(
      {
        left: 12490,
        top: 2105,
        width: 1194.5,
        height: 1048.25,
      },
      "/assets/images/7-min.png"
    )
  );

  await Promise.all(promises);
  promises = [];
  stage.addSvg(
    {
      left: 5793,
      top: 3458,
      width: 397,
      height: 224.75,
      selectable: false,
      evented: false,
    },
    "/assets/images/toolbox.svg"
  );
  stage.addClickableRect("https://recessk.it/RR-002-AppleMusic", {
    left: 1854,
    top: 2987,
    width: 64,
    height: 12,
    selectable: false,
  });
  stage.addClickableRect("https://recessk.it/RR-002-Spotify", {
    left: 1930,
    top: 2987,
    width: 40,
    height: 12,
    selectable: false,
  });
  stage.addClickableRect("https://recessk.it/RR-002-Background", {
    left: 2105,
    top: 2987,
    width: 40,
    height: 12,
    selectable: false,
  });

  // Add Stacks
  promises.push(stage.addStack(parseInt(index), 8478, 4500, 320, 248));
  index += 3;
  promises.push(stage.addStack(parseInt(index), 8478, 4930, 320, 248));
  index += 3;
  promises.push(stage.addStack(parseInt(index), 8478, 5360, 320, 248));
  index += 3;

  promises.push(stage.addStack(parseInt(index), 9032, 4500, 320, 248));
  index += 3;
  promises.push(stage.addStack(parseInt(index), 9032, 4930, 320, 248));
  index += 3;
  promises.push(stage.addStack(parseInt(index), 9032, 5360, 320, 248));
  index += 3;

  promises.push(stage.addStack(parseInt(index), 9586, 4500, 320, 248));
  index += 3;
  promises.push(stage.addStack(parseInt(index), 9586, 4930, 320, 248));
  index += 3;
  promises.push(stage.addStack(parseInt(index), 9586, 5360, 320, 248));
  index += 3;

  promises.push(stage.addStack(parseInt(index), 10140, 4500, 320, 248));
  index += 3;
  promises.push(stage.addStack(parseInt(index), 10140, 4930, 320, 248));
  index += 3;

  await Promise.all(promises);
  promises = [];

  // Crew Check in
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (i != 2 || j != 3) {
        let left = 1720 + i * 250;
        let top = 3647 + j * 123;
        promises.push(
          stage.addTextBoxWithTransparentRect(
            parseInt(index),
            shortPlaceHolderText,
            {
              left: left,
              top: top,
              width: 120,
              height: 15,
              fontWeight: "normal",
              fontSize: 12,
              hasControls: false,
              lockMovementX: true,
              lockMovementY: true,
              fill: "#e94333",
              short: true,
            }
          )
        );
        index += 1;
      }
    }
  }
  // Pre-lift Off Procedure
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (i != 2 || j != 3) {
        let left = 3276 + i * 672;
        let top = 3197 + j * 493;
        promises.push(
          stage.addTextBoxWithTransparentRect(
            parseInt(index),
            placeHolderText,
            {
              left: left,
              top: top,
              width: 150,
              height: 35,
              fontWeight: "normal",
              fontSize: 6,
              hasControls: false,
              lockMovementX: true,
              lockMovementY: true,
              fill: "#e94333",
            }
          )
        );
        index += 1;
      }
    }
  }
  // Personal Improvement Protocol
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      if (i != 3 || j != 2) {
        let left = 12511 + i * 335;
        let top = 2255 + j * 379;
        promises.push(
          stage.addTextBoxWithTransparentRect(
            parseInt(index),
            placeHolderText,
            {
              left: left,
              top: top,
              width: 160,
              height: 122,
              fontWeight: "normal",
              fontSize: 6,
              hasControls: false,
              lockMovementX: true,
              lockMovementY: true,
              fill: "#e94333",
            }
          )
        );
        index += 1;
      }
    }
  }

  // Team Action Plan
  for (let i = 0; i < 2; i++) {
    let left = 10855;
    let top = 2942 + i * 162;
    promises.push(
      stage.addTextBoxWithTransparentRect(parseInt(index), placeHolderText, {
        left: left,
        top: top,
        width: 275,
        height: 110,
        fontWeight: "normal",
        fontSize: 8,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        fill: "#e94333",
      })
    );
    index += 1;
  }

  await Promise.all(promises);

  promises = [];
  for (let i = 0; i < 2; i++) {
    // Asteroid Clone
    CLONERS_POSITIONS.asteroid.forEach((position) => {
      promises.push(
        stage.addTextBoxWithImage(
          parseInt(index++),
          placeHolderText,
          TEXT_GROUP_ASTEROID,
          position,
          asteroid_mode++ % 3,
          true
        )
      );
    });
    // Flame Clone
    CLONERS_POSITIONS.flame.forEach((position) => {
      promises.push(
        stage.addTextBoxWithImage(
          parseInt(index++),
          placeHolderText,
          TEXT_GROUP_FLAME,
          position,
          flame_mode++ % 3,
          true
        )
      );
    });
  }

  // Flag Clones
  let mode = 0;
  CLONERS_POSITIONS.flag.forEach((position, i) => {
    promises.push(
      stage.addImageObj(parseInt(index++), FLAG_OBJECT, position, mode, true)
    );
    mode++;
    if (mode >= 3) {
      mode = 0;
    }
  });
  await Promise.all(promises);

  // Badge Objects
  for (let i = 0; i < 4; i++) {
    await stage.addImageObj(
      parseInt(index++),
      BADGE_OBJECT,
      {
        left: 12387,
        top: 4445,
      },
      0,
      false
    );
    await stage.addImageObj(
      parseInt(index++),
      BADGE_OBJECT,
      {
        left: 12567,
        top: 4445,
      },
      0,
      false
    );
  }
  for (let i = 0; i < 3; i++) {
    await stage.addImageObj(
      parseInt(index++),
      BADGE_OBJECT,
      {
        left: 12477,
        top: 4445,
      },
      0,
      false
    );
  }
  // Avatar Stacks
  for (let i = 0; i < 11; i++) {
    await stage.addAvatarStacks(parseInt(index), {
      left: 3468 + (i % 3) * 672,
      top: 3159 + Math.floor(i / 3) * 492,
    });
    index += 36;
  }

  stage.canvas.requestRenderAll();

  // Set Initial View point
  const x = 500;
  const y = 1300;
  stage.canvas.setZoom(0.7);
  stage.canvas.absolutePan({ x: x, y: y });

  callback && callback();
}

function initNodes(stage, channelName) {
  $.getJSON(`${server_url}/board/${channelName}`, function (data) {
    console.log("*** Initing Canvas Nodes: ", data);
    let dirty = false;
    console.log(data);
    for (let detail of data.list) {
      let state = JSON.parse(detail.state);
      stage.updateObj({
        ...state,
        index: detail.cardIndex,
      });
      dirty = true;
    }
    if (dirty) {
      stage.canvas.requestRenderAll();
    }
    stage.loading = false;

    showByID("#spinner-wrapper", false);
    showByID("#signInFormWrapper", false);
  });
}

async function updateNode(stage, action) {
  // console.log("Updating Canvas Node Element: ", action);
  let promises = [];
  for (let detail of action) {
    promises.push(stage.updateObj(detail));
  }
  await Promise.all(promises);
  if (action.length) {
    stage.keepTopEditing();
    stage.canvas.renderAll();
  }
}

function dispatchUpdating(stage, action) {
  console.log("***dispatchUpdating: ", action);
  stage.parentDiv.dispatchEvent(
    new CustomEvent("updateNode", {
      detail: action.map((obj) => ({
        index: obj.index,
        type: obj.itemType,
        position: {
          left: obj.groupObj
            ? obj.groupObj.group
              ? obj.groupObj.left +
                obj.groupObj.group.left +
                obj.groupObj.group.width / 2
              : obj.groupObj.left
            : obj.group
            ? obj.left + obj.group.left + obj.group.width / 2
            : obj.left,
          top: obj.groupObj
            ? obj.groupObj.group
              ? obj.groupObj.top +
                obj.groupObj.group.top +
                obj.groupObj.group.height / 2
              : obj.groupObj.top
            : obj.group
            ? obj.top + obj.group.top + obj.group.height / 2
            : obj.top,
        },
        text: obj.text,
        mode: obj.mode,
        visible: obj.visible,
        selectable: obj.selectable,
        isClone: obj.isClone,
      })),
    })
  );
}

function navigate(index) {
  // console.log(index);
  let x, y;
  if (index === 1) (x = 500), (y = 1300);
  if (index === 2) (x = 600), (y = 2200);
  if (index === 3) (x = 1900), (y = 1800);
  if (index === 4) (x = 3700), (y = 2100);
  if (index === 5) (x = 5600), (y = 2800);
  if (index === 6) (x = 5500), (y = 820);
  if (index === 7) (x = 7000), (y = 1700);
  if (index === 8) (x = 8350), (y = 1200);
  if (index === 9) (x = 8200), (y = 2800);

  window.stage.canvas.setZoom(0.7);
  window.stage.canvas.absolutePan({ x: x, y: y });
}

/* Set the width of the sidebar to 250px (show it) */
function openNav() {
  document.getElementById("mySidepanel").style.width = "300px";
}

/* Set the width of the sidebar to 0 (hide it) */
function closeNav() {
  document.getElementById("mySidepanel").style.width = "0";
}
