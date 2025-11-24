import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';

const ChatList = ({ onSelectChat, onCreateChat }) => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const chatList = await api.getChats();
      setChats(chatList);
    } catch (error) {
      console.error('Error loading chats:', error);
      // If no chats, create a default one
      handleCreateChat();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChat = async () => {
    try {
      const newChat = await api.createChat();
      if (onSelectChat) {
        onSelectChat(newChat.id);
      } else if (onCreateChat) {
        onCreateChat(newChat.id);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667EEA" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E27', '#1a1f3a', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          style={styles.headerIcon}
        >
          <Text style={styles.headerIconText}>H</Text>
        </LinearGradient>
        <Text style={styles.headerTitle}>Hexy AI</Text>
      </View>

      <ScrollView style={styles.chatList} contentContainerStyle={styles.chatListContent}>
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>Create your first chat to get started</Text>
          </View>
        ) : (
          chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              onPress={() => onSelectChat && onSelectChat(chat.id)}
              style={styles.chatItem}
            >
              <View style={styles.chatIcon}>
                <Text style={styles.chatIconText}>💬</Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatTitle}>{chat.title || 'New Chat'}</Text>
                <Text style={styles.chatPreview} numberOfLines={1}>
                  {chat.last_message || 'Start a conversation...'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={handleCreateChat}
        style={styles.newChatButton}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667EEA', '#764BA2', '#F093FB']}
          style={styles.newChatButtonGradient}
        >
          <Text style={styles.newChatButtonText}>+ New Chat</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default ChatList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 14,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatIconText: {
    fontSize: 24,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatPreview: {
    color: '#94A3B8',
    fontSize: 14,
  },
  newChatButton: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  newChatButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

