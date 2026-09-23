import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@app/providers/ErrorBoundary';
import { ThemeProvider } from '@presentation/theme/ThemeContext';
import { RootNavigator } from '@app/navigation/RootNavigator';
import { useLocationEventPipeline } from '@application/useCases/useLocationEventPipeline';
import { recordError } from '@infrastructure/logging/CrashReporter';
import { track } from '@infrastructure/analytics/Analytics';

function App() {
  useLocationEventPipeline();

  useEffect(() => {
    track({ name: 'app_opened' });
  }, []);

  return (
    <ErrorBoundary onError={(error, info) => recordError(error, { componentStack: info.componentStack })}>
      <SafeAreaProvider>
        <ThemeProvider preference="system">
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
