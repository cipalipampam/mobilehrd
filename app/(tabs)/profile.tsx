import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Karyawan } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = 'http://10.10.1.89:5000'; // Same as api.ts

export default function ProfileScreen() {
  const { user } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Karyawan>>({});
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile data (which includes foto_profil from User)
      const [data, currentUser] = await Promise.all([
        apiService.getMyProfile(),
        apiService.getCurrentUser()
      ]);
      
      // Set photo URL from current user data
      if (currentUser && currentUser.foto_profil) {
        console.log('✅ Foto profil ditemukan:', currentUser.foto_profil);
        setPhotoUrl(currentUser.foto_profil);
      } else {
        console.log('⚠️ Foto profil tidak ditemukan');
        setPhotoUrl(null);
      }
      
      setKaryawan(data);
      setEditData({
        alamat: data.alamat || '',
        no_telp: data.no_telp || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Gagal memuat data profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Izin akses galeri diperlukan');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleUploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  const handleUploadPhoto = async (uri: string) => {
    try {
      setIsUploadingPhoto(true);
      const updatedUser = await apiService.uploadProfilePhoto(uri);
      console.log('📸 Upload response:', updatedUser);
      
      if (updatedUser && updatedUser.foto_profil) {
        console.log('✅ Setting new photo URL:', updatedUser.foto_profil);
        setPhotoUrl(updatedUser.foto_profil);
        Alert.alert('Berhasil', 'Foto profil berhasil diperbarui');
      } else {
        console.warn('⚠️ No foto_profil in response');
        Alert.alert('Peringatan', 'Foto diupload tapi URL tidak diterima');
      }
      
      // Reload profile to ensure fresh data
      await loadProfileData();
    } catch (error: any) {
      console.error('❌ Error uploading photo:', error);
      Alert.alert('Error', error.message || 'Gagal upload foto profil');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      'Hapus Foto Profil',
      'Apakah Anda yakin ingin menghapus foto profil?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploadingPhoto(true);
              await apiService.deleteProfilePhoto();
              setPhotoUrl(null);
              Alert.alert('Berhasil', 'Foto profil berhasil dihapus');
              // Reload profile to ensure fresh data
              await loadProfileData();
            } catch (error: any) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', error.message || 'Gagal hapus foto profil');
            } finally {
              setIsUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      const updatedData = await apiService.updateProfile(editData);
      setKaryawan(updatedData);
      setIsEditing(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Gagal memperbarui profil');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password baru minimal 6 karakter');
      return;
    }

    try {
      await apiService.changePassword(currentPassword, newPassword);
      Alert.alert('Berhasil', 'Password berhasil diubah');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Gagal mengubah password');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerWave} />
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              onPress={handlePickImage}
              onLongPress={photoUrl ? handleDeletePhoto : undefined}
              disabled={isUploadingPhoto}
              style={styles.avatarTouchable}
            >
              {isUploadingPhoto ? (
                <View style={styles.avatar}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              ) : photoUrl ? (
                <Image 
                  source={{ 
                    uri: photoUrl.startsWith('http') 
                      ? photoUrl 
                      : `${API_BASE_URL}${photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}` 
                  }} 
                  style={styles.avatarImage}
                  onError={(e) => {
                    console.log('❌ Error loading image:', e.nativeEvent.error);
                    console.log('❌ Image URL:', photoUrl);
                  }}
                  onLoad={() => console.log('✅ Image loaded successfully')}
                />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="white" />
                </View>
              )}
              <View style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{karyawan?.nama}</Text>
          <Text style={styles.userRole}>
            {karyawan?.Jabatan?.[0]?.nama} • {karyawan?.Departemen?.[0]?.nama}
          </Text>
        </View>
      </View>

      {/* Profile Information */}
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editButton}
            >
              <Ionicons 
                name={isEditing ? "close" : "create-outline"} 
                size={20} 
                color="#1a1a1a" 
              />
              <Text style={styles.editButtonText}>
                {isEditing ? 'Batal' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nama Lengkap</Text>
                <Text style={styles.infoValue}>{karyawan?.nama}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="transgender-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Jenis Kelamin</Text>
                <Text style={styles.infoValue}>{karyawan?.gender}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tanggal Lahir</Text>
                <Text style={styles.infoValue}>
                  {karyawan?.tanggal_lahir 
                    ? `${formatDate(karyawan.tanggal_lahir)} (${calculateAge(karyawan.tanggal_lahir)} tahun)`
                    : 'Tidak tersedia'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Pendidikan</Text>
                <Text style={styles.infoValue}>{karyawan?.pendidikan}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Alamat</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editData.alamat}
                    onChangeText={(text) => setEditData({...editData, alamat: text})}
                    placeholder="Masukkan alamat"
                    multiline
                  />
                ) : (
                  <Text style={styles.infoValue}>{karyawan?.alamat || 'Tidak tersedia'}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>No. Telepon</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editData.no_telp}
                    onChangeText={(text) => setEditData({...editData, no_telp: text})}
                    placeholder="Masukkan nomor telepon"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.infoValue}>{karyawan?.no_telp || 'Tidak tersedia'}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Work Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Kerja</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Departemen</Text>
                <Text style={styles.infoValue}>
                  {karyawan?.Departemen?.map(dept => dept.nama).join(', ') || 'Tidak tersedia'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Jabatan</Text>
                <Text style={styles.infoValue}>
                  {karyawan?.Jabatan?.map(jabatan => jabatan.nama).join(', ') || 'Tidak tersedia'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tanggal Masuk</Text>
                <Text style={styles.infoValue}>
                  {karyawan?.tanggal_masuk ? formatDate(karyawan.tanggal_masuk) : 'Tidak tersedia'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Masa Kerja</Text>
                <Text style={styles.infoValue}>
                  {karyawan?.masaKerja ? `${karyawan.masaKerja} tahun` : 'Tidak tersedia'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Jalur Rekrutmen</Text>
                <Text style={styles.infoValue}>{karyawan?.jalur_rekrut}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
          </TouchableOpacity>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowChangePasswordModal(true)}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="lock-closed-outline" size={22} color="#1a1a1a" />
                <Text style={styles.settingItemText}>Ubah Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ubah Password</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Current Password */}
              <Text style={styles.inputLabel}>Password Saat Ini</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Masukkan password saat ini"
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons 
                    name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>

              {/* New Password */}
              <Text style={styles.inputLabel}>Password Baru</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons 
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Masukkan kembali password baru"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.buttonSecondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleChangePassword}
              >
                <Text style={styles.buttonPrimaryText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  headerWave: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
    marginLeft: 5,
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  editInput: {
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
    minHeight: 20,
  },
  saveButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.3,
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  buttonPrimary: {
    backgroundColor: '#1a1a1a',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
});
