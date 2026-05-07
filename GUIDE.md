# NPHIES Mock Data Generator - Quick Start Guide

## 🎯 Quick Start

### 1. Database Connection
Configure your PostgreSQL connection:
- **Host**: localhost (or your server IP)
- **Port**: 5432 (default PostgreSQL port)
- **Database**: nphies_db (or your database name)
- **User**: postgres (or your username)
- **Password**: Your database password

Click **Test Connection** to verify.

### 2. Generate Data
1. Select number of events (1-1000)
2. Choose one or more event types
3. Click **Generate Data**

## 🔒 Constant Values

The following values are automatically applied to all generated records:

| Field | Value |
|-------|-------|
| documentid | 30511223344557 |
| providernphiesid | 15000000112233 |
| physicianid | 00TEST1980 |

## 📊 Data Generation Rules

### For Each Event:
- **1 Event Record** in `nphies_events`
- **1 Beneficiary** in `nphies_beneficiary`
- **1-2 Coverage Records** in `nphies_coverage`
  - **0-3 Coverage Classes** per coverage
- **1 Claim Info** in `nphies_claiminfo`
- **1-5 Claim Items** in `nphies_claimitem`
  - **0-1 Item Details** per item (30% chance)
- **1-3 Diagnoses** in `nphies_claimdiagnosis`
- **1-3 Care Team Members** in `nphies_claimcareteam`
- **1 Encounter** in `nphies_claimencounters`
- **0-3 Supporting Info** records
- **0-2 Preauth Details** records

### Optional Data (Probability-Based):
- **Emergency Details**: 20% chance
- **Hospitalization Details**: 30% chance
- **Accident Details**: 10% chance
- **Vision Prescription**: 5% chance

### Junction Tables:
- Items are automatically linked to diagnoses
- Items are automatically linked to care team members
- Items are automatically linked to supporting info (50% chance)

## 🗂️ Complete Table Coverage

### Primary Tables (24 total):
1. nphies_events
2. nphies_beneficiary
3. nphies_coverage
4. nphies_coverage_class
5. nphies_claiminfo
6. nphies_claimitem
7. nphies_claimitemdetails
8. nphies_claimpreauthdetails
9. nphies_claimsupportinginfo
10. nphies_itemsupportinginfo
11. nphies_claimaccidentdetail
12. nphies_claimcareteam
13. nphies_claimdiagnosis
14. nphies_claimencounters
15. nphies_claimvisionprescription
16. nphies_encounteremergency
17. nphies_itemcareteam
18. nphies_itemdiagnosis
19. nphiesencounterhospitalization

## 🔑 Foreign Key Relationships

```
nphies_events
    └─> provclaimno → nphies_claiminfo
                         ├─> beneficiaryid → nphies_beneficiary
                         ├─> coverageid → nphies_coverage
                         │                   └─> beneficiaryid → nphies_beneficiary
                         ├─> nphies_claimitem
                         │   ├─> nphies_claimitemdetails
                         │   ├─> nphies_itemdiagnosis ←→ nphies_claimdiagnosis
                         │   ├─> nphies_itemcareteam ←→ nphies_claimcareteam
                         │   └─> nphies_itemsupportinginfo ←→ nphies_claimsupportinginfo
                         ├─> nphies_claimdiagnosis
                         ├─> nphies_claimcareteam
                         ├─> nphies_claimpreauthdetails
                         ├─> nphies_claimaccidentdetail
                         ├─> nphies_claimencounters
                         │   ├─> nphies_encounteremergency
                         │   └─> nphiesencounterhospitalization
                         └─> nphies_claimvisionprescription
```

## 💡 Tips

1. **Start Small**: Begin with 5-10 events to verify data structure
2. **Check Results**: Query the database after generation to verify
3. **Use Transactions**: All data is generated in a transaction (auto-rollback on error)
4. **Event Types**: Mix different event types for varied data
5. **Performance**: Generating 100+ events may take a minute or more

## 🔍 Example Queries

### Check Generated Events
```sql
SELECT * FROM midtable_nphies.nphies_events ORDER BY createddate DESC LIMIT 10;
```

### Check Event with All Related Data
```sql
SELECT 
    e.eventid,
    e.eventtype,
    c.provclaimno,
    c.claimtype,
    b.fullname,
    COUNT(DISTINCT ci.sequenceno) as item_count
FROM midtable_nphies.nphies_events e
JOIN midtable_nphies.nphies_claiminfo c ON e.provclaimno = c.provclaimno
JOIN midtable_nphies.nphies_beneficiary b ON c.beneficiaryid = b.beneficiaryid
LEFT JOIN midtable_nphies.nphies_claimitem ci ON c.provclaimno = ci.provclaimno
WHERE e.eventid = 'YOUR_EVENT_ID'
GROUP BY e.eventid, e.eventtype, c.provclaimno, c.claimtype, b.fullname;
```

### Count Records Across All Tables
```sql
SELECT 
    (SELECT COUNT(*) FROM midtable_nphies.nphies_events) as events,
    (SELECT COUNT(*) FROM midtable_nphies.nphies_beneficiary) as beneficiaries,
    (SELECT COUNT(*) FROM midtable_nphies.nphies_claiminfo) as claims,
    (SELECT COUNT(*) FROM midtable_nphies.nphies_claimitem) as items,
    (SELECT COUNT(*) FROM midtable_nphies.nphies_claimdiagnosis) as diagnoses;
```

## ⚠️ Troubleshooting

### Connection Failed
- Verify PostgreSQL is running
- Check credentials
- Ensure database exists
- Verify schema `midtable_nphies` exists

### Generation Failed
- Check database logs for constraint violations
- Ensure schema is properly initialized
- Verify user has INSERT permissions
- Check available disk space

### Slow Performance
- Reduce number of events
- Check database indexes
- Monitor system resources

## 🎓 Understanding the Data

All generated data is realistic but fictional:
- Names from Faker library
- Dates within recent timeframes
- Medical codes are random alphanumeric
- Financial values are randomized
- All relationships are properly maintained

---

**Need Help?** Check the main README.md for detailed documentation.
