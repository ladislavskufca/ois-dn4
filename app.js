var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
        "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

function preberiEHRzapis() {
    sessionId = getSessionId();

    var ehrId = $("#preberiEHRid").val();

    if (!ehrId || ehrId.trim().length == 0) {
        $("#preberiSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
    } else {
        $.ajax({
            url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
            type: 'GET',
            headers: {"Ehr-Session": sessionId},
            success: function (data) {
                var party = data.party;

                $("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Uporabnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.</span>");
                console.log("Uporabnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.");
            },
            error: function(err) {
                $("#preberiSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                console.log(JSON.parse(err.responseText).userMessage);
            }
        });
    }
}


$(document).ready(function() {
    $('#preberiObstojeciEHR').change(function() {
        //vsakič ko zamenjamo osebo iz dropdown menija se zgodi naslednje
        $("#preberiSporocilo").html("");
        $("#preberiEHRid").val($(this).val());
    });
});