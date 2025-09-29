import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Karyawan } from '@/services/api';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Karyawan>>({});

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getMyProfile();
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
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="white" />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{karyawan?.nama}</Text>
          <Text style={styles.userRole}>
            {karyawan?.Jabatan?.[0]?.nama} • {karyawan?.Departemen?.[0]?.nama}
          </Text>
        </View>
      </LinearGradient>

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
                color="#667eea" 
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
      </View>
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
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
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
    backgroundColor: '#667eea',
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
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
