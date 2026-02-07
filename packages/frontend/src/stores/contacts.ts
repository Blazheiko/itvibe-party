import { defineStore } from 'pinia'
import { ref } from 'vue'

// {
//     name: 'John Smith',
//     unreadCount: 2,
//     isActive: true,
//     isOnline: true,
//     lastMessage: 'Perfect, see you then!',
//     lastMessageTime: '10:30 AM',
// },

export interface Contact {
    id: number
    contactId: string
    name: string
    unreadCount?: number
    isActive?: boolean
    isOnline?: boolean
    avatar?: string
    lastMessage?: string
    lastMessageTime?: string
    lastMessageId?: string
    lastMessageAt?: string
    updatedAt: string
}

export const useContactsStore = defineStore('contacts', () => {
    const contacts = ref<Contact[]>([])
    const selectedContact = ref<Contact | null>(null)
    const isLoading = ref(false)

    function setActiveContact(activeContact: Contact) {
        console.log('setActiveContact', activeContact.contactId)
        contacts.value.forEach((contact) => {
            contact.isActive = false
        })
        selectedContact.value =
            contacts.value.find((contact) => contact.contactId === activeContact.contactId) || null
        if (selectedContact.value) {
            selectedContact.value.isActive = true
        }
    }

    function incrementUnreadCount(contactId: string) {
        console.log('incrementUnreadCount', contactId)
        contacts.value.forEach((contact) => {
            if (String(contact.contactId) === String(contactId)) {
                console.log('if incrementUnreadCount', contact.unreadCount)
                contact.unreadCount = (contact.unreadCount || 0) + 1
            }
        })
    }

    function resetUnreadCount(contactId: string) {
        contacts.value.forEach((contact) => {
            if (contact.contactId === contactId) {
                contact.unreadCount = 0
            }
        })
    }

    /**
     * Синхронизирует selectedContact с обновленным контактом из массива contacts
     * @param contactId - ID контакта для проверки и обновления
     */
    function syncSelectedContact(contactId: string) {
        if (!selectedContact.value) {
            return
        }

        const selectedContactId = String(selectedContact.value.contactId)
        const targetContactId = String(contactId)

        if (selectedContactId === targetContactId) {
            const updated = contacts.value.find(
                (contact) => String(contact.contactId) === targetContactId,
            )
            if (updated) {
                selectedContact.value = updated
            }
        }
    }

    function updateContact(updatedContact: Partial<Contact>) {
        contacts.value = contacts.value.map((contact) => {
            if (contact.contactId === updatedContact.contactId) {
                return {
                    ...contact,
                    ...updatedContact,
                }
            }
            return contact
        })
        // Обновляем selectedContact, если обновляемый контакт является выбранным
        if (updatedContact.contactId) {
            syncSelectedContact(updatedContact.contactId)
        }
    }

    function updateContactById(contactId: string, updatedContact: Partial<Contact>) {
        console.log('updateContactById', contactId)
        contacts.value = contacts.value.map((contact) => {
            if (String(contactId) === String(contact.contactId)) {
                return {
                    ...contact,
                    ...updatedContact,
                }
            }
            return contact
        })
        // Обновляем selectedContact, если обновляемый контакт является выбранным
        syncSelectedContact(contactId)
    }

    function deleteContact(id: number) {
        const deletedContact = contacts.value.find((contact) => contact.id === id)
        contacts.value = contacts.value.filter((contact) => contact.id !== id)
        // Очищаем selectedContact, если удаляемый контакт был выбран
        if (selectedContact.value && deletedContact && selectedContact.value.id === id) {
            selectedContact.value = null
        }
    }

    function setContactList(contactList: Contact[]) {
        const previousSelectedContactId = selectedContact.value?.contactId
        contacts.value = contactList
        // Восстанавливаем selectedContact, если он был выбран ранее
        if (previousSelectedContactId) {
            const found = contactList.find(
                (contact) => contact.contactId === previousSelectedContactId,
            )
            if (found) {
                selectedContact.value = found
            } else {
                selectedContact.value = null
            }
        }
    }

    function setLoading(loading: boolean) {
        isLoading.value = loading
    }

    function addContact(contact: Contact) {
        contacts.value.unshift(contact)
    }

    function resetContacts() {
        contacts.value = []
        selectedContact.value = null
    }

    function getContactById(contactId: string): Contact | undefined {
        return contacts.value.find((contact) => String(contact.contactId) === String(contactId))
    }

    return {
        contacts,
        selectedContact,
        isLoading,
        setActiveContact,
        setContactList,
        setLoading,
        updateContact,
        deleteContact,
        addContact,
        resetContacts,
        incrementUnreadCount,
        resetUnreadCount,
        updateContactById,
        getContactById,
    }
})
