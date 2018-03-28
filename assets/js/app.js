let database = firebase.database();
let userName = '';
let userId = '';

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        console.log(user.uid);
        console.log(firebase.auth().currentUser.displayName);
        $('#current-user').text(firebase.auth().currentUser.displayName + ' is connected');
        $('#signup').hide();
        $('#login').hide();
        $('#logout').show();
    } else {
        $('#login-status').text('not logged in :(');
        $('#signup').show();
        $('#login').show();
        $('#logout').hide();
    }
});

$(document).ready(function(){
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

    $(document).on('click', '#logout-button', function (event) {
        firebase.auth().signOut().then(function() {
            console.log('logout successful');
          }).catch(function(error) {
            // An error happened.
          });
    });

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

    

});