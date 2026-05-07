import { faker } from '@faker-js/faker';
import { Pool, PoolClient } from 'pg';
import oracledb from 'oracledb';
import mssql from 'mssql';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Oracle Client in Thick mode for Oracle 11g support
// Thick mode is required for databases older than Oracle 12.1
try {
  // Initialize with Oracle Instant Client from specific path
  // In development, the client is in the 'electron' directory.
  // In the bundled app, __dirname is 'dist-electron'
  const libDir = path.resolve(__dirname, '..', 'electron', 'oracle_instantclient_18_5');
  console.log('Oracle: Attempting to initialize Thick mode with libDir:', libDir);

  oracledb.initOracleClient({ libDir });
  console.log('Oracle: Client initialized in Thick mode successfully');
} catch (err: any) {
  // If already initialized or client not found, log and continue
  if (err.message && !err.message.includes('already been initialized')) {
    console.error('Oracle Thick mode initialization failed:', err.message);
    console.warn('Oracle 11g connections may not work. Ensure Oracle Instant Client is installed and accessible at the expected path.');
  }
}

// Constants as per requirements
const CONSTANTS = {
  DOCUMENT_ID: '30511223344557',
  PROVIDER_NPHIES_ID: '15000000112233',
  PHYSICIAN_ID: '00TEST1980'
};

export interface GenerationConfig {
  numberOfEvents: number;
  eventTypes: string[];
  dbConfig: {
    type: 'postgres' | 'oracle' | 'mssql';
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  providerType: 'default' | 'default_auto' | 'enhanced' | 'enhanced_auto';
}

interface IDbClient {
  query(sql: string, params?: any[]): Promise<any>;
  release(): Promise<void>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

class PostgresClient implements IDbClient {
  constructor(private client: PoolClient) { }
  async query(sql: string, params?: any[]) { return this.client.query(sql, params); }
  async release() { this.client.release(); }
  async beginTransaction() { await this.client.query('BEGIN'); }
  async commit() { await this.client.query('COMMIT'); }
  async rollback() { await this.client.query('ROLLBACK'); }
}

class OracleClient implements IDbClient {
  constructor(private connection: oracledb.Connection) { }

  // Helper to convert JavaScript Date to Oracle-compatible string format
  private formatDateForOracle(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // Convert parameters - dates and booleans to Oracle-compatible types
  private convertParams(params: any[]): any[] {
    return params.map(param => {
      if (param instanceof Date) {
        return this.formatDateForOracle(param);
      }
      // Convert JavaScript booleans to Oracle-compatible format
      if (typeof param === 'boolean') {
        return param ? 1 : 0;
      }
      return param;
    });
  }

  async query(sql: string, params?: any[]) {
    // Convert $1, $2 to :1, :2
    let oracleSql = sql.replace(/\$(\d+)/g, ':$1');

    // Convert date parameters for Oracle 11g compatibility
    const convertedParams = params ? this.convertParams(params) : [];

    // For Oracle, wrap date string parameters with TO_TIMESTAMP
    // Detect which parameters are date strings and modify the SQL accordingly
    const dateParamIndices: number[] = [];
    if (params) {
      params.forEach((param, idx) => {
        if (param instanceof Date) {
          dateParamIndices.push(idx + 1); // Oracle params are 1-indexed
        }
      });
    }

    // Replace :N with TO_TIMESTAMP(:N, 'YYYY-MM-DD HH24:MI:SS') for date parameters
    for (const idx of dateParamIndices) {
      const regex = new RegExp(`:${idx}(?![0-9])`, 'g');
      oracleSql = oracleSql.replace(regex, `TO_TIMESTAMP(:${idx}, 'YYYY-MM-DD HH24:MI:SS')`);
    }

    // Debug logging
    console.log('Oracle SQL:', oracleSql.trim().substring(0, 150) + '...');
    console.log('Date param indices:', dateParamIndices);

    return this.connection.execute(oracleSql, convertedParams, { autoCommit: false });
  }
  async release() { await this.connection.close(); }
  async beginTransaction() { /* Implicit in Oracle */ }
  async commit() { await this.connection.commit(); }
  async rollback() { await this.connection.rollback(); }
}

class SqlServerClient implements IDbClient {
  private transaction: mssql.Transaction | null = null;

  constructor(private pool: mssql.ConnectionPool) { }

  async query(sql: string, params?: any[]) {
    const request = this.transaction ? this.transaction.request() : this.pool.request();

    if (params) {
      params.forEach((param, index) => {
        // SQL Server uses @p0, @p1 or named parameters.
        // The codebase seems to use $1, $2, etc. which we need to convert to @param0, @param1
        request.input(`p${index}`, param);
      });
    }

    // Convert $1, $2 to @p0, @p1
    const mssqlSql = sql.replace(/\$(\d+)/g, (_, n) => `@p${parseInt(n) - 1}`);

    return request.query(mssqlSql);
  }

  async release() {
    // Connection should be closed by calling pool.close() in DataGenerator.close()
    // or if this is a single connection, we might close it here.
    // However, the pattern seems to be that release() is called after each generation cycle or test.
  }

  async beginTransaction() {
    this.transaction = new mssql.Transaction(this.pool);
    await this.transaction.begin();
  }

  async commit() {
    if (this.transaction) {
      await this.transaction.commit();
      this.transaction = null;
    }
  }

  async rollback() {
    if (this.transaction) {
      await this.transaction.rollback();
      this.transaction = null;
    }
  }
}

export class DataGenerator {
  private dbConfig: GenerationConfig['dbConfig'];
  private pgPool: Pool | null = null;
  private mssqlPool: mssql.ConnectionPool | null = null;
  private schemaPrefix: string;
  private providerType: 'default' | 'default_auto' | 'enhanced' | 'enhanced_auto' = 'default';

  constructor(dbConfig: GenerationConfig['dbConfig']) {
    this.dbConfig = dbConfig;

    // Determine schema prefix based on database type
    if (this.dbConfig.type === 'oracle' || this.dbConfig.type === 'mssql') {
      this.schemaPrefix = '';
    } else {
      this.schemaPrefix = 'midtable_nphies.';
    }

    // Default to postgres if type is missing or set to postgres
    if (this.dbConfig.type === 'postgres' || !this.dbConfig.type) {
      this.pgPool = new Pool(dbConfig);
    }
  }

  /**
   * Check if current provider type is an AUTO mode (timestamp-based sync)
   */
  private isAutoMode(): boolean {
    return this.providerType === 'default_auto' || this.providerType === 'enhanced_auto';
  }

  /**
   * Check if current provider type is an ENHANCED mode (uses UHR schema)
   */
  private isEnhancedMode(): boolean {
    return this.providerType === 'enhanced' || this.providerType === 'enhanced_auto';
  }

  private async getClient(): Promise<IDbClient> {
    if (this.dbConfig.type === 'oracle') {
      const conn = await oracledb.getConnection({
        user: this.dbConfig.user,
        password: this.dbConfig.password,
        connectString: `${this.dbConfig.host}:${this.dbConfig.port}/${this.dbConfig.database}`
      });
      return new OracleClient(conn);
    } else if (this.dbConfig.type === 'mssql') {
      if (!this.mssqlPool) {
        // Handle instance name if present in host (e.g. 172.16.10.6\SQL2019)
        const hostParts = this.dbConfig.host.split('\\');
        const server = hostParts[0];
        const instanceName = hostParts[1];

        this.mssqlPool = new mssql.ConnectionPool({
          user: this.dbConfig.user,
          password: this.dbConfig.password,
          server: server,
          port: this.dbConfig.port,
          database: this.dbConfig.database,
          options: {
            encrypt: false,
            trustServerCertificate: true,
            instanceName: instanceName
          }
        });
        await this.mssqlPool.connect();
      }
      return new SqlServerClient(this.mssqlPool);
    } else {
      if (!this.pgPool) {
        this.pgPool = new Pool(this.dbConfig);
      }
      const client = await this.pgPool.connect();
      return new PostgresClient(client);
    }
  }

  async testConnection(): Promise<boolean> {
    let client: IDbClient | null = null;
    try {
      client = await this.getClient();
      // For Oracle, we might need 'SELECT 1 FROM DUAL' vs 'SELECT 1'
      if (this.dbConfig.type === 'oracle') {
        await client.query('SELECT 1 FROM DUAL');
      } else {
        await client.query('SELECT 1');
      }
      await client.release();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      if (client) {
        try { await client.release(); } catch (e) { }
      }
      return false;
    }
  }

  async generateData(config: GenerationConfig): Promise<{ success: boolean; message: string; eventsCreated: number }> {
    let client: IDbClient | null = null;
    let eventsCreated = 0;
    let failedEvents = 0;
    let lastError: any = null;

    try {
      client = await this.getClient();
      this.providerType = config.providerType || 'default';
      console.log(`Starting generation of ${config.numberOfEvents} events...`);

      for (let i = 0; i < config.numberOfEvents; i++) {
        try {
          await client.beginTransaction();

          const eventType = config.eventTypes[Math.floor(Math.random() * config.eventTypes.length)];
          const provClaimNo = this.generateProvClaimNo();

          // Create event ONLY for non-AUTO modes (event-based sync)
          // AUTO modes use timestamp-based sync and do NOT create nphies_events entries
          if (!this.isAutoMode()) {
            await this.createEvent(client, provClaimNo, eventType);
          }

          // Create beneficiary
          const beneficiaryId = await this.createBeneficiary(client);

          // Create claim info
          if (this.isEnhancedMode()) {
            await this.createVisitInfo(client, provClaimNo, beneficiaryId);

            // 20% chance for pregnancy details
            if (Math.random() < 0.2) {
              await this.createPregnancyDetails(client, provClaimNo);
            }
          } else {
            // Default provider still uses coverage
            const coverageId = await this.createCoverage(client, beneficiaryId);

            // Create coverage classes (0-3 per coverage)
            const classCount = Math.floor(Math.random() * 4);
            for (let k = 0; k < classCount; k++) {
              await this.createCoverageClass(client, coverageId);
            }

            await this.createClaimInfo(client, provClaimNo, beneficiaryId, coverageId);
          }

          // Create claim items (1-5)
          const itemCount = Math.floor(Math.random() * 5) + 1;
          const itemSequences: number[] = [];

          for (let j = 1; j <= itemCount; j++) {
            await this.createClaimItem(client, provClaimNo, j);
            itemSequences.push(j);

            // Some items have details (30% chance)
            if (Math.random() < 0.3) {
              const detailSequence = j + 1000; // Offset to avoid conflicts
              await this.createClaimItemDetails(client, provClaimNo, j, detailSequence);
            }

            // ENHANCED specific item extensions
            if (this.isEnhancedMode()) {
              // 40% chance for medication details
              if (Math.random() < 0.4) {
                await this.createClaimItemMedication(client, provClaimNo, j);
                await this.createClaimItemDosage(client, provClaimNo, j);
              }
              // 30% chance for procedure details
              if (Math.random() < 0.3) {
                await this.createClaimItemProcedure(client, provClaimNo, j);
              }
            }
          }

          // Create diagnoses (1-3)
          const diagnosisCount = Math.floor(Math.random() * 3) + 1;
          const diagnosisSequences: number[] = [];

          for (let j = 1; j <= diagnosisCount; j++) {
            await this.createClaimDiagnosis(client, provClaimNo, j);
            diagnosisSequences.push(j);
          }

          // Create care team (1-3 members)
          const careTeamCount = Math.floor(Math.random() * 3) + 1;
          const careTeamSequences: number[] = [];

          for (let j = 1; j <= careTeamCount; j++) {
            await this.createClaimCareTeam(client, provClaimNo, j);
            careTeamSequences.push(j);
          }

          // Link items to diagnoses
          for (const itemSeq of itemSequences) {
            const linkedDiagnosesCount = Math.floor(Math.random() * diagnosisSequences.length) + 1;
            const shuffled = [...diagnosisSequences].sort(() => 0.5 - Math.random());

            for (let j = 0; j < linkedDiagnosesCount; j++) {
              await this.createItemDiagnosis(client, provClaimNo, shuffled[j], itemSeq);
            }
          }

          // Link items to care team
          for (const itemSeq of itemSequences) {
            const linkedCareTeamCount = Math.floor(Math.random() * careTeamSequences.length) + 1;
            const shuffled = [...careTeamSequences].sort(() => 0.5 - Math.random());

            for (let j = 0; j < linkedCareTeamCount; j++) {
              await this.createItemCareTeam(client, provClaimNo, shuffled[j], itemSeq);
            }
          }

          // Create supporting info (0-3)
          const supportingInfoCount = Math.floor(Math.random() * 4);
          const supportingInfoSequences: number[] = [];

          for (let j = 1; j <= supportingInfoCount; j++) {
            await this.createClaimSupportingInfo(client, provClaimNo, j);
            supportingInfoSequences.push(j);
          }

          // Link items to supporting info
          for (const itemSeq of itemSequences) {
            for (const supportingSeq of supportingInfoSequences) {
              if (Math.random() < 0.5) { // 50% chance to link
                await this.createItemSupportingInfo(client, provClaimNo, supportingSeq, itemSeq);
              }
            }
          }

          // Default provider specific tables
          if (!this.isEnhancedMode()) {
            // Create preauth details (0-2)
            const preauthCount = Math.floor(Math.random() * 3);
            for (let j = 0; j < preauthCount; j++) {
              await this.createClaimPreauthDetails(client, provClaimNo);
            }
          }

          // Create encounter (1 per claim)
          const encounterId = await this.createClaimEncounter(client, provClaimNo);

          // 20% chance for emergency encounter
          if (Math.random() < 0.2) {
            await this.createEncounterEmergency(client, encounterId);
          }

          // 30% chance for hospitalization
          if (Math.random() < 0.3) {
            await this.createEncounterHospitalization(client, encounterId);
          }

          // Default provider specific tables
          if (!this.isEnhancedMode()) {
            // 10% chance for accident details
            if (Math.random() < 0.1) {
              await this.createClaimAccidentDetail(client, provClaimNo);
            }

            // 5% chance for vision prescription (only if care team exists)
            if (Math.random() < 0.05 && careTeamSequences.length > 0) {
              await this.createClaimVisionPrescription(client, provClaimNo, careTeamSequences[0]);
            }
          }

          await client.commit();
          eventsCreated++;

        } catch (iterationError) {
          if (client) await client.rollback();
          console.error(`Error generating event ${i + 1}:`, iterationError);
          lastError = iterationError;
          failedEvents++;
        }
      }

      return {
        success: eventsCreated > 0,
        message: `Successfully created ${eventsCreated} events.${failedEvents > 0 ? ` Failed: ${failedEvents}. Last error: ${lastError?.message || 'Unknown'}` : ''}`,
        eventsCreated
      };

    } catch (error) {
      console.error('Data generation fatal error:', error);
      return {
        success: false,
        message: `Fatal Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        eventsCreated: 0
      };
    } finally {
      if (client) await client.release();
    }
  }

  // Helper to ensure strings don't exceed VARCHAR limits
  private truncate(value: string | undefined, maxLength: number): string {
    const val = value || '';
    return val.length > maxLength ? val.substring(0, maxLength) : val;
  }

  private generateProvClaimNo(): string {
    // Max 40 chars for provclaimno - CLM(3) + 10 alphanumeric + 7 timestamp = 20 chars
    return `CLM${faker.string.alphanumeric(10).toUpperCase()}${Date.now().toString().slice(-7)}`;
  }

  private generateId(prefix: string, length: number = 15): string {
    // Ensure total length doesn't exceed expected limits
    const numericPart = faker.string.numeric(Math.max(1, length - prefix.length));
    return `${prefix}${numericPart}`.substring(0, length);
  }

  private async createEvent(client: IDbClient, provClaimNo: string, eventType: string): Promise<void> {
    const eventId = this.generateId('EVT', 47); // Max 50 for eventid
    const idCol = this.isEnhancedMode() ? 'visitID' : 'provclaimno';

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_events 
      (eventid, ${idCol}, eventtype, createddate, issubmitted)
      VALUES ($1, $2, $3, $4, $5)
    `, [eventId, provClaimNo, eventType, new Date(), false]);
  }

  private async createBeneficiary(client: IDbClient): Promise<string> {
    const beneficiaryId = this.generateId('BEN', 17); // Max 20

    const firstName = this.truncate(faker.person.firstName(), 50);
    const middleName = this.truncate(faker.person.middleName(), 50);
    const lastName = this.truncate(faker.person.lastName(), 50);
    const fullName = this.truncate(`${firstName} ${middleName} ${lastName}`, 200);

    // Use real eHealthIDs from the provided list
    const eHealthIds = ['3051122334455', '30511223344565', '30511223344573'];
    const eHealthId = faker.helpers.arrayElement(eHealthIds);

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_beneficiary 
      (beneficiaryid, patientfileno, firstname, middlename, lastname, fullname, 
       dob, gender, nationality, documenttype, documentid, contactnumber, ehealthid,
       residencytype, maritalstatus, bloodgroup, preferredlanguage, email,
       addressline, addressstreetname, addresscity, addressdistrict, addressstate,
       addresspostalcode, addresscountry, occupation, religion, prior_patient_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
    `, [
      beneficiaryId,
      this.truncate(faker.string.alphanumeric(10).toUpperCase(), 30),
      firstName,
      middleName,
      lastName,
      fullName,
      faker.date.birthdate({ min: 1940, max: 2020, mode: 'year' }),
      faker.helpers.arrayElement(['male', 'female']),
      this.truncate('SA', 30),
      this.truncate('National-ID', 30),
      CONSTANTS.DOCUMENT_ID,
      this.truncate(`+966-5${faker.string.numeric(8)}`, 50),
      eHealthId,
      this.truncate(faker.helpers.arrayElement(['Citizen', 'Resident']), 50),
      faker.helpers.arrayElement(['Married', 'Single']),
      faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
      'en',
      this.truncate(faker.internet.email(), 50),
      this.truncate(faker.location.streetAddress(), 250),
      this.truncate(faker.location.street(), 250),
      this.truncate(faker.location.city(), 250),
      this.truncate(faker.location.county(), 250),
      this.truncate(faker.location.state(), 250),
      this.truncate(faker.location.zipCode() || '12345', 100),
      'SA',
      this.truncate(faker.person.jobTitle(), 20),
      this.truncate(faker.helpers.arrayElement(['Islam', 'Other']), 5),
      this.isEnhancedMode() ? this.truncate(faker.string.numeric(10), 70) : null
    ]);

    return beneficiaryId;
  }

  private async createCoverage(client: IDbClient, beneficiaryId: string): Promise<string> {
    const coverageId = this.generateId('COV', 17);

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_coverage 
      (coverageid, memberid, expirydate, payernphiesid, tpanphiesid,
       relationwithsubscriber, policyholder, policynumber, coveragetype, beneficiaryid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      coverageId,
      this.truncate(faker.string.alphanumeric(15).toUpperCase(), 50),
      faker.date.future({ years: 1 }),
      this.generateId('PAY', 17),
      Math.random() < 0.3 ? this.generateId('TPA', 17) : null,
      this.truncate(faker.helpers.arrayElement(['self', 'spouse', 'child', 'parent']), 20),
      this.truncate(faker.company.name(), 250),
      this.truncate(faker.string.alphanumeric(10).toUpperCase(), 30),
      this.truncate(faker.helpers.arrayElement(['EHCPOL', 'PUBLICPOL']), 20),
      beneficiaryId
    ]);

    return coverageId;
  }

  private async createCoverageClass(client: IDbClient, coverageId: string): Promise<void> {
    const coverageClassId = this.generateId('CLS', 17);

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_coverage_class 
      (coverageclassid, type, value, name, coverageid)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      coverageClassId,
      this.truncate(faker.helpers.arrayElement(['group', 'plan', 'class']) || 'group', 20),
      this.truncate((faker.string.alphanumeric(10) || 'ABC123').toUpperCase(), 50),
      this.truncate(faker.commerce.productName() || 'Coverage Plan', 250),
      coverageId
    ]);
  }

  private async createClaimInfo(client: IDbClient, provClaimNo: string, beneficiaryId: string, coverageId: string): Promise<void> {
    const billableStart = faker.date.recent({ days: 30 });
    const billableEnd = faker.date.soon({ days: 7, refDate: billableStart });

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claiminfo 
      (provclaimno, episodeid, isnewborn, isreferral, referringprovidername,
       claimtype, claimsubtype, providernphiesid, claimcreateddate, accountingperiod,
       billableperiodstart, billableperiodend, eligibilityresponseid, eligibilityidentifierurl,
       eligibilityofflineid, eligibilityofflinedate, preauthofflinedate, preauthresponseid,
       preauthidentifierurl, payeetype, payeeid, coverageid, beneficiaryid, subscriberid, total, prescription)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    `, [
      provClaimNo,
      this.generateId('EP', 17), // Max 20
      faker.helpers.arrayElement(['true', 'false']),
      faker.helpers.arrayElement(['true', 'false']),
      Math.random() < 0.3 ? this.truncate(faker.company.name() || 'Provider', 250) : null,
      this.truncate(faker.helpers.arrayElement(['01.08']) || '01.08', 50),
      this.truncate(faker.helpers.arrayElement(['ip', 'op', 'emergency']) || 'op', 50),
      CONSTANTS.PROVIDER_NPHIES_ID,
      new Date(),
      faker.date.recent({ days: 30 }),
      billableStart,
      billableEnd,
      this.truncate(faker.string.alphanumeric(15) || 'ELIG123', 50),
      this.truncate(faker.internet.url() || 'https://example.com', 250),
      Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(15) || 'OFF123', 50) : null,
      Math.random() < 0.2 ? faker.date.recent({ days: 10 }) : null,
      Math.random() < 0.2 ? faker.date.recent({ days: 10 }) : null,
      Math.random() < 0.3 ? this.truncate(faker.string.alphanumeric(15) || 'PRE123', 50) : null,
      Math.random() < 0.3 ? this.truncate(faker.internet.url() || 'https://example.com', 250) : null,
      this.truncate(faker.helpers.arrayElement(['provider', 'subscriber']) || 'provider', 20),
      this.generateId('PYE', 17), // Max 20
      coverageId,
      beneficiaryId,
      Math.random() < 0.3 ? beneficiaryId : null,
      parseFloat(faker.finance.amount({ min: 100, max: 50000, dec: 2 })),
      Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(20) || 'PRES123', 50) : null
    ]);
  }

  private async createVisitInfo(client: IDbClient, visitId: string, beneficiaryId: string): Promise<void> {
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_visitinfo 
      (visitID, episodeid, claimtype, claimsubtype, providernphiesid, providernphiesname,
       claimcreateddate, accountingperiod, beneficiaryid, prescription, prior_visit_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      visitId,
      this.generateId('EP', 17),
      this.truncate(faker.helpers.arrayElement(['01.08']) || '01.08', 50),
      this.truncate(faker.helpers.arrayElement(['ip', 'op', 'emergency']) || 'op', 50),
      CONSTANTS.PROVIDER_NPHIES_ID,
      this.truncate(faker.company.name() + ' Hospital', 200),
      new Date(),
      faker.date.recent({ days: 30 }),
      beneficiaryId,
      Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(20) || 'PRES123', 50) : null,
      Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(15), 40) : null
    ]);
  }

  private async createClaimItem(client: IDbClient, provClaimNo: string, sequenceNo: number): Promise<void> {
    const quantity = parseFloat(faker.finance.amount({ min: 1, max: 10, dec: 2 }));
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';

    if (this.providerType === 'abha') {
      await client.query(`
        INSERT INTO ${this.schemaPrefix}nphies_claimitem 
        (${idCol}, sequenceno, servicetype, servicecode, servicedesc,
         nonstandardcode, nonstandarddesc, udi, ispackage, quantity, quantitycode,
         startdate, enddate, bodysitecode, subsitecode, drugselectionreason,
         prescribeddrugcode, pharmacistselectionreason, pharmacistsubstitute,
         reasonpharmacistsubstitute, ismaternity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        provClaimNo,
        sequenceNo,
        this.truncate(faker.helpers.arrayElement(['service', 'drug', 'device', 'lab']), 50),
        this.truncate(faker.string.numeric(8), 50),
        this.truncate(faker.commerce.productName(), 250),
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.commerce.productDescription(), 250) : null,
        Math.random() < 0.1 ? this.truncate(faker.string.alphanumeric(15), 50) : null,
        faker.helpers.arrayElement(['true', 'false']),
        quantity,
        this.truncate('unit', 20),
        faker.date.recent({ days: 7 }),
        faker.date.recent({ days: 1 }),
        Math.random() < 0.3 ? this.truncate(faker.string.numeric(3), 50) : null,
        Math.random() < 0.3 ? this.truncate(faker.string.numeric(3), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.helpers.arrayElement(['formulary', 'allergy']), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.helpers.arrayElement(['out-of-stock', 'cheaper']), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.lorem.sentence(), 250) : null,
        faker.helpers.arrayElement(['true', 'false'])
      ]);
    } else {
      const unitPrice = parseFloat(faker.finance.amount({ min: 10, max: 5000, dec: 2 }));
      const factor = parseFloat(faker.finance.amount({ min: 0.8, max: 1.2, dec: 6 }));
      const discount = parseFloat(faker.finance.amount({ min: 0, max: unitPrice * 0.2, dec: 2 }));
      const subtotal = unitPrice * quantity * factor - discount;
      const tax = subtotal * 0.15;
      const net = subtotal + tax;
      const patientShare = net * parseFloat(faker.finance.amount({ min: 0.1, max: 0.3, dec: 2 }));
      const payerShare = net - patientShare;

      await client.query(`
        INSERT INTO ${this.schemaPrefix}nphies_claimitem 
        (${idCol}, invoiceno, sequenceno, servicetype, servicecode, servicedesc,
         nonstandardcode, nonstandarddesc, udi, ispackage, quantity, quantitycode,
         unitprice, discount, factor, patientshare, payershare, tax, net,
         startdate, enddate, bodysitecode, subsitecode, drugselectionreason,
         prescribeddrugcode, pharmacistselectionreason, pharmacistsubstitute,
         reasonpharmacistsubstitute, ismaternity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      `, [
        provClaimNo,
        this.truncate(faker.string.alphanumeric(10).toUpperCase(), 50),
        sequenceNo,
        this.truncate(faker.helpers.arrayElement(['service', 'drug', 'device', 'lab']), 50),
        this.truncate(faker.string.numeric(8), 50),
        this.truncate(faker.commerce.productName(), 250),
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.commerce.productDescription(), 250) : null,
        Math.random() < 0.1 ? this.truncate(faker.string.alphanumeric(15), 50) : null,
        faker.helpers.arrayElement(['true', 'false']),
        quantity,
        this.truncate('unit', 20),
        unitPrice,
        discount,
        factor,
        patientShare,
        payerShare,
        tax,
        net,
        faker.date.recent({ days: 7 }),
        faker.date.recent({ days: 1 }),
        Math.random() < 0.3 ? this.truncate(faker.string.numeric(3), 50) : null,
        Math.random() < 0.3 ? this.truncate(faker.string.numeric(3), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.helpers.arrayElement(['formulary', 'allergy']), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.helpers.arrayElement(['out-of-stock', 'cheaper']), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.lorem.sentence(), 250) : null,
        faker.helpers.arrayElement(['true', 'false'])
      ]);
    }
  }

  private async createClaimItemDetails(client: IDbClient, provClaimNo: string, itemSequenceNo: number, sequenceNo: number): Promise<void> {
    const quantity = parseInt(faker.finance.amount({ min: 1, max: 5, dec: 0 }));
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';

    if (this.providerType === 'abha') {
      await client.query(`
        INSERT INTO ${this.schemaPrefix}nphies_claimitemdetails 
        (itemsequenceno, ${idCol}, sequenceno, servicetype, servicecode, servicedesc,
         nonstandardcode, nonstandarddesc, udi, quantity, quantitycode,
         prescribeddrugcode, pharmacistselectionreason, pharmacistsubstitute,
         reasonpharmacistsubstitute)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        itemSequenceNo,
        provClaimNo,
        sequenceNo,
        this.truncate(faker.helpers.arrayElement(['service', 'drug', 'device']), 50),
        this.truncate(faker.string.numeric(8), 50),
        this.truncate(faker.commerce.productName(), 250),
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.commerce.productDescription(), 250) : null,
        Math.random() < 0.1 ? this.truncate(faker.string.alphanumeric(15), 50) : null,
        quantity,
        this.truncate('unit', 20),
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.helpers.arrayElement(['out-of-stock', 'cheaper']), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.lorem.sentence(), 250) : null
      ]);
    } else {
      const unitPrice = parseFloat(faker.finance.amount({ min: 10, max: 1000, dec: 2 }));
      const tax = unitPrice * quantity * 0.15;
      const net = unitPrice * quantity + tax;

      await client.query(`
        INSERT INTO ${this.schemaPrefix}nphies_claimitemdetails 
        (itemsequenceno, ${idCol}, sequenceno, servicetype, servicecode, servicedesc,
         nonstandardcode, nonstandarddesc, udi, quantity, quantitycode, unitprice,
         tax, net, prescribeddrugcode, pharmacistselectionreason, pharmacistsubstitute,
         reasonpharmacistsubstitute)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        itemSequenceNo,
        provClaimNo,
        sequenceNo,
        this.truncate(faker.helpers.arrayElement(['service', 'drug', 'device']), 50),
        this.truncate(faker.string.numeric(8), 50),
        this.truncate(faker.commerce.productName(), 250),
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.commerce.productDescription(), 250) : null,
        Math.random() < 0.1 ? this.truncate(faker.string.alphanumeric(15), 50) : null,
        quantity,
        this.truncate('unit', 20),
        unitPrice,
        tax,
        net,
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.helpers.arrayElement(['out-of-stock', 'cheaper']), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.string.alphanumeric(10), 50) : null,
        Math.random() < 0.2 ? this.truncate(faker.lorem.sentence(), 250) : null
      ]);
    }
  }

  private async createClaimDiagnosis(client: IDbClient, provClaimNo: string, sequenceNo: number): Promise<void> {
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimdiagnosis 
      (${idCol}, sequenceno, diagnosiscode, diagnosisdesc, diagnosistype,
       onadmission, conditiononset)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      provClaimNo,
      sequenceNo,
      "M25.46",
      this.truncate(faker.string.alphanumeric(8).toUpperCase(), 50),
      this.truncate(faker.helpers.arrayElement(['PRINCIPAL', 'SECONDARY']), 50),
      this.truncate(faker.helpers.arrayElement(['y', 'n', 'u']), 5),
      faker.helpers.arrayElement(['true', 'false'])
    ]);
  }

  private async createClaimCareTeam(client: IDbClient, provClaimNo: string, sequenceNo: number): Promise<void> {
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimcareteam 
      (${idCol}, sequenceno, physicianid, physicianname, practitionerrole,
       careteamrole, careteamqualification)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      provClaimNo,
      sequenceNo,
      CONSTANTS.PHYSICIAN_ID,
      this.truncate(faker.person.fullName() + ', MD', 250),
      this.truncate(faker.helpers.arrayElement(['doctor', 'nurse', 'specialist']), 50),
      this.truncate(faker.helpers.arrayElement(['primary', 'assist', 'supervisor']), 50),
      this.truncate(faker.helpers.arrayElement(['MD', 'DO', 'RN', 'NP', 'PA']), 50)
    ]);
  }

  private async createItemDiagnosis(client: IDbClient, provClaimNo: string, diagnosisSequenceNo: number, itemSequenceNo: number): Promise<void> {
    // Note: ON CONFLICT is PostgreSQL specific, Oracle uses MERGE or simple INSERT with exception handling
    // For simplicity sake in this mock generator and given Oracle limitation with simple SQL execution:
    // We will use standard INSERT and ignore duplicate errors in the catch block if needed,
    // or we can remove ON CONFLICT for Postgres too if we are sure IDs are unique.
    // However, the original code had ON CONFLICT DO NOTHING.
    // Oracle 21c+ supports syntax like INSERT ... ON DUPLICATE KEY IGNORE equivalent or similar via hints but standard way is MERGE.

    // To keep it simple and compatible, we will remove ON CONFLICT and let the outer try/catch/rollback handle it?
    // No, duplicate keys shouldn't fail the whole event generation if possible.
    // But since this is a sequence we control, duplicates shouldn't happen often unless random puts them there.
    // Let's rely on probability.

    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';
    let query = `
      INSERT INTO ${this.schemaPrefix}nphies_itemdiagnosis 
      (${idCol}, diagnosissequenceno, itemsequenceno)
      VALUES ($1, $2, $3)
    `;

    if (this.dbConfig.type === 'postgres') {
      query += ' ON CONFLICT DO NOTHING';
    }

    try {
      await client.query(query, [provClaimNo, diagnosisSequenceNo, itemSequenceNo]);
    } catch (e) {
      // Ignore duplicate key errors for Oracle (ORA-00001)
      // If Postgres fails despite ON CONFLICT (unlikely), we also catch it.
      //console.warn('Ignored error in createItemDiagnosis:', e);
    }
  }

  private async createItemCareTeam(client: IDbClient, provClaimNo: string, careTeamSequenceNo: number, itemSequenceNo: number): Promise<void> {
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';
    let query = `
      INSERT INTO ${this.schemaPrefix}nphies_itemcareteam 
      (${idCol}, careteamsequenceno, itemsequenceno)
      VALUES ($1, $2, $3)
    `;

    if (this.dbConfig.type === 'postgres') {
      query += ' ON CONFLICT DO NOTHING';
    }

    try {
      await client.query(query, [provClaimNo, careTeamSequenceNo, itemSequenceNo]);
    } catch (e) {
      // Ignore duplicate key errors
    }
  }

  private async createClaimSupportingInfo(client: IDbClient, provClaimNo: string, sequenceNo: number): Promise<void> {
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimsupportinginfo 
      (${idCol}, sequenceno, category, reason, supportingvalue, supportingattachment,
       attachmentfilename, attachmenttype, code, unit, timingperiodfrom, timingperiodto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      provClaimNo,
      sequenceNo,
      this.truncate(faker.helpers.arrayElement(['info', 'attachment', 'missingtooth']), 50),
      Math.random() < 0.3 ? this.truncate(faker.helpers.arrayElement(['new-visit', 'emergency']), 50) : null,
      this.truncate(faker.lorem.sentence(), 250),
      null, // BYTEA - skipping for simplicity
      Math.random() < 0.2 ? this.truncate(faker.system.fileName(), 250) : null,
      Math.random() < 0.2 ? this.truncate(faker.system.mimeType(), 50) : null,
      Math.random() < 0.3 ? this.truncate(faker.string.alphanumeric(8), 50) : null,
      Math.random() < 0.3 ? this.truncate(faker.helpers.arrayElement(['day', 'week', 'month']), 20) : null,
      Math.random() < 0.3 ? faker.date.recent({ days: 30 }) : null,
      Math.random() < 0.3 ? faker.date.recent({ days: 1 }) : null
    ]);
  }

  private async createItemSupportingInfo(client: IDbClient, provClaimNo: string, supportingInfoSequenceNo: number, itemSequenceNo: number): Promise<void> {
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';
    let query = `
      INSERT INTO ${this.schemaPrefix}nphies_itemsupportinginfo 
      (${idCol}, supportinginfosequenceno, itemsequenceno)
      VALUES ($1, $2, $3)
    `;

    if (this.dbConfig.type === 'postgres') {
      query += ' ON CONFLICT DO NOTHING';
    }

    try {
      await client.query(query, [provClaimNo, supportingInfoSequenceNo, itemSequenceNo]);
    } catch (e) {
      // Ignore duplicate key errors
    }
  }

  private async createClaimEncounter(client: IDbClient, provClaimNo: string): Promise<string> {
    const encounterId = this.generateId('ENC', 17); // Max 20
    const startDate = faker.date.recent({ days: 30 });
    const endDate = faker.date.soon({ days: 7, refDate: startDate });
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimencounters 
      (${idCol}, encounterid, encounterstartdate, encounterenddate, encounterclass,
       encounterservicetype, priority, serviceprovider, encounterstatus, causeofdeath,
       serviceeventtype, room, bed, point_of_care, facility_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      provClaimNo,
      encounterId,
      startDate,
      endDate,
      this.truncate(faker.helpers.arrayElement(['IMP', 'SS']), 50),
      this.truncate(faker.helpers.arrayElement(['consultation', 'surgery', 'therapy']), 50),
      this.truncate(faker.helpers.arrayElement(['routine', 'urgent', 'asap']), 50),
      CONSTANTS.PROVIDER_NPHIES_ID,
      this.truncate(faker.helpers.arrayElement(['planned', 'arrived', 'in-progress', 'finished']), 50),
      Math.random() < 0.05 ? this.truncate(faker.helpers.arrayElement(['y', 'n']), 5) : null,
      Math.random() < 0.2 ? this.truncate(faker.helpers.arrayElement(['admission', 'discharge']), 50) : null,
      this.providerType === 'abha' ? this.truncate(faker.string.alphanumeric(5).toUpperCase(), 50) : null,
      this.providerType === 'abha' ? this.truncate(faker.string.numeric(2), 50) : null,
      this.providerType === 'abha' ? this.truncate(faker.helpers.arrayElement(['OPD', 'IPD', 'ER']), 100) : null,
      this.providerType === 'abha' ? this.truncate(faker.string.alphanumeric(10).toUpperCase(), 100) : null
    ]);

    return encounterId;
  }

  private async createEncounterEmergency(client: IDbClient, encounterId: string): Promise<void> {
    const emergencyId = this.generateId('EMG', 17); // Max 20

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_encounteremergency 
      (encounteremergencyid, emergencyarrivalcode, emergencyservicestart,
       emergencydepartmentdisposition, triagecategory, triagedate, encounterid)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      emergencyId,
      this.truncate(faker.helpers.arrayElement(['A', 'P', 'O']), 50),
      faker.date.recent({ days: 1 }),
      this.truncate(faker.helpers.arrayElement(['admitted', 'discharged', 'transferred']), 50),
      this.truncate(faker.helpers.arrayElement(['immediate', 'urgent', 'standard']), 50),
      faker.date.recent({ days: 1 }),
      encounterId
    ]);
  }

  private async createEncounterHospitalization(client: IDbClient, encounterId: string): Promise<void> {
    const hospitalizationId = this.generateId('HOS', 17); // Max 20

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphiesencounterhospitalization 
      (encounterhospitalizationid, hospitaladmissionspeciality, hospitaldischargespeciality,
       hospitalintendedlengthofstay, hospitalizationorigin, hospitaladmissionsource,
       hospitalreadmission, hospitaldischargedisposition, encounterid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      hospitalizationId,
      this.truncate(faker.helpers.arrayElement(['cardiology', 'surgery', 'internal']), 50),
      Math.random() < 0.7 ? this.truncate(faker.helpers.arrayElement(['cardiology', 'surgery', 'internal']), 50) : null,
      this.truncate(faker.helpers.arrayElement(['1-3', '4-7', '8-14', '15+']), 50),
      Math.random() < 0.3 ? this.truncate(faker.helpers.arrayElement(['home', 'facility']), 50) : null,
      this.truncate(faker.helpers.arrayElement(['emergency', 'referral', 'direct']), 50),
      Math.random() < 0.2 ? this.truncate(faker.helpers.arrayElement(['y', 'n']), 5) : null,
      Math.random() < 0.7 ? this.truncate(faker.helpers.arrayElement(['home', 'other-facility', 'rehab']), 50) : null,
      encounterId
    ]);
  }

  private async createClaimPreauthDetails(client: IDbClient, provClaimNo: string): Promise<void> {
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimpreauthdetails 
      (${idCol}, preauthrefno)
      VALUES ($1, $2)
    `, [
      provClaimNo,
      this.truncate(faker.string.alphanumeric(15).toUpperCase(), 50)
    ]);
  }

  private async createClaimAccidentDetail(client: IDbClient, provClaimNo: string): Promise<void> {
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimaccidentdetail 
      (${idCol}, accidenttype, accidentdate, addressstreetname, addresscity,
       addressstate, addresscountry)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      provClaimNo,
      this.truncate(faker.helpers.arrayElement(['MVA', 'work', 'home', 'sports']), 50),
      faker.date.recent({ days: 30 }),
      this.truncate(faker.location.street(), 250),
      this.truncate(faker.location.city(), 100),
      this.truncate(faker.location.state(), 100),
      'SA'
    ]);
  }

  private async createClaimVisionPrescription(client: IDbClient, provClaimNo: string, careTeamSequence: number): Promise<void> {
    const visionPrescriptionId = this.generateId('VIS', 17);
    const idCol = this.providerType === 'abha' ? 'visitID' : 'provclaimno';

    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimvisionprescription 
      (${idCol}, visionprescriptionid, datewritten, careteamsequence, product, eye,
       sphere, cylinder, axis, prismamount, prismbase, multifocalpower, lenspower,
       lensbackcurve, lensdiameter, lensduration, lenscolor, lensbrand, lensnote,
       lensdurationunit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `, [
      provClaimNo,
      visionPrescriptionId,
      faker.date.recent({ days: 30 }),
      careTeamSequence,
      this.truncate(faker.helpers.arrayElement(['lens', 'contact']), 50),
      this.truncate(faker.helpers.arrayElement(['right', 'left']), 20),
      parseFloat(faker.finance.amount({ min: -10, max: 10, dec: 2 })),
      parseFloat(faker.finance.amount({ min: -5, max: 5, dec: 2 })),
      parseInt(faker.finance.amount({ min: 0, max: 180, dec: 0 })),
      Math.random() < 0.3 ? parseFloat(faker.finance.amount({ min: 0, max: 5, dec: 2 })) : null,
      Math.random() < 0.3 ? this.truncate(faker.helpers.arrayElement(['up', 'down', 'in', 'out']), 20) : null,
      Math.random() < 0.3 ? parseFloat(faker.finance.amount({ min: 1, max: 3, dec: 2 })) : null,
      parseFloat(faker.finance.amount({ min: -10, max: 10, dec: 2 })),
      parseFloat(faker.finance.amount({ min: 8, max: 10, dec: 2 })),
      parseFloat(faker.finance.amount({ min: 13, max: 15, dec: 2 })),
      parseInt(faker.finance.amount({ min: 1, max: 12, dec: 0 })),
      Math.random() < 0.3 ? this.truncate(faker.color.human(), 50) : null,
      this.truncate(faker.company.name(), 100),
      Math.random() < 0.3 ? this.truncate(faker.lorem.sentence(), 250) : null,
      this.truncate('month', 20)
    ]);
  }

  private async createPregnancyDetails(client: IDbClient, visitId: string): Promise<void> {
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_pregnancy_details 
      (visitID, start_date)
      VALUES ($1, $2)
    `, [visitId, faker.date.recent({ days: 120 })]);
  }

  private async createClaimItemMedication(client: IDbClient, visitId: string, itemSeq: number): Promise<void> {
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimitem_medication 
      (visitID, item_sequenceno, medicine_code, medicine_display_name, ingredient,
       strength_value, strength_unit, day_supply, refills, receiver_healthid,
       category, reasonformedicine, handover_date_time, packaging_code,
       packaging_display_name, dispense_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      visitId,
      itemSeq,
      this.truncate(faker.string.numeric(8), 70),
      this.truncate(faker.commerce.productName(), 256),
      this.truncate(faker.commerce.productMaterial(), 256),
      this.truncate(faker.string.numeric(2) + 'mg', 100),
      'mg',
      faker.number.int({ min: 1, max: 30 }),
      faker.number.int({ min: 0, max: 5 }),
      this.truncate(faker.string.numeric(10), 70),
      this.truncate(faker.helpers.arrayElement(['community', 'discharge']), 50),
      this.truncate(faker.lorem.sentence(), 256),
      faker.date.recent({ days: 1 }),
      this.truncate(faker.string.alphanumeric(5), 50),
      this.truncate(faker.commerce.productAdjective() + ' Pack', 256),
      this.truncate(faker.helpers.arrayElement(['initial', 'refill']), 50)
    ]);
  }

  private async createClaimItemDosage(client: IDbClient, visitId: string, itemSeq: number): Promise<void> {
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimitem_dosage 
      (visitID, item_sequenceno, form_code, form_display_name, duration_unit,
       duration_value, period_start, period_end, instruction, route, as_needed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      visitId,
      itemSeq,
      this.truncate(faker.string.alphanumeric(5), 50),
      this.truncate(faker.commerce.productAdjective() + ' Tablet', 256),
      this.truncate(faker.helpers.arrayElement(['day', 'week']), 20),
      faker.number.float({ min: 1, max: 14, fractionDigits: 1 }),
      faker.date.recent({ days: 1 }),
      faker.date.soon({ days: 7 }),
      this.truncate('Take 1 tablet daily with food', 1000),
      this.truncate(faker.helpers.arrayElement(['oral', 'topical', 'intravenous']), 100),
      faker.helpers.arrayElement([0, 1])
    ]);
  }

  private async createClaimItemProcedure(client: IDbClient, visitId: string, itemSeq: number): Promise<void> {
    await client.query(`
      INSERT INTO ${this.schemaPrefix}nphies_claimitem_procedure 
      (visitID, item_sequenceno, procedure_code, procedure_description,
       modality_code, modality_description, bodysite_code, bodysite_description,
       order_identifier)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      visitId,
      itemSeq,
      this.truncate(faker.string.numeric(5), 70),
      this.truncate(faker.commerce.productName() + ' Procedure', 256),
      this.truncate(faker.string.alphanumeric(3).toUpperCase(), 50),
      this.truncate(faker.commerce.productAdjective(), 256),
      this.truncate(faker.string.numeric(3), 50),
      this.truncate(faker.location.city(), 256),
      this.truncate(faker.string.alphanumeric(10).toUpperCase(), 100)
    ]);
  }

  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.mssqlPool) {
      await this.mssqlPool.close();
    }
  }
}
