function decode(data) {
	return JSON.parse(data);
}

function encode(data) {
	return JSON.stringify(data);
}

var files = [
	// {
	// 	localLocation = NULL, // location in the local filesystem
	// 	originalId = NULL, // original resource ID
	// 	uploadedId = NULL, // server-assigned ID
	// 	content = NULL, //decoded JSON content
	// 	uploaded = NULL, // 'true' for an uploaded resource
	// 	jsId = NULL, // ID that's assigned for use in main.js
	// }
];

// keeps track of the resource's original ID and uploaded one
var idMap = [
	// ["Patient/digitalhealth-f001"] = "Patient/spark2494"
];

// keeps track of old UUID → new UUID mappings for ephemeral IDs
var uuidMap = {};

// Expose uuidMap for other scripts to use
function getUuidMap() {
	return uuidMap;
}

function isObject(obj) {
  return obj === Object(obj);
}

// Generate a random UUID v4
function generateUUID() {
	// Use crypto.randomUUID if available (modern browsers)
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback to random generation for older browsers
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0;
		var v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

// Replace hardcoded UUIDs with ephemeral ones for ConceptMap resources
function generateEphemeralUUIDs(content) {
	// List of all hardcoded UUIDs that need to be replaced
	var uuidsToReplace = {
		"bb6efb79-2b93-4569-a51e-6fcf103b6e9a": null, // CodeSystem
		"a5f94e22-ddba-474e-80e3-b067d9c27a55": null, // Old-ValueSet
		"5b2b9bb0-f459-4fcd-80f7-076969d0667d": null, // New-ValueSet
		"193bb9e9-f402-4ea6-95d0-47f8bdd51f68": null  // ConceptMap
	};

	// Generate new UUIDs for any we haven't seen yet in this session
	for (var oldUUID in uuidsToReplace) {
		if (!uuidMap[oldUUID]) {
			uuidMap[oldUUID] = generateUUID();
			console.log("Generated ephemeral UUID: " + oldUUID + " → " + uuidMap[oldUUID]);
		}
	}

	var codeSystemUUID = "bb6efb79-2b93-4569-a51e-6fcf103b6e9a";

	// Replace resource's own URL field with a new UUID
	if (content.url && content.url.indexOf("urn:uuid:") !== -1) {
		// Extract the UUID from the URL
		var urlMatch = content.url.match(/urn:uuid:([a-f0-9-]+)/);
		if (urlMatch && uuidMap[urlMatch[1]]) {
			content.url = content.url.replace(urlMatch[1], uuidMap[urlMatch[1]]);
			console.log("Replaced UUID in " + content.resourceType + ".url");
		}
	}

	// Replace in compose.include[].system (ValueSets referencing CodeSystem)
	if (content.compose && content.compose.include) {
		for (var i = 0; i < content.compose.include.length; i++) {
			var include = content.compose.include[i];
			if (include.system && include.system.indexOf(codeSystemUUID) !== -1) {
				include.system = include.system.replace(codeSystemUUID, uuidMap[codeSystemUUID]);
				console.log("Replaced UUID in ValueSet.compose.include[" + i + "].system");
			}
		}
	}

	// Replace in group[].source (ConceptMap referencing CodeSystem)
	if (content.group) {
		for (var i = 0; i < content.group.length; i++) {
			var group = content.group[i];
			if (group.source && group.source.indexOf(codeSystemUUID) !== -1) {
				group.source = group.source.replace(codeSystemUUID, uuidMap[codeSystemUUID]);
				console.log("Replaced UUID in ConceptMap.group[" + i + "].source");
			}
		}
	}

	return content;
}

var serverUrl;

function findReferences(data, key, f) {
	$.each(data, function(k, v) {
		if (k === key) {
			f(data, k, v);
		}

		if (isObject(v)) {
			findReferences(v, key, f);
		}
	});
}

function getResourceType(fileContent) {
	return fileContent.resourceType;
}

// pull out the original ID of the resource and delete it from the resource as well
function getResourceId (fileContent) {
	var id = fileContent.id;
	delete fileContent.id;

	return id;
}

function upload(file) {
	var fileLocation = file.localLocation;
	var resourceType = file.type;

	// Print resource to console before uploading
	console.log("Uploading " + resourceType + " from " + fileLocation + ":");
	console.log(JSON.stringify(file.content, null, 2));

	var jqxhr = $.ajax({
		url: serverUrl + '/' + resourceType,
		method: "POST",
		type: "POST",
		contentType: "application/json",
		data: encode(file.content),
		headers: {
        	Accept: "application/json; charset=utf-8",
        	Prefer: "return=representation"
    	}
	}).done(function() {
		console.log("Response json: " + jqxhr.responseText);
		uploadDone(decode(jqxhr.responseText));
	}).fail(function(err) {
		console.log("upload failed: " + err.responseText);
		failedUpload();
	});
}

function uploadDone(result) {
	var resultType = result.resourceType;
	var file = getCurrentFile();
	var fileName = file.localLocation;

	if (resultType === "OperationOutcome") {
		console.log(fileName + ": " + result.text.div);
		return;
	}

	var id = result.id;
	file.uploadedId = id;
	file.uploaded = true;

	idMap[file.type + "/" + file.originalId] = file.type + "/" + file.uploadedId;
	console.log(fileName + ": " + serverUrl + "/" + file.type + "/" + id);

	uploadedResource(file.jsId, file.uploadedId, file.type);

	var uploadingNext = doUpload();
	if (!uploadingNext) {
		console.log("All resources uploaded");
		completeUpload();
	}
}

function loadFile(file) {
	var fileName = file.localLocation;
	var jqxhr = $.ajax(fileName);
	jqxhr.done(function() {
		file.content = decode(jqxhr.responseText);

		// Generate ephemeral UUIDs for ConceptMap resources to prevent duplicates
		if (window.uploading === 'conceptmap') {
			file.content = generateEphemeralUUIDs(file.content);
		}

		file.content = updateResourceReferences(file.content);
		file.originalId = getResourceId(file.content);
		file.type = getResourceType(file.content);

		upload(file);
	});
}

function updateResourceReferences(content) {
	// replace references in structured content of resource
	findReferences(content, "reference", function(data, key, value) {
			if (idMap[value]) {
				data[key] = idMap[value];
			}
		}
	);

	// replace references in the narrative
	if (content.text && content.text.div) {
		var narrative = content.text;

		for (var oldId in idMap) {
			var newId = idMap[oldId];
			// not escaping characters here yet - not sure why was it needed before
			narrative.div = narrative.div.replace(oldId, newId);
		}
	}

	return content;
}

function getCurrentFile() {
	for (var f in files) {
		var file = files[f];
		if (!file.uploaded) {
			return file;
		}
	}
}

function uploadAll() {
	serverUrl = uploadServer;
	files = [];
	uuidMap = {}; // Reset UUID mappings for new upload session

	for (var r in uploadResources) {
		var resourceData = uploadResources[r];
		files.push({localLocation: resourceData[1], jsId: resourceData[0]});
	}

	doUpload();
}

function doUpload() {
	for (var f in files) {
		var file = files[f];
		if (!file.uploaded) {
			// load this resource's data in
			var fileName = file.localLocation;
			console.log("Uploading " + fileName);

			file.content = loadFile(file);
			return true;
		}

	}

	return false;
}
