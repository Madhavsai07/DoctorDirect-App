import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Text } from 'react-native';
import { colors } from '../../theme';

export type IconName =
  | 'home'
  | 'doctors'
  | 'calendar'
  | 'clock'
  | 'dashboard'
  | 'profile'
  | 'search'
  | 'video'
  | 'star'
  | 'check'
  | 'chevron'
  | 'phone'
  | 'medical'
  | 'info';

export interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * AppIcon: Zero-dependency, pure React Native vector icon component.
 * Renders crisp, clean clinical glyphs and geometry at any scale.
 */
export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 20,
  color = colors.text.primary,
  style,
}) => {
  const baseStyle: ViewStyle = {
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  };
  const containerStyle: StyleProp<ViewStyle> = [baseStyle, style];

  switch (name) {
    case 'home':
      return (
        <View style={containerStyle}>
          {/* Roof */}
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.44,
              borderRightWidth: size * 0.44,
              borderBottomWidth: size * 0.38,
              borderStyle: 'solid',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
          {/* Base */}
          <View
            style={{
              width: size * 0.68,
              height: size * 0.44,
              borderWidth: 1.6,
              borderTopWidth: 0,
              borderColor: color,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              alignItems: 'center',
            }}
          >
            {/* Door */}
            <View
              style={{
                width: size * 0.22,
                height: size * 0.24,
                backgroundColor: color,
                position: 'absolute',
                bottom: 0,
                borderTopLeftRadius: 1,
                borderTopRightRadius: 1,
              }}
            />
          </View>
        </View>
      );

    case 'doctors':
    case 'medical':
      return (
        <View style={containerStyle}>
          {/* Medical Cross */}
          <View
            style={{
              position: 'absolute',
              width: size * 0.26,
              height: size * 0.78,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
          <View
            style={{
              position: 'absolute',
              height: size * 0.26,
              width: size * 0.78,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        </View>
      );

    case 'calendar':
      return (
        <View style={containerStyle}>
          <View
            style={{
              width: size * 0.82,
              height: size * 0.82,
              borderWidth: 1.6,
              borderColor: color,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {/* Calendar header stripe */}
            <View style={{ height: size * 0.24, backgroundColor: color }} />
            {/* Calendar grid dots */}
            <View style={{ flex: 1, padding: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
            </View>
          </View>
        </View>
      );

    case 'clock':
      return (
        <View style={containerStyle}>
          <View
            style={{
              width: size * 0.82,
              height: size * 0.82,
              borderRadius: (size * 0.82) / 2,
              borderWidth: 1.6,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Minute hand */}
            <View
              style={{
                position: 'absolute',
                width: 1.5,
                height: size * 0.26,
                backgroundColor: color,
                top: size * 0.12,
                borderRadius: 1,
              }}
            />
            {/* Hour hand */}
            <View
              style={{
                position: 'absolute',
                height: 1.5,
                width: size * 0.2,
                backgroundColor: color,
                left: size * 0.38,
                borderRadius: 1,
              }}
            />
          </View>
        </View>
      );

    case 'dashboard':
      return (
        <View style={containerStyle}>
          <View style={{ width: size * 0.78, height: size * 0.78, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: size * 0.34, height: size * 0.34, borderRadius: 2, borderWidth: 1.5, borderColor: color }} />
              <View style={{ width: size * 0.34, height: size * 0.34, borderRadius: 2, borderWidth: 1.5, borderColor: color }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: size * 0.34, height: size * 0.34, borderRadius: 2, borderWidth: 1.5, borderColor: color }} />
              <View style={{ width: size * 0.34, height: size * 0.34, borderRadius: 2, borderWidth: 1.5, borderColor: color }} />
            </View>
          </View>
        </View>
      );

    case 'profile':
      return (
        <View style={containerStyle}>
          {/* Head */}
          <View
            style={{
              width: size * 0.36,
              height: size * 0.36,
              borderRadius: (size * 0.36) / 2,
              borderWidth: 1.6,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: size * 0.72,
              height: size * 0.34,
              borderTopLeftRadius: size * 0.32,
              borderTopRightRadius: size * 0.32,
              borderWidth: 1.6,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      );

    case 'search':
      return (
        <View style={containerStyle}>
          <View
            style={{
              width: size * 0.58,
              height: size * 0.58,
              borderRadius: (size * 0.58) / 2,
              borderWidth: 1.6,
              borderColor: color,
              transform: [{ translateX: -size * 0.08 }, { translateY: -size * 0.08 }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: size * 0.32,
              height: 1.8,
              backgroundColor: color,
              borderRadius: 1,
              bottom: size * 0.14,
              right: size * 0.12,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'video':
      return (
        <View style={containerStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: size * 0.56,
                height: size * 0.44,
                borderRadius: 3,
                borderWidth: 1.6,
                borderColor: color,
              }}
            />
            <View
              style={{
                width: 0,
                height: 0,
                borderTopWidth: size * 0.16,
                borderBottomWidth: size * 0.16,
                borderRightWidth: size * 0.22,
                borderStyle: 'solid',
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderRightColor: color,
                transform: [{ rotate: '180deg' }],
                marginLeft: 1,
              }}
            />
          </View>
        </View>
      );

    case 'phone':
      return (
        <View style={containerStyle}>
          <Text style={{ fontSize: size * 0.8, color, lineHeight: size }}>📞</Text>
        </View>
      );

    case 'star':
      return (
        <View style={containerStyle}>
          <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>★</Text>
        </View>
      );

    case 'check':
      return (
        <View style={containerStyle}>
          <Text style={{ fontSize: size * 0.85, color, fontWeight: '700', lineHeight: size }}>✓</Text>
        </View>
      );

    case 'chevron':
      return (
        <View style={containerStyle}>
          <Text style={{ fontSize: size * 0.9, color, fontWeight: '600', lineHeight: size }}>›</Text>
        </View>
      );

    case 'info':
    default:
      return (
        <View style={containerStyle}>
          <View
            style={{
              width: size * 0.75,
              height: size * 0.75,
              borderRadius: (size * 0.75) / 2,
              borderWidth: 1.5,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: size * 0.45, fontWeight: '700', color, lineHeight: size * 0.55 }}>i</Text>
          </View>
        </View>
      );
  }
};
