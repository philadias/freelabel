  // https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
  document.onkeyup = function(e) {
    if (e.which == 77) {  //M,m
      maskOnTraces();
    } else if (e.which == 66){  //B,b
      boundingBoxOn();
    } else if (e.which == 84){  //B,b
      TraceOnTempCanvas();
    } else if (e.which == 80){  //P,p
      var element = document.getElementById('dtool');
      element.value = "pencil"
      var event = new Event('change');
      element.dispatchEvent(event);
    } else if (e.which == 69){  //E,e
      var element = document.getElementById('dtool');
      element.value = "eraser"
      var event = new Event('change');
      element.dispatchEvent(event);
    } else if (e.which == 76){  //L,l
      var element = document.getElementById('dtool');
      element.value = "line"
      var event = new Event('change');
      element.dispatchEvent(event);
    } else if (e.which == 82 || e.which == 71){  //R,r or G,g
      callRefine();
    }
    else if (e.which == 38){//up arrow
      e.preventDefault(); // Prevent the default action
      var element = document.getElementById('dsize');
      if(element.value < 8)
        element.value = 2*element.value;
      else
        element.value = 1
      var event = new Event('change');
      element.dispatchEvent(event);
    }
    else if (e.which == 40){//down arrow
      e.preventDefault(); // Prevent the default action
      var element = document.getElementById('dsize');
      if(element.value > 1)
        element.value = (element.value)/2;
      else
        element.value = 8
      var event = new Event('change');
      element.dispatchEvent(event);
    }
   // else if (e.which == 9){//tab
   //    e.preventDefault(); // Prevent the default action
   //    var element = document.getElementById('dcolor');
   //    if(element.value > 21)
   //      element.value = 1;
   //    else
   //      element.value = 8;
   //    var event = new Event('change');
   //    element.dispatchEvent(event);
   //  }
  };

  window.addEventListener("keydown", function(e) {
      // space and arrow keys
      if([9,32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
          e.preventDefault();
      }
  }, false);


  function getRandomColor(){
    var letters = '0123456789ABCDEF';
    var color = '#';

    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;

  }

  function drawBoundingBox(){
    // if bounding box flag is ON, show each bbox for this image
    if(bboxOn == true && typeof bb != "undefined"){
      for (var j = 0; j < bb.length; j++) {
        contexto.beginPath();
        contexto.rect(bb[j][0], bb[j][1], bb[j][2], bb[j][3]);

        contexto.lineWidth = 2;
        contexto.strokeStyle = colorArray[j];
        contexto.stroke();
      }
    }

  }

  function changeImgTran()
  {
    // get image opacity and pointer (bottom canvas element)
    var tran = document.getElementById("dtran").value
    var img = document.getElementById("initial");

    // get mask opacity and pointer (bottom canvas element)
    var mask = document.getElementById("maskImg");
    var tranM = document.getElementById("dtranM").value

    // set corresponding opacity to the mask
    document.getElementById("maskImg").style.opacity = tranM;

    // update image on upper canvas
    contexto.clearRect(0,0,currentWidth,currentHeight);
    contexto.globalAlpha = tran;
    contexto.drawImage(img, 0, 0, currentWidth, currentHeight);
    contexto.globalAlpha = 1;

    // call bbox function **NEED TO INCLUDE AN IF FOR THE CASE OF FLOWERS HERE
    drawBoundingBox()

    // overlay mask on upper canvas if toggle is ON
    if (maskOn == true && mask){
      contexto.globalAlpha = tranM;
      contexto.drawImage(mask, 0, 0, currentWidth, currentHeight);
      contexto.globalAlpha = 1;
    }
  }

  function maskOnTraces()
  {
    // toggle flag that indicates whether mask should
    // overlay the upper canvas
    maskOn = !maskOn

    changeImgTran();
  }

  function boundingBoxOn()
  {
    // toggle flag that indicates whether bboxes should
    // be shown
    bboxOn = !bboxOn

    changeImgTran();
  }

  function TraceOnTempCanvas()
  {

    traceOn = !traceOn

    hiddenOrShow();
  }

  function hiddenOrShow()
  {
    if (traceOn == true){
      // hide trace by hidding contents of the elements
      temp_canvas.style.visibility="visible";  //hide the canvas element
    } else {
      // show the hidden elements in temp_canvas
      temp_canvas.style.visibility="hidden";
    }

  }

  function start() {
    startTime = new Date();
  };


  function end() {
    endTime = new Date();
    var timeDiff = endTime - startTime; // compute time interval in ms
    timeDiff = timeDiff - pauseInterval; // subtracts the pause interval
    // convert from ms to s
    timeDiff /= 1000;
    seconds = Math.round(timeDiff);

    // display time spent to user
    // var timee = "seconds you used for drawing: " + seconds + "; number of traces you used: " + trace_number;
    // document.getElementById("demo").innerHTML = timee ;

  }

  function pause() {
    // get current time, which is starting time for pause
    var pauseStart = new Date();

    // cover the webpage with 100% nav
    document.getElementById("myNav").style.width = "100%";

    // display dialog popup window
    //alert("Paused. Click OK to continue");
    reply_ = confirm("Paused. Click OK to continue");

    // if YES, cancel the nav
    if (reply_) {
        document.getElementById("myNav").style.width = "0%";
    } 
    else{
        alert("Please close black screen by yourself when you are ready later.")
    }


    // get time at which the user clicked on the button to continue
    var pauseEnd = new Date();

    // add this interval to the total of seconds at pause for the current image
    pauseInterval += ( pauseEnd - pauseStart);    

  }

  function hideButtons(){
      document.getElementById("btnNxtImg").style.visibility = "visible"
      document.getElementById("btnGTusr").style.visibility = "visible"
      document.getElementById("btnFinish").style.visibility = "hidden"
      document.getElementById("btnReload").style.visibility = "hidden"
      document.getElementById("btnPause").style.visibility = "hidden"
      document.getElementById("btnRefine").style.visibility = "hidden"          
  }

 
  //function handled with clear all traces on image
  function reloadImage()
  {
    // display dialog confirming that the user wants to clear all traces
    reply_ = confirm("Clear all traces, are you sure?");

    // if YES, reload image
    if (reply_) {
        loadImage();
        trace = [];
    }
  }

  function closeNav() {
    document.getElementById("myNav").style.width = "0%";
  }

  function callRefine(){
        // save current state of cursor (pencil or eraser)
        var currentCursor =  document.body.style.cursor
        // switch mouse cursor to loading
        document.body.style.cursor='wait';      
        // display "Refining.." icon
        document.getElementById("loadingIcon").style.display = "block";

        // hide Refine button to avoid double call
        document.getElementById("btnRefine").style.visibility = "hidden";          
        // hide Undo button and reactivate it only if traces.length > 0 
        document.getElementById("btnUndo").style.visibility = "hidden";

        // get pointer to image on bottom canvas
        var img = document.getElementById("initial");
        var img_size = [currentHeight, currentWidth];

        // increament counter of number of refinements performed
        callCnt +=1;
        
        // random ID for the output mask file (from https://gist.github.com/gordonbrander/2230317)
        var ID = Math.random().toString(36).substr(2, 9);

        // weight of traces, which defines the spacing between samples in RGR
        // var weight_ = document.getElementById("weightId").value;
        var weight_ = 9;

        // theta_m: regulates weight of color-similarity vs spatial-proximity
        // var m_ = document.getElementById("mId").value;
        var m_ = 1;

        if(gtFlag == true){
          var imgURL = gtArray[listGTIDs[i/3]];
        }
        else{
          var imgURL = imgArray[listIDs[i]];
        }


        // first an AJAX call to send all pending traces
        $.ajax({
          url: '/freelabel/refine/',
          type: 'POST',
          data: {"img": imgURL, "ID": ID, "img_size": img_size, "weight": weight_, "m": m_,'trace': traces},
          tryCount : 0,
          retryLimit : 3,          
          success: function(data){
       
              traces = new Array();

              // replace the mask on bottom canvas with new segmentation mask
              var pic = '/static/'+username+'/refined'+ID+'.png'
              lastUsrMask = pic;
              document.getElementById("maskImg").src = pic.replace();

              // wait for the mask to load
              document.getElementById("maskImg").onload = function(){
                // get opacity values of mask and image
                document.getElementById('dtranM').value = 0.5;                
                var tranM = document.getElementById('dtranM').value;
                var tran = document.getElementById("dtran").value

                // set opacity of bottom mask
                document.getElementById("maskImg").style.opacity = tranM;

                //after refine button, call back the img maskImg to normal status
                document.getElementById("maskImg").style.display = "inline";  //inline is default

                // update the upper canvas with image
                contexto.clearRect(0,0,currentWidth,currentHeight);
                contexto.globalAlpha = tran;
                contexto.drawImage(img, 0, 0, currentWidth, currentHeight);
                contexto.globalAlpha = 1;
                // draw bboxes on image
                drawBoundingBox()

                // if the mask toggle is ON, overlay mask on the upper canvas
                if (!maskOn)
                    maskOn = true;
                var mask = document.getElementById("maskImg");

                contexto.globalAlpha = tranM;
                contexto.drawImage(mask, 0, 0, currentWidth, currentHeight);
                contexto.globalAlpha = 1;

                // mouse cursor back to the corresponding tool icon
                document.body.style.cursor = currentCursor;
                // hide "Refining.." icon
                document.getElementById("loadingIcon").style.display = "none";
                document.getElementById("btnRefine").style.visibility = "visible"

                // compute accuracies for datasets with GT available
                if(datasetGT)                  
                  comparetoGT()
                //without our calling, do nothing
                document.getElementById("maskImg").onload = function(){}
              }
            },
            error : function(xhr, textStatus, errorThrown ) {
                this.tryCount++;
                if (this.tryCount <= this.retryLimit) {
                    //try again
                    $.ajax(this);
                    return;
                }     
                else{
                  alert("Server error, image will be reloaded. That will not affect your records, sorry about the inconvenience.")
                  
                  document.getElementById("btnRefine").style.visibility = "visible"         
                  // mouse cursor back to the corresponding tool icon
                  document.body.style.cursor = currentCursor;
                  // hide "Refining.." icon
                  document.getElementById("loadingIcon").style.display = "none";                  

                  window.location.reload(); //will automatically refresh until the end
                  return;
                }                 
            },
            timeout: 8000
          });
  }

 // function that handles the comparison to PASCAL ground truth segmentation
  function comparetoGT(){
    //for some reason, not accessing the global i within ajax success function if i dont copy here
    var i_ = i;
    // AJAX call to function "cmpGT(request)" in views.py
    $.ajax({
      url: '/freelabel/cmpGT/',
      type: 'POST',
      data: {"GT": gtArray[listIDs[i]],"ID": listIDs[i]},
      tryCount : 0,
      retryLimit : 3,      
      success: function(data) {
        var ids = [];
        accs = [];
        // non-filtered array of accuracies, i.e. also includes the 0.00 ones
        var allAccs = data.acc;
        // this is a pointer rather than a copy!!! That's why here we
        // have to push each element to a new array, rather than initializing
        // like ids = clsArray[listIDs[i_]]; . If we did that, it would change
        // clsArray[listIDs[i_]] itself and mess up the whole rest of the code!
        var cls_ = clsArray[listIDs[i_]]; 
        ids.push(0)
        accs[0] = allAccs[0]

        for (var k = 0, len = cls_.length; k < len; k++){
          ids.push(cls_[k])
          accs[k+1]= allAccs[cls_[k]]
        }

        // append avg acc (last element) too
        accs[accs.length] = allAccs[allAccs.length-1]

        // string containing full text to be shown with Accuracies
        var str = ''     

        // in case any accuracy is lower than 90, icon will be set to false
        toggleIcon(true);

        // reset it
        img_score = 0;

        // for each class/accuracy
        for (var i = 0, len = ids.length; i < len; i++) {
          acc_ = accs[i]

          // if accuracy for this class is higher than 90%, show in green; otherwise, in red
          if(acc_ > 90){           
            str = str + "<span style='color:#008000'>" + catArray[ids[i]] + ":" + acc_.toFixed(2) + "</span> <br> ";
          }
          else{
            str = str + "<span style='color:#FF0000'>" + catArray[ids[i]] + ":" + acc_.toFixed(2) + "</span> <br> ";
            if(i > 0) //exclude background
              toggleIcon(false);
          }

          // update corresponding progress bar, ignoring bkg
          // alert(["bar"+ids[i],acc_,prevaccs[i]])
          loadBar("bar"+ids[i],acc_,prevaccs[i]);
          scores[i] = getScore(acc_);

            // append score next to bar (except background)
            if(i > 0){
              document.getElementById("bar"+ids[i]).textContent = scores[i];
              img_score += getScore(acc_)
            }

            // update var with previous accs
            prevaccs[i] = acc_

        } 

        scoreStuff = "Score: " + img_score;
        document.getElementById("scoreId").textContent = scoreStuff;
        
        // last info in vector is the average accuracy across all classes
        acc_ = accs[accs.length-1]

        var strAvg = "Avg.: " + acc_.toFixed(2)
        strAvg = strAvg.bold()
        str = str + strAvg

        // update the HTML txt component with the string of accuracies
        document.getElementById("accId").innerHTML = str;
      },
      error : function(xhr, textStatus, errorThrown ) {
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
              //try again
              $.ajax(this);
              return;
          }     
          else{
            alert("Server error, image will be reloaded. That will not affect your records, sorry about the inconvenience.")
            window.location.reload(); //will automatically refresh until the end
            return;
          }                 
      },
      timeout: 3000
    });      

  }

  function init () {
    // Find the canvas element.
    if (!canvaso) {
      alert('Error: I cannot find the canvas element!');
      return;
    }

    if (!canvaso.getContext) {
      alert('Error: no canvas.getContext!');
      return;
    }

    // Get the 2D canvas context.
    if (!contexto) {
      alert('Error: failed to getContext!');
      return;
    }

    // Add the temporary canvas that will contain the traces
    var container = canvaso.parentNode;
    temp_canvas = document.createElement('canvas');
    if (!temp_canvas) {
      alert('Error: I cannot create a new temp_canvas element!');
      return;
    }

    temp_canvas.id     = 'imageTemp';
    temp_canvas.width  = canvaso.width;
    temp_canvas.height = canvaso.height;

    container.appendChild(temp_canvas);

    // set global variable that points to corresponding context
    temp_context = temp_canvas.getContext('2d');

    // Get the tool select input, adding event listener to changes
    var tool_select = document.getElementById('dtool');
    if (!tool_select) {
      alert('Error: failed to get the dtool element!');
      return;
    }
    tool_select.addEventListener('change', ev_tool_change, false);

    // Get the color select input, adding event listener to changes
    var color_select = document.getElementById('dcolor');
    if (!color_select) {
      alert('Error: failed to get the dcolor element!');
      return;
    }
    color_select.addEventListener('change', ev_color_change, false);

    // Get the size select input, adding event listener to changes
    var size_select = document.getElementById('dsize');
    if (!size_select) {
      alert('Error: failed to get the dsize element!');
      return;
    }
    size_select.addEventListener('change', ev_size_change, false);

    // Activate the default tool.
    if (tools[tool_default]) {
      tool = new tools[tool_default]();
      tool_select.value = tool_default;
    }

    // Activate the default color.
    if (colors[color_default]) {
      color = new colors[color_default]();
      color_select.value = color_default;
    }

    // Activate the default size.
    if (sizes[size_default]) {
      size = new sizes[size_default]();
      size_select.value = size_default;
    }

    // Attach the mousedown, mousemove and mouseup event listeners (PC).
    canvaso.addEventListener('mousedown', ev_canvaso, false);

    // Attach the mousedown, mousemove and mouseup event listeners (PC).
    temp_canvas.addEventListener('mousedown', ev_canvas, false);
    temp_canvas.addEventListener('mousemove', ev_canvas, false);
    temp_canvas.addEventListener('mouseup',   ev_canvas, false);

    // Attach the touchstart, touchmove and touchend event listeners (Tablet).
    temp_canvas.addEventListener('touchstart', ev_canvas_touch, false);
    temp_canvas.addEventListener('touchmove', ev_canvas_touch, false);
    temp_canvas.addEventListener('touchend',  ev_canvas_touch, false);
  }

  // The general-purpose event handler. This function just determines the mouse
  // position relative to the canvas element.
  function ev_canvas (ev) {

    rect = temp_canvas.getBoundingClientRect();

    if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

    // this corrects the offset between temp_canvas position with respect to the webpage as a whole
    ev._x = parseInt( (ev.clientX - rect.left) / (rect.right - rect.left) * temp_canvas.width )
    ev._y = parseInt( (ev.clientY - rect.top) / (rect.bottom - rect.top) * temp_canvas.height )

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }

  function ev_canvaso (ev) {
      // if trace is hidden, force flag to True and show traces on canvas for drawing
      if (!traceOn)
         TraceOnTempCanvas();
  }

  // analogous function for touch. Here we don't need to subtract the offset (don't know why though)
  function ev_canvas_touch (ev) {

    rect = temp_canvas.getBoundingClientRect();

    if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }

    // Call the event handler of the color.
    var func1 = color[ev.type];
    if (func1) {
      func1(ev);
    }

    // Call the event handler of the size.
    var func2 = size[ev.type];
    if (func2) {
      func2(ev);
    }

  }

  // The event handler for any changes made to the tool selector.
  function ev_tool_change (ev) {
    document.getElementById("dtool").blur();
    if (tools[this.value]) {
      tool = new tools[this.value]();
    }
  }

  // The event handler for any changes made to the color selector.
  function ev_color_change (ev) {
    document.getElementById("dcolor").blur();
    if (colors[this.value]) {
      color = new colors[this.value]();
    }
  }

  // The event handler for any changes made to the color selector.
  function ev_size_change (ev) {
    if(document.getElementById("dtool").value == "pencil")
      document.body.style.cursor = "url('/static/images/pencil"+document.getElementById('dsize').value+".png') 0 0, default";
    else if (document.getElementById("dtool").value == "eraser")
      document.body.style.cursor = "url('/static/images/eraser"+document.getElementById('dsize').value+".png') 0 0, default";
      else if(document.getElementById("dtool").value == "line")
        document.body.style.cursor = "url('/static/images/line"+document.getElementById('dsize').value+".png') 0 0, default";


    document.getElementById("dsize").blur();
    if (sizes[this.value]) {
      size = new sizes[this.value]();
    }
  }

  // This function draws the temporary canvas on top of the definitive (image).
  // Afterwards, the temporary one is cleared. This is done each time the user
  // completes a drawing command.
  function img_update () {
    // contexto.drawImage(canvaso, 0, 0);
    changeImgTran();
  }

  // Global variables for drawing tools, category and size options
  var tools = {};
  var colors = {};
  var sizes = {};

  // info of current trace (coordinates, category, thickness)
  var trace = [];
  var traces = new Array();

  // current thickness
  var size_select;
  // current category
  var color_select;

  // set global variable and trace linewidth with current selected thickness
  var size_select;
  var color_select;

  function size_choose(){
    size_select = document.getElementById('dsize').value;

    temp_context.lineWidth = size_select;
  }

  // set global variable and trace color with current selected thickness
  function color_choose(){
      color_select = document.getElementById('dcolor').value;
    if(color_select == 1)
      temp_context.strokeStyle = 'rgb(0,0,0)';
    else if(color_select == 2)
      temp_context.strokeStyle = 'rgb(128,0,0)';
    else if(color_select == 3)
      temp_context.strokeStyle = 'rgb(0,128,0)';
    else if(color_select == 4)
      temp_context.strokeStyle = 'rgb(128,128,0)';
    else if(color_select == 5)
      temp_context.strokeStyle = 'rgb(0,0,128)';
    else if(color_select == 6)
      temp_context.strokeStyle = 'rgb(128,0,128)';
    else if(color_select == 7)
      temp_context.strokeStyle = 'rgb(0,128,128)';
    else if(color_select == 8)
      temp_context.strokeStyle = 'rgb(128,128,128)';
    else if(color_select == 9)
      temp_context.strokeStyle = 'rgb(64,0,0)';
    else if(color_select == 10)
      temp_context.strokeStyle = 'rgb(192,0,0)';
    else if(color_select == 11)
      temp_context.strokeStyle = 'rgb(64,128,0)';
    else if(color_select == 12)
      temp_context.strokeStyle = 'rgb(192,128,0)';
    else if(color_select == 13)
      temp_context.strokeStyle = 'rgb(64,0,128)';
    else if(color_select == 14)
      temp_context.strokeStyle = 'rgb(192,0,128)';
    else if(color_select == 15)
      temp_context.strokeStyle = 'rgb(64,128,128)';
    else if(color_select == 16)
      temp_context.strokeStyle = 'rgb(192,128,128)';
    else if(color_select == 17)
      temp_context.strokeStyle = 'rgb(0,64,0)';
    else if(color_select == 18)
      temp_context.strokeStyle = 'rgb(128,64,0)';
    else if(color_select == 19)
      temp_context.strokeStyle = 'rgb(0,192,0)';
    else if(color_select == 20)
      temp_context.strokeStyle = 'rgb(128,192,0)';
    else if(color_select == 21)
      temp_context.strokeStyle = 'rgb(0,64,128)';
    else
      temp_context.strokeStyle = 'grey';
  }

  // eraser tool
  tools.eraser = function() {
    var tool = this;
    this.started = false;
    var clicked = false;


    // change mouse icon to eraser
    document.body.style.cursor = "url('/static/images/eraser"+document.getElementById('dsize').value+".png') 0 0, default";
    // document.body.style.cursor = "url('/static/images/eraser.png') 10 25, default";

    // z contains the desired category (color) for trace. For eraser, that means 0
    var z = 0;

    this.touchstart = function (ev) {
        trace = [];
        // this prevents the page to scroll while drawing on temp_canvas
        if (ev.target == temp_canvas) {
          ev.preventDefault();
        }

        // get mouse coordinates
        var x = ev._x;
        var y = ev._y;

        size_choose()
        thick = temp_context.lineWidth;
        trace.push(x,y,thick,z);

        // starts trace
        temp_context.beginPath();
        temp_context.moveTo(ev._x, ev._y);
        tool.started = true;
    };

    this.mousedown = function (ev) {
        trace = [];
        clicked = true

        // get mouse coordinates
        var x = ev._x;
        var y = ev._y;

        size_choose()
        thick = temp_context.lineWidth;
        trace.push(x,y,thick,z);

        // starts trace
        temp_context.beginPath();
        temp_context.moveTo(ev._x, ev._y);
        tool.started = true;
    };


    this.touchmove = function (ev) {
      if (tool.started) {
        // this prevents the page to scroll while drawing on temp_canvas
        if (ev.target == temp_canvas) {
          ev.preventDefault();
        }

        size_choose()

        var x = ev._x;
        var y = ev._y;

        // for eraser, we draw on top of any previous trace with the white color
        temp_context.strokeStyle = 'white';
        temp_context.globalCompositeOperation="destination-out";
        temp_context.lineTo(x, y);
        temp_context.stroke();

        thick = temp_context.lineWidth;

        // add the corresponding (coordinates,thickness,category) to variable that
        // will be passed to python to update the actual python array of traces
        trace.push(x,y,thick,z);

        //when finger touch move out of canvas, stop trace.
        document.getElementById("imageTemp").ontouchleave = function(){touchEnd()};

        function touchEnd() {
          tool.started = false;
          //pushUndo(trace)
          traces.push(trace.toString())
          document.getElementById("btnUndo").style.visibility = "visible";
          img_update();
          document.getElementById("imageTemp").ontouchleave = function(){}          

          }

      }
    };

    this.mousemove = function (ev) {
      if (tool.started) {

        size_choose();

        var x = ev._x;
        var y = ev._y;

        temp_context.strokeStyle = 'white';
        temp_context.globalCompositeOperation="destination-out";
        temp_context.lineTo(x, y);
        temp_context.stroke();

        thick = temp_context.lineWidth;

        // add the corresponding (coordinates,thickness,category) to variable that
        // will be passed to python to update the actual python array of traces
        trace.push(x,y,thick,z);

        //when mouse move out of canvas, stop trace.
        // mouse out is triggered when clicked, so we use clicked to double check
        document.getElementById("imageTemp").onmouseout = function(){
          if (clicked == true){
            clicked = false;
            mouseOut();

          }
        };

        function mouseOut() {
            tool.started = false;
            //pushUndo(trace)
            traces.push(trace.toString())
            document.getElementById("btnUndo").style.visibility = "visible";
            img_update();
            document.getElementById("imageTemp").onmouseout = function(){}

          }

      }
    };


    this.touchend = function (ev) {
      if (tool.started) {
        // this prevents the page to scroll while drawing on temp_canvas
        if (ev.target == temp_canvas) {
          ev.preventDefault();
        }

        // tool.touchmove(ev);
        tool.started = false;
        //pushUndo(trace)
        traces.push(trace.toString())
        document.getElementById("btnUndo").style.visibility = "visible";

        img_update();
        trace_number += 1;

      }
    };


    this.mouseup = function (ev) {
      clicked = false;

      if (tool.started) {
        // tool.mousemove(ev);
        tool.started = false;
        //pushUndo(trace)
        traces.push(trace.toString())
        document.getElementById("btnUndo").style.visibility = "visible";

        img_update();
        trace_number += 1;
      }
    };
  }

  // The drawing pencil.
  tools.pencil = function () {
    var tool = this;
    this.started = false;
    var clicked = false;


    document.body.style.cursor = "url('/static/images/pencil"+document.getElementById('dsize').value+".png') 0 0, default";

    // This is called when you start holding down the touch.
    // This starts the pencil drawing.
    this.touchstart = function (ev) {
        trace = [];

        var z = document.getElementById('dcolor').value;

        // this prevents the page to scroll while drawing on temp_canvas
        if (ev.target == temp_canvas) {
          ev.preventDefault();
        }

        var x = ev._x;
        var y = ev._y;

        size_choose()
        thick = temp_context.lineWidth;
        trace.push(x,y,thick,z);


        temp_context.beginPath();
        temp_context.moveTo(ev._x, ev._y);
        tool.started = true;
    };

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (ev) {
        trace = [];

        var z = document.getElementById('dcolor').value;

        clicked = true;

        var x = ev._x;
        var y = ev._y;

        size_choose()
        thick = temp_context.lineWidth;
        trace.push(x,y,thick,z);


        temp_context.beginPath();
        temp_context.moveTo(ev._x, ev._y);
        tool.started = true;
    };

    // This function is called every time you move the finger. Obviously, it only
    // draws if the tool.started state is set to true (when you are holding down
    // the mouse button).
    this.touchmove = function (ev) {
      var z = document.getElementById('dcolor').value;

      if (tool.started) {
        // this prevents the page to scroll while drawing on temp_canvas
        if (ev.target == temp_canvas) {
          ev.preventDefault();
        }

        color_choose();
        size_choose()

        temp_context.globalCompositeOperation="source-over";

        var x = ev._x;
        var y = ev._y;

        temp_context.lineTo(ev._x, ev._y);
        temp_context.stroke();

        thick = temp_context.lineWidth;

        // add the corresponding (coordinates,thickness,category) to variable that
        // will be passed to python to update the actual python array of traces
        trace.push(x,y,thick,z);

        document.getElementById("imageTemp").ontouchleave = function(){touchLeave()};

        function touchLeave() {
            tool.started = false;
                        //pushUndo(trace)
            traces.push(trace.toString())
            document.getElementById("btnUndo").style.visibility = "visible";
            img_update();
            document.getElementById("imageTemp").ontouchleave = function(){}
          }

      }
    };

    // This function is called every time you move the mouse. Obviously, it only
    // draws if the tool.started state is set to true (when you are holding down
    // the mouse button).
    this.mousemove = function (ev) {

      if (tool.started) {

        color_choose();
        size_choose()

        var x = ev._x;
        var y = ev._y;
        var z = document.getElementById('dcolor').value;

        temp_context.globalCompositeOperation="source-over";
        temp_context.lineTo(ev._x, ev._y);
        temp_context.stroke();

        thick = temp_context.lineWidth;

        // add the corresponding (coordinates,thickness,category) to variable that
        // will be passed to python to update the actual python array of traces
        trace.push(x,y,thick,z);

        // mouse out is triggered when clicked, so we use clicked to double check
        document.getElementById("imageTemp").onmouseout = function(){
          if (clicked == true)
            mouseOut();
        };

        function mouseOut() {
          tool.started = false;
          clicked = false;
                    //pushUndo(trace)
          traces.push(trace.toString())
          document.getElementById("btnUndo").style.visibility = "visible";
          img_update();
          document.getElementById("imageTemp").ontouchleave = function(){}
        }

      }
    };

    // This is called when you release the touch button.
    this.touchend = function (ev) {

      if (tool.started) {
        // this prevents the page to scroll while drawing on temp_canvas
        if (ev.target == temp_canvas) {
          ev.preventDefault();
        }

        // tool.touchmove(ev);
        tool.started = false;
        //pushUndo(trace)
        traces.push(trace.toString())
        document.getElementById("btnUndo").style.visibility = "visible";

        img_update();

        trace_number += 1;
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function (ev) {
      clicked = false;
      // for some reason, I have to cpy the context here already, not only when starting the lines
      cpyCtx = temp_context.getImageData(0, 0, temp_canvas.width, temp_canvas.height);

      if (tool.started) {
        // tool.mousemove(ev);
        temp_context.lineTo(ev._x, ev._y);
        temp_context.stroke();

        tool.started = false;
        
        //pushUndo(trace)

        traces.push(trace.toString())        
        document.getElementById("btnUndo").style.visibility = "visible";
        img_update();        

        trace = [];
        trace_number += 1;
      }
    };
  };

  // Line tool
  tools.line = function () {
    var tool = this;
    this.started = false;
    var clicked = false;

    var x,y; // current mouse coordinates
    var initX,initY; // initial mouse coordinates for this line

    // change mouse icon to line tool
    // document.body.style.cursor = "crosshair";
    document.body.style.cursor = "url('/static/images/line"+document.getElementById('dsize').value+".png') 0 0, default";

    // the mouse events are trickier for this tool, since we
    function mouseOut() {
      tool.started = false;
      clicked = false;
      // add the corresponding (coordinates,thickness,category) to variable that
      // will be passed to python to update the actual python array of traces
      thick = temp_context.lineWidth;
      var z = document.getElementById('dcolor').value;

      trace.push(x,y,thick,z);
            //pushUndo(trace)

      traces.push(trace.toString())
      document.getElementById("btnUndo").style.visibility = "visible";

      img_update();
      document.getElementById("imageTemp").ontouchleave = function(){}
    }

    // This is called when you start holding down the touch.
    // This starts the pencil drawing.
    this.touchstart = function (ev) {
      trace = [];  
      // this prevents the page to scroll while drawing on temp_canvas
      if (ev.target == temp_canvas) {
        ev.preventDefault();
      }

      x = ev._x;
      y = ev._y;

      tool.started = true;

      temp_context.globalCompositeOperation="source-over";

      color_choose();
      size_choose();

      var z = document.getElementById('dcolor').value;

      thick = temp_context.lineWidth;

      // add the corresponding (coordinates,thickness,category) to variable that
      // will be passed to python to update the actual python array of traces
      trace.push(ev._x,ev._y,thick,z);

      initX = ev._x;
      initY = ev._y;

      cpyCtx = temp_context.getImageData(0, 0, temp_context.canvas.width, temp_context.canvas.height);

      // mouse out is triggered when clicked, so we use clicked to double check
      document.getElementById("imageTemp").onmouseout = function(){
        if (tool.started && clicked == true){
          clicked = false;
          mouseOut()
        }
      };

    };

    this.mousedown = function (ev) {
      trace = [];
      cpyCtx = temp_context.getImageData(0, 0, temp_canvas.width, temp_canvas.height);

      clicked = true

      x = ev._x;
      y = ev._y;

      tool.started = true;

      temp_context.globalCompositeOperation="source-over";

      color_choose();
      size_choose();

      var z = document.getElementById('dcolor').value;

      // add the corresponding (coordinates,thickness,category) to variable that
      // will be passed to python to update the actual python array of traces
      thick = temp_context.lineWidth;
      trace.push(ev._x,ev._y,thick,z);

      initX = ev._x;
      initY = ev._y;

      // mouse out is triggered when clicked, so we use clicked to double check
      document.getElementById("imageTemp").onmouseout = function(){
        if (tool.started && clicked == true){
          mouseOut()
          clicked = false;
        }
      };
    };

    this.touchmove = function (ev) {

      if (tool.started) {
        // this prevents the page to scroll while drawing on temp_canvas
        if (ev.target == temp_canvas) {
          ev.preventDefault();
        }

        x = ev._x;
        y = ev._y;

        var z = document.getElementById('dcolor').value;
        temp_context.putImageData(cpyCtx, 0, 0);

        temp_context.beginPath();
        temp_context.moveTo(initX, initY);

        temp_context.lineTo(ev._x, ev._y);
        temp_context.stroke();

        img_update();
      }
    };

    this.mousemove = function (ev) {
      if (tool.started) {

        x = ev._x;
        y = ev._y;

        var z = document.getElementById('dcolor').value;
        // alert(initX)
        temp_context.putImageData(cpyCtx, 0, 0);

        temp_context.beginPath();
        temp_context.moveTo(initX, initY);

        temp_context.lineTo(ev._x, ev._y);
        temp_context.stroke();

        img_update();

      }
    };

    // This is called when you release the touch button.
    this.touchend = function (ev) {
      if (tool.started) {
        // this prevents the page to scroll while drawing on temp_canvas
        if (ev.target == temp_canvas) {
          ev.preventDefault();
        }

        var z = document.getElementById('dcolor').value;

        // tool.mousemove(ev);
        tool.started = false;

        x = ev._x;
        y = ev._y;
        thick = temp_context.lineWidth;

        // add the corresponding (coordinates,thickness,category) to variable that
        // will be passed to python to update the actual python array of traces
        trace.push(ev._x,ev._y,thick,z);
                //pushUndo(trace)

        traces.push(trace.toString())
        document.getElementById("btnUndo").style.visibility = "visible";

        img_update();

      }
    };

    this.mouseup = function (ev) {
      clicked = false;

      if (tool.started) {
        // tool.mousemove(ev);
        tool.started = false;

        var z = document.getElementById('dcolor').value;

        x = ev._x;
        y = ev._y;
        thick = temp_context.lineWidth;

        // add the corresponding (coordinates,thickness,category) to variable that
        // will be passed to python to update the actual python array of traces
        trace.push(ev._x,ev._y,thick,z);

        //pushUndo(trace)

        traces.push(trace.toString())
                // hide Undo button and reactivate it only if traces.length > 0 
        document.getElementById("btnUndo").style.visibility = "visible";

        img_update();
      }
    };
  }

  function pushUndo(trace){
    var trace_ = [];
    for (j = 0; j < trace.length; j++) {
      trace_[j] = trace[j];
    }
    // replace category ID by eraser ID
    for (j = 3; j < trace_.length; j=j+4) {
      trace_[j] = 0;
    }

    undoArr.push(trace_)
    // drop first (oldest) element if more than 5 elements
    if (undoArr.length > 5)
      undoArr.shift(); 
  }

 function undoTrace(){
      // get last trace
    var trace_ = traces[traces.length-1]; /*THIS IS A STRING*/
    // get coordinates as integer from string as in example
    var trace_ = trace_.split(",").map(Number);

    // erase from canvas
    temp_context.strokeStyle = 'white';
    temp_context.globalCompositeOperation="destination-out";

    temp_context.lineWidth = trace_[2]+1;

    temp_context.beginPath();
    temp_context.moveTo(trace_[0], trace_[1]);

    for (j = 4; j < trace_.length; j=j+4) {
      temp_context.lineTo(trace_[j], trace_[j+1]);
      temp_context.stroke();
    }

    // DELETE LAST TRACE FROM TRACES ARRAY
    traces.splice(-1,1); //remove last item from traces array

    img_update();           
    
    // CHECK LENGTH OF TRACES ARRAY
    // IF IT IS EMPTY, NO TRACE CAN BE UNDONE
    if(traces.length == 0){  //empty array?
      document.getElementById("btnUndo").style.visibility = "hidden";
    }

  }