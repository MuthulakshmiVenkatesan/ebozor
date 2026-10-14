import toast from 'react-hot-toast'
import { addHelpMeBuyApi } from '@/utils/api'

export const HELP_BUY_SERVICE_OPTIONS = [
    { value: 'Car Inspection', label: 'Car Inspection' },
    { value: 'Car Financing', label: 'Car Financing' },
    { value: 'Bank Evaluation Certificate', label: 'Bank Evaluation Certificate' },
    { value: 'Car Insurance', label: 'Car Insurance' },
]

export const HELP_BUY_SERVICE_CERTIFICATE = 'Evaluation Certificate'
export const HELP_BUY_SERVICE_INSURANCE = 'Car Insurance'

export const parseHelpBuyApiPayload = (payload) => {
    if (typeof payload !== 'string') return payload || {}
    const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
    const scriptIndex = payload.indexOf('<script')
    const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : scriptIndex
    const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
    try {
        return JSON.parse(jsonText)
    } catch (error) {
        console.error('add-helpme-buy parse error:', error)
        return {}
    }
}

export const formatHelpBuyPhone = (countryCode, phone) => {
    const digits = String(phone || '').replace(/\s+/g, '')
    const code = String(countryCode || '').trim()
    if (!digits) return ''
    if (!code) return digits
    return `${code}${digits}`
}

export const submitHelpMeBuyForm = async (
    { name, email, phone_no, service_type, message },
    { onSuccess, successFallback, errorFallback } = {}
) => {
    const trimmedName = String(name || '').trim()
    const trimmedEmail = String(email || '').trim()
    const trimmedPhone = String(phone_no || '').trim()
    const trimmedService = String(service_type || '').trim()
    const trimmedMessage = String(message || '').trim()

    if (!trimmedName) {
        toast.error('Please enter your name.')
        return false
    }
    if (!trimmedEmail) {
        toast.error('Please enter your email.')
        return false
    }
    if (!trimmedPhone) {
        toast.error('Please enter your phone number.')
        return false
    }
    if (!trimmedService) {
        toast.error('Please select a service.')
        return false
    }
    if (!trimmedMessage) {
        toast.error('Please enter a message.')
        return false
    }

    try {
        const response = await addHelpMeBuyApi.addHelpMeBuy({
            name: trimmedName,
            email: trimmedEmail,
            phone_no: trimmedPhone,
            service_type: trimmedService,
            message: trimmedMessage,
        })
        const parsed = parseHelpBuyApiPayload(response?.data)
        if (parsed?.error === false) {
            toast.success(parsed?.message || successFallback || 'Request submitted successfully.')
            onSuccess?.()
            return true
        }
        toast.error(parsed?.message || errorFallback || 'Failed to submit request.')
        return false
    } catch (error) {
        console.error('add-helpme-buy error:', error)
        toast.error('Failed to submit request. Please try again.')
        return false
    }
}
