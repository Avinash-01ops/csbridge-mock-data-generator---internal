ADT A01 Tests

Verify A01 event is generated for ENCOUNTERCLASS IMP
Verify A01 event is generated for ENCOUNTERCLASS SS
Verify non-A01 event is ignored for unsupported ENCOUNTERCLASS
Verify A01 event detection with lowercase imp value
Verify A01 event detection with lowercase ss value
Verify A01 event detection trims leading spaces
Verify A01 event detection trims trailing spaces
Verify duplicate encounter records are handled
Verify PROVCLAIMNO is read from source table
Verify empty PROVCLAIMNO prevents submission
Verify null PROVCLAIMNO prevents submission
Verify special characters in PROVCLAIMNO are handled
Verify very long PROVCLAIMNO is handled
Verify numeric-only PROVCLAIMNO is processed
Verify alphanumeric PROVCLAIMNO is processed
Verify HL7 message contains MSH segment
Verify HL7 message contains EVN segment
Verify HL7 message contains PID segment
Verify HL7 message contains PV1 segment
Verify HL7 message segment order is correct
Verify HL7 message is not created when MSH segment is missing
Verify HL7 message is not created when EVN segment is missing
Verify HL7 message is not created when PID segment is missing
Verify HL7 message is not created when PV1 segment is missing
Verify empty MSH segment prevents submission
Verify empty EVN segment prevents submission
Verify empty PID segment prevents submission
Verify empty PV1 segment prevents submission
Verify HL7 message is marked ready after validation
Verify invalid HL7 message is not marked ready
Verify optional PD1 segment is added when data exists
Verify optional PV2 segment is added when data exists
Verify optional AL1 segment is added when allergy data exists
Verify optional DG1 segment is added when diagnosis data exists
Verify optional PR1 segment is added when procedure data exists
Verify HL7 message is generated without optional segments
Verify multiple allergy records generate multiple AL1 segments
Verify multiple diagnosis records generate multiple DG1 segments
Verify multiple procedures generate multiple PR1 segments
Verify patient admission date is populated in PV1
Verify patient identifier is populated in PID
Verify patient name with special characters is handled
Verify patient Arabic name is handled
Verify patient gender value is populated correctly
Verify patient DOB is populated correctly
Verify future DOB is rejected
Verify invalid DOB format is rejected
Verify empty patient identifier prevents submission
Verify null patient identifier prevents submission
Verify empty patient name prevents submission
Verify null patient name prevents submission
Verify unsupported gender value handling
Verify transfer-related values do not trigger A01
Verify outpatient encounter does not trigger A01
Verify same-day surgery encounter triggers A01
Verify inpatient encounter triggers A01
Verify blank ENCOUNTERCLASS does not generate A01
Verify null ENCOUNTERCLASS does not generate A01
Verify unsupported ENCOUNTERCLASS values are rejected
Verify HL7 message header contains correct message type
Verify EVN segment contains correct event type
Verify PV1 contains correct patient class
Verify HL7 message uses correct field separator
Verify HL7 message handles null optional fields
Verify HL7 message handles empty optional fields
Verify invalid allergy values do not break message generation
Verify invalid diagnosis values do not break message generation
Verify invalid procedure values do not break message generation
Verify message generation for minimum mandatory data only
Verify message generation for complete patient data
Verify system handles large number of optional segments
Verify admission encounter with missing visit number
Verify admission encounter with null visit number
Verify HL7 message is not malformed with empty optional segments
Verify desktop app processes records inserted into local database
Verify desktop app ignores incomplete encounter rows
Verify desktop app retries failed validation records correctly
Verify corrected ENCOUNTERCLASS triggers A01 after update
Verify multiple A01 events are processed sequentially
Verify event timestamp is populated in EVN
Verify missing event timestamp prevents submission
Verify HL7 message contains unique control ID
Verify whitespace-only mandatory values are rejected
Verify special characters in patient address are handled
Verify long patient name is handled correctly
Verify null allergy segment does not fail message
Verify null diagnosis segment does not fail message
Verify null procedure segment does not fail message
Verify mandatory segments are not duplicated
Verify invalid HL7 structure blocks submission
Verify HL7 message generation for edge-case patient age
Verify empty encounter record is ignored
Verify system handles delayed optional data population
Verify invalid patient mobile number handling
Verify HL7 message creation with mixed valid and invalid optional data
Verify unsupported symbols in mandatory fields are handled
Verify ready-for-submission status is not assigned before validation


---

ADT A02 Tests

Verify A02 event is generated when CATEGORY is info and SUPPORTINGVALUE contains Room
Verify A02 event is generated when SUPPORTINGVALUE contains Room Number
Verify A02 event is generated for location transfer text
Verify non-info CATEGORY does not trigger A02
Verify lowercase info category handling
Verify uppercase INFO category handling
Verify CATEGORY with leading spaces is handled
Verify CATEGORY with trailing spaces is handled
Verify empty CATEGORY does not trigger A02
Verify null CATEGORY does not trigger A02
Verify random CATEGORY value does not trigger A02
Verify PROVCLAIMNO is read correctly for A02
Verify empty PROVCLAIMNO prevents A02 submission
Verify null PROVCLAIMNO prevents A02 submission
Verify special characters in PROVCLAIMNO are handled
Verify numeric PROVCLAIMNO is processed
Verify alphanumeric PROVCLAIMNO is processed
Verify long PROVCLAIMNO value handling
Verify SUPPORTINGVALUE containing Room keyword triggers A02
Verify SUPPORTINGVALUE containing Room Number keyword triggers A02
Verify SUPPORTINGVALUE containing ward location triggers A02
Verify SUPPORTINGVALUE without room/location text does not trigger A02
Verify lowercase room keyword detection
Verify mixed-case room keyword detection
Verify SUPPORTINGVALUE with leading spaces is handled
Verify SUPPORTINGVALUE with trailing spaces is handled
Verify empty SUPPORTINGVALUE does not trigger A02
Verify null SUPPORTINGVALUE does not trigger A02
Verify whitespace-only SUPPORTINGVALUE does not trigger A02
Verify special characters in SUPPORTINGVALUE are handled
Verify duplicate room transfer does not generate duplicate A02
Verify changed room transfer generates new A02 event
Verify repeated identical room value is ignored
Verify transfer to different floor generates new A02
Verify transfer to same room but different format handling
Verify HL7 message contains MSH segment for A02
Verify HL7 message contains EVN segment for A02
Verify HL7 message contains PID segment for A02
Verify HL7 message contains PV1 segment for A02
Verify HL7 message segment order is correct for A02
Verify missing MSH segment prevents A02 submission
Verify missing EVN segment prevents A02 submission
Verify missing PID segment prevents A02 submission
Verify missing PV1 segment prevents A02 submission
Verify empty MSH segment prevents submission
Verify empty EVN segment prevents submission
Verify empty PID segment prevents submission
Verify empty PV1 segment prevents submission
Verify HL7 message contains ADT A02 message type
Verify EVN contains A02 event code
Verify transfer location is mapped to PV1 field
Verify transfer location is mapped to PV2 field when applicable
Verify empty transfer location prevents submission
Verify null transfer location prevents submission
Verify special characters in transfer location are handled
Verify long transfer location value handling
Verify optional PD1 segment inclusion
Verify optional PV2 segment inclusion
Verify HL7 message is generated without optional segments
Verify null optional segment data does not fail A02
Verify empty optional segment data does not fail A02
Verify patient identifier is populated in PID
Verify empty patient identifier prevents submission
Verify null patient identifier prevents submission
Verify patient name is populated correctly
Verify empty patient name prevents submission
Verify null patient name prevents submission
Verify Arabic patient name handling
Verify special characters in patient name handling
Verify patient DOB is populated correctly
Verify future DOB is rejected
Verify invalid DOB format handling
Verify unsupported gender value handling
Verify EVN timestamp is populated for A02
Verify missing EVN timestamp prevents submission
Verify HL7 message contains unique control ID
Verify duplicate mandatory segments are not generated
Verify malformed HL7 structure blocks submission
Verify A02 message is marked ready after validation
Verify invalid A02 message is not marked ready
Verify desktop app processes transfer records from local database
Verify desktop app ignores incomplete supporting info rows
Verify corrected transfer data triggers A02 after update
Verify multiple A02 events are processed sequentially
Verify transfer event with minimum mandatory data
Verify transfer event with complete patient and visit data
Verify unsupported symbols in mandatory fields are handled
Verify empty supporting info record is ignored
Verify same PROVCLAIMNO with different room values creates separate events
Verify room transfer detection with abbreviations
Verify transfer detection with bed/ward reference
Verify room transfer text embedded in long sentence
Verify transfer detection ignores unrelated info text
Verify whitespace-only CATEGORY is rejected
Verify HL7 message remains valid with partial optional data
Verify message readiness status is not assigned before validation
Verify transfer location mapping preserves original value
Verify transfer event processing for edge-case room names
Verify transfer event processing for numeric-only room value
Verify duplicate detection across multiple processing cycles


---

ADT A03 Tests

Verify A03 event is generated when ENCOUNTERENDDATE is populated
Verify A03 event is not generated when ENCOUNTERENDDATE is null
Verify A03 event is not generated when ENCOUNTERENDDATE is empty
Verify A03 event is not generated for whitespace-only ENCOUNTERENDDATE
Verify valid discharge date triggers A03
Verify future discharge date handling
Verify invalid discharge date format handling
Verify past discharge date is processed correctly
Verify PROVCLAIMNO is read correctly for A03
Verify empty PROVCLAIMNO prevents A03 submission
Verify null PROVCLAIMNO prevents A03 submission
Verify special characters in PROVCLAIMNO are handled
Verify numeric PROVCLAIMNO is processed
Verify alphanumeric PROVCLAIMNO is processed
Verify long PROVCLAIMNO handling
Verify HL7 message contains MSH segment for A03
Verify HL7 message contains EVN segment for A03
Verify HL7 message contains PID segment for A03
Verify HL7 message contains PV1 segment for A03
Verify HL7 message contains DG1 segment for A03
Verify HL7 message segment order is correct for A03
Verify missing MSH segment prevents A03 submission
Verify missing EVN segment prevents A03 submission
Verify missing PID segment prevents A03 submission
Verify missing PV1 segment prevents A03 submission
Verify missing DG1 segment prevents A03 submission
Verify empty MSH segment prevents submission
Verify empty EVN segment prevents submission
Verify empty PID segment prevents submission
Verify empty PV1 segment prevents submission
Verify empty DG1 segment prevents submission
Verify HL7 message contains ADT A03 message type
Verify EVN contains A03 event code
Verify discharge date is mapped correctly in HL7
Verify diagnosis details are mapped correctly in DG1
Verify multiple diagnosis records generate multiple DG1 segments
Verify optional PD1 segment inclusion
Verify optional PV2 segment inclusion
Verify optional PR1 segment inclusion
Verify multiple procedures generate multiple PR1 segments
Verify HL7 message is generated without optional segments
Verify null optional segment data does not fail A03
Verify empty optional segment data does not fail A03
Verify patient identifier is populated in PID
Verify empty patient identifier prevents submission
Verify null patient identifier prevents submission
Verify patient name is populated correctly
Verify empty patient name prevents submission
Verify null patient name prevents submission
Verify Arabic patient name handling
Verify special characters in patient name handling
Verify patient DOB is populated correctly
Verify future DOB is rejected
Verify invalid DOB format handling
Verify unsupported gender value handling
Verify EVN timestamp is populated for A03
Verify missing EVN timestamp prevents submission
Verify HL7 message contains unique control ID
Verify duplicate mandatory segments are not generated
Verify malformed HL7 structure blocks submission
Verify A03 message is marked ready after validation
Verify invalid A03 message is not marked ready
Verify desktop app processes discharge records from local database
Verify desktop app ignores incomplete encounter rows
Verify corrected discharge data triggers A03 after update
Verify multiple A03 events are processed sequentially
Verify discharge event with minimum mandatory data
Verify discharge event with complete patient and clinical data
Verify unsupported symbols in mandatory fields are handled
Verify empty encounter record is ignored
Verify same PROVCLAIMNO with updated discharge date handling
Verify duplicate discharge events are not created
Verify diagnosis with special characters is handled
Verify invalid diagnosis values do not break message generation
Verify null diagnosis prevents submission
Verify empty diagnosis prevents submission
Verify long diagnosis text handling
Verify discharge event processing for edge-case patient age
Verify special characters in patient address are handled
Verify long patient name handling
Verify null procedure segment does not fail message
Verify malformed optional segments do not corrupt HL7 structure
Verify discharge date earlier than admission date handling
Verify same-day admission and discharge handling
Verify discharge event processing after admission event
Verify discharge event processing after transfer event
Verify HL7 message remains valid with partial optional data
Verify message readiness status is not assigned before validation
Verify discharge event with numeric-only diagnosis code
Verify discharge event with alphanumeric diagnosis code
Verify discharge detection with timestamp including timezone
Verify discharge event detection after delayed database update
Verify multiple DG1 segments preserve sequence
Verify discharge event with null optional demographics
Verify whitespace-only mandatory fields are rejected
Verify invalid HL7 structure prevents ready status
Verify discharge event handles mixed valid and invalid optional data
Verify desktop app retries corrected failed discharge events
Verify HL7 message creation with maximum supported optional data
Verify discharge event generation for inpatient encounter
Verify discharge event generation for same-day surgery encounter
Verify discharge event ignores encounter without discharge information
Verify discharge message generation preserves patient identifiers
Verify discharge message is not created when mandatory segments are duplicated incorrectly
Verify discharge event handles unusual discharge timestamps


---

ADT A04 Tests

Verify PROVCLAIMNO is read from NPHIES_CLAIMENCOUNTERS for A04 detection
Verify ENCOUNTERCLASS is read from NPHIES_CLAIMENCOUNTERS for A04 classification
Verify DOCUMENTID is read from NPHIES_CLAIMENCOUNTERS for patient identification
Verify system reads data from both NPHIES_CLAIMENCOUNTERS and NPHIES_BENEFICIARY tables simultaneously
Verify system behavior when PROVCLAIMNO is NULL in NPHIES_CLAIMENCOUNTERS
Verify system behavior when PROVCLAIMNO is an empty string
Verify system behavior when DOCUMENTID is NULL in NPHIES_CLAIMENCOUNTERS
Verify system behavior when DOCUMENTID is an empty string
Verify system behavior when ENCOUNTERCLASS is NULL in NPHIES_CLAIMENCOUNTERS
Verify system behavior when encounter record has all three required fields populated correctly
Verify encounter with ENCOUNTERCLASS = 'AMB' is classified as A04 candidate
Verify encounter with ENCOUNTERCLASS = 'EMER' is classified as A04 candidate
Verify encounter with ENCOUNTERCLASS = 'HH' is classified as A04 candidate
Verify encounter with ENCOUNTERCLASS = 'IMP' is NOT classified as A04
Verify encounter with ENCOUNTERCLASS = 'SS' is NOT classified as A04
Verify ENCOUNTERCLASS comparison is case-insensitive for 'imp'
Verify ENCOUNTERCLASS comparison is case-insensitive for 'ss'
Verify encounter with ENCOUNTERCLASS = 'IMP ' (trailing space) is excluded from A04
Verify encounter with ENCOUNTERCLASS = ' SS' (leading space) is excluded from A04
Verify encounter with unknown ENCOUNTERCLASS value (e.g., 'XYZ') is treated as A04 candidate
Verify that multiple encounters with mixed ENCOUNTERCLASS values are filtered correctly in one batch
Verify new patient with unique DOCUMENTID is classified as ADT A04
Verify patient with duplicate DOCUMENTID in NPHIES_BENEFICIARY is NOT classified as new A04
Verify system behavior when DOCUMENTID in encounter does not match any record in NPHIES_BENEFICIARY
Verify system classifies A04 when DOCUMENTID matches exactly one beneficiary record
Verify system behavior when NPHIES_BENEFICIARY table is empty
Verify system behavior when DOCUMENTID in beneficiary table is NULL
Verify patient registration with special characters in DOCUMENTID (e.g., hyphens)
Verify DOCUMENTID matching is case-sensitive
Verify system handles very long DOCUMENTID values (boundary test)
Verify DOCUMENTID with only numeric characters is accepted
Verify MSH segment is present in the generated A04 HL7 message
Verify MSH segment contains correct message type 'ADT^A04'
Verify EVN segment is present in the generated A04 HL7 message
Verify PID segment is present in the generated A04 HL7 message
Verify PID segment contains patient DOCUMENTID in PID.3
Verify PV1 segment is present in the generated A04 HL7 message
Verify PV1 segment contains patient class 'O' for outpatient (A04)
Verify HL7 message is rejected when MSH segment data is missing (no PROVCLAIMNO mapping)
Verify HL7 message contains all four mandatory segments in correct order
Verify EVN segment event date/time is populated and not null
Verify PD1 segment is included when additional demographics are available
Verify PD1 segment is absent when no additional demographics are available
Verify PV2 segment is included when additional patient visit info is available
Verify AL1 segment is included when patient allergy data is available
Verify multiple AL1 segments are generated when patient has multiple allergies
Verify AL1 segment is absent when patient has no allergy data
Verify DG1 segment is included when diagnosis data is available
Verify multiple DG1 segments are generated when encounter has multiple diagnoses
Verify DG1 segment is absent when no diagnosis data is available
Verify PR1 segment is included when procedure data is available
Verify PR1 segment is absent when no procedure data is available
Verify HL7 message with all optional segments present is structurally valid
Verify HL7 message with NO optional segments is structurally valid
Verify valid A04 HL7 message is marked as ready for submission to NPHIES
Verify A04 message that fails validation is NOT marked as ready for submission
Verify submission status is updated correctly after successful A04 message validation
Verify already-processed A04 records are not reprocessed on next trigger
Verify failed A04 records can be reprocessed after the underlying data is corrected
Verify A04 is detected when ENCOUNTERCLASS is a valid FHIR outpatient code 'outpatient'
Verify system handles ENCOUNTERCLASS with numeric value gracefully
Verify system handles extremely long ENCOUNTERCLASS value
Verify PID segment patient name is populated from NPHIES_BENEFICIARY
Verify PID segment date of birth is populated correctly
Verify PID segment gender is populated from beneficiary data
Verify PID segment gender for female beneficiary
Verify PV1 segment PROVCLAIMNO appears in the correct PV1 field
Verify DG1 diagnosis code is an ICD-10 code
Verify allergy severity is correctly mapped to AL1 segment
Verify system behavior when same encounter is inserted twice in mock data (duplicate record)
Verify A04 detection when patient is registered at midnight (date boundary)
Verify A04 detection when patient date of birth is today (newborn registration)
Verify system handles encounter with future date in the event timestamp
Verify A04 processing when beneficiary record has minimal data (only DOCUMENTID populated)
Verify system handles a large batch of A04 events processed simultaneously
Verify system correctly handles patient with hyphenated name (e.g., 'Mary-Jane')
Verify system correctly handles patient name with Arabic characters
Verify system handles beneficiary with very old date of birth (e.g., born 1920)
Verify system behavior when NPHIES_CLAIMENCOUNTERS has no unprocessed records
Verify A01 (Inpatient Admission) event is NOT mistakenly classified as A04
Verify A04 is NOT generated for a Short Stay (SS) encounter
Verify no HL7 message is generated when all three required source fields are NULL
Verify no A04 is generated when DOCUMENTID is present in encounter but missing from NPHIES_BENEFICIARY
Verify system does not process records already marked as 'Submitted'
Verify system does not generate A04 when encounter has been cancelled
Verify no A04 generated when ENCOUNTERCLASS is NULL
Verify HL7 message uses correct field separator (pipe character '|')
Verify HL7 message segment terminator is correct (carriage return)
Verify MSH.12 (Version ID) is set to a valid HL7 version (e.g., 2.5 or 2.6)
Verify MSH.9 message type is exactly 'ADT^A04'
Verify EVN.1 contains event type code 'A04'
Verify PID.3 patient identifier is not empty
Verify PV1.2 patient class is 'O' for outpatient A04 event
Verify optional segments appear after all mandatory segments in the HL7 message
Verify HL7 message does not contain any empty mandatory segments