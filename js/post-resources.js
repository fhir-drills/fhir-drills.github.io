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

function isObject(obj) {
  return obj === Object(obj);
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
	var jqxhr = $.ajax({
		url: serverUrl + '/' + resourceType,
		method: "POST",
		type: "POST",
		contentType: "application/json+fhir",
		data: encode(file.content),
		headers: {
        	Accept: "application/json+fhir; charset=utf-8",
        	Prefer: "return=representation"
    	}
	}).done(function() {
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
	for (var file of files) {
		if (!file.uploaded) {
			return file;
		}
	}
}

function uploadAll() {
	serverUrl = uploadServer;
	files = [];

	for (var resourceData of uploadResources) {
		files.push({localLocation: resourceData[1], jsId: resourceData[0]});
	}

	doUpload();
}

function doUpload() {
	for (var file of files) {
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