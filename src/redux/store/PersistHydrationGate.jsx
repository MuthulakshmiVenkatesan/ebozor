'use client'

import { useEffect, useState } from 'react'
import { persistor } from '.'

/**
 * Delays rendering children until redux-persist has rehydrated from storage.
 * Avoids a flash of logged-out UI (and failed auth-gated fetches) on hard refresh / private windows.
 */
export default function PersistHydrationGate({ children }) {
    const [ready, setReady] = useState(() => {
        try {
            return Boolean(persistor.getState().bootstrapped)
        } catch {
            return false
        }
    })

    useEffect(() => {
        if (ready) return undefined
        const unsub = persistor.subscribe(() => {
            if (persistor.getState().bootstrapped) {
                setReady(true)
            }
        })
        if (persistor.getState().bootstrapped) {
            setReady(true)
        }
        return unsub
    }, [ready])

    if (!ready) return null
    return children
}
