# My Bookings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "My Bookings" tab to the student view so users can track, expand, cancel, and get directions to their booked classes.

**Architecture:** All changes are in `ClassBookingApp.tsx`. Three new state variables are added (`bookedIds`, `expandedBookingId`, `studentTab`). The student view gains a tab bar at the top; the existing browse content moves to the "Browse" tab; a new "My Bookings" tab renders a compact/expandable list of booked classes.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript, React Native `Alert`, `expo-linking` (already imported).

---

### Task 1: Add new state and update `handleBook`

**Files:**
- Modify: `ClassBookingApp.tsx`

- [ ] **Step 1: Add the three new state variables**

Find the block of `useState` calls starting at line 188 (`export default function ClassBookingApp()`). Add these three lines directly after the existing state declarations (after `const [newClass, setNewClass] = ...`):

```tsx
const [bookedIds, setBookedIds] = useState<Map<number, { pricePaid: string }>>(new Map());
const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
const [studentTab, setStudentTab] = useState<'browse' | 'bookings'>('browse');
```

- [ ] **Step 2: Update `handleBook` to record the booking**

Find the existing `handleBook` function (around line 254):

```tsx
const handleBook = (cls: ClassItem) => {
  if (cls.enrolled >= cls.capacity) return;
  setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, enrolled: c.enrolled + 1 } : c));
  setBookingModal(null);
  setSelected(null);
  showSuccess(`You're booked into "${cls.title}"!`);
};
```

Replace it with:

```tsx
const handleBook = (cls: ClassItem) => {
  if (cls.enrolled >= cls.capacity) return;
  setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, enrolled: c.enrolled + 1 } : c));
  setBookedIds(prev => new Map(prev).set(cls.id, { pricePaid: getDiscountedPrice(cls) }));
  setBookingModal(null);
  setSelected(null);
  showSuccess(`You're booked into "${cls.title}"!`);
};
```

- [ ] **Step 3: Add `handleCancelBooking` after `handleBook`**

```tsx
const handleCancelBooking = (id: number) => {
  Alert.alert(
    'Cancel Booking',
    'Are you sure you want to cancel this booking?',
    [
      { text: 'Keep It', style: 'cancel' },
      {
        text: 'Cancel Booking', style: 'destructive',
        onPress: () => {
          setClasses(prev => prev.map(c => c.id === id ? { ...c, enrolled: Math.max(0, c.enrolled - 1) } : c));
          setBookedIds(prev => { const m = new Map(prev); m.delete(id); return m; });
          setExpandedBookingId(null);
          showSuccess('Booking cancelled');
        },
      },
    ]
  );
};
```

- [ ] **Step 4: Add `Alert` to the React Native import**

Find the existing import at the top of the file:

```tsx
import {
  View, Text, Pressable, TextInput, ScrollView, Modal,
  Animated, StyleSheet, useWindowDimensions, SafeAreaView,
  Platform, KeyboardAvoidingView,
} from 'react-native';
```

Replace it with:

```tsx
import {
  View, Text, Pressable, TextInput, ScrollView, Modal,
  Animated, StyleSheet, useWindowDimensions, SafeAreaView,
  Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
```

- [ ] **Step 5: Commit**

```bash
git add ClassBookingApp.tsx
git commit -m "feat: add bookedIds state and handleCancelBooking"
```

---

### Task 2: Add the student sub-tab bar

**Files:**
- Modify: `ClassBookingApp.tsx`

The student view starts with `{view === 'student' && (` and immediately renders the hero section. We insert the tab bar before the hero.

- [ ] **Step 1: Find the student view opening**

Locate this line (around line 418):

```tsx
        {view === 'student' && (
          <>
            {/* Hero */}
```

- [ ] **Step 2: Insert the tab bar between the fragment open and the Hero comment**

Replace:

```tsx
        {view === 'student' && (
          <>
            {/* Hero */}
```

With:

```tsx
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

            {/* Hero */}
```

- [ ] **Step 3: Wrap existing browse content in a conditional**

Find the Hero section and everything below it inside the student fragment — it currently ends just before the teacher view block. The pattern looks like:

```tsx
            {/* Hero */}
            <View style={{ marginBottom: 24 }}>
              ...
            </View>

            {/* Category filter pills */}
            ...

            {/* Profile type selector */}
            ...

            {/* Class cards grid */}
            ...
```

Wrap all of this (everything from `{/* Hero */}` through to the end of the class cards `</View>`) in:

```tsx
            {studentTab === 'browse' && (
              <>
                {/* Hero */}
                ... (existing hero code unchanged) ...

                {/* Category filter pills */}
                ... (existing unchanged) ...

                {/* Profile type selector */}
                ... (existing unchanged) ...

                {/* Class cards grid */}
                ... (existing unchanged) ...
              </>
            )}
```

- [ ] **Step 4: Commit**

```bash
git add ClassBookingApp.tsx
git commit -m "feat: add Browse/My Bookings tab bar to student view"
```

---

### Task 3: Build the My Bookings tab content

**Files:**
- Modify: `ClassBookingApp.tsx`

- [ ] **Step 1: Add the My Bookings tab block after the browse conditional**

Directly after the closing `)}` of the `{studentTab === 'browse' && (...)}` block (and before the closing `</>` of the student fragment), insert:

```tsx
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
                                  📅 {new Date(cls.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {cls.time} · {cls.duration}min
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
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                                  <Text style={{
                                    fontFamily: 'DMSans_400Regular',
                                    fontSize: 12, color: theme.muted,
                                  }}>
                                    {cls.teacher} · {cls.category}
                                  </Text>
                                </View>
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
                                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cls.address)}`
                                    )}
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
```

- [ ] **Step 2: Commit**

```bash
git add ClassBookingApp.tsx
git commit -m "feat: add My Bookings tab with compact/expand cards and cancel flow"
```

---

### Task 4: Prevent double-booking

**Files:**
- Modify: `ClassBookingApp.tsx`

Currently a user can book the same class multiple times. Now that we track `bookedIds` we can block it.

- [ ] **Step 1: Disable the Book button on browse cards for already-booked classes**

Find this exact block inside the class cards grid (around line 618):

```tsx
                        <Pressable
                          onPress={() => { if (!full) setBookingModal(cls); }}
                          disabled={full}
                          style={({ pressed }) => ({
                            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9,
                            backgroundColor: full ? theme.border : theme.accent,
                            opacity: pressed && !full ? 0.85 : 1,
                          })}
                        >
                          <Text style={{
                            color: full ? theme.muted : '#fff',
                            fontWeight: '600', fontSize: 13,
                            fontFamily: 'DMSans_600SemiBold',
                          }}>
                            {full ? 'Full' : 'Book now'}
                          </Text>
                        </Pressable>
```

Replace with:

```tsx
                        <Pressable
                          onPress={() => { if (!full && !bookedIds.has(cls.id)) setBookingModal(cls); }}
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
```

- [ ] **Step 2: Also disable the Book button inside the detail modal**

Find this exact block in the detail modal (around line 955, inside `{view === 'student' && (`):

```tsx
                      <Pressable
                        onPress={() => { setBookingModal(selected); setSelected(null); }}
                        disabled={selected.enrolled >= selected.capacity}
                        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                      >
                        <LinearGradient
                          colors={
                            selected.enrolled >= selected.capacity
                              ? [theme.border, theme.border]
                              : [theme.accent, '#e06b9a']
                          }
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                        >
                          <Text style={{
                            color: selected.enrolled >= selected.capacity ? theme.muted : '#fff',
                            fontWeight: '700', fontSize: 16,
                            fontFamily: 'DMSans_700Bold',
                          }}>
                            {selected.enrolled >= selected.capacity
                              ? 'Class is full'
                              : `Book for €${getDiscountedPrice(selected)}`}
                          </Text>
```

Replace with:

```tsx
                      <Pressable
                        onPress={() => {
                          if (selected.enrolled < selected.capacity && !bookedIds.has(selected.id)) {
                            setBookingModal(selected);
                            setSelected(null);
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
```

- [ ] **Step 3: Commit**

```bash
git add ClassBookingApp.tsx
git commit -m "feat: prevent double-booking, show Booked status on cards"
```
