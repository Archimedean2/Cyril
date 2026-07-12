import { AppShell } from './components/layout/AppShell.tsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary.tsx';

function App() {
  return (
    <ErrorBoundary paneName="app">
      <AppShell />
    </ErrorBoundary>
  );
}

export default App;
