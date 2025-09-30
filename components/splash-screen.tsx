import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
}

const languages = [
  { id: 'en', name: 'English', nativeName: 'English' },
];

export default function CustomSplashScreen({ onFinish }: CustomSplashScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('Language');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);

  const handleLanguageSelect = (language: typeof languages[0]) => {
    setSelectedLanguage(language.name);
    setIsLanguageSelected(true);
    setShowLanguageModal(false);
    
    // Small delay before transitioning to main app
    setTimeout(() => {
      onFinish();
    }, 500);
  };

  const openLanguageModal = () => {
    setShowLanguageModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Title Section */}
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/images/saaya-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          {/* Saaya Title with decorative lines */}

          
          <Text style={styles.subtitle}>by geokits</Text>
        </View>

        {/* Language Selector */}
        <TouchableOpacity style={styles.languageSelector} onPress={openLanguageModal}>
          <Text style={styles.languageText}>{selectedLanguage}</Text>
          <Text style={styles.chevron}>⌄</Text>
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => handleLanguageSelect(item)}
                >
                  <Text style={styles.languageOptionText}>{item.name}</Text>
                  <Text style={styles.languageNativeText}>{item.nativeName}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#2B2B2B',
    marginHorizontal: 16,
    letterSpacing: 0.5,
  },
  decorativeLine: {
    width: 40,
    height: 3,
    backgroundColor: '#D4A574',
    borderRadius: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8A8A',
    fontWeight: '400',
    letterSpacing: 0.3,
    textAlign: "right",
    alignSelf: "flex-end",
    marginRight:60
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    backgroundColor: '#ffffff',
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  languageText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  chevron: {
    fontSize: 14,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: width * 0.8,
    maxHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2B2B2B',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#2B2B2B',
    fontWeight: '500',
  },
  languageNativeText: {
    fontSize: 14,
    color: '#8A8A8A',
    fontStyle: 'italic',
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});
