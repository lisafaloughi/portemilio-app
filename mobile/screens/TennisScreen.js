import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Linking,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';
import { useAuth } from '../context';
import { useFacility, facilityImages, toAbsolute } from '../data/facilities';

const HERO_HEIGHT = Dimensions.get('window').width;
const FALLBACK_IMAGES = [require('../assets/tennis.jpg')];
const FALLBACK_TITLE = 'Tennis';
const FALLBACK_DESCRIPTION = 'Two outdoor courts at the resort. Pick a free slot from the timetable below to book a court, or train with one of our coaches.';
const SCREEN_W = Dimensions.get('window').width;
const SESSION_PRICE = 15;

const FALLBACK_COACHES = [
  {
    id: 'oksana',
    name: 'Oksana Belonenko',
    bio: 'Bill Adams International Tennis Academy · Florida, USA',
    availability: 'Mon · Wed · Fri · Sat',
    phone: '+96171488488',
    photo: null,
  },
  {
    id: 'fabrice',
    name: 'Fabrice Hilaire',
    bio: 'ITF Level II certified · Istanbul, Dubai, Tunis, Abidjan',
    availability: 'Tue · Thu · Sat · Sun',
    phone: '+2250707177702',
    photo: null,
  },
];
const FALLBACK_WARNING = 'When you book with a coach, they handle the court reservation — no need to book the court separately.';
const FALLBACK_COACH_HINT = `Book a session with one of our coaches · $${15} per session, court included`;

const OPEN_HOUR = 7;
const CLOSE_HOUR = 21;
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CELL_HEIGHT = 38;
const TIME_COL_WIDTH = 36;

const COURTS = [
  { id: 1, label: 'Court 1', resourceName: 'Tennis Court 1' },
  { id: 2, label: 'Court 2', resourceName: 'Tennis Court 2' },
];

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x;
}
function fmtHour(h) {
  const period = h >= 12 ? 'p' : 'a';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
}

export default function TennisScreen({ navigation }) {
  const { isGuest, signOut } = useAuth();
  const [heroIdx, setHeroIdx] = useState(0);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pickedSlot, setPickedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selection, setSelection] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(1);
  const [guestAlertVisible, setGuestAlertVisible] = useState(false);
  const [bookingSuccessVisible, setBookingSuccessVisible] = useState(false);
  const [cancelModal, setCancelModal] = useState(null); // { booking }
  const [cancelSuccessVisible, setCancelSuccessVisible] = useState(false);

  const facility = useFacility('tennis');
  const apiImgs = facilityImages(facility);
  const heroImages = apiImgs.length ? apiImgs : FALLBACK_IMAGES;
  const heroTitle = facility?.name || FALLBACK_TITLE;
  const heroDescription = facility?.description || FALLBACK_DESCRIPTION;
  const warningText = facility?.warning_message || FALLBACK_WARNING;
  const coachHint = facility?.coach_hint || FALLBACK_COACH_HINT;
  // Coaches: each item has name (= name), bio (= subtitle), availability (= description), phone
  const coaches = (facility?.items && facility.items.filter(i => i.kind === 'coach').length)
    ? facility.items.filter(i => i.kind === 'coach').map(c => ({
        id: String(c.id),
        name: c.name,
        bio: c.subtitle || '',
        availability: c.description || '',
        phone: c.phone || '',
        photo: c.image_url ? { uri: toAbsolute(c.image_url) } : null,
      }))
    : FALLBACK_COACHES;

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const id = setInterval(() => setHeroIdx(p => (p + 1) % heroImages.length), 4000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  const loadWeek = useCallback(async () => {
    setLoading(true);
    try {
      const from = weekStart.toISOString();
      const to = new Date(weekStart.getTime() + 7 * 24 * 3600 * 1000).toISOString();
      const data = await api.availability('tennis', from, to);
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadWeek(); }, [loadWeek]);

  // Index booked slots for the currently selected court only.
  // Past slots are excluded from the index so they display as plain past cells.
  const indexed = useMemo(() => {
    const courtName = COURTS[selectedCourt - 1].resourceName;
    const now = new Date();
    const map = {};
    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      // If the booking has a resource_name, it must match the selected court.
      // Bookings with no resource_name (legacy) are shown on both courts.
      if (b.resource_name && b.resource_name !== courtName) continue;
      const start = new Date(b.start_time.includes('T') ? b.start_time : b.start_time.replace(' ', 'T') + 'Z');
      const end = b.end_time
        ? new Date(b.end_time.includes('T') ? b.end_time : b.end_time.replace(' ', 'T') + 'Z')
        : new Date(start.getTime() + 60 * 60 * 1000);
      // Skip slots that are entirely in the past.
      if (end <= now) continue;
      const startHour = start.getHours();
      let endHour = end.getHours();
      if (end.getMinutes() === 0 && endHour > startHour) endHour -= 1;
      for (let hh = startHour; hh <= endHour; hh++) {
        const key = `${start.toDateString()}|${hh}`;
        map[key] = b;
      }
    }
    return map;
  }, [bookings, selectedCourt]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
    }),
    [weekStart]
  );

  const callPhone = (number) => Linking.openURL(`tel:${number.replace(/\s+/g, '')}`);
  const whatsApp = (number) => {
    const clean = number.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${clean}`).catch(() =>
      Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp. Try calling instead.')
    );
  };
  const openOnMap = () => navigation.navigate('ResortMap', { pinId: 'tennis-1' });

  const goPrevWeek = () => {
    const x = new Date(weekStart); x.setDate(weekStart.getDate() - 7); setWeekStart(x);
  };
  const goNextWeek = () => {
    const x = new Date(weekStart); x.setDate(weekStart.getDate() + 7); setWeekStart(x);
  };
  const goThisWeek = () => setWeekStart(startOfWeek(new Date()));

  const cellWidth = (SCREEN_W - 22 * 2 - 36) / 7;

  const daysRef = useRef(days);
  const indexedRef = useRef(indexed);
  const cellWidthRef = useRef(cellWidth);
  const selectionRef = useRef(null);
  const gridBodyRef = useRef(null);
  const gridPageOrigin = useRef({ x: 0, y: 0 });
  const dragActive = useRef(false);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);
  const initialTouch = useRef(null);
  const panClaimed = useRef(false);
  daysRef.current = days;
  indexedRef.current = indexed;
  cellWidthRef.current = cellWidth;

  const cellAtPage = (pageX, pageY) => {
    const localX = pageX - gridPageOrigin.current.x - TIME_COL_WIDTH;
    const localY = pageY - gridPageOrigin.current.y;
    if (localX < 0 || localY < 0) return null;
    const col = Math.floor(localX / cellWidthRef.current);
    const row = Math.floor(localY / CELL_HEIGHT);
    if (col < 0 || col >= 7 || row < 0 || row >= HOURS.length) return null;
    return { day: daysRef.current[col], hour: HOURS[row] };
  };

  const isBlocked = (day, hour) => {
    const slot = new Date(day); slot.setHours(hour, 0, 0, 0);
    // Only block hours that have fully ended. A slot whose hour is still ongoing
    // (e.g. 1:00–2:00 at 1:05) stays bookable for guests too.
    const slotEnd = new Date(slot.getTime() + 60 * 60 * 1000);
    if (slotEnd <= new Date()) return true;
    const key = `${day.toDateString()}|${hour}`;
    return !!indexedRef.current[key];
  };

  const guestRef = useRef(isGuest);
  guestRef.current = isGuest;

  const handleCellLongPress = useCallback((day, hour) => {
    if (isBlocked(day, hour) || guestRef.current) return;
    // Set drag state synchronously so the very first move event can claim the gesture.
    // measureInWindow is async — if we waited for it, the finger could start moving
    // before dragActive is true and the PanResponder would miss the gesture.
    dragActive.current = true;
    selectionRef.current = { day, startHour: hour, endHour: hour };
    setSelection({ day, startHour: hour, endHour: hour });
    gridBodyRef.current?.measureInWindow((x, y) => {
      gridPageOrigin.current = { x, y };
    });
  }, []);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: () => dragActive.current,
    onMoveShouldSetPanResponderCapture: () => dragActive.current,

    onPanResponderGrant: () => {
      panClaimed.current = true;
    },
    onPanResponderMove: (e) => {
      if (!dragActive.current) return;
      const cell = cellAtPage(e.nativeEvent.pageX, e.nativeEvent.pageY);
      const sel = selectionRef.current;
      if (!cell || !sel) return;
      if (cell.day.toDateString() !== sel.day.toDateString()) return;
      let newEnd = Math.max(sel.startHour, cell.hour);
      for (let hh = sel.startHour + 1; hh <= newEnd; hh++) {
        if (isBlocked(sel.day, hh)) { newEnd = hh - 1; break; }
      }
      if (newEnd !== sel.endHour) {
        selectionRef.current = { ...sel, endHour: newEnd };
        setSelection({ ...selectionRef.current });
      }
    },
    onPanResponderRelease: () => {
      const sel = selectionRef.current;
      selectionRef.current = null;
      dragActive.current = false;
      panClaimed.current = false;
      if (!sel) { setSelection(null); return; }
      const start = new Date(sel.day); start.setHours(sel.startHour, 0, 0, 0);
      const hours = sel.endHour - sel.startHour + 1;
      // Keep selection highlighted in background while confirm modal is open.
      setPickedSlot({ start, hours });
    },
    onPanResponderTerminate: () => {
      selectionRef.current = null;
      dragActive.current = false;
      panClaimed.current = false;
      setSelection(null);
    },
  })).current;

  const inSelection = (day, hour) => {
    if (!selection) return false;
    if (day.toDateString() !== selection.day.toDateString()) return false;
    return hour >= selection.startHour && hour <= selection.endHour;
  };

  const confirmBooking = async () => {
    if (!pickedSlot || submitting) return;
    setSubmitting(true);
    try {
      const end = new Date(pickedSlot.start); end.setHours(end.getHours() + pickedSlot.hours);
      await api.createBooking({
        resource_type: 'tennis',
        resource_name: COURTS[selectedCourt - 1].resourceName,
        start_time: pickedSlot.start.toISOString(),
        end_time: end.toISOString(),
        party_size: 2,
      });
      setPickedSlot(null);
      setSelection(null);
      await loadWeek();
      setBookingSuccessVisible(true);
    } catch (e) {
      Alert.alert('Could not book', e.message || 'Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelModal || submitting) return;
    setSubmitting(true);
    try {
      await api.cancelBooking(cancelModal.booking.id);
      setCancelModal(null);
      await loadWeek();
      setCancelSuccessVisible(true);
    } catch (e) {
      Alert.alert('Could not cancel', e.message || 'Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Build cells for one day column, merging consecutive hours of the same booking
  // into a single tall block so they appear as one unified rectangle.
  const renderDayColumn = (d) => {
    const cells = [];
    let hh = OPEN_HOUR;
    while (hh < CLOSE_HOUR) {
      const slot = new Date(d); slot.setHours(hh, 0, 0, 0);
      // A slot is only "past" after its full hour has elapsed — so a live booking
      // remains visible (and a live free slot remains selectable) until end of hour.
      const slotEnd = new Date(slot.getTime() + 60 * 60 * 1000);
      const isPast = slotEnd <= new Date();
      const key = `${d.toDateString()}|${hh}`;
      // Show ongoing bookings across their full duration, even past hours.
      const b = indexed[key];

      if (b) {
        // Extend span while consecutive hours belong to the same booking.
        let span = 1;
        while (hh + span < CLOSE_HOUR) {
          const nk = `${d.toDateString()}|${hh + span}`;
          if (indexed[nk]?.id === b.id) span++;
          else break;
        }
        cells.push(
          <Pressable
            key={hh}
            style={[
              styles.cell,
              b.is_mine ? styles.cellMine : styles.cellBooked,
              { height: CELL_HEIGHT * span },
            ]}
            onLongPress={b.is_mine ? () => setCancelModal({ booking: b }) : undefined}
            delayLongPress={500}
          >
            <MaterialCommunityIcons
              name={b.is_mine ? 'check-circle-outline' : 'tennis-ball'}
              size={b.is_mine ? 16 : 12}
              color="#fff"
            />
          </Pressable>
        );
        hh += span;
      } else {
        const sel = inSelection(d, hh);
        cells.push(
          <View
            key={hh}
            style={[styles.cell, isPast ? styles.cellPast : sel ? styles.cellSelecting : null, { height: CELL_HEIGHT }]}
          />
        );
        hh++;
      }
    }
    return cells;
  };

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart); end.setDate(weekStart.getDate() + 6);
    const sameMonth = weekStart.getMonth() === end.getMonth();
    const left = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const right = end.toLocaleDateString(undefined, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' });
    return `${left} – ${right}`;
  }, [weekStart]);

  return (
    <View style={styles.container}>
      <ScrollView scrollEnabled={!selection} showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.hero}>
          {heroImages.map((src, i) => (
            <View key={i} style={[StyleSheet.absoluteFill, { opacity: i === heroIdx ? 1 : 0 }]}>
              <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ))}
          <View style={styles.heroShade} />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{heroTitle}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.description}>{heroDescription}</Text>

          <View style={[styles.rowsCard, { marginTop: spacing.xl }]}>
            <Pressable style={styles.row} onPress={openOnMap} hitSlop={6}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.accent} style={{ marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Location</Text>
                <Text style={styles.rowSubtitle}>Two outdoor courts · Activities zone</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {/* ── Coaches ──────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>NEED A COACH?</Text>
          <Text style={styles.sectionHint}>{coachHint}</Text>
          {warningText ? (
            <View style={styles.coachNote}>
              <MaterialCommunityIcons name="information-outline" size={15} color={colors.accent} style={{ marginTop: 1 }} />
              <Text style={styles.coachNoteText}>{warningText}</Text>
            </View>
          ) : null}

          {coaches.map(c => (
            <View key={c.id} style={styles.coachCard}>
              <View style={styles.photoCircle}>
                {c.photo ? (
                  <Image source={c.photo} style={styles.photo} />
                ) : (
                  <MaterialCommunityIcons name="account" size={36} color={colors.muted} />
                )}
              </View>
              <View style={styles.coachInfo}>
                <Text style={styles.coachName}>{c.name}</Text>
                <Text style={styles.coachBio}>{c.bio}</Text>
                <View style={styles.coachAvailRow}>
                  <MaterialCommunityIcons name="calendar-week" size={12} color={colors.accent} />
                  <Text style={styles.coachAvail}>{c.availability}</Text>
                </View>
                <View style={styles.coachActions}>
                  <Pressable style={styles.actionBtn} onPress={() => callPhone(c.phone)}>
                    <MaterialCommunityIcons name="phone-outline" size={14} color={colors.text} />
                    <Text style={styles.actionText}>Call</Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => whatsApp(c.phone)}>
                    <MaterialCommunityIcons name="whatsapp" size={14} color={colors.text} />
                    <Text style={styles.actionText}>WhatsApp</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          {/* ── Court booking timetable ───────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>BOOK A COURT</Text>

          {isGuest ? (
            <View style={styles.guestNotice}>
              <Text style={styles.guestText}>
                To book a court you'll need to{' '}
                <Text style={styles.guestLink} onPress={() => navigation.navigate('Register')}>
                  create an account
                </Text>{' '}
                or call reception at{' '}
                <Text style={styles.guestLink} onPress={() => Linking.openURL('tel:+9619123467')}>
                  +961 9 123 467
                </Text>.
              </Text>
            </View>
          ) : null}

          {/* Court toggle */}
          <View style={styles.courtToggle}>
            {COURTS.map(c => (
              <Pressable
                key={c.id}
                style={[styles.courtToggleBtn, selectedCourt === c.id && styles.courtToggleBtnActive]}
                onPress={() => setSelectedCourt(c.id)}
              >
                <MaterialCommunityIcons
                  name="tennis-ball"
                  size={13}
                  color={selectedCourt === c.id ? '#fff' : colors.accent}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.courtToggleText, selectedCourt === c.id && styles.courtToggleTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.weekNav}>
            <Pressable style={styles.weekBtn} onPress={goPrevWeek} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-left" size={20} color={colors.accent} />
            </Pressable>
            <Pressable onPress={goThisWeek} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.weekLabel}>{weekLabel}</Text>
              <Text style={styles.weekHint}>Tap to jump to this week</Text>
            </Pressable>
            <Pressable style={styles.weekBtn} onPress={goNextWeek} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.accent} />
            </Pressable>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.accent }]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.accent2 }]} />
              <Text style={styles.legendText}>Yours</Text>
            </View>
          </View>

          <View style={styles.calendar}>
            <View style={styles.calHeaderRow}>
              <View style={[styles.timeCell, styles.headCell]} />
              {days.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <View key={i} style={[styles.headCell, { width: cellWidth }, isToday && styles.headCellToday]}>
                    <Text style={[styles.headDow, isToday && { color: colors.accent2 }]}>{DOW_LABELS[i]}</Text>
                    <Text style={[styles.headDay, isToday && { color: colors.accent2 }]}>{d.getDate()}</Text>
                  </View>
                );
              })}
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <View
                ref={gridBodyRef}
                style={styles.calBody}
                {...panResponder.panHandlers}
                onLayout={() => {
                  gridBodyRef.current?.measureInWindow((x, y) => {
                    gridPageOrigin.current = { x, y };
                  });
                }}
                onTouchStart={(e) => {
                  const t = e.nativeEvent;
                  initialTouch.current = { pageX: t.pageX, pageY: t.pageY };
                  longPressFired.current = false;
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  // Re-measure now in case the page scrolled since onLayout.
                  gridBodyRef.current?.measureInWindow((x, y) => {
                    gridPageOrigin.current = { x, y };
                  });
                  longPressTimer.current = setTimeout(() => {
                    longPressTimer.current = null;
                    const cell = cellAtPage(t.pageX, t.pageY);
                    if (!cell) return;
                    if (isBlocked(cell.day, cell.hour) || guestRef.current) return;
                    longPressFired.current = true;
                    handleCellLongPress(cell.day, cell.hour);
                  }, 200);
                }}
                onTouchMove={(e) => {
                  if (!longPressTimer.current || !initialTouch.current) return;
                  const t = e.nativeEvent;
                  const dx = t.pageX - initialTouch.current.pageX;
                  const dy = t.pageY - initialTouch.current.pageY;
                  if (Math.abs(dx) > 14 || Math.abs(dy) > 14) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                }}
                onTouchEnd={(e) => {
                  const wasLongPress = longPressFired.current;
                  const wasPanClaimed = panClaimed.current;
                  const start0 = initialTouch.current;
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                  longPressFired.current = false;
                  initialTouch.current = null;

                  // Drag handled by panResponder release — nothing to do here.
                  if (wasPanClaimed) return;

                  // Long press without drag → commit single-hour booking from selection.
                  if (wasLongPress && selectionRef.current) {
                    const sel = selectionRef.current;
                    const startTime = new Date(sel.day); startTime.setHours(sel.startHour, 0, 0, 0);
                    const hours = sel.endHour - sel.startHour + 1;
                    selectionRef.current = null;
                    dragActive.current = false;
                    // Keep selection highlighted in background while confirm modal is open.
                    setPickedSlot({ start: startTime, hours });
                    return;
                  }

                  // Plain tap → book 1 hour at the touched cell.
                  if (!wasLongPress && start0) {
                    const t = e.nativeEvent;
                    const dx = (t.pageX ?? start0.pageX) - start0.pageX;
                    const dy = (t.pageY ?? start0.pageY) - start0.pageY;
                    if (Math.abs(dx) > 14 || Math.abs(dy) > 14) return; // moved too much, treat as scroll
                    const cell = cellAtPage(start0.pageX, start0.pageY);
                    if (!cell) return;
                    if (isBlocked(cell.day, cell.hour)) return;
                    if (guestRef.current) {
                      setGuestAlertVisible(true);
                      return;
                    }
                    const startTime = new Date(cell.day); startTime.setHours(cell.hour, 0, 0, 0);
                    setSelection({ day: cell.day, startHour: cell.hour, endHour: cell.hour });
                    setPickedSlot({ start: startTime, hours: 1 });
                  }
                }}
                onTouchCancel={() => {
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                  }
                  initialTouch.current = null;
                }}
              >
                {/* Time label column */}
                <View style={styles.timeColumn}>
                  {HOURS.map(hh => (
                    <View key={hh} style={styles.timeCell}>
                      <Text style={styles.timeLabel}>{fmtHour(hh)}</Text>
                    </View>
                  ))}
                </View>
                {/* One column per day — consecutive booked hours merge into one block */}
                {days.map((d, di) => (
                  <View key={di} style={{ width: cellWidth }}>
                    {renderDayColumn(d)}
                  </View>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.calHint}>
            {isGuest
              ? 'Booked slots are shown in navy. Sign in or call reception to book.'
              : 'Tap a slot for one hour, or hold and drag to select multiple hours.'}
          </Text>
        </View>
      </ScrollView>

      {/* Booking confirm modal */}
      <Modal
        transparent
        animationType="fade"
        visible={!!pickedSlot}
        onRequestClose={() => { setPickedSlot(null); setSelection(null); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="tennis" size={36} color={colors.accent} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.modalTitle}>Book this slot?</Text>
            {pickedSlot ? (() => {
              const start = pickedSlot.start;
              const end = new Date(start); end.setHours(start.getHours() + pickedSlot.hours);
              const dayLabel = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
              const startLabel = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
              const endLabel = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
              return (
                <Text style={styles.modalBody}>
                  {COURTS[selectedCourt - 1].label}{'\n'}{dayLabel}{'\n'}{startLabel} – {endLabel} · {pickedSlot.hours} hour{pickedSlot.hours > 1 ? 's' : ''}
                </Text>
              );
            })() : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => { setPickedSlot(null); setSelection(null); }}>
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} disabled={submitting} onPress={confirmBooking}>
                <Text style={styles.modalBtnPrimaryText}>{submitting ? 'Booking…' : 'Book it'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel booking confirmation modal */}
      <Modal
        transparent
        animationType="fade"
        visible={!!cancelModal}
        onRequestClose={() => setCancelModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="calendar-remove-outline" size={38} color="#e03030" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.modalTitle}>Cancel this booking?</Text>
            {cancelModal ? (() => {
              const b = cancelModal.booking;
              const start = new Date(b.start_time.includes('T') ? b.start_time : b.start_time.replace(' ', 'T') + 'Z');
              const end = b.end_time ? new Date(b.end_time.includes('T') ? b.end_time : b.end_time.replace(' ', 'T') + 'Z') : new Date(start.getTime() + 3600000);
              const dayLabel = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
              const startLabel = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
              const endLabel = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
              return (
                <Text style={styles.modalBody}>
                  {b.resource_name || COURTS[selectedCourt - 1].label}{'\n'}{dayLabel}{'\n'}{startLabel} – {endLabel}
                </Text>
              );
            })() : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setCancelModal(null)}>
                <Text style={styles.modalBtnGhostText}>Keep it</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#e03030', borderRadius: 8, alignItems: 'center' }]} disabled={submitting} onPress={confirmCancel}>
                <Text style={styles.modalBtnPrimaryText}>{submitting ? 'Cancelling…' : 'Cancel booking'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancellation confirmed modal */}
      <Modal
        transparent
        animationType="fade"
        visible={cancelSuccessVisible}
        onRequestClose={() => setCancelSuccessVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="calendar-check-outline" size={42} color={colors.accent} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.modalTitle}>Booking cancelled</Text>
            <Text style={styles.modalBody}>The court slot has been released and is now available again.</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => setCancelSuccessVisible(false)}>
                <Text style={styles.modalBtnPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Court booked success modal */}
      <Modal
        transparent
        animationType="fade"
        visible={bookingSuccessVisible}
        onRequestClose={() => setBookingSuccessVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="check-circle-outline" size={42} color={colors.accent} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.modalTitle}>Court booked!</Text>
            <Text style={styles.modalBody}>
              You'll get a reminder 30 minutes before your slot. See your booking under Active Requests.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => setBookingSuccessVisible(false)}>
                <Text style={styles.modalBtnPrimaryText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Guest alert modal — centered text */}
      <Modal
        transparent
        animationType="fade"
        visible={guestAlertVisible}
        onRequestClose={() => setGuestAlertVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="tennis" size={36} color={colors.accent} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.modalTitle}>Book a court</Text>
            <Text style={styles.modalBody}>
              To book a court, sign in or call reception at{'\n'}
              <Text style={styles.guestLink} onPress={() => { setGuestAlertVisible(false); Linking.openURL('tel:+9619123467'); }}>
                +961 9 123 467
              </Text>
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setGuestAlertVisible(false)}>
                <Text style={styles.modalBtnGhostText}>Dismiss</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => { setGuestAlertVisible(false); signOut(); }}
              >
                <Text style={styles.modalBtnPrimaryText}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: HERO_HEIGHT, backgroundColor: colors.bg, overflow: 'hidden' },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  heroSafe: { paddingHorizontal: 16, paddingTop: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: { position: 'absolute', left: 20, right: 20, bottom: 22 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  body: { paddingHorizontal: 22, paddingTop: 24 },
  description: { fontSize: 15, lineHeight: 22, color: colors.text },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xl,
    marginBottom: 4,
  },
  sectionHint: { fontSize: 13, color: colors.subtle, marginBottom: spacing.sm },

  // Coach note banner
  coachNote: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#fdf6ea',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  coachNoteText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },

  // Court toggle
  courtToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 4,
    marginTop: 8,
    marginBottom: 4,
    gap: 4,
  },
  courtToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  courtToggleBtnActive: {
    backgroundColor: colors.accent,
  },
  courtToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  courtToggleTextActive: {
    color: '#fff',
  },

  // Week nav
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  weekBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  weekLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  weekHint: { fontSize: 11, color: colors.muted, marginTop: 2 },

  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: colors.subtle },

  // Calendar
  calendar: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  calBody: { flexDirection: 'row' },
  timeColumn: { width: 36 },
  calHeaderRow: { flexDirection: 'row', backgroundColor: colors.bg },
  headCell: {
    paddingVertical: 6,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headCellToday: { backgroundColor: '#fdf6ea' },
  headDow: { fontSize: 10, fontWeight: '700', color: colors.subtle, letterSpacing: 0.4 },
  headDay: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 1 },
  calRow: { flexDirection: 'row' },
  timeCell: {
    width: 36,
    height: CELL_HEIGHT,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  timeLabel: { fontSize: 10, color: colors.subtle, fontWeight: '600' },
  cell: {
    height: 38,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cellBooked: { backgroundColor: colors.accent },
  cellMine: { backgroundColor: colors.accent2 },
  cellPast: { backgroundColor: '#f4f0e7' },
  cellSelecting: { backgroundColor: colors.accent2, opacity: 0.85 },

  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  calHint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },

  // Coaches
  coachCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    alignItems: 'flex-start',
  },
  photoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  photo: { width: 64, height: 64, borderRadius: 32 },
  coachInfo: { flex: 1 },
  coachName: { fontSize: 15, fontWeight: '700', color: colors.text },
  coachBio: { fontSize: 12, color: colors.subtle, marginTop: 4, lineHeight: 16 },
  coachAvailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  coachAvail: { fontSize: 12, color: colors.accent, fontWeight: '600' },
  coachActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionText: { fontSize: 12, fontWeight: '600', color: colors.text },

  // Rows card
  rowsCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 22 + 14,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },

  guestNotice: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 8,
  },
  guestText: { fontSize: 13, color: colors.subtle, lineHeight: 19 },
  guestLink: { color: colors.accent, fontWeight: '700' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtle,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnGhost: {
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalBtnGhostText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnPrimary: {
    backgroundColor: colors.accent,
  },
  modalBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
