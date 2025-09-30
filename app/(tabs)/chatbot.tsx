import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
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

const INITIAL_MESSAGES = [
  {
    id: '1',
    role: 'assistant' as const,
    text: 'Hello, good morning! How can we help with your farm today?',
    timestamp: '09:12',
  },
  {
    id: '2',
    role: 'user' as const,
    text: "Hi I'm having problems with my crop & payment",
    timestamp: '09:13',
  },
  {
    id: '3',
    role: 'assistant' as const,
    text: 'Can you help me?',
    timestamp: '09:13',
  },
];

const QUICK_REPLIES = ['Schedule irrigation', 'Show soil forecast', 'Ask agronomist'];

type Message = (typeof INITIAL_MESSAGES)[number];

type Role = Message['role'];

export default function ChatbotScreen() {
  const [messages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');

  const isSendDisabled = useMemo(() => draft.trim().length === 0, [draft]);

  const renderBubble = (message: Message) => {
    const isAssistant = message.role === 'assistant';

    return (
      <View
        key={message.id}
        style={[
          styles.bubble,
          isAssistant ? styles.assistantBubble : styles.userBubble,
          { alignSelf: isAssistant ? 'flex-start' : 'flex-end' },
        ]}>
        <Text style={[styles.bubbleText, isAssistant ? styles.assistantText : styles.userText]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, isAssistant ? styles.assistantTimestamp : styles.userTimestamp]}>
          {message.timestamp}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rafeeq</Text>
            <Text style={styles.subtitle}>Your innovative AI Assistant</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}>
          {messages.map(renderBubble)}
        </ScrollView>

        <View style={styles.quickReplies}>
          {QUICK_REPLIES.map((reply) => (
            <TouchableOpacity key={reply} style={styles.quickReplyButton}>
              <Text style={styles.quickReplyText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic-outline" size={20} color="#3F9142" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ask Rafeeq anything..."
            placeholderTextColor="#A1A1A1"
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity
            disabled={isSendDisabled}
            style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}>
            <Ionicons name="send" size={18} color={isSendDisabled ? '#A4A4A4' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  subtitle: {
    color: '#6F6F6F',
    fontSize: 13,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E4F3E6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3F9142',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  chatContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 14,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#3F9142',
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  assistantText: {
    color: '#3C3C3C',
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
  },
  assistantTimestamp: {
    color: '#9B9B9B',
  },
  userTimestamp: {
    color: '#D6F0D8',
    textAlign: 'right',
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  quickReplyButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickReplyText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E4F3E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 14,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2C2C2C',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F9142',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
});
