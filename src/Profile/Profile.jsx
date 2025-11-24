import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { api, authUtils } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

const Profile = ({ onBack, onLogout }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!(await authUtils.isAuthenticated())) {
        if (onLogout) onLogout();
        return;
      }

      const userData = await api.getCurrentUser();
      setUser(userData);
      setEditForm({
        username: userData.username,
        email: userData.email,
        password: '',
      });

      try {
        const userModels = await api.getUserModels();
        setModels(userModels);
      } catch (err) {
        console.error('Error fetching models:', err);
        setModels([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      if (err.message.includes('Authentication')) {
        await authUtils.clearToken();
        if (onLogout) onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        username: editForm.username,
        email: editForm.email,
        ...(editForm.password && { password: editForm.password }),
      };

      const updatedUser = await api.updateUser(updateData);
      setUser(updatedUser);
      setEditing(false);
      setEditForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to upload a profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const file = result.assets[0];

    if (file.fileSize > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);
      const updatedUser = await api.uploadProfileImage(file);
      setUser(updatedUser);
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser();
              await authUtils.clearToken();
              if (onLogout) onLogout();
            } catch (err) {
              setError(err.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const getSubscriptionBadgeColor = (type) => {
    const colors = {
      basic: '#6B7280',
      standard: '#3B82F6',
      pro: '#8B5CF6',
      premium: '#F59E0B',
    };
    return colors[type?.toLowerCase()] || '#667EEA';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getModelDisplayName = (modelString) => {
    const cleanModel = modelString.replace(':free', '').split('/')[1] || modelString;

    const modelNames = {
      'kat-coder-pro': 'Kat Coder Pro',
      'nemotron-nano-12b-v2-vl': 'Nemotron Nano',
      'glm-4.5-air': 'GLM 4.5',
      'dolphin-mistral-24b-venice-edition': 'Dolphin Mistral',
      'mistral-small-3.1-24b-instruct': 'Mistral Small',
      'deepseek-chat-v3.1': 'DeepSeek Chat',
      'llama-3.3-8b-instruct': 'Llama 3.3',
      'tongyi-deepresearch-30b-a3b': 'Tongyi Research',
      'gpt-oss-20b': 'GPT OSS',
      'sherlock-dash-alpha': 'Sherlock Dash',
      'longcat-flash-chat': 'LongCat Flash',
      'hermes-3-llama-3.1-405b': 'Hermes 3',
      'mistral-nemo': 'Mistral Nemo',
      'kimi-k2': 'Kimi K2',
    };

    return (
      modelNames[cleanModel] ||
      cleanModel
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667EEA" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error || 'Failed to load profile'}</Text>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0A0E27', '#1a1f3a', '#0F172A'] : ['#F8FAFC', '#FFFFFF', '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitle}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.headerIcon}
          >
            <Text style={styles.headerIconText}>H</Text>
          </LinearGradient>
          <Text style={[styles.headerText, { color: colors.text }]}>Profile</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons 
            name={isDark ? "sunny" : "moon"} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: '#EF4444' + '20', borderColor: '#EF4444' + '30' }]}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={[styles.errorBannerText, { color: '#EF4444', flex: 1 }]}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* User Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.profileImageContainer}>
              {user.image_url ? (
                <Image source={{ uri: user.image_url }} style={styles.profileImage} />
              ) : (
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.profileImagePlaceholder}
                >
                  <Text style={styles.profileImageText}>
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
              )}
              <TouchableOpacity
                onPress={handleImageUpload}
                disabled={uploadingImage}
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              {!editing ? (
                <>
                  <Text style={[styles.username, { color: colors.text }]}>{user.username}</Text>
                  <View style={styles.emailRow}>
                    <Ionicons name="mail" size={16} color={colors.textTertiary} style={{ marginRight: 6 }} />
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
                  </View>
                  <View style={styles.memberRow}>
                    <Ionicons name="calendar" size={16} color={colors.textTertiary} style={{ marginRight: 6 }} />
                    <Text style={[styles.memberSince, { color: colors.textTertiary }]}>
                      Member since {formatDate(user.date_created)}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.editForm}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                      value={editForm.username}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, username: text })
                      }
                      placeholder="Username"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                      value={editForm.email}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, email: text })
                      }
                      placeholder="Email"
                      keyboardType="email-address"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>New Password (optional)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                      value={editForm.password}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, password: text })
                      }
                      placeholder="Leave blank to keep current"
                      secureTextEntry
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.cardActions}>
            {!editing ? (
              <TouchableOpacity
                onPress={() => setEditing(true)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleUpdateProfile}
                  disabled={saving}
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditing(false);
                    setEditForm({
                      username: user.username,
                      email: user.email,
                      password: '',
                    });
                  }}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Subscription Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleRowLeft}>
              <Ionicons name="card" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Current Plan</Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: getSubscriptionBadgeColor(user.subscription_type) },
              ]}
            >
              <Text style={styles.badgeText}>
                {user.subscription_type?.toUpperCase() || 'BASIC'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Free Text Messages</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.free_usage_text || 0}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Free Image Messages</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.free_usage_image || 0}</Text>
            </View>
          </View>

          {models.length > 0 && (
            <View style={styles.modelsSection}>
              <Text style={[styles.modelsTitle, { color: colors.text }]}>Available Models:</Text>
              <View style={styles.modelsList}>
                {models.map((model, index) => {
                  const modelString =
                    typeof model === 'string' ? model : model.name || model.id;
                  return (
                    <View key={index} style={[styles.modelBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.modelBadgeText, { color: colors.primary }]}>
                        {getModelDisplayName(modelString)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Actions Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Account Actions</Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
            onPress={async () => {
              await authUtils.clearToken();
              if (onLogout) onLogout();
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { backgroundColor: '#EF4444' + '20' }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={[styles.actionButtonText, styles.deleteButtonText, { color: '#EF4444' }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;

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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 14,
    flex: 1,
  },
  errorClose: {
    color: '#EF4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    marginBottom: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667EEA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  uploadButtonText: {
    fontSize: 18,
  },
  userInfo: {
    alignItems: 'center',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 4,
  },
  memberSince: {
    color: '#64748B',
    fontSize: 12,
  },
  editForm: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#667EEA',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#667EEA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modelsSection: {
    marginTop: 16,
  },
  modelsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modelsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modelBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modelBadgeText: {
    color: '#667EEA',
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteButtonText: {
    color: '#EF4444',
  },
});

