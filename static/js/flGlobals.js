 // lookup table for the score ranges

  var gtArray = new Array();  // URLs to images with GT
  var matArray = new Array();  // URLs to .mat of GTs

  var listIDs; // randomized list of IDs to use with img, GT, bb arrays
  var listGTIDs;

  var img_score = 0; //score for current image
  var scoreTotal; // accumulated score
  var avgScore;  // avg score per image

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
      if(element.value == 1)
        element.value = 2;
      else if(element.value == 2)
        element.value = 1;
      var event = new Event('change');
      element.dispatchEvent(event);
    }
  };