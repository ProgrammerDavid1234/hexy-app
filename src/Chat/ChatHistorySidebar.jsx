import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Platform,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.85;
const SWIPE_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD = SWIPE_ACTION_WIDTH * 0.5;

const SwipeableChatItem = ({
  chat,
  colors,
  isDark,
  isActive,
  isOpen,
  onSelect,
  onDelete,
  onRequestOpen,
  onRequestClose,
  isDeleting,
  getPreviewText,
  formatDate,
  index,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const chatId = chat.id || chat.chat_id;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isOpen ? -SWIPE_ACTION_WIDTH : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [isOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10,
      onPanResponderGrant: () => {
        Animated.spring(scaleAnim, {
          toValue: 0.98,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -SWIPE_ACTION_WIDTH));
        } else if (isOpen) {
          translateX.setValue(Math.min(gestureState.dx - SWIPE_ACTION_WIDTH, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        const shouldOpen = gestureState.dx < -SWIPE_THRESHOLD;
        if (shouldOpen) {
          onRequestOpen(chatId);
        } else {
          onRequestClose();
        }
      },
    })
  ).current;

  // Entrance animation
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      delay: index * 50,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.chatItemWrapper,
        {
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Chat Item */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            transform: [{ translateX }, { scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.deleteFabContainer,
            {
              opacity: isOpen ? 1 : 0,
              transform: [{ scale: isOpen ? 1 : 0.8 }],
            },
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onDelete(chatId)}
            style={styles.deleteFab}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="trash" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            onRequestClose();
            onSelect(chatId);
          }}
        >
          <LinearGradient
            colors={
              isActive
                ? isDark
                  ? [colors.primary + '30', colors.primary + '20']
                  : [colors.primary + '15', colors.primary + '08']
                : isDark
                ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.01)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.chatItem,
              {
                borderColor: isActive ? colors.primary + '40' : colors.border + '30',
              },
            ]}
          >
            {/* Chat Icon with gradient */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={
                  isActive
                    ? [colors.primary, colors.primaryDark]
                    : isDark
                    ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']
                    : ['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.05)']
                }
                style={styles.chatIcon}
              >
                <Ionicons
                  name={isActive ? 'chatbubbles' : 'chatbubble-outline'}
                  size={22}
                  color={isActive ? '#FFFFFF' : colors.primary}
                />
              </LinearGradient>
              {isActive && (
                <View style={styles.activeRing}>
                  <View style={[styles.activePulse, { backgroundColor: colors.primary }]} />
                </View>
              )}
            </View>

            {/* Chat Info */}
            <View style={styles.chatInfo}>
              <View style={styles.chatTitleRow}>
                <Text
                  style={[
                    styles.chatTitle,
                    { color: colors.text },
                    isActive && styles.chatTitleActive,
                  ]}
                  numberOfLines={1}
                >
                  {chat.title || 'New Chat'}
                </Text>
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>

              <Text
                style={[styles.chatPreview, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {getPreviewText(chat)}
              </Text>

              <View style={styles.chatMeta}>
                <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                <Text style={[styles.chatDate, { color: colors.textTertiary }]}>
                  {formatDate(chat.created_at || chat.date_created)}
                </Text>
              </View>
            </View>

            {/* Arrow indicator */}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isActive ? colors.primary : colors.textTertiary}
              style={styles.arrowIcon}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const ChatHistorySidebar = ({ isOpen, onClose, onSelectChat, currentChatId }) => {
  const { colors, isDark } = useTheme();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openChatId, setOpenChatId] = useState(null);
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const slideAnim = useRef(new Animated.Value(isOpen ? 0 : -SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen]);

  const loadChats = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
      setIsLoading(true);
      }
      const chatList = await api.getConversations();
      setChats(Array.isArray(chatList) ? chatList : []);
      setOpenChatId(null);
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
      setIsLoading(false);
      }
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      setDeletingChatId(chatId);
      await api.deleteConversation(chatId);
      setChats((prev) => prev.filter((chat) => (chat.id || chat.chat_id) !== chatId));
      if (chatId === currentChatId && onSelectChat) {
        onSelectChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setDeletingChatId(null);
      setOpenChatId(null);
    }
  };

  const handleCreateChat = async () => {
    try {
      const newChat = await api.createConversation();
      if (onSelectChat) {
        onSelectChat(newChat.id || newChat.chat_id);
      }
      loadChats({ silent: true });
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const formatRelativeTime = (dateValue) => {
    if (!dateValue) return 'Just now';
    const timestamp = dateValue instanceof Date ? dateValue.getTime() : new Date(dateValue).getTime();
    if (Number.isNaN(timestamp)) {
      return 'Just now';
    }
    const diff = Date.now() - timestamp;
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;

    if (diff < minute) return 'moments ago';
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    if (diff < day * 7) return `${Math.floor(diff / day)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const getPreviewText = (chat) => {
    if (chat.last_message) {
      return chat.last_message.length > 80
        ? chat.last_message.substring(0, 80) + '...'
        : chat.last_message;
    }
    return 'No messages yet • Start chatting';
  };

  const derivedChats = useMemo(() => {
    return chats.map((chat) => {
      const lastActivity =
        chat.updated_at ||
        chat.last_activity ||
        chat.last_message_at ||
        chat.created_at ||
        chat.date_created;

      return {
        ...chat,
        _lastActivity: lastActivity ? new Date(lastActivity).getTime() : 0,
        _isPinned: Boolean(chat.is_pinned || chat.pinned),
      };
    });
  }, [chats]);

  const filteredChats = useMemo(() => {
    const sorted = [...derivedChats].sort((a, b) => b._lastActivity - a._lastActivity);
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return sorted;
    }

    return sorted.filter((chat) => {
      const haystack = `${chat.title || ''} ${chat.last_message || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [derivedChats, searchQuery]);

  const pinnedChats = useMemo(
    () => filteredChats.filter((chat) => chat._isPinned),
    [filteredChats]
  );

  const regularChats = useMemo(
    () => filteredChats.filter((chat) => !chat._isPinned),
    [filteredChats]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay with blur effect */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(2,6,23,0.92)', 'rgba(2,6,23,0.75)']
                : ['rgba(15,23,42,0.6)', 'rgba(15,23,42,0.35)']
            }
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.background,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)', 'transparent']
              : ['rgba(139, 92, 246, 0.05)', 'rgba(59, 130, 246, 0.02)', 'transparent']
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border + '30' }]}>
          <View style={styles.headerContent}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.headerIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
              <View style={styles.headerIconGlow} />
            </LinearGradient>
            <View style={styles.headerTextContainer}>
            <Text style={[styles.headerText, { color: colors.text }]}>Chat History</Text>
              <Text style={[styles.headerSubtext, { color: colors.textTertiary }]}>
                {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.input }]}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search & utilities */}
        <View style={styles.searchSection}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.input }]}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              placeholder="Search chats..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.utilityRow}>
            <View style={[styles.metaPill, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.primary }]} numberOfLines={1}>
                {lastSyncedAt ? `Synced ${formatRelativeTime(lastSyncedAt)}` : 'Not synced yet'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => loadChats({ silent: true })}
              style={[
                styles.refreshButton,
                { borderColor: colors.border, backgroundColor: colors.background },
                refreshing && { opacity: 0.6 },
              ]}
              disabled={refreshing}
              activeOpacity={0.8}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.refreshButtonText, { color: colors.primary }]}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat List */}
        <ScrollView
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadChats({ silent: true })}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
                Loading your chats...
              </Text>
            </View>
          ) : filteredChats.length === 0 ? (
            searchQuery ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No matches found</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Try a different keyword or clear your search filters
                </Text>
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={[styles.clearSearchAction, { borderColor: colors.border }]}
                >
                  <Ionicons name="close-circle" size={18} color={colors.primary} />
                  <Text style={[styles.clearSearchText, { color: colors.primary }]}>
                    Clear search
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  style={styles.emptyIcon}
                >
                  <MaterialCommunityIcons
                    name="chat-plus-outline"
                    size={48}
                    color={colors.primary}
                  />
                </LinearGradient>
                <Text style={[styles.emptyText, { color: colors.text }]}>No chats yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Start a new conversation to begin your AI journey
                </Text>
              </View>
            )
          ) : (
            <>
              {pinnedChats.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Pinned</Text>
                    <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
                        {pinnedChats.length}
                      </Text>
                    </View>
                  </View>
                  {pinnedChats.map((chat, index) => {
                    const chatId = chat.id || chat.chat_id;
                    return (
                      <SwipeableChatItem
                        key={chatId}
                        chat={chat}
                        colors={colors}
                        isDark={isDark}
                        isActive={chatId === currentChatId}
                        isOpen={openChatId === chatId}
                        onSelect={(selectedId) => {
                          onSelectChat(selectedId);
                          onClose();
                        }}
                        onDelete={handleDeleteChat}
                        onRequestOpen={setOpenChatId}
                        onRequestClose={() => setOpenChatId(null)}
                        isDeleting={deletingChatId === chatId}
                        getPreviewText={getPreviewText}
                        formatDate={formatDate}
                        index={index}
                      />
                    );
                  })}
                </>
              )}

              {regularChats.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Recent</Text>
                    <Text style={[styles.sectionHelper, { color: colors.textTertiary }]}>
                      {regularChats.length} chat{regularChats.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {regularChats.map((chat, index) => {
                    const chatId = chat.id || chat.chat_id;
                    return (
                      <SwipeableChatItem
                        key={chatId}
                        chat={chat}
                        colors={colors}
                        isDark={isDark}
                        isActive={chatId === currentChatId}
                        isOpen={openChatId === chatId}
                        onSelect={(selectedId) => {
                          onSelectChat(selectedId);
                          onClose();
                        }}
                        onDelete={handleDeleteChat}
                        onRequestOpen={setOpenChatId}
                        onRequestClose={() => setOpenChatId(null)}
                        isDeleting={deletingChatId === chatId}
                        getPreviewText={getPreviewText}
                        formatDate={formatDate}
                        index={pinnedChats.length + index}
                      />
                    );
                  })}
                </>
              )}
            </>
          )}
        </ScrollView>

        {/* New Chat Button */}
        <View style={[styles.footer, { borderTopColor: colors.border + '30' }]}>
          <TouchableOpacity onPress={handleCreateChat} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.newChatButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.newChatButtonContent}>
                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                <Text style={styles.newChatButtonText}>Start New Chat</Text>
              </View>
              <View style={styles.buttonShine} />
            </LinearGradient>
        </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

export default ChatHistorySidebar;

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 1001,
    ...Platform.select({
      ios: {
    shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayTouchable: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerIconGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5,
  },
  headerSubtext: {
    fontSize: 13,
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  clearSearchButton: {
    padding: 4,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 8,
  },
  chatItemWrapper: {
    marginBottom: 12,
    overflow: 'visible',
  },
  deleteFabContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  deleteFab: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconContainer: {
    position: 'relative',
    marginRight: 14,
  },
  chatIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    top: 0,
    left: 0,
  },
  activePulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -2,
    right: -2,
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3,
    flex: 1,
  },
  chatTitleActive: {
    fontWeight: '700',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  chatPreview: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins',
  },
  chatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  chatDate: {
    fontSize: 11,
    fontFamily: 'Poppins',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Poppins',
  },
  clearSearchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearSearchText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  sectionHelper: {
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  newChatButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  newChatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.3,
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});