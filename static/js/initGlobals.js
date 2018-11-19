      var ltScore;

      // flag indicating if dataset has GT for all images or not (default: TRUE)
      var datasetGT = true;

      var imgArray = new Array(); // image URLs
      var gtArray = new Array();  // ground-truth (GT) URLs
      var clsArray = new Array();  // list of classes present in each GT
      var catArray = new Array(); // categories names
      var bbArray = new Array(); // bounding-boxes URLs
      var colorArray = new Array(); // colors of each bounding-box in current image
      var bb = new Array(); // bboxes in current image
      var optionArray = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];  // array includs 1 to 21
      var listIDs; // randomized list of IDs to use with img, GT, bb arrays

      // var img;
      var i;
      // canvas and context for "definitive" (image) upper canvas
      var canvaso, contexto;
      // canvas and context for "temporary" (traces) upper canvas
      var temp_canvas, temp_context;

      // The active tool instance.
      var tool;
      var tool_default = 'pencil';

      // Changing color instance.
      var color;
      var color_default = 'back';

      // Changing size instance.
      var size;
      var size_default = 2;

      // Changing transparancy instance.
      var tran;
      var tran_default = 0.2;

      // global string for average accuracy
      var avg_acc;

      // accuracies for all classes
      var accs;
      var prevaccs = new Array(); // accs in previous step, to guide bar animation
      var scores;
      var img_score = 0;
      var scoreTotal; //accumulate score

      // width and height of current image
      var currentWidth;
      var currentHeight;

      // flags indicating if mask/bboxes shall be displayed
      var maskOn = true;
      var bboxOn = true;
      var traceOn = true;

      // counter for the number of Refine clicks
      var callCnt = 0;

      // info for time recording
      var seconds = 0;
      var startTime, endTime,maxTime;
      var pauseInterval = 0;

      // id for interval process running for timerbar
      var intervalId;

      // counter for the number of traces provided for the current image
      var trace_number = 0;

      // current time bonus based on percentage of max time still remaining
      var timeBonus = 0;

      // path to final mask provided by the user for current image
      var lastUsrMask;
      // indicates whether GT or user mask shall be displayed
      var GTusr = 0;

      // indicates if current image is GT or not, to guide computation of acc.
      var gtFlag = false; 

      // timeout counter. Throws alert if more than 3 times for same refine call
      var retry_ = 0;

      var username;
      var cpyCtx;

      // Back up for last trace
      var lastTrace;

      // flag indicating whether a AJAX call is still being processed
      var availableAjax = true;

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
        else if (e.which == 85){  //U,u
          undoTrace();
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
       else if (e.which == 9){//tab
          e.preventDefault(); // Prevent the default action
          var element = document.getElementById('dcolor');
          if(element.value > 21)
            element.value = 1;
          else
            element.value = 8;
          var event = new Event('change');
          element.dispatchEvent(event);
        }
      };

      window.addEventListener("keydown", function(e) {
          // space and arrow keys
          if([9,32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
              e.preventDefault();
          }
      }, false);