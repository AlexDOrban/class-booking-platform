import { useState } from 'react';
import {
  View, Text, Pressable, TextInput, Modal,
  KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Account, signIn, signUp } from './AuthStore';

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
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={handleClose}
      >
        <Pressable onPress={() => {}} style={{ backgroundColor: 'transparent' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 24, paddingBottom: 40,
              borderWidth: 1, borderColor: theme.border,
            }}>
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
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
