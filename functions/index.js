const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const request = require('request');
const nodemailer = require('nodemailer');
const APP_NAME = 'Garud Carpool App';

const ref = admin.database().ref();


var moment = require('moment');

exports.updateAvailableSeatsOnAdditionOfCars = functions.database.ref('/rides/{date}/{rideKey}/rideCabs')
    .onWrite((event, constext) => {

        var totalNumSeats = 0;

        // reference to all cars added in this ride
        const eventData = event.after.val();

        // sum of all seat capacity of all cars
        for (var vNum in eventData) {
            totalNumSeats += eventData[vNum].seatCapacity;
        }
        event.after.ref.parent.child('totalSeats').set(totalNumSeats);


        // get current number of passengers and show number of unbooked seats
        //const numPass = event.ref.parent.child('totalPassengers').val();
        const xyz = event.after.ref.parent.child('totalPassengers');
        xyz.once('value', function (snapshot) {
            var numPassengers = parseInt(snapshot.val());
            var availableSeats = totalNumSeats - numPassengers;
            // update database
            event.after.ref.parent.child('mSeats').set(availableSeats);
        });

        return null;
    });

exports.updateNumberOfPassengers = functions.database.ref('/rides/{date}/{rideKey}/passengers/{passengerKey}/Name')
    .onWrite((event, context) => {

        console.log('passenger booked or cancelled');

        var totalPassengers = 0;
        //var eventData =  event.data.ref.parent.parent.parent.child('passengers');
        var eventData = ref.child("rides").child(context.params.date).child(context.params.rideKey).child("passengers");
        // read passenger key list and address list
        eventData.once('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                totalPassengers += 1;
            });

            //event.data.ref.parent.parent.parent.child('totalPassengers').set(totalPassengers);
            ref.child("rides").child(context.params.date).child(context.params.rideKey).child('totalPassengers').set(totalPassengers);

            // read current number total seats, subtract that from total seats
            // and update available seats
            //            var xyz = event.data.ref.parent.child('totalSeats');
            var xyz = ref.child("rides").child(context.params.date).child(context.params.rideKey).child('totalSeats');
            xyz.once('value', function (snapshot) {
                var numSeats = parseInt(snapshot.val());
                var availableSeats = numSeats - totalPassengers;
                // update database
                //event.data.ref.parent.parent.parent.child('mSeats').set(availableSeats);
                ref.child("rides").child(context.params.date).child(context.params.rideKey).child('mSeats').set(availableSeats);
            });

        });
        return "all good";
    });





exports.updateNumberOfWaitingPassengers = functions.database.ref('/rides/{date}/{rideKey}/waiting/{passengerKey}/Name')
    .onWrite((event, context) => {

        console.log('passenger booked or cancelled');

        var totalPassengers = 0;
        var eventData = ref.child("rides").child(context.params.date).child(context.params.rideKey).child('waiting');

        // read passenger key list and address list
        eventData.once('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {

                totalPassengers += 1;
            });


            ref.child("rides").child(context.params.date).child(context.params.rideKey).child('totalWaiting').set(totalPassengers);

            // read current number total seats, subtract that from total seats
            // and update available seats
            var xyz = ref.child("rides").child(context.params.date).child(context.params.rideKey).child('totalSeats');
            xyz.on('value', function (snapshot) {
                var totalSeats = parseInt(snapshot.val());

                var bookedPass = ref.child("rides").child(context.params.date).child(context.params.rideKey).child('totalPassengers');
                bookedPass.on('value', function (totalPassSnapshot) {

                    var totalNumberOfConfirmedPass = parseInt(totalPassSnapshot.val());
                    var availableSeats = totalSeats - totalNumberOfConfirmedPass - totalPassengers;
                    ref.child("rides").child(context.params.date).child(context.params.rideKey).child('mSeats').set(availableSeats);
                });


            });


        });
        return null;
    });


exports.sendBookingConfirmation = functions.database.ref('/rides/{date}/{rideKey}/passengers/{passKey}')
    .onCreate((event, context) => {

        const passSnapShot = event.val();

        //change the seatStatus to confirmed on addition here
        event.ref.child("seatStatus").set("confirmed");

        // get ride reference
        var rideRef = event.ref.parent.parent;
        rideRef.once('value', function (rideSnapShot) {

            var rideDate = context.params.date;
            var rideTime = setDisplayTime(rideSnapShot.val().mTime);
            var rideOrigin = rideSnapShot.val().mOrigin;
            var rideDestination = rideSnapShot.val().mDestination;

            var location = "Drop Location";
            var locationAddress = "Drop Off Address";
            if (rideDestination == "SNU") {
                location = "Pick up location";
                locationAddress = "Pick up address";
            }

            var passName = passSnapShot.Name;
            var passEmail = passSnapShot.Email;
            var passFare = passSnapShot.totalfare;
            var passLocation = passSnapShot.LocationName;
            var passLocationAddress = passSnapShot.LocationAddress;

            var subject = `${APP_NAME} - Reservation Confirmed - ${rideDate} - ${rideTime}`; //`Payment Confirmation for ${APP_NAME}`;
            var emailBody = `Hi ${passName},\nYour reservation for a ride from ${rideOrigin} to ${rideDestination} on ${rideDate} at ${rideTime} is confirmed. \nDriver details will be mailed to you 15 minutes before the ride starting time.\n\n${location} : ${passLocation}\n${locationAddress} : ${passLocationAddress}\n\nThanks\nGarud Carpool Team`;

            return sendEmail(passEmail, passName, subject, emailBody);
        });

        return null;
    });


// on taking waiting ticket
exports.sendWaitingAcknowledgement = functions.database.ref('/rides/{date}/{rideKey}/waiting/{passKey}')
    .onCreate((event, context) => {

        var passSnapShot = event.val();

        // get ride reference
        var rideRef = event.ref.parent.parent;
        rideRef.once('value', function (rideSnapShot) {

            var rideDate = context.params.date;
            var rideTime = setDisplayTime(rideSnapShot.val().mTime);
            var rideOrigin = rideSnapShot.val().mOrigin;
            var rideDestination = rideSnapShot.val().mDestination;

            var location = "Drop Location";
            var locationAddress = "Drop Off Address";
            if (rideDestination == "SNU") {
                location = "Pick up location";
                locationAddress = "Pick up address";
            }

            var passName = passSnapShot.Name;
            var passEmail = passSnapShot.Email;
            var passFare = passSnapShot.totalfare;
            var passLocation = passSnapShot.LocationName;
            var passLocationAddress = passSnapShot.LocationAddress;

            var subject = `${APP_NAME} - Reservation Waiting - ${rideDate} - ${rideTime}`; //`Payment Confirmation for ${APP_NAME}`;
            var emailBody = `Hi ${passName},\nYour reservation for a ride from ${rideOrigin} to ${rideDestination} on ${rideDate} at ${rideTime} is on the waiting list. We will try to find more cabs to accomodate you. You will get an email if your ride gets confirmed. Else it will be automatically gets cancelled 15 minutes before the ride starting time. \n\n${location} : ${passLocation}\n${locationAddress} : ${passLocationAddress}\n\nThanks\nGarud Carpool Team`;

            return sendEmail(passEmail, passName, subject, emailBody);
        });

        return null;
    });

// ticket cancelled confirmation
exports.sendTicketCancellationAcknowledgement = functions.database.ref('/rides/{date}/{rideKey}/cancelled/{passKey}')
    .onWrite((event, context) => {

        var pass = event.after.val();

        // get ride reference
        var rideRef = event.after.ref.parent.parent;
        rideRef.once('value', function (rideSnapShot) {

            var rideDate = context.params.date;
            var rideTime = setDisplayTime(rideSnapShot.val().mTime);
            var rideOrigin = rideSnapShot.val().mOrigin;
            var rideDestination = rideSnapShot.val().mDestination;



            var passName = pass.Name;
            var passEmail = pass.Email;
            var passSeatStatus = pass.seatStatus;

            var subject = `${APP_NAME} - Reservation Cancelled - ${rideDate} - ${rideTime}`;
            var emailBody = `Hi ${passName},\nYour ${passSeatStatus} reservation for a ride from ${rideOrigin} to ${rideDestination} on ${rideDate} at ${rideTime} has been cancelled. Your money will be refunded in your account in next two days. \n\nThanks\nGarud Carpool Team`;

            return sendEmail(passEmail, passName, subject, emailBody);
        });
        return null;
    });


// email set up
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = 'garudcarpool@gmail.com'; //functions.config().gmail.email;
const gmailPassword = 'itsSecret'; //functions.config().gmail.password;

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});


// Sends a welcome email to the given user.
function sendEmail(emailId, displayName, mailSubject, textBody) {
    const mailOptions = {
        from: `${APP_NAME}`,
        to: emailId,
        subject: mailSubject,
        text: textBody
    };

    // The user subscribed to the newsletter.
    return mailTransport.sendMail(mailOptions).then(() => {
        return console.log('Email sent to:', emailId);
    });
}


// Sends a welcome email to the given user.
function sendHtmlEmail(emailId, displayName, mailSubject, textBody) {
    const mailOptions = {
        from: `${APP_NAME}`,
        to: emailId,
        subject: mailSubject,
        html: textBody
    };

    // The user subscribed to the newsletter.
    return mailTransport.sendMail(mailOptions).then(() => {
        return console.log('Email sent to:', emailId);
    });
}



function setDisplayTime(databaseTime) {
    var rideTime = databaseTime;
    var displayTime = moment(rideTime, 'HHmm');
    return displayTime.format("h:mm a");
}


//-----------------------------------
exports.assignPassengersToCabs = functions.database.ref('/rides/{date}/{rideKey}/assignCabs')
    .onWrite((event, context) => {
        console.log("Cab assigning initiated");

        var rideDate = context.params.date;

        var rideInfo = event.after.ref.parent;
        rideInfo.once('value', function (rideSnapShot) {

            var rideTime = rideSnapShot.val().mTime;
            rideTime = setDisplayTime(rideTime); // format to 0900 to 9:00 am etc


            // extract list of cabs
            var cabs = event.after.ref.parent.child('rideCabs');
            cabs.once('value', function (snapshot) {

                var allocatedPassengers = 0;

                // assign passengers to each cab
                snapshot.forEach(function (childSnapshot) {


                    // This function may be called multiple times.
                    // clean up already existing assigned passengers
                    childSnapshot.ref.child('passengers').set(null);


                    // Check if the ride is FROM or TO SNU
                    // If is from SNU, then pickUp time is ride starting time, and pickUp location is SNU
                    // If the ride is to SNU then, then pickup location is different for each passenger
                    //
                    // Formula for the pick up location
                    // for each cab
                    //     - pickup time for the farthest (SNU) is the ride time
                    //     - for every subsequent passenger,
                    //           - find distance from the previous passenger
                    //           - his pick up time = previous pick up time + (2 min)*(distance from prev passenger)
                    var rideDestination = rideSnapShot.val().mDestination;
                    var pickUpTime = rideSnapShot.val().mTime; // to be modified if the ride is towards SNU
                    var pickUpLocation = rideDestination; // to be modified if the ride is towards SNU

                    var passengerSortingKey = "";

                    if (rideDestination.indexOf('SNU') >= 0) {
                        // ride towards SNU
                        passengerSortingKey = 'reverseDistanceRanking';

                    } else {
                        // ride is from SNU
                        passengerSortingKey = 'distanceRanking';
                    }


                    var nSeats = parseInt(childSnapshot.val().seatCapacity);
                    var cabEmail = childSnapshot.val().driverEmail;
                    var driverName = childSnapshot.val().driverName;
                    var driverPhone = childSnapshot.val().driverPhone;
                    var vehicleNumber = childSnapshot.val().cabNumber;
                    var vehicleType = childSnapshot.val().vehicleType;



                    // get nSeats number of passengers who have not been assigned cabs yet
                    var freePassengers = cabs.ref.parent.child('passengers')
                        .orderByChild(passengerSortingKey)
                        .startAt(allocatedPassengers + 1)
                        .limitToFirst(nSeats);

                    // TODO: passenger sorting key is not implemented. Thats why this is giving error.



                    freePassengers.once('value', function (freePassSnapshot) {

                        // initiate mail body and subject
                        var subject_mailToDriver = "Passengers Details - " + rideDate + " - " + rideTime;
                        var subject_mailToPassenger = "Cab Details - " + rideDate + " - " + rideTime; // TODO: improve subject

                        // initiate counter for passenger list
                        var i = 0;
                        var body_mailToDriver = '-----------------------\n'

                        freePassSnapshot.forEach(function (childPassSnapshot) {

                            i = i + 1; // increment passenger counter

                            var passKey = childPassSnapshot.key;
                            var currPass = childPassSnapshot.val();

                            // add passenger inside individual rides
                            childSnapshot.ref.child('passengers').child(passKey).set(currPass);

                            // mail body to passengers
                            var passEmail = childPassSnapshot.val().Email;
                            var passName = childPassSnapshot.val().Name;
                            var locationName = childPassSnapshot.val().LocationName;
                            var locationAddress = childPassSnapshot.val().LocationAddress;
                            var passengerPhone = childPassSnapshot.val().Phone;


                            var pickUpTimexxx = setDisplayTime(pickUpTime);

                            body_mailToDriver = body_mailToDriver +
                                `<table border="1">
                                <tr> <td> Passenger </td> <td> : </td> ${i} </td> </tr>
                                <tr> <td> Name </td> <td> : </td> ${passName}   </tr>
                                <tr> <td> Location </td> <td> : </td> ${locationName}   </tr>
                                <tr> <td> Address </td> <td> : </td> ${locationAddress}   </tr>
                                <tr> <td> Phone </td> <td> : </td> +91${passengerPhone}   </tr>
                                <tr> <td> Pick up time </td> <td> : </td> ${pickUpTimexxx}   </tr>
                             </table>\n`;


                            // mail to passenger
                            var body_mailToPassenger = "Driver Name: " + driverName + "\n" +
                                "Driver Phone: " + driverPhone + "\n" +
                                "Vehicle Number: " + vehicleNumber + "\n" +
                                "Vehicle Type: " + vehicleType + "\n";

                            body_mailToPassenger = body_mailToPassenger + "Pick up Time: " + setDisplayTime(pickUpTime) + "\n";

                            // send driver details to passengers
                            sendEmail(passEmail, passName, subject_mailToPassenger, body_mailToPassenger);

                            // adjust pickup time for  next passenger for journey towards SNU
                            if (passengerSortingKey == "reverseDistanceRanking") {
                                // get distance of the next pickup
                                var distanceOfNextPassenger = childPassSnapshot.val().DistanceFromLastStop;

                                // minutes away from next passenger, assuming speed of 30 km/h
                                var minutesAwayFromNextPassenger = Math.floor(2 * distanceOfNextPassenger);

                                // add this much minutes to pickUp time of next passenger
                                pickUpTime = moment(pickUpTime, 'HHmm');
                                pickUpTime.add(minutesAwayFromNextPassenger, 'minutes');

                                //                                pickUpTime = parseInt(pickUpTime) + minutesAwayFromNextPassenger; // pickup time becomes integer
                                //                                pickUpTime = pickUpTime.toString() // switch to being a string
                            }


                        });

                        // send passengers info to driver
                        sendHtmlEmail(cabEmail, driverName, subject_mailToDriver, body_mailToDriver);

                        //childSnapshot.ref.child('passengers').set(snapshot.val());
                        console.log("looking good");
                    });

                    allocatedPassengers += nSeats;
                });
            });
        });
        return "all ok";
    });




// optimization routine triggered once passengers are added
exports.optimizeRouteOnPassengerAddition = functions.database.ref('/rides/{date}/{rideKey}/passengers/{passenger}')
    .onCreate((event, context) => {
        OptimizationRoutine(event);

        return null;
    });

// optimization routine triggered once passengers are deleted
exports.optimizeRouteOnPassengerDeletion = functions.database.ref('/rides/{date}/{rideKey}/passengers/{passenger}')
    .onDelete((event, context) => {
        OptimizationRoutine(event);
        return null;
    });


// optimization routine
function OptimizationRoutine(event) {
    console.log("route optimizer initiated");

    var passengers = event.ref.parent.parent.child('passengers');
    var passKeyList = ["dummyORIGINkey"];
    var destinations = ['Omaxe palm greens, Sector MU, Greater Noida, Uttar Pradesh 201308']; //['Shiv Nadar University, Greater Noida, Uttar Pradesh, India'];
    var cumDistanceFromSNU = [14.0]; //[0.0];
    var distanceFromLastStop = [14.0]; //

    // read passenger key list and address list
    passengers.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {

            passKeyList.push(childSnapshot.key); // array of drop location keys
            destinations.push(childSnapshot.val().LocationAddress); // array of drop of location address
        });

        // get distance matrix
        var distance = require('google-distance-matrix');

        distance.key('AIzaSyC2M-ldFHVYuwwMUIADwJhjXDQ9ItCwErg');
        distance.units('metric');
        //origin      //destination
        distance.matrix(destinations, destinations, function (err, distances) {
            if (err) {
                return console.log(err);
            }
            if (!distances) {
                return console.log('no distances');
            }
            if (distances.status == 'OK') {

                var destinationIndex = [];
                for (var i = 1; i < destinations.length; i++) {
                    destinationIndex.push(i);
                }

                var rankedDestinationIndex = [0]; // shiv nadar is the starting point
                var remainingDestinationIndex = destinationIndex;



                for (var j = 0; j < destinations.length - 1; j++) {
                    // current origin is the
                    var currentOriginIndex = rankedDestinationIndex[rankedDestinationIndex.length - 1];

                    // find distance of current origin to all remaining destinations
                    var currentToRemainingDistances = [];

                    for (var i = 0; i < remainingDestinationIndex.length; i++) {
                        var currentDestinationIndex = remainingDestinationIndex[i];

                        // extract distance string
                        var xy = distances.rows[currentOriginIndex].elements[currentDestinationIndex].distance.text;

                        // extract number from string
                        var regex = /[+-]?\d+(\.\d+)?/g;
                        var xyFloats = xy.match(regex); //.map(function(v) { return parseFloat(v); });
                        xyFloats = parseFloat(xyFloats);
                        // todo: create a check to convert distance in meters to kms

                        // append this new distances
                        currentToRemainingDistances.push(xyFloats);
                    }
                    // get index of smallest distance
                    var minIndex = currentToRemainingDistances.indexOf(Math.min.apply(null, currentToRemainingDistances));

                    var minDistanceAmongRemaining = Math.min.apply(null, currentToRemainingDistances);


                    distanceFromLastStop.push(minDistanceAmongRemaining);
                    cumDistanceFromSNU.push(cumDistanceFromSNU[cumDistanceFromSNU.length - 1] + minDistanceAmongRemaining);


                    // add nearest distance to rankedDestinations
                    rankedDestinationIndex.push(remainingDestinationIndex[minIndex]);
                    // remove minIndex position of remainingDestinationIndex
                    remainingDestinationIndex.splice(minIndex, 1);
                }
                // finally add the last destination
                //rankedDestinationIndex.push(remainingDestinationIndex[0]);

                // add ranking attributes in passengers
                for (var i = 1; i < passKeyList.length; i++) {

                    var indexOfi = rankedDestinationIndex.indexOf(i);

                    event.ref.parent.parent.child('passengers').child(passKeyList[i]).child('distanceRanking').set(indexOfi);
                    event.ref.parent.parent.child('passengers').child(passKeyList[i]).child('reverseDistanceRanking').set(passKeyList.length - indexOfi);
                    event.ref.parent.parent.child('passengers').child(passKeyList[i]).child('DistanceFromLastStop').set(distanceFromLastStop[indexOfi]);
                    event.ref.parent.parent.child('passengers').child(passKeyList[i]).child('CumulativeDistanceFromSNU').set(cumDistanceFromSNU[indexOfi]);
                }

                // set cumulative distance

            } else {
                return console.log(err);
            }
        });
    });

    return "all ok";
    //return event.data.ref.parent.child('distanceRanking').set("1");

}


exports.confirmCancel = functions.database.ref('/rides/{date}/{rideKey}/passengers/{passengerKey}')
    .onDelete((event, context) => {

        var deletedPass = event.val();
        var passKey = context.params.passengerKey;

        // add passenger in cancellation list
        event.ref.parent.parent.child('cancelled').child(passKey).set(deletedPass);

        // get a passenger from the waiting list and add it in the confirmed passenger list
        //TODO: I am here. get a passenger from waiting list and move to confirmed list.
        var waitingList = event.ref.parent.parent.child('waiting').limitToFirst(1);
        waitingList.once('value', function (waitingListSnapshot) {
            waitingListSnapshot.forEach(function (childWaitingListSnapshot) {

                var passKey = childWaitingListSnapshot.key;
                var passenger = childWaitingListSnapshot.val();

                // add this passenger to confirmed list
                event.ref.parent.parent.child('passengers').child(passKey).set(passenger);

                // then remove this remove this passenger from waiting list
                event.ref.parent.parent.child('waiting').child(passKey).set(null);
            });
        });
        return null;
    });


exports.waitingCancel = functions.database.ref('/rides/{date}/{rideKey}/waiting/{passengerKey}')
    .onDelete((event, context) => {

        var deletedPass = event.val();
        var passKey = context.params.passengerKey;

        // add passenger in cancellation list & process refund manually
        event.ref.parent.parent.child('cancelled').child(passKey).set(deletedPass);
        return null;
    });



exports.waitingToConfirmOnCabAddition = functions.database.ref('/rides/{date}/{rideKey}/rideCabs/{vehicleNumber}/seatCapacity')
    .onWrite((event, context) => {

        const numSeatsAdded = event.after.val();

        console.log(numSeatsAdded);

        // get a passenger from the waiting list and add it in the confirmed passenger list
        var waitingList = event.after.ref.parent.parent.parent.child('waiting').limitToFirst(numSeatsAdded);

        waitingList.once('value', function (waitingListSnapshot) {
            waitingListSnapshot.forEach(function (childWaitingListSnapshot) {

                var passKey = childWaitingListSnapshot.key;
                var passenger = childWaitingListSnapshot.val();

                // add this passenger to confirmed list
                event.after.ref.parent.parent.parent.child('passengers').child(passKey).set(passenger);

                // then remove this remove this passenger from waiting list
                event.after.ref.parent.parent.parent.child('waiting').child(passKey).set(null);

                // delete from waiting list will automatically put passKey in cancelled list
                // clean up from there
            });
        });
        return null;
    });


// remove items from cancel items who are added in confirm
exports.cancelCleanUp = functions.database.ref('/rides/{date}/{rideKey}/cancelled/{passKey}')
    .onWrite((event, context) => {

        var passKey = context.params.passKey;
        var confirmedList = event.after.ref.parent.parent.child('passengers').child(passKey);
        confirmedList.once('value', function (snapshot) {
            if (snapshot.val() != null) {
                //
                console.log("found ");
                event.after.ref.parent.parent.child('cancelled').child(passKey).set(null);

            } else {
                console.log("not found");
            }

        });
        return null;
    });


// TODO: this function not tested in firebase-web
exports.setCurrentTimeInDaysRides =
    functions.pubsub.topic('daily-ten-min-ticks').onPublish((event) => {

        var timeNow = moment().utcOffset(330); // India offset - +5:30 hours = 330 minutes


        var HH = timeNow.hours().toLocaleString(undefined, {
            minimumIntegerDigits: 2
        });
        var mm = timeNow.minutes().toLocaleString(undefined, {
            minimumIntegerDigits: 2
        });

        var day = timeNow.date().toLocaleString(undefined, {
            minimumIntegerDigits: 2
        });
        var month = (timeNow.month() + 1).toLocaleString(undefined, {
            minimumIntegerDigits: 2
        });
        var year = timeNow.year().toString();

        var todayDate = day + "-" + month + "-" + year;

        var dayRideRef = ref.child("rides").child(todayDate);
        // read ride key
        dayRideRef.once('value', function (daySnapshot) {
            daySnapshot.forEach(function (rideSnapShot) {
                var rideKey = rideSnapShot.key;
                var rideTime = moment(rideSnapShot.val().mTime, 'hhmm');
                var hh = rideTime.hours().toLocaleString(undefined, {
                    minimumIntegerDigits: 2
                });
                var mm = rideTime.minutes().toLocaleString(undefined, {
                    minimumIntegerDigits: 2
                });
                rideTime = moment.parseZone(year + "-" + month + "-" + day + "T" + hh + ":" + mm + ":00+05:30");

                var minutesToRide = rideTime.diff(timeNow, 'minutes');

                // update minutes left time to this ride
                ref.child("rides").child(todayDate).child(rideKey).child("minutesBeforeRide").set(minutesToRide);

                // if close enough, trigger cab assigning process
                // traffic to SNU will get notified 15 minutes before the starting time


                var origin = rideSnapShot.val().mOrigin;
                var minutesToWaitBeforeRide = 16;
                if (origin == "SNU") {
                    minutesToWaitBeforeRide = 6;
                }

                if (minutesToRide < minutesToWaitBeforeRide) {
                    // check in case the ride booking has already turned off
                    var rideAcceptingBooking = rideSnapShot.val().acceptingBooking;

                    // check if the announcement has already been set
                    if (rideAcceptingBooking == "yes") {
                        // ride time close enough now.
                        // ping ../assignCab location to send out passenger info to cab
                        // and cab info to passengers
                        rideSnapShot.ref.child("assignCabs").set(mm);

                        // set acceptingBooking = "no"
                        rideSnapShot.ref.child("acceptingBooking").set("no");

                        // A listener is set to read this value and turn off booking if acceptingBooking == "no"

                        // TODO: cancel all waiting passengers
                    } //else {
                    // ride booking already closed
                    // announcement already sent out
                    // do nothing
                    //}
                }

            });
        });
        return null;
    });



// cancel all waiting passengers on ride booking closing
exports.cancelRemainingWaiting = functions.database.ref('/rides/{date}/{rideKey}/acceptingBooking')
    .onWrite(event => {

        var acceptingBooking = event.after.val();

        if (acceptingBooking == "no") {
            event.after.ref.parent.child('waiting').set(null);
        }

        // as soon as the passenger is deleted from waiting list, it gets automatically added to the
        // cancellation list
        // TODO: add passenger refund amount in the passenger wallet amount

        return null;
    });


exports.deductWalletOnWaitingBooking = functions.database.ref('/rides/{date}/{rideKey}/waiting/{passengerKey}/totalfare')
    .onCreate((event, context) => {

        var fare = parseFloat(event.val()); // fare is string, need to cast it as integer
        fare = Math.floor(fare);

        var walletRef = ref.child("registeredUsers").child(context.params.passengerKey).child("walletBalance");

        // read passenger key list and address list
        walletRef.once('value', function (snapshot) {
            var prevBal = snapshot.val();
            walletRef.set(prevBal - fare);
        });

        return null;
    });


exports.addToWalletOnWaitingCancellation = functions.database.ref('/rides/{date}/{rideKey}/waiting/{passengerKey}/totalfare')
    .onDelete((event, context) => {

        var fare = parseFloat(event.val()); // fare is string, need to cast it as integer
        fare = Math.floor(fare);

        var walletRef = ref.child("registeredUsers").child(context.params.passengerKey).child("walletBalance");

        // read passenger key list and address list
        walletRef.once('value', function (snapshot) {
            var prevBal = snapshot.val();
            walletRef.set(prevBal + fare);
        });

        return null;
    });


exports.deductWalletOnConfirmBooking = functions.database.ref('/rides/{date}/{rideKey}/passengers/{passengerKey}/totalfare')
    .onCreate((event, context) => {

        var fare = parseFloat(event.after.val()); // fare is string, need to cast it as integer
        fare = Math.floor(fare);

        var walletRef = ref.child("registeredUsers").child(context.params.passengerKey).child("walletBalance");

        // read passenger key list and address list
        walletRef.once('value', function (snapshot) {
            var prevBal = snapshot.val();
            walletRef.set(prevBal - fare);
        });

        return null;
    });



exports.addToWalletOnConfirmCancellation = functions.database.ref('/rides/{date}/{rideKey}/passengers/{passengerKey}/totalfare')
    .onDelete((event, context) => {

        var fare = parseFloat(event.val()); // fare is string, need to cast it as integer
        fare = Math.floor(fare);

        var walletRef = ref.child("registeredUsers").child(context.params.passengerKey).child("walletBalance");

        // read passenger key list and address list
        walletRef.once('value', function (snapshot) {
            var prevBal = snapshot.val();
            walletRef.set(prevBal + fare);
        });

        return null;
    });