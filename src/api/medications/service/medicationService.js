export class MedicationService {
  /**
   * @param {MedicationRepository} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  async find(query) {
    const byCode = await this.repository.findByCode(query);
    if (byCode) return this._format(byCode);

    const results = await this.repository.searchByText(query);
    return results.length ? this._format(results[0]) : null;
  }

  _format(doc) {
    return {
      code: doc.code,
      description: doc.description,
      price: doc.price,
      stock: doc.stock,
      status: doc.stock > 0 ? 'available' : 'out_of_stock'
    };
  }
}
