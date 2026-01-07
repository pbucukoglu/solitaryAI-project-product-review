import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { ThemeContext } from './context/ThemeContext';
import { createTheme } from './components/theme';

import ProductListScreen from './screens/ProductListScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import AddReviewScreen from './screens/AddReviewScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const appTheme = createTheme(colorScheme);
  const navTheme = colorScheme === 'dark'
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: appTheme.colors.background,
          card: appTheme.colors.surface,
          text: appTheme.colors.text,
          border: appTheme.colors.border,
          primary: appTheme.colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: appTheme.colors.background,
          card: appTheme.colors.surface,
          text: appTheme.colors.text,
          border: appTheme.colors.border,
          primary: appTheme.colors.primary,
        },
      };

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={{ theme: appTheme }}>
        <NavigationContainer theme={navTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack.Navigator
          initialRouteName="ProductList"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#6200ee',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="ProductList" 
            component={ProductListScreen}
            options={{ title: 'Products' }}
          />
          <Stack.Screen 
            name="ProductDetail" 
            component={ProductDetailScreen}
            options={{ title: 'Product Details' }}
          />
          <Stack.Screen 
            name="AddReview" 
            component={AddReviewScreen}
            options={{ title: 'Add Review' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Stack.Navigator>
        </NavigationContainer>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}


