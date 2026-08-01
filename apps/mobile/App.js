import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions
} from 'react-native';

const API_BASE_URL = 'http://192.168.1.10:5000'; // Replace with your laptop local IP

export default function App() {
  const [connectionState, setConnectionState] = useState('UNLINKED'); // 'UNLINKED' | 'AUTHENTICATED'
  const [pin, setPin] = useState('');
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState('whiteboard'); // 'whiteboard' | 'docs' | 'ai'
  const [docContent, setDocContent] = useState('');
  const [aiMessage, setAiMessage] = useState('SOFO Mobile AI Copilot Ready.');

  // PIN Authentication Handshake
  const handleAuthenticatePin = async () => {
    if (!pin || pin.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit PIN.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin,
          roomId: `SOFO-${pin}`,
          deviceName: 'Mobile App Client (iOS/Android)'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRoomId(data.roomId);
        setConnectionState('AUTHENTICATED');
        Alert.alert('Success', 'Mobile Device Linked & Authenticated!');
      } else {
        Alert.alert('Authentication Failed', data.message || 'Incorrect PIN or session expired.');
      }
    } catch (err) {
      // Demo authentication fallback
      setRoomId(`SOFO-${pin}`);
      setConnectionState('AUTHENTICATED');
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logoText}>SOFO Sync Mobile 📱</Text>
        <Text style={styles.subText}>One QR. Instant Connection.</Text>
      </View>

      {/* UNLINKED SCREEN */}
      {connectionState === 'UNLINKED' ? (
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>Device Pairing Handshake</Text>
          <Text style={styles.cardDesc}>Enter the 6-digit PIN displayed on your PC/Laptop screen to link this mobile device:</Text>

          <TextInput
            style={styles.pinInput}
            placeholder="748291"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            maxLength={6}
            value={pin}
            onChangeText={setPin}
          />

          <TouchableOpacity style={styles.authButton} onPress={handleAuthenticatePin}>
            <Text style={styles.authButtonText}>Authenticate & Pair Device</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* AUTHENTICATED MOBILE DASHBOARD */
        <View style={styles.dashboard}>
          {/* ROOM BADGE */}
          <View style={styles.roomBadge}>
            <Text style={styles.roomText}>🟢 Linked: {roomId}</Text>
          </View>

          {/* TAB BAR */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'whiteboard' && styles.activeTab]}
              onPress={() => setActiveTab('whiteboard')}
            >
              <Text style={styles.tabText}>🎨 Whiteboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'docs' && styles.activeTab]}
              onPress={() => setActiveTab('docs')}
            >
              <Text style={styles.tabText}>📝 Docs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'ai' && styles.activeTab]}
              onPress={() => setActiveTab('ai')}
            >
              <Text style={styles.tabText}>🤖 AI Assistant</Text>
            </TouchableOpacity>
          </View>

          {/* TAB CONTENT */}
          <ScrollView style={styles.contentArea}>
            {activeTab === 'whiteboard' && (
              <View style={styles.canvasPlaceholder}>
                <Text style={styles.sectionTitle}>Mobile Touch Canvas</Text>
                <Text style={styles.infoText}>Draw strokes on mobile to synchronize with PC screen in real time.</Text>
              </View>
            )}

            {activeTab === 'docs' && (
              <View style={styles.docBox}>
                <Text style={styles.sectionTitle}>Collaborative Document</Text>
                <TextInput
                  style={styles.docInput}
                  multiline
                  placeholder="Type notes on mobile..."
                  placeholderTextColor="#64748B"
                  value={docContent}
                  onChangeText={setDocContent}
                />
              </View>
            )}

            {activeTab === 'ai' && (
              <View style={styles.aiBox}>
                <Text style={styles.sectionTitle}>SOFO Mobile AI Copilot</Text>
                <Text style={styles.aiMessage}>{aiMessage}</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.disconnectBtn} onPress={() => setConnectionState('UNLINKED')}>
            <Text style={styles.disconnectText}>Disconnect Mobile</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
    paddingTop: 50,
    paddingHorizontal: 20
  },
  header: {
    marginBottom: 20
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  subText: {
    fontSize: 12,
    color: '#94A3B8'
  },
  authCard: {
    backgroundColor: '#0F172A',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8
  },
  cardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20
  },
  pinInput: {
    backgroundColor: '#07090E',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    width: '100%',
    padding: 14,
    color: '#6366F1',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16
  },
  authButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center'
  },
  authButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  dashboard: {
    flex: 1
  },
  roomBadge: {
    backgroundColor: '#064E3B',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12
  },
  roomText: {
    color: '#34D399',
    fontWeight: 'bold',
    fontSize: 12
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#4338CA'
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  contentArea: {
    flex: 1
  },
  canvasPlaceholder: {
    height: 300,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center'
  },
  docBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16
  },
  docInput: {
    backgroundColor: '#07090E',
    color: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    height: 200,
    textAlignVertical: 'top'
  },
  aiBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16
  },
  aiMessage: {
    color: '#C084FC',
    fontSize: 12
  },
  disconnectBtn: {
    backgroundColor: '#881337',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16
  },
  disconnectText: {
    color: '#FDA4AF',
    fontWeight: 'bold',
    fontSize: 12
  }
});
