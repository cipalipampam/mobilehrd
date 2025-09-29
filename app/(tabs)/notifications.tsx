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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'training' | 'performance';
  date: string;
  isRead: boolean;
  action?: string;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      // Simulate API call - replace with actual API
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Pelatihan Baru Tersedia',
          message: 'Pelatihan "Digital Marketing Fundamentals" akan dimulai minggu depan. Daftar sekarang!',
          type: 'training',
          date: '2024-01-15T10:00:00Z',
          isRead: false,
          action: 'Daftar Sekarang'
        },
        {
          id: '2',
          title: 'KPI Q1 2024 Telah Dinilai',
          message: 'Penilaian KPI untuk Q1 2024 telah selesai. Skor Anda: 85. Lihat detail di halaman Kinerja.',
          type: 'performance',
          date: '2024-01-14T14:30:00Z',
          isRead: false,
          action: 'Lihat Detail'
        },
        {
          id: '3',
          title: 'Pengumuman Perusahaan',
          message: 'Perusahaan akan mengadakan acara gathering tahunan pada tanggal 25 Januari 2024.',
          type: 'info',
          date: '2024-01-13T09:15:00Z',
          isRead: true
        },
        {
          id: '4',
          title: 'Reminder: Evaluasi Kinerja',
          message: 'Jangan lupa untuk mengisi self-assessment untuk evaluasi kinerja tahunan.',
          type: 'warning',
          date: '2024-01-12T16:45:00Z',
          isRead: true,
          action: 'Isi Evaluasi'
        },
        {
          id: '5',
          title: 'Sertifikat Pelatihan Siap',
          message: 'Sertifikat untuk pelatihan "Project Management" sudah siap diunduh.',
          type: 'success',
          date: '2024-01-11T11:20:00Z',
          isRead: true,
          action: 'Unduh Sertifikat'
        },
        {
          id: '6',
          title: 'Update Kebijakan HR',
          message: 'Terdapat perubahan pada kebijakan cuti tahunan. Silakan baca detailnya.',
          type: 'info',
          date: '2024-01-10T08:30:00Z',
          isRead: true
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Gagal memuat notifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    
    switch (notification.type) {
      case 'training':
        Alert.alert('Info', 'Redirect ke halaman pelatihan');
        break;
      case 'performance':
        Alert.alert('Info', 'Redirect ke halaman kinerja');
        break;
      case 'warning':
        Alert.alert('Info', 'Redirect ke halaman evaluasi');
        break;
      case 'success':
        Alert.alert('Info', 'Redirect ke halaman sertifikat');
        break;
      default:
        Alert.alert('Info', 'Aksi tidak tersedia');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'training': return 'school';
      case 'performance': return 'trending-up';
      case 'warning': return 'warning';
      case 'success': return 'checkmark-circle';
      case 'info': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'training': return '#2196F3';
      case 'performance': return '#FF9800';
      case 'warning': return '#F44336';
      case 'success': return '#4CAF50';
      case 'info': return '#667eea';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    if (diffInHours < 48) return 'Kemarin';
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredNotifications = notifications.filter(notif => 
    selectedFilter === 'all' || !notif.isRead
  );

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

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
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Notifikasi</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {notifications.length} notifikasi total
          </Text>
        </View>
      </LinearGradient>

      {/* Filter and Actions */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === 'all' && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === 'all' && styles.filterTabTextActive
            ]}>
              Semua
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === 'unread' && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter('unread')}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === 'unread' && styles.filterTabTextActive
            ]}>
              Belum Dibaca
            </Text>
          </TouchableOpacity>
        </View>
        
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Tandai Semua Dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <View style={styles.content}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.notificationCardUnread
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.isRead && styles.notificationTitleUnread
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.date)}
                    </Text>
                  </View>
                  {!notification.isRead && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
                
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                
                {notification.action && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleNotificationAction(notification)}
                  >
                    <Text style={styles.actionButtonText}>
                      {notification.action}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#667eea" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? 'Belum ada notifikasi yang diterima'
                : 'Semua notifikasi sudah dibaca'
              }
            </Text>
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
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: '#667eea',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
  },
  markAllButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  markAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  notificationContent: {
    padding: 20,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginTop: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginRight: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
