import { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, TextInput, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Account, signIn, signUp, updateAccount } from './AuthStore';

type Theme = {
  bg: string; surface: string; surfaceAlt: string; border: string;
  text: string; muted: string; accent: string; accentLight: string;
  green: string; amber: string;
};

// ─── SIGN-IN / SIGN-UP MODAL ─────────────────────────────────────────────────

interface SignInSignUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: (account: Account) => void;
  theme: Theme;
}

export function SignInSignUpModal({ visible, onClose, onSignIn, theme }: SignInSignUpModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  // Sign-in fields
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siError, setSiError] = useState('');
  const [siLoading, setSiLoading] = useState(false);

  // Sign-up fields
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suAvatarUri, setSuAvatarUri] = useState<string | null>(null);
  const [suError, setSuError] = useState('');
  const [suLoading, setSuLoading] = useState(false);

  const resetAll = () => {
    setSiEmail(''); setSiPassword(''); setSiError(''); setSiLoading(false);
    setSuName(''); setSuEmail(''); setSuPassword(''); setSuAvatarUri(null); setSuError(''); setSuLoading(false);
    setTab('signin');
  };

  const handleClose = () => { resetAll(); onClose(); };

  const handleSignIn = async () => {
    setSiError('');
    setSiLoading(true);
    try {
      const account = await signIn(siEmail, siPassword);
      resetAll();
      onSignIn(account);
    } catch (e: any) {
      if (e.message === 'NO_ACCOUNT') setSiError('No account found for this email.');
      else if (e.message === 'BAD_PASSWORD') setSiError('Incorrect password.');
      else setSiError('Something went wrong. Try again.');
    } finally {
      setSiLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!suAvatarUri) return;
    setSuError('');
    setSuLoading(true);
    try {
      const account = await signUp(suName, suEmail, suPassword, suAvatarUri);
      resetAll();
      onSignIn(account);
    } catch (e: any) {
      if (e.message === 'EMAIL_TAKEN') setSuError('An account with this email already exists.');
      else setSuError('Something went wrong. Try again.');
    } finally {
      setSuLoading(false);
    }
  };

  const pickAvatar = async (source: 'camera' | 'gallery') => {
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled) setSuAvatarUri(result.assets[0].uri);
    } catch {
      // picker dismissed or permission denied — no-op
    }
  };

  const input = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    secure?: boolean,
    keyboardType?: 'default' | 'email-address',
  ) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.muted}
      secureTextEntry={secure}
      keyboardType={keyboardType ?? 'default'}
      autoCapitalize="none"
      style={{
        borderWidth: 1, borderColor: theme.border, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 11,
        color: theme.text, fontSize: 15, backgroundColor: theme.surfaceAlt,
      }}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
          onPress={handleClose}
        >
          <Pressable onPress={() => {}} style={{ backgroundColor: 'transparent' }}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
                padding: 24, paddingBottom: 40,
                borderWidth: 1, borderColor: theme.border,
              }}
            >
              {/* Handle bar */}
              <View style={{
                width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border,
                alignSelf: 'center', marginBottom: 20,
              }} />

              {/* Tabs */}
              <View style={{
                flexDirection: 'row', backgroundColor: theme.surfaceAlt,
                borderRadius: 10, padding: 3,
                borderWidth: 1, borderColor: theme.border,
                marginBottom: 24,
              }}>
                {(['signin', 'signup'] as const).map(t => (
                  <Pressable
                    key={t}
                    onPress={() => setTab(t)}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 7, alignItems: 'center',
                      backgroundColor: tab === t ? theme.accent : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: tab === t ? '#fff' : theme.muted,
                      fontWeight: '600', fontSize: 14,
                    }}>
                      {t === 'signin' ? 'Sign In' : 'Create Account'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {tab === 'signin' ? (
                <View style={{ gap: 12 }}>
                  {input(siEmail, setSiEmail, 'Email address', false, 'email-address')}
                  {input(siPassword, setSiPassword, 'Password', true)}
                  {siError ? (
                    <Text style={{ color: '#e05050', fontSize: 13 }}>{siError}</Text>
                  ) : null}
                  <Pressable
                    onPress={handleSignIn}
                    disabled={siLoading || !siEmail || !siPassword}
                    style={({ pressed }) => ({
                      paddingVertical: 13, borderRadius: 10, alignItems: 'center',
                      backgroundColor: theme.accent,
                      opacity: (siLoading || !siEmail || !siPassword) ? 0.5 : pressed ? 0.85 : 1,
                    })}
                  >
                    {siLoading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Sign In</Text>
                    }
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {/* Avatar picker */}
                  <View style={{ alignItems: 'center', marginBottom: 4 }}>
                    <Pressable
                      onPress={() =>
                        Alert.alert('Profile Photo', 'Choose source', [
                          { text: 'Camera', onPress: () => pickAvatar('camera') },
                          { text: 'Gallery', onPress: () => pickAvatar('gallery') },
                          { text: 'Cancel', style: 'cancel' },
                        ])
                      }
                      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, width: 72, height: 72 })}
                    >
                      {suAvatarUri ? (
                        <Image
                          source={{ uri: suAvatarUri }}
                          style={{ width: 72, height: 72, borderRadius: 36 }}
                        />
                      ) : (
                        <View style={{
                          width: 72, height: 72, borderRadius: 36,
                          backgroundColor: theme.surfaceAlt,
                          borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: 24 }}>📷</Text>
                        </View>
                      )}
                      <View style={{
                        position: 'absolute', bottom: 0, right: 0,
                        backgroundColor: theme.accent,
                        width: 22, height: 22, borderRadius: 11,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>+</Text>
                      </View>
                    </Pressable>
                    <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6 }}>
                      {suAvatarUri ? 'Tap to change' : 'Required — tap to add photo'}
                    </Text>
                  </View>
                  {input(suName, setSuName, 'Full name')}
                  {input(suEmail, setSuEmail, 'Email address', false, 'email-address')}
                  {input(suPassword, setSuPassword, 'Password', true)}
                  {suError ? (
                    <Text style={{ color: '#e05050', fontSize: 13 }}>{suError}</Text>
                  ) : null}
                  <Pressable
                    onPress={handleSignUp}
                    disabled={suLoading || !suName || !suEmail || !suPassword || !suAvatarUri}
                    style={({ pressed }) => ({
                      paddingVertical: 13, borderRadius: 10, alignItems: 'center',
                      backgroundColor: theme.accent,
                      opacity: (suLoading || !suName || !suEmail || !suPassword || !suAvatarUri)
                        ? 0.5 : pressed ? 0.85 : 1,
                    })}
                  >
                    {suLoading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create Account</Text>
                    }
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── PROFILE SCREEN ──────────────────────────────────────────────────────────

function SectionHeader({ title, theme }: { title: string; theme: Theme }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: theme.muted,
      textTransform: 'uppercase', marginBottom: 10,
    }}>
      {title}
    </Text>
  );
}

interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
  account: Account;
  onAccountUpdate: (account: Account) => void;
  onSignOut: () => Promise<void>;
  onOpenVerification: (account: Account) => void;
  theme: Theme;
}

export function ProfileScreen({
  visible, onClose, account, onAccountUpdate, onSignOut, onOpenVerification, theme,
}: ProfileScreenProps) {
  const { verification, discountType } = account;

  const handleDiscountChange = async (type: 'none' | 'student' | 'retired') => {
    if (type === discountType) return;

    const applyChange = async () => {
      try {
        const updated: Account = {
          ...account,
          discountType: type,
          verification: type === 'none'
            ? { ...account.verification, status: 'unverified', idPhotoUri: null, selfieUri: null, submittedAt: null }
            : account.verification,
        };
        const saved = await updateAccount(updated);
        onAccountUpdate(saved);
        if (type !== 'none') onOpenVerification(saved);
      } catch {
        Alert.alert('Error', 'Could not save changes. Please try again.');
      }
    };

    if (verification.status === 'approved') {
      Alert.alert(
        'Switch discount type?',
        'Switching discount type requires re-verification. Your verified status will be reset.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch & Re-verify', style: 'destructive',
            onPress: async () => {
              try {
                const updated: Account = {
                  ...account,
                  discountType: type,
                  verification: {
                    status: 'unverified', idPhotoUri: null, selfieUri: null, submittedAt: null,
                  },
                };
                const saved = await updateAccount(updated);
                onAccountUpdate(saved);
                if (type !== 'none') onOpenVerification(saved);
              } catch {
                Alert.alert('Error', 'Could not save changes. Please try again.');
              }
            },
          },
        ],
      );
    } else {
      await applyChange();
    }
  };

  const verificationBadge = () => {
    if (discountType === 'none') return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.muted }} />
        <Text style={{ color: theme.muted, fontSize: 14 }}>No discount selected</Text>
      </View>
    );
    const map = {
      unverified: { icon: '—', color: theme.muted, label: 'Not verified' },
      pending: { icon: '⏳', color: theme.amber, label: 'Pending verification' },
      approved: { icon: '✅', color: theme.green, label: 'Verified' },
      rejected: { icon: '❌', color: '#e05050', label: 'Rejected' },
    } as const;
    const { icon, color, label } = map[verification.status];
    return (
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
          <Text style={{ color, fontSize: 14, fontWeight: '600' }}>{label}</Text>
        </View>
        {(verification.status === 'pending' || verification.status === 'approved') &&
         verification.idPhotoUri && verification.selfieUri && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Image source={{ uri: verification.idPhotoUri }}
                style={{ width: 72, height: 54, borderRadius: 6 }} />
              <Text style={{ color: theme.muted, fontSize: 11 }}>ID Photo</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Image source={{ uri: verification.selfieUri }}
                style={{ width: 72, height: 54, borderRadius: 6 }} />
              <Text style={{ color: theme.muted, fontSize: 11 }}>Selfie</Text>
            </View>
          </View>
        )}
        {verification.status === 'rejected' && (
          <Pressable
            onPress={() => onOpenVerification(account)}
            style={({ pressed }) => ({
              paddingVertical: 9, paddingHorizontal: 16, borderRadius: 8,
              backgroundColor: theme.accent, alignSelf: 'flex-start',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Re-submit ID</Text>
          </Pressable>
        )}
        {verification.status === 'unverified' && (
          <Pressable
            onPress={() => onOpenVerification(account)}
            style={({ pressed }) => ({
              paddingVertical: 9, paddingHorizontal: 16, borderRadius: 8,
              backgroundColor: theme.accent, alignSelf: 'flex-start',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Start Verification →</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const divider = <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 20 }} />;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={{ backgroundColor: 'transparent' }}>
          <View style={{
            backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 24, paddingBottom: 40,
            borderWidth: 1, borderColor: theme.border,
            maxHeight: '90%',
          }}>
            <View style={{
              width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border,
              alignSelf: 'center', marginBottom: 20,
            }} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* ── Identity ── */}
              <SectionHeader title="Identity" theme={theme} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {account.avatarUri ? (
                  <Image source={{ uri: account.avatarUri }}
                    style={{ width: 60, height: 60, borderRadius: 30 }} />
                ) : (
                  <View style={{
                    width: 60, height: 60, borderRadius: 30,
                    backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 22 }}>
                      {account.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{account.name}</Text>
                  <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>{account.email}</Text>
                </View>
              </View>

              {divider}

              {/* ── Discount type ── */}
              <SectionHeader title="Discount Type" theme={theme} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['none', 'student', 'retired'] as const).map(type => {
                  const labels = { none: 'None', student: '🎓 Student', retired: '👴 Senior' };
                  const active = discountType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => handleDiscountChange(type)}
                      style={({ pressed }) => ({
                        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                        borderWidth: 1.5,
                        borderColor: active ? theme.accent : theme.border,
                        backgroundColor: active ? theme.accent + '15' : theme.surfaceAlt,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text style={{
                        color: active ? theme.accent : theme.muted,
                        fontWeight: '600', fontSize: 13,
                      }}>
                        {labels[type]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {divider}

              {/* ── Verification status ── */}
              <SectionHeader title="Verification Status" theme={theme} />
              {verificationBadge()}

              {divider}

              {/* ── Sign out ── */}
              <Pressable
                onPress={async () => { await onSignOut(); onClose(); }}
                style={({ pressed }) => ({
                  paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                  borderWidth: 1, borderColor: '#e05050',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: '#e05050', fontWeight: '600', fontSize: 15 }}>Sign Out</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── VERIFICATION MODAL ──────────────────────────────────────────────────────

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  account: Account;
  onAccountUpdate: (account: Account) => void;
  theme: Theme;
}

export function VerificationModal({
  visible, onClose, account, onAccountUpdate, theme,
}: VerificationModalProps) {
  // Step: 1=choose type, 2=ID photo, 3=selfie, 4=pending/result
  // If discountType is already set, start at step 2
  const [step, setStep] = useState<1 | 2 | 3 | 4>(
    account.discountType !== 'none' ? 2 : 1
  );
  const [localType, setLocalType] = useState<'student' | 'retired'>(
    account.discountType !== 'none' ? account.discountType as 'student' | 'retired' : 'student'
  );
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(
    account.verification.status === 'rejected' ? null : account.verification.idPhotoUri
  );
  const [selfieUri, setSelfieUri] = useState<string | null>(
    account.verification.status === 'rejected' ? null : account.verification.selfieUri
  );
  const [approved, setApproved] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const accountRef = useRef(account);
  useEffect(() => { accountRef.current = account; });

  const resetState = (acc: Account) => {
    setStep(acc.discountType !== 'none' ? 2 : 1);
    setLocalType(acc.discountType !== 'none' ? acc.discountType as 'student' | 'retired' : 'student');
    setIdPhotoUri(acc.verification.status === 'rejected' ? null : acc.verification.idPhotoUri);
    setSelfieUri(acc.verification.status === 'rejected' ? null : acc.verification.selfieUri);
    setApproved(false);
    setShowCamera(false);
  };

  const openSelfieCamera = async () => {
    if (!cameraPermission?.granted) {
      const perm = await requestCameraPermission();
      if (!perm.granted) {
        Alert.alert('Camera Permission', 'Camera access is required to take a selfie.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        setSelfieUri(photo.uri);
        setShowCamera(false);
      }
    } catch {
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  };

  const pickPhoto = async (type: 'id' | 'selfie') => {
    try {
      if (type === 'selfie') {
        await openSelfieCamera();
        return;
      }
      Alert.alert('Upload ID Photo', 'Choose source', [
        {
          text: '📷 Camera', onPress: async () => {
            try {
              const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
              if (!r.canceled) setIdPhotoUri(r.assets[0].uri);
            } catch { /* dismissed */ }
          },
        },
        {
          text: '🖼 Gallery', onPress: async () => {
            try {
              const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
              if (!r.canceled) setIdPhotoUri(r.assets[0].uri);
            } catch { /* dismissed */ }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch { /* dismissed */ }
  };

  const submitVerification = async () => {
    const effectiveType = account.discountType !== 'none'
      ? account.discountType as 'student' | 'retired'
      : localType;
    try {
      const updated: Account = {
        ...account,
        discountType: effectiveType,
        verification: {
          status: 'pending',
          idPhotoUri: idPhotoUri!,
          selfieUri: selfieUri!,
          submittedAt: Date.now(),
        },
      };
      const saved = await updateAccount(updated);
      onAccountUpdate(saved);
      setStep(4);

      // Simulate 3-second auto-approve
      setTimeout(async () => {
        try {
          const approvedAccount: Account = {
            ...saved,
            verification: { ...saved.verification, status: 'approved' },
          };
          const finalSaved = await updateAccount(approvedAccount);
          if (!mountedRef.current) return;
          onAccountUpdate(finalSaved);
          setApproved(true);
        } catch {
          if (!mountedRef.current) return;
          Alert.alert('Error', 'Verification update failed. Please try again.');
        }
      }, 3000);
    } catch {
      Alert.alert('Error', 'Could not submit verification. Please try again.');
    }
  };

  const typeLabel = localType === 'student' ? 'student card' : 'senior ID';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={() => resetState(accountRef.current)}
    >
      {showCamera ? (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" mirror={true} />
          <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
            <Pressable onPress={() => setShowCamera(false)} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>✕</Text>
            </Pressable>
            <Pressable onPress={takeSelfie} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' }} />
            </Pressable>
          </View>
          <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Take a selfie</Text>
          </View>
        </View>
      ) : (
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={{ backgroundColor: 'transparent' }}>
          <View style={{
            backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 24, paddingBottom: 48,
            borderWidth: 1, borderColor: theme.border,
          }}>
            <View style={{
              width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border,
              alignSelf: 'center', marginBottom: 24,
            }} />

          {/* Step 1 — Choose type */}
          {step === 1 && (
            <View style={{ gap: 16 }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
                Who qualifies for a discount?
              </Text>
              {(['student', 'retired'] as const).map(type => (
                <Pressable
                  key={type}
                  onPress={() => { setLocalType(type); setStep(2); }}
                  style={({ pressed }) => ({
                    padding: 18, borderRadius: 14,
                    borderWidth: 1.5, borderColor: theme.border,
                    backgroundColor: theme.surfaceAlt,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontSize: 28, marginBottom: 6, textAlign: 'center' }}>
                    {type === 'student' ? '🎓' : '👴'}
                  </Text>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
                    {type === 'student' ? 'Student' : 'Senior / Retired'}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                    {type === 'student'
                      ? 'Upload your student card to unlock the student discount'
                      : 'Upload your senior ID to unlock the retirement discount'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Step 2 — ID photo */}
          {step === 2 && (
            <View style={{ gap: 16 }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
                Upload your {typeLabel}
              </Text>
              {account.verification.status === 'rejected' && (
                <View style={{ backgroundColor: '#e0505018', borderRadius: 8, padding: 10 }}>
                  <Text style={{ color: '#e05050', fontSize: 13 }}>
                    Your previous submission was rejected. Please re-upload a clear photo of your ID.
                  </Text>
                </View>
              )}
              <Text style={{ color: theme.muted, fontSize: 14, textAlign: 'center' }}>
                Take a clear photo of your {typeLabel} showing your name and photo.
              </Text>
              {idPhotoUri ? (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <Image source={{ uri: idPhotoUri }}
                    style={{ width: 200, height: 130, borderRadius: 10 }} />
                  <Pressable
                    onPress={() => pickPhoto('id')}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
                      borderWidth: 1, borderColor: theme.border }}
                  >
                    <Text style={{ color: theme.muted, fontSize: 13 }}>Retake photo</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => pickPhoto('id')}
                  style={({ pressed }) => ({
                    padding: 20, borderRadius: 12,
                    borderWidth: 1.5, borderColor: theme.accent, borderStyle: 'dashed',
                    alignItems: 'center', opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🪪</Text>
                  <Text style={{ color: theme.accent, fontWeight: '600' }}>
                    📷 Camera  ·  🖼 Gallery
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>
                    Tap to choose
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => setStep(3)}
                disabled={!idPhotoUri}
                style={({ pressed }) => ({
                  paddingVertical: 13, borderRadius: 10, alignItems: 'center',
                  backgroundColor: theme.accent, opacity: !idPhotoUri ? 0.4 : pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Next →</Text>
              </Pressable>
            </View>
          )}

          {/* Step 3 — Selfie */}
          {step === 3 && (
            <View style={{ gap: 16 }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
                Now take a selfie
              </Text>
              <Text style={{ color: theme.muted, fontSize: 14, textAlign: 'center' }}>
                We'll match your face to the ID photo to confirm your identity.
              </Text>
              {selfieUri ? (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <Image source={{ uri: selfieUri }}
                    style={{ width: 160, height: 160, borderRadius: 80 }} />
                  <Pressable
                    onPress={() => pickPhoto('selfie')}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
                      borderWidth: 1, borderColor: theme.border }}
                  >
                    <Text style={{ color: theme.muted, fontSize: 13 }}>Retake selfie</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => pickPhoto('selfie')}
                  style={({ pressed }) => ({
                    padding: 20, borderRadius: 12,
                    borderWidth: 1.5, borderColor: theme.accent, borderStyle: 'dashed',
                    alignItems: 'center', opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🤳</Text>
                  <Text style={{ color: theme.accent, fontWeight: '600', fontSize: 15 }}>
                    Take Selfie
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={submitVerification}
                disabled={!selfieUri}
                style={({ pressed }) => ({
                  paddingVertical: 13, borderRadius: 10, alignItems: 'center',
                  backgroundColor: theme.accent, opacity: !selfieUri ? 0.4 : pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  Submit for Verification →
                </Text>
              </Pressable>
            </View>
          )}

          {/* Step 4 — Pending / Result */}
          {step === 4 && (
            <View style={{ gap: 16, alignItems: 'center' }}>
              {approved ? (
                <>
                  <Text style={{ fontSize: 48 }}>✅</Text>
                  <Text style={{ color: theme.green, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
                    Verified — discount activated!
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 14, textAlign: 'center' }}>
                    Your{' '}
                    {account.discountType === 'student' ? 'student' : 'senior'} discount is now
                    applied automatically when booking.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 48 }}>⏳</Text>
                  <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
                    Verifying your identity...
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 14, textAlign: 'center' }}>
                    This usually takes a few seconds.
                  </Text>
                </>
              )}
              {idPhotoUri && selfieUri && (
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Image source={{ uri: idPhotoUri }}
                      style={{ width: 100, height: 70, borderRadius: 8 }} />
                    <Text style={{ color: theme.muted, fontSize: 12 }}>ID Photo</Text>
                  </View>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Image source={{ uri: selfieUri }}
                      style={{ width: 70, height: 70, borderRadius: 35 }} />
                    <Text style={{ color: theme.muted, fontSize: 12 }}>Selfie</Text>
                  </View>
                </View>
              )}
              {approved && (
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => ({
                    paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10,
                    backgroundColor: theme.green, opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Done</Text>
                </Pressable>
              )}
            </View>
          )}
          </View>
        </Pressable>
      </Pressable>
      )}
    </Modal>
  );
}
