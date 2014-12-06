Ambient = new Meteor.Collection("ambient");
Climate = new Meteor.Collection("climate");

if (Meteor.isClient) {

  Meteor.subscribe("ambient", function(){
    var ymer = document.getElementById("ambientChart");
    var ambdata = Ambient.find({}).fetch();
    var graph = Morris.Line({
      // ID of the element in which to draw the chart.
      element: ymer,
      // Chart data records -- each entry in this array corresponds to a point on
      // the chart.
      data: ambdata,
      // The name of the data record attribute that contains x-values.
      xkey: 'time',
      // A list of names of data record attributes that contain y-values.
      ykeys: ['light','sound'],
      // Labels for the ykeys -- will be displayed when you hover over the
      // chart.
      labels: ['Light','Sound'],
      // Styling
      lineColors: ['#1dc8ea','#7b0303'],
      grid: false
    });
    Ambient.find({}).observeChanges({
      added: function(id,fields){
        ambdata.push(fields);
        graph.setData(ambdata);
      }
    });

  });

  Meteor.subscribe("climate", function(){
    var temp = document.getElementById("tempChart");
    var humid = document.getElementById("humidChart");
    var clidata = Climate.find({}).fetch();
    var graph1 = Morris.Line({
      // ID of the element in which to draw the chart.
      element: temp,
      // Chart data records -- each entry in this array corresponds to a point on
      // the chart.
      data: clidata,
      // The name of the data record attribute that contains x-values.
      xkey: 'time',
      // A list of names of data record attributes that contain y-values.
      ykeys: ['temp'],
      // Labels for the ykeys -- will be displayed when you hover over the
      // chart.
      labels: ['Temp'],
      // Styling
      lineColors: ['#1dc8ea','#7b0303'],
      grid: false
    });
    var graph2 = Morris.Line({
      // ID of the element in which to draw the chart.
      element: humid,
      // Chart data records -- each entry in this array corresponds to a point on
      // the chart.
      data: clidata,
      // The name of the data record attribute that contains x-values.
      xkey: 'time',
      // A list of names of data record attributes that contain y-values.
      ykeys: ['humid'],
      // Labels for the ykeys -- will be displayed when you hover over the
      // chart.
      labels: ['Humid'],
      // Styling
      lineColors: ['#1dc8ea','#7b0303'],
      grid: false
    });

    Climate.find({}).observeChanges({
      added: function(id,fields){
        clidata.push(fields);
        graph1.setData(clidata);
        graph2.setData(clidata);
      }
    });

  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    /*var globalObject=Meteor.isClient?window:global;
    for(var property in globalObject){
        var object=globalObject[property];
        if(object instanceof Meteor.Collection){
            console.log("Clearing db",object._name);
            object.remove({});
        }
    }*/

    collectionApi = new CollectionAPI({
        //authToken: '97f0ad9e24ca5e0408a269748d7fe0a0',
        apiPath: 'data'
      }
    );
    collectionApi.addCollection(Ambient, 'ambient');
    collectionApi.addCollection(Climate, 'climate');
    collectionApi.start();
  });

  Meteor.publish("ambient", function () {
    return Ambient.find({});
  });

  Meteor.publish("climate",function(){
    return Climate.find({});
  });
}
