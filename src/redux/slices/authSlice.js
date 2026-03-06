import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../../services/api";

/* ======================
       REGISTER USER
====================== */
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData, thunkAPI) => {
    try {
      const res = await authAPI.post('/auth/register', formData);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Registration failed";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
        LOGIN USER
====================== */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, thunkAPI) => {
    try {
      console.log("I got here mehn...");

      const res = await authAPI.post('/auth/login', { email, password });

      const { user, tokens, role } = res.data.data;

      // Persist session
      localStorage.setItem("token", tokens.accessToken);
      localStorage.setItem("role", role || user?.role || "");
      localStorage.setItem("user", JSON.stringify(user));
      // Persist theme so it's applied immediately on next page load
      if (user?.preferences?.theme) {
        localStorage.setItem("theme", user.preferences.theme);
      }

      return {
        token: tokens.accessToken,
        role: role || user?.role || null,
        user,
      };
    } catch (err) {
      const status = err.response?.status;
  const serverMessage = err.response?.data?.message;

  let message;

  if (!err.response) {
    // Network error — server unreachable
    message = "Unable to connect. Please check your internet connection.";
  } else if (status === 401) {
    // Wrong credentials — use server message or fallback
    message = serverMessage || "Invalid email or password.";
  } else if (status === 400) {
    // Validation error
    message = serverMessage || "Please check your input and try again.";
  } else if (status === 500) {
    // Server-side error
    message = "Something went wrong on our end. Please try again later.";
  } else {
    message = serverMessage || "Login failed. Please try again.";
  }

  return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
       INITIAL STATE
====================== */
const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  role: localStorage.getItem("role") || null,
  // Removed isAuthenticated - rely on token presence and ProtectedRoute validation

  loading: false,
  error: null,
  successMessage: null,
};

/* ======================
        AUTH SLICE
====================== */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      // isAuthenticated removed - rely on token presence
      state.error = null;
      state.successMessage = null;

      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    },

    clearAuthMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    /* ===== REGISTER USER ===== */
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage =
          action.payload.message || "Registration successful";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      });

    /* ===== LOGIN USER ===== */
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.user = action.payload.user;
        // isAuthenticated removed - rely on token presence
        state.successMessage = "Login successful";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        // isAuthenticated removed - rely on token presence
        state.error = action.payload.message;
      });
  },
});

export const { logout, clearAuthMessages } = authSlice.actions;
export default authSlice.reducer;