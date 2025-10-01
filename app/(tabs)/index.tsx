import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FARM_STATUS = [
  {
    id: 'water',
    title: 'Water',
    icon: 'water',
    value: '85% Optimal',
    color: '#4CAF50',
    background: '#E8F5E9',
  },
  {
    id: 'pests',
    title: 'Pests',
    icon: 'ladybug',
    value: 'No Detection',
    color: '#F39C12',
    background: '#FFF4E0',
  },
  {
    id: 'growth',
    title: 'Growth',
    icon: 'sprout-outline',
    value: 'On Track',
    color: '#009688',
    background: '#E0F2F1',
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="menu" size={22} color="#1B1B1B" />
          </TouchableOpacity>
          <View style={styles.brand}>
            <Text style={styles.brandName}>Saaya</Text>
            <View style={styles.brandBadge}>
              <MaterialCommunityIcons name="weather-hazy" size={16} color="#B15B2B" />
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#1B1B1B" />
          </TouchableOpacity>
        </View>

        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <Text style={styles.sectionLabel}>Today’s Weather</Text>
            <Ionicons name="sunny" size={20} color="#F39C12" />
          </View>
          <Text style={styles.temperature}>35°C, Sunny</Text>
          <Text style={styles.weatherDescription}>Feels like 37°C • Humidity 42% • Wind 12 km/h</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Low Risk Today</Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="alert-circle" size={22} color="#FDEBD0" />
            <View>
              <Text style={styles.alertTitle}>URGENT Action Needed</Text>
              <Text style={styles.alertSubtitle}>Field 2</Text>
            </View>
          </View>
          <Text style={styles.alertDescription}>
            Field 2 has detected low moisture (11%){'\n'}Action: Begin irrigation
          </Text>
        </View>

        <View style={styles.aiCard}>
          <Text style={styles.sectionLabel}>Saaya AI Suggests:</Text>
          <Text style={styles.aiDescription}>
            Field 2 has detected low moisture (11%){'\n'}Action: Begin irrigation
          </Text>
          <View style={styles.aiFooter}>
            
            <View style={styles.aiChip}>
              <Text style={styles.aiChipText}>Rafeeq</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Farm Status Overview</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusGrid}>
          {FARM_STATUS.map((item) => (
            <View key={item.id} style={[styles.statusCard, { backgroundColor: item.background }] }>
              <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
              <Text style={styles.statusTitle}>{item.title}</Text>
              <Text style={[styles.statusValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.primaryAction, styles.actionButton]}>
            <Ionicons name="map-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Map View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryAction, styles.actionButton]}>
            <Ionicons name="cloud-outline" size={18} color="#3F9142" />
            <Text style={styles.secondaryActionText}>Detailed Weather</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1B1B1B',
    letterSpacing: 0.5,
  },
  brandBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFF2E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A5A5A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  temperature: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  weatherDescription: {
    fontSize: 14,
    color: '#6F6F6F',
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D5EDDB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 13,
  },
  alertCard: {
    backgroundColor: '#C54A2E',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  alertSubtitle: {
    color: '#FDEBD0',
    fontSize: 13,
    fontWeight: '600',
  },
  alertDescription: {
    color: '#FFFAF5',
    fontSize: 14,
    lineHeight: 20,
  },
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  aiDescription: {
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 22,
  },
  aiFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  aiFooterLabel: {
    fontSize: 13,
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  aiChip: {
    backgroundColor: '#D5EDDB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  aiChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3F9142',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: 'flex-start',
    gap: 12,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C3C3C',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    paddingVertical: 14,
  },
  primaryAction: {
    backgroundColor: '#3F9142',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  secondaryActionText: {
    color: '#3F9142',
    fontSize: 15,
    fontWeight: '700',
  },
});
