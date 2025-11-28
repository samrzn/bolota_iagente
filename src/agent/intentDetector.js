class IntentDetector {
  detect(message) {
    if (!message || typeof message !== 'string') return 'UNKNOWN';
    const text = message.toLowerCase();
    if (['sim'].includes(text.trim())) return 'CONFIRM';
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

module.exports = new IntentDetector();
