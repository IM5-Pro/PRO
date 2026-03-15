/**
 * PunchContext
 * Global punch in/out state shared across Dashboard, Header, and Attendance page.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import API from '../api/client';
import { ATTENDANCE_ENDPOINTS } from '../api/endpoints';
import { getCookie, removeCookie, setCookie } from '../utils/cookies';
import { useAuth } from './AuthContext';

const PUNCH_ROLES = ['employee', 'manager', 'hr_admin'];
const PUNCH_IN_COOKIE = 'isPunchedIn';
const PUNCH_IN_TIME_COOKIE = 'punchInTime';
const PUNCHED_TODAY_COOKIE = 'hasPunchedInToday';
const DAILY_WORKING_HOURS_COOKIE = 'dailyWorkingHours';
const PUNCH_COOKIE_MAX_AGE = 24 * 60 * 60;

const PunchContext = createContext(null);

export const PunchProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const canPunch = isAuthenticated && PUNCH_ROLES.includes(String(user?.role || '').toLowerCase());

  const [punchStatus, setPunchStatus] = useState(null); // null | 'in' | 'out'
  const [punchInTime, setPunchInTime] = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [punchInLocation, setPunchInLocation] = useState(null);
  const [punchOutLocation, setPunchOutLocation] = useState(null);
  const [workingHours, setWorkingHours] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Office');
  const [coords, setCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const loadedRef = useRef(false);
  const userIdentity = user?._id || user?.id || user?.email || null;

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });

  const toDayKey = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  const extractAttendanceList = (response) => {
    const payload = response?.data || {};

    if (Array.isArray(payload.attendance)) return payload.attendance;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.records)) return payload.records;

    return [];
  };

  const extractAttendanceRecord = (response) => {
    const payload = response?.data || {};

    if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return payload.data;
    }

    if (payload?.attendance && typeof payload.attendance === 'object' && !Array.isArray(payload.attendance)) {
      return payload.attendance;
    }

    return payload;
  };

  const clearPunchState = useCallback(() => {
    setPunchStatus(null);
    setPunchInTime(null);
    setPunchOutTime(null);
    setPunchInLocation(null);
    setPunchOutLocation(null);
    setWorkingHours(null);
    setAttendanceStatus(null);
  }, []);

  const syncPunchStorage = useCallback((status, hasPunchedToday, checkInTime = null) => {
    if (status === 'in') {
      setCookie(PUNCH_IN_COOKIE, 'true', PUNCH_COOKIE_MAX_AGE);
      if (checkInTime) {
        setCookie(PUNCH_IN_TIME_COOKIE, checkInTime, PUNCH_COOKIE_MAX_AGE);
      }
    } else {
      removeCookie(PUNCH_IN_COOKIE);
      removeCookie(PUNCH_IN_TIME_COOKIE);
    }

    if (hasPunchedToday) {
      setCookie(PUNCHED_TODAY_COOKIE, 'true', PUNCH_COOKIE_MAX_AGE);
    } else {
      removeCookie(PUNCHED_TODAY_COOKIE);
      removeCookie(DAILY_WORKING_HOURS_COOKIE);
    }
  }, []);

  // Load geolocation once
  useEffect(() => {
    if (!canPunch || !navigator.geolocation) return;
    let isCancelled = false;

    const getPosition = (options) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    const resolveLabel = async (c) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${c.latitude}&lon=${c.longitude}&format=json&addressdetails=1&zoom=18`,
        { headers: { 'Accept-Language': 'en-IN,en' } }
      );
      const data = await res.json();

      const locality =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.suburb ||
        data.address?.county ||
        data.address?.state_district ||
        data.address?.state ||
        data.name ||
        '';
      const country = data.address?.country || '';

      if (locality && country) return `${locality}, ${country}`;
      if (country) return country;
      return 'Office';
    };

    const detectLocation = async () => {
      setLocationLoading(true);
      try {
        let position;

        try {
          position = await getPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        } catch {
          position = await getPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          });
        }

        if (isCancelled) return;

        const c = position.coords;
        setCoords({ latitude: c.latitude, longitude: c.longitude });

        try {
          const label = await resolveLabel(c);
          if (!isCancelled) {
            setLocationLabel(label);
          }
        } catch {
          // Keep default label when reverse geocoding fails.
        }
      } catch {
        if (!isCancelled) {
          setLocationLabel('Office');
        }
      } finally {
        if (!isCancelled) {
          setLocationLoading(false);
        }
      }
    };

    detectLocation();

    return () => {
      isCancelled = true;
    };
  }, [canPunch]);

  useEffect(() => {
    loadedRef.current = false;

    if (!canPunch) {
      clearPunchState();
      syncPunchStorage(null, false);
      return;
    }

    if (getCookie(PUNCH_IN_COOKIE) === 'true') {
      setPunchStatus('in');
    }
  }, [canPunch, userIdentity, clearPunchState, syncPunchStorage]);

  // Load today's attendance from backend
  const loadTodayStatus = useCallback(async () => {
    if (!canPunch) {
      clearPunchState();
      syncPunchStorage(null, false);
      return;
    }

    setLoading(true);
    try {
      clearPunchState();
      const res = await API.get(ATTENDANCE_ENDPOINTS.own(5));
      const records = extractAttendanceList(res);
      const todayKey = toDayKey(new Date());

      const openRecord = records.find((r) => r?.checkInTime && !r?.checkOutTime);
      const datedRecord = records.find((r) => toDayKey(r?.attendanceDate || r?.checkInTime) === todayKey);
      const todayRecord = openRecord || datedRecord || records[0] || null;

      if (todayRecord) {
        if (todayRecord.checkInTime) {
          setPunchInTime(formatTime(todayRecord.checkInTime));
          setPunchInLocation(todayRecord.checkInLocation?.label || null);
        }

        if (todayRecord.checkOutTime) {
          setPunchOutTime(formatTime(todayRecord.checkOutTime));
          setPunchOutLocation(todayRecord.checkOutLocation?.label || null);
          setWorkingHours(todayRecord.workingHours);
          setPunchStatus('out');
          syncPunchStorage('out', true, todayRecord.checkInTime || null);
        } else if (todayRecord.checkInTime) {
          setPunchStatus('in');
          syncPunchStorage('in', true, todayRecord.checkInTime);
        } else {
          syncPunchStorage(null, true);
        }

        setAttendanceStatus(todayRecord.status);
      } else {
        clearPunchState();
        syncPunchStorage(null, false);
      }
    } catch {
      clearPunchState();
    } finally {
      setLoading(false);
    }
  }, [canPunch, clearPunchState, syncPunchStorage]);

  useEffect(() => {
    if (!loadedRef.current && canPunch) {
      loadedRef.current = true;
      loadTodayStatus();
    }
  }, [canPunch, loadTodayStatus]);

  const buildLocationPayload = useCallback(() => ({
    label: locationLabel,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
  }), [locationLabel, coords]);

  const punchIn = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.post(ATTENDANCE_ENDPOINTS.checkIn, {
        checkInLocation: buildLocationPayload(),
      });
      const record = extractAttendanceRecord(res);
      if (record?.checkInTime) {
        setPunchInTime(formatTime(record.checkInTime));
        setPunchInLocation(record.checkInLocation?.label || locationLabel);
        setAttendanceStatus(record.status);
        syncPunchStorage('in', true, record.checkInTime);
      } else {
        const fallbackCheckInTime = new Date().toISOString();
        setPunchInTime(formatTime(fallbackCheckInTime));
        setPunchInLocation(locationLabel);
        syncPunchStorage('in', true, fallbackCheckInTime);
      }
      setPunchOutTime(null);
      setPunchOutLocation(null);
      setWorkingHours(null);
      setPunchStatus('in');
      return { status: 'in', conflict: false };
    } catch (error) {
      if (error?.response?.status === 409) {
        await loadTodayStatus();
        return {
          status: 'in',
          conflict: true,
          message: error?.response?.data?.message || 'Already checked in today.',
        };
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }, [buildLocationPayload, locationLabel, loadTodayStatus, syncPunchStorage]);

  const punchOut = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.post(ATTENDANCE_ENDPOINTS.checkOut, {
        checkOutLocation: buildLocationPayload(),
      });
      const record = extractAttendanceRecord(res);
      if (record?.checkOutTime) {
        setPunchOutTime(formatTime(record.checkOutTime));
        setPunchOutLocation(record.checkOutLocation?.label || locationLabel);
        setWorkingHours(record.workingHours);
        setAttendanceStatus(record.status);
        syncPunchStorage('out', true, record.checkInTime || null);
      } else {
        setPunchOutTime(formatTime(new Date().toISOString()));
        setPunchOutLocation(locationLabel);
        syncPunchStorage('out', true);
      }

      if (record?.workingHours != null) {
        setCookie(DAILY_WORKING_HOURS_COOKIE, String(record.workingHours), PUNCH_COOKIE_MAX_AGE);
      }

      setPunchStatus('out');
      return { status: 'out', conflict: false };
    } catch (error) {
      if (error?.response?.status === 409) {
        await loadTodayStatus();
        return {
          status: 'out',
          conflict: true,
          message: error?.response?.data?.message || 'Attendance already updated.',
        };
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }, [buildLocationPayload, locationLabel, syncPunchStorage]);

  return (
    <PunchContext.Provider value={{
      canPunch,
      punchStatus,
      punchInTime,
      punchOutTime,
      punchInLocation,
      punchOutLocation,
      workingHours,
      attendanceStatus,
      loading,
      locationLabel,
      locationLoading,
      punchIn,
      punchOut,
      reload: loadTodayStatus,
    }}>
      {children}
    </PunchContext.Provider>
  );
};

export const usePunch = () => useContext(PunchContext);
