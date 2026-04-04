import React, { useState, useRef } from 'react';
import {
  View, Text, Pressable, Modal, Animated,
  StyleSheet,
} from 'react-native';

interface Option {
  label: string;
  value: string;
}

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  border: string;
  surfaceAlt: string;
  surface: string;
  text: string;
  muted: string;
}

export default function CustomDropdown({
  value, options, onChange, border, surfaceAlt, surface, text, muted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0 });
  const triggerRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    triggerRef.current?.measure((_x, _y, width, _height, pageX, pageY) => {
      setLayout({ x: pageX, y: pageY + _height + 4, width });
      setOpen(true);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 120, useNativeDriver: true,
      }).start();
    });
  };

  const closeMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 100, useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  const select = (v: string) => {
    onChange(v);
    closeMenu();
  };

  const currentLabel = options.find(o => o.value === value)?.label ?? value;

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={open ? closeMenu : openMenu}
        style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12, paddingVertical: 8,
          borderRadius: 8, borderWidth: 1, borderColor: border,
          backgroundColor: surfaceAlt,
        }}
      >
        <Text style={{ color: text, fontSize: 13 }}>{currentLabel}</Text>
        <Text style={{ color: muted, fontSize: 11, marginLeft: 6 }}>
          {open ? '▴' : '▾'}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeMenu}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeMenu} />
        <Animated.View style={{
          position: 'absolute',
          top: layout.y,
          left: layout.x,
          width: layout.width,
          backgroundColor: surface,
          borderRadius: 8, borderWidth: 1, borderColor: border,
          opacity: fadeAnim,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 9999,
        }}>
          {options.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => select(opt.value)}
              style={({ pressed }) => ({
                paddingHorizontal: 12, paddingVertical: 10,
                backgroundColor: pressed ? surfaceAlt : 'transparent',
              })}
            >
              <Text style={{
                color: opt.value === value ? '#7c5cbf' : text,
                fontSize: 13,
                fontWeight: opt.value === value ? '600' : '400',
              }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </Modal>
    </>
  );
}
