import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RECENT_QUERIES = ['Soil moisture last 7 days', 'Spray schedule', 'Fertilizer advice'];

const RECOMMENDED_TOPICS = [
  { id: 'weather', icon: 'partly-sunny-outline', title: 'Weather outlook' },
  { id: 'irrigation', icon: 'water-outline', title: 'Irrigation planner' },
  { id: 'market', icon: 'trending-up-outline', title: 'Market rates' },
  { id: 'crop', icon: 'leaf-outline', title: 'Crop nutrition' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const disabled = useMemo(() => query.trim().length === 0, [query]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Search Saaya</Text>
          <Text style={styles.subtitle}>Find insights, tasks, and recommendations instantly.</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#909090" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by crop, issue, or keyword"
            placeholderTextColor="#A1A1A1"
            style={styles.input}
            returnKeyType="search"
          />
          <TouchableOpacity disabled={disabled} style={[styles.searchButton, disabled && styles.disabledButton]}>
            <Text style={[styles.searchButtonText, disabled && styles.disabledButtonText]}>Go</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent Searches</Text>
          <View style={styles.pillRow}>
            {RECENT_QUERIES.map((item) => (
              <TouchableOpacity key={item} style={styles.pill}>
                <Ionicons name="time-outline" size={16} color="#3F9142" />
                <Text style={styles.pillText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recommended Topics</Text>
          <View style={styles.cardGrid}>
            {RECOMMENDED_TOPICS.map((topic) => (
              <TouchableOpacity key={topic.id} style={styles.topicCard}>
                <Ionicons name={topic.icon as any} size={22} color="#3F9142" />
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Ionicons name="arrow-forward" size={18} color="#3F9142" />
              </TouchableOpacity>
            ))}
          </View>
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
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  subtitle: {
    fontSize: 14,
    color: '#6F6F6F',
    lineHeight: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F1F1F',
  },
  searchButton: {
    minWidth: 46,
    backgroundColor: '#3F9142',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#A4A4A4',
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E4F3E6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 13,
  },
  cardGrid: {
    gap: 12,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  topicTitle: {
    flex: 1,
    marginLeft: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#3C3C3C',
  },
});
