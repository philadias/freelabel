  //automatic runs when window load
  window.onload = function() {   

    // assign global variables pointing to the "definitive" (img) upper canvas
    canvaso = document.getElementById('imageView');
    contexto = canvaso.getContext("2d");

    // use current time to define the name of the results (log) file (for example Results_{ID}.txt)
    var today = new Date();
    var date_time = today.getFullYear()+'_'+(today.getMonth()+1)+'_'+today.getDate() + '_'+ today.getHours() + "_" + today.getMinutes() + "_" + today.getSeconds();    
    fileID = date_time;

    // initialize mouse cursor as pencil by default
    document.body.style.cursor = "url('/static/images/pencil"+document.getElementById('dsize').value+".png') 0 0, default";    
    // AJAX call to loadlist() in views.py to get list of images, gt, bboxes, categories 
    $.ajax({
      url: 'loadBatches/',
      type: 'POST',
      tryCount : 0,
      retryLimit : 3,      
      success: function(resp){
          username = resp.username;

          var lines = resp.imgList;
          var linesGT = resp.gtList;
          var linesMat = resp.matList;
          // populate corresponding arrays with info loaded from the .txt files
          for (var j = 0, len = lines.length; j < len; j++) {
            imgArray[j] = 'https://drive.google.com/uc?id=' + lines[j];
          }    
          for (var j = 0, len = linesGT.length; j < len; j++) {
            gtArray[j] = 'https://drive.google.com/uc?id=' + linesGT[j];
            matArray[j] = 'https://drive.google.com/uc?id=' + linesMat[j];
          }    

          // same for the randomly shuffled list of image IDs
          var lines = resp.idsList;        
          listIDs = new Array(imgArray.length);    
          for (var j = 0, len = lines.length; j < len; j++) {
            listIDs[j] = parseInt(lines[j]);
          }

          var linesGTIds = resp.GTidsList;
          listGTIDs = new Array(gtArray.length);    
          for (var j = 0, len = linesGTIds.length; j < len; j++) {
            listGTIDs[j] = parseInt(linesGTIds[j]);
          }

          // set i with index of next image to be loaded
          i = parseInt(resp.nextId);

          init();
          if(i == 0)
          {
            startVideo(function() {
              // i = 0;
              alert("Tip: you will probably have to often zoom in to label all flowers properly."+
                " \nKeyboard shortcuts are very helpful, including TAB to switch between Background/Flower categories "+
                "\n(list of shortcuts on the bottom of the page)")
              loadImage();
            });
          }
          else{
            loadImage();
          }
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

  function startVideo(_callback) {
    document.getElementById("btnDraw").style.visibility = "hidden"

    document.getElementById("myNav").style.width = "100%";
    var video1 = document.getElementById('myVideo');

    video1.src = "/static/tutorial/flower1.mp4";
    video1.currentTime = 0;
    video1.load();

    video1.onended = function(e) {
      var video2 = document.getElementById('myVideo');
      video2.src = "/static/tutorial/flower2.mp4";
      video2.currentTime = 0;
      video2.load();
      video2.onended = function(e) {
        // document.getElementById("btnDraw").style.visibility = "visible"
        document.getElementById("myNav").style.width = "0%";
        _callback();
      };

    };


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

    if(gtFlag == true){
      // compute accuracies
      checkpointGT();
    }

    else{
      // check if there are further images available
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
      else{
	 nextImage()
      }

      trace = [];

      img_score = 0;
      // document.getElementById("scoreId").textContent = "Total Score: " ;
    }
    
  }  

   function nextImage(){
    
    // check if there are further images available
    if (i<9){
    // if (i<imgArray.length-1){
      document.getElementById("btnNxtImg").style.visibility = "hidden"
      document.getElementById("btnFinish").style.visibility = "visible"
      document.getElementById("btnReload").style.visibility = "visible"
      document.getElementById("btnPause").style.visibility = "visible"
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
      document.getElementById("btnPause").style.visibility = "hidden"
      document.getElementById("btnRefine").style.visibility = "hidden" 
    }


  }

  //function handled with load image 
  function loadImage()
  {
      // save current cursor (pencil/erase) and then update to loading symbol
      accs = [];

      var currentCursor = document.body.style.cursor
      document.body.style.cursor = 'wait';

       // clear temporary (traces) upper canvas
      temp_context.clearRect(0, 0, temp_canvas.width, temp_canvas.height);

      // clear URL of mask image on bottom canvas
      document.getElementById("maskImg").src = '#';
      // get image URL according to index i and the randomly permuted list 
      if(i%3 == 0){
        gtFlag = true;
        var pic =  gtArray[listGTIDs[i/3]];
      }
      else{
        gtFlag = false;
        var pic = imgArray[listIDs[i]];
      }

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
        var currentId = listGTIDs[i/3]+"gt";
      }
      else{
        var currentId = listIDs[i];
      }      
      //include maxtime, time bonus, score per class, total score
      $.ajax({
          url: 'writeFlLog/',
          type: 'POST',
          data: {"next_i": (i+1),
                 "scoreTotal": scoreTotal,
                 "id_image":currentId, 
                 "time": seconds, 
                 "maxTime": maxTime,
                 "trace_number": trace_number, 
                 "refine_number": callCnt, 
                 "accuracies": accs, 
                 "scores": scores,
                 "timeBonus": timeBonus.toFixed(2),
                 "finalScore": img_score,
                 "fileID": fileID},
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