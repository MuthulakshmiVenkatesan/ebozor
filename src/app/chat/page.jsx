import Messages from "@/components/PagesComponent/Chat/Messages"
import { generateSeoSettingsMetadata } from '@/utils/seoSettingsMetadata'

export const generateMetadata = async () => {
    try {
        return await generateSeoSettingsMetadata('chat', {
            canonicalPath: '/chat',
            titleFallback: 'Messages',
        })
    } catch (error) {
        console.error('Chat generateMetadata:', error)
        return null
    }
}

const ChatPage = () => {
    return (
        <Messages />
    )
}

export default ChatPage
