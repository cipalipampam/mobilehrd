import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://192.168.0.107:5000/api'; // Your computer's IP address

export interface User {
  username: string;
  email: string;
  role: 'KARYAWAN' | 'HR';
  token: string;
}

export interface Karyawan {
  id: string;
  nama: string;
  gender: 'Pria' | 'Wanita';
  alamat?: string;
  no_telp?: string;
  tanggal_lahir?: string;
  pendidikan: string;
  tanggal_masuk: string;
  jalur_rekrut: string;
  umur?: number;
  masaKerja?: number;
  Departemen: Array<{ id: string; nama: string }>;
  Jabatan: Array<{ id: string; nama: string }>;
  KPI: Array<{
    id: string;
    year: number;
    score: number;
    notes?: string;
  }>;
  Rating: Array<{
    id: string;
    year: number;
    score: number;
    notes?: string;
  }>;
  pelatihanDetail: Array<{
    id: string;
    skor?: number;
    catatan?: string;
    status?: TrainingStatus;
    respondedAt?: string | null;
    alasanPenolakan?: string | null;
    hadir?: boolean;
    pelatihan: PelatihanInfo;
  }>;
}

export interface PelatihanInfo {
  id: string;
  nama: string;
  tanggal: string;
  lokasi: string;
}

export interface Pelatihan {
  id: string;
  nama: string;
  tanggal: string;
  lokasi: string;
  jenis?: 'WAJIB' | 'OPSIONAL';
  peserta: Array<{
    id: string;
    skor?: number;
    catatan?: string;
    status?: TrainingStatus;
    respondedAt?: string | null;
    alasanPenolakan?: string | null;
    hadir?: boolean;
  }>;
}

export type TrainingStatus = 'INVITED' | 'CONFIRMED' | 'DECLINED' | 'ATTENDED';

export type KehadiranStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA' | 'BELUM_ABSEN';

export type IzinJenis = 'IZIN' | 'SAKIT';
export type IzinStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IzinRequest {
  id: string;
  karyawanId: string;
  tanggal: string;
  jenis: IzinJenis;
  keterangan?: string | null;
  fileUrl?: string | null;
  status: IzinStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Kehadiran {
  id: string;
  karyawanId: string;
  tanggal: string;
  waktuMasuk?: string | null;
  waktuKeluar?: string | null;
  status: KehadiranStatus;
  lokasi?: string | null;
  keterangan?: string | null;
  createdAt: string;
  updatedAt: string;
  karyawan?: {
    id: string;
    nama: string;
  };
}

export interface KehadiranStats {
  total: number;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  belumAbsen: number;
}

export interface KehadiranHistoryResponse {
  status: number;
  message: string;
  data: Kehadiran[];
  stats: KehadiranStats;
}

export interface KpiBulanan {
  karyawanId: string;
  namaKaryawan: string;
  departemenId: string;
  departemen: string;
  tahun: number;
  bulan: string;
  scorePresensi: string | number;
  scorePelatihan: number;
  bobotPresensi: number;
  bobotPelatihan: number;
  totalBobotIndikatorLain: number;
  totalScoreIndikatorLain: number;
  kpiIndikatorLain: number;
  kpiFinal: number;
}

class ApiService {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('auth_token', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  private async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔵 API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        await this.removeToken();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Error Response:`, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Response Success:`, data);
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<User> {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      await this.setToken(response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.makeRequest('/auth/me');
    return response.data;
  }

  // Karyawan methods
  async getMyProfile(): Promise<Karyawan> {
    const response = await this.makeRequest('/karyawan/me');
    const k = response.data;

    // Map backend fields (lowercase) to frontend expected fields (PascalCase)
    const mapped: any = {
      ...k,
      Departemen: k.departemen || [],
      Jabatan: k.jabatan || [],
      KPI: k.kpi || [],
      Rating: k.rating || [],
      pelatihanDetail: k.pelatihandetail || [],
    };

    return mapped as Karyawan;
  }

  async updateProfile(data: Partial<Karyawan>): Promise<Karyawan> {
    const response = await this.makeRequest('/karyawan/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const k = response.data;
    const mapped: any = {
      ...k,
      Departemen: k.departemen || [],
      Jabatan: k.jabatan || [],
      KPI: k.kpi || [],
      Rating: k.rating || [],
      pelatihanDetail: k.pelatihandetail || [],
    };

    return mapped as Karyawan;
  }

  // Training methods
  async getAvailableTrainings(): Promise<Pelatihan[]> {
    const response = await this.makeRequest('/pelatihan/available');
    return response.data;
  }

  async getMyTrainings(): Promise<any[]> {
    const response = await this.makeRequest('/pelatihan/my');
    return response.data;
  }

  async joinTraining(pelatihanId: string): Promise<any> {
    const response = await this.makeRequest(`/pelatihan/${pelatihanId}/join`, {
      method: 'POST'
    });
    return response.data;
  }

  async confirmTraining(pelatihanId: string): Promise<any> {
    const response = await this.makeRequest(`/pelatihan/${pelatihanId}/confirm`, {
      method: 'POST'
    });
    return response.data;
  }

  async declineTraining(pelatihanId: string, alasan?: string): Promise<any> {
    const response = await this.makeRequest(`/pelatihan/${pelatihanId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ alasan })
    });
    return response.data;
  }

  // Performance methods
  async getMyKPI(): Promise<any[]> {
    const response = await this.makeRequest('/karyawan/my-kpi');
    return response.data;
  }

  async getMyRatings(): Promise<any[]> {
    const response = await this.makeRequest('/karyawan/my-rating');
    return response.data;
  }

  async getMyKpiBulanan(params?: { bulan?: string; tahun?: number }): Promise<KpiBulanan[]> {
    const queryParams = new URLSearchParams();
    if (params?.bulan) queryParams.append('bulan', params.bulan);
    if (params?.tahun) queryParams.append('tahun', params.tahun.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/karyawan-features/my-kpi-bulanan${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest(endpoint);
    return response.data || [];
  }

  // Kehadiran methods
  async checkIn(data: { lokasi?: string; latitude?: number; longitude?: number; keterangan?: string }): Promise<Kehadiran> {
    const response = await this.makeRequest('/kehadiran/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async checkOut(data?: { latitude?: number; longitude?: number; keterangan?: string }): Promise<Kehadiran> {
    const response = await this.makeRequest('/kehadiran/check-out', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return response.data;
  }

  async getTodayKehadiran(): Promise<Kehadiran | null> {
    const response = await this.makeRequest('/kehadiran/today');
    return response.data;
  }

  async getKehadiranHistory(params?: { month?: number; year?: number }): Promise<KehadiranHistoryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/kehadiran/history${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  // Izin methods
  async submitIzinRequest(data: { tanggal: string; jenis: IzinJenis; keterangan?: string; file?: any }): Promise<IzinRequest> {
    const formData = new FormData();
    formData.append('tanggal', data.tanggal);
    formData.append('jenis', data.jenis);
    if (data.keterangan) formData.append('keterangan', data.keterangan);
    if (data.file) {
      formData.append('file', {
        uri: data.file.uri,
        type: data.file.type || 'image/jpeg',
        name: data.file.name || 'photo.jpg',
      } as any);
    }

    const token = await this.getToken();
    const response = await fetch(`${API_BASE_URL}/kehadiran/request`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  async getMyIzinRequests(): Promise<IzinRequest[]> {
    const response = await this.makeRequest('/kehadiran/my-requests');
    return response.data;
  }

  // Auth methods
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.makeRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Profile photo methods
  async uploadProfilePhoto(fileUri: string): Promise<User> {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'photo.jpg';
    const fileType = filename.split('.').pop()?.toLowerCase();
    
    formData.append('photo', {
      uri: fileUri,
      type: `image/${fileType === 'png' ? 'png' : 'jpeg'}`,
      name: filename,
    } as any);

    const token = await this.getToken();
    const response = await fetch(`${API_BASE_URL}/profile/photo`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  async deleteProfilePhoto(): Promise<User> {
    const response = await this.makeRequest('/profile/photo', {
      method: 'DELETE',
    });
    return response.data;
  }

  // Download certificate
  async downloadCertificate(pelatihanId: string): Promise<Blob> {
    const token = await this.getToken();
    const response = await fetch(`${API_BASE_URL}/pelatihan/${pelatihanId}/certificate`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.blob();
  }
}

export const apiService = new ApiService();
