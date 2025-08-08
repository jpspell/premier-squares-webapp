import React from 'react';

// Test component to verify error boundary functionality
function TestErrorBoundary({ shouldThrow = false }) {
  if (shouldThrow) {
    throw new Error('This is a test error to verify error boundary functionality');
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Error Boundary Test</h3>
      <p>This component is working correctly.</p>
      <p>If you see this, the error boundary is not catching errors.</p>
    </div>
  );
}

export default TestErrorBoundary;
