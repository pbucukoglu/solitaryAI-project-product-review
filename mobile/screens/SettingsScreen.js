import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { demoService } from '../services/demoService';
import { createTheme } from '../components/theme';

const SettingsScreen = ({ navigation }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [tempBaseUrl, setTempBaseUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const colorScheme = 'light'; // You can make this dynamic
  const theme = createTheme(colorScheme);

  useEffect(() => {
    loadBaseUrl();
  }, []);

  const loadBaseUrl = async () => {
    const url = await demoService.getBaseUrl();
    setBaseUrl(url);
    setTempBaseUrl(url);
  };

  const testConnection = async () => {
    if (!tempBaseUrl.trim()) {
      Alert.alert('Error', 'Please enter a base URL');
      return;
    }

    setTesting(true);
    setConnectionStatus(null);

    try {
      const isConnected = await demoService.testConnection(tempBaseUrl.trim());
      setConnectionStatus(isConnected ? 'success' : 'failed');
      
      if (isConnected) {
        Alert.alert('Success', 'Connection successful! Base URL saved.');
        await demoService.setBaseUrl(tempBaseUrl.trim());
        setBaseUrl(tempBaseUrl.trim());
      } else {
        Alert.alert('Failed', 'Connection failed. Please check the URL and try again.');
      }
    } catch (error) {
      setConnectionStatus('failed');
      Alert.alert('Error', 'Connection test failed. Please check the URL.');
    } finally {
      setTesting(false);
    }
  };

  const saveBaseUrl = async () => {
    if (!tempBaseUrl.trim()) {
      Alert.alert('Error', 'Please enter a base URL');
      return;
    }

    await demoService.setBaseUrl(tempBaseUrl.trim());
    setBaseUrl(tempBaseUrl.trim());
    Alert.alert('Success', 'Base URL saved successfully!');
  };

  const resetToDefault = async () => {
    const defaultUrl = 'https://solitaryai-project-product-review-production.up.railway.app';
    await demoService.setBaseUrl(defaultUrl);
    setBaseUrl(defaultUrl);
    setTempBaseUrl(defaultUrl);
    Alert.alert('Reset', 'Base URL reset to default.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            API Configuration
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Base URL
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                },
              ]}
              value={tempBaseUrl}
              onChangeText={setTempBaseUrl}
              placeholder="http://localhost:8080"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
              Current: {baseUrl}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.testButton,
                {
                  backgroundColor: connectionStatus === 'success' 
                    ? theme.colors.success 
                    : connectionStatus === 'failed'
                    ? theme.colors.danger
                    : theme.colors.primary,
                },
              ]}
              onPress={testConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons 
                    name={connectionStatus === 'success' ? 'checkmark' : connectionStatus === 'failed' ? 'close' : 'wifi'} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.buttonText}>
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={saveBaseUrl}
            >
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.buttonText}>Save URL</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
            onPress={resetToDefault}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.resetButtonText, { color: theme.colors.textSecondary }]}>
              Reset to Default
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            About
          </Text>
          <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>
            Product Review App v1.0
          </Text>
          <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>
            This app automatically falls back to demo mode when the backend is unavailable.
          </Text>
          <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>
            Configure your backend URL above and test the connection.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  helper: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default SettingsScreen;
