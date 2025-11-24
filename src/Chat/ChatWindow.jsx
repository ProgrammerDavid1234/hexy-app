import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { api, authUtils } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import ChatHistorySidebar from './ChatHistorySidebar';
import Markdown from 'react-native-markdown-display';

const { width, height } = Dimensions.get('window');

const DEFAULT_MODEL_OPTIONS = [
  { value: 'kwaipilot/kat-coder-pro:free', label: 'Kwai Kat Coder Pro', tier: 'free', recommended: true },
  { value: 'nvidia/nemotron-nano-12b-v2-vl:free', label: 'NVIDIA Nemotron Nano VL', tier: 'free', recommended: false },
  { value: 'z-ai/glm-4.5-air:free', label: 'Z-AI GLM 4.5 Air', tier: 'free', recommended: false },
  { value: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', label: 'Dolphin Mistral Venice', tier: 'free', recommended: false },
  { value: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small 3.1', tier: 'free', recommended: true },
  { value: 'deepseek/deepseek-chat-v3.1:free', label: 'DeepSeek Chat V3.1', tier: 'free', recommended: true },
  { value: 'meta-llama/llama-3.3-8b-instruct:free', label: 'Llama 3.3 8B', tier: 'free', recommended: false },
  { value: 'alibaba/tongyi-deepresearch-30b-a3b:free', label: 'Tongyi DeepResearch', tier: 'free', recommended: false },
  { value: 'openai/gpt-oss-20b:free', label: 'GPT OSS 20B', tier: 'free', recommended: false },
  { value: 'openrouter/sherlock-dash-alpha', label: 'Sherlock Dash Alpha', tier: 'premium', recommended: false },
  { value: 'meituan/longcat-flash-chat:free', label: 'Longcat Flash Chat', tier: 'free', recommended: false },
  { value: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 Llama 405B', tier: 'free', recommended: false },
  { value: 'mistralai/mistral-nemo:free', label: 'Mistral Nemo', tier: 'free', recommended: true },
  { value: 'moonshotai/kimi-k2:free', label: 'Kimi K2', tier: 'free', recommended: false },
];

const normalizeModels = (rawModels) => {
  if (!rawModels) return [];

  const prettifyLabel = (value = '') => {
    if (!value) return '';
    return value
      .replace(/[_/-]+/g, ' ')
      .split(' ')
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
      .join(' ')
      .trim();
  };

  const items = Array.isArray(rawModels)
    ? rawModels
    : rawModels?.models || rawModels?.data || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (!item) return null;

      if (typeof item === 'string') {
        return {
          value: item,
          label: prettifyLabel(item),
          tier: 'free',
          recommended: false,
        };
      }

      const value = item.value || item.name || item.id;
      if (!value) return null;

      return {
        value,
        label: item.label || item.display_name || prettifyLabel(value),
        tier: item.tier || item.plan || (item.is_premium ? 'premium' : 'free'),
        recommended: Boolean(item.recommended || item.is_recommended || item.highlight),
      };
    })
    .filter(Boolean);
};

const MessageSkeleton = ({ colors }) => {
  return (
    <View style={styles.messageSkeleton}>
      <View style={[styles.skeletonAvatar, { backgroundColor: colors.card }]}>
        <View style={[styles.skeletonIcon, { backgroundColor: colors.primary + '30' }]} />
      </View>
      <View style={[styles.skeletonContent, { backgroundColor: colors.card }]}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.input }]} />
        <View style={[styles.skeletonLine, { width: '80%', backgroundColor: colors.input }]} />
        <View style={[styles.skeletonLine, { width: '60%', backgroundColor: colors.input }]} />
        <View style={styles.skeletonDots}>
          <View style={[styles.skeletonDot, { backgroundColor: colors.primary + '50' }]} />
          <View style={[styles.skeletonDot, { backgroundColor: colors.primary + '50' }]} />
          <View style={[styles.skeletonDot, { backgroundColor: colors.primary + '50' }]} />
        </View>
      </View>
    </View>
  );
};

const ChatWindow = ({ chatId, onBack, onChatCreated, onProfilePress }) => {
  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [modelOptions, setModelOptions] = useState(DEFAULT_MODEL_OPTIONS);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_OPTIONS[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const skipNextHistoryFetch = useRef(false);

  useEffect(() => {
    if (chatId) {
      if (skipNextHistoryFetch.current) {
        skipNextHistoryFetch.current = false;
        return;
      }
      fetchChatHistory();
    } else {
      setIsFetchingHistory(false);
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const ensureSelectedModel = (models) => {
    if (!models.length) return;
    const exists = models.some((model) => model.value === selectedModel);
    if (!exists) {
      setSelectedModel(models[0].value);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      setIsLoadingModels(true);
      setModelError(null);

      const userModels = await api
        .getUserModels()
        .catch((error) => {
          console.warn('Error fetching user-specific models:', error);
          return null;
        });

      const normalizedUserModels = normalizeModels(userModels);
      if (normalizedUserModels.length) {
        setModelOptions(normalizedUserModels);
        ensureSelectedModel(normalizedUserModels);
        return;
      }

      const allModels = await api.getAllModels();
      const normalizedAllModels = normalizeModels(allModels);
      if (normalizedAllModels.length) {
        setModelOptions(normalizedAllModels);
        ensureSelectedModel(normalizedAllModels);
        return;
      }

      setModelOptions(DEFAULT_MODEL_OPTIONS);
      ensureSelectedModel(DEFAULT_MODEL_OPTIONS);
    } catch (error) {
      console.error('Error fetching models:', error);
      setModelError('Unable to load model list. Showing defaults.');
      setModelOptions(DEFAULT_MODEL_OPTIONS);
      ensureSelectedModel(DEFAULT_MODEL_OPTIONS);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const fetchChatHistory = async () => {
    if (!chatId) {
      setIsFetchingHistory(false);
      return;
    }

    try {
      setIsFetchingHistory(true);
      const history = await api.getChatHistory(chatId);
      // Handle different response formats
      if (Array.isArray(history)) {
        setMessages(history);
      } else if (history.messages && Array.isArray(history.messages)) {
        setMessages(history.messages);
      } else if (history.data && Array.isArray(history.data)) {
        setMessages(history.data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setMessages([]);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage)) return;
    
    // If no chatId, create one first
    let currentChatId = chatId;
    if (!currentChatId) {
      try {
        const newChat = await api.createConversation();
        currentChatId = newChat.id || newChat.chat_id;
        if (onChatCreated) {
          skipNextHistoryFetch.current = true;
          onChatCreated(currentChatId);
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        alert('Failed to create chat. Please try again.');
        return;
      }
    }
  
    const userMessageContent = input.trim() || 'Sent an image';
    const imageToSend = selectedImage;
  
    setInput('');
    clearImage();
    setIsLoading(true);
  
    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      content: userMessageContent,
      message_role: 'user',
      timestamp: new Date().toISOString(),
      model: selectedModel,
      image_url: selectedImage?.uri,
    };
  
    setMessages((prev) => [...prev, tempUserMessage]);
  
    const assistantMessageId = `temp-assistant-${Date.now()}`;
    const tempAssistantMessage = {
      id: assistantMessageId,
      content: '',
      message_role: 'assistant',
      timestamp: new Date().toISOString(),
      model: selectedModel,
    };
  
    setMessages((prev) => [...prev, tempAssistantMessage]);
  
    try {
      if (imageToSend) {
        const response = await api.sendMessageWithImage(currentChatId, userMessageContent, imageToSend);
        const responseContent = typeof response === 'string' 
          ? response 
          : (response.content || response.message || response.text || '');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: responseContent } : msg
          )
        );
        setIsLoading(false);
      } else {
        // Use streaming for text messages
        await api.sendMessageStream(
          currentChatId,
          userMessageContent,
          selectedModel,
          (token) => {
            // Append each token to the assistant message
            console.log('Received token in UI:', token); // Debug
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId 
                  ? { ...msg, content: (msg.content || '') + token } 
                  : msg
              )
            );
          },
          () => {
            // On complete
            setIsLoading(false);
          },
          (error) => {
            // On error
            console.error('Streaming error:', error);
            setMessages((prev) =>
              prev.filter((m) => m.id !== tempUserMessage.id && m.id !== assistantMessageId)
            );
            setIsLoading(false);
            setInput(userMessageContent);
            if (imageToSend) {
              setSelectedImage(imageToSend);
            }
            alert('Failed to send message. Please try again.');
          }
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserMessage.id && m.id !== assistantMessageId)
      );
      setInput(userMessageContent);
      if (imageToSend) {
        setSelectedImage(imageToSend);
      }
      setIsLoading(false);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSelectChat = (newChatId) => {
    if (onChatCreated) {
      onChatCreated(newChatId);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.message_role === 'user';
    const contentToRender = (message.content || '').trim() || '_No content returned_';

    return (
      <View
        key={message.id || index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.avatar}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.avatarGradient}
            >
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
        )}

        <View style={[
          styles.messageBubble, 
          isUser 
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }]
        ]}>
          {message.image_url && (
            <Image source={{ uri: message.image_url }} style={styles.messageImage} />
          )}
          {isUser ? (
            <Text
              style={[
                styles.messageText,
                { color: '#FFFFFF' },
              ]}
            >
              {message.content || '[Empty message]'}
            </Text>
          ) : (
            <Markdown
              style={markdownStyles(colors)}
              onLinkPress={(url) => {
                Linking.openURL(url).catch(() => {});
                return false;
              }}
            >
              {contentToRender}
            </Markdown>
          )}
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <LinearGradient
              colors={['#4FACFE', '#00F2FE']}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  const selectedModelLabel =
    modelOptions.find((m) => m.value === selectedModel)?.label || selectedModel;

  const backgroundColors = isDark 
    ? ['#0A0E27', '#1a1f3a', '#0F172A']
    : ['#F8FAFC', '#FFFFFF', '#F1F5F9'];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient
        colors={backgroundColors}
        style={StyleSheet.absoluteFill}
      />

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectChat={handleSelectChat}
        currentChatId={chatId}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => setShowSidebar(!showSidebar)} 
            style={styles.menuButton}
          >
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerTitle}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.headerIcon}
          >
            <Text style={styles.headerIconText}>H</Text>
          </LinearGradient>
          <Text style={[styles.headerText, { color: colors.text }]}>Chat</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowModelPicker(!showModelPicker)}
            style={[styles.modelButton, { backgroundColor: colors.primary + '20' }]}
            activeOpacity={0.8}
          >
            <View style={styles.modelButtonContent}>
              {isLoadingModels && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.modelLoadingIndicator} />
              )}
              <Text style={[styles.modelButtonText, { color: colors.primary }]} numberOfLines={1}>
                {selectedModelLabel}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={fetchAvailableModels}
            disabled={isLoadingModels}
            style={[
              styles.modelRefreshButton,
              {
                backgroundColor: colors.primary + '15',
                opacity: isLoadingModels ? 0.5 : 1,
              },
            ]}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
          {onProfilePress && (
            <TouchableOpacity
              onPress={onProfilePress}
              style={[styles.profileButton, { backgroundColor: colors.primary + '20' }]}
            >
              <Ionicons name="person-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {modelError && (
        <Text style={[styles.modelErrorText, { color: '#EF4444' }]}>{modelError}</Text>
      )}

      {/* Model Picker */}
      {showModelPicker && (
        <ScrollView 
          style={[styles.modelPicker, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
        >
          {isLoadingModels && (
            <View style={styles.modelPickerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Refreshing models...</Text>
            </View>
          )}
          {!isLoadingModels && modelOptions.length === 0 && (
            <View style={styles.modelPickerLoader}>
              <Ionicons name="cloud-offline-outline" size={28} color={colors.textTertiary} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
                No models available right now
              </Text>
            </View>
          )}
          {modelOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                setSelectedModel(option.value);
                setShowModelPicker(false);
              }}
              style={[
                styles.modelOption,
                selectedModel === option.value && { backgroundColor: colors.primary + '10' },
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.modelOptionText, { color: colors.text }]}>{option.label}</Text>
              {option.recommended && (
                <View style={[styles.recommendedBadge, { backgroundColor: '#22C55E' + '20' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                </View>
              )}
              {option.tier === 'premium' && (
                <View style={[styles.premiumBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.premiumText, { color: colors.primary }]}>Premium</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {isFetchingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
              Loading conversation...
            </Text>
          </View>
        ) : (
          <>
            {messages.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.emptyIcon}
                >
                  <Ionicons name="sparkles" size={40} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
                <Text style={[styles.emptyDescription, { color: colors.textTertiary }]}>
                  Choose an AI model above and type a message below to begin your chat
                </Text>
              </View>
            )}

            {messages.map((message, index) => renderMessage(message, index))}
            {isLoading && <MessageSkeleton colors={colors} />}
          </>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <TouchableOpacity onPress={clearImage} style={styles.removeImageButton}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={isLoading || isFetchingHistory}
            style={[styles.imageButton, { backgroundColor: colors.input }]}
          >
            <Ionicons name="image" size={20} color={colors.text} />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              { 
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              }
            ]}
            placeholder="Type your message..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!isLoading && !isFetchingHistory}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={isLoading || (!input.trim() && !selectedImage) || isFetchingHistory}
            style={[
              styles.sendButton,
              (isLoading || (!input.trim() && !selectedImage) || isFetchingHistory) &&
                styles.sendButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
          Press Enter to send • Max 5MB images
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatWindow;

const markdownStyles = (colors) => ({
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins',
  },
  heading1: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  heading2: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fence: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  blockquote: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginVertical: 8,
  },
  bullet_list: {
    marginVertical: 6,
  },
  ordered_list: {
    marginVertical: 6,
  },
  link: {
    color: colors.primary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 70 : 60,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 8,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 120,
  },
  modelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  modelLoadingIndicator: {
    marginRight: 4,
  },
  modelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  modelRefreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelErrorText: {
    fontSize: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  modelPicker: {
    maxHeight: 200,
    borderBottomWidth: 1,
  },
  modelPickerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modelOptionText: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'Poppins',
  },
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontFamily: 'Poppins',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 12,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    // backgroundColor set dynamically
  },
  assistantBubble: {
    borderWidth: 1,
    // backgroundColor and borderColor set dynamically
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  messageSkeleton: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    margin: 10,
  },
  skeletonContent: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  skeletonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  imagePreview: {
    marginBottom: 12,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#667EEA',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    fontFamily: 'Poppins',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 8,
    paddingLeft: 4,
    fontFamily: 'Poppins',
  },
});
