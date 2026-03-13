import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import supportService from '../../lib/appwrite/support';
import { useAuth } from '../../context/authContext';

export default function NewTicket() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message fields.');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Error', 'You must be logged in to submit a ticket.');
      return;
    }

    try {
      setIsSubmitting(true);
      await supportService.createTicket({
        userId: user.$id,
        subject: subject.trim(),
        message: message.trim(),
      });
      
      Alert.alert('Success', 'Your ticket has been submitted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error submitting ticket', error);
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Subject</Text>
      <TextInput
        style={styles.input}
        placeholder="Briefly describe your issue..."
        placeholderTextColor="#5C5C77"
        value={subject}
        onChangeText={setSubject}
      />

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Explain your problem in detail..."
        placeholderTextColor="#5C5C77"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Ticket</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    padding: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1C1C2E',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 8,
    color: '#FFFFFF',
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 150,
  },
  submitButton: {
    backgroundColor: '#FF1A1A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
