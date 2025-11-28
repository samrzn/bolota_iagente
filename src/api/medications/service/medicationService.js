class MedicationService {
  /**
   * @param {MedicationRepository} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  async find(query) {
    if (!query || typeof query !== 'string') return [];

    const codeMatch = await this.repository.findByCode(query);
    if (codeMatch) return [this._toDto(codeMatch)];

    const results = await this.repository.searchByText(query);
    return results.map(this._toDto);
  }

  _toDto(doc) {
    return {
      code: doc.code,
      description: doc.description,
      price: doc.price,
      stock: doc.stock
    };
  }
}

module.exports = MedicationService;
