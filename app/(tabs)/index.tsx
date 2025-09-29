import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Karyawan } from '@/services/api';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getMyProfile();
      setKaryawan(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getCurrentKPI = () => {
    if (!karyawan?.KPI || karyawan.KPI.length === 0) return null;
    const currentYear = new Date().getFullYear();
    return karyawan.KPI.find(kpi => kpi.year === currentYear) || karyawan.KPI[karyawan.KPI.length - 1];
  };

  const getCurrentRating = () => {
    if (!karyawan?.Rating || karyawan.Rating.length === 0) return null;
    const currentYear = new Date().getFullYear();
    return karyawan.Rating.find(rating => rating.year === currentYear) || karyawan.Rating[karyawan.Rating.length - 1];
  };

  const getRecentTrainings = () => {
    if (!karyawan?.pelatihanDetail) return [];
    return karyawan.pelatihanDetail
      .sort((a, b) => new Date(b.pelatihan.tanggal).getTime() - new Date(a.pelatihan.tanggal).getTime())
      .slice(0, 3);
  };

  const currentKPI = getCurrentKPI();
  const currentRating = getCurrentRating();
  const recentTrainings = getRecentTrainings();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color="white" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>Selamat datang,</Text>
              <Text style={styles.userName}>{karyawan?.nama || user?.username}</Text>
              <Text style={styles.userRole}>
                {karyawan?.Jabatan?.[0]?.nama || 'Karyawan'} • {karyawan?.Departemen?.[0]?.nama || 'Departemen'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="time" size={24} color="#667eea" />
          </View>
          <Text style={styles.statValue}>{karyawan?.masaKerja || 0}</Text>
          <Text style={styles.statLabel}>Tahun Bekerja</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trophy" size={24} color="#667eea" />
          </View>
          <Text style={styles.statValue}>{currentKPI?.score || 0}</Text>
          <Text style={styles.statLabel}>KPI Terbaru</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="star" size={24} color="#667eea" />
          </View>
          <Text style={styles.statValue}>{currentRating?.score || 0}</Text>
          <Text style={styles.statLabel}>Rating Terbaru</Text>
        </View>
      </View>

      {/* Company Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Perusahaan</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="business" size={24} color="#667eea" />
            <Text style={styles.infoTitle}>PT. Mobile HRD Indonesia</Text>
          </View>
          <Text style={styles.infoDescription}>
            Perusahaan teknologi yang berfokus pada pengembangan solusi HR digital untuk meningkatkan produktivitas dan kesejahteraan karyawan.
          </Text>
          <View style={styles.infoStats}>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>500+</Text>
              <Text style={styles.infoStatLabel}>Karyawan</Text>
            </View>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>15+</Text>
              <Text style={styles.infoStatLabel}>Departemen</Text>
            </View>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>50+</Text>
              <Text style={styles.infoStatLabel}>Jabatan</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleTime}>
              <Text style={styles.scheduleTimeText}>09:00</Text>
            </View>
            <View style={styles.scheduleContent}>
              <Text style={styles.scheduleTitle}>Daily Standup Meeting</Text>
              <Text style={styles.scheduleLocation}>Meeting Room A</Text>
            </View>
            <View style={styles.scheduleStatus}>
              <Ionicons name="time" size={16} color="#FF9800" />
            </View>
          </View>
          
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleTime}>
              <Text style={styles.scheduleTimeText}>14:00</Text>
            </View>
            <View style={styles.scheduleContent}>
              <Text style={styles.scheduleTitle}>Project Review</Text>
              <Text style={styles.scheduleLocation}>Conference Room</Text>
            </View>
            <View style={styles.scheduleStatus}>
              <Ionicons name="time" size={16} color="#4CAF50" />
            </View>
          </View>
          
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleTime}>
              <Text style={styles.scheduleTimeText}>16:30</Text>
            </View>
            <View style={styles.scheduleContent}>
              <Text style={styles.scheduleTitle}>Team Building</Text>
              <Text style={styles.scheduleLocation}>Outdoor Area</Text>
            </View>
            <View style={styles.scheduleStatus}>
              <Ionicons name="time" size={16} color="#2196F3" />
            </View>
          </View>
        </View>
      </View>

      {/* Company News */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Berita Perusahaan</Text>
        <View style={styles.newsCard}>
          <View style={styles.newsItem}>
            <View style={styles.newsIcon}>
              <Ionicons name="newspaper" size={20} color="#667eea" />
            </View>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>Program Kesehatan Karyawan 2024</Text>
              <Text style={styles.newsDate}>2 hari yang lalu</Text>
            </View>
          </View>
          
          <View style={styles.newsItem}>
            <View style={styles.newsIcon}>
              <Ionicons name="trophy" size={20} color="#FF9800" />
            </View>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>Employee of the Month: Januari 2024</Text>
              <Text style={styles.newsDate}>1 minggu yang lalu</Text>
            </View>
          </View>
          
          <View style={styles.newsItem}>
            <View style={styles.newsIcon}>
              <Ionicons name="calendar" size={20} color="#4CAF50" />
            </View>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>Jadwal Libur Nasional 2024</Text>
              <Text style={styles.newsDate}>2 minggu yang lalu</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Trainings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pelatihan Terbaru</Text>
        {recentTrainings.length > 0 ? (
          recentTrainings.map((training, index) => (
            <View key={index} style={styles.trainingCard}>
              <View style={styles.trainingInfo}>
                <Text style={styles.trainingName}>{training.pelatihan.nama}</Text>
                <Text style={styles.trainingDate}>
                  {new Date(training.pelatihan.tanggal).toLocaleDateString('id-ID')}
                </Text>
                <Text style={styles.trainingLocation}>{training.pelatihan.lokasi}</Text>
              </View>
              {training.skor && (
                <View style={styles.trainingScore}>
                  <Text style={styles.scoreText}>{training.skor}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada pelatihan</Text>
          </View>
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
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoStat: {
    alignItems: 'center',
  },
  infoStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  infoStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleTime: {
    width: 60,
    alignItems: 'center',
  },
  scheduleTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  scheduleContent: {
    flex: 1,
    marginLeft: 15,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduleLocation: {
    fontSize: 12,
    color: '#666',
  },
  scheduleStatus: {
    width: 30,
    alignItems: 'center',
  },
  newsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  newsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  newsDate: {
    fontSize: 12,
    color: '#666',
  },
  trainingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  trainingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  trainingLocation: {
    fontSize: 12,
    color: '#999',
  },
  trainingScore: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});
