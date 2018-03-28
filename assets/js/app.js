let database = firebase.database();

var STATE = {OPEN: 1, CLOSED:2}

//listener on connection/disconnection
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        console.log(user.uid);
        console.log(firebase.auth().currentUser.displayName);
        $('#current-user').text(firebase.auth().currentUser.displayName + ' is connected');
        $('#signup').hide();
        $('#login').hide();
        $('#logout').show();
        $('#session-control').show();
    } else {
        $('#login-status').text('not logged in :(');
        $('#signup').show();
        $('#login').show();
        $('#logout').hide();
        $('#session-control').hide();
    }
});

//listener on new game session created
database.ref('sessions').on("child_added", function(snapshot){
    let creatorUid = snapshot.val().creator.uid;
    if (creatorUid === firebase.auth().currentUser.uid){
        $('#session-control').hide();
        $('#current-game').text('Waiting for a worthy opponent');
    } else {
        let sessionName = $('<div>' + snapshot.val().creator.displayName + ' session</div>');
        let joinButton = $('<button></button>').attr('id', snapshot.key).text('join Session').addClass('join-button');
        $('#open-sessions').append(sessionName).append(joinButton);
    }
});

$(document).ready(function(){
    // signup button
    $(document).on('click', '#signup-button', function (event) {
        let name = $('#signup-name').val();
        let email = $('#signup-email').val();
        let password = $('#signup-password').val();
        firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode + '   ' + errorMessage);
          }).then(function(user){
              user.updateProfile({displayName: name});
          });
    });

    // logout button
    $(document).on('click', '#logout-button', function (event) {
        firebase.auth().signOut().then(function() {
            console.log('logout successful');
          }).catch(function(error) {
            // An error happened.
          });
    });

    //login button
    $(document).on('click', '#login-button', function (event) {
        let email = $('#login-email').val();
        let password = $('#login-password').val();
        firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // ...
          });
    });

    // create session button
    $(document).on('click','#create-game', function(event){
        let session = {
            'creator': {
                'displayName': firebase.auth().currentUser.displayName,
                'uid': firebase.auth().currentUser.uid,
            },
            state: STATE.OPEN,
        }
        database.ref('sessions').push(session);
    });

    $(document).on('click','.join-button', function(event){
        let sessionUid = $(event.target).attr('id');
        let joiner = {
            'displayName': firebase.auth().currentUser.displayName,
            'uid': firebase.auth().currentUser.uid,
        };
        database.ref('sessions/' + sessionUid + '/joiner').set(joiner);
        database.ref('sessions/' + sessionUid + '/state').set(STATE.CLOSED);
    });

});