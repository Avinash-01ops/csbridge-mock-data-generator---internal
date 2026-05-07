# Usage Example

## Step-by-Step Example

### 1. Start the Application

```bash
npm run dev
```

The application window will open with the NPHIES Mock Data Generator interface.

### 2. Configure Database Connection

Fill in your PostgreSQL connection details:

```
Host: localhost
Port: 5432
Database: nphies_test
User: postgres
Password: your_password
```

Click **"Test Connection"** - you should see "✓ Connected"

### 3. Select Generation Options

**Number of Events**: 10

**Event Types**: Select these options:
- ☑ claim-submission
- ☑ preauthorization
- ☑ eligibility-check

### 4. Generate Data

Click **"🚀 Generate Data"**

Wait for the success message:
```
✅ Successfully created 10 events with associated data
```

### 5. Verify the Data

Open your PostgreSQL client and run:

```sql
-- Check total records generated
SELECT 
    'Events' as table_name, COUNT(*) as count 
FROM midtable_nphies.nphies_events
UNION ALL
SELECT 'Beneficiaries', COUNT(*) 
FROM midtable_nphies.nphies_beneficiary
UNION ALL
SELECT 'Claims', COUNT(*) 
FROM midtable_nphies.nphies_claiminfo
UNION ALL
SELECT 'Claim Items', COUNT(*) 
FROM midtable_nphies.nphies_claimitem
UNION ALL
SELECT 'Diagnoses', COUNT(*) 
FROM midtable_nphies.nphies_claimdiagnosis
UNION ALL
SELECT 'Care Team', COUNT(*) 
FROM midtable_nphies.nphies_claimcareteam;
```

Expected results:
- Events: 10
- Beneficiaries: 10
- Claims: 10
- Claim Items: 10-50 (1-5 per claim)
- Diagnoses: 10-30 (1-3 per claim)
- Care Team: 10-30 (1-3 per claim)

### 6. Inspect Specific Event

```sql
-- Get details of a specific event
SELECT 
    e.eventid,
    e.eventtype,
    e.createddate,
    c.provclaimno,
    c.claimtype,
    c.total,
    b.fullname as patient_name,
    b.documentid,
    cov.memberid,
    COUNT(DISTINCT ci.sequenceno) as item_count
FROM midtable_nphies.nphies_events e
JOIN midtable_nphies.nphies_claiminfo c ON e.provclaimno = c.provclaimno
JOIN midtable_nphies.nphies_beneficiary b ON c.beneficiaryid = b.beneficiaryid
JOIN midtable_nphies.nphies_coverage cov ON c.coverageid = cov.coverageid
LEFT JOIN midtable_nphies.nphies_claimitem ci ON c.provclaimno = ci.provclaimno
WHERE e.eventtype = 'claim-submission'
GROUP BY e.eventid, e.eventtype, e.createddate, c.provclaimno, c.claimtype, c.total, b.fullname, b.documentid, cov.memberid
LIMIT 1;
```

### 7. Verify Constant Values

```sql
-- Verify all beneficiaries have the required document ID
SELECT COUNT(*) as beneficiaries_with_correct_documentid
FROM midtable_nphies.nphies_beneficiary
WHERE documentid = '30511223344557';

-- Verify all claims have the required provider NPHIES ID
SELECT COUNT(*) as claims_with_correct_provider
FROM midtable_nphies.nphies_claiminfo
WHERE providernphiesid = '15000000112233';

-- Verify all care team members have the required physician ID
SELECT COUNT(*) as careteam_with_correct_physician
FROM midtable_nphies.nphies_claimcareteam
WHERE physicianid = '00TEST1980';
```

All counts should match your generated records!

### 8. Check Related Data

```sql
-- For a specific claim, show all related records
WITH claim AS (
    SELECT provclaimno 
    FROM midtable_nphies.nphies_claiminfo 
    LIMIT 1
)
SELECT 
    'Claim Items' as relation, COUNT(*) as count
FROM midtable_nphies.nphies_claimitem ci, claim
WHERE ci.provclaimno = claim.provclaimno
UNION ALL
SELECT 'Diagnoses', COUNT(*)
FROM midtable_nphies.nphies_claimdiagnosis cd, claim
WHERE cd.provclaimno = claim.provclaimno
UNION ALL
SELECT 'Care Team', COUNT(*)
FROM midtable_nphies.nphies_claimcareteam ct, claim
WHERE ct.provclaimno = claim.provclaimno
UNION ALL
SELECT 'Supporting Info', COUNT(*)
FROM midtable_nphies.nphies_claimsupportinginfo si, claim
WHERE si.provclaimno = claim.provclaimno
UNION ALL
SELECT 'Encounters', COUNT(*)
FROM midtable_nphies.nphies_claimencounters enc, claim
WHERE enc.provclaimno = claim.provclaimno;
```

## Example Output

### Console Output
```
Testing connection...
✓ Connected
Generating data...
⏳ Generating...
✅ Successfully created 10 events with associated data
```

### Database Sample Record

```sql
-- Sample Event
eventid: EVT123456789012
provclaimno: CLMAB12CD34EF5678901234
eventtype: claim-submission
createddate: 2025-11-26 10:30:00
issubmitted: false

-- Sample Beneficiary
beneficiaryid: BEN123456789012345
fullname: John Michael Smith
documentid: 30511223344557
gender: male
dob: 1985-05-15

-- Sample Claim
provclaimno: CLMAB12CD34EF5678901234
claimtype: institutional
providernphiesid: 15000000112233
total: 12500.50

-- Sample Care Team
physicianid: 00TEST1980
physicianname: Dr. Sarah Johnson, MD
careteamrole: primary
```

## Common Scenarios

### Scenario 1: Testing Different Event Types

Generate 5 events of each type:

1. First batch: 5 events, type: claim-submission
2. Second batch: 5 events, type: preauthorization
3. Third batch: 5 events, type: eligibility-check

Total: 15 events with different characteristics

### Scenario 2: Large Dataset

Generate 100 events with all event types selected:
- Processing time: ~2-3 minutes
- Total records: ~1500-3000 across all tables

### Scenario 3: Clean and Regenerate

```sql
-- WARNING: This deletes ALL data!
-- Run in this order to respect foreign key constraints

DELETE FROM midtable_nphies.nphies_itemsupportinginfo;
DELETE FROM midtable_nphies.nphies_itemdiagnosis;
DELETE FROM midtable_nphies.nphies_itemcareteam;
DELETE FROM midtable_nphies.nphies_encounteremergency;
DELETE FROM midtable_nphies.nphiesencounterhospitalization;
DELETE FROM midtable_nphies.nphies_claimvisionprescription;
DELETE FROM midtable_nphies.nphies_claimencounters;
DELETE FROM midtable_nphies.nphies_claimdiagnosis;
DELETE FROM midtable_nphies.nphies_claimcareteam;
DELETE FROM midtable_nphies.nphies_claimaccidentdetail;
DELETE FROM midtable_nphies.nphies_claimsupportinginfo;
DELETE FROM midtable_nphies.nphies_claimpreauthdetails;
DELETE FROM midtable_nphies.nphies_claimitemdetails;
DELETE FROM midtable_nphies.nphies_claimitem;
DELETE FROM midtable_nphies.nphies_claiminfo;
DELETE FROM midtable_nphies.nphies_coverage_class;
DELETE FROM midtable_nphies.nphies_coverage;
DELETE FROM midtable_nphies.nphies_beneficiary;
DELETE FROM midtable_nphies.nphies_events;
```

Then generate fresh data.

## Tips for Testing

1. **Start Small**: Generate 5-10 events first to understand the data structure
2. **Inspect Relations**: Use the provided queries to see how data connects
3. **Verify Constants**: Always check that required constant values are present
4. **Check Distributions**: Verify that 1-3 entries are created as expected
5. **Test Edge Cases**: Generate single events and large batches

## Troubleshooting

### Issue: "Connection failed"
**Solution**: 
- Verify PostgreSQL is running
- Check credentials
- Ensure database exists
- Run schema.sql if tables don't exist

### Issue: "Foreign key constraint violation"
**Solution**: 
- Ensure schema is properly initialized
- Check that all tables exist
- Verify no custom constraints conflict with generation

### Issue: "Generation successful but no data visible"
**Solution**:
- Refresh your database client
- Query with explicit schema: `SELECT * FROM midtable_nphies.nphies_events`
- Check you're connected to the correct database

## Next Steps

1. Explore generated data relationships
2. Test your application with this mock data
3. Generate larger datasets for performance testing
4. Export data for sharing with team members

---

**Pro Tip**: Keep your test database separate from production, and always verify the connection details before generating data!
