import { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView, Modal,
  Animated, StyleSheet, useWindowDimensions, SafeAreaView,
  Platform, KeyboardAvoidingView, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import CustomDropdown from './components/CustomDropdown';
import { Account, restoreSession, signOut } from './auth/AuthStore';
import { SignInSignUpModal, ProfileScreen, VerificationModal } from './auth/AuthModals';

// ─── DATA ────────────────────────────────────────────────────────────────────

const initialClasses: ClassItem[] = [
  {
    id: 1,
    title: 'Morning Yoga Flow',
    teacher: 'Sofia Martens',
    category: 'Wellness',
    description: 'A gentle morning flow to start your day with clarity and energy.',
    address: 'Rue de la Loi 42, Brussels',
    lat: 50.8467, lng: 4.3572,
    date: '2026-03-10', time: '08:00', duration: 60,
    capacity: 15, enrolled: 8,
    basePrice: 22, discounts: { student: 20, retired: 30 },
    color: '#a8d8b9',
    roles: [], minPairs: 0, roleEnrollments: {}, waitingList: [], pairs: [],
  },
  {
    id: 2,
    title: 'Advanced Photography',
    teacher: 'Luca Fontaine',
    category: 'Art',
    description: 'Master composition, lighting and post-processing techniques.',
    address: 'Avenue Louise 149, Brussels',
    lat: 50.8355, lng: 4.3622,
    date: '2026-03-12', time: '14:00', duration: 120,
    capacity: 10, enrolled: 7,
    basePrice: 45, discounts: { student: 15, retired: 25 },
    color: '#f4c9a5',
    roles: [], minPairs: 0, roleEnrollments: {}, waitingList: [], pairs: [],
  },
  {
    id: 3,
    title: 'French Cuisine Basics',
    teacher: 'Amélie Dubois',
    category: 'Cooking',
    description: 'Learn authentic French techniques from a professional chef.',
    address: 'Place Sainte-Catherine 5, Brussels',
    lat: 50.852, lng: 4.348,
    date: '2026-03-15', time: '11:00', duration: 180,
    capacity: 8, enrolled: 8,
    basePrice: 65, discounts: { student: 10, retired: 20 },
    color: '#c5b8f0',
    roles: [], minPairs: 0, roleEnrollments: {}, waitingList: [], pairs: [],
  },
  {
    id: 4,
    title: 'Salsa Social',
    teacher: 'Sofia Martens',
    category: 'Sport',
    description: 'Weekly partner dance social — all levels welcome.',
    address: 'Rue du Bailli 38, Brussels',
    lat: 50.8395, lng: 4.3521,
    date: '2026-03-15', time: '19:00', duration: 90,
    capacity: 20, enrolled: 9,
    basePrice: 22, discounts: { student: 15, retired: 20 },
    color: '#f9c5d1',
    roles: [
      { name: 'Lead', capacity: 10 },
      { name: 'Follow', capacity: 10 },
    ],
    minPairs: 4,
    roleEnrollments: { Lead: 5, Follow: 4 },
    waitingList: [{ studentName: 'Carlos M.', role: 'Lead', timestamp: 1741996800000 }],
    pairs: [
      { name1: 'Maria', role1: 'Lead', name2: 'João', role2: 'Follow', isPreformed: true },
      { name1: 'Alex', role1: 'Lead', name2: 'Priya', role2: 'Follow', isPreformed: false },
      { name1: 'Sam', role1: 'Lead', name2: 'Lee', role2: 'Follow', isPreformed: false },
      { name1: 'Tom', role1: 'Lead', name2: 'Ana', role2: 'Follow', isPreformed: false },
    ],
  },
];

const categories = ['All', 'Wellness', 'Art', 'Cooking', 'Music', 'Language', 'Tech', 'Sport'];
const colorOptions = ['#a8d8b9', '#f4c9a5', '#c5b8f0', '#f9c5d1', '#b8d8f4', '#f4e6a5', '#f0b8b8'];

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Role {
  name: string;
  capacity: number;
}

interface Booking {
  pricePaid: string;
  bookingType?: 'solo' | 'pair';
  role?: string;
  partnerName?: string;
  partnerRole?: string;
  pairedWithBookingId?: number;
  ownWaitTimestamp?: number;  // set when solo booking goes onto waitingList (used for precise cancel)
}

interface ClassItem {
  id: number;
  title: string;
  teacher: string;
  category: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  date: string;
  time: string;
  duration: number;
  capacity: number;      // used only when roles.length === 0
  enrolled: number;
  basePrice: number;
  discounts: { student: number; retired: number };
  color: string;
  roles: Role[];
  minPairs: number;
  roleEnrollments: Record<string, number>;
  waitingList: { studentName: string; role: string; timestamp: number }[];
  pairs: { name1: string; role1: string; name2: string; role2: string; isPreformed: boolean }[];
}

interface NewClassForm {
  title: string;
  teacher: string;
  category: string;
  description: string;
  address: string;
  lat: string;
  lng: string;
  date: string;
  time: string;
  duration: string;
  capacity: string;      // used only when roles.length === 0
  basePrice: string;
  discounts: { student: string; retired: string };
  color: string;
  roles: { name: string; capacity: string }[];
  minPairs: string;
}

// ─── THEME ───────────────────────────────────────────────────────────────────

function useTheme(dark: boolean) {
  return {
    bg: dark ? '#0f1117' : '#f9f7f4',
    surface: dark ? '#1a1d27' : '#ffffff',
    surfaceAlt: dark ? '#22263a' : '#f2f0ed',
    border: dark ? '#2e3348' : '#e8e4de',
    text: dark ? '#eeeaf0' : '#1a1625',
    muted: dark ? '#7a7f9a' : '#8a8590',
    accent: '#7c5cbf',
    accentLight: dark ? '#9d7de0' : '#7c5cbf',
    green: '#3fba84',
    amber: '#f59e0b',
  };
}

type Theme = ReturnType<typeof useTheme>;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function FieldGroup({ label, children, theme }: { label: string; children: React.ReactNode; theme: Theme }) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={{
        fontSize: 12, fontWeight: '600', color: theme.muted,
        textTransform: 'uppercase', letterSpacing: 0.5,
        fontFamily: 'DMSans_600SemiBold',
      }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function RNInput({
  value, onChange, placeholder, theme, keyboardType, bgOverride, multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  theme: Theme;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  bgOverride?: string;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.muted}
      keyboardType={keyboardType ?? 'default'}
      multiline={multiline}
      style={{
        padding: 10, borderRadius: 9, borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: bgOverride ?? theme.surfaceAlt,
        color: theme.text, fontSize: 14,
        fontFamily: 'DMSans_400Regular',
        ...(multiline ? { minHeight: 72, textAlignVertical: 'top' } : {}),
      }}
    />
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const BLANK_NEW_CLASS: NewClassForm = {
  title: '', teacher: '', category: 'Wellness', description: '',
  address: '', lat: '', lng: '', date: '', time: '', duration: '60',
  capacity: '10', basePrice: '30',
  discounts: { student: '20', retired: '30' }, color: '#a8d8b9',
  roles: [], minPairs: '0',
};

export default function ClassBookingApp() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<'student' | 'teacher'>('student');
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const [bookingModal, setBookingModal] = useState<ClassItem | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingBookingClass, setPendingBookingClass] = useState<ClassItem | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [newClass, setNewClass] = useState<NewClassForm>(BLANK_NEW_CLASS);
  const [bookedIds, setBookedIds] = useState<Map<number, Booking>>(new Map());
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const [studentTab, setStudentTab] = useState<'browse' | 'bookings'>('browse');
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [createHasRoles, setCreateHasRoles] = useState(false);
  const [expandedTeacherClassId, setExpandedTeacherClassId] = useState<number | null>(null);
  const [bookingFlowStep, setBookingFlowStep] = useState<'type' | 'solo' | 'pair'>('type');
  const [soloName, setSoloName] = useState('');
  const [soloRole, setSoloRole] = useState('');
  const [pairMyName, setPairMyName] = useState('');
  const [pairMyRole, setPairMyRole] = useState('');
  const [pairPartnerName, setPairPartnerName] = useState('');
  const [pairPartnerRole, setPairPartnerRole] = useState('');

  const theme = useTheme(dark);
  const { width, height: screenHeight } = useWindowDimensions();

  // Dark toggle animation
  const toggleAnim = useRef(new Animated.Value(0)).current;

  // Success banner animation
  const bannerTranslateY = useRef(new Animated.Value(-30)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    return () => { bannerAnimRef.current?.stop(); };
  }, []);

  useEffect(() => {
    restoreSession()
      .then(account => { if (account) setCurrentAccount(account); })
      .catch(() => { /* storage unavailable — stay logged out */ });
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    Animated.spring(toggleAnim, { toValue: next ? 1 : 0, useNativeDriver: true }).start();
  };

  const thumbX = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });

  const filteredClasses = classes.filter(
    c => filterCategory === 'All' || c.category === filterCategory
  );

  const getDiscountedPrice = (cls: ClassItem, account: Account | null = currentAccount) => {
    if (!account || account.verification.status !== 'approved') return cls.basePrice.toFixed(2);
    if (account.discountType === 'student') return (cls.basePrice * (1 - cls.discounts.student / 100)).toFixed(2);
    if (account.discountType === 'retired') return (cls.basePrice * (1 - cls.discounts.retired / 100)).toFixed(2);
    return cls.basePrice.toFixed(2);
  };

  const getDiscountLabel = (cls: ClassItem, account: Account | null = currentAccount) => {
    if (!account || account.verification.status !== 'approved') return null;
    if (account.discountType === 'student') return `${cls.discounts.student}% student discount`;
    if (account.discountType === 'retired') return `${cls.discounts.retired}% senior discount`;
    return null;
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    bannerTranslateY.setValue(-30);
    bannerOpacity.setValue(0);
    bannerAnimRef.current?.stop();
    bannerAnimRef.current = Animated.sequence([
      Animated.parallel([
        Animated.spring(bannerTranslateY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(bannerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(3000),
      Animated.timing(bannerOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]);
    bannerAnimRef.current.start(() => setSuccessMsg(''));
  };

  const resetBookingFlow = () => {
    setBookingFlowStep('type');
    setSoloName('');
    setSoloRole('');
    setPairMyName('');
    setPairMyRole('');
    setPairPartnerName('');
    setPairPartnerRole('');
  };

  const handleBookPress = (cls: ClassItem) => {
    if (!currentAccount) {
      setPendingBookingClass(cls);
      setShowAuthModal(true);
      return;
    }
    setBookingModal(cls);
  };

  const handleBook = (cls: ClassItem, bookingData: Omit<Booking, 'pricePaid'>) => {
    // For no-role classes, enrolled is incremented here.
    // For role classes, handleSoloBook/handlePairBook already incremented enrolled before calling here.
    if (cls.roles.length === 0) {
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, enrolled: c.enrolled + 1 } : c));
    }
    setBookedIds(prev => new Map(prev).set(cls.id, {
      pricePaid: getDiscountedPrice(cls),
      ...bookingData,
    }));
    setBookingModal(null);
    setSelected(null);
    showSuccess(`You're booked into "${cls.title}"!`);
  };

  // Solo booking: adds student to waitingList, auto-pairs with earliest waiting student
  // who has a different role (FIFO). Updates roleEnrollments and enrolled count.
  const handleSoloBook = (cls: ClassItem, studentName: string, role: string) => {
    // Compute pairing decision from current state snapshot before setState
    const currentCls = classes.find(c => c.id === cls.id);
    const partnerIdx = currentCls ? currentCls.waitingList.findIndex(w => w.role !== role) : -1;
    const partner = partnerIdx >= 0 && currentCls ? currentCls.waitingList[partnerIdx] : undefined;
    const ownTimestamp = Date.now();

    setClasses(prev => prev.map(c => {
      if (c.id !== cls.id) return c;
      const pIdx = c.waitingList.findIndex(w => w.role !== role);
      const newRoleEnrollments = {
        ...c.roleEnrollments,
        [role]: (c.roleEnrollments[role] || 0) + 1,
      };
      let newWaitingList: ClassItem['waitingList'];
      let newPairs: ClassItem['pairs'];
      if (pIdx >= 0) {
        newWaitingList = c.waitingList.filter((_, i) => i !== pIdx);
        newPairs = [
          ...c.pairs,
          { name1: studentName, role1: role, name2: c.waitingList[pIdx].studentName, role2: c.waitingList[pIdx].role, isPreformed: false },
        ];
      } else {
        newWaitingList = [...c.waitingList, { studentName, role, timestamp: ownTimestamp }];
        newPairs = c.pairs;
      }
      return {
        ...c,
        enrolled: c.enrolled + 1,
        roleEnrollments: newRoleEnrollments,
        waitingList: newWaitingList,
        pairs: newPairs,
      };
    }));
    handleBook(cls, {
      bookingType: 'solo',
      role,
      pairedWithBookingId: partner ? partner.timestamp : undefined,
      ownWaitTimestamp: partner ? undefined : ownTimestamp,
    });
  };

  // Pair booking: reserves both roles atomically. enrolled += 2 (one per person).
  const handlePairBook = (
    cls: ClassItem,
    myName: string, myRole: string,
    partnerName: string, partnerRole: string,
  ) => {
    setClasses(prev => prev.map(c => {
      if (c.id !== cls.id) return c;
      return {
        ...c,
        enrolled: c.enrolled + 2,
        roleEnrollments: {
          ...c.roleEnrollments,
          [myRole]: (c.roleEnrollments[myRole] || 0) + 1,
          [partnerRole]: (c.roleEnrollments[partnerRole] || 0) + 1,
        },
        pairs: [
          ...c.pairs,
          { name1: myName, role1: myRole, name2: partnerName, role2: partnerRole, isPreformed: true },
        ],
      };
    }));
    handleBook(cls, { bookingType: 'pair', role: myRole, partnerName, partnerRole });
  };

  const handleCancelBooking = (id: number) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel Booking', style: 'destructive',
          onPress: () => {
            const booking = bookedIds.get(id);
            setClasses(prev => prev.map(c => {
              if (c.id !== id) return c;
              if (!booking || !booking.role) {
                // No-role class
                return { ...c, enrolled: Math.max(0, c.enrolled - 1) };
              }
              // Role class: decrement roleEnrollments
              const decrement = (rec: Record<string, number>, key: string) => ({
                ...rec,
                [key]: Math.max(0, (rec[key] || 0) - 1),
              });
              let newEnrollments = decrement(c.roleEnrollments, booking.role);
              let enrolledDelta = 1;
              if (booking.bookingType === 'pair' && booking.partnerRole) {
                newEnrollments = decrement(newEnrollments, booking.partnerRole);
                enrolledDelta = 2;
              }
              // For solo bookings still waiting for a partner, remove by timestamp for precise match
              const newWaitingList = booking.bookingType === 'solo' && !booking.pairedWithBookingId && booking.ownWaitTimestamp
                ? c.waitingList.filter(w => w.timestamp !== booking.ownWaitTimestamp)
                : c.waitingList;
              // Remove from pairs (match by the current user's role in name1 slot;
              // for simplicity remove first pair that includes booking.role)
              const newPairs = (() => {
                const idx = c.pairs.findIndex(p =>
                  (p.role1 === booking.role) || (p.role2 === booking.role && booking.bookingType === 'pair')
                );
                return idx >= 0 ? c.pairs.filter((_, i) => i !== idx) : c.pairs;
              })();
              return {
                ...c,
                enrolled: Math.max(0, c.enrolled - enrolledDelta),
                roleEnrollments: newEnrollments,
                waitingList: newWaitingList,
                pairs: newPairs,
              };
            }));
            setBookedIds(prev => { const m = new Map(prev); m.delete(id); return m; });
            setExpandedBookingId(null);
            showSuccess('Booking cancelled');
          },
        },
      ]
    );
  };

  const handleCreateClass = () => {
    const lat = parseFloat(newClass.lat) || 50.85 + (Math.random() - 0.5) * 0.03;
    const lng = parseFloat(newClass.lng) || 4.35 + (Math.random() - 0.5) * 0.04;
    const parsedRoles: Role[] = newClass.roles
      .filter(r => r.name.trim())
      .map(r => ({ name: r.name.trim(), capacity: Number(r.capacity) || 10 }));
    const effectiveCapacity = parsedRoles.length > 0
      ? parsedRoles.reduce((sum, r) => sum + r.capacity, 0)
      : Number(newClass.capacity);
    const roleEnrollments: Record<string, number> = {};
    parsedRoles.forEach(r => { roleEnrollments[r.name] = 0; });
    const cls: ClassItem = {
      id: Date.now(),
      title: newClass.title,
      teacher: newClass.teacher,
      category: newClass.category,
      description: newClass.description,
      address: newClass.address,
      lat, lng,
      date: newClass.date,
      time: newClass.time,
      enrolled: 0,
      duration: Number(newClass.duration),
      capacity: effectiveCapacity,
      basePrice: Number(newClass.basePrice),
      discounts: {
        student: Number(newClass.discounts.student),
        retired: Number(newClass.discounts.retired),
      },
      color: newClass.color,
      roles: parsedRoles,
      minPairs: Number(newClass.minPairs) || 0,
      roleEnrollments,
      waitingList: [],
      pairs: [],
    };
    setClasses(prev => [...prev, cls]);
    setCreateModal(false);
    setCreateStep(1);
    setCreateHasRoles(false);
    setNewClass(BLANK_NEW_CLASS);
    showSuccess(`Class "${cls.title}" created successfully!`);
  };

  const numCols = width >= 600 ? 2 : 1;
  const cardWidth = (width - 40 - (numCols - 1) * 16) / numCols;

  const categoryOptions = categories
    .filter(c => c !== 'All')
    .map(c => ({ label: c, value: c }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

      {/* ── HEADER ── */}
      <View style={{
        backgroundColor: theme.surface,
        borderBottomWidth: 1, borderBottomColor: theme.border,
        paddingHorizontal: 20, height: 60,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: dark ? 0.4 : 0.06,
        shadowRadius: 8,
        elevation: 4,
      }}>
        {/* Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LinearGradient
            colors={['#7c5cbf', '#e06b9a']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              width: 32, height: 32, borderRadius: 9,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16 }}>🎓</Text>
          </LinearGradient>
          <Text style={{
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 22, color: theme.text, letterSpacing: 0.3,
          }}>
            Classe
          </Text>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
          {/* View toggle */}
          <View style={{
            flexDirection: 'row', backgroundColor: theme.surfaceAlt,
            borderRadius: 10, padding: 3,
            borderWidth: 1, borderColor: theme.border,
          }}>
            {(['student', 'teacher'] as const).map(v => (
              <Pressable
                key={v}
                onPress={() => setView(v)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 5, borderRadius: 7,
                  backgroundColor: view === v ? theme.accent : 'transparent',
                }}
              >
                <Text style={{
                  color: view === v ? '#fff' : theme.muted,
                  fontWeight: '600', fontSize: 12,
                  fontFamily: 'DMSans_600SemiBold',
                }}>
                  {v === 'student' ? '📚 Student' : '🎤 Teacher'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Dark mode toggle */}
          <Pressable
            onPress={toggleDark}
            style={{
              width: 50, height: 27, borderRadius: 14,
              backgroundColor: dark ? theme.accent : '#d0cdd8',
              justifyContent: 'center', paddingHorizontal: 4,
            }}
          >
            <Animated.View style={{
              width: 19, height: 19, borderRadius: 10, backgroundColor: '#fff',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
              transform: [{ translateX: thumbX }],
            }}>
              <Text style={{ fontSize: 10 }}>{dark ? '🌙' : '☀️'}</Text>
            </Animated.View>
          </Pressable>

          {/* Auth button */}
          {view === 'student' && (
            currentAccount ? (
              <Pressable
                onPress={() => setShowProfileModal(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                {currentAccount.avatarUri ? (
                  <Image
                    source={{ uri: currentAccount.avatarUri }}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                  />
                ) : (
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                      {currentAccount.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={{
                  color: theme.text, fontSize: 13, fontWeight: '600', maxWidth: 80,
                }} numberOfLines={1}>
                  {currentAccount.name.split(' ')[0]}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setShowAuthModal(true)}
                style={{ paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text style={{ color: theme.accent, fontWeight: '600', fontSize: 14 }}>
                  Sign In
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      {/* ── SUCCESS BANNER ── */}
      {successMsg ? (
        <Animated.View style={{
          position: 'absolute', top: 68, alignSelf: 'center',
          backgroundColor: theme.green,
          paddingHorizontal: 20, paddingVertical: 10,
          borderRadius: 10, zIndex: 999,
          opacity: bannerOpacity,
          transform: [{ translateY: bannerTranslateY }],
          shadowColor: theme.green,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
        }}>
          <Text style={{
            color: '#fff', fontWeight: '600', fontSize: 14,
            fontFamily: 'DMSans_600SemiBold',
          }}>
            ✅ {successMsg}
          </Text>
        </Animated.View>
      ) : null}

      {/* ── MAIN SCROLL ── */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* ══ STUDENT VIEW ══ */}
        {view === 'student' && (
          <>
            {/* ── STUDENT TAB BAR ── */}
            <View style={{
              flexDirection: 'row', backgroundColor: theme.surfaceAlt,
              borderRadius: 10, padding: 3,
              borderWidth: 1, borderColor: theme.border,
              marginBottom: 20,
            }}>
              {(['browse', 'bookings'] as const).map(tab => {
                const isActive = studentTab === tab;
                const label = tab === 'browse'
                  ? 'Browse Classes'
                  : bookedIds.size > 0
                    ? `My Bookings  ${bookedIds.size}`
                    : 'My Bookings';
                return (
                  <Pressable
                    key={tab}
                    onPress={() => { setStudentTab(tab); setExpandedBookingId(null); }}
                    style={{
                      flex: 1, paddingVertical: 7, paddingHorizontal: 10,
                      borderRadius: 7, alignItems: 'center',
                      backgroundColor: isActive ? theme.accent : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: isActive ? '#fff' : theme.muted,
                      fontWeight: '600', fontSize: 13,
                      fontFamily: 'DMSans_600SemiBold',
                    }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {studentTab === 'browse' && (
              <>
                {/* Hero */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{
                    fontFamily: 'CormorantGaramond_600SemiBold',
                    fontSize: width >= 600 ? 48 : 32,
                    lineHeight: width >= 600 ? 54 : 38,
                    color: theme.text, marginBottom: 10,
                  }}>
                    {'Discover & Book\n'}
                    <Text style={{
                      color: theme.accentLight,
                      fontFamily: 'CormorantGaramond_600SemiBold_Italic',
                    }}>
                      exceptional classes
                    </Text>
                  </Text>
                  <Text style={{
                    color: theme.muted, fontSize: 15,
                    fontFamily: 'DMSans_400Regular',
                  }}>
                    Learn from passionate teachers across Brussels and beyond.
                  </Text>
                </View>

                {/* Category filter pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 12 }}
                  contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                >
                  {categories.map(cat => (
                    <Pressable
                      key={cat}
                      onPress={() => setFilterCategory(cat)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 6,
                        borderRadius: 20, borderWidth: 1, borderColor: theme.border,
                        backgroundColor: filterCategory === cat ? theme.accent : theme.surfaceAlt,
                      }}
                    >
                      <Text style={{
                        color: filterCategory === cat ? '#fff' : theme.text,
                        fontWeight: '500', fontSize: 13,
                        fontFamily: 'DMSans_500Medium',
                      }}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Class cards grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                  {filteredClasses.map(cls => {
                    const full = cls.enrolled >= cls.capacity;
                    const discLabel = getDiscountLabel(cls);
                    return (
                      <Pressable
                        key={cls.id}
                        onPress={() => setSelected(cls)}
                        style={({ pressed }) => ({
                          width: cardWidth,
                          backgroundColor: theme.surface,
                          borderRadius: 16, borderWidth: 1, borderColor: theme.border,
                          overflow: 'hidden',
                          opacity: pressed ? 0.93 : 1,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: dark ? 0.3 : 0.07,
                          shadowRadius: 12, elevation: 4,
                        })}
                      >
                        {/* Colour bar */}
                        <LinearGradient
                          colors={[cls.color, cls.color + '88']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ height: 8 }}
                        />
                        <View style={{ padding: 18 }}>
                          {/* Category + Full badge */}
                          <View style={{
                            flexDirection: 'row', justifyContent: 'space-between',
                            marginBottom: 8,
                          }}>
                            <View style={{
                              backgroundColor: theme.accentLight + '18',
                              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5,
                            }}>
                              <Text style={{
                                fontSize: 11, fontWeight: '700', letterSpacing: 1,
                                color: theme.accentLight, textTransform: 'uppercase',
                                fontFamily: 'DMSans_700Bold',
                              }}>
                                {cls.category}
                              </Text>
                            </View>
                            {full && (
                              <View style={{
                                backgroundColor: '#e0505018',
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5,
                              }}>
                                <Text style={{ fontSize: 11, color: '#e05050', fontWeight: '700', fontFamily: 'DMSans_700Bold' }}>
                                  FULL
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text style={{
                            fontSize: 18, fontWeight: '600', color: theme.text,
                            lineHeight: 24, marginBottom: 3,
                            fontFamily: 'DMSans_600SemiBold',
                          }}>
                            {cls.title}
                          </Text>
                          <Text style={{
                            fontSize: 13, color: theme.muted,
                            marginBottom: 10, fontFamily: 'DMSans_400Regular',
                          }}>
                            with {cls.teacher}
                          </Text>
                          <Text style={{
                            fontSize: 14, color: theme.muted,
                            lineHeight: 21, marginBottom: 12,
                            fontFamily: 'DMSans_400Regular',
                          }}>
                            {cls.description}
                          </Text>

                          {/* Meta row */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, color: theme.muted, fontFamily: 'DMSans_400Regular' }}>
                              📅 {new Date(cls.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {cls.time}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.muted, fontFamily: 'DMSans_400Regular' }}>
                              ⏱ {cls.duration}min
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.muted, fontFamily: 'DMSans_400Regular' }}>
                              👥 {cls.enrolled}/{cls.capacity}
                            </Text>
                          </View>

                          {/* Price + Book button */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                              <Text style={{
                                fontSize: 20, fontWeight: '700', color: theme.accentLight,
                                fontFamily: 'DMSans_700Bold',
                              }}>
                                €{getDiscountedPrice(cls)}
                              </Text>
                              {discLabel && (
                                <View style={{
                                  backgroundColor: theme.green + '18',
                                  paddingHorizontal: 7, paddingVertical: 2,
                                  borderRadius: 5, marginTop: 2,
                                }}>
                                  <Text style={{ fontSize: 11, color: theme.green, fontWeight: '700', fontFamily: 'DMSans_700Bold' }}>
                                    {discLabel}
                                  </Text>
                                </View>
                              )}
                              {currentAccount && currentAccount.verification.status === 'pending' && currentAccount.discountType !== 'none' && (
                                <Text style={{ fontSize: 11, color: theme.amber, marginTop: 2, fontFamily: 'DMSans_400Regular' }}>
                                  ⏳ pending
                                </Text>
                              )}
                              {currentAccount && currentAccount.verification.status === 'approved' && currentAccount.discountType !== 'none' && (
                                <Text style={{
                                  fontSize: 11, color: theme.muted,
                                  textDecorationLine: 'line-through', marginTop: 2,
                                  fontFamily: 'DMSans_400Regular',
                                }}>
                                  €{cls.basePrice.toFixed(2)}
                                </Text>
                              )}
                            </View>
                            <Pressable
                              onPress={() => { if (!full && !bookedIds.has(cls.id)) handleBookPress(cls); }}
                              disabled={full || bookedIds.has(cls.id)}
                              style={({ pressed }) => ({
                                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9,
                                backgroundColor: full || bookedIds.has(cls.id) ? theme.border : theme.accent,
                                opacity: pressed && !full && !bookedIds.has(cls.id) ? 0.85 : 1,
                              })}
                            >
                              <Text style={{
                                color: full || bookedIds.has(cls.id) ? theme.muted : '#fff',
                                fontWeight: '600', fontSize: 13,
                                fontFamily: 'DMSans_600SemiBold',
                              }}>
                                {full ? 'Full' : bookedIds.has(cls.id) ? 'Booked ✓' : 'Book now'}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {studentTab === 'bookings' && (
              <>
                {bookedIds.size === 0 ? (
                  /* ── EMPTY STATE ── */
                  <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 }}>
                    <Text style={{ fontSize: 40, marginBottom: 16 }}>📋</Text>
                    <Text style={{
                      fontFamily: 'DMSans_600SemiBold',
                      fontSize: 18, color: theme.text,
                      textAlign: 'center', marginBottom: 8,
                    }}>
                      No bookings yet
                    </Text>
                    <Text style={{
                      fontFamily: 'DMSans_400Regular',
                      fontSize: 14, color: theme.muted,
                      textAlign: 'center', marginBottom: 24,
                    }}>
                      Browse classes to find something you'll love.
                    </Text>
                    <Pressable
                      onPress={() => setStudentTab('browse')}
                      style={{
                        backgroundColor: theme.accent,
                        paddingHorizontal: 24, paddingVertical: 12,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{
                        color: '#fff', fontFamily: 'DMSans_600SemiBold', fontSize: 14,
                      }}>
                        Browse Classes →
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  /* ── BOOKING LIST ── */
                  <View style={{ gap: 8 }}>
                    {classes
                      .filter(cls => bookedIds.has(cls.id))
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(cls => {
                        const booking = bookedIds.get(cls.id)!;
                        const isExpanded = expandedBookingId === cls.id;
                        return (
                          <View
                            key={cls.id}
                            style={{
                              backgroundColor: theme.surface,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: isExpanded ? theme.accent : theme.border,
                              overflow: 'hidden',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: dark ? 0.2 : 0.05,
                              shadowRadius: 6, elevation: 2,
                            }}
                          >
                            {/* ── COMPACT HEADER (always visible) ── */}
                            <Pressable
                              onPress={() => setExpandedBookingId(isExpanded ? null : cls.id)}
                              style={{
                                flexDirection: 'row', alignItems: 'center',
                                padding: 12, gap: 10,
                              }}
                            >
                              <View style={{
                                width: 38, height: 38, borderRadius: 10,
                                backgroundColor: cls.color,
                                alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <Text style={{ fontSize: 18 }}>
                                  {cls.category === 'Wellness' ? '🧘' :
                                   cls.category === 'Art' ? '🎨' :
                                   cls.category === 'Cooking' ? '🍳' :
                                   cls.category === 'Music' ? '🎵' :
                                   cls.category === 'Language' ? '💬' :
                                   cls.category === 'Tech' ? '💻' :
                                   cls.category === 'Sport' ? '⚽' : '📚'}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{
                                  fontFamily: 'DMSans_600SemiBold',
                                  fontSize: 14, color: theme.text, marginBottom: 2,
                                }}>
                                  {cls.title}
                                </Text>
                                <Text style={{
                                  fontFamily: 'DMSans_400Regular',
                                  fontSize: 12, color: theme.muted,
                                }}>
                                  {booking.role ? `${booking.role} · ` : ''}📅 {new Date(cls.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {cls.time} · {cls.duration}min
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{
                                  fontFamily: 'DMSans_700Bold',
                                  fontSize: 14, color: theme.accentLight, marginBottom: 2,
                                }}>
                                  €{booking.pricePaid}
                                </Text>
                                <Text style={{
                                  fontFamily: 'DMSans_400Regular',
                                  fontSize: 11, color: theme.muted,
                                }}>
                                  {isExpanded ? '∨' : '›'}
                                </Text>
                              </View>
                            </Pressable>

                            {/* ── EXPANDED DETAIL ── */}
                            {isExpanded && (
                              <View style={{
                                borderTopWidth: 1, borderTopColor: theme.border,
                                padding: 12, backgroundColor: theme.surfaceAlt,
                                gap: 10,
                              }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <View style={{
                                    backgroundColor: '#d4f0e0',
                                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                                  }}>
                                    <Text style={{
                                      fontFamily: 'DMSans_600SemiBold',
                                      fontSize: 11, color: '#2d8a5e',
                                    }}>
                                      ✓ Booked
                                    </Text>
                                  </View>
                                  {booking.role ? (
                                    <View style={{
                                      backgroundColor: theme.accent + '18',
                                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                                    }}>
                                      <Text style={{
                                        fontFamily: 'DMSans_600SemiBold',
                                        fontSize: 11, color: theme.accentLight,
                                      }}>
                                        {booking.role}
                                      </Text>
                                    </View>
                                  ) : null}
                                  <Text style={{
                                    fontFamily: 'DMSans_400Regular',
                                    fontSize: 12, color: theme.muted,
                                  }}>
                                    {cls.teacher} · {cls.category}
                                  </Text>
                                </View>

                                {/* Partner info for role bookings */}
                                {booking.role ? (
                                  <View style={{
                                    backgroundColor: (booking.bookingType === 'pair' && booking.partnerName) || booking.pairedWithBookingId
                                      ? '#d4f0e0' : '#fff8ec',
                                    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
                                    borderWidth: 1,
                                    borderColor: (booking.bookingType === 'pair' && booking.partnerName) || booking.pairedWithBookingId
                                      ? '#a8d8b9' : '#f4c9a5',
                                  }}>
                                    <Text style={{
                                      fontFamily: 'DMSans_400Regular',
                                      fontSize: 12,
                                      color: (booking.bookingType === 'pair' && booking.partnerName) || booking.pairedWithBookingId
                                        ? '#1a5e3a' : '#7c5050',
                                    }}>
                                      {booking.bookingType === 'pair' && booking.partnerName
                                        ? `👥 Paired with: ${booking.partnerName} (${booking.partnerRole})`
                                        : booking.pairedWithBookingId
                                          ? '👥 Auto-paired with a partner'
                                          : '⏳ Waiting for partner'}
                                    </Text>
                                  </View>
                                ) : null}

                                <Text style={{
                                  fontFamily: 'DMSans_400Regular',
                                  fontSize: 12, color: theme.muted,
                                }}>
                                  📍 {cls.address}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                  <Pressable
                                    onPress={() => handleCancelBooking(cls.id)}
                                    style={{
                                      flex: 1, backgroundColor: '#fff0f3',
                                      borderWidth: 1, borderColor: '#f4c0cc',
                                      borderRadius: 8, paddingVertical: 10,
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Text style={{
                                      fontFamily: 'DMSans_600SemiBold',
                                      fontSize: 13, color: '#e05050',
                                    }}>
                                      Cancel Booking
                                    </Text>
                                  </Pressable>
                                  <Pressable
                                    onPress={() => Linking.openURL(
                                      `https://www.google.com/maps?q=${cls.lat},${cls.lng}&z=15`
                                    ).catch(() => {})}
                                    style={{
                                      flex: 1, backgroundColor: theme.accentLight + '18',
                                      borderWidth: 1, borderColor: theme.accentLight + '44',
                                      borderRadius: 8, paddingVertical: 10,
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Text style={{
                                      fontFamily: 'DMSans_600SemiBold',
                                      fontSize: 13, color: theme.accentLight,
                                    }}>
                                      Get Directions
                                    </Text>
                                  </Pressable>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ══ TEACHER VIEW ══ */}
        {view === 'teacher' && (
          <>
            {/* Header row */}
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'flex-end', marginBottom: 24,
            }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{
                  fontFamily: 'CormorantGaramond_600SemiBold',
                  fontSize: width >= 600 ? 40 : 28,
                  lineHeight: width >= 600 ? 46 : 34,
                  color: theme.text, marginBottom: 6,
                }}>
                  {'Manage your\n'}
                  <Text style={{
                    color: theme.accentLight,
                    fontFamily: 'CormorantGaramond_600SemiBold_Italic',
                  }}>
                    classes
                  </Text>
                </Text>
                <Text style={{ color: theme.muted, fontSize: 14, fontFamily: 'DMSans_400Regular' }}>
                  Create, organise, and track your sessions.
                </Text>
              </View>
              <Pressable
                onPress={() => setCreateModal(true)}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <LinearGradient
                  colors={[theme.accent, '#e06b9a']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12,
                    shadowColor: theme.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: 'DMSans_700Bold' }}>
                    + New Class
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Stats cards */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total Classes', value: String(classes.length), icon: '📋' },
                {
                  label: 'Total Students',
                  value: String(classes.reduce((a, c) => a + c.enrolled, 0)),
                  icon: '👥',
                },
                {
                  label: 'Avg. Fill Rate',
                  value: classes.length === 0
                    ? '0%'
                    : Math.round(
                        classes.reduce((a, c) => a + c.enrolled / c.capacity, 0) / classes.length * 100
                      ) + '%',
                  icon: '📊',
                },
              ].map(stat => (
                <View key={stat.label} style={{
                  flex: 1, minWidth: 100,
                  backgroundColor: theme.surface,
                  borderRadius: 14, borderWidth: 1, borderColor: theme.border,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: dark ? 0.2 : 0.05,
                  shadowRadius: 6, elevation: 3,
                }}>
                  <Text style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</Text>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: theme.accentLight, fontFamily: 'DMSans_700Bold' }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.muted, fontFamily: 'DMSans_400Regular' }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Classes list */}
            <View style={{ gap: 10 }}>
              {classes.map(cls => {
                const isExpanded = expandedTeacherClassId === cls.id;
                const hasRoles = cls.roles.length > 0;

                // Compute 48h countdown (UI only, no push)
                const classDateTime = new Date(`${cls.date}T${cls.time}`);
                const cutoff = new Date(classDateTime.getTime() - 48 * 60 * 60 * 1000);
                const msUntilCutoff = cutoff.getTime() - Date.now();
                const pairsShort = hasRoles && cls.minPairs > 0 && cls.pairs.length < cls.minPairs;
                const countdownHours = msUntilCutoff > 0 ? Math.floor(msUntilCutoff / 3600000) : 0;
                const showWarning = pairsShort && msUntilCutoff > 0;

                return (
                  <View
                    key={cls.id}
                    style={{
                      backgroundColor: theme.surface,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: showWarning ? '#e05050' : isExpanded ? theme.accent : theme.border,
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: dark ? 0.2 : 0.05,
                      shadowRadius: 6, elevation: 2,
                    }}
                  >
                    {/* Colour bar */}
                    <View style={{ height: 4, backgroundColor: cls.color }} />

                    {/* Collapsed header — always visible */}
                    <Pressable
                      onPress={() => setExpandedTeacherClassId(isExpanded ? null : cls.id)}
                      style={{ padding: 14, gap: 8 }}
                    >
                      {/* Title row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={{
                            fontFamily: 'DMSans_600SemiBold',
                            fontSize: 14, color: theme.text,
                          }}>
                            {cls.title}
                          </Text>
                          <Text style={{
                            fontFamily: 'DMSans_400Regular',
                            fontSize: 11, color: theme.muted, marginTop: 1,
                          }}>
                            {cls.date} · {cls.time} · {cls.duration}min
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          {hasRoles ? (
                            <View style={{
                              backgroundColor: pairsShort ? '#fff0f0' : '#d4f0e0',
                              borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                            }}>
                              <Text style={{
                                fontFamily: 'DMSans_700Bold',
                                fontSize: 11,
                                color: pairsShort ? '#e05050' : '#2d8a5e',
                              }}>
                                {pairsShort ? `⚠️ ${cls.pairs.length}/${cls.minPairs} pairs` : `${cls.pairs.length}/${cls.minPairs} pairs ✓`}
                              </Text>
                            </View>
                          ) : (
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: theme.muted }}>
                              {`👥 ${cls.enrolled}/${cls.capacity}`}
                            </Text>
                          )}
                          <Text style={{ color: theme.accent, fontSize: 14 }}>{isExpanded ? '∨' : '›'}</Text>
                        </View>
                      </View>

                      {/* Role chips (collapsed view) */}
                      {!isExpanded && hasRoles && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                          {cls.pairs.map((pair, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: '#d4f0e0',
                                borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                              }}
                            >
                              <Text style={{
                                fontFamily: 'DMSans_600SemiBold',
                                fontSize: 10, color: '#1a5e3a',
                              }}>
                                {pair.role1} + {pair.role2}{pair.isPreformed ? ' ★' : ''}
                              </Text>
                            </View>
                          ))}
                          {cls.waitingList.map((w, idx) => (
                            <View
                              key={`w-${idx}`}
                              style={{
                                backgroundColor: pairsShort ? '#fff0f0' : '#fff8ec',
                                borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                                borderWidth: 1,
                                borderColor: pairsShort ? '#f4c0cc' : '#f4c9a5',
                              }}
                            >
                              <Text style={{
                                fontFamily: 'DMSans_600SemiBold',
                                fontSize: 10,
                                color: pairsShort ? '#e05050' : '#7c5050',
                              }}>
                                {w.role} ⏳
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Non-role class chip */}
                      {!isExpanded && !hasRoles && (
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: theme.muted }}>
                          {`👥 ${cls.enrolled}/${cls.capacity} enrolled${cls.minPairs > 0 ? ` · min ${cls.minPairs}` : ''}`}
                        </Text>
                      )}

                      {/* 48h warning */}
                      {showWarning && (
                        <View style={{
                          backgroundColor: '#fff0f0',
                          borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
                          alignSelf: 'flex-start',
                        }}>
                          <Text style={{
                            fontFamily: 'DMSans_600SemiBold',
                            fontSize: 11, color: '#e05050',
                          }}>
                            ⏰ Cancels in {countdownHours}h if no change
                          </Text>
                        </View>
                      )}
                    </Pressable>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <View style={{
                        borderTopWidth: 1, borderTopColor: theme.border,
                        padding: 14, backgroundColor: theme.surfaceAlt, gap: 12,
                      }}>
                        {hasRoles && (
                          <>
                            {/* Paired section */}
                            <View>
                              <View style={{
                                flexDirection: 'row', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: 8,
                              }}>
                                <Text style={{
                                  fontFamily: 'DMSans_700Bold',
                                  fontSize: 10, color: theme.muted,
                                  textTransform: 'uppercase', letterSpacing: 0.5,
                                }}>
                                  PAIRED ({cls.pairs.length})
                                </Text>
                                <Text style={{
                                  fontFamily: 'DMSans_400Regular',
                                  fontSize: 9, color: theme.muted,
                                }}>
                                  ★ = booked as a pre-formed pair
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {cls.pairs.map((pair, idx) => (
                                  <View
                                    key={idx}
                                    style={{
                                      backgroundColor: '#d4f0e0',
                                      borderRadius: 8, padding: 8,
                                      minWidth: 90,
                                    }}
                                  >
                                    <Text style={{
                                      fontFamily: 'DMSans_700Bold',
                                      fontSize: 9, color: '#1a5e3a', marginBottom: 3,
                                    }}>
                                      {pair.role1} + {pair.role2}{pair.isPreformed ? ' ★' : ''}
                                    </Text>
                                    <Text style={{
                                      fontFamily: 'DMSans_400Regular',
                                      fontSize: 11, color: '#1a5e3a',
                                    }}>
                                      {pair.name1} & {pair.name2}
                                    </Text>
                                  </View>
                                ))}
                                {cls.pairs.length === 0 && (
                                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: theme.muted }}>
                                    No pairs yet
                                  </Text>
                                )}
                              </View>
                            </View>

                            {/* Waiting section */}
                            {cls.waitingList.length > 0 && (
                              <View>
                                <Text style={{
                                  fontFamily: 'DMSans_700Bold',
                                  fontSize: 10, color: theme.muted,
                                  textTransform: 'uppercase', letterSpacing: 0.5,
                                  marginBottom: 6,
                                }}>
                                  ⏳ WAITING FOR PARTNER ({cls.waitingList.length})
                                </Text>
                                <View style={{ gap: 5 }}>
                                  {cls.waitingList.map((w, idx) => (
                                    <View
                                      key={idx}
                                      style={{
                                        backgroundColor: '#fff8ec',
                                        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
                                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                                        borderWidth: 1, borderColor: '#f4c9a5',
                                      }}
                                    >
                                      <Text style={{
                                        fontFamily: 'DMSans_600SemiBold',
                                        fontSize: 12, color: theme.text,
                                      }}>
                                        {w.studentName}
                                      </Text>
                                      <View style={{
                                        backgroundColor: '#f4c9a5',
                                        borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2,
                                      }}>
                                        <Text style={{
                                          fontFamily: 'DMSans_700Bold',
                                          fontSize: 10, color: '#7c5050',
                                        }}>
                                          {w.role}
                                        </Text>
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                          </>
                        )}

                        {/* Non-role class: show enrolled bar */}
                        {!hasRoles && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{
                              flex: 1, height: 6, borderRadius: 3,
                              backgroundColor: theme.border, overflow: 'hidden',
                            }}>
                              <View style={{
                                width: `${(cls.enrolled / cls.capacity) * 100}%`,
                                height: 6,
                                backgroundColor: cls.enrolled >= cls.capacity ? '#e05050' : theme.green,
                                borderRadius: 3,
                              }} />
                            </View>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: theme.muted }}>
                              {cls.enrolled}/{cls.capacity} enrolled
                            </Text>
                          </View>
                        )}

                        {/* Edit button — opens blank create wizard (pre-fill is out of scope) */}
                        <Pressable
                          onPress={() => {
                            setExpandedTeacherClassId(null);
                            setCreateModal(true);
                          }}
                          style={({ pressed }) => ({
                            backgroundColor: pressed ? theme.accent + '22' : theme.accent + '12',
                            borderWidth: 1, borderColor: theme.accent + '44',
                            borderRadius: 8, paddingVertical: 10,
                            alignItems: 'center',
                          })}
                        >
                          <Text style={{
                            fontFamily: 'DMSans_600SemiBold',
                            fontSize: 13, color: theme.accentLight,
                          }}>
                            ✏️ Edit Class Details
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* ══ CLASS DETAIL MODAL ══ */}
      <Modal
        visible={!!selected}
        animationType="fade"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSelected(null)} />
          <View style={{ flex: 1, justifyContent: 'center', padding: 16 }} pointerEvents="box-none">
            <View style={{
              backgroundColor: theme.surface,
              borderRadius: 20, maxHeight: screenHeight * 0.9,
              borderWidth: 1, borderColor: theme.border,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 24 },
              shadowOpacity: 0.4, shadowRadius: 40, elevation: 20,
            }}>
              {selected && (
                <>
                  <LinearGradient
                    colors={[selected.color, theme.accent]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 10 }}
                  />
                  <ScrollView contentContainerStyle={{ padding: 24 }}>
                    {/* Top row */}
                    <View style={{
                      flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: 18,
                    }}>
                      <View style={{
                        backgroundColor: theme.accentLight + '18',
                        paddingHorizontal: 9, paddingVertical: 3, borderRadius: 5,
                      }}>
                        <Text style={{
                          fontSize: 11, fontWeight: '700', letterSpacing: 1,
                          color: theme.accentLight, textTransform: 'uppercase',
                          fontFamily: 'DMSans_700Bold',
                        }}>
                          {selected.category}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setSelected(null)}
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? theme.border : theme.surfaceAlt,
                          width: 30, height: 30, borderRadius: 8,
                          alignItems: 'center', justifyContent: 'center',
                        })}
                      >
                        <Text style={{ color: theme.muted, fontSize: 18 }}>×</Text>
                      </Pressable>
                    </View>

                    <Text style={{
                      fontFamily: 'CormorantGaramond_600SemiBold',
                      fontSize: 28, color: theme.text, marginBottom: 4,
                    }}>
                      {selected.title}
                    </Text>
                    <Text style={{ color: theme.muted, marginBottom: 14, fontFamily: 'DMSans_400Regular' }}>
                      with <Text style={{ color: theme.text, fontFamily: 'DMSans_600SemiBold' }}>{selected.teacher}</Text>
                    </Text>
                    <Text style={{ lineHeight: 25, color: theme.muted, marginBottom: 18, fontFamily: 'DMSans_400Regular' }}>
                      {selected.description}
                    </Text>

                    {/* Info grid */}
                    <View style={{
                      backgroundColor: theme.surfaceAlt,
                      borderRadius: 12, padding: 16, marginBottom: 18,
                    }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {[
                          ['📅 Date', new Date(selected.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })],
                          ['🕐 Time', `${selected.time} · ${selected.duration} min`],
                          ['👥 Spots', `${selected.enrolled}/${selected.capacity} enrolled`],
                          ['🎓 Student', `-${selected.discounts.student}%`],
                          ['👴 Senior', `-${selected.discounts.retired}%`],
                          ['💶 Base price', `€${selected.basePrice}`],
                        ].map(([label, val]) => (
                          <View key={label} style={{ width: '50%', paddingRight: 8, marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 2, fontFamily: 'DMSans_400Regular' }}>
                              {label}
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, fontFamily: 'DMSans_600SemiBold' }}>
                              {val}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Location */}
                    <View style={{
                      backgroundColor: theme.surfaceAlt,
                      borderRadius: 12, padding: 16, marginBottom: 18,
                    }}>
                      <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontFamily: 'DMSans_400Regular' }}>
                        📍 Location
                      </Text>
                      <Text style={{ fontWeight: '600', color: theme.text, marginBottom: 12, fontFamily: 'DMSans_600SemiBold' }}>
                        {selected.address}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable
                          onPress={() => Linking.openURL(`https://www.google.com/maps?q=${selected.lat},${selected.lng}&z=15`)}
                          style={({ pressed }) => ({
                            flex: 1, backgroundColor: '#4285F4',
                            paddingVertical: 9, borderRadius: 9,
                            alignItems: 'center', opacity: pressed ? 0.85 : 1,
                          })}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: 'DMSans_600SemiBold' }}>
                            🗺 Google Maps
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => Linking.openURL(`https://maps.apple.com/?ll=${selected.lat},${selected.lng}&z=15`)}
                          style={({ pressed }) => ({
                            flex: 1, backgroundColor: dark ? '#1c1c1e' : '#000',
                            paddingVertical: 9, borderRadius: 9,
                            alignItems: 'center', opacity: pressed ? 0.85 : 1,
                            borderWidth: 1, borderColor: theme.border,
                          })}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: 'DMSans_600SemiBold' }}>
                            🍎 Apple Maps
                          </Text>
                        </Pressable>
                      </View>
                      <View style={{
                        marginTop: 10,
                        backgroundColor: theme.accentLight + '12',
                        paddingHorizontal: 8, paddingVertical: 4,
                        borderRadius: 5, alignSelf: 'flex-start',
                      }}>
                        <Text style={{
                          fontSize: 11, color: theme.muted,
                          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                        }}>
                          {selected.lat.toFixed(4)}°N, {selected.lng.toFixed(4)}°E
                        </Text>
                      </View>
                    </View>

                    {/* Book button (student view only) */}
                    {view === 'student' && (
                      <Pressable
                        onPress={() => {
                          if (selected.enrolled < selected.capacity && !bookedIds.has(selected.id)) {
                            setSelected(null);
                            handleBookPress(selected);
                          }
                        }}
                        disabled={selected.enrolled >= selected.capacity || bookedIds.has(selected.id)}
                        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                      >
                        <LinearGradient
                          colors={
                            selected.enrolled >= selected.capacity || bookedIds.has(selected.id)
                              ? [theme.border, theme.border]
                              : [theme.accent, '#e06b9a']
                          }
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                        >
                          <Text style={{
                            color: selected.enrolled >= selected.capacity || bookedIds.has(selected.id) ? theme.muted : '#fff',
                            fontWeight: '700', fontSize: 16,
                            fontFamily: 'DMSans_700Bold',
                          }}>
                            {selected.enrolled >= selected.capacity
                              ? 'Class is full'
                              : bookedIds.has(selected.id)
                                ? 'Already booked ✓'
                                : `Book for €${getDiscountedPrice(selected)}`}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ BOOKING CONFIRMATION MODAL ══ */}
      <Modal
        visible={!!bookingModal}
        animationType="fade"
        transparent
        onRequestClose={() => { setBookingModal(null); resetBookingFlow(); }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => { setBookingModal(null); resetBookingFlow(); }}
          />
          <View style={{ flex: 1, justifyContent: 'center', padding: 16 }} pointerEvents="box-none">
            <View style={{
              backgroundColor: theme.surface, borderRadius: 20, padding: 24,
              borderWidth: 1, borderColor: theme.border,
              maxWidth: 400, alignSelf: 'center', width: '100%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 24 },
              shadowOpacity: 0.4, shadowRadius: 40, elevation: 20,
            }}>
              {bookingModal && bookingModal.roles.length === 0 && (
                /* ── NON-ROLE CLASS: unchanged simple confirmation ── */
                <>
                  <Text style={{ fontSize: 46, textAlign: 'center', marginBottom: 14 }}>🎟️</Text>
                  <Text style={{
                    fontSize: 22, fontWeight: '700', textAlign: 'center',
                    marginBottom: 8, color: theme.text, fontFamily: 'DMSans_700Bold',
                  }}>
                    Confirm Booking
                  </Text>
                  <Text style={{
                    color: theme.muted, textAlign: 'center',
                    lineHeight: 24, marginBottom: 18,
                    fontFamily: 'DMSans_400Regular',
                  }}>
                    {'You\'re about to book '}
                    <Text style={{ color: theme.text, fontFamily: 'DMSans_600SemiBold' }}>
                      {bookingModal.title}
                    </Text>
                    {' on '}
                    {new Date(bookingModal.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                    {' at '}
                    {bookingModal.time}.
                  </Text>
                  {/* Identity row */}
                  {currentAccount && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      backgroundColor: theme.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 12,
                    }}>
                      {currentAccount.avatarUri ? (
                        <Image
                          source={{ uri: currentAccount.avatarUri }}
                          style={{ width: 36, height: 36, borderRadius: 18 }}
                        />
                      ) : (
                        <View style={{
                          width: 36, height: 36, borderRadius: 18, backgroundColor: theme.accent,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ color: '#fff', fontWeight: '700' }}>
                            {currentAccount.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, fontFamily: 'DMSans_700Bold' }}>
                          {currentAccount.name}
                        </Text>
                        <Text style={{ color: theme.muted, fontSize: 12, fontFamily: 'DMSans_400Regular' }}>{currentAccount.email}</Text>
                      </View>
                      {currentAccount.verification.status === 'approved' && currentAccount.discountType !== 'none' && (
                        <View style={{
                          backgroundColor: theme.green + '18',
                          paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                          flexDirection: 'row', alignItems: 'center', gap: 4,
                        }}>
                          <Text style={{ fontSize: 12 }}>🛡️</Text>
                          <Text style={{ color: theme.green, fontWeight: '600', fontSize: 11, fontFamily: 'DMSans_600SemiBold' }}>
                            {/* 'retired' is surfaced as 'Senior' to users throughout the feature */}
                            Verified {currentAccount.discountType === 'student' ? 'Student' : 'Senior'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={{
                    backgroundColor: theme.surfaceAlt, borderRadius: 12, padding: 14,
                    flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 20,
                  }}>
                    <Text style={{ color: theme.muted, fontSize: 14, fontFamily: 'DMSans_400Regular' }}>
                      Total to pay
                    </Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        fontSize: 24, fontWeight: '800', color: theme.accentLight,
                        fontFamily: 'DMSans_700Bold',
                      }}>
                        €{getDiscountedPrice(bookingModal)}
                      </Text>
                      {(() => {
                        const discLabel = getDiscountLabel(bookingModal);
                        return discLabel ? (
                          <Text style={{ fontSize: 11, color: theme.green, fontFamily: 'DMSans_400Regular' }}>
                            {discLabel}
                          </Text>
                        ) : null;
                      })()}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable
                      onPress={() => { setBookingModal(null); resetBookingFlow(); }}
                      style={({ pressed }) => ({
                        flex: 1, paddingVertical: 12, borderRadius: 10,
                        borderWidth: 1, borderColor: theme.border,
                        alignItems: 'center',
                        backgroundColor: pressed ? theme.surfaceAlt : 'transparent',
                      })}
                    >
                      <Text style={{ color: theme.text, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' }}>
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        handleBook(bookingModal, { bookingType: 'solo', role: '' });
                        resetBookingFlow();
                      }}
                      style={({ pressed }) => ({ flex: 2, opacity: pressed ? 0.85 : 1 })}
                    >
                      <LinearGradient
                        colors={[theme.accent, '#e06b9a']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'DMSans_700Bold' }}>
                          Confirm & Book
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </>
              )}

              {bookingModal && bookingModal.roles.length > 0 && (
                /* ── ROLE CLASS: 2-step flow ── */
                <>
                  {/* Sub-header */}
                  <View style={{ marginBottom: 16 }}>
                    {bookingFlowStep !== 'type' && (
                      <Pressable onPress={() => setBookingFlowStep('type')} style={{ marginBottom: 6 }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: theme.muted }}>
                          ← {bookingFlowStep === 'solo' ? 'Solo booking' : 'Pair booking'}
                        </Text>
                      </Pressable>
                    )}
                    <Text style={{
                      fontFamily: 'DMSans_700Bold',
                      fontSize: 18, color: theme.text,
                    }}>
                      {bookingFlowStep === 'type'
                        ? 'How are you booking?'
                        : bookingFlowStep === 'solo'
                          ? 'Pick your role'
                          : 'Book as a pair'}
                    </Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: theme.muted, marginTop: 2 }}>
                      {bookingModal.title} · {new Date(bookingModal.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {bookingModal.time}
                    </Text>
                  </View>

                  {/* Step 1: Solo or Pair */}
                  {bookingFlowStep === 'type' && (
                    <View style={{ gap: 10 }}>
                      <Pressable
                        onPress={() => setBookingFlowStep('solo')}
                        style={{
                          borderWidth: 1.5, borderColor: theme.accent,
                          borderRadius: 10, padding: 14,
                          backgroundColor: theme.accent + '10',
                        }}
                      >
                        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: theme.accentLight }}>
                          👤 Solo — I'll be paired automatically
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: theme.muted, marginTop: 3 }}>
                          Pick a role, get matched with the next available partner
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setBookingFlowStep('pair')}
                        style={{
                          borderWidth: 1, borderColor: theme.border,
                          borderRadius: 10, padding: 14,
                        }}
                      >
                        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: theme.text }}>
                          👥 Pair — I'm coming with a partner
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: theme.muted, marginTop: 3 }}>
                          Book both roles at once, guaranteed together
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { setBookingModal(null); resetBookingFlow(); }}
                        style={({ pressed }) => ({
                          paddingVertical: 10, borderRadius: 10,
                          borderWidth: 1, borderColor: theme.border,
                          alignItems: 'center',
                          backgroundColor: pressed ? theme.surfaceAlt : 'transparent',
                          marginTop: 4,
                        })}
                      >
                        <Text style={{ color: theme.muted, fontFamily: 'DMSans_400Regular', fontSize: 13 }}>
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Step 2a: Solo — name + role */}
                  {bookingFlowStep === 'solo' && (
                    <View style={{ gap: 12 }}>
                      <FieldGroup label="Your Name" theme={theme}>
                        <RNInput
                          value={soloName}
                          onChange={setSoloName}
                          placeholder="e.g. Maria"
                          theme={theme}
                        />
                      </FieldGroup>

                      <View>
                        <Text style={{
                          fontFamily: 'DMSans_700Bold',
                          fontSize: 11, color: theme.muted,
                          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
                        }}>
                          SELECT YOUR ROLE
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {bookingModal.roles.map(role => {
                            const enrolled = bookingModal.roleEnrollments[role.name] || 0;
                            const remaining = role.capacity - enrolled;
                            const isFull = remaining <= 0;
                            const isSelected = soloRole === role.name;
                            return (
                              <Pressable
                                key={role.name}
                                onPress={() => !isFull && setSoloRole(role.name)}
                                style={{
                                  flex: 1,
                                  borderWidth: isSelected ? 1.5 : 1,
                                  borderColor: isSelected ? theme.accent : theme.border,
                                  borderRadius: 10, padding: 12,
                                  backgroundColor: isSelected ? theme.accent + '18' : isFull ? theme.surfaceAlt : 'transparent',
                                  alignItems: 'center',
                                  opacity: isFull ? 0.5 : 1,
                                }}
                              >
                                <Text style={{
                                  fontFamily: 'DMSans_700Bold',
                                  fontSize: 14,
                                  color: isSelected ? theme.accentLight : isFull ? theme.muted : theme.text,
                                }}>
                                  {role.name}
                                </Text>
                                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: theme.muted, marginTop: 2 }}>
                                  {isFull ? 'Full' : `${remaining} left`}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      <Pressable
                        onPress={() => {
                          if (!soloName.trim() || !soloRole) return;
                          handleSoloBook(bookingModal, soloName.trim(), soloRole);
                          resetBookingFlow();
                        }}
                        disabled={!soloName.trim() || !soloRole}
                        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                      >
                        <LinearGradient
                          colors={soloName.trim() && soloRole ? [theme.accent, '#e06b9a'] : [theme.border, theme.border]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 13, borderRadius: 10, alignItems: 'center' }}
                        >
                          <Text style={{
                            color: soloName.trim() && soloRole ? '#fff' : theme.muted,
                            fontFamily: 'DMSans_700Bold', fontWeight: '700', fontSize: 14,
                          }}>
                            {soloRole
                              ? `Confirm ${soloRole} · €${getDiscountedPrice(bookingModal)}`
                              : 'Select a role'}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  )}

                  {/* Step 2b: Pair — names + roles */}
                  {bookingFlowStep === 'pair' && (
                    <View style={{ gap: 12 }}>
                      {/* My name + role */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={{ flex: 2 }}>
                          <FieldGroup label="Your Name" theme={theme}>
                            <RNInput
                              value={pairMyName}
                              onChange={setPairMyName}
                              placeholder="Your name"
                              theme={theme}
                            />
                          </FieldGroup>
                        </View>
                        <View style={{ flex: 1 }}>
                          <FieldGroup label="Your Role" theme={theme}>
                            <CustomDropdown
                              value={pairMyRole}
                              options={bookingModal.roles.map(r => ({ label: r.name, value: r.name }))}
                              onChange={setPairMyRole}
                              border={theme.border}
                              surfaceAlt={theme.surfaceAlt}
                              surface={theme.surface}
                              text={theme.text}
                              muted={theme.muted}
                            />
                          </FieldGroup>
                        </View>
                      </View>

                      {/* Partner name + role */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={{ flex: 2 }}>
                          <FieldGroup label="Partner's Name" theme={theme}>
                            <RNInput
                              value={pairPartnerName}
                              onChange={setPairPartnerName}
                              placeholder="Partner's name"
                              theme={theme}
                            />
                          </FieldGroup>
                        </View>
                        <View style={{ flex: 1 }}>
                          <FieldGroup label="Their Role" theme={theme}>
                            <CustomDropdown
                              value={pairPartnerRole}
                              options={bookingModal.roles
                                .filter(r => r.name !== pairMyRole)
                                .map(r => ({ label: r.name, value: r.name }))}
                              onChange={setPairPartnerRole}
                              border={theme.border}
                              surfaceAlt={theme.surfaceAlt}
                              surface={theme.surface}
                              text={theme.text}
                              muted={theme.muted}
                            />
                          </FieldGroup>
                        </View>
                      </View>

                      {pairMyRole && pairMyRole === pairPartnerRole && (
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#e05050' }}>
                          Both roles must be different.
                        </Text>
                      )}

                      <Pressable
                        onPress={() => {
                          if (!pairMyName.trim() || !pairPartnerName.trim() || !pairMyRole || !pairPartnerRole || pairMyRole === pairPartnerRole) return;
                          handlePairBook(bookingModal, pairMyName.trim(), pairMyRole, pairPartnerName.trim(), pairPartnerRole);
                          resetBookingFlow();
                        }}
                        disabled={!pairMyName.trim() || !pairPartnerName.trim() || !pairMyRole || !pairPartnerRole || pairMyRole === pairPartnerRole}
                        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                      >
                        <LinearGradient
                          colors={
                            pairMyName.trim() && pairPartnerName.trim() && pairMyRole && pairPartnerRole && pairMyRole !== pairPartnerRole
                              ? [theme.accent, '#e06b9a']
                              : [theme.border, theme.border]
                          }
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 13, borderRadius: 10, alignItems: 'center' }}
                        >
                          <Text style={{
                            color: pairMyName.trim() && pairPartnerName.trim() && pairMyRole && pairPartnerRole && pairMyRole !== pairPartnerRole
                              ? '#fff' : theme.muted,
                            fontFamily: 'DMSans_700Bold', fontWeight: '700', fontSize: 14,
                          }}>
                            Book as Pair · €{getDiscountedPrice(bookingModal)}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ CREATE CLASS MODAL ══ */}
      <Modal
        visible={createModal}
        animationType="slide"
        transparent
        onRequestClose={() => { setCreateModal(false); setCreateStep(1); setCreateHasRoles(false); setNewClass(BLANK_NEW_CLASS); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => { setCreateModal(false); setCreateStep(1); setCreateHasRoles(false); setNewClass(BLANK_NEW_CLASS); }}
            />
            <View style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              maxHeight: screenHeight * 0.92,
              borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.3, shadowRadius: 24, elevation: 20,
            }}>
              {/* Wizard header */}
              <View style={{
                paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
                borderBottomWidth: 1, borderBottomColor: theme.border,
              }}>
                {/* Step progress bar */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                  {([1, 2, 3] as const).map(s => (
                    <View
                      key={s}
                      style={{
                        flex: 1, height: 3, borderRadius: 2,
                        backgroundColor: s <= createStep ? theme.accent : theme.border,
                      }}
                    />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{
                      fontFamily: 'CormorantGaramond_600SemiBold',
                      fontSize: 22, color: theme.text,
                    }}>
                      {createStep === 1 ? 'Basic Details' : createStep === 2 ? 'Roles & Capacity' : 'Price & Description'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.muted, fontFamily: 'DMSans_400Regular', marginTop: 1 }}>
                      Step {createStep} of 3
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => { setCreateModal(false); setCreateStep(1); setCreateHasRoles(false); setNewClass(BLANK_NEW_CLASS); }}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? theme.border : theme.surfaceAlt,
                      width: 32, height: 32, borderRadius: 8,
                      alignItems: 'center', justifyContent: 'center',
                    })}
                  >
                    <Text style={{ color: theme.muted, fontSize: 18 }}>×</Text>
                  </Pressable>
                </View>
              </View>

              <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>

                {/* ── STEP 1: Basic Details ── */}
                {createStep === 1 && (
                  <>
                    <FieldGroup label="Class Title" theme={theme}>
                      <RNInput
                        value={newClass.title}
                        onChange={v => setNewClass(p => ({ ...p, title: v }))}
                        placeholder="e.g. Salsa Social"
                        theme={theme}
                      />
                    </FieldGroup>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <FieldGroup label="Teacher Name" theme={theme}>
                          <RNInput
                            value={newClass.teacher}
                            onChange={v => setNewClass(p => ({ ...p, teacher: v }))}
                            placeholder="Your name"
                            theme={theme}
                          />
                        </FieldGroup>
                      </View>
                      <View style={{ flex: 1 }}>
                        <FieldGroup label="Category" theme={theme}>
                          <CustomDropdown
                            value={newClass.category}
                            options={categoryOptions}
                            onChange={v => setNewClass(p => ({ ...p, category: v }))}
                            border={theme.border}
                            surfaceAlt={theme.surfaceAlt}
                            surface={theme.surface}
                            text={theme.text}
                            muted={theme.muted}
                          />
                        </FieldGroup>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <FieldGroup label="Date" theme={theme}>
                          <RNInput
                            value={newClass.date}
                            onChange={v => setNewClass(p => ({ ...p, date: v }))}
                            placeholder="YYYY-MM-DD"
                            theme={theme}
                          />
                        </FieldGroup>
                      </View>
                      <View style={{ flex: 1 }}>
                        <FieldGroup label="Time" theme={theme}>
                          <RNInput
                            value={newClass.time}
                            onChange={v => setNewClass(p => ({ ...p, time: v }))}
                            placeholder="HH:MM"
                            theme={theme}
                          />
                        </FieldGroup>
                      </View>
                      <View style={{ flex: 1 }}>
                        <FieldGroup label="Duration (min)" theme={theme}>
                          <RNInput
                            value={newClass.duration}
                            onChange={v => setNewClass(p => ({ ...p, duration: v }))}
                            placeholder="60"
                            theme={theme}
                            keyboardType="numeric"
                          />
                        </FieldGroup>
                      </View>
                    </View>

                    <View style={{ backgroundColor: theme.surfaceAlt, borderRadius: 12, padding: 16, gap: 10 }}>
                      <Text style={{
                        fontSize: 12, fontWeight: '700', color: theme.accentLight,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        fontFamily: 'DMSans_700Bold',
                      }}>
                        📍 Location
                      </Text>
                      <FieldGroup label="Street Address" theme={theme}>
                        <RNInput
                          value={newClass.address}
                          onChange={v => setNewClass(p => ({ ...p, address: v }))}
                          placeholder="e.g. Rue de la Loi 42, Brussels"
                          theme={theme}
                          bgOverride={theme.border + '50'}
                        />
                      </FieldGroup>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <FieldGroup label="Latitude (optional)" theme={theme}>
                            <RNInput
                              value={newClass.lat}
                              onChange={v => setNewClass(p => ({ ...p, lat: v }))}
                              placeholder="50.8503"
                              theme={theme}
                              keyboardType="numeric"
                              bgOverride={theme.border + '50'}
                            />
                          </FieldGroup>
                        </View>
                        <View style={{ flex: 1 }}>
                          <FieldGroup label="Longitude (optional)" theme={theme}>
                            <RNInput
                              value={newClass.lng}
                              onChange={v => setNewClass(p => ({ ...p, lng: v }))}
                              placeholder="4.3517"
                              theme={theme}
                              keyboardType="numeric"
                              bgOverride={theme.border + '50'}
                            />
                          </FieldGroup>
                        </View>
                      </View>
                    </View>

                    {/* Next button */}
                    <Pressable
                      onPress={() => setCreateStep(2)}
                      disabled={!(newClass.title && newClass.teacher && newClass.address && newClass.date)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                    >
                      <LinearGradient
                        colors={
                          (newClass.title && newClass.teacher && newClass.address && newClass.date)
                            ? [theme.accent, '#e06b9a']
                            : [theme.border, theme.border]
                        }
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                      >
                        <Text style={{
                          color: (newClass.title && newClass.teacher && newClass.address && newClass.date) ? '#fff' : theme.muted,
                          fontWeight: '700', fontSize: 15, fontFamily: 'DMSans_700Bold',
                        }}>
                          Next →
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </>
                )}

                {/* ── STEP 2: Roles & Capacity ── */}
                {createStep === 2 && (
                  <>
                    <Text style={{
                      fontFamily: 'DMSans_600SemiBold',
                      fontSize: 14, color: theme.text, marginBottom: 4,
                    }}>
                      Does this class use roles?
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {[true, false].map(hasRoles => (
                        <Pressable
                          key={String(hasRoles)}
                          onPress={() => {
                            setCreateHasRoles(hasRoles);
                            if (!hasRoles) setNewClass(p => ({ ...p, roles: [], minPairs: '0' }));
                          }}
                          style={{
                            flex: 1,
                            borderWidth: createHasRoles === hasRoles ? 1.5 : 1,
                            borderColor: createHasRoles === hasRoles ? theme.accent : theme.border,
                            borderRadius: 10, padding: 12,
                            backgroundColor: createHasRoles === hasRoles ? theme.accent + '18' : 'transparent',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{
                            fontFamily: 'DMSans_600SemiBold',
                            fontSize: 13,
                            color: createHasRoles === hasRoles ? theme.accentLight : theme.text,
                          }}>
                            {hasRoles ? 'Yes, add roles' : 'No roles'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {createHasRoles ? (
                      <>
                        {/* Role rows */}
                        <View style={{ gap: 8 }}>
                          {newClass.roles.map((role, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                              <View style={{ flex: 2 }}>
                                <RNInput
                                  value={role.name}
                                  onChange={v => setNewClass(p => ({
                                    ...p,
                                    roles: p.roles.map((r, i) => i === idx ? { ...r, name: v } : r),
                                  }))}
                                  placeholder="Role name (e.g. Lead)"
                                  theme={theme}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <RNInput
                                  value={role.capacity}
                                  onChange={v => setNewClass(p => ({
                                    ...p,
                                    roles: p.roles.map((r, i) => i === idx ? { ...r, capacity: v } : r),
                                  }))}
                                  placeholder="Cap"
                                  theme={theme}
                                  keyboardType="numeric"
                                />
                              </View>
                              <Pressable
                                onPress={() => setNewClass(p => ({
                                  ...p,
                                  roles: p.roles.filter((_, i) => i !== idx),
                                }))}
                                style={{ paddingHorizontal: 8, paddingVertical: 10 }}
                              >
                                <Text style={{ color: '#e05050', fontSize: 18 }}>×</Text>
                              </Pressable>
                            </View>
                          ))}
                        </View>

                        {/* Add role button */}
                        <Pressable
                          onPress={() => setNewClass(p => ({
                            ...p,
                            roles: [...p.roles, { name: '', capacity: '10' }],
                          }))}
                          style={{
                            borderWidth: 1, borderStyle: 'dashed',
                            borderColor: theme.accent, borderRadius: 8,
                            paddingVertical: 10, alignItems: 'center',
                          }}
                        >
                          <Text style={{
                            color: theme.accentLight,
                            fontFamily: 'DMSans_600SemiBold', fontSize: 13,
                          }}>
                            + Add role
                          </Text>
                        </Pressable>

                        {/* Min pairs */}
                        <View style={{ backgroundColor: theme.surfaceAlt, borderRadius: 12, padding: 14, gap: 8 }}>
                          <FieldGroup label="Minimum Pairs to Run" theme={theme}>
                            <RNInput
                              value={newClass.minPairs}
                              onChange={v => setNewClass(p => ({ ...p, minPairs: v }))}
                              placeholder="3"
                              theme={theme}
                              keyboardType="numeric"
                            />
                          </FieldGroup>
                          <Text style={{ fontSize: 11, color: theme.muted, fontFamily: 'DMSans_400Regular' }}>
                            Class cancels 48h before if minimum is not reached.
                          </Text>
                        </View>
                      </>
                    ) : (
                      <FieldGroup label="Max Capacity" theme={theme}>
                        <RNInput
                          value={newClass.capacity}
                          onChange={v => setNewClass(p => ({ ...p, capacity: v }))}
                          placeholder="10"
                          theme={theme}
                          keyboardType="numeric"
                        />
                      </FieldGroup>
                    )}

                    {/* Back / Next */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        onPress={() => setCreateStep(1)}
                        style={({ pressed }) => ({
                          flex: 1, paddingVertical: 12, borderRadius: 10,
                          borderWidth: 1, borderColor: theme.border,
                          alignItems: 'center',
                          backgroundColor: pressed ? theme.surfaceAlt : 'transparent',
                        })}
                      >
                        <Text style={{ color: theme.text, fontFamily: 'DMSans_600SemiBold' }}>← Back</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setCreateStep(3)}
                        disabled={createHasRoles && newClass.roles.filter(r => r.name.trim()).length < 2}
                        style={({ pressed }) => ({ flex: 2, opacity: pressed ? 0.85 : 1 })}
                      >
                        <LinearGradient
                          colors={
                            (!createHasRoles || newClass.roles.filter(r => r.name.trim()).length >= 2)
                              ? [theme.accent, '#e06b9a']
                              : [theme.border, theme.border]
                          }
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                        >
                          <Text style={{
                            color: (!createHasRoles || newClass.roles.filter(r => r.name.trim()).length >= 2)
                              ? '#fff' : theme.muted,
                            fontFamily: 'DMSans_700Bold', fontWeight: '700',
                          }}>
                            Next →
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </>
                )}

                {/* ── STEP 3: Price & Description ── */}
                {createStep === 3 && (
                  <>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <FieldGroup label="Base Price (€)" theme={theme}>
                          <RNInput
                            value={newClass.basePrice}
                            onChange={v => setNewClass(p => ({ ...p, basePrice: v }))}
                            placeholder="30"
                            theme={theme}
                            keyboardType="numeric"
                          />
                        </FieldGroup>
                      </View>
                    </View>

                    <View style={{ backgroundColor: theme.surfaceAlt, borderRadius: 12, padding: 16, gap: 10 }}>
                      <Text style={{
                        fontSize: 12, fontWeight: '700', color: theme.green,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        fontFamily: 'DMSans_700Bold',
                      }}>
                        🏷️ Discounts
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <FieldGroup label="Student discount (%)" theme={theme}>
                            <RNInput
                              value={newClass.discounts.student}
                              onChange={v => setNewClass(p => ({ ...p, discounts: { ...p.discounts, student: v } }))}
                              placeholder="20"
                              theme={theme}
                              keyboardType="numeric"
                              bgOverride={theme.border + '50'}
                            />
                          </FieldGroup>
                        </View>
                        <View style={{ flex: 1 }}>
                          <FieldGroup label="Senior / Retired (%)" theme={theme}>
                            <RNInput
                              value={newClass.discounts.retired}
                              onChange={v => setNewClass(p => ({ ...p, discounts: { ...p.discounts, retired: v } }))}
                              placeholder="30"
                              theme={theme}
                              keyboardType="numeric"
                              bgOverride={theme.border + '50'}
                            />
                          </FieldGroup>
                        </View>
                      </View>
                      {newClass.basePrice ? (
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                          <Text style={{ fontSize: 12, color: theme.muted, fontFamily: 'DMSans_400Regular' }}>
                            {'🎓 Students pay: '}
                            <Text style={{ color: theme.green, fontFamily: 'DMSans_700Bold' }}>
                              €{(Number(newClass.basePrice) * (1 - Number(newClass.discounts.student) / 100)).toFixed(2)}
                            </Text>
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.muted, fontFamily: 'DMSans_400Regular' }}>
                            {'👴 Seniors pay: '}
                            <Text style={{ color: theme.green, fontFamily: 'DMSans_700Bold' }}>
                              €{(Number(newClass.basePrice) * (1 - Number(newClass.discounts.retired) / 100)).toFixed(2)}
                            </Text>
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <FieldGroup label="Description" theme={theme}>
                      <RNInput
                        value={newClass.description}
                        onChange={v => setNewClass(p => ({ ...p, description: v }))}
                        placeholder="What will students learn?"
                        theme={theme}
                        multiline
                      />
                    </FieldGroup>

                    <FieldGroup label="Class Colour" theme={theme}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {colorOptions.map(c => (
                          <Pressable
                            key={c}
                            onPress={() => setNewClass(p => ({ ...p, color: c }))}
                            style={{
                              width: 28, height: 28, borderRadius: 14,
                              backgroundColor: c,
                              borderWidth: newClass.color === c ? 3 : 0,
                              borderColor: theme.accent,
                            }}
                          />
                        ))}
                      </View>
                    </FieldGroup>

                    {/* Back / Create */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        onPress={() => setCreateStep(2)}
                        style={({ pressed }) => ({
                          flex: 1, paddingVertical: 12, borderRadius: 10,
                          borderWidth: 1, borderColor: theme.border,
                          alignItems: 'center',
                          backgroundColor: pressed ? theme.surfaceAlt : 'transparent',
                        })}
                      >
                        <Text style={{ color: theme.text, fontFamily: 'DMSans_600SemiBold' }}>← Back</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCreateClass}
                        disabled={!newClass.basePrice}
                        style={({ pressed }) => ({ flex: 2, opacity: pressed ? 0.85 : 1 })}
                      >
                        <LinearGradient
                          colors={newClass.basePrice ? [theme.accent, '#e06b9a'] : [theme.border, theme.border]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                        >
                          <Text style={{
                            color: newClass.basePrice ? '#fff' : theme.muted,
                            fontWeight: '700', fontSize: 15, fontFamily: 'DMSans_700Bold',
                          }}>
                            Create Class
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </>
                )}

              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SignInSignUpModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={account => {
          setCurrentAccount(account);
          setShowAuthModal(false);
          if (pendingBookingClass) {
            setBookingModal(pendingBookingClass);
            setPendingBookingClass(null);
          }
        }}
        theme={theme}
      />

      {currentAccount && (
        <ProfileScreen
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          account={currentAccount}
          onAccountUpdate={updated => setCurrentAccount(updated)}
          onSignOut={async () => { await signOut(); setCurrentAccount(null); setShowProfileModal(false); setShowVerificationModal(false); }}
          onOpenVerification={account => {
            setCurrentAccount(account);
            setShowProfileModal(false);
            setShowVerificationModal(true);
          }}
          theme={theme}
        />
      )}

      {currentAccount && (
        <VerificationModal
          visible={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          account={currentAccount}
          onAccountUpdate={updated => setCurrentAccount(updated)}
          theme={theme}
        />
      )}

    </SafeAreaView>
  );
}
