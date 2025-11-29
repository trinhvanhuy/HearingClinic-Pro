import React from 'react'
import { Image, ImageStyle, StyleSheet, View, Text } from 'react-native'

interface LogoProps {
  variant?: 'full' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  style?: ImageStyle
}

// Try to load logo images, fallback to placeholder if not found
let logoLight: any = null
let logoIcon: any = null

try {
  logoLight = require('../../assets/logo-light.png')
} catch (e) {
  // Logo not found, will use fallback
}

try {
  logoIcon = require('../../assets/logo-icon.png')
} catch (e) {
  // Logo not found, will use fallback
}

export default function Logo({ variant = 'full', size = 'md', style }: LogoProps) {
  const sizeStyles = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
  }

  // Fallback component
  const FallbackLogo = () => (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={{ width: 32, height: 32, backgroundColor: '#3b82f6', borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>+</Text>
        </View>
        <View style={{ width: 32, height: 32, backgroundColor: '#f97316', borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>+</Text>
        </View>
      </View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Hearing Clinic</Text>
    </View>
  )

  if (variant === 'icon') {
    if (!logoIcon) {
      return (
        <View style={[sizeStyles[size], { backgroundColor: '#ef4444', borderRadius: 4, justifyContent: 'center', alignItems: 'center' }, style]}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>+</Text>
        </View>
      )
    }
    return (
      <Image
        source={logoIcon}
        style={[sizeStyles[size], style]}
        resizeMode="contain"
      />
    )
  }

  if (!logoLight) {
    return <FallbackLogo />
  }

  return (
    <Image
      source={logoLight}
      style={[{ width: 200, height: 60 }, style]}
      resizeMode="contain"
    />
  )
}

