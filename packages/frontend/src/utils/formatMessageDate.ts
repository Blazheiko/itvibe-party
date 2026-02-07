const formatMessageDate = (dateTime: string): string => {
  const date = new Date(dateTime)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  // Если сообщение сегодня
  if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
      })
  }

  // Если сообщение вчера
  if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
  }

  // Если сообщение на этой неделе
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (daysAgo < 7) {
      return `${daysAgo} days ago`
  }

    // Если старше недели, показываем день недели
    return date.toLocaleString('en-US', { weekday: 'long' })
}

export default formatMessageDate
