var refreshRate = 200; //mili seconds


var USERS_LIST_URL = buildUrlWithContextPath("userslist");
var GAMES_LIST_URL = buildUrlWithContextPath("gameslist");
var UPLOAD_URL = buildUrlWithContextPath("upload");
var GAMEINFO_URL = buildUrlWithContextPath("gamesInfo");
var IS_USER_CONNECTED_URL = buildUrlWithContextPath("isUserConnected");
var GO_TO_FIRSTPAGE_URL = buildUrlWithContextPath("goToFirstPage");
var DELETEGAME_URL = buildUrlWithContextPath("deleteGame");
var TRY_GET_INTO_GAME_URL = buildUrlWithContextPath("tryGetIntoGame");
var GAME_PAGE_URL = buildUrlWithContextPath("gamePage");
var LOGOUT_URL = buildUrlWithContextPath("logout");

//users = a list of usernames, essentially an array of javascript strings:
function refreshUsersList(users) {
    //clear all current users
    $("#userslist").empty();

    // rebuild the list of users: scan all users and add them to the list of users
    $.each(users || [], function (index, username) {
        console.log("Adding user #" + index + ": " + username);
        //create a new <option> tag with a value in it and
        //appeand it to the #userslist (div with id=userslist) element
        $('<li>' + username + '</li>').appendTo($("#userslist"));
    });
}

function refreshGamesList(games) {
    //clear all current users
    // gameSelectList.empty();

    // rebuild the list of users: scan all users and add them to the list of users
    $.each(games || [], function (index, gameName) {
        console.log("Adding game #" + index + ": " + gameName);
        //Check if there the item is not in the list (New Item)
        //If item is not found int the list, append it !
        if ($('#gameSelectList').find("option:contains('" + gameName + "')").length == 0) {
            $('<option value="' + gameName + '">' + gameName + '</option>').appendTo($("#gameSelectList"));
        }
    });

    $("#gameSelectList").find("option").each(function (index, data) {
        var val = data.value;
        if (games.includes(val) === false) {
            $(this).remove();
        }
    });
}

function ajaxUsersList() {
    $.ajax({
        url: USERS_LIST_URL,
        success: function (users) {
            refreshUsersList(users);
        }
    });
}

function ajaxGamesList() {
    $.ajax({
        url: GAMES_LIST_URL,
        success: function (games) {
            refreshGamesList(games);
        }
    });
}

//activate the timer calls after the page is loaded
$(function () {

    //prevent IE from caching ajax calls
    $.ajaxSetup({cache: false});

    //The users list is refreshed automatically every second
    setInterval(ajaxUsersList, refreshRate);

    //The games list is refreshed automatically every second
    setInterval(ajaxGamesList, refreshRate);

    //Check if the user is still connected to the server
    setInterval(isUserConnectedRoutine, refreshRate);
});

// Add onSubmit Event Handler for sending file to the server (using ajax)
$(function () {
    $("#uploadFileForm").on('submit', function (e) {
        e.preventDefault(); // prevent form for submiting for using ajax instead
        var file = $("#fileInput").prop('files')[0];
        if (file.type === 'text/xml') {
            sendFile(file);
        } else { // file type != 'text/xml'
            alert('Illegal file type, please choose an xml file');
        }
    });
});
// Delete game
$(function () {
    $("#deleteGameForm").on('submit', function (e) {
        e.preventDefault(); // prevent form for submiting for using ajax instead
        var curGameName = ($("#gameSelectList :selected").text());
        if (curGameName !== "") {
            var formDataGameName = new FormData();
            formDataGameName.append('gameName', curGameName);

            $.ajax({
                url: DELETEGAME_URL,
                type: 'POST',
                data: {'gameName': curGameName},
                cache: false,
                success: function (data) {
                    //Delete the game from the list only if deleted from the server
                    if (data === "true") {
                        $("#gameSelectList :selected").remove();
                    }
                }
            });
        }
    });
});

//Set log out button
$(function () {
    $("#logoutForm").attr("action", LOGOUT_URL);;
});

function sendFile(file) {
    var data = new FormData();
    var gameName = $("#gameName").val();
    data.append('xmlFile', file);
    data.append('gameName', gameName);
    $.ajax({
        url: UPLOAD_URL,
        type: 'POST',
        data: data,
        cache: false,
        enctype: "multipart/form-data",
        processData: false, // Don't process the files
        contentType: false, // Set content type to false as jQuery will tell the server its a query string request
        success: function (data, textStatus, jqXHR) {
            swal("File Uploaded Successfully!");
        },
        error: function (jqXHR) {
            alert("Unscussfull file upload: " + jqXHR.responseText);
        }
    });

}

//Set getGameInfo Interval
$(function () {
    //The users list is refreshed automatically every second
    setInterval(ajaxGameInfo, refreshRate);
});

//function getGameInfo on select
$(function () {
    $("#gameSelectList").on('change', function (e) {
        e.preventDefault(); // prevent form for submiting for using ajax instead
        ajaxGameInfo();
    });
});

function ajaxGameInfo() {
    var curGameName = ($("#gameSelectList :selected").text());

    if (curGameName !== "") {
        var formDataGameName = new FormData();
        formDataGameName.append('gameName', curGameName);
        $.ajax({
            url: GAMEINFO_URL,
            type: 'POST',
            data: {'gameName': curGameName},
            cache: false,
            success: function (data) {
                fillInfo(data);
                //alert("succsses");
            }
        });
    }
}

function fillInfo(data) {
    $("#gameInfo p").remove();
    $("#gameInfo").append(data);
}

function isUserConnectedRoutine() {
    $.ajax({
        url: IS_USER_CONNECTED_URL,
        type: 'GET',
        success: function (isConnected) {
            if (isConnected === "false") {
                $.get(GO_TO_FIRSTPAGE_URL, function (data) {
                    window.location.replace(data);
                });
            }
        }
    });
}

// Go to specific game
$(function () {
    // this is the id of the form
    $("#chooseGameForm").submit(function (e) {
        e.preventDefault(); // avoid to execute the actual submit of the form.
        var form = $(this);
        var curGameName = ($("#gameSelectList :selected").text());
        var formDataGameName = new FormData();
        formDataGameName.append('gameName', curGameName);

        $.ajax({
            type: form.attr('method'),
            url: TRY_GET_INTO_GAME_URL,
            data: {'gameName': curGameName},
            datatype: 'json',
            success: function (data) {
                if (data.isGameFull === true) {
                    swal("Game is full, please choose another game")
                } else {
                    // Submit and redirect to the game page
                    var hiddenGameForm = $("#hiddenGameForm");
                    hiddenGameForm.attr("action", GAME_PAGE_URL);
                    $("#hiddenGameNameInput").val(curGameName);
                    hiddenGameForm.submit();
                }
            }
        });
    });
});