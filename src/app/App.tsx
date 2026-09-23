import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@app/providers/ErrorBoundary';
import { ThemeProvider } from '@presentation/theme/ThemeContext';
import { RootNavigator } from '@app/navigation/RootNavigator';
import { useLocationEventPipeline } from '@application/useCases/useLocationEventPipeline';

function App() {
  useLocationEventPipeline();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider preference="system">
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
