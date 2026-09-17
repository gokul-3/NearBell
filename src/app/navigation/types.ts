import type { Destination } from '@domain/location/destination';

export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  DestinationPicker: undefined;
  TripSetup: { destination: Destination };
  ActiveTrip: undefined;
  Alarm: undefined;
  History: undefined;
  Settings: undefined;
  PermissionHelp: undefined;
};
