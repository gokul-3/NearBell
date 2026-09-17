import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@presentation/components/Screen';
import { Card } from '@presentation/components/Card';
import { PrimaryButton } from '@presentation/components/PrimaryButton';
import { SecondaryButton } from '@presentation/components/SecondaryButton';
import { useTheme } from '@presentation/theme/ThemeContext';
import { useTripStore } from '@state/tripStore';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const activeTrip = useTripStore((state) => state.activeTrip);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          style={[
            styles.hero,
            { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeDisplay },
          ]}
        >
          Where are you going?
        </Text>

        <View style={styles.ctaGroup}>
          <PrimaryButton label="Set destination" onPress={() => navigation.navigate('DestinationPicker')} />
        </View>

        {activeTrip ? (
          <Card style={styles.card}>
            <Text
              accessibilityRole="header"
              style={[
                styles.cardLabel,
                { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption },
              ]}
            >
              Active trip
            </Text>
            <Text
              style={[
                styles.destinationName,
                { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeTitle },
              ]}
            >
              {activeTrip.destination.name}
            </Text>
            <View style={styles.cardAction}>
              <SecondaryButton label="View trip" onPress={() => navigation.navigate('ActiveTrip')} />
            </View>
          </Card>
        ) : null}

        <View style={styles.linksRow}>
          <SecondaryButton label="History" onPress={() => navigation.navigate('History')} />
          <SecondaryButton label="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    flexGrow: 1,
  },
  hero: {
    fontWeight: '700',
    marginTop: 8,
  },
  ctaGroup: {
    marginTop: 24,
  },
  card: {
    marginTop: 24,
  },
  cardLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  destinationName: {
    fontWeight: '700',
  },
  cardAction: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
});
