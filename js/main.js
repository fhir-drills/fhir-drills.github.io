var servers = {
    // all of these need to be made https, can't upload to http from an https page
    spark: "http://spark.furore.com/fhir",
    fhir2: "http://fhir2.healthintersections.com.au/open",
    fhir3: "http://fhir3.healthintersections.com.au/open",
    hapi2: "http://fhirtest.uhn.ca/baseDstu2",
    hapi3: "http://fhirtest.uhn.ca/baseDstu3",
    sqlonfhir2: "https://sqlonfhir-dstu2.azurewebsites.net/fhir",
	sqlonfhir3: "https://sqlonfhir-may.azurewebsites.net/fhir",
    theagency: "https://fhir1.ehrp.net.au/Spark/fhir",
	ontoservercloud: "https://ontoserver.csiro.au/stu3"
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
    };

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

var patientWithReferencesButton = document.getElementById('patient-with-references-button');
if (patientWithReferencesButton) {
	patientWithReferencesButton.onclick = function () {
		uploadFiles("patient-with-references", servers.sqlonfhir2, [
		["rf-patient", "resource-examples/Patient-f001.json"],
		["rf-encounter", "resource-examples/Encounter-f001.json"],
		["rf-diagnosticorder", "resource-examples/DiagnosticOrder-f001.json"],
		["rf-observation1", "resource-examples/Observation-f001.json"],
		["rf-observation2", "resource-examples/Observation-f002.json"],
		["rf-diagnosticreport", "resource-examples/DiagnosticReport-f001.json"]]);
	};
}

var simplePatientButton = document.getElementById('simple-patient-button');
if (simplePatientButton) {
	simplePatientButton.onclick = function () {
		uploadFiles("simple-patient", servers.sqlonfhir2, [
		["simple-patient-resourcePatient1", "resource-examples/SimplePatient-resources/PatientResourceExample1.json"]]);
	};
}


var conceptMapButton = document.getElementById('conceptmap-button');
if (conceptMapButton) {
	conceptMapButton.onclick = function () {
		uploadFiles("conceptmap", servers.ontoservercloud, [
			["cm-codesystem", "resource-examples/ConceptMap-resources/Codesystem.json"],
			["cm-old-valueset", "resource-examples/ConceptMap-resources/Old-ValueSet.json"],
			["cm-new-valueset", "resource-examples/ConceptMap-resources/New-ValueSet.json"],
			["cm-conceptmap", "resource-examples/ConceptMap-resources/ConceptMap.json"]]);
	};
}

var expandOperationButton = document.getElementById('expand-operation-button');
if (expandOperationButton) {
	expandOperationButton.onclick = function () {
		uploadFiles("expand-operation", servers.sqlonfhir2, [
		["vac-expand-valueset", "resource-examples/SimpleValueSet-resources/ValueSet_SimpleExample.json"]]);
	};
}

$(".fhir-resource-xml").each(function(index, element) {
    // element is a node with the desired class name
	this.element = element;
  	var codemirror = this.codemirror = CodeMirror.fromTextArea(this.element, {
		mode: "xml",
		lineNumbers: true,
		lineWrapping: true,
		readOnly: true
	  });
});

// makes the search top-right work
$('#fixed-header-drawer-exp').keyup(function (e) {
    if (e.keyCode == 13) {
        window.open("https://www.google.com.au/search?q=site%3Afhir-drills.github.io+" + $('#fixed-header-drawer-exp').serialize().replace("sample=", ''), 'FHIR search results');
    }
});