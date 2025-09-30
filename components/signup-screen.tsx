import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface SignupScreenProps {
  onSwitchToLogin: () => void;
  onSignup: () => void;
}

interface District {
  id: string;
  name: string;
}

interface Province {
  id: string;
  name: string;
  districts: District[];
}

// Hardcoded Pakistani provinces and districts
const PAKISTAN_PROVINCES: Province[] = [
  {
    id: 'punjab',
    name: 'Punjab',
    districts: [
      { id: 'attock', name: 'Attock' },
      { id: 'bahawalnagar', name: 'Bahawalnagar' },
      { id: 'bahawalpur', name: 'Bahawalpur' },
      { id: 'bhakkar', name: 'Bhakkar' },
      { id: 'chakwal', name: 'Chakwal' },
      { id: 'chiniot', name: 'Chiniot' },
      { id: 'dera-ghazi-khan', name: 'Dera Ghazi Khan' },
      { id: 'faisalabad', name: 'Faisalabad' },
      { id: 'gujranwala', name: 'Gujranwala' },
      { id: 'gujrat', name: 'Gujrat' },
      { id: 'hafizabad', name: 'Hafizabad' },
      { id: 'jhang', name: 'Jhang' },
      { id: 'jhelum', name: 'Jhelum' },
      { id: 'kasur', name: 'Kasur' },
      { id: 'khanewal', name: 'Khanewal' },
      { id: 'khushab', name: 'Khushab' },
      { id: 'lahore', name: 'Lahore' },
      { id: 'layyah', name: 'Layyah' },
      { id: 'lodhran', name: 'Lodhran' },
      { id: 'mandi-bahauddin', name: 'Mandi Bahauddin' },
      { id: 'mianwali', name: 'Mianwali' },
      { id: 'multan', name: 'Multan' },
      { id: 'muzaffargarh', name: 'Muzaffargarh' },
      { id: 'nankana-sahib', name: 'Nankana Sahib' },
      { id: 'narowal', name: 'Narowal' },
      { id: 'okara', name: 'Okara' },
      { id: 'pakpattan', name: 'Pakpattan' },
      { id: 'rahim-yar-khan', name: 'Rahim Yar Khan' },
      { id: 'rajanpur', name: 'Rajanpur' },
      { id: 'rawalpindi', name: 'Rawalpindi' },
      { id: 'sahiwal', name: 'Sahiwal' },
      { id: 'sargodha', name: 'Sargodha' },
      { id: 'sheikhupura', name: 'Sheikhupura' },
      { id: 'sialkot', name: 'Sialkot' },
      { id: 'toba-tek-singh', name: 'Toba Tek Singh' },
      { id: 'vehari', name: 'Vehari' },
      { id: 'wazirabad', name: 'Wazirabad' },
      { id: 'murree', name: 'Murree' },
      { id: 'talagang', name: 'Talagang' },
      { id: 'kot-addu', name: 'Kot Addu' },
      { id: 'mailsi', name: 'Mailsi' },
    ]
  },
  {
    id: 'sindh',
    name: 'Sindh',
    districts: [
      { id: 'badin', name: 'Badin' },
      { id: 'dadu', name: 'Dadu' },
      { id: 'ghotki', name: 'Ghotki' },
      { id: 'hyderabad', name: 'Hyderabad' },
      { id: 'jacobabad', name: 'Jacobabad' },
      { id: 'jamshoro', name: 'Jamshoro' },
      { id: 'karachi-central', name: 'Karachi Central' },
      { id: 'karachi-east', name: 'Karachi East' },
      { id: 'karachi-south', name: 'Karachi South' },
      { id: 'karachi-west', name: 'Karachi West' },
      { id: 'kashmore', name: 'Kashmore' },
      { id: 'keamari', name: 'Keamari' },
      { id: 'khairpur', name: 'Khairpur' },
      { id: 'korangi', name: 'Korangi' },
      { id: 'larkana', name: 'Larkana' },
      { id: 'malir', name: 'Malir' },
      { id: 'matiari', name: 'Matiari' },
      { id: 'mirpur-khas', name: 'Mirpur Khas' },
      { id: 'naushahro-firoze', name: 'Naushahro Firoze' },
      { id: 'qambar-shahdadkot', name: 'Qambar Shahdadkot' },
      { id: 'sanghar', name: 'Sanghar' },
      { id: 'shaheed-benazirabad', name: 'Shaheed Benazirabad' },
      { id: 'shikarpur', name: 'Shikarpur' },
      { id: 'sujawal', name: 'Sujawal' },
      { id: 'sukkur', name: 'Sukkur' },
      { id: 'tando-allahyar', name: 'Tando Allahyar' },
      { id: 'tando-muhammad-khan', name: 'Tando Muhammad Khan' },
      { id: 'tharparkar', name: 'Tharparkar' },
      { id: 'thatta', name: 'Thatta' },
      { id: 'umerkot', name: 'Umerkot' },
    ]
  },
  {
    id: 'kpk',
    name: 'Khyber Pakhtunkhwa',
    districts: [
      { id: 'abbottabad', name: 'Abbottabad' },
      { id: 'bajaur', name: 'Bajaur' },
      { id: 'bannu', name: 'Bannu' },
      { id: 'battagram', name: 'Battagram' },
      { id: 'buner', name: 'Buner' },
      { id: 'charsadda', name: 'Charsadda' },
      { id: 'chitral-lower', name: 'Chitral Lower' },
      { id: 'chitral-upper', name: 'Chitral Upper' },
      { id: 'dera-ismail-khan', name: 'Dera Ismail Khan' },
      { id: 'hangu', name: 'Hangu' },
      { id: 'haripur', name: 'Haripur' },
      { id: 'karak', name: 'Karak' },
      { id: 'khyber', name: 'Khyber' },
      { id: 'kohat', name: 'Kohat' },
      { id: 'kohistan-lower', name: 'Kohistan Lower' },
      { id: 'kohistan-upper', name: 'Kohistan Upper' },
      { id: 'kolai-palas', name: 'Kolai-Palas' },
      { id: 'kurram', name: 'Kurram' },
      { id: 'lakki-marwat', name: 'Lakki Marwat' },
      { id: 'malakand', name: 'Malakand' },
      { id: 'mansehra', name: 'Mansehra' },
      { id: 'mardan', name: 'Mardan' },
      { id: 'mohmand', name: 'Mohmand' },
      { id: 'north-waziristan', name: 'North Waziristan' },
      { id: 'nowshera', name: 'Nowshera' },
      { id: 'orakzai', name: 'Orakzai' },
      { id: 'peshawar', name: 'Peshawar' },
      { id: 'shangla', name: 'Shangla' },
      { id: 'south-waziristan', name: 'South Waziristan' },
      { id: 'swabi', name: 'Swabi' },
      { id: 'swat', name: 'Swat' },
      { id: 'tank', name: 'Tank' },
      { id: 'torghar', name: 'Torghar' },
      { id: 'waziristan', name: 'Waziristan' },
      { id: 'ziarat-kpk', name: 'Ziarat' },
    ]
  },
  {
    id: 'balochistan',
    name: 'Balochistan',
    districts: [
      { id: 'awaran', name: 'Awaran' },
      { id: 'barkhan', name: 'Barkhan' },
      { id: 'chagai', name: 'Chagai' },
      { id: 'chaman', name: 'Chaman' },
      { id: 'dera-bugti', name: 'Dera Bugti' },
      { id: 'duki', name: 'Duki' },
      { id: 'gwadar', name: 'Gwadar' },
      { id: 'harnai', name: 'Harnai' },
      { id: 'jafarabad', name: 'Jafarabad' },
      { id: 'jhal-magsi', name: 'Jhal Magsi' },
      { id: 'kalat', name: 'Kalat' },
      { id: 'kech-turbat', name: 'Kech (Turbat)' },
      { id: 'kharan', name: 'Kharan' },
      { id: 'khuzdar', name: 'Khuzdar' },
      { id: 'killa-abdullah', name: 'Killa Abdullah' },
      { id: 'killa-saifullah', name: 'Killa Saifullah' },
      { id: 'kohlu', name: 'Kohlu' },
      { id: 'lasbela', name: 'Lasbela' },
      { id: 'loralai', name: 'Loralai' },
      { id: 'mastung', name: 'Mastung' },
      { id: 'musakhel', name: 'Musakhel' },
      { id: 'nasirabad', name: 'Nasirabad' },
      { id: 'nushki', name: 'Nushki' },
      { id: 'panjgur', name: 'Panjgur' },
      { id: 'pishin', name: 'Pishin' },
      { id: 'quetta', name: 'Quetta' },
      { id: 'sherani', name: 'Sherani' },
      { id: 'sibi', name: 'Sibi' },
      { id: 'sohbatpur', name: 'Sohbatpur' },
      { id: 'washuk', name: 'Washuk' },
      { id: 'zhob', name: 'Zhob' },
      { id: 'ziarat-bal', name: 'Ziarat' },
      { id: 'lehri', name: 'Lehri' },
      { id: 'surab', name: 'Surab' },
      { id: 'jiwani', name: 'Jiwani' },
      { id: 'hub', name: 'Hub' },
    ]
  },
  {
    id: 'gb',
    name: 'Gilgit-Baltistan',
    districts: [
      { id: 'astore', name: 'Astore' },
      { id: 'diamer', name: 'Diamer' },
      { id: 'ghanche', name: 'Ghanche' },
      { id: 'ghizer', name: 'Ghizer' },
      { id: 'gilgit', name: 'Gilgit' },
      { id: 'hunza', name: 'Hunza' },
      { id: 'kharmang', name: 'Kharmang' },
      { id: 'nagar', name: 'Nagar' },
      { id: 'roundu', name: 'Roundu' },
      { id: 'shigar', name: 'Shigar' },
      { id: 'skardu', name: 'Skardu' },
      { id: 'tangir', name: 'Tangir' },
      { id: 'darel', name: 'Darel' },
      { id: 'gupis-yasin', name: 'Gupis-Yasin' },
    ]
  },
  {
    id: 'ajk',
    name: 'Azad Jammu & Kashmir',
    districts: [
      { id: 'bagh', name: 'Bagh' },
      { id: 'bhimber', name: 'Bhimber' },
      { id: 'haveli', name: 'Haveli' },
      { id: 'kotli', name: 'Kotli' },
      { id: 'mirpur-ajk', name: 'Mirpur' },
      { id: 'muzaffarabad', name: 'Muzaffarabad' },
      { id: 'neelum', name: 'Neelum' },
      { id: 'poonch', name: 'Poonch' },
      { id: 'sudhnati', name: 'Sudhnati' },
      { id: 'hattian-bala', name: 'Hattian Bala' },
    ]
  },
  {
    id: 'ict',
    name: 'Islamabad Capital Territory',
    districts: [
      { id: 'islamabad', name: 'Islamabad' },
    ]
  }
];

export default function SignupScreen({ onSwitchToLogin, onSignup }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    province: '',
    district: '',
  });
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  // When province is selected, update available districts
  const handleProvinceSelect = (province: Province) => {
    setFormData(prev => ({ ...prev, province: province.name, district: '' })); // Clear district when province changes
    setAvailableDistricts(province.districts);
    setShowProvinceDropdown(false);
  };

  const handleDistrictSelect = (district: District) => {
    setFormData(prev => ({ ...prev, district: district.name }));
    setShowDistrictDropdown(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateOTP = () => {
    // Here you would typically validate all fields and generate OTP
    onSignup();
  };

  const isFormValid = formData.name && formData.phoneNumber && formData.province && formData.district;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowProvinceDropdown(false);
            setShowDistrictDropdown(false);
          }}
          style={styles.touchableWrapper}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.headerText}>Enter details for sign up</Text>
            </View>

            {/* Form inputs */}
            <View style={styles.formSection}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Name"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Phone Number Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone number"
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Province Dropdown */}
              <View style={[styles.dropdownContainer, showProvinceDropdown && styles.provinceDropdownActive]}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowProvinceDropdown(!showProvinceDropdown);
                    setShowDistrictDropdown(false); // Close district dropdown
                  }}
                >
                  <Text style={[styles.dropdownText, !formData.province && styles.placeholderText]}>
                    {formData.province || 'Province'}
                  </Text>
                  <Text style={styles.dropdownArrow}>⌄</Text>
                </TouchableOpacity>

                {showProvinceDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {PAKISTAN_PROVINCES.map((province) => (
                        <TouchableOpacity
                          key={province.id}
                          style={styles.dropdownItem}
                          onPress={() => handleProvinceSelect(province)}
                        >
                          <Text style={styles.dropdownItemText}>{province.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* District Dropdown */}
              <View style={[styles.dropdownContainer, showDistrictDropdown && styles.districtDropdownActive]}>
                <TouchableOpacity
                  style={[styles.dropdownButton, !formData.province && styles.dropdownButtonDisabled]}
                  onPress={() => {
                    if (formData.province) {
                      setShowDistrictDropdown(!showDistrictDropdown);
                      setShowProvinceDropdown(false); // Close province dropdown
                    }
                  }}
                  disabled={!formData.province}
                >
                  <Text style={[styles.dropdownText, !formData.district && styles.placeholderText]}>
                    {formData.district || (formData.province ? 'District' : 'Select province first')}
                  </Text>
                  <Text style={styles.dropdownArrow}>⌄</Text>
                </TouchableOpacity>

                {showDistrictDropdown && formData.province && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {availableDistricts.map((district) => (
                        <TouchableOpacity
                          key={district.id}
                          style={styles.dropdownItem}
                          onPress={() => handleDistrictSelect(district)}
                        >
                          <Text style={styles.dropdownItemText}>{district.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Button */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[styles.generateOTPButton, !isFormValid && styles.generateOTPButtonDisabled]}
                onPress={handleGenerateOTP}
                disabled={!isFormValid}
              >
                <Text style={styles.generateOTPButtonText}>Generate OTP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  touchableWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  headerSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  textInput: {
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  provinceDropdownActive: {
    zIndex: 2000,
  },
  districtDropdownActive: {
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D0D0D0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    marginTop: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  buttonSection: {
    paddingBottom: 50,
  },
  generateOTPButton: {
    backgroundColor: '#4A9B8E',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateOTPButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  generateOTPButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
