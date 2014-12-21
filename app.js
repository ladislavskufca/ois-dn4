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

function preberiMeritveVitalnihZnakov() {
    sessionId = getSessionId();

    var ehrId = $("#meritveVitalnihZnakovEHRid").val();
    var tip = $("#preberiTipZaVitalneZnake").val();

    if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
        $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
    } else {
        $.ajax({
            url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
            type: 'GET',
            headers: {"Ehr-Session": sessionId},
            success: function (data) {
                var party = data.party;
                $("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>'" + tip + "'</b> uporabnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>. Pridobivanje lahko traja nekaj sekund.</span><br/><br/>");
                if (tip == "telesna temperatura") {
                    $.ajax({
                        url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            if (res.length > 0) {
                                var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
                                for (var i in res) {
                                    results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].temperature + " " 	+ res[i].unit + "</td>";
                                }
                                results += "</table>";
                                $("#rezultatMeritveVitalnihZnakov").append(results);
                            } else {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                            }
                        },
                        error: function() {
                            $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }
                    });
                } else if (tip == "telesna teža") {
                    $.ajax({
                        url: baseUrl + "/view/" + ehrId + "/" + "weight",
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            if (res.length > 0) {
                                var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna teža</th></tr>";
                                for (var i in res) {
                                    results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].weight + " " 	+ res[i].unit + "</td>";
                                }
                                results += "</table>";
                                $("#rezultatMeritveVitalnihZnakov").append(results);
                            } else {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                            }
                        },
                        error: function() {
                            $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }
                    });
                } else if (tip == "telesna temperatura AQL") {
                    var AQL =
                        "select " +
                        "t/data[at0002]/events[at0003]/time/value as cas, " +
                        "t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperatura_vrednost, " +
                        "t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as temperatura_enota " +
                        "from EHR e[e/ehr_id/value='" + ehrId + "'] " +
                        "contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
                        "where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude<35 " +
                        "order by t/data[at0002]/events[at0003]/time/value desc " +
                        "limit 10";
                    $.ajax({
                        url: baseUrl + "/query?" + $.param({"aql": AQL}),
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
                            if (res) {
                                var rows = res.resultSet;
                                for (var i in rows) {
                                    results += "<tr><td>" + rows[i].cas + "</td><td class='text-right'>" + rows[i].temperatura_vrednost + " " 	+ rows[i].temperatura_enota + "</td>";
                                }
                                results += "</table>";
                                $("#rezultatMeritveVitalnihZnakov").append(results);
                            } else {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                            }

                        },
                        error: function() {
                            $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }
                    });
                }
                else if (tip == "telesna višina") {
                    $.ajax({
                        url: baseUrl + "/view/" + ehrId + "/" + "height",
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            if (res.length > 0) {
                                var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna višina</th></tr>";
                                for (var i in res) {
                                    results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].height + " " 	+ res[i].unit + "</td>";
                                }
                                results += "</table>";
                                $("#rezultatMeritveVitalnihZnakov").append(results);

                            } else {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                            }

                        },
                        error: function() {
                            $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }

                    });
                }
                else if (tip == "krvni tlak") {
                    var k = 1;
                    var results;
                    var stevec = 0;
                    while(stevec < k) {
                        $.ajax({
                            url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
                            type: 'GET',
                            headers: {"Ehr-Session": sessionId},
                            async: false,
                            success: function (res) {
                                if (stevec == 0) {
                                    for (var i in res) {
                                        k++;
                                    }
                                }
                                if (res.length > 0) {
                                    if (stevec == 0) results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Sistolični krvni tlak</th><th class='text-right'>Diastolični krvni tlak</th></tr>";
                                    results += "<tr><td>" + res[stevec].time + "</td><td class='text-right'>" + res[stevec].systolic + " " + res[stevec].unit + "</td>";
                                    results += "<td class='text-right'>" + res[stevec].diastolic + " " + res[stevec].unit + "</td>";
                                } else {
                                    $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                                }

                                stevec++;
                                if (stevec == k-1) {
                                    stevec++;
                                    results = results + "</table>";
                                    $("#rezultatMeritveVitalnihZnakov").append(results);
                                }
                            },
                            error: function () {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                                console.log(JSON.parse(err.responseText).userMessage);
                            }
                        });
                    }

                }
                else if (tip == "kisik v krvi") {
                    $.ajax({
                        url: baseUrl + "/view/" + ehrId + "/" + "spO2",
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            if (res.length > 0) {
                                var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Nasičenost krvi s kisikom</th></tr>";
                                for (var i in res) {
                                    results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].spO2 + " %" + "</td>";
                                }
                                results += "</table>";
                                $("#rezultatMeritveVitalnihZnakov").append(results);

                            } else {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                            }

                        },
                        error: function() {
                            $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }

                    });
                }
                else if (tip == "izpiši vse") {
                    var k = 1;
                    var results;
                    var stevec = 0;
                    while(stevec < k) {
                        $.ajax({
                        url: baseUrl + "/view/" + ehrId + "/" + "height",
                            type: 'GET',
                            headers: {"Ehr-Session": sessionId},
                            async: false,
                            success: function (res) {
                            if (stevec == 0) {
                                for (var i in res) {
                                    k++;
                                }
                                k -= 1;
                            }
                            if (res.length > 0) {
                                if (stevec == 0) results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna višina</th><th class='text-right'>Telesna teža</th><th class='text-right'>Telesna temperatura</th><th class='text-right'>Sistolični krvni tlak</th><th class='text-right'>Diastolični krvni tlak</th><th class='text-right'>Nasičenost krvi s kisikom</th></tr>";
                                    results += "<tr><td>" + res[stevec].time + "</td><td class='text-right'>" + res[stevec].height + " " + res[stevec].unit + "</td>";
                                } else {
                                    $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                                }
                            },
                            error: function () {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                                console.log(JSON.parse(err.responseText).userMessage);
                            }
                        });

                        $.ajax({
                            url: baseUrl + "/view/" + ehrId + "/" + "weight",
                            type: 'GET',
                            headers: {"Ehr-Session": sessionId},
                            async: false,
                            success: function (res) {
                                if (res.length > 0) {
                                    results += "<td class='text-right'>" + res[stevec].weight + " " + res[stevec].unit + "</td>";
                                }
                                else {
                                    $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                                }
                            },
                            error: function () {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                                console.log(JSON.parse(err.responseText).userMessage);
                            }
                        });

                        $.ajax({
                            url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
                            type: 'GET',
                            headers: {"Ehr-Session": sessionId},
                            async: false,
                            success: function (res) {
                                if (res.length > 0) {
                                    results += "</td><td class='text-right'>" + res[stevec].temperature + " " + res[stevec].unit + "</td>";
                                } else {
                                    $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                                }
                            },
                            error: function() {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                                console.log(JSON.parse(err.responseText).userMessage);
                            }
                        });

                        $.ajax({
                            url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
                            type: 'GET',
                            headers: {"Ehr-Session": sessionId},
                            async: false,
                            success: function (res) {
                                if (res.length > 0) {
                                    results += "</td><td class='text-right'>" + res[stevec].systolic + " " + res[stevec].unit + "</td>";
                                    results += "<td class='text-right'>" + res[stevec].diastolic + " " + res[stevec].unit + "</td>";
                                } else {
                                    $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                                }
                            },
                            error: function () {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                                console.log(JSON.parse(err.responseText).userMessage);
                            }
                        });

                        $.ajax({
                            url: baseUrl + "/view/" + ehrId + "/" + "spO2",
                            type: 'GET',
                            headers: {"Ehr-Session": sessionId},
                            async: false,
                            success: function (res) {
                                if (res.length > 0) {
                                    results += "<td class='text-right'>" + res[stevec].spO2 + " %" + "</td>";
                                } else {
                                    $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                                }

                                stevec++;
                                if (stevec == k) {
                                    stevec++;
                                    results = results + "</table>";
                                    $("#rezultatMeritveVitalnihZnakov").append(results);
                                }

                            },
                            error: function() {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                                console.log(JSON.parse(err.responseText).userMessage);
                            }

                        });
                        //stevec++;
                    }
       
                }
                else if (tip == "simptomi") {
                    $.ajax({
                        url: baseUrl + "/view/" + ehrId + "/" + "problem",
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            if (res.length > 0) {
                                var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Simptomi</th></tr>";
                                for (var i in res) {
                                    results += "<tr><td>" + res[i].onset_date + "</td><td class='text-right'>" + res[i].diagnosis + "</td>";
                                }
                                results += "</table>";
                                $("#rezultatMeritveVitalnihZnakov").append(results);

                            } else {
                                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
                            }

                        },
                        error: function() {
                            $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }

                    });
                }
            },
            error: function(err) {
                $("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                console.log(JSON.parse(err.responseText).userMessage);
            }
        });
    }
}

function predlagajRastline() {

    sessionId = getSessionId();

    var ehrId = $("#preberiEHRZaRastline").val();
    var simptomiZaEHR = "";

    if (!ehrId || ehrId.trim().length == 0) {
        $("#predlagajZdravileRastlineSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
    } else {

        $.ajax({
            url: baseUrl + "/view/" + ehrId + "/" + "problem",
            type: 'GET',
            headers: {"Ehr-Session": sessionId},
            async: false,
            success: function (res) {
                if (res.length > 0) {
                    for (var i in res) {
                        if (simptomiZaEHR != "") simptomiZaEHR += ", " + res[i].diagnosis;
                        else simptomiZaEHR += res[i].diagnosis;
                    }
                    //$("#izpisiRastline").append(simptomiZaEHR);


                    readTextFile("data.txt");

                    var podatkiOSimptomih = simptomiZaEHR;
                    var vejica = podatkiOSimptomih.indexOf(",");
                    var simptom1;

                    if (vejica == -1) simptom1 = podatkiOSimptomih;
                    else {
                        simptom1 = podatkiOSimptomih.substring(0, vejica);
                    }

                    simptom1 = simptom1.toUpperCase();

                    if (simptom1 == "POŠKODBA") simptom1 = "POŠKODB";

                    var stringIsci = dataTXT.indexOf(simptom1);

                    if(stringIsci != -1) {

                        var indeks = 1;
                        var stringStRastline = 1;
                        while (stringIsci > stringStRastline) {
                            stringStRastline = dataTXT.indexOf(indeks + ".");
                            indeks++
                        }

                        var iskaniIndeks = dataTXT.indexOf(indeks - 2 + ".");
                        var iskaniIndeks2 = dataTXT.indexOf(indeks - 1 + ".");    //do tukaj pišem
                        var celTXT = dataTXT;

                        //preveri če indeks za zadnjega obstaja !!

                        var izpis;
                        if (iskaniIndeks < 10) izpis = celTXT.substring(iskaniIndeks, iskaniIndeks2);   //spremeni da odstraniš zaporedno številko
                        else izpis = celTXT.substring(iskaniIndeks, iskaniIndeks2);

                        //console.log(izpis);

                        $("#izpisiRastline").append("<h4>Glede na vse podatke, ki ste jih vnesli v aplikacijo, je za vas najbolj primerna naslednja rastlina: </h4>");
                        $("#izpisiRastline").append(izpis);
                    }
                    else {
                        $("#izpisiRastline").append("<h4>Glede na vnešene podatke žal ni bilo mogoče najti primerne zdravilne rastline za vas!</h4>");
                    }
                } else {
                    $("#predlagajZdravileRastlineSporocilo").html("<span class='obvestilo label label-warning fade-in'>Podatki o simptomih za tega uporabnika so prazni!</span>");
                }
            },
            error: function() {
                $("#predlagajZdravileRastlineSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                console.log(JSON.parse(err.responseText).userMessage);
            }

        });

    }


}

var dataTXT;

function readTextFile(file)
{   //vir: stackoverflow: http://stackoverflow.com/questions/14446447/javascript-read-local-text-file
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                //console.log(allText);
                dataTXT=allText;
                //alert(allText);
            }
        }
    }
    rawFile.send(null);
}

function dodajMeritveVitalnihZnakov() {
    sessionId = getSessionId();

    var ehrId = $("#dodajEHR").val();
    var datumInUra = $("#dodajDatumInUra").val();
    var telesnaVisina = $("#dodajTelesnaVisina").val();
    var telesnaTeza = $("#dodajTelesnaTeza").val();
    var telesnaTemperatura = $("#dodajTelesnaTemperatura").val();
    var sistolicniKrvniTlak = $("#dodajKrvniTlakSistolicni").val();
    var diastolicniKrvniTlak = $("#dodajKrvniTlakDiastolicni").val();
    var nasicenostKrviSKisikom = $("#dodajNasicenostKrviSKisikom").val();
    var merilec = $("#dodajMerilec").val();

    if (!ehrId || !datumInUra || !telesnaVisina || !telesnaTeza || !telesnaTemperatura || !sistolicniKrvniTlak || !diastolicniKrvniTlak || !nasicenostKrviSKisikom || !merilec || ehrId.trim().length == 0) {
        $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
    } else {
        $.ajaxSetup({
            headers: {"Ehr-Session": sessionId}
        });
        var podatki = {
            // Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
            "ctx/language": "en",
            "ctx/territory": "SI",
            "ctx/time": datumInUra,
            "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
            "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
            "vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
            "vital_signs/body_temperature/any_event/temperature|unit": "°C",
            "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
            "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
            "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
        };
        var parametriZahteve = {
            "ehrId": ehrId,
            templateId: 'Vital Signs',
            format: 'FLAT',
            committer: merilec
        };
        $.ajax({
            url: baseUrl + "/composition?" + $.param(parametriZahteve),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(podatki),
            success: function (res) {
                console.log(res.meta.href);
                //$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
                $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + "Uspešno vnešene nove meritve!" + "</span>");
            },
            error: function(err) {
                $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                console.log(JSON.parse(err.responseText).userMessage);
            }
        });
    }
}


function dodajSimptome() {

    var simptomi = "";
    var izbraniElementi = document.getElementsByClassName('checkbox');
    for (var i = 0; izbraniElementi[i]; i++) {
        if (izbraniElementi[i].checked) {
            if (simptomi != "") simptomi += ", " + izbraniElementi[i].value;
            else simptomi += izbraniElementi[i].value;
        }
    }

    sessionId = getSessionId();

    var ehrId = $("#dodajEHRSimptomi").val();
    var datumInUra = $("#dodajDatumInUraSimptomi").val();


    if (!ehrId || !datumInUra || ehrId.trim().length == 0) {
        $("#dodajSimptomeSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
    } else {
        $.ajaxSetup({
            headers: {"Ehr-Session": sessionId}
        });
        var podatki = {
            
            "ctx/language": "en",
            "ctx/territory": "SI",
            "ctx/time": datumInUra,
            "medical_diagnosis/problem_diagnosis:0/problem_diagnosis|code": simptomi,
            "medical_diagnosis/problem_diagnosis:0/problem_diagnosis|value": simptomi,
            "medical_diagnosis/problem_diagnosis:0/date_of_onset":datumInUra,
            "medical_diagnosis/problem_diagnosis:0/problem_context_qualifiers:0/summarisation/value":false
        };

        var parametriZahteve = {
            "ehrId": ehrId,
            templateId: 'Medical Diagnosis',
            format: 'FLAT',
            committer: 'uporabnik'
        };
        $.ajax({
            url: baseUrl + "/composition?" + $.param(parametriZahteve),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(podatki),
            success: function (res) {
                console.log(res.meta.href);
                //$("#dodajSimptomeSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
                $("#dodajSimptomeSporocilo").html("<span class='obvestilo label label-success fade-in'>" + "Uspešno dodani novi simptomi!" + "</span>");
            },
            error: function(err) {
                $("#dodajSimptomeSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                console.log(JSON.parse(err.responseText).userMessage);
            }
        });
    }
}



$(document).ready(function() {
    $('#preberiPredlogoBolnika').change(function() {
        $("#kreirajSporocilo").html("");
        var podatki = $(this).val().split(",");
        $("#kreirajIme").val(podatki[0]);
        $("#kreirajPriimek").val(podatki[1]);
        $("#kreirajDatumRojstva").val(podatki[2]);
        if (podatki[3] == "MALE") document.getElementById("option1").checked = true;
        else if (podatki[3] == "FEMALE") document.getElementById("option2").checked = true;
        else {
            document.getElementById("option1").checked = false;
            document.getElementById("option2").checked = false;
        }
    });

    $('#preberiEhrIdZaVitalneZnake').change(function() {
        $("#preberiMeritveVitalnihZnakovSporocilo").html("");
        $("#rezultatMeritveVitalnihZnakov").html("");
        $("#meritveVitalnihZnakovEHRid").val($(this).val());
    });

    $('#preberiEHRZaRastlineDropdown').change(function() {
        $("#predlagajZdravileRastlineSporocilo").html("");
        $("#izpisiRastline").html("");
        $("#preberiEHRZaRastline").val($(this).val());
    });

    $('#preberiObstojeciVitalniZnak').change(function() {
        $("#dodajMeritveVitalnihZnakovSporocilo").html("");
        var podatki = $(this).val().split("|");
        $("#dodajEHR").val(podatki[0]);
        $("#dodajDatumInUra").val(podatki[1]);
        $("#dodajTelesnaVisina").val(podatki[2]);
        $("#dodajTelesnaTeza").val(podatki[3]);
        $("#dodajTelesnaTemperatura").val(podatki[4]);
        $("#dodajKrvniTlakSistolicni").val(podatki[5]);
        $("#dodajKrvniTlakDiastolicni").val(podatki[6]);
        $("#dodajNasicenostKrviSKisikom").val(podatki[7]);
        $("#dodajMerilec").val(podatki[8]);
    });

    $('#preberiObstojeciSimptom').change(function() {
        $("#dodajSimptomeSporocilo").html("");
        var podatki = $(this).val().split("|");
        $("#dodajEHRSimptomi").val(podatki[0]);
        $("#dodajDatumInUraSimptomi").val(podatki[1]);
        for (var i in obkljukaniSimptomi) {
            if (document.getElementById(obkljukaniSimptomi[i]).checked) {
                document.getElementById(obkljukaniSimptomi[i]).checked = false;
            }
        }
        if (podatki[2] != null && podatki[3] != null) {
            document.getElementById(podatki[2]).checked = true;
            document.getElementById(podatki[3]).checked = true;
        }
    });

});

var obkljukaniSimptomi = ["vnetje",
    "bolečina",
    "prehlad",
    "glavobol",
    "vročina",
    "gripa",
    "kašelj",
    "draženje",
    "nahod",
    "zobobol",
    "poškodba",
    "prebava",
    "zaprtje",
    "srbenje",
    "stres",
    "alergija",
    "okužba",
    "migrena",
    "artritis",
    "kihanje",
    "glivice" ];