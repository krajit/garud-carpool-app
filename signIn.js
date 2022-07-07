 // Initialize Firebase
 var config = {
   apiKey: "AIzaSyCukUtF99cDGHfFnOIQ1d7eImvRA3UgkEI",
   authDomain: "shuttletest03.firebaseapp.com",
   databaseURL: "https://shuttletest03.firebaseio.com",
   projectId: "shuttletest03",
   storageBucket: "shuttletest03.appspot.com",
   messagingSenderId: "42776782201"
 };
 firebase.initializeApp(config);

 function signIn() {
   var provider = new firebase.auth.GoogleAuthProvider();
   //firebase.auth().signInWithRedirect(provider);

   firebase.auth().signInWithPopup(provider).then(function (result) {
     // This gives you a Google Access Token. You can use it to access the Google API.
     var token = result.credential.accessToken;
     // The signed-in user info.
     var user = result.user;

     document.querySelector("#username").innerText = "Hello " + user.displayName;

     document.getElementById("signOutButton").removeAttribute('hidden');
     document.getElementById("signInButton").setAttribute('hidden', 'true');
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
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    console.log(displayName+" signed in");
    window.location = "/ridesList.html";
    // ...
  } else {
    // User is signed out.
    console.log("signed out");
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


 var userNameRef = firebase.database().ref('users/username');
 userNameRef.on('value', function (snapshot) {
   console.log(snapshot.val());
 });

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
       var childKey = childSnapshot.key;
       var childData = childSnapshot.val();

       var rideTime = childData.mTime;
       var rideOrigin = childData.mOrigin;
       var rideDestination = childData.mDestination;
       var nSeats = childData.mSeats;
       var nPassengers = childData.totalPassengers;

       var rideItemNode = document.createElement("li");
       rideItemNode.classList.add("list-group-item");

      var rideInfo = "<p>"+rideOrigin + " to " + rideDestination + "</p>\n";
      rideInfo = rideInfo + "Start time: " + rideTime + "<br>";
      rideInfo = rideInfo + "Seats: " + nSeats + "\n";
      rideInfo = rideInfo + "<button type='button' class='btn btn-outline-dark'>Book</button>";

      rideItemNode.innerHTML = rideInfo;

       // refresh list TODO: this is highly inefficient to refresh list every time a change is made in the data base. 
       allRideNode.appendChild(rideItemNode);


     });
   });

 }

 // test writing
// showAvailableRides('30-01-2019');