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

 function addRides(date, time, origin, destination, fare) {
   var newRideKey = firebase.database().ref('rides/' + date).push().key;
   firebase.database().ref('rides/' + date + '/' + newRideKey).set({
      acceptingBooking: "yes",
      mDestination: destination,
      mOrigin: origin,
      mSeats: 0,
      mTime: time,
      rideFare: parseInt(fare), // converted to int for compatibility with android garud
      totalPassengers: 0,
      totalSeats: 0,
      totalWaiting: 0

   }, function (error) {
     if (error) {
       // The write failed...
       alert("Network Error: Ride date could NOT be saved!!!");
     } else {
       // Data saved successfully!
       alert("Ride Data saved");
     }
   })
 }

 // attach this function to the submit button         
 $("#rideRegisterFormSubmitButton").on("click", function () {

   //TODO: add form validation functionality
   var date = $("#rideFormDate").val();
   var t = $("#rideFormTime").val();
   var o = $("#rideFormOrigin").val();
   var d = $("#rideFormDestination").val();
   var f = $("#rideFormFare").val();
   addRides(date, t, o, d, f);
 })


 // attach car registration function to as click lister on car form submission button
 $("#carRegisterFormSubmitButton").on("click", function () {

   // get form data
   var vNumber = $("#carFormVNumber").val();
   var dName = $("#carFormDriverName").val();
   var dPhone = $("#carFormDriverPhone").val();
   var dEmail = $("#carFormDriverEmail").val();
   var vSeats = $("#carFormNSeats").val();
   var cType = $("#carFormVType").val();

   // TODO: add form data validation filter


   // Add these data in the firebase dataBase
   firebase.database().ref('cabs/' + vNumber + '/').set({
    cabNumber: vNumber,
    driverEmail: dEmail,
    driverName: dName,
    driverPhone: dPhone,
    seatCapacity: parseInt(vSeats),  // converted to int for compatibility with android garud
    vehicleType: cType
   }, function (error) {
     if (error) {
       // The write failed...
       alert("Network Error: Cab could not be saved in the database!!!");
     } else {
       // Data saved successfully!
       alert("Cab registered");
     }
   })
   // end adding to firebase

 })