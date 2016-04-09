function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  console.log("Sporocilo --> "+sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  
  var sistemskoSporocilo;
  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    console.log("SistemeskoSporocilo --> "+sistemskoSporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }
  sporociloTokens = sporocilo.split(" ");
  
  for(var i=0;i<sporociloTokens.length;i++){
    var dolzina=sporociloTokens[i].length;
    if(dolzina>7 && (sporociloTokens[i].substring(0,7)=="http://" || sporociloTokens[i].substring(0,8)=="https://") && (sporociloTokens[i].substring(dolzina-4,dolzina)==".jpg" || sporociloTokens[i].substring(dolzina-4,dolzina)==".png" || sporociloTokens[i].substring(dolzina-4,dolzina)==".gif")){
      var slikaHtml = "<img src=\""+sporociloTokens[i]+"\" width=\"200\" hspace=\"20\">";
      $("#sporocila").html($("#sporocila").html()+slikaHtml);
    }else if(dolzina>32 && (sporociloTokens[i].substring(0,32)=="https://www.youtube.com/watch?v=")){
      var slikaHtml = "<iframe src=\"https://www.youtube.com/embed/"+sporociloTokens[i].substring(32,dolzina)+"\" height=\"150\" width=\"200\" hspace=\"20\" allowfullscreen></iframe>";
      $("#sporocila").html($("#sporocila").html()+slikaHtml);
    }
  }
  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    var sporociloTokens = sporocilo.besedilo.split(" ");
    for(var i=0;i<sporociloTokens.length;i++){
     var dolzina=sporociloTokens[i].length;
      if(dolzina>7 && (sporociloTokens[i].substring(0,7)=="http://" || sporociloTokens[i].substring(0,8)=="https://") && (sporociloTokens[i].substring(dolzina-4,dolzina)==".jpg" || sporociloTokens[i].substring(dolzina-4,dolzina)==".png" || sporociloTokens[i].substring(dolzina-4,dolzina)==".gif")){
       var slikaHtml = "<img src=\""+sporociloTokens[i]+"\" width=\"200\" hspace=\"20\">";
       $("#sporocila").html($("#sporocila").html()+slikaHtml);
     }else if(dolzina>32 && (sporociloTokens[i].substring(0,32)=="https://www.youtube.com/watch?v=")){
       var slikaHtml = "<iframe src=\"https://www.youtube.com/embed/"+sporociloTokens[i].substring(32,dolzina)+"\" height=\"150\" width=\"200\" hspace=\"20\" allowfullscreen></iframe>";
       $("#sporocila").html($("#sporocila").html()+slikaHtml);
      }
   }
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('dregljaj',function(dregljaj){
    if(dregljaj.dregljaj){
      var okno = $("#vsebina");
      okno.jrumble();
      okno.trigger('startRumble');
      setTimeout(function(){
        okno.trigger('stopRumble');
      },1500);
    }
  });
  
  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function(event) {
      predloga = "/zasebno \""+$(event.target).text()+"\"";
      $('#poslji-sporocilo').val(predloga);
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
