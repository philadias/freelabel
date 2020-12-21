  function startVideo(_callback) {
    document.getElementById("btnDraw").style.visibility = "hidden"

    document.getElementById("myNav").style.width = "100%";
    var video = document.getElementById('myVideo');
    video.src = "/static/tutorial/video"+(i+1)+".mp4";
    video.currentTime = 0;
    video.load();

    video.onended = function(e) {
      // document.getElementById("btnDraw").style.visibility = "visible"
      document.getElementById("myNav").style.width = "0%";
      if (i > -1){
        alert("Ready to do it yourself? Click 'Finish' once you are done \n"+
          "The button will become available once you get at least 90% for each class")
        _callback();
      }
      else
        _callback();
    };
    // document.getElementById("ogg_src").src = "movie.ogg";
    // document.getElementById("myVideo").load();
  }
