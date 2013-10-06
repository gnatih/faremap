/**
Fare-map: Mapping public-transport fares
Copyright (C) 2010  Jayesh Gohel
**/

var rm = new function() {
  this.service = new google.maps.DirectionsService();
  this.m = [];
  this.paths = [];
  this.p="";
  this.l="";
  this.c={0:'red',1:'blue', 2:'orange'};
  this.count = 0;
  
  this.directions = function(){
    if(rm.pline) rm.pline.setMap(null); { $("#info .content").empty(); $("#info").removeClass("active"); }
    var o = rm.m[0].position;
    var d = rm.m[1].position;
    rm.service.route( {origin:o, destination:d, travelMode:google.maps.DirectionsTravelMode.DRIVING, unitSystem: google.maps.DirectionsUnitSystem.METRIC, optimizeWaypoints:true, provideRouteAlternatives: true} , rm.process);
  };
  
  this.process = function(r,s){
    rm.routes = r.routes;
    for(var i=0; i<rm.routes.length; i++){
      rm.paths[i] = new google.maps.MVCArray();
      for(rno in rm.routes[i].legs){
        for(sno in rm.routes[i].legs[rno].steps){
          for(coord in rm.routes[i].legs[rno].steps[sno].lat_lngs){
            rm.paths[i].push(rm.routes[i].legs[rno].steps[sno].lat_lngs[coord]);
          }
        }
      }
    }
    rm.pline = new google.maps.Polyline({ strokeOpacity:0.6, strokeWeight:8 });
    rm.showroute(0);
    rm.results();
  };
  
  this.showroute= function(r){
    rm.pline.setOptions({strokeColor:rm.c[r]});
    rm.pline.setPath(rm.paths[r]);
    rm.pline.setMap(rm.map);
  };
  
  this.results= function(){
    $("#info").addClass("active");
    var c = $("#info .content");
    var i = 0;
    var dist = [];
    var str = '<table id="rid"><tr><th>&nbsp;</th><th>Units</th><th>Fare</th></tr>';
    $(rm.routes).each(function(){
      var d = rm.routes[i].legs[0].distance.value * .001;
      dist.push(d);
      str+='<tr class="route_' + i +'" style="';
      if(i==0) str+='color:#fff;'; else str+='color:#333;';
      str+='"><td class="'+ rm.c[i]+'">' + d.toFixed(2) + ' <span class="small">km</span></td><td class="'+ rm.c[i]+'">' + rm.units(d) + '</td><td class="'+ rm.c[i]+'">&#8377;&nbsp;' + rm.fare(rm.units(d), rm.p)  + '</td></tr>';
      i++;
    });
    str+='</table>';
    dist.sort().reverse();
    
    var fare = rm.fare(rm.units(dist[0]), rm.p);
    str+='<p>You should not be paying more than <b>&#8377;&nbsp;' + fare + '</b>.</p>';
    c.append(str);
    
    $("#rid tr").click(function () {
      var n = this.className.split("_");
      for(var i=0; i<rm.routes.length;i++){
        if(i==n[1]){
          $(this).css({color:'#fff'});
          rm.showroute(i);
        } else {
          $(".route_" + i).css({color:'#333'});
        }
      }
    });
  };
  
  this.units= function(d){
    switch(rm.p){
      case "ahmadabad":
        if(d <= 1) return units = 24;
        else return ((((d - 1.2)/.2)*4) + 24).toFixed(0);
      break;
      
      case "delhi":
      case "pune":
      case "mumbai":
      case "bangalore":
        return d.toFixed(2);
      break;
    }  
  };
  
  this.fare= function(u){
    switch(rm.p){
      case "ahmadabad":
        var lo = range(25,500,4);
        var unit = 0;
        console.log(lo);
        for(var i=0; i<lo.length; i++){
          if(u >= lo[i]) {
            unit = i+1;
          } else if(u <= 24){
            unit = 0;  
          }
        }
        unit = (unit * 1.7) + 13;
      break;
      
      case "delhi":
        unit = ((u - 1) * 4.5) + 10;
      break;
      
      case "pune":
        unit = ((u - 1) * 8) + 11;
      break;
      
      case "mumbai":
        unit = ((u - 1) * 14) + 11;
      break;
       
      case "bangalore":
        if(u <= 2.5){
          unit = 14 + 3;
        } else {
          unit = ((u - 2) * 10) + 14;
        }
      break;
    }
    return unit.toFixed(0);
  };
  
  this.defaultLoc= function(l){
    if(!l){
      $(".err").html("Unfortunately, we do not have data about your location. To show you a demo atleast, we're falling back to Ahmedabad, India.");
      rm.p = "ahmadabad";
      rm.l = new google.maps.LatLng(23.024, 72.580);
      rm.map.setCenter(rm.l);
    } else {
      var ll;
      switch(l){
        case "ahmadabad":
          ll = new google.maps.LatLng(23.024, 72.580);
        break;
        case "bangalore":
          ll = new google.maps.LatLng(12.964, 77.577);
        break;
        case "delhi":
          ll = new google.maps.LatLng(28.649, 77.205);
        break;
        case "mumbai":
          ll = new google.maps.LatLng(18.985, 72.835);
        break;
        case "pune":
          ll = new google.maps.LatLng(18.517, 73.858);
        break;
      }
      rm.setLoc(l,ll);
      rm.clear();
    }
  };
  
  this.setLoc= function(p,l){
    rm.p = p,
    rm.l = l;
    rm.map.setCenter(l);
    $("#loc").val(p);
  };
  
  this.clear= function(){
    if(rm.pline) rm.pline.setMap(null);
    $("#info .content").empty();
    if(rm.m.length > 0){
      for(var i=0; i<rm.m.length;i++){
        rm.m[i].setMap(null);
      }
      rm.m = [];
    }
  };
  
  this.dialog= function(msg){
    var d = $("#dialog");
    if($("#msg").length == 0){
      var btn = "<div id='btns'><a href='#' id='pick' class='btn'>Pick a location</a><a href='#' id='use' class='btn'>Use my location</a></div>";
      var m = "<div id='msg'></div>";
      d.append(m+btn);
      $('#msg').html(msg);
    }
    $("#overlay").show();
  };
  
  this.click= function(l){
    if(rm.m.length < 2){
      this.count++;
      mIcon = "http://faremap.in/images/end.png";
      if(this.count == 1){
        mIcon = "http://faremap.in/images/start.png";
      }
      var m = new google.maps.Marker({ position:l, map:rm.map, draggable:true, icon:mIcon });
      google.maps.event.addListener(m, "dragend", rm.directions);
      rm.m.push(m);
    }
    if(rm.m.length == 2) rm.directions();
  };
  
  this.yes= function(p){
    if($("#info").is(".p")) return;
    $("#info").addClass("p");
    var l = new google.maps.LatLng(p.coords.latitude, p.coords.longitude);
    var g = new google.maps.Geocoder();
    g.geocode({'latLng':l}, function(r,s) {
      if($("#info").is(".g")) return;
      $("#info").addClass("g");
      var n = r[0].formatted_address;
      var pl = "";
      if(r.indexOf("Ahmedabad") == -1 || r.indexOf("Ahmadabad") == -1){
        pl = "ahmadabad";
      } else if(r.indexOf("Bangalore") == -1){
        pl = "bangalore";
      } else if(r.indexOf("Delhi") == -1){
        pl = "delhi";
      } else if(r.indexOf("Mumbai") == -1){
        pl = "mumbai";
      } else if(r.indexOf("Pune") == -1){
        pl = "pune";
      } else {
        rm.defaultLoc();
        return;
      }
      rm.setLoc(pl,l);
    });
  };
  
  this.no = function(msg){
    rm.defaultLoc();
  };
  
  this.init = function(){
    rm.map = new google.maps.Map(document.getElementById("map"), {zoom:14, mapTypeId:google.maps.MapTypeId.ROADMAP, mapTypeControl:false, navigationControl:true, scaleControl:false, navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL} });
    google.maps.event.addListener(rm.map, 'click', function(e) { rm.click(e.latLng); });
    rm.dialog("<p>Fare Map enables you to know how much you should pay for your auto-rickshaw or <strike>taxi</strike> trip.</p><p>To start you can use the location we've detected, or pick another if you like. Next, click the map again for your destination to see suggested routes.</p><p>Note: You can also drag the markers around to update routes.</p><p class='err'></p>");
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(rm.yes, rm.no);
    }
  };
};

$(function(){
  rm.init();
  $(window).resize(function(){ if(!$("#dialog").is(":hidden")) rm.dialog(); });
  $("#pick").click(function(){ $("#dialog, #overlay").hide(); });
  $("#use").click(function(){ 
    if(rm.l != ""){
      rm.click(rm.l);
      $("#dialog, #overlay").hide();
    } else {
      if(!$(".err").is(':empty')){
        rm.click(rm.l);
        $("#dialog, #overlay").hide();
      } else {
        rm.defaultLoc();
      }
    }
  });
  $("#loc").change(function() {
    rm.defaultLoc($(this).val());
  });

  $("#logo").click(function(e){
    if(!$("#info .content").is(":empty")){
      $("#info").toggleClass("active");
    }
  });
});

/**range php.js **/
function range ( low, high, step ) {
    var matrix = [];
    var inival, endval, plus;
    var walker = step || 1;
    var chars  = false;

    if ( !isNaN( low ) && !isNaN( high ) ) {
      inival = low;
      endval = high;
    } else if ( isNaN( low ) && isNaN( high ) ) {
      chars = true;
      inival = low.charCodeAt( 0 );
      endval = high.charCodeAt( 0 );
    } else {
      inival = ( isNaN( low ) ? 0 : low );
      endval = ( isNaN( high ) ? 0 : high );
    }

    plus = ((inival > endval) ? false : true);
    if ( plus ) {
      while ( inival <= endval ) {
        matrix.push( ( ( chars ) ? String.fromCharCode( inival ) : inival ) );
        inival += walker;
      }
    } else {
      while ( inival >= endval ) {
        matrix.push( ( ( chars ) ? String.fromCharCode( inival ) : inival ) );
        inival -= walker;
      }
    }
    return matrix;
}
