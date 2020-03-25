  //automatic runs when window load
  window.onload = function() {           
    document.getElementById("btnFinish").style.visibility = "visible"
    // assign global variables pointing to the "definitive" (img) upper canvas
    canvaso = document.getElementById('imageView');
    contexto = canvaso.getContext("2d");

    // use current time to define the name of the results (log) file (for example Results_{ID}.txt)
    var today = new Date();
    var date_time = today.getFullYear()+'_'+(today.getMonth()+1)+'_'+today.getDate() + '_'+ today.getHours() + "_" + today.getMinutes() + "_" + today.getSeconds();    
    fileID = date_time;

    // initialize mouse cursor as pencil by default
    document.body.style.cursor = "url('/static/images/pencil"+document.getElementById('dsize').value+".png') 0 0, default";    

    var folderpath = prompt("Path to your dataset", "/home/philipe/Pictures/test3/");
    datasetname = prompt("Name of your dataset", "custom");

    // AJAX call to loadlist() in views.py to get list of images, gt, bboxes, categories 
    $.ajax({
      url: 'loadcustom/',
      type: 'POST',
      data: {"folderpath": folderpath,
             "datasetname":datasetname},
      tryCount : 0,
      retryLimit : 3,      
      success: function(resp){
          username = resp.username;

          var lines = resp.imgList;
          var localfolder_ = resp.localFolder;
          var PORT = resp.PORT;
          // var linesGT = resp.gtList;
          // var linesIds = resp.idsList;

          // populate corresponding arrays with info loaded from the .txt files
          for (var j = 0, len = lines.length; j < len; j++) {
            imgArray[j] = "http://0.0.0.0:"+PORT+"/"+lines[j];
            localPathArray[j] = localfolder_+lines[j];            
          }

          // same for the randomly shuffled list of image IDs
          var lines = resp.idsList;        
          listIDs = new Array(imgArray.length);    
          for (var j = 0, len = lines.length; j < len; j++) {
            listIDs[j] = parseInt(lines[j]);
          }

          // populate array with list of categories
          var lines = resp.catList;                  
          for (var j = 0, len = lines.length; j < len; j++) {
            catArray[j] = lines[j];
          }

          // set i with index of next image to be loaded
          i = parseInt(resp.nextId);

          init();
          loadImage();
      },
      error : function(xhr, textStatus, errorThrown ) {
          // if (textStatus == 'timeout') {
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
      timeout: 100000
    }); 

  }

  function toggleGTuser () {

    var GTmask = '/static/'+username+'/GTimage'+listIDs[i]+'.png'

    if(GTusr > 0){
      document.getElementById("maskImg").src = lastUsrMask
      GTusr = 0;
    }
    else{
      document.getElementById("maskImg").src = GTmask
      GTusr = 1;
    }
    
    // wait for the mask to load
    document.getElementById("maskImg").onload = function(){
      changeImgTran()    
      //without our calling, do nothing
      document.getElementById("maskImg").onload = function(){}
    }
  }


//function handled with showing next image in the list
  function finish()
  {
    // check if there are further images available
    if (i<imgArray.length)
    {
      // get time interval that was used for this block
      end(); 

      // check if there are further images available
      if (i<imgArray.length)
      {
        // update log file
        writeFile(); 

        // clear time process bar 
        // pause the bar
        clearInterval(intervalId);      

        // hide traces
        TraceOnTempCanvas();

      }
      else{
	       nextImage()
      }

      trace = [];

      img_score = 0;

  }  
}

   function nextImage(){
    
    // check if there are further images available
     if (i<imgArray.length-1){
      document.getElementById("btnNxtImg").style.visibility = "hidden"
      document.getElementById("btnFinish").style.visibility = "visible"
      document.getElementById("btnReload").style.visibility = "visible"
      document.getElementById("btnRefine").style.visibility = "visible"
      TraceOnTempCanvas();
      
      // deleteBars();

      // load the next image (i+1)
      i +=1;      
      loadImage()

      // restart stopwatch and trace/refine counters
      pauseInterval = 0
      // start();
      trace_number=0;
      callCnt=0;

      trace = [];

      img_score = 0;
      // document.getElementById("scoreId").textContent = "Score: " + img_score;
    }
    else{      
      alert('You did it! ')

      document.getElementById("btnReload").style.visibility = "hidden"
      // document.getElementById("btnPause").style.visibility = "hidden"
      document.getElementById("btnRefine").style.visibility = "hidden" 
    }

  }

  //function handled with load image 
  function loadImage()
  {
      createAgainList();

      // save current cursor (pencil/erase) and then update to loading symbol
      accs = [];

      var currentCursor = document.body.style.cursor
      document.body.style.cursor = 'wait';

       // clear temporary (traces) upper canvas
      temp_context.clearRect(0, 0, temp_canvas.width, temp_canvas.height);

      // clear URL of mask image on bottom canvas
      document.getElementById("maskImg").src = '#';
      // get image URL according to index i and the randomly permuted list 
      var pic = imgArray[listIDs[i]];
      // set image URL to image element on bottom canvas
      document.getElementById("initial").src = pic.replace();
      var img = document.getElementById("initial");

      // get selected transparency for image 
      var tran = document.getElementById("dtran").value

      // wait for the image to load
      img.onload = function(){
          // display image ID in case the user wants to provide some feedback
          document.getElementById("imgId").innerHTML = "Image "+ (i+1)+"/9";

          // get the dimensions of current image to global variables
          currentHeight = img.clientHeight;
          currentWidth = img.clientWidth;
      
          // set image upper canvas dimensions accordingly
          canvaso.height = currentHeight;
          canvaso.width = currentWidth;

          // draw image on upper canvas with corresponding opacity
          contexto.clearRect(0,0,currentWidth,currentHeight);
          contexto.globalAlpha = tran;      
          contexto.drawImage(img, 0, 0, currentWidth, currentHeight);  
          contexto.globalAlpha = 1;

          // set tracews upper canvas dimensions accordingly
          temp_canvas.height = currentHeight;
          temp_canvas.width = currentWidth;

          // pass original image resolution to python
          var img_size = [currentHeight, currentWidth];
          
          // AJAX call to initanns() in views.py, which initializes the array 
          // that will contain the traces provided by the user for this image        
          $.ajax({
            url: '/freelabel/initanns/',
            type: 'POST',
            data: {"img_size": img_size},
            tryCount : 0,
            retryLimit : 3,
            success: function(data) {           
              // initialize scores array, adding 1 to include bkg
              scores = new Array(2);

              document.body.style.cursor = currentCursor              

              start();
          },
          error : function(xhr, textStatus, errorThrown ) {
              // if (textStatus == 'timeout') {
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
          timeout: 5000
        });   
    }     
  }

  function callRefineCustom(){
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
          var imgURL = localPathArray[listIDs[i]];
        }
        // first an AJAX call to send all pending traces
        $.ajax({
          url: '/freelabel/refineCustom/',
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
            timeout: 30000
          });
  }

// function that handles the comparison to Flowers ground truth segmentation
  function checkpointGT(){
    //for some reason, not accessing the global i within ajax success function if i dont copy here
    var i_ = listGTIDs[(i/3)];
    // AJAX call to function "cmpGT(request)" in views.py
    $.ajax({
      url: '/freelabel/cmpGT/',
      type: 'POST',
      data: {"GT": matArray[i_],"ID": i_},
      tryCount : 0,
      retryLimit : 3,      
      success: function(data) {
        // non-filtered array of accuracies, i.e. also includes the 0.00 ones
        accs[0] = data.acc[0];
        accs[1] = data.acc[1];

        acc_ = accs[1]

        // if accuracy for this class is higher than 90%, show in green; otherwise, in red
        if(acc_ > 70){  
        // if(acc_ > 75){  
          alert("Checkpoint passed, good job!")     
        }
        else{
  
          if(i < 2){
            i = -1;
            alert("Checkpoint failed. You will have to redo this image .\n"+
            "In doubt what you are doing wrong? Click 'Flowers - Training video' to watch the instructions again")           
          }
          else{
            i = i -3;
            alert("Checkpoint failed. You will have to redo your last 4 images.\n"+
            "In doubt what you are doing wrong? Click 'Flowers - Training video' to watch the instructions again") 
          }
        }
        if (i<9)
        {
          // get time interval that was used for this block
          end();    

          // update log file
          writeFile(); 

          // clear time process bar 
          // pause the bar
          clearInterval(intervalId);      

          // hide traces
          TraceOnTempCanvas();

        }

        trace = [];
        // img_score = 0;        
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

  function writeFile(){      
      if(gtFlag == true){
        var currentFile = listGTIDs[i/3]+"gt";
      }
      else{
        var currentFile = imgArray[listIDs[i]];
      }      
      //include maxtime, time bonus, score per class, total score
      $.ajax({
          url: 'writeCustomLog/',
          type: 'POST',
          data: {"next_i": (i+1),
                 "scoreTotal": scoreTotal,
                 "img_file":currentFile, 
                 "time": seconds, 
                 "maxTime": maxTime,
                 "trace_number": trace_number, 
                 "refine_number": callCnt, 
                 "accuracies": accs, 
                 "scores": scores,
                 "timeBonus": timeBonus.toFixed(2),
                 "finalScore": img_score,
                 "fileID": fileID,
                "datasetname":datasetname},
          tryCount : 0,
          retryLimit : 3,
          success: function(resp){    
              nextImage()      
          },
          error : function(xhr, textStatus, errorThrown ) {
              // if (textStatus == 'timeout') {
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
          timeout: 10000
      });  
    } 

  function createAgainList(){
      // remove rest elements from current array
      for (var ii = 0; ii < catArray.length; ii++)
      {
        
        var element = "opt" + ii    // string
        //alert(element)

        var option_ = document.getElementById(element);
        var parent_ = document.getElementById("dcolor");
        
        if(option_ != null)
          parent_.removeChild(option_);        
      }
      
      // remove rest elements from current array
      //Create array of options to be added
      var mySelect = document.getElementById("dcolor");

      //Create and append the options
      for (var k = 0; k < catArray.length; k++) {
        var option = document.createElement("option");
        //set value as first, 1,2,3....21
        option.value = k+1;
        option.id = "opt" + k;
        //alert(option.id);
        option.text = catArray[k]; //actually,0 is background; we need to change its value to 1
        mySelect.appendChild(option);
      }          
  }
