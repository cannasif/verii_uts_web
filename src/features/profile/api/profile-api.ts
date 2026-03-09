import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export interface UserProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePictureUrl?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  bio?: string | null;
}

export interface UpdateMyProfileRequest {
  profilePictureUrl?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  bio?: string | null;
}

export async function getMyProfile() {
  return apiClient.get<never, ApiResponse<UserProfile>>('/api/user-profiles/me');
}

export async function updateMyProfile(request: UpdateMyProfileRequest) {
  return apiClient.put<never, ApiResponse<UserProfile>>('/api/user-profiles/me', request);
}

export async function uploadMyProfilePicture(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<never, ApiResponse<UserProfile>>('/api/user-profiles/me/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
