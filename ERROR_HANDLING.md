# Error Handling System

This document describes the error handling system implemented in the Premier Squares webapp.

## Overview

The application uses a multi-layered error handling approach:

1. **React Error Boundaries** - Catch JavaScript errors in component trees
2. **Async Error Handling** - Handle API and network errors gracefully
3. **User-Friendly Messages** - Provide clear feedback to users

## Components

### ErrorBoundary Component

Located at `src/components/ErrorBoundary.js`

- Catches JavaScript errors anywhere in the component tree
- Displays a user-friendly fallback UI
- Provides retry and navigation options
- Shows detailed error information in development mode

### Error Handler Utilities

Located at `src/utils/errorHandler.js`

- `categorizeError()` - Categorizes errors by type (network, validation, etc.)
- `getErrorMessage()` - Returns user-friendly error messages
- `handleAsyncOperation()` - Wraps async operations with error handling
- `createRetryableOperation()` - Adds retry logic to operations
- `safeExecute()` - Safely executes operations that might throw

## Usage

### Basic Error Boundary

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Async Error Handling

```jsx
import { handleAsyncOperation, getErrorMessage } from '../utils/errorHandler';

const handleSubmit = async () => {
  try {
    await handleAsyncOperation(async () => {
      // Your async operation here
      const result = await apiCall();
      return result;
    });
  } catch (error) {
    setError(getErrorMessage(error));
  }
};
```

### API Service Integration

The API service (`src/services/apiService.js`) automatically uses error handling:

```jsx
// All API calls are wrapped with error handling
const contest = await contestAPI.getContest(contestId);
```

## Error Types

- **NETWORK** - Connection issues, timeouts
- **VALIDATION** - Invalid input data
- **AUTH** - Authentication/authorization issues
- **NOT_FOUND** - Resource not found (404)
- **SERVER** - Server-side errors (500, 502, etc.)
- **UNKNOWN** - Unclassified errors

## Testing

Use the `TestErrorBoundary` component to verify error boundary functionality:

```jsx
import TestErrorBoundary from './components/TestErrorBoundary';

// This will trigger the error boundary
<TestErrorBoundary shouldThrow={true} />
```

## Production Considerations

- Error boundaries prevent the entire app from crashing
- User-friendly messages improve user experience
- Development mode shows detailed error information
- Production mode hides technical details for security

## Best Practices

1. Wrap major components with ErrorBoundary
2. Use handleAsyncOperation for all API calls
3. Provide specific error messages for different scenarios
4. Log errors in development, hide in production
5. Always provide fallback UI for error states
