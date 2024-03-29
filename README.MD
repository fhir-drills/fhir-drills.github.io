# HTML
 
Decide on an exercise name - in this example, the exercise name is ``patient-with-references``.

## Full URL
To use the full server URL of a resource, use ``class="<exercise>-location-full" id="<html resource tag>"`` - you can use this on any HTML element. For example,

```html
<note class="patient-with-references-location-full" id="rf-patient"><i>press Upload to get a Patient</i></note>
```

## Server-assigned Resource ID only
To use the server ID only, use ``class="<exercise>-serverid" id="<html resource tag>"``.

## Base server URL
To use the base URL only, use ``class="<exercise>-baseurl" id="<html resource tag>"``.

## Embedding XML resources
To embed XML inside a page and get syntax highlighting, use these tags:

```html
<textarea class="fhir-resource-xml">
//my FHIR XML here
</textarea> 
```

## Embedding JSON resources
To embed JSON inside a page and get syntax highlighting, use these tags:

```html
<textarea class="fhir-resource-json">
// my FHIR JSON here
</textarea> 
```

# Javascript

To upload your resources, use the ``uploadFiles("<exercise>", servers.<pick a server>, [an array of arrays with the html resource tag and the file location])``. For example:

```javascript
uploadFiles("patient-with-references", servers.wildfhir3, [
    ["rf-patient", "resource-examples/Patient-f001.json"],
    ["rf-encounter", "resource-examples/Encounter-f001.json"],
    ["rf-procedurerequest", "resource-examples/ProcedureRequest-f001.json"],
    ["rf-observation1", "resource-examples/Observation-f001.json"],
    ["rf-observation2", "resource-examples/Observation-f002.json"],
    ["rf-diagnosticreport", "resource-examples/DiagnosticReport-f001.json"]]);
```

# Code examples

Use this template to add C# and Java code examples:

```html
<div class="mdl-tabs mdl-js-tabs mdl-js-ripple-effect">
	<div class="mdl-tabs__tab-bar">
		<a href="#csharp-panel" class="mdl-tabs__tab is-active csharp">C#</a>
		<a href="#java-panel" class="mdl-tabs__tab java">Java</a>
	</div>

	<div class="mdl-tabs__panel is-active" id="csharp-panel">
		<textarea class="csharp-code">
// C# code here
		</textarea>
	</div>
	<div class="mdl-tabs__panel" id="java-panel">
		<textarea class="java-code">
// Java code here
		</textarea>
	</div>
</div>
```							
