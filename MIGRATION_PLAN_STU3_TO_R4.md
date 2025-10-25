# FHIR STU3 to R4 Migration Plan

**Project:** FHIR Drills - Interactive FHIR Learning Platform
**Current Version:** FHIR STU3 (v3.0.1, April 2017)
**Target Version:** FHIR R4 (v4.0.1)
**Date:** 2025-10-25
**Branch:** claude/investigate-011CUULkAuHGbdFyQPeTYYYe

---

## Executive Summary

The FHIR Drills site is currently entirely STU3-based. This plan outlines a comprehensive migration to R4, including resource updates, documentation changes, and code modifications. The migration affects 15 JSON resource files, 12 HTML tutorial pages, and JavaScript configuration.

---

## Current State Analysis

### STU3 Content Inventory

**Resource Files (15 JSON files):**
```
resource-examples/
├── Patient-f001.json
├── Encounter-f001.json
├── DiagnosticRequest-f001.json          ⚠️ DEPRECATED - Replace with ServiceRequest
├── ProcedureRequest-f001.json           ⚠️ DEPRECATED - Replace with ServiceRequest
├── Observation-f001.json
├── Observation-f002.json
├── DiagnosticReport-f001.json
├── SimplePatient-resources/
│   └── PatientResourceExample1.json
├── SimpleSearch-resources/
│   ├── AngusPatientWithIHI.json
│   └── ScottRobinsonPatientWithFakeIHI.json
├── SimpleValueSet-resources/
│   └── ValueSet_SimpleExample.json
└── ConceptMap-resources/
    ├── Codesystem.json
    ├── ConceptMap.json
    ├── New-ValueSet.json
    └── Old-ValueSet.json
```

**XML Resource Files (5 files):**
```
resource-examples/SimpleValueSet-resources/
├── BodySite.valueset.xml
├── clinicalstatus.valueset.xml
├── Organization.valueset.xml
├── Patient.valueset.xml
└── Practitioner.valueset.xml
```

**Documentation Files (12 HTML files with STU3 references):**
- index.html - Explicit STU3 version notice (Line 161)
- simple-patient.html
- simple-search.html
- patient-with-references.html
- bundle.html
- operations.html
- ValueSet-And-CodeSystem.html
- conceptmap.html
- fhir-api.html - References STU3 HAPI libraries (Line 149)
- exercises.html - Multiple STU3 spec links
- terminology-exercise.html
- sam-fhir-journey.html

**JavaScript Configuration:**
- `js/main.js` - Server config with `wildfhir3` (STU3) hardcoded in upload functions (Lines 146, 159, 168, 179)
- R4 server (`ontoserverr4`) configured but never used (Line 3)

---

## Migration Phases

### Phase 1: Resource Migration (HIGH PRIORITY)

#### 1.1 Create R4 Resource Examples

**Critical Changes - Deprecated Resource Types:**

| STU3 Resource | R4 Replacement | Action Required |
|---------------|----------------|-----------------|
| DiagnosticRequest | ServiceRequest | Create new ServiceRequest-f001.json |
| ProcedureRequest | ServiceRequest | Create new ServiceRequest-f002.json |

**Resource Structure Changes to Address:**

1. **ServiceRequest (replacing DiagnosticRequest/ProcedureRequest):**
   - `requester` field structure changed
   - STU3: `requester.agent.reference`
   - R4: `requester.reference` (simplified)

2. **Patient:**
   - `name.family` changed from array to string
   - STU3: `"family": ["Careful"]`
   - R4: `"family": "Careful"`

3. **Observation:**
   - `context` renamed to `encounter`
   - Status codes may have changed

4. **DiagnosticReport:**
   - `context` renamed to `encounter`
   - `result` references may need validation

5. **Encounter:**
   - `period` structure validation
   - Status codes review

6. **ValueSet/CodeSystem:**
   - Verify expansion parameters
   - Check compose structure

**Action Items:**
- [ ] Convert DiagnosticRequest-f001.json → ServiceRequest-f001.json
- [ ] Convert ProcedureRequest-f001.json → ServiceRequest-f002.json
- [ ] Update Patient-f001.json (family name array → string)
- [ ] Update all contained Practitioner resources (family name fix)
- [ ] Update Observation-f001.json and f002.json (context → encounter)
- [ ] Update DiagnosticReport-f001.json (context → encounter)
- [ ] Update Encounter-f001.json (validate against R4)
- [ ] Update all SimplePatient resources
- [ ] Update all SimpleSearch resources
- [ ] Update all ValueSet and ConceptMap resources
- [ ] Convert XML resources to R4 (5 ValueSet files)
- [ ] Validate all resources against R4 FHIR validator

**Tools Needed:**
- FHIR R4 Validator (https://github.com/hapifhir/org.hl7.fhir.core)
- Official R4 specification: http://hl7.org/fhir/R4/

---

### Phase 2: Code Migration (HIGH PRIORITY)

#### 2.1 Update JavaScript Configuration

**File: `js/main.js`**

**Current State:**
```javascript
var servers = {
    ontoserverr4: "https://r4.ontoserver.csiro.au/fhir",           // R4 - UNUSED
    wildfhir3: "https://wildfhir3.aegis.net/fhir3-0-2",            // STU3 - ACTIVE
    hapiHL7AU: "https://hapi-hl7-au-training-server.australiaeast.cloudapp.azure.com/fhir"
}

// All upload functions use wildfhir3:
uploadFiles("patient-with-references", servers.wildfhir3, [...])
uploadFiles("simple-patient", servers.wildfhir3, [...])
uploadFiles("conceptmap", servers.wildfhir3, [...])
uploadFiles("expand-operation", servers.wildfhir3, [...])
```

**Migration Options:**

**Option A: Hard Cutover (RECOMMENDED)**
- Replace all `servers.wildfhir3` → `servers.ontoserverr4`
- Remove STU3 server configuration
- Simple, clean migration
- Users get R4 immediately

**Option B: Version Switching UI**
- Add version toggle (similar to language switcher)
- Maintain both STU3 and R4 resources
- Allow users to learn both versions
- More complex, higher maintenance

**Action Items for Option A:**
- [ ] Update all `uploadFiles()` calls to use `servers.ontoserverr4`
- [ ] Update resource file references to R4 versions
- [ ] Test all upload functions
- [ ] Remove deprecated server references

**Action Items for Option B (if chosen):**
- [ ] Create version-switcher.js (modeled on language-switcher.js)
- [ ] Add version toggle UI to all pages
- [ ] Duplicate resources into `/resource-examples/stu3/` and `/resource-examples/r4/`
- [ ] Add conditional logic to upload functions
- [ ] Update CSS for version toggle styling

#### 2.2 Update Resource Upload Arrays

**Current References to Update:**

Line 146-153 in `js/main.js`:
```javascript
uploadFiles("patient-with-references", servers.ontoserverr4, [
    ["rf-patient", "resource-examples/Patient-f001.json"],
    ["rf-encounter", "resource-examples/Encounter-f001.json"],
    ["rf-procedurerequest", "resource-examples/ServiceRequest-f001.json"],  // CHANGED
    ["rf-observation1", "resource-examples/Observation-f001.json"],
    ["rf-observation2", "resource-examples/Observation-f002.json"],
    ["rf-diagnosticreport", "resource-examples/DiagnosticReport-f001.json"]
]);
```

---

### Phase 3: Documentation Migration (MEDIUM PRIORITY)

#### 3.1 Update Version Notices

**File: `index.html`**

**Current (Line 161):**
```html
<p class="lang-content lang-en">
    Please note these tutorials have been written against a version of FHIR,
    based on the FHIR STU3 published in April 2017 V3.0.1
</p>
```

**Update to:**
```html
<p class="lang-content lang-en">
    Please note these tutorials have been updated to FHIR R4 (version 4.0.1).
    For legacy STU3 content, please see [archive link].
</p>
```

**Action Items:**
- [ ] Update version notice in index.html (both EN and RU)
- [ ] Add migration note explaining changes from STU3
- [ ] Consider adding STU3 archive branch

#### 3.2 Update Specification Links

**Files Affected:** exercises.html, fhir-api.html, patient-with-references.html, others

**Current Links:**
```
http://hl7.org/fhir/STU3/patient.html
http://hl7.org/fhir/STU3/observation.html
```

**Update to:**
```
http://hl7.org/fhir/R4/patient.html
http://hl7.org/fhir/R4/observation.html
```

**Search and Replace Operations:**
- [ ] `http://hl7.org/fhir/STU3/` → `http://hl7.org/fhir/R4/`
- [ ] `/fhir/stu3/` → `/fhir/R4/` (case insensitive)
- [ ] References to DiagnosticRequest → ServiceRequest
- [ ] References to ProcedureRequest → ServiceRequest

#### 3.3 Update Library References

**File: `fhir-api.html` (Line 149)**

**Current:**
```
hapi-fhir-structures-dstu3-2.3.jar
hapi-fhir-validation-resources-dstu3-2.3.jar
```

**Update to:**
```
hapi-fhir-structures-r4-6.x.x.jar
hapi-fhir-validation-resources-r4-6.x.x.jar
```

**Action Items:**
- [ ] Research latest stable HAPI FHIR R4 version
- [ ] Update all library references
- [ ] Update download links
- [ ] Update code examples to use R4 API

#### 3.4 Update Code Examples

**Affected Files:** All tutorial HTML files with embedded code

**Changes Needed:**
- C# code examples: Update to R4 FHIR .NET API
- Java code examples: Update to HAPI FHIR R4
- Resource structure examples in tutorials

**Example Update:**

STU3 Code:
```java
ProcedureRequest request = new ProcedureRequest();
request.getRequester().getAgent().setReference("Practitioner/123");
```

R4 Code:
```java
ServiceRequest request = new ServiceRequest();
request.getRequester().setReference("Practitioner/123");
```

---

### Phase 4: Testing and Validation (HIGH PRIORITY)

#### 4.1 Resource Validation

**Tools:**
- Official FHIR Validator: https://github.com/hapifhir/org.hl7.fhir.core
- Online validator: https://validator.fhir.org/

**Test Plan:**
- [ ] Validate all R4 JSON resources against R4 schema
- [ ] Validate all R4 XML resources against R4 schema
- [ ] Test resource references (Patient → Encounter → ServiceRequest)
- [ ] Verify contained resources are valid
- [ ] Check identifier systems are still valid
- [ ] Verify CodeSystem/ValueSet URLs

#### 4.2 Upload Functionality Testing

**Test Cases:**
1. [ ] Upload simple patient resource
2. [ ] Upload patient with references
3. [ ] Upload and search functionality
4. [ ] Bundle operations
5. [ ] ConceptMap translation
6. [ ] ValueSet expansion
7. [ ] Test all 4 uploadFiles() function calls

**Server Testing:**
- [ ] Verify ontoserverr4 server is accessible
- [ ] Test POST operations to R4 server
- [ ] Test GET/search operations
- [ ] Verify reference resolution works
- [ ] Test contained resources handling

#### 4.3 Cross-Browser Testing

**Browsers to Test:**
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

**Features to Test:**
- [ ] Resource upload
- [ ] Syntax highlighting (JSON/XML)
- [ ] Code examples tabs
- [ ] Language switching (ensure still works)
- [ ] Responsive design

#### 4.4 Documentation Review

**Content Review:**
- [ ] All tutorial steps match R4 behavior
- [ ] Screenshots are still accurate (if any)
- [ ] Code examples execute correctly
- [ ] Links to FHIR spec are correct
- [ ] Russian translations are updated

---

### Phase 5: Deployment (MEDIUM PRIORITY)

#### 5.1 Pre-Deployment

**Actions:**
- [ ] Create STU3 archive branch: `archive/stu3-original`
- [ ] Tag current commit: `v1.0-stu3`
- [ ] Update README.md with migration notes
- [ ] Create CHANGELOG.md documenting R4 migration

#### 5.2 Deployment Strategy

**Recommended Approach:**
1. Complete all resource migrations
2. Complete all code updates
3. Test thoroughly on development branch
4. Merge to main branch
5. Deploy to GitHub Pages

**Rollback Plan:**
- STU3 archive branch available
- Can revert main branch if issues found
- Document rollback procedure

#### 5.3 Post-Deployment

**Actions:**
- [ ] Monitor for broken links
- [ ] Test all tutorials end-to-end
- [ ] Gather user feedback
- [ ] Update any external documentation
- [ ] Notify users of R4 migration (if applicable)

---

## Breaking Changes Summary

### Resource Type Changes
| STU3 | R4 | Impact |
|------|-----|--------|
| DiagnosticRequest | ServiceRequest | High - Resource deprecated |
| ProcedureRequest | ServiceRequest | High - Resource deprecated |

### Field Structure Changes
| Resource | Field | STU3 | R4 | Impact |
|----------|-------|------|-----|--------|
| Patient | name.family | Array | String | Medium |
| Practitioner | name.family | Array | String | Medium |
| Observation | context | Element | Renamed to encounter | Medium |
| DiagnosticReport | context | Element | Renamed to encounter | Medium |
| ServiceRequest | requester | Complex object | Simple reference | High |

### Specification URL Changes
| STU3 | R4 |
|------|-----|
| http://hl7.org/fhir/STU3/ | http://hl7.org/fhir/R4/ |

---

## Risk Assessment

### High Risk Items
1. **ServiceRequest Migration** - Two different resource types merge into one
   - Mitigation: Careful testing, maintain example variety

2. **Server Compatibility** - ontoserverr4 may have different behavior
   - Mitigation: Thorough upload/search testing

3. **Reference Breaking** - Resource references may break
   - Mitigation: Validate all reference chains

### Medium Risk Items
1. **Documentation Accuracy** - Tutorial steps may not match R4 exactly
   - Mitigation: Manual review of each tutorial

2. **External Links** - STU3 spec links may change
   - Mitigation: Use official HL7 R4 links

3. **Library Versions** - HAPI FHIR API changes
   - Mitigation: Update to latest stable R4 libraries

### Low Risk Items
1. **UI/UX** - Minimal changes to user interface
2. **Language Switching** - Should be unaffected
3. **CSS/Styling** - No changes needed

---

## Resource Requirements

### Development Time Estimate
- Phase 1 (Resources): 8-12 hours
- Phase 2 (Code): 4-6 hours
- Phase 3 (Documentation): 6-8 hours
- Phase 4 (Testing): 6-8 hours
- Phase 5 (Deployment): 2-3 hours

**Total: 26-37 hours**

### Tools Required
- FHIR R4 Validator CLI
- Text editor with find/replace across files
- Local web server for testing
- Git for version control

### External Dependencies
- FHIR R4 specification (http://hl7.org/fhir/R4/)
- OntoServer R4 instance (https://r4.ontoserver.csiro.au/fhir)
- HAPI FHIR R4 documentation

---

## Success Criteria

### Must Have
- [ ] All resources validate against R4 schema
- [ ] All upload functions work with R4 server
- [ ] All tutorial pages reference R4 specification
- [ ] No broken links to FHIR spec
- [ ] All code examples use R4 API

### Should Have
- [ ] Russian translations updated
- [ ] CHANGELOG.md documenting changes
- [ ] STU3 archive branch created
- [ ] README.md updated with R4 notice

### Nice to Have
- [ ] Version toggle UI for STU3/R4 comparison
- [ ] Migration guide for users
- [ ] Video walkthrough of R4 changes

---

## Decision Points

### Decision 1: Migration Strategy
**Options:**
- **A) Hard Cutover to R4** (RECOMMENDED)
  - Pros: Clean, simple, focuses on current standard
  - Cons: Loses STU3 learning content

- **B) Dual Version Support**
  - Pros: Educational value, backwards compatibility
  - Cons: Double maintenance, complexity

**Recommendation:** Option A - Hard cutover with STU3 archive branch

### Decision 2: Resource File Organization
**Options:**
- **A) Keep current structure, update in place**
  - Pros: Simple, minimal path changes
  - Cons: Loses STU3 originals

- **B) Create R4 subdirectory**
  - Pros: Can keep both versions
  - Cons: Path changes, more complex

**Recommendation:** Option A with Git history as backup

### Decision 3: ServiceRequest Handling
**Options:**
- **A) Create two separate ServiceRequest examples**
  - Pros: Shows breadth of ServiceRequest use
  - Cons: May confuse with duplicate-looking resources

- **B) Create one ServiceRequest, remove one example**
  - Pros: Simpler
  - Cons: Less comprehensive

**Recommendation:** Option A - Maintain diversity of examples

---

## Next Steps

### Immediate Actions (Week 1)
1. Create STU3 archive branch
2. Begin resource file conversion
3. Set up R4 validation pipeline

### Short Term (Weeks 2-3)
4. Complete all resource migrations
5. Update JavaScript configuration
6. Begin documentation updates

### Medium Term (Week 4)
7. Complete testing phase
8. Review all tutorials
9. Update Russian translations

### Long Term (Week 5+)
10. Deploy to production
11. Monitor and fix issues
12. Gather feedback

---

## Questions and Clarifications Needed

1. **Server Access:** Confirm ontoserverr4 endpoint is accessible and accepts uploads
2. **Authentication:** Are there any auth requirements for R4 server?
3. **Russian Translation:** Who handles Russian translation updates?
4. **User Base:** Will users be notified of the migration?
5. **Deprecation Timeline:** Is there a deadline for STU3 sunset?

---

## References

### Official Documentation
- FHIR R4 Specification: http://hl7.org/fhir/R4/
- FHIR R4 Resource Index: http://hl7.org/fhir/R4/resourcelist.html
- STU3 to R4 Conversion: http://hl7.org/fhir/R4/diff.html

### Migration Guides
- HL7 Official Migration Guide: http://hl7.org/fhir/R4/r3maps.html
- HAPI FHIR R4 Migration: https://hapifhir.io/hapi-fhir/docs/

### Tools
- FHIR Validator: https://github.com/hapifhir/org.hl7.fhir.core
- Online Validator: https://validator.fhir.org/
- HAPI FHIR R4: https://hapifhir.io/

---

## Appendix A: Resource-Specific Migration Notes

### ServiceRequest (from DiagnosticRequest)

**DiagnosticRequest-f001.json → ServiceRequest-f001.json**

Key Changes:
```json
// STU3 DiagnosticRequest
{
  "resourceType": "DiagnosticRequest",
  "requester": {
    "reference": "#practitionerid",
    "display": "Dr. Adam Careful"
  }
}

// R4 ServiceRequest
{
  "resourceType": "ServiceRequest",
  "requester": {
    "reference": "#practitionerid",
    "display": "Dr. Adam Careful"
  },
  "status": "active",
  "intent": "order"
}
```

### ServiceRequest (from ProcedureRequest)

**ProcedureRequest-f001.json → ServiceRequest-f002.json**

Key Changes:
```json
// STU3 ProcedureRequest
{
  "resourceType": "ProcedureRequest",
  "requester": {
    "agent": {
      "reference": "#practitionerid",
      "display": "Dr. Adam Careful"
    }
  }
}

// R4 ServiceRequest
{
  "resourceType": "ServiceRequest",
  "requester": {
    "reference": "#practitionerid",
    "display": "Dr. Adam Careful"
  }
}
```

### Patient

**Patient-f001.json Updates**

Key Changes:
```json
// STU3
{
  "name": [{
    "family": ["van den Heuvel"],
    "given": ["Pieter"]
  }]
}

// R4
{
  "name": [{
    "family": "van den Heuvel",
    "given": ["Pieter"]
  }]
}
```

---

## Appendix B: File Checklist

### JSON Resources (15 files)
- [ ] ConceptMap-resources/Codesystem.json
- [ ] ConceptMap-resources/ConceptMap.json
- [ ] ConceptMap-resources/New-ValueSet.json
- [ ] ConceptMap-resources/Old-ValueSet.json
- [ ] DiagnosticReport-f001.json
- [ ] DiagnosticRequest-f001.json → DELETE, replace with ServiceRequest-f001.json
- [ ] Encounter-f001.json
- [ ] Observation-f001.json
- [ ] Observation-f002.json
- [ ] Patient-f001.json
- [ ] ProcedureRequest-f001.json → DELETE, replace with ServiceRequest-f002.json
- [ ] SimplePatient-resources/PatientResourceExample1.json
- [ ] SimpleSearch-resources/AngusPatientWithIHI.json
- [ ] SimpleSearch-resources/ScottRobinsonPatientWithFakeIHI.json
- [ ] SimpleValueSet-resources/ValueSet_SimpleExample.json

### XML Resources (5 files)
- [ ] SimpleValueSet-resources/BodySite.valueset.xml
- [ ] SimpleValueSet-resources/clinicalstatus.valueset.xml
- [ ] SimpleValueSet-resources/Organization.valueset.xml
- [ ] SimpleValueSet-resources/Patient.valueset.xml
- [ ] SimpleValueSet-resources/Practitioner.valueset.xml

### HTML Documentation (12 files)
- [ ] index.html
- [ ] simple-patient.html
- [ ] simple-search.html
- [ ] patient-with-references.html
- [ ] bundle.html
- [ ] operations.html
- [ ] ValueSet-And-CodeSystem.html
- [ ] conceptmap.html
- [ ] fhir-api.html
- [ ] exercises.html
- [ ] terminology-exercise.html
- [ ] sam-fhir-journey.html

### JavaScript Files (1 file)
- [ ] js/main.js

---

**End of Migration Plan**
