# 🏥 NPHIES Mock Data Generator

A powerful Electron-based desktop application for generating realistic test data for the NPHIES (National Platform for Health Insurance Exchange Services) healthcare system database.

## 🌟 Features

- **Interactive UI**: Easy-to-use interface for configuring and generating mock data
- **Database Connection Testing**: Verify PostgreSQL connection before generating data
- **Flexible Configuration**: 
  - Choose the number of events (1-1000)
  - Select specific event types
  - Configure database connection settings
- **Realistic Data Generation**: Uses Faker.js to create realistic healthcare data
- **Comprehensive Coverage**: Generates data for all 24 NPHIES tables with proper relationships
- **Constant Values**: Uses required constant values for specific fields:
  - `documentid`: 30511223344557
  - `providernphiesid`: 15000000112233
  - `physicianid`: 00TEST1980

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** database with NPHIES schema created
- Run the `schema.sql` script to create the required tables

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Running the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build
```

## 🗃️ Database Setup

1. Create a PostgreSQL database
2. Run the `schema.sql` script to create the NPHIES schema and tables:

```bash
psql -U postgres -d your_database -f schema.sql
```

## 📊 Generated Data Structure

The application generates interconnected data across all NPHIES tables:

### Core Tables
- **nphies_events**: Main event records
- **nphies_beneficiary**: Patient/beneficiary information
- **nphies_coverage**: Insurance coverage details
- **nphies_claiminfo**: Claim information

### Related Tables
- **nphies_claimitem**: Claim line items (1-5 per claim)
- **nphies_claimdiagnosis**: Diagnoses (1-3 per claim)
- **nphies_claimcareteam**: Care team members (1-3 per claim)
- **nphies_claimencounters**: Encounter details
- And 15+ additional supporting tables

### Data Relationships

For each event generated, the application creates:
- 1 beneficiary record
- 1-2 coverage records
- 1 claim info record
- 1-5 claim items
- 1-3 diagnoses
- 1-3 care team members
- Various supporting records (with 10-30% probability)

## 🎯 Event Types

The following event types are supported:
- claim-submission
- preauthorization
- eligibility-check
- claim-inquiry
- payment-notice
- communication-request
- claim-cancellation
- claim-resubmission

## 🔧 Usage

1. **Configure Database Connection**:
   - Enter host, port, database name, username, and password
   - Click "Test Connection" to verify

2. **Configure Generation Settings**:
   - Select number of events to generate
   - Choose event types (one or multiple)
   
3. **Generate Data**:
   - Click "Generate Data" button
   - Wait for completion message
   - Check your database for the generated records

## 📁 Project Structure

```
midtable-mock-data-app/
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script for IPC
│   └── dataGenerator.ts     # Core data generation logic
├── src/
│   ├── App.tsx              # Main React component
│   ├── App.css              # Styles
│   ├── types.ts             # TypeScript definitions
│   └── main.tsx             # React entry point
├── schema.sql               # Database schema
└── package.json
```

## 🛠️ Technologies Used

- **Electron**: Desktop application framework
- **React**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool
- **PostgreSQL (pg)**: Database client
- **Faker.js**: Realistic data generation

## ⚠️ Important Notes

- Always test on a development database first
- Generated data is for testing purposes only
- The application uses transactions to ensure data consistency
- All foreign key relationships are properly maintained
- Constant values are enforced as per requirements

## 📝 License

This project is for internal use in testing NPHIES systems.

## 🤝 Support

For issues or questions, please contact the development team.

