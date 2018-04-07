let database = firebase.database();

// used to track login status
var LOGIN_STATE = {
    LOGIN: 1,
    SIGNUP: 2,
    LOGGED: 3,
}

// used to track UI status once logged
var MAIN_APP_STATE = {
    SESSIONS: 1,
    WAITING_JOINER: 2,
    GAME: 3,
    WAITING_CHOICE: 4,
    GAME_RESULTS: 5,
}

var app_view = {
    loginState: 1,
    appState: 1,
    render: function(){
        let signup = $('#signup');
        let login = $('#login');
        let mainApp = $('#main-app');
        let sessions = $('#session-control');
        let waitingJoiner = $('#waiting-joiner')
        let game = $('#current-game');
        let waitingChoice = $('#waiting-choice');
        let gameResults = $('#game-results');
        //TODO: write it
        if (this.loginState === 1){
            signup.hide();
            login.show();
            mainApp.hide();
            sessions.hide();
            waitingJoiner.hide();
            game.hide();
            waitingChoice.hide();
            gameResults.hide();
        } else if (this.loginState === 2) {
            signup.show();
            login.hide();
            mainApp.hide();
            sessions.hide();
            waitingJoiner.hide();
            game.hide();
            waitingChoice.hide();
            gameResults.hide();
        } else if (this.loginState === 3) {
            signup.hide();
            login.hide();
            mainApp.show();
            if (this.appState === 1){
                sessions.show();
                waitingJoiner.hide();
                game.hide();
                waitingChoice.hide();
                gameResults.hide();
            } else if (this.appState === 2){
                sessions.hide();
                waitingJoiner.show();
                game.hide();
                waitingChoice.hide();
                gameResults.hide();
            } else if (this.appState === 3){
                sessions.hide();
                waitingJoiner.hide();
                game.show();
                waitingChoice.hide();
                gameResults.hide();
            } else if (this.appState === 4){
                sessions.hide();
                waitingJoiner.hide();
                game.hide();
                waitingChoice.show();
                gameResults.hide();
            } else if (this.appState === 5){
                sessions.hide();
                waitingJoiner.hide();
                game.hide();
                waitingChoice.hide();
                gameResults.show();
            }
        }
    },
    setLoginState: function(newState){
        this.loginState = newState;
        this.render();
    },
    setAppState:function(newState){
        this.appState = newState;
        this.render();
    }
}

var GAME_STATE = {
    OPEN: 1, 
    CLOSED:2,
}

var user = {
    uid: '',
    role: '',
    choice: '',
    sessionuid: '',
}

var opponent = {
    role: '',
    // could be used to inform the user that the opponent has made his choice
    hasChosen: false,
    choice: '',
}


//listener on connection/disconnection
firebase.auth().onAuthStateChanged(function (loggedUser) {
    if (loggedUser) {
        user.uid = loggedUser.uid;
        $('#current-user').text(firebase.auth().currentUser.displayName + ' is connected');
        app_view.setLoginState(LOGIN_STATE.LOGGED);
        app_view.setAppState(MAIN_APP_STATE.SESSIONS);
        listenToSessions();
        listenToSessionsChanges();
    } else {
        app_view.setLoginState(LOGIN_STATE.LOGIN);
        user.uid = '';
        user.role = '';
        user.choice = '';
        opponent.role = '';
        opponent.hasChosen = false;
        opponent.choice = '';
        $('#open-sessions').empty();
    }
});

//listener on new game session created
//FIXME: right after a game is created, if another user logs from the same computer, he can still log somehow
//TODO: [TO TEST] should there be a filter on game that are OPEN ? for the case of a user who connects later
function listenToSessions(){
    database.ref('sessions').on("child_added", function(snapshot){
        console.log(snapshot.val());
        let creatorUid = snapshot.val().creator.uid;
        console.log(creatorUid);
        if (snapshot.val().state === 1){
            if (creatorUid === firebase.auth().currentUser.uid){
                user.role = 'creator';
                user.sessionuid = snapshot.key;
                app_view.setAppState(MAIN_APP_STATE.WAITING_JOINER);
            } else {
                let sessionDiv = $('<div data-sessionId="'+ snapshot.key +'"></div>')
                let sessionName = $('<div>' + snapshot.val().creator.displayName + ' session</div>');
                let joinButton = $('<button></button>').attr('id', snapshot.key).text('Join Session').addClass('join-button btn btn-primary');
                sessionDiv.append(sessionName).append(joinButton);
                $('#open-sessions').append(sessionDiv);
            }
        } else if (snapshot.val().state === 2){
            let joinerUid = snapshot.val().joiner.uid;
            if (creatorUid === user.uid || joinerUid === user.uid){
                user.role = (creatorUid === user.uid ? 'creator' : 'joiner');
                opponent.role = (creatorUid === user.uid ? 'joiner' : 'creator');
                user.sessionuid = snapshot.key;
                app_view.setAppState(MAIN_APP_STATE.GAME);
            }
        }
    });
}



//listener on session closed, has to be on child_changed on session, to access the siblings
function listenToSessionsChanges (){
    database.ref('sessions').on("child_changed", function(snapshot){
    let creatorUid = snapshot.val().creator.uid;
    let joinerUid = snapshot.val().joiner.uid;
    if (snapshot.val().state === 2){
        if (creatorUid === user.uid){
            user.role = 'creator';
            opponent.role = 'joiner';
            user.sessionuid = snapshot.key;
            app_view.setAppState(MAIN_APP_STATE.GAME);
            user.choice = snapshot.val().creator.choice;
            opponent.choice = snapshot.val().joiner.choice;
            if (user.choice !== '' && opponent.choice !== ''){
                displayResult(getWinner());
                terminateSession();
                listenToSessionsTerminated();
            } else if (user.choice !== ''){
                app_view.setAppState(MAIN_APP_STATE.WAITING_CHOICE);
            }
        } else if (joinerUid === user.uid){
            user.role = 'joiner';
            opponent.role = 'creator';
            app_view.setAppState(MAIN_APP_STATE.GAME);
            user.sessionuid = snapshot.key;
            user.choice = snapshot.val().joiner.choice;
            opponent.choice = snapshot.val().creator.choice;
            if (user.choice !== '' && opponent.choice !== ''){
                displayResult(getWinner());
                terminateSession();
                listenToSessionsTerminated();
            } else if (user.choice !== ''){
                app_view.setAppState(MAIN_APP_STATE.WAITING_CHOICE);
            }
        } //TODO: is it possible here to say to hide the session ?
    } 
    });
}

function getWinner(){
    console.log('game has ended');
    console.log(user.choice);
    console.log(opponent.choice);
    if (user.choice === 'rock'){
        if (opponent.choice === 'rock'){
            return 'draw';
        } else if (opponent.choice === 'paper'){
            return 'opponent';
        } else if (opponent.choice === 'scisors'){
            return 'user';
        }
    } else if (user.choice === 'paper'){
        if (opponent.choice === 'rock'){
            return 'user';
        } else if (opponent.choice === 'paper'){
            return 'draw';
        } else if (opponent.choice === 'scisors'){
            return 'opponent';
        }
    } else if (user.choice === 'scisors'){
        if (opponent.choice === 'rock'){
            return 'opponent';
        } else if (opponent.choice === 'paper'){
            return 'user';
        } else if (opponent.choice === 'scisors'){
            return 'draw';
        }
    } 
}

function displayResult(winner){
    console.log(user);
    if (winner === 'user'){
        $('#result-label').text('You Win!');
    } else if (winner === 'opponent'){
        $('#result-label').text('You lost :(');
    } else if (winner === 'draw'){
        $('#result-label').text('Draw!');
    }
    app_view.setAppState(MAIN_APP_STATE.GAME_RESULTS);
}

function terminateSession(){
    console.log('I terminate');
    // only if user is creator to avoid two triggers
    if (user.role === 'creator'){
        database.ref('sessions/' + user.sessionuid).remove();
    }
}

function listenToSessionsTerminated(){
    database.ref('sessions').on('child_removed',function(snapshot){
        $('#finish-game-session').prop('disabled',false);

    });
}

// function listenToChoices(){
//     database.ref('sessions/' + user.sessionuid + '/joiner/choice').on('value',function(snapshot){
//         if (snapshot.val() !== ''){
//             if (user.role === 'joiner'){
//                 user.choice = snapshot.val();
//                 if (opponent.choice !== ''){
//                     console.log('run');
//                     displayResult(getWinner());
//                     terminateSession();
//                 } else {
//                     console.log('run');
//                     app_view.setAppState(MAIN_APP_STATE.WAITING_CHOICE);
//                 }
//             } else if (user.role === 'creator'){
//                 opponent.choice = snapshot.val()
//                 if (user.choice !== ''){
//                     console.log('run');
//                     displayResult(getWinner());
//                     terminateSession();
//                 } else {
//                     console.log('run');
//                     app_view.setAppState(MAIN_APP_STATE.WAITING_CHOICE);
//                 }
//             }
//         }
//     });
//     database.ref('sessions/' + user.sessionuid + '/creator/choice').on('value',function(snapshot){
//         if (snapshot.val() !== ''){
//             if (user.role === 'joiner'){
//                 opponent.choice = snapshot.val();
//                 if (user.choice !== ''){
//                     console.log('run');
//                     displayResult(getWinner());
//                     terminateSession();
//                 } else {
//                     console.log('run');
//                     app_view.setAppState(MAIN_APP_STATE.WAITING_CHOICE);
//                 }
//             } else if (user.role === 'creator'){
//                 user.choice = snapshot.val();
//                 if (opponent.choice !== ''){
//                     console.log('run');
//                     displayResult(getWinner());
//                     terminateSession();
//                 } else {
//                     console.log('run');
//                     app_view.setAppState(MAIN_APP_STATE.WAITING_CHOICE);
//                 }
//             }
//         }
//     });
//     listenToSessionsTerminated();
// }

$(document).ready(function(){

    //-----------------//
    // signup controls //
    //-----------------//

    $(document).on('click','#signup-open',function(event){
        app_view.setLoginState(LOGIN_STATE.SIGNUP);
    });

    $(document).on('click','#signup-close',function(event){
        app_view.setLoginState(LOGIN_STATE.LOGIN);
    });

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
              $('#signup-name').val('');
              $('#signup-email').val('');
              $('#signup-password').val('');
          });
    });

    //---------------//
    // LOGIN CONTROL //
    //---------------//

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

    //------------------//
    // SESSION CONTROLS //
    //------------------//

    // create session button
    $(document).on('click','#create-game', function(event){
        let session = {
            'creator': {
                'displayName': firebase.auth().currentUser.displayName,
                'uid': firebase.auth().currentUser.uid,
                'choice': '',
            },
            state: GAME_STATE.OPEN,
        }
        database.ref('sessions').push(session);
    });

    // join session button
    $(document).on('click','.join-button', function(event){
        let sessionUid = $(event.target).attr('id');
        let joiner = {
            'displayName': firebase.auth().currentUser.displayName,
            'uid': firebase.auth().currentUser.uid,
            'choice': '',
        };
        database.ref('sessions/' + sessionUid + '/joiner').set(joiner);
        database.ref('sessions/' + sessionUid + '/state').set(GAME_STATE.CLOSED);
    });

    //---------------//
    // GAME CONTROLS //
    //---------------//

    $(document).on('click','#confirm-choice', function(){
        // user.choice = $('#rps-choice').val();
        user.choice = $('input[name=choice]:checked').val();
        console.log(user.choice);
        database.ref('sessions/' + user.sessionuid + '/' + user.role + '/choice').set(user.choice);
        // listenToChoices();
    });

    $(document).on('click','#finish-game-session', function(){
        $("div[data-sessionid='" + user.sessionuid + "'").remove();
        app_view.setAppState(MAIN_APP_STATE.SESSIONS);
    });

});