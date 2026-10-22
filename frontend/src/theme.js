import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6C4DF6',
    primaryContainer: '#E9E4FF',
    onPrimaryContainer: '#2A1B7A',
    secondary: '#00B8A9',
    background: '#F6F5FB',
    surface: '#FFFFFF',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
      level2: '#FFFFFF',
    },
  },
};
