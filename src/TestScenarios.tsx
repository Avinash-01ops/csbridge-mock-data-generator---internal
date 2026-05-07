import React, { useMemo, useState } from 'react';
import { ProviderType } from './types';

interface TestScenario {
  id: string;
  description: string;
}

interface TestResult {
  success: boolean;
  message: string;
  eventId?: string;
}

// Utility function to generate test scenarios in standardized format
const createTestScenarios = (eventCode: string, descriptions: string[]): TestScenario[] => {
  return descriptions.map((desc, index) => ({
    id: `${eventCode.toLowerCase()}-${index + 1}`,
    description: desc
  }));
};

const EVENT_GROUPS: Record<string, TestScenario[]> = {
  A01: [
    // Section 1: Event Detection and ENCOUNTERCLASS
    { id: 'a01-1', description: 'Verify A01 event is generated for ENCOUNTERCLASS IMP (Inpatient)' },
    { id: 'a01-2', description: 'Verify A01 event is generated for ENCOUNTERCLASS SS (Same-day surgery)' },
    { id: 'a01-3', description: 'Verify non-A01 event is ignored for unsupported ENCOUNTERCLASS values' },
    { id: 'a01-4', description: 'Verify A01 event detection with lowercase "imp" value' },
    { id: 'a01-5', description: 'Verify A01 event detection with lowercase "ss" value' },
    { id: 'a01-6', description: 'Verify A01 event detection trims leading spaces from ENCOUNTERCLASS' },
    { id: 'a01-7', description: 'Verify A01 event detection trims trailing spaces from ENCOUNTERCLASS' },
    { id: 'a01-8', description: 'Verify duplicate encounter records are handled correctly' },
    { id: 'a01-9', description: 'Verify blank ENCOUNTERCLASS does not generate A01 event' },
    { id: 'a01-10', description: 'Verify null ENCOUNTERCLASS does not generate A01 event' },
    { id: 'a01-11', description: 'Verify unsupported ENCOUNTERCLASS values are rejected' },
    { id: 'a01-12', description: 'Verify corrected ENCOUNTERCLASS triggers A01 after update' },
    { id: 'a01-13', description: 'Verify multiple A01 events are processed sequentially' },
    { id: 'a01-14', description: 'Verify same-day surgery encounter triggers A01 event' },
    { id: 'a01-15', description: 'Verify inpatient encounter triggers A01 event' },
    { id: 'a01-16', description: 'Verify outpatient encounter does not trigger A01 event' },
    { id: 'a01-17', description: 'Verify transfer-related values do not trigger A01 event' },
    // Section 2: PROVCLAIMNO Handling
    { id: 'a01-18', description: 'Verify PROVCLAIMNO is read from source table correctly' },
    { id: 'a01-19', description: 'Verify empty PROVCLAIMNO prevents submission' },
    { id: 'a01-20', description: 'Verify null PROVCLAIMNO prevents submission' },
    { id: 'a01-21', description: 'Verify special characters in PROVCLAIMNO are handled' },
    { id: 'a01-22', description: 'Verify very long PROVCLAIMNO is handled correctly' },
    { id: 'a01-23', description: 'Verify numeric-only PROVCLAIMNO is processed' },
    { id: 'a01-24', description: 'Verify alphanumeric PROVCLAIMNO is processed' },
    // Section 3: HL7 Message Structure
    { id: 'a01-25', description: 'Verify HL7 message contains MSH segment' },
    { id: 'a01-26', description: 'Verify HL7 message contains EVN segment' },
    { id: 'a01-27', description: 'Verify HL7 message contains PID segment' },
    { id: 'a01-28', description: 'Verify HL7 message contains PV1 segment' },
    { id: 'a01-29', description: 'Verify HL7 message segment order is correct (MSH, EVN, PID, PV1)' },
    { id: 'a01-30', description: 'Verify HL7 message is not created when MSH segment is missing' },
    { id: 'a01-31', description: 'Verify HL7 message is not created when EVN segment is missing' },
    { id: 'a01-32', description: 'Verify HL7 message is not created when PID segment is missing' },
    { id: 'a01-33', description: 'Verify HL7 message is not created when PV1 segment is missing' },
    { id: 'a01-34', description: 'Verify empty MSH segment prevents submission' },
    { id: 'a01-35', description: 'Verify empty EVN segment prevents submission' },
    { id: 'a01-36', description: 'Verify empty PID segment prevents submission' },
    { id: 'a01-37', description: 'Verify empty PV1 segment prevents submission' },
    { id: 'a01-38', description: 'Verify HL7 message is marked ready after validation' },
    { id: 'a01-39', description: 'Verify invalid HL7 message is not marked ready' },
    { id: 'a01-40', description: 'Verify HL7 message header contains correct message type (ADT^A01)' },
    { id: 'a01-41', description: 'Verify EVN segment contains correct event type (A01)' },
    { id: 'a01-42', description: 'Verify PV1 contains correct patient class (I for inpatient)' },
    { id: 'a01-43', description: 'Verify HL7 message uses correct field separator (|)' },
    { id: 'a01-44', description: 'Verify HL7 message handles null optional fields gracefully' },
    { id: 'a01-45', description: 'Verify HL7 message handles empty optional fields gracefully' },
    { id: 'a01-46', description: 'Verify invalid HL7 structure blocks submission' },
    { id: 'a01-47', description: 'Verify mandatory segments are not duplicated' },
    { id: 'a01-48', description: 'Verify HL7 message is not malformed with empty optional segments' },
    { id: 'a01-49', description: 'Verify HL7 message creation with mixed valid and invalid optional data' },
    { id: 'a01-50', description: 'Verify unsupported symbols in mandatory fields are handled' },
    { id: 'a01-51', description: 'Verify ready-for-submission status is not assigned before validation' },
    // Section 4: Optional Segments
    { id: 'a01-52', description: 'Verify optional PD1 segment is added when patient additional data exists' },
    { id: 'a01-53', description: 'Verify optional PV2 segment is added when visit data exists' },
    { id: 'a01-54', description: 'Verify optional AL1 segment is added when allergy data exists' },
    { id: 'a01-55', description: 'Verify optional DG1 segment is added when diagnosis data exists' },
    { id: 'a01-56', description: 'Verify optional PR1 segment is added when procedure data exists' },
    { id: 'a01-57', description: 'Verify HL7 message is generated without optional segments when no data exists' },
    { id: 'a01-58', description: 'Verify multiple allergy records generate multiple AL1 segments' },
    { id: 'a01-59', description: 'Verify multiple diagnosis records generate multiple DG1 segments' },
    { id: 'a01-60', description: 'Verify multiple procedures generate multiple PR1 segments' },
    { id: 'a01-61', description: 'Verify null allergy segment does not fail message generation' },
    { id: 'a01-62', description: 'Verify null diagnosis segment does not fail message generation' },
    { id: 'a01-63', description: 'Verify null procedure segment does not fail message generation' },
    { id: 'a01-64', description: 'Verify invalid allergy values do not break message generation' },
    { id: 'a01-65', description: 'Verify invalid diagnosis values do not break message generation' },
    { id: 'a01-66', description: 'Verify invalid procedure values do not break message generation' },
  ],
  A02: [
    { id: 'a02-1', description: 'Valid MSH' },
    { id: 'a02-2', description: 'PV1-2 present' },
    { id: 'a02-3', description: 'EVN-1 = A02' },
  ],
  A03: [
    { id: 'a03-1', description: 'Admission details' },
    { id: 'a03-2', description: 'Patient demographics' },
  ],
  A04: [
    { id: 'a04-1', description: 'Registration update' },
  ],
  A05: [
    { id: 'a05-1', description: 'Duplicate patient data' },
  ],
  A06: [
    { id: 'a06-1', description: 'Patient transfer' },
  ],
};

const TestScenarios: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [providerType, setProviderType] = useState<ProviderType>('default');

  const currentGroupScenarios = activeGroup ? EVENT_GROUPS[activeGroup] : [];
  const currentGroupIds = currentGroupScenarios.map(s => s.id);

  const handleSelectGroup = (eventCode: string) => {
    setActiveGroup(prev => (prev === eventCode ? null : eventCode));
  };

  const handleSelectAll = () => {
    setSelectedScenarios(prev => [...new Set([...prev, ...currentGroupIds])]);
  };

  const handleDeselectAll = () => {
    setSelectedScenarios(prev => prev.filter(id => !currentGroupIds.includes(id)));
  };

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const handleGenerate = async () => {
    if (selectedScenarios.length === 0) return;

    setIsGenerating(true);
    const newResults: Record<string, TestResult> = {};

    for (const scenarioId of selectedScenarios) {
      // TODO: In real implementation, call dataGenerator with specific config including providerType
      // const result = await window.dbApi.generateTestScenario({
      //   scenarioId,
      //   providerType,
      //   dbConfig: // from props or context
      // });

      // Determine if this is a test that should succeed or fail based on description
      const description = EVENT_GROUPS[activeGroup!].find(s => s.id === scenarioId)?.description || '';
      const shouldFail = description.includes('prevents submission') ||
                        description.includes('not created') ||
                        description.includes('rejected') ||
                        description.includes('ignored') ||
                        description.includes('blocks submission') ||
                        description.includes('does not trigger') ||
                        description.includes('not marked ready') ||
                        description.includes('not assigned before validation');

      if (!shouldFail) {
        // Mock successful generation
        newResults[scenarioId] = {
          success: true,
          message: 'Event generated and validated successfully',
          eventId: `EVT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        };
      } else {
        // Mock failed generation with appropriate error message
        let errorMessage = 'Event generation failed as expected for validation test';
        if (description.includes('empty') || description.includes('null')) {
          errorMessage = 'Validation failed: Required field is empty/null';
        } else if (description.includes('unsupported')) {
          errorMessage = 'Validation failed: Unsupported value detected';
        } else if (description.includes('invalid')) {
          errorMessage = 'Validation failed: Invalid data format';
        } else if (description.includes('not trigger')) {
          errorMessage = 'Event not generated: Conditions not met';
        }

        newResults[scenarioId] = {
          success: false,
          message: errorMessage
        };
      }

      // Small delay to simulate async operation
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTestResults(prev => ({ ...prev, ...newResults }));
    setIsGenerating(false);
  };

  const activeCount = currentGroupIds.filter(id => selectedScenarios.includes(id)).length;

  return (
    <div className="test-scenarios-section">
      <div className="event-tile-grid">
        {Object.entries(EVENT_GROUPS).map(([eventCode, scenarios]) => (
          <button
            key={eventCode}
            type="button"
            className={`event-tile ${activeGroup === eventCode ? 'active' : ''}`}
            onClick={() => handleSelectGroup(eventCode)}
          >
            <span className="event-tile-code">{eventCode}</span>
            <span className="event-tile-count">{scenarios.length} tests</span>
          </button>
        ))}
      </div>

      {activeGroup ? (
        <div className="test-group">
          <div className="test-group-header">
            <div>
              <div className="test-group-title">{activeGroup}</div>
              <div className="test-group-meta">{currentGroupScenarios.length} tests</div>
            </div>
            <button className="btn btn-ghost btn-small" onClick={() => setActiveGroup(null)}>
              Close
            </button>
          </div>

          <div className="test-group-controls">
            <div className="form-group" style={{ marginBottom: '1rem', marginRight: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Provider Type:</label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as ProviderType)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem' }}
              >
                <option value="default">DEFAULT (with nphies_events table)</option>
                <option value="default_auto">DEFAULT_AUTO (timestamp-based, no events table)</option>
                <option value="enhanced">ENHANCED (with uhr_event table)</option>
                <option value="enhanced_auto">ENHANCED_AUTO (timestamp-based, no events table)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button className="btn btn-primary btn-small" onClick={handleSelectAll}>
                Select all
              </button>
              <button className="btn btn-primary btn-small" onClick={handleDeselectAll}>
                Deselect
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={handleGenerate}
                disabled={activeCount === 0 || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
              <button
                className="btn btn-ghost btn-small"
                onClick={() => setTestResults({})}
                disabled={Object.keys(testResults).length === 0}
              >
                Clear Results
              </button>
            </div>
          </div>

          <div className="test-group-content">
            {currentGroupScenarios.map((scenario, index) => {
              const result = testResults[scenario.id];
              return (
                <label className="test-row" key={scenario.id}>
                  <span className="test-row-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedScenarios.includes(scenario.id)}
                      onChange={() => toggleScenario(scenario.id)}
                    />
                  </span>
                  <span className="test-row-number">{index + 1}</span>
                  <span className="test-row-name">{scenario.description}</span>
                  <span className="test-row-result">
                    {result ? (
                      result.success ? (
                        <span className="result-success">
                          ✅ {result.eventId ? `Event ID: ${result.eventId}` : 'Generated'}
                        </span>
                      ) : (
                        <span className="result-error">
                          ❌ {result.message}
                        </span>
                      )
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="test-placeholder">Select an event tile to view tests.</div>
      )}
    </div>
  );
};

export default TestScenarios;
