/*********************************************
This ambient module example console.logs
ambient light and sound levels and whenever a
specified light or sound level trigger is met.
*********************************************/

var tessel = require('tessel');
var led1 = tessel.led[0].output(1);
var led2 = tessel.led[1].output(0);

setInterval(function () {
  // Toggle the led states
  led1.toggle();
}, 1000);

/***********************

Connect to wifi

************************/

var wifi = require('wifi-cc3000');
var network = 'INSERT WIFI SSID HERE; // put in your network name here
var pass = 'INSERT WIFI PASS HERE' // put in your password here, or leave blank for unsecured
var security = 'wpa2'; // other options are 'wep', 'wpa', or 'unsecured'
var timeouts = 0;

function connect(){
  wifi.connect({
    security: security,
    ssid: network,
    password: pass,
    timeout: 30 // in seconds
  });
}

wifi.on('connect', function(data){
  // you're connected
  console.log("connect emitted", data);
  led2.write(1);
});

wifi.on('disconnect', function(data){
  // wifi dropped, probably want to call connect() again
  console.log("disconnect emitted", data);
  led2.write(0);
});

wifi.on('timeout', function(err){
  // tried to connect but couldn't, retry
  console.log("timeout emitted");
  if (timeouts > 3) {
    // reset the wifi chip if we've timed out too many times
    powerCycle();
  } else {
    // try to reconnect
    connect();
  }
});

wifi.on('error', function(err){
  // one of the following happened
  // 1. tried to disconnect while not connected
  // 2. tried to disconnect while in the middle of trying to connect
  // 3. tried to initialize a connection without first waiting for a timeout or a disconnect
  console.log("error emitted", err);
  led2.write(0);
});

// reset the wifi chip progammatically
function powerCycle(){
  // when the wifi chip resets, it will automatically try to reconnect
  // to the last saved network
  wifi.reset(function(){
    timeouts = 0; // reset timeouts
    console.log("done power cycling");
    // give it some time to auto reconnect
    setTimeout(function(){
      if (!wifi.isConnected()) {
        // try to reconnect
        connect();
      }
      }, 20 *10000); // 20 second wait
  });
}

var needle = require('needle');

/***********************

Sensor stuff

************************/

var ambientlib = require('ambient-attx4');
var ambient = ambientlib.use(tessel.port['A']);

var climatelib = require('climate-si7020');
var climate = climatelib.use(tessel.port['C']);

var sampleInterval = 600000;

ambient.on('ready', function () {
 // Get points of light and sound data.
  setInterval( function () {
    ambient.getLightBuffer(function(err, ldata){
      if(err) throw err;
      ambient.getSoundBuffer( function(err,sdata) {
        if (err) throw err;
        var light = 0.0;
        var sound = 0.0;
        for(var i=0;i<ldata.length;i++){
          light = light + ldata[i];
          sound = sound + sdata[i];
        }
        light = light / 10.0;
        sound = sound / 10.0;
        console.log("Light:" + light + " sound: " + sound);
        var URL = 'http://data.reibel.io/data/ambient';
        var data = {
          light: light.toFixed(10),
          sound: sound.toFixed(10),
          time: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') 
        };
        data = JSON.stringify(data);
        /*var options = {
          headers: { 'X-Auth-Token': '97f0ad9e24ca5e0408a269748d7fe0a0' }
        };*/
        needle.request('POST',URL,data,function(err,res){
          if (err) console.log("ERR",err);
          else console.log("RES",res.body);
        });

      });
    });
  }, sampleInterval);

});

climate.on('ready', function () {

  // Loop forever
  //setImmediate(function loop () {
  setInterval(function(){
    climate.readTemperature('c', function (err, temp) {
      climate.readHumidity(function (err, humid) {
        console.log('Degrees:', temp.toFixed(4) + 'C', 'Humidity:', humid.toFixed(4) + '%RH');
        // NOT TESTED 05.12.14 15:15
        var URL = 'http://data.reibel.io/data/climate';
        var data = {
          temp: temp.toFixed(4),
          humid: humid.toFixed(4),
          time: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        };
        data = JSON.stringify(data);
        /*var options = {
          headers: { 'X-Auth-Token': '97f0ad9e24ca5e0408a269748d7fe0a0' }
        };*/
        needle.request('POST',URL,data,function(err,res){
          if (err) console.log("ERR",err);
          else console.log("RES",res.body);
        });
        // NOT TESTED end
      });
    });
  },sampleInterval);
});

climate.on('error', function(err) {
  console.log('error connecting module', err);
});

ambient.on('error', function (err) {
  console.log(err);
});
