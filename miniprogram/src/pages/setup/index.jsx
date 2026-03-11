import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import useGameStore from '@/stores/gameStore'
import './index.scss'

const Setup = () => {
  return (
    <View className="setup-container">
      <View>Setup 页面</View>
    </View>
  )
}

export default Setup
