var servers = {
    // all of these need to be made https, can't upload to http from an https page
    options: [
        { name: "HAPI FHIR R4", url: "https://hapi.fhir.org/baseR4" },
        { name: "Firely Server R4", url: "https://server.fire.ly/r4" }
    ],
    hapiFhirR4: null,  // Will be set to a working server after health check
    activeServerName: null  // Track which server we're using
}

// Health check function - checks if server is responsive
async function isServerHealthy(serverUrl) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(serverUrl + '/metadata', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.log("Server health check failed for " + serverUrl + ": " + error.message);
        return false;
    }
}

// Select the first healthy server from the options
async function selectHealthyServer() {
    console.log("Checking server health...");

    for (let server of servers.options) {
        console.log("Checking " + server.name + " at " + server.url);
        if (await isServerHealthy(server.url)) {
            servers.hapiFhirR4 = server.url;
            servers.activeServerName = server.name;
            console.log("✓ Using " + server.name + " at " + server.url);
            updateServerStatusUI(server.name, true);
            return true;
        }
    }

    // If no server is healthy, default to Firely and show warning
    console.warn("No servers responded to health check. Defaulting to Firely Server.");
    servers.hapiFhirR4 = "https://server.fire.ly/r4";
    servers.activeServerName = "Firely Server R4 (no health check)";
    updateServerStatusUI(servers.activeServerName, false);
    return false;
}

// Update UI to show which server is being used
function updateServerStatusUI(serverName, isHealthy) {
    // Create or update server status indicator
    var statusDiv = document.getElementById('server-status-indicator');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'server-status-indicator';
        statusDiv.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: #4CAF50; color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);';
        document.body.appendChild(statusDiv);
    }

    var icon = isHealthy ? '✓' : '⚠';
    var bgColor = isHealthy ? '#4CAF50' : '#FF9800';
    statusDiv.style.backgroundColor = bgColor;
    statusDiv.innerHTML = icon + ' Using: ' + serverName;
}

// Initialize server selection on page load
window.serverReady = selectHealthyServer();

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

function switchCodeTabs(tabid) {
	var tabs = document.getElementsByClassName(tabid);
	for (var tab = 0, l = tabs.length; tab < l; tab++) {
		tabs[tab].click();
	}	
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

    uploadAll();
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

    // Special handling for ConceptMap $translate URL
    if (uploadedId === 'conceptmap') {
        var translateUrls = document.getElementsByClassName('conceptmap-translate-url');
        if (translateUrls.length > 0) {
            var conceptMapUrl = uploaded[uploadedId].baseUrl + '/' +
                uploaded[uploadedId].resourceMap['cm-conceptmap'].type + '/' +
                uploaded[uploadedId].resourceMap['cm-conceptmap'].serverId;

            // Fetch the ConceptMap to get the actual group.source and targetUri values
            $.ajax({
                url: conceptMapUrl,
                method: "GET",
                headers: {
                    Accept: "application/json; charset=utf-8"
                }
            }).done(function(conceptMap) {
                var codeSystemUUID = conceptMap.group && conceptMap.group[0] ? conceptMap.group[0].source : '';
                var targetValueSetUUID = conceptMap.targetUri || '';

                // Extract just the UUID part from urn:uuid: format
                codeSystemUUID = codeSystemUUID.replace('urn:uuid:', '');
                targetValueSetUUID = targetValueSetUUID.replace('urn:uuid:', '');

                var translateUrl = conceptMapUrl + '/$translate?code=in-office&system=urn:uuid:' +
                    codeSystemUUID + '&target=urn:uuid:' + targetValueSetUUID;

                for (var i = 0; i < translateUrls.length; i++) {
                    translateUrls[i].innerHTML = translateUrl;
                }
            }).fail(function() {
                console.log("Failed to fetch ConceptMap for $translate URL generation");
            });
        }
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
	patientWithReferencesButton.onclick = async function () {
		await window.serverReady;  // Wait for server selection
		uploadFiles("patient-with-references", servers.hapiFhirR4, [
		["rf-patient", "resource-examples/Patient-f001.json"],
		["rf-encounter", "resource-examples/Encounter-f001.json"],
		["rf-servicerequest", "resource-examples/ServiceRequest-f001.json"],
		["rf-observation1", "resource-examples/Observation-f001.json"],
		["rf-observation2", "resource-examples/Observation-f002.json"],
		["rf-diagnosticreport", "resource-examples/DiagnosticReport-f001.json"]]);
	};
}

var simplePatientButton = document.getElementById('simple-patient-button');
if (simplePatientButton) {
	simplePatientButton.onclick = async function () {
		await window.serverReady;  // Wait for server selection
		uploadFiles("simple-patient", servers.hapiFhirR4, [
		["simple-patient-resourcePatient1", "resource-examples/SimplePatient-resources/PatientResourceExample1.json"]]);
	};
}


var conceptMapButton = document.getElementById('conceptmap-button');
if (conceptMapButton) {
	conceptMapButton.onclick = async function () {
		await window.serverReady;  // Wait for server selection
		uploadFiles("conceptmap", servers.hapiFhirR4, [
			["cm-codesystem", "resource-examples/ConceptMap-resources/Codesystem.json"],
			["cm-old-valueset", "resource-examples/ConceptMap-resources/Old-ValueSet.json"],
			["cm-new-valueset", "resource-examples/ConceptMap-resources/New-ValueSet.json"],
			["cm-conceptmap", "resource-examples/ConceptMap-resources/ConceptMap.json"]]);
	};
}

var expandOperationButton = document.getElementById('expand-operation-button');
if (expandOperationButton) {
	expandOperationButton.onclick = async function () {
		await window.serverReady;  // Wait for server selection
		uploadFiles("expand-operation", servers.hapiFhirR4, [
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

$(".fhir-resource-json").each(function(index, element) {
    // element is a node with the desired class name
	this.element = element;
  	var codemirror = this.codemirror = CodeMirror.fromTextArea(this.element, {
		mode: {name: "javascript", json: true},
		lineNumbers: true,
		lineWrapping: true,
		readOnly: true
	  });
});

$(".csharp-code").each(function(index, element) {
    // element is a node with the desired class name
	this.element = element;
  	var codemirror = this.codemirror = CodeMirror.fromTextArea(this.element, {
		mode: "text/x-csharp",
		lineNumbers: true,
		lineWrapping: true,
		readOnly: true
	  });
});

$(".java-code").each(function(index, element) {
    // element is a node with the desired class name
	this.element = element;
  	var codemirror = this.codemirror = CodeMirror.fromTextArea(this.element, {
		mode: "text/x-java",
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
