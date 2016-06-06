var servers = {
    // all of these need to be made https, can't upload to http from an https page
    spark: "https://spark.furore.com/fhir",
    fhir2: "http://fhir2.healthintersections.com.au/open",
    fhir3: "http://fhir3.healthintersections.com.au/open",
    hapi2: "http://fhirtest.uhn.ca/baseDstu2",
    hapi3: "http://fhirtest.uhn.ca/baseDstu3",
    sqlonfhir2: "https://sqlonfhir-dstu2.azurewebsites.net/fhir",
    nehta: "https://fhir1.ehrp.net.au/Spark/fhir"
};

uploaded = {
    //    object structure:
    //    id: {
    //        baseUrl: "",
    //        resourceMap: {
    //            id: "serverId"
    //        }
    //    }
};

//helper for Lua to load JSON examples
function ioRead(url, success) {
    $.ajax({
        url: url,
        success: window.read_result
    });
}

//helper for Lua to create a settings object for jQuery.ajax()
function makeAjaxPost(url, data) {
    var ob = {};
    ob["method"] = "POST";
    ob["type"] = "POST";
    ob["contentType"] = "application/json";
    ob["url"] = url;
    ob["data"] = data;
    ob["headers"] = {
        Accept: "application/json+fhir; charset=utf-8",
        Prefer: "return=representation"
    };
    return ob;
}

//uploads an array of resource files
//array must be sorted in proper order of uploading, that is if resource A 
// has a reference to resource B, resource A must come after B
function uploadFiles(id, server, data) {
    if (window.uploading) {
        console.log("Already uploading " + window.uploading);
        return;
    }

    uploaded[id] = {
        baseUrl: server,
        resourceMap: {}
    };
    window.uploadServer = server;
    window.uploadResources = data;
    window.uploading = id;

    document.getElementById(id + '-button').className += " mdl-button--disabled";

    $('#' + id + '-progress').show("slow");

    upload_all();
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

//credit: http://stackoverflow.com/a/6700
Object.size = function (obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function uploadedResource(jsid, serverId, type) {
    uploaded[window.uploading].resourceMap[jsid] = {
        serverId: serverId,
        type: type
    }

    var total = window.uploadResources.length;
    var progress = Object.size(uploaded[window.uploading].resourceMap);

    document.querySelector('#' + window.uploading + '-progress').MaterialProgress.setProgress((100 / total) * progress);
}

function completeUpload() {
    var uploadedId = window.uploading;

    document.getElementById(uploadedId + '-button').className = replaceAll(document.getElementById(uploadedId + '-button').className, " mdl-button--disabled", "");

    var fullLocations = document.getElementsByClassName(uploadedId + '-location-full');
    for (var i = 0; i < fullLocations.length; i++) {
        var element = fullLocations[i];
        element.innerHTML = uploaded[uploadedId].baseUrl + '/' +
            uploaded[uploadedId].resourceMap[element.id].type + '/' +
            uploaded[uploadedId].resourceMap[element.id].serverId;
    }

    var serverIds = document.getElementsByClassName(uploadedId + '-serverid');
    for (var i = 0; i < serverIds.length; i++) {
        var element = serverIds[i];
        element.innerHTML = uploaded[uploadedId].resourceMap[element.id].serverId;
    }

    var baseUrls = document.getElementsByClassName(uploadedId + '-baseurl');
    for (var i = 0; i < baseUrls.length; i++) {
        var element = baseUrls[i];
        element.innerHTML = uploaded[uploadedId].baseUrl;
    }

    $('#' + uploadedId + '-progress').hide("slow");

    window.uploadServer = null;
    window.uploadResources = null;
    window.uploading = null;
}

function failedUpload() {
    var uploadingId = window.uploading;

    document.getElementById(uploadingId + '-button').className = replaceAll(document.getElementById(uploadingId + '-button').className, " mdl-button--disabled", "");
    $('#' + uploadingId + '-progress').hide("slow");

    window.uploadServer = null;
    window.uploadResources = null;
    window.uploading = null;
    
    uploaded[uploadingId] = null;
}

document.getElementById('patient-with-references-button').onclick = function () {
    uploadFiles("patient-with-references", servers.spark, [
    ["rf-patient", "resource-examples/Patient-f001.json"],
    ["rf-encounter", "resource-examples/Encounter-f001.json"],
    ["rf-diagnosticorder", "resource-examples/DiagnosticOrder-f001.json"],
    ["rf-observation1", "resource-examples/Observation-f001.json"],
    ["rf-observation2", "resource-examples/Observation-f002.json"],
    ["rf-diagnosticreport", "resource-examples/DiagnosticReport-f001.json"]]);
};

document.getElementById('simple-patient-button').onclick = function () {
    uploadFiles("simple-patient", servers.spark, [
    ["simple-patient-resourcePatient1", "resource-examples/SimplePatient-resources/PatientResourceExample1.json"]]);
};
