import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Karyawan } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function PerformanceScreen() {
  const { user } = useAuth();
  const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
  const [kpiBulanan, setKpiBulanan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading performance data...');
      
      const profileData = await apiService.getMyProfile();
      console.log('✅ Profile loaded:', profileData.nama);
      setKaryawan(profileData);
      
      // Load KPI Bulanan dengan error handling terpisah
      try {
        console.log('🔄 Loading KPI Bulanan...');
        const kpiBulananData = await apiService.getMyKpiBulanan();
        console.log('✅ KPI Bulanan loaded:', kpiBulananData.length, 'records');
        setKpiBulanan(kpiBulananData);
      } catch (kpiError: any) {
        console.warn('⚠️ Failed to load KPI Bulanan:', kpiError.message);
        // Set empty array jika gagal, tapi jangan throw error
        setKpiBulanan([]);
      }
    } catch (error) {
      console.error('❌ Error loading performance data:', error);
      Alert.alert('Error', 'Gagal memuat data kinerja');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  };

  const getCurrentYearData = () => {
    const currentYear = new Date().getFullYear();
    const kpiData = karyawan?.KPI || [];
    
    return {
      kpi: kpiData.find(kpi => kpi.year === currentYear),
      allKPI: kpiData.sort((a, b) => a.year - b.year),
    };
  };

  const prepareChartData = (data: any[]) => {
    if (!data || data.length === 0) {
      return {
        labels: ['Tidak ada data'],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
        }]
      };
    }

    const labels = data.map(item => item.year.toString());
    const values = data.map(item => item.score);

    return {
      labels: labels.length > 6 ? labels.slice(-6) : labels,
      datasets: [{
        data: values.length > 6 ? values.slice(-6) : values,
        color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#4CAF50' };
    if (score >= 80) return { level: 'Good', color: '#8BC34A' };
    if (score >= 70) return { level: 'Average', color: '#FFC107' };
    if (score >= 60) return { level: 'Below Average', color: '#FF9800' };
    return { level: 'Poor', color: '#F44336' };
  };

  const getMonthName = (monthNumber: string | number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const idx = parseInt(monthNumber.toString(), 10) - 1;
    return months[idx] || monthNumber;
  };

  const getFilteredMonthlyKpi = () => {
    return kpiBulanan.filter(item => {
      const yearMatch = item.tahun === selectedYear;
      const monthMatch = parseInt(item.bulan, 10) === selectedMonth;
      return yearMatch && monthMatch;
    });
  };

  const getMonthlyChartData = () => {
    const yearData = kpiBulanan
      .filter(item => item.tahun === selectedYear)
      .sort((a, b) => parseInt(a.bulan, 10) - parseInt(b.bulan, 10));

    if (yearData.length === 0) {
      return {
        labels: ['Tidak ada data'],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
        }]
      };
    }

    return {
      labels: yearData.map(item => String(getMonthName(item.bulan)).substring(0, 3)),
      datasets: [{
        data: yearData.map(item => item.kpiFinal),
        color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  const currentData = getCurrentYearData();
  const chartData = prepareChartData(currentData.allKPI);
  const currentScore = currentData.kpi?.score;
  const performanceLevel = currentScore ? getPerformanceLevel(currentScore) : null;

  // Helper untuk membulatkan score (pembulatan matematika untuk tampilan)
  const formatScore = (score: number): string => {
    return Math.round(score).toString();
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerWave} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Kinerja & Penilaian</Text>
          <Text style={styles.headerSubtitle}>
            Pantau perkembangan kinerja Anda
          </Text>
        </View>
      </View>

      {/* Content Wrapper with curved top */}
      <View style={styles.contentWrapper}>
      {/* View Mode Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'yearly' && styles.tabActive]}
          onPress={() => setViewMode('yearly')}
        >
          <Text style={[styles.tabText, viewMode === 'yearly' && styles.tabTextActive]}>
            KPI Tahunan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'monthly' && styles.tabActive]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.tabText, viewMode === 'monthly' && styles.tabTextActive]}>
            KPI Bulanan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Filter (only show in monthly mode) */}
      {viewMode === 'monthly' && (
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Tahun</Text>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowYearPicker(!showYearPicker)}
              >
                <Text style={styles.filterButtonText}>{selectedYear}</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Bulan</Text>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowMonthPicker(!showMonthPicker)}
              >
                <Text style={styles.filterButtonText}>{getMonthName(selectedMonth)}</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Year Picker */}
          {showYearPicker && (
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[...Array(5)].map((_, idx) => {
                  const year = new Date().getFullYear() - idx;
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[styles.pickerItem, selectedYear === year && styles.pickerItemActive]}
                      onPress={() => {
                        setSelectedYear(year);
                        setShowYearPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextActive]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
          
          {/* Month Picker */}
          {showMonthPicker && (
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[...Array(12)].map((_, idx) => {
                  const month = idx + 1;
                  return (
                    <TouchableOpacity
                      key={month}
                      style={[styles.pickerItem, selectedMonth === month && styles.pickerItemActive]}
                      onPress={() => {
                        setSelectedMonth(month);
                        setShowMonthPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, selectedMonth === month && styles.pickerItemTextActive]}>
                        {getMonthName(month)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        {viewMode === 'yearly' ? (
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Text style={styles.currentTitle}>KPI Tahun Ini</Text>
              <Text style={styles.currentYear}>{new Date().getFullYear()}</Text>
            </View>
            
            {currentScore ? (
              <View style={styles.currentContent}>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>{formatScore(currentScore)}</Text>
                  <Text style={styles.scoreLabel}>Skor</Text>
                </View>
                
                {performanceLevel && (
                  <View style={styles.levelContainer}>
                    <View style={[
                      styles.levelBadge,
                      { backgroundColor: performanceLevel.color }
                    ]}>
                      <Text style={styles.levelText}>{performanceLevel.level}</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="document-outline" size={48} color="#ccc" />
                <Text style={styles.noDataText}>
                  Belum ada data KPI untuk tahun ini
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Monthly KPI Card */
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Text style={styles.currentTitle}>KPI Bulanan</Text>
              <Text style={styles.currentYear}>{getMonthName(selectedMonth)} {selectedYear}</Text>
            </View>
            
            {getFilteredMonthlyKpi().map((monthData, index) => {
              const performanceLvl = getPerformanceLevel(monthData.kpiFinal);
              return (
                <View key={index}>
                  <View style={styles.currentContent}>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreValue}>{formatScore(monthData.kpiFinal)}</Text>
                      <Text style={styles.scoreLabel}>KPI Final</Text>
                    </View>
                    
                    <View style={styles.levelContainer}>
                      <View style={[
                        styles.levelBadge,
                        { backgroundColor: performanceLvl.color }
                      ]}>
                        <Text style={styles.levelText}>{performanceLvl.level}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Monthly Breakdown */}
                  <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownTitle}>Breakdown Komponen</Text>
                    
                    <View style={styles.breakdownCard}>
                      <View style={styles.breakdownItem}>
                        <View style={styles.breakdownIconContainer}>
                          <Ionicons name="calendar-outline" size={20} color="#1a1a1a" />
                        </View>
                        <View style={styles.breakdownContent}>
                          <Text style={styles.breakdownLabel}>Presensi</Text>
                          <View style={styles.breakdownValueContainer}>
                            <Text style={styles.breakdownScore}>
                              {formatScore(typeof monthData.scorePresensi === 'string' 
                                ? parseFloat(monthData.scorePresensi) 
                                : monthData.scorePresensi)}
                            </Text>
                            <Text style={styles.breakdownBobot}>Bobot: {monthData.bobotPresensi}%</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.breakdownDivider} />

                      <View style={styles.breakdownItem}>
                        <View style={styles.breakdownIconContainer}>
                          <Ionicons name="school-outline" size={20} color="#1a1a1a" />
                        </View>
                        <View style={styles.breakdownContent}>
                          <Text style={styles.breakdownLabel}>Pelatihan</Text>
                          <View style={styles.breakdownValueContainer}>
                            <Text style={styles.breakdownScore}>
                              {formatScore(monthData.scorePelatihan)}
                            </Text>
                            <Text style={styles.breakdownBobot}>Bobot: {monthData.bobotPelatihan}%</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.breakdownDivider} />

                      <View style={styles.breakdownItem}>
                        <View style={styles.breakdownIconContainer}>
                          <Ionicons name="star-outline" size={20} color="#1a1a1a" />
                        </View>
                        <View style={styles.breakdownContent}>
                          <Text style={styles.breakdownLabel}>Indikator Lain</Text>
                          <View style={styles.breakdownValueContainer}>
                            <Text style={styles.breakdownScore}>
                              {formatScore(monthData.kpiIndikatorLain)}
                            </Text>
                            <Text style={styles.breakdownBobot}>Rata-rata</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
            
            {getFilteredMonthlyKpi().length === 0 && (
              <View style={styles.noDataContainer}>
                <Ionicons name="document-outline" size={48} color="#ccc" />
                <Text style={styles.noDataText}>
                  Belum ada data KPI untuk {getMonthName(selectedMonth)} {selectedYear}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Chart Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {viewMode === 'yearly' ? 'Riwayat KPI Tahunan' : `Trend KPI Bulanan ${selectedYear}`}
          </Text>
          
          {viewMode === 'yearly' && chartData.datasets[0].data.length > 0 && chartData.datasets[0].data[0] !== 0 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#1a1a1a',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          ) : viewMode === 'monthly' && getMonthlyChartData().datasets[0].data.length > 0 && getMonthlyChartData().datasets[0].data[0] !== 0 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={getMonthlyChartData()}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#1a1a1a',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          ) : (
            <View style={styles.noChartContainer}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={styles.noChartText}>
                Tidak ada data untuk ditampilkan
              </Text>
            </View>
          )}
        </View>

        {/* Performance Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips Peningkatan Kinerja</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Tetapkan target yang jelas dan terukur
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Konsisten dalam menyelesaikan tugas
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Ikuti pelatihan untuk meningkatkan skill
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Minta feedback dari atasan secara berkala
              </Text>
            </View>
          </View>
        </View>

        {/* Historical Data */}
        {currentData.allKPI.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Riwayat Lengkap</Text>
            {currentData.allKPI.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyYear}>{item.year}</Text>
                  {item.notes && (
                    <Text style={styles.historyNotes}>{item.notes}</Text>
                  )}
                </View>
                <View style={styles.historyScore}>
                  <Text style={styles.historyScoreValue}>{formatScore(item.score)}</Text>
                  <View style={[
                    styles.historyScoreBar,
                    { 
                      width: `${(item.score / 100) * 60}%`,
                      backgroundColor: getPerformanceLevel(item.score).color
                    }
                  ]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      {/* End Content Wrapper */}
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
  contentWrapper: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    marginTop: -50,
    paddingTop: 50,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  currentCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currentYear: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  currentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelContainer: {
    alignItems: 'center',
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  levelText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 20,
  },
  noChartContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noChartText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  tipsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  tipsList: {
    gap: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  historyInfo: {
    flex: 1,
  },
  historyYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyScore: {
    alignItems: 'flex-end',
    width: 80,
  },
  historyScoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  historyScoreBar: {
    height: 4,
    borderRadius: 2,
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -30,
    marginBottom: 16,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 14,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  pickerContainer: {
    marginTop: 10,
    paddingVertical: 8,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  pickerItemActive: {
    backgroundColor: '#1a1a1a',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pickerItemTextActive: {
    color: 'white',
  },
  breakdownContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  breakdownCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakdownContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  breakdownValueContainer: {
    alignItems: 'flex-end',
  },
  breakdownScore: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  breakdownBobot: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
});
