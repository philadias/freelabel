function lookupInit() {
    ltScore = new Array(40);
    //60-69%
    for (var j = 0; j < 10; j++){
      ltScore[j] = 100;
    }
    //70-79%
    for (var j = 10; j < 20; j++){
      ltScore[j] = 200;
    }
    //80-84%
    for (var j = 20; j < 25; j++){
      ltScore[j] = 400;
    }
    //85-89%
    for (var j = 25; j < 30; j++){
      ltScore[j] = 600;
    }

    ltScore[30] = 800; //90%

    //91-94%
    for (var j = 1; j < 5; j++){
      ltScore[30+j] = ltScore[30+j-1]+100;
    }

    ltScore[35] = 1600; //95%

    //96-98%
    for (var j = 1; j < 4; j++){
      ltScore[35+j] = ltScore[35+j-1]+200;
    }

    ltScore[39] = 3000; //95%
    ltScore[40] = 5000; //100% (I believe it's impossible)
  }

  function getScore(acc){

    // lookup table is from 60% onwards, with 0 pts for anything lower
    var score = 0;
    var adjAcc = Math.floor(acc-60);

    if (adjAcc > 0)
      score = ltScore[adjAcc];

    // add possible time bonus
    score += Math.round(1.0*score*timeBonus);
    return score;

  }

 function loadBar(barId,score,prevScore) {
    var elem = document.getElementById(barId);
    var width = prevScore

    if (elem)
      var id = setInterval(frame, 10);

    function frame() {

      if(score > prevScore)
      {
        if (width >= score) {
          // prevScore = score
          clearInterval(id);
        }
        else {
            width++;
            elem.style.width = width + '%';
        }
      }
      else
      {
        if (width <= score) {
          clearInterval(id);
        }
        else {
            width--;
            elem.style.width = width + '%';
        }
      }
    }
  }

  // icon activated if segmentation is good enough
  function toggleIcon(flag)
  {
      var icon = document.getElementById('checkIcon');

      if (flag == true) {    
        icon.className = "fa fa-check";
        icon.style.color = "green";
        document.getElementById('btnFinish').style.visibility = 'visible'
      }
      else {
        icon.className = "fa fa-times";
        icon.style.color = "red";
        document.getElementById('btnFinish').style.visibility = 'hidden'
      }
  }    

  function deleteBars () {
    var cls_ = clsArray[listIDs[i]]; // classes in this image (GT)
    for (var j = 0, len = cls_.length; j < len; j++)
    {
        // delete score bars for this class
        var container = document.getElementById("barContainer");

        var pbarId = "progressBar" + cls_[j];
        var pbar = document.getElementById(pbarId);

        if(pbar)
          container.removeChild(pbar);

    }
  }

   function createBars () {

    var cls_ = clsArray[listIDs[i]]; // classes in this image (GT)
    prevaccs = new Array();

    // for background
    prevaccs.push(0);

    for (var j = 0, len = cls_.length; j < len; j++)
    {
        // create a score bars for this class if it does not exist yet
        var pbarId = "progressBar" + cls_[j];

        if(!document.getElementById(pbarId)){
            /*create first progress bar*/
            var container = document.getElementById("barContainer");
            var newPBar = document.createElement('div');

            newPBar.id     = pbarId;
            newPBar.className  = "myprogressBar";
            container.appendChild(newPBar);

            // then create the bar
            var newBar = document.createElement('div');

            newBar.id     = "bar" + cls_[j];
            newBar.className  = "mybar";
            newPBar.appendChild(newBar);

            prevaccs.push(0);
        }
    }
  }

  function startTimebar (noObjs) {
    var elem = document.getElementById("barTime");
    // set counter time
    var timeCounter = 0;
    // time available for each image corresponds to 60sec + 30sec for each extra object
    maxTime = 60 + 30*(noObjs-1)

    // how often to execute the code, 1s = 1000s
    intervalId = setInterval(frame, 1000);

    function frame() {
      if (timeCounter >= (2*maxTime)) {
        // alert("Bonus time is over, but you can keep drawing!")
        elem.innerHTML = "Bonus time is over, but you can keep drawing!";
        clearInterval(intervalId);

      }else {

        timeCounter++;

        var remainingTime = maxTime - timeCounter

        // time bonus corresponds to percentage of max time still remaining
        timeBonus = (remainingTime/maxTime) + 1

        elem.style.width = Math.floor(100*(timeCounter/(2*maxTime))) + '%';   //total now will be 120 for the bar
        elem.innerHTML = remainingTime  + 's';
        document.getElementById("txtBonus").innerHTML = 'Bonus factor: ' + (1+timeBonus).toFixed(2) + 'x';
      }
    }

  }