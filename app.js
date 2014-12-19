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


function kreirajEHRzaBolnika() {
    sessionId = getSessionId();

    var ime = $("#kreirajIme").val();
    var priimek = $("#kreirajPriimek").val();
    var spol = $('input[name="optionsRadios"]:checked').val();
    var spolString = "MALE";
    if (spol == "option2") spolString = "FEMALE";
    var datumRojstva = $("#kreirajDatumRojstva").val();

    if (!ime || !priimek || !spol ||!datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
        $("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
    } else {
        $.ajaxSetup({
            headers: {"Ehr-Session": sessionId}
        });
        $.ajax({
            url: baseUrl + "/ehr",
            type: 'POST',
            success: function (data) {
                var ehrId = data.ehrId;
                var partyData = {
                    firstNames: ime,
                    lastNames: priimek,
                    gender: spolString,
                    dateOfBirth: datumRojstva,
                    partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
                };
                $.ajax({
                    url: baseUrl + "/demographics/party",
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(partyData),
                    success: function (party) {
                        if (party.action == 'CREATE') {
                            $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
                            console.log("Uspešno kreiran EHR '" + ehrId + "'.");
                            $("#preberiEHRid").val(ehrId);
                        }
                    },
                    error: function(err) {
                        $("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                        console.log(JSON.parse(err.responseText).userMessage);
                    }
                });
            }
        });
    }
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
                var spol = "moški";
                if (party.gender == "FEMALE") spol = "ženska";

                $("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Uporabnik '" + party.firstNames + " " + party.lastNames + "' je '" + spol + "', ki se je rodil '" + party.dateOfBirth + "'.</span>");
                console.log("Uporabnik '" + party.firstNames + " " + party.lastNames + "'je '" + spol + "', ki se je rodil '" + party.dateOfBirth + "'.");
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