class IntentDetector {
  detect(message) {
    if (!message || typeof message !== 'string') return 'UNKNOWN';
    const text = message.toLowerCase().trim();
    if (text === 'sim') return 'CONFIRM';
    if (/(preço|estoque|quanto)/i.test(text)) return 'CHECK_AVAILABILITY';
    if (
      /(amoxi|amoxicilina|antibiótico|vacina|antipulgas|bravecto|dipirona)/i.test(
        text
      )
    )
      return 'MEDICINE_INFO';
    return 'UNKNOWN';
  }
}

export default new IntentDetector();
