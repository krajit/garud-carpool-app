/**
 * TODO: Polish the code
 * TODO: Fix the sign in sign out cycle
 * TODO: Work on book and cancel button functionality
 *   
 * 
 * TODO: Optimize this app using service workers, manifest, etc
 * 
 * TODO: Work on payment functionality
 * 
 * TODO: Fix rules in the firebase realtime database to make the app data secure. 
 * 
 *  */

// Initialize Firebase
var config = {
  apiKey: "AIzaSyCukUtF99cDGHfFnOIQ1d7eImvRA3UgkEI",
  authDomain: "shuttletest03.firebaseapp.com",
  databaseURL: "https://shuttletest03.firebaseio.com",
  projectId: "shuttletest03",
  storageBucket: "shuttletest03.appspot.com",
  messagingSenderId: "42776782201"
};

// set up autocomplete
var placeSearch, autocomplete;
var rideId;

var displayName;
var email;
var passengerKey;



var today = new Date();
var todayString = ("0" + today.getDate().toString()).slice(-2) + "-" // date in two digits (needed two digits for compatibility with android)
  +
  ("0" + (1 + today.getMonth()).toString()).slice(-2) + "-" + // month in two digits
  +today.getFullYear().toString();


firebase.initializeApp(config);

function signIn() {
  var provider = new firebase.auth.GoogleAuthProvider();
  //firebase.auth().signInWithRedirect(provider);

  firebase.auth().signInWithPopup(provider).then(function (result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;

    // document.querySelector("#username").innerText = "Hello " + user.displayName;


    $("#signOutButton").show();
    $("#signInButton").hide();
    // ...
  }).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
}

// auth state listener
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.

    $("#signOutButton").show();
    $("#signInButton").hide();

    displayName = user.displayName;
    email = user.email;

    // passenger key for firebase reference
    passengerKey = email.replace(new RegExp('\\.', 'g'), '_'); // replace dot with _
    passengerKey = passengerKey.replace(new RegExp('@', 'g'), 'AT'); // replace @ with AT


    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    console.log(displayName + " signed in");
    //window.location = "/ridesList.html";
    $("#rideContainer").show();
    // ...
  } else {
    // User is signed out.
    console.log("signed out");

    $("#signOutButton").hide();
    $("#signInButton").show();

    $("#rideContainer").hide();

  }
});



function signOut() {
  firebase.auth().signOut().then(function () {
    // Sign-out successful.

    document.querySelector("#username").innerText = "Hello There! Sign in please :)";

    document.getElementById("signInButton").removeAttribute('hidden');
    document.getElementById("signOutButton").setAttribute('hidden', 'true');

  }).catch(function (error) {
    // An error happened.
  });
}

document.querySelector("#signInButton").addEventListener('click', signIn);
document.querySelector("#signOutButton").addEventListener('click', signOut);


//  // Get a reference to the database service
//  var database = firebase.database();

//  function testWrite() {
//    firebase.database().ref('users').set({
//      username: "Ajit Kumar",
//      email: "ajit.kumar@gmail.com"
//    });
//  }

//  testWrite();


//  var userNameRef = firebase.database().ref('users/username');
//  userNameRef.on('value', function (snapshot) {
//    console.log(snapshot.val());
//  });

function addRides(date, destination, origin, time, fare) {
  var newRideKey = firebase.database().ref('rides/' + date).push().key;
  firebase.database().ref('rides/' + date + '/' + newRideKey).set({
    mDestination: destination,
    mOrigin: origin,
    mTime: time,
    rideFare: fare,
    acceptingBooking: "yes",
    mSeats: 0,
    totalPassengers: 0,
    totalSeats: 0,
    totalWaiting: 0
  });
}

function showAvailableRides(date) {

  var ridesRef = firebase.database().ref('rides/' + date);
  ridesRef.on('value', function (snapshot) {

    // empty ride container node
    var allRideNode = document.getElementById("rideListContainer");
    while (allRideNode.firstChild) {
      allRideNode.removeChild(allRideNode.firstChild);
    }

    snapshot.forEach(function (childSnapshot) {
      var rideKey = childSnapshot.key;
      var childData = childSnapshot.val();

      var rideTime = childData.mTime;
      var rideOrigin = childData.mOrigin;
      var rideDestination = childData.mDestination;
      var nSeats = childData.mSeats;
      fare = childData.rideFare;
      var nPassengers = childData.totalPassengers;

      var rideItemNode = document.createElement("div");
      rideItemNode.classList.add("panel");
      rideItemNode.classList.add("panel-default");

      var cardTemplate = `<div class='panel-body ride-list'>
      <div class='row'>
          <div class='col-xs-8 originToDestination'> ORIGIN <i class='fas fa-arrow-right'></i> DESTINATION </div>
          <div class='col-xs-4 seatsAvailability' style='text-align: right;'> AVAILABILITY Seats </div>
      </div>
      <div class='row'>
          <div class='col-xs-12 rideTime'> STARTINGTIME, MONTH-DAY </div>
      </div>
      <div class='row'>
          <div class='col-xs-12'>
              <form>
                  <div class='form-group'> <input type='text' class='form-control location-input' id='RIDEKEY'
                          placeholder='Type Pick/Drop location...'> <i class='fa fa-search'></i> </div>
              </form>
          </div>
      </div>
      <div class='row'>
        <div class='col-xs-10'> </div>
        <div class='col-xs-2'> <a id='RIDEKEY-addCarButton' class='add-car-button'> <i class="fas fa-car"></i> </a> </div>
      </div>

      <div class='ride-summary-cotainers' id='RIDEKEY-summary'>
          <div class='row'>
              <div class='col-xs-12'> <em>Ride Summary</em> </div>
          </div>
          <div class='row'>
              <div class='col-xs-4'> Name: </div>
              <div class='col-xs-8' id='RIDEKEY-passengerName'> PASSENGERNAME </div>
          </div>
          <div class='row'>
              <div class='col-xs-4'> Email: </div>
              <div class='col-xs-8' id='RIDEKEY-passengerEmail'> PASSENGEREMAIL </div>
          </div>
          <div class='row'>
              <div class='col-xs-4'> Location: </div>
              <div class='col-xs-8' id='RIDEKEY-locationName'> locationName </div>
          </div>
          <div class='row'>
              <div class='col-xs-4'> Address: </div>
              <div class='col-xs-8' id='RIDEKEY-address'> locationAddress </div>
          </div>
          <div class='row'>
              <div class='col-xs-4'> Distance: </div>
              <div class='col-xs-8' id='RIDEKEY-distance'> LOCATIONDISTANCE km </div>
          </div>
          <div class='row'>
              <div class='col-xs-4'> Fare: </div>
              <div class='col-xs-8' id='RIDEKEY-fare'> Rs. RIDEFARE </div>
          </div>
          <div class='row'>
              <div class='col-xs-12'> <a class='btn btn-primary btn-block' id='RIDEKEY-confirmButton' href='#'> Pay and
                      Book </a> </div>
          </div>
      </div>
  </div>`;



      cardTemplate = cardTemplate.replace("ORIGIN", rideOrigin);
      cardTemplate = cardTemplate.replace("DESTINATION", rideDestination);
      cardTemplate = cardTemplate.replace("MONTH-DAY", date);
      cardTemplate = cardTemplate.replace("STARTINGTIME", rideTime);
      cardTemplate = cardTemplate.replace("AVAILABILITY", nSeats.toString());

      cardTemplate = cardTemplate.replace(new RegExp('RIDEKEY', 'g'), rideKey);
      rideItemNode.innerHTML = cardTemplate;


      // refresh list TODO: this is highly inefficient to refresh list every time a change is made in the data base. 
      allRideNode.appendChild(rideItemNode);


    });



    // keep the ride summary containers hidded untill necessary
    $(".ride-summary-cotainers").hide();

    // add auto complete listene
    var locationInputBoxes = document.querySelectorAll(".location-input");
    for (var i = 0; i < locationInputBoxes.length; i++) {
      var boxi = locationInputBoxes[i];

      // add on focus event listener
      boxi.addEventListener('focus', function () {
        rideId = this.id;

        autocomplete = new google.maps.places.Autocomplete(
          /** @type {!HTMLInputElement} */
          (document.getElementById(rideId)), {
            types: ['geocode']
          });

        geolocate();

        autocomplete.addListener('place_changed', distanceOfLocationFromBennett);

      });

    }


    // add click listners on car icons to show modals
    $('.add-car-button').on('click', function () {
      $('#carListModal').modal('show');
      var buttonId = this.id;
      // car ikons clicking sets the global variable rideKey to this key. Any car will be added to this  ride key.
      rideId = buttonId.substr(0, buttonId.length - 13);
    });
  });


}

// test writing




function initAutocomplete() {

  showAvailableRides(todayString);

}



function distanceOfLocationFromBennett() {

  // Get the place details from the autocomplete object.
  var place = autocomplete.getPlace();

  // Near Eastern periphery Expressway
  var origin1 = {
    lat: 28.440755,
    lng: 77.583857
  };

  var destinationA = place.formatted_address;
  console.log(destinationA);

  var service = new google.maps.DistanceMatrixService;
  service.getDistanceMatrix({
    origins: [origin1],
    destinations: [destinationA],
    travelMode: 'DRIVING',
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: false,
    avoidTolls: false
  }, function (response, status) {
    if (status !== 'OK') {
      alert('Error was: ' + status);
    } else {
      var originList = response.originAddresses;
      var destinationList = response.destinationAddresses;
      // var outputDiv = document.getElementById('output');
      // outputDiv.innerHTML = '';

      var results = response.rows[0].elements;

      var distance = results[0].distance.value; // in meters
      distance = 10 + Math.ceil(distance / 1000); // convert to Km and round up

      var fare = 5 * distance;

      //       document.querySelector("#distanceHolder").innerText = "Distance of selected location from Eastern Periphery (toll near Bennet): " + distance;
      document.querySelector("#" + rideId + "-passengerName").innerText = displayName;
      document.querySelector("#" + rideId + "-passengerEmail").innerText = email;
      document.querySelector("#" + rideId + "-locationName").innerText = place.name;
      document.querySelector("#" + rideId + "-address").innerText = place.formatted_address;
      document.querySelector("#" + rideId + "-distance").innerText = distance + " km"
      document.querySelector("#" + rideId + "-fare").innerText = "Rs " + fare;


      var newBooking = {
        Distance: distance,
        Email: email,
        LocationAddress: place.formatted_address,
        LocationName: place.name,
        Name: displayName,
        Phone: "",
        seatStatus: "",
        totalfare: fare,
        walletBalance: ""
      };

      $("#" + rideId + "-summary").show();

      $("#" + rideId + "-confirmButton").on('click', function () {

        var seatsRef = firebase.database().ref('rides/' + todayString + '/' + rideId + '/mSeats');
        seatsRef.once('value', function (snapshot) {

          if (parseInt(snapshot.val()) > 0) {
            // seats available, add to confirmed
            newBooking.seatStatus = "confirmed";
            firebase.database().ref('rides/' + todayString + '/' + rideId + '/passengers/' + passengerKey).set(
              newBooking,
              function (error) {
                if (error) {
                  // The write failed...
                } else {
                  // Data saved successfully!
                  alert("booking added in confirmed list");
                }
              });
          } else {
            // seats not available. Add in waiting list
            newBooking.seatStatus = "waiting";
            firebase.database().ref('rides/' + todayString + '/' + rideId + '/waiting/' + passengerKey).set(
              newBooking,
              function (error) {
                if (error) {
                  // The write failed...
                } else {
                  // Data saved successfully!
                  alert("booking added in waiting list");
                }
              });

          }

        });
      });
    }
  });
}


// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }

  $(".ride-summary-cotainers").hide();
}
// end setting up autocomplete




// get list of available cars
var carList = {};
var carsRef = firebase.database().ref('cabs');

carsRef.once('value', function (snapshot) {
  snapshot.forEach(function (childSnapshot) {
    carItem = childSnapshot.val();

    carList[carItem.cabNumber] = carItem;

    // inflate the car list modal
    var carItemNode = document.createElement("div");
    carItemNode.classList.add("panel");
    carItemNode.classList.add("panel-default");

    var carItemTemplate = `
    <div class='panel-body'>
    <div class='row'>
        <div class='col-xs-12'> VEHICLETYPE VEHICLENUMBER </div>
    </div>
    <div class='row'>
        <div class='col-xs-12'> DRIVERNAME </div>
    </div>
    <div class='row'>
        <div class='col-xs-12'> DRIVEREMAIL </div>
    </div>
    <div class='row'>
           <div class='col-xs-12'> DRIVEREPHONE </div>
    </div>
    <div class='row'>
        <div class='col-xs-10'> NUMSEATS seats </div>
        <div class='col-xs-2'> <a id='VEHICLENUMBER-add' class="add-car-to-ride"> <i class="fas fa-plus"></i> </a></div>
    </div>
  </div>
`;

    carItemTemplate = carItemTemplate.replace(new RegExp("VEHICLENUMBER", 'g'), carItem.cabNumber);
    carItemTemplate = carItemTemplate.replace("VEHICLETYPE", carItem.vehicleType);
    carItemTemplate = carItemTemplate.replace("DRIVERNAME", carItem.driverName);
    carItemTemplate = carItemTemplate.replace("DRIVEREMAIL", carItem.driverEmail);
    carItemTemplate = carItemTemplate.replace("DRIVEREPHONE", carItem.driverPhone);
    carItemTemplate = carItemTemplate.replace("NUMSEATS", carItem.seatCapacity);

    carItemNode.innerHTML = carItemTemplate;
    document.getElementById("carListContainer").appendChild(carItemNode);


  });

  // add click lister to add to ride button
  $(".add-car-to-ride").on('click', function () {

    // add this car in the database
    var carButtonId = this.id;
    carButtonId = carButtonId.substr(0, carButtonId.length - 4); // removing "-add" string from the end

    firebase.database().ref('rides/' + todayString + '/' + rideId + '/rideCabs/' + carButtonId).set(
      carList[carButtonId],
      function (error) {
        if (error) {
          // The write failed...
        } else {
          // Data saved successfully!
          $('#carListModal').modal('hide');
          alert("cab added successfully");
        }
      });
  })

});