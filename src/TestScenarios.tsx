import React, { useMemo, useState } from 'react';

interface TestScenario {
  id: string;
  description: string;
}

const EVENT_GROUPS: Record<string, TestScenario[]> = {
  A01: [
    { id: 'a01-1', description: 'MSH missing' },
    { id: 'a01-2', description: 'EVN missing' },
    { id: 'a01-3', description: 'PID missing' },
    { id: 'a01-4', description: 'PV1 missing' },
    { id: 'a01-5', description: 'EVN-1 = A01' },
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

  const handleGenerate = () => {
    const count = currentGroupIds.filter(id => selectedScenarios.includes(id)).length;
    console.log('Generate test scenarios:', selectedScenarios);
    alert(`Generating ${count} selected scenario(s).`);
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
            <button className="btn btn-primary btn-small" onClick={handleSelectAll}>
              Select all
            </button>
            <button className="btn btn-primary btn-small" onClick={handleDeselectAll}>
              Deselect
            </button>
            <button
              className="btn btn-primary btn-small"
              onClick={handleGenerate}
              disabled={activeCount === 0}
            >
              Generate
            </button>
          </div>

          <div className="test-group-content">
            {currentGroupScenarios.map((scenario, index) => (
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
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="test-placeholder">Select an event tile to view tests.</div>
      )}
    </div>
  );
};

export default TestScenarios;
