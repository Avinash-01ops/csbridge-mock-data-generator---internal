import React, { useState } from 'react';

// Define a test scenario type
interface TestScenario {
  id: string;
  description: string;
}

const SCENARIOS: TestScenario[] = [
  { id: 'a01-msh-missing', description: 'Verify A01 message is rejected when MSH segment is missing' },
  { id: 'a01-evn-missing', description: 'Verify A01 message is rejected when EVN segment is missing' },
  { id: 'a01-pid-missing', description: 'Verify A01 message is rejected when PID segment is missing' },
  { id: 'a01-pv1-missing', description: 'Verify A01 message is rejected when PV1 segment is missing' },
  { id: 'a01-pid3-empty', description: 'Verify A01 message is rejected when PID-3 (Patient ID) is empty' },
  { id: 'a01-pv1-admit-empty', description: 'Verify A01 message is rejected when PV1 admit date is empty' },
  { id: 'a01-evn1-a01', description: "Verify A01 message contains EVN-1 = 'A01' and not any other event code" },
];

const TestScenarios: React.FC = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    // Placeholder: In a real implementation this would trigger test generation.
    console.log('Generating tests for:', selected);
    alert(`Generating ${selected.length} test(s). Check console for details.`);
  };

  return (
    <div className="card">
      <div className="section-header">
        <h2>🧪 A01 Test Scenarios</h2>
      </div>
      <div className="section-content">
        <div className="checkbox-grid">
          {SCENARIOS.map(s => (
            <label key={s.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={() => toggle(s.id)}
              />
              <span>{s.description}</span>
            </label>
          ))}
        </div>
        <div className="button-group" style={{ marginTop: '1rem' }}>
          <button
            className="btn btn-primary btn-large"
            onClick={handleGenerate}
            disabled={selected.length === 0}
          >
            Generate Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestScenarios;
