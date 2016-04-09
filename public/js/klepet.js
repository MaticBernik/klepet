var Klepet = function(socket) {
  this.socket = socket;
};

Klepet.prototype.posljiSporocilo = function(kanal, besedilo) {
  if(kanal=="dregljaj"){
    var posiljatelj = $('#kanal').text().split(" ")[0];
    var sporocilo = {
      kanal: kanal,
      vzdevek: besedilo,
      posiljatelj: posiljatelj
    };
    socket.emit('dregljaj',sporocilo);
  }else{
    var sporocilo = {
     kanal: kanal,
     besedilo: besedilo
    };
    this.socket.emit('sporocilo', sporocilo);
  }  
};

Klepet.prototype.spremeniKanal = function(kanal) {
  this.socket.emit('pridruzitevZahteva', {
    novKanal: kanal
  });
};

Klepet.prototype.procesirajUkaz = function(ukaz) {
  var besede = ukaz.split(' ');
  ukaz = besede[0].substring(1, besede[0].length).toLowerCase();
  var sporocilo = false;

  switch(ukaz) {
    case 'pridruzitev':
      besede.shift();
      var kanal = besede.join(' ');
      this.spremeniKanal(kanal);
      break;
    case 'vzdevek':
      besede.shift();
      var vzdevek = besede.join(' ');
      this.socket.emit('vzdevekSpremembaZahteva', vzdevek);
      break;
    case 'dregljaj':
      besede.shift();
      var vzdevek = besede.join(' ');
      var uporabniki=$('#seznam-uporabnikov div');
      var napaka=true;
      for (var i=0;i<uporabniki.length;i++){
        if(uporabniki[i].innerHTML == vzdevek){
          napaka=false;
          break;
        }
      }
      if (!vzdevek){
        sporocilo = "Neznan ukaz"
      }else if(!napaka){
        sporocilo = "Dregljaj za "+vzdevek; 
        this.posljiSporocilo('dregljaj',vzdevek);
      }else{
        //sporocilo = "Uporabnik ne obstaja!"  
        sporocilo = "Neznan ukaz";
      }
      break;
    case 'zasebno':
      besede.shift();
      var besedilo = besede.join(' ');
      var parametri = besedilo.split('\"');
      if (parametri) {
        this.socket.emit('sporocilo', { vzdevek: parametri[1], besedilo: parametri[3] });
        sporocilo = '(zasebno za ' + parametri[1] + '): ' + parametri[3];
      } else {
        sporocilo = 'Neznan ukaz';
      }
      break;
    default:
      sporocilo = 'Neznan ukaz.';
      break;
  };

  return sporocilo;
};
