import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../../services/api"; // ← Correct path for src/store/slices structure

/* ======================
  FETCH NOTIFICATIONS
====================== */
export const fetchNotifications = createAsyncThunk(
  "user/fetchNotifications",
  async (params = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.page) queryParams.append('page', params.page);
      if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
      if (params.type) queryParams.append('type', params.type);
      if (params.priority) queryParams.append('priority', params.priority);
      
      const response = await authAPI.get(`/notifications?${queryParams.toString()}`);
      return response.data.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch notifications";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  GET UNREAD COUNT
====================== */
export const fetchUnreadCount = createAsyncThunk(
  "user/fetchUnreadCount",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.get('/notifications/unread-count');
      return response.data.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch unread count";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  MARK AS READ
====================== */
export const markNotificationRead = createAsyncThunk(
  "user/markNotificationRead",
  async (notificationId, thunkAPI) => {
    try {
      const response = await authAPI.put(`/notifications/${notificationId}/read`);
      return { notificationId, data: response.data.data };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to mark notification as read";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  MARK ALL AS READ
====================== */
export const markAllNotificationsRead = createAsyncThunk(
  "user/markAllNotificationsRead",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.put('/notifications/mark-all-read');
      return response.data.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to mark all notifications as read";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  DELETE NOTIFICATION
====================== */
export const deleteNotification = createAsyncThunk(
  "user/deleteNotification",
  async (notificationId, thunkAPI) => {
    try {
      await authAPI.delete(`/notifications/${notificationId}`);
      return notificationId;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete notification";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  ARCHIVE NOTIFICATION
====================== */
export const archiveNotification = createAsyncThunk(
  "user/archiveNotification",
  async (notificationId, thunkAPI) => {
    try {
      const response = await authAPI.put(`/notifications/${notificationId}/archive`);
      return { notificationId, data: response.data.data };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to archive notification";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  UPDATE THEME
====================== */
export const updateTheme = createAsyncThunk(
  'user/updateTheme',
  async (theme, { rejectWithValue }) => {
    try {
      await authAPI.put('/user/preferences', { theme });
      localStorage.setItem('theme', theme);
      return theme;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ======================
  UPDATE NOTIFICATION PREFERENCES
====================== */
export const updateNotificationPreferences = createAsyncThunk(
  'user/updateNotificationPreferences',
  async (prefs, { rejectWithValue }) => {
    try {
      const response = await authAPI.put('/user/preferences', prefs);
      return response.data.data.preferences;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ======================
  CHANGE PASSWORD
====================== */
export const changePassword = createAsyncThunk(
  'user/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authAPI.put('/user/password', { currentPassword, newPassword });
      return response.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ======================
  FETCH USER PROFILE
====================== */
export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.get('/user/profile');
      return response.data.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch user profile";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  UPDATE USER PROFILE
====================== */
export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (profileData, thunkAPI) => {
    try {
      const response = await authAPI.put('/user/profile', profileData);
      return response.data.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to update profile";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  INITIAL STATE
====================== */
const initialState = {
  // Notifications
  notifications: [],
  unreadCount: 0,
  notificationsMeta: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  },
  
  // Profile
  profile: null,
  
  // Loading states
  loading: {
    notifications: false,
    profile: false,
    action: false,
  },
  
  // Error and success
  error: null,
  successMessage: null,
};

/* ======================
  USER SLICE
====================== */
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Add notification from socket
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },

    // Update notification from socket
    updateNotification: (state, action) => {
      const index = state.notifications.findIndex(
        n => n._id === action.payload._id
      );
      if (index !== -1) {
        const wasUnread = !state.notifications[index].isRead;
        const isNowRead = action.payload.isRead;

        state.notifications[index] = { ...state.notifications[index], ...action.payload };

        if (wasUnread && isNowRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },

    // Remove notification from socket
    removeNotification: (state, action) => {
      const notification = state.notifications.find(
        n => n._id === action.payload
      );
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(
        n => n._id !== action.payload
      );
    },
    
    // Clear messages
    clearUserMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    
    // Reset user state
    resetUserState: (state) => {
      return initialState;
    },
  },
  
  extraReducers: (builder) => {
    /* ===== FETCH NOTIFICATIONS ===== */
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading.notifications = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading.notifications = false;
        state.notifications = action.payload.notifications || [];
        state.notificationsMeta = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          total: action.payload.total || 0,
          limit: action.payload.limit || 10,
        };
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading.notifications = false;
        state.error = action.payload?.message || "Failed to fetch notifications";
      });

    /* ===== FETCH UNREAD COUNT ===== */
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount || 0;
      });

    /* ===== MARK AS READ ===== */
    builder
      .addCase(markNotificationRead.pending, (state) => {
        state.loading.action = true;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.loading.action = false;
        const notification = state.notifications.find(
          n => n._id === action.payload.notificationId
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload?.message || "Failed to mark as read";
      });

    /* ===== MARK ALL AS READ ===== */
    builder
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.loading.action = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.loading.action = false;
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
        state.successMessage = "All notifications marked as read";
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload?.message || "Failed to mark all as read";
      });

    /* ===== DELETE NOTIFICATION ===== */
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.loading.action = true;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading.action = false;
        const notification = state.notifications.find(
          n => n._id === action.payload
        );
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(
          n => n._id !== action.payload
        );
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload?.message || "Failed to delete notification";
      });

    /* ===== ARCHIVE NOTIFICATION ===== */
    builder
      .addCase(archiveNotification.pending, (state) => {
        state.loading.action = true;
      })
      .addCase(archiveNotification.fulfilled, (state, action) => {
        state.loading.action = false;
        const notification = state.notifications.find(
          n => n._id === action.payload.notificationId
        );
        if (notification) {
          notification.archived = true;
        }
      })
      .addCase(archiveNotification.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload?.message || "Failed to archive notification";
      });

    /* ===== FETCH PROFILE ===== */
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload.user;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload?.message || "Failed to fetch profile";
      });

    /* ===== UPDATE PROFILE ===== */
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload.user;
        state.successMessage = "Profile updated successfully";
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload?.message || "Failed to update profile";
      });

    /* ===== UPDATE THEME ===== */
    builder
      .addCase(updateTheme.fulfilled, (state, action) => {
        if (state.profile?.preferences) {
          state.profile.preferences.theme = action.payload;
        }
        state.successMessage = "Theme saved";
      })
      .addCase(updateTheme.rejected, (state, action) => {
        state.error = action.payload || "Failed to save theme";
      });

    /* ===== UPDATE NOTIFICATION PREFERENCES ===== */
    builder
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.loading.action = false;
        if (state.profile?.preferences && action.payload) {
          state.profile.preferences = action.payload;
        }
        state.successMessage = "Notification preferences saved";
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || "Failed to save preferences";
      });

    /* ===== CHANGE PASSWORD ===== */
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading.action = false;
        state.successMessage = action.payload || "Password changed successfully";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload || "Failed to change password";
      });
  },
});

export const {
  addNotification,
  updateNotification,
  removeNotification,
  clearUserMessages,
  resetUserState,
} = userSlice.actions;


export default userSlice.reducer;