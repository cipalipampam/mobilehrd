import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://10.234.19.185:5000/api'; // Your computer's IP address

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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (response.status === 401) {
        await this.removeToken();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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

  // Kehadiran methods
  async checkIn(data: { lokasi?: string; keterangan?: string }): Promise<Kehadiran> {
    const response = await this.makeRequest('/kehadiran/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async checkOut(data?: { keterangan?: string }): Promise<Kehadiran> {
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
}

export const apiService = new ApiService();
