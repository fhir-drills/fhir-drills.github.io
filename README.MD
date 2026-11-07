# FHIR Drills

Interactive tutorials for learning FHIR.

## Server Selection

The site automatically selects a working FHIR server on page load by performing health checks against multiple public servers (HAPI FHIR R4, Firely Server R4). This ensures the tutorials continue to work even if one server is unavailable. The server selection is transparent to users and happens in the background.

## FHIR versions (R4 / R5)

The tutorials are written against FHIR R4 (4.0.1), which is the default. Learners can switch to FHIR R5 (5.0.0) with the **FHIR version** selector that `js/version-switcher.js` adds to the page header. The choice is remembered in `localStorage` and can also be given in the URL as `?fhir=r5` (or `?fhir=r4`). Changing it reloads the page.

With R5 selected:

- the test servers are HAPI FHIR R5 (`https://hapi.fhir.org/baseR5`) and Firely Server R5 (`https://server.fire.ly/r5`), with the same health check and fallback as for R4;
- links to the R4 specification (`hl7.org/fhir/R4/...`) point at the R5 specification instead, and "R4" in their text becomes "R5";
- example files that aren't valid R5 are replaced by their R5 copies under `resource-examples/R5/`, both for uploads and for links to them. Files without an R5 copy are valid in both versions and are used as-is. When adding an R5 copy, list it in `R5_EXAMPLES` in `js/version-switcher.js`;
- an embedded example can show its R5 copy with `<textarea class="fhir-resource-json" data-fhir-r5-src="resource-examples/R5/...">`;
- content that only applies to one version can be marked with `class="fhir-r4-only"` or `class="fhir-r5-only"`.

Every page needs these two lines in its `<head>` (the script must run before `js/main.js`):

```html
<link rel="stylesheet" href="css/version-switcher.css">
<script src="js/version-switcher.js"></script>
```

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
uploadFiles("patient-with-references", servers.hapiFhirR4, [
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
