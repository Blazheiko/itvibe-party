# Easy Chat - Application Features

## Overview

Easy Chat is a modern messaging web app built with Vue 3, TypeScript, and Pinia. It supports both light and dark themes and is optimized for mobile devices.

## Key Features

### 1. Contact Management

- **Contact list**

    - Display all contacts
    - Sort contacts (active contact always on top)
    - Search contacts by name
    - Show online/offline status
    - Show contact initials in the avatar
    - Unread message count

- **Contact actions**
    - Edit contact name via context menu
    - Delete contact via context menu
    - Select an active contact for chat

### 2. Chat

- **Sending messages**

    - Send text messages
    - Support for multiline messages (Shift + Enter)
    - Message send status indicator
    - Auto-scroll to the latest message

- **Message management**
    - Edit messages via context menu
    - Delete messages via context menu
    - Show message timestamps
    - Group messages by date

### 3. News

- **News feed**
    - Show news list
    - Unread news counter
    - Switch between chat and news
    - Auto-update read status

### 4. Interface

- **Responsive design**

    - Mobile device support
    - Responsive layout for various screen sizes
    - Hide/show contact list on mobile

- **Themes**
    - Light theme
    - Dark theme
    - Automatic theme switching
    - Smooth transition animations

### 5. State Management

- **Data storage**
    - Pinia for state management
    - Store contacts
    - Store messages
    - Store news

### 6. Animations and Effects

- **Visual effects**
    - Animations when adding/removing contacts
    - Animations when sending messages
    - Smooth transitions between states
    - Hover and click effects

## Technical Details

### 1. Components

- `ContactsList.vue` - contacts list
- `ChatArea.vue` - chat area
- `Notes.vue` - notes
- `MessageInput.vue` - message input

### 2. Store (Pinia)

- `contacts.ts` - contacts management
- `messages.ts` - messages management
- `news.ts` - news management

### 3. Data Types

- `Contact` - contact interface
- `Message` - message interface
- `News` - news interface

### 4. Styling

- CSS variables for themes
- Responsive styles with media queries
- Dark theme support
- Animations and transitions

## App Controls

### 1. Hotkeys

- `Enter` - send message
- `Shift + Enter` - new line in message
- `Esc` - cancel editing/close menu

### 2. Context Menus

- Right-click on a contact:
    - Edit
    - Delete
- Right-click on a message:
    - Edit
    - Delete

### 3. Mobile Version

- Swipe to open/close the contact list
- Responsive display of UI elements
- Optimized navigation
