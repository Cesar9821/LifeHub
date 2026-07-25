'use client'

import { useState } from 'react'
import { DestinationType } from '@/types/finance'

export const useTransactionForm = () => {
  const [destination, setDestination] = useState<DestinationType>('normal')
  const [isLoading, setIsLoading] = useState(false)

  return {
    destination,
    setDestination,
    isLoading,
    setIsLoading
  }
}